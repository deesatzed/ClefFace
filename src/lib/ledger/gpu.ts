import { EMBED_DIM } from "../../../cloudflare/src/ledger/embed.ts";

const COMPUTE = 4;
const STORAGE = 0x80;
const COPY_SRC = 0x4;
const COPY_DST = 0x8;
const MAP_READ = 0x1;

const SHADER = `
@group(0) @binding(0) var<storage, read> docs: array<f32>;
@group(0) @binding(1) var<storage, read> query: array<f32>;
@group(0) @binding(2) var<storage, read_write> scores: array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let row = id.x;
  if (row >= arrayLength(&scores)) { return; }
  var sum = 0.0;
  let dim = ${EMBED_DIM}u;
  for (var k = 0u; k < dim; k = k + 1u) {
    sum = sum + docs[row * dim + k] * query[k];
  }
  scores[row] = sum;
}
`;

interface GpuBuffer {
  destroy?: () => void;
}

interface GpuDevice {
  createShaderModule(descriptor: { code: string }): object;
  createBindGroupLayout(descriptor: object): object;
  createPipelineLayout(descriptor: object): object;
  createComputePipeline(descriptor: object): object;
  createBuffer(descriptor: { size: number; usage: number }): GpuBuffer;
  createBindGroup(descriptor: object): object;
  createCommandEncoder(): {
    beginComputePass(): {
      setPipeline(pipeline: object): void;
      setBindGroup(index: number, bindGroup: object): void;
      dispatchWorkgroups(count: number): void;
      end(): void;
    };
    copyBufferToBuffer(source: GpuBuffer, sourceOffset: number, destination: GpuBuffer, destinationOffset: number, size: number): void;
    finish(): object;
  };
  queue: {
    writeBuffer(buffer: GpuBuffer, offset: number, data: Float32Array): void;
    submit(commands: object[]): void;
  };
  destroy(): void;
}

interface GpuAdapter {
  requestDevice(): Promise<GpuDevice>;
}

function gpuApi(): { requestAdapter(): Promise<GpuAdapter | null> } | null {
  const nav = navigator as Navigator & { gpu?: { requestAdapter(): Promise<GpuAdapter | null> } };
  return nav.gpu ?? null;
}

export async function webGpuAvailable(): Promise<boolean> {
  const gpu = gpuApi();
  if (!gpu) return false;
  try {
    const adapter = await gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/** Dot-product rerank. Vectors must already be L2-normalized and length count * EMBED_DIM. */
export async function rankOnGpu(docs: Float32Array, query: Float32Array, count: number): Promise<Float32Array> {
  const gpu = gpuApi();
  if (!gpu) throw new Error("webgpu_unavailable");
  const adapter = await gpu.requestAdapter();
  if (!adapter) throw new Error("webgpu_unavailable");
  const device = await adapter.requestDevice();
  try {
    const module = device.createShaderModule({ code: SHADER });
    const layout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: COMPUTE, buffer: { type: "read-only-storage" } },
        { binding: 1, visibility: COMPUTE, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: COMPUTE, buffer: { type: "storage" } },
      ],
    });
    const pipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      compute: { module, entryPoint: "main" },
    });
    const docBuffer = device.createBuffer({ size: docs.byteLength, usage: STORAGE | COPY_DST });
    const queryBuffer = device.createBuffer({ size: Math.max(4, query.byteLength), usage: STORAGE | COPY_DST });
    const scoreBytes = Math.max(4, count * 4);
    const scoreBuffer = device.createBuffer({ size: scoreBytes, usage: STORAGE | COPY_SRC });
    const readBuffer = device.createBuffer({ size: scoreBytes, usage: COPY_DST | MAP_READ }) as GpuBuffer & {
      mapAsync(mode: number): Promise<void>;
      getMappedRange(): ArrayBuffer;
      unmap(): void;
    };
    device.queue.writeBuffer(docBuffer, 0, docs);
    device.queue.writeBuffer(queryBuffer, 0, query);
    const group = device.createBindGroup({
      layout,
      entries: [
        { binding: 0, resource: { buffer: docBuffer } },
        { binding: 1, resource: { buffer: queryBuffer } },
        { binding: 2, resource: { buffer: scoreBuffer } },
      ],
    });
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, group);
    pass.dispatchWorkgroups(Math.ceil(count / 64));
    pass.end();
    encoder.copyBufferToBuffer(scoreBuffer, 0, readBuffer, 0, scoreBytes);
    device.queue.submit([encoder.finish()]);
    await readBuffer.mapAsync(MAP_READ);
    const mapped = readBuffer.getMappedRange();
    const copy = new Float32Array(mapped.byteLength / 4);
    copy.set(new Float32Array(mapped));
    readBuffer.unmap();
    return copy.slice(0, count);
  } finally {
    device.destroy();
  }
}
