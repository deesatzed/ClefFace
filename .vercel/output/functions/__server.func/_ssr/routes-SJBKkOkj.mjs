import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as embedText, i as hitKey, n as projectLedger, o as extractDocument, r as answerQuestion, s as CONFIDENCE_THRESHOLD } from "./router-DQNFQt75.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-SJBKkOkj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Schema authoring note.
* Written once. Grok is the planner and does not re-classify each sentence.
* The Decision Worker sends this object to Clef on every unit.
* Clef has no free-text answers. Evidence quotes come from the segmenter.
*
* Assumption (2026-10-02): Clef question types are noul, choice, and score.
* This schema uses only noul (yes-probability; there is no separate boolean
* type) and choice. Score is intentionally unused.
*/
var CLEF_QUESTIONS = {
	boilerplate: {
		type: "noul",
		instructions: "Is `text` only a heading, running header, page number, or other non-claim that asserts nothing?"
	},
	deterministic: {
		type: "noul",
		instructions: "Does `text` state the claim as a fact, with no hedge such as may, might, could, likely, or suggests?"
	},
	quantity_present: {
		type: "noul",
		instructions: "Does `text` contain a number, count, percent, or clock time?"
	},
	definition_present: {
		type: "noul",
		instructions: "Does `text` define a term with 'defined as', 'means', or 'refers to'?"
	},
	decision_point: {
		type: "noul",
		instructions: "Does `text` mark an explicit decision, such as if, whether, otherwise, or decide?"
	},
	fully_specified: {
		type: "noul",
		instructions: "Does `text` name the actor and either an input or an output of this step? Answer no if either is missing."
	},
	external_check: {
		type: "noul",
		instructions: "Does `text` rely on a citation, guideline, or outside source that is not contained in `text`?"
	},
	polarity: {
		type: "choice",
		instructions: "What polarity does `text` assert? If it both negates and states a condition, choose conditional. If you cannot tell, choose unclear.",
		criteria: {
			affirmed: "The sentence asserts the claim.",
			denied: "The sentence asserts that the claim is not the case.",
			conditional: "The claim depends on an explicit if, unless, or when.",
			unclear: "The sentence does not show which of the above applies."
		}
	},
	record_kind: {
		type: "choice",
		instructions: "What kind of record is `text`? Choose one. Do not summarize. Judge only `text`.",
		criteria: {
			fact: "A checkable claim stated as fact, not a definition, step, or hedged reading.",
			theory: "A hypothesis, model, interpretation, prediction, or hedged causal reading.",
			concept: "A named term being defined.",
			workflow_step: "An ordered action, trigger, or decision in a described procedure.",
			none: "No claim, definition, or step."
		}
	},
	theory_status: {
		type: "choice",
		instructions: "If `text` is a theory, which status fits? Otherwise choose not_applicable.",
		criteria: {
			hypothesis: "Hedged with may, might, could, or named as a hypothesis.",
			model: "Named as a model or framework.",
			interpretation: "A reading of evidence, including 'according to' or 'interpretation'.",
			prediction: "A forecast about a future outcome.",
			not_applicable: "Text is not a theory."
		}
	},
	causal: {
		type: "choice",
		instructions: "Does `text` state a cause, using because, causes, leads to, results in, or due to? Choose unclear only if the causal direction is stated and cannot be read.",
		criteria: {
			yes: "An explicit causal connective is present.",
			no: "No causal connective is present.",
			unclear: "Causal language is present but the direction cannot be read."
		}
	},
	falsifiable: {
		type: "choice",
		instructions: "If `text` is a theory, can it be falsified from what `text` itself says? Choose unclear unless the sentence states a measurement or says it cannot be tested. Do not use outside knowledge.",
		criteria: {
			yes: "The sentence states a measurement, threshold, or other explicit test.",
			no: "The sentence says the claim cannot be tested.",
			unclear: "The sentence does not say how the claim would be tested."
		}
	},
	time_scope: {
		type: "choice",
		instructions: "What time does the main claim in `text` sit in? Choose unspecified if cues conflict or are absent. 'Shall' as a standing rule is present, not future.",
		criteria: {
			past: "The main verb is past or the sentence reports a completed event.",
			present: "The sentence states a current fact or a standing rule.",
			future: "The sentence uses will or an explicit future forecast.",
			unspecified: "No single time scope is shown."
		}
	},
	concept_type: {
		type: "choice",
		instructions: "If `text` defines a term, what type is that term? Otherwise choose not_applicable.",
		criteria: {
			entity: "A named organization, place, person, or product.",
			process: "A procedure, protocol, callback, or pipeline.",
			metric: "A score, rate, count, threshold, or index.",
			role: "A person-role such as nurse, physician, or operator.",
			tool: "A system, database, or software tool.",
			other: "A defined term that is none of the above.",
			not_applicable: "Text does not define a term."
		}
	}
};
function buildClefRequest(unit, neighbors, model = "clef-flash") {
	return {
		model,
		state: {
			section: unit.section_path,
			unit_id: unit.id,
			text: unit.text,
			before: clip(neighbors.before ?? ""),
			after: clip(neighbors.after ?? "")
		},
		questions: CLEF_QUESTIONS
	};
}
function clip(text) {
	const clean = text.trim();
	if (clean.length <= 180) return clean;
	const slice = clean.slice(0, 180);
	const sp = slice.lastIndexOf(" ");
	return sp > 80 ? slice.slice(0, sp) : slice;
}
/** Sample operational note. It is a fixture, not a clinical protocol. */
var SAMPLE_DOCUMENT = `# Ward callback drill

## Definitions

A deterioration callback is defined as a phone call from the ward nurse to the covering physician within 15 minutes of a trigger score.

Trigger score means the sum of three bedside checks: respiration, systolic pressure, and consciousness.

## Standing facts

The ward logged 42 callbacks in March 2026.
The covering physician is on site from 07:00 until 19:00.
The night service does not staff a physician inside the building.
Callbacks are not optional when the trigger score is 5 or higher.

## Interpretation

The night gap may delay antibiotics.
A higher trigger score leads to faster physician arrival, according to the March log.
This reading is an interpretation of the log, not a controlled trial.

## Procedure

When a bedside check reaches a trigger score of 5 or more, the ward nurse starts the callback.

1. The ward nurse records the three checks on the callback card.
2. The ward nurse calls the covering physician and states the trigger score.
3. If the physician does not answer, the ward nurse calls the night supervisor.
4. The physician states a bedside order or states that they are coming in.
5. The ward nurse writes the order time on the callback card.

## Conflict

The night service does not staff a physician inside the building.
However, the March log states that a physician arrived in person for 11 night callbacks.
`;
/** Page-local tool target. WebMCP reads this at call time. */
var ledgerBridge = { views: [] };
var registered = false;
async function registerLedgerTools() {
	if (registered || typeof document === "undefined") return registered ? "webmcp" : "unavailable";
	const host = modelContext();
	if (!host) return "unavailable";
	try {
		await host.registerTool({
			name: "quote_ledger",
			description: "Answer from the accepted Clef ledger open in this page. Quote hits only. If stance is unspecified, the document does not say. If stance is conflict, report both records. Do not use held rows.",
			inputSchema: {
				type: "object",
				properties: { query: {
					type: "string",
					description: "Question about the ingested document"
				} },
				required: ["query"]
			},
			annotations: { readOnlyHint: true },
			execute: async ({ query }) => {
				const asked = query?.trim() ?? "";
				if (!asked) return { error: "query is required" };
				return answerQuestion(asked, ledgerBridge.views);
			}
		});
		registered = true;
		return "webmcp";
	} catch {
		return "unavailable";
	}
}
function modelContext() {
	const doc = document;
	const nav = navigator;
	const host = doc.modelContext ?? nav.modelContext;
	if (!host || typeof host.registerTool !== "function") return null;
	return host;
}
var COMPUTE = 4;
var MAP_READ = 1;
var SHADER = `
@group(0) @binding(0) var<storage, read> docs: array<f32>;
@group(0) @binding(1) var<storage, read> query: array<f32>;
@group(0) @binding(2) var<storage, read_write> scores: array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let row = id.x;
  if (row >= arrayLength(&scores)) { return; }
  var sum = 0.0;
  let dim = 64u;
  for (var k = 0u; k < dim; k = k + 1u) {
    sum = sum + docs[row * dim + k] * query[k];
  }
  scores[row] = sum;
}
`;
function gpuApi() {
	return navigator.gpu ?? null;
}
async function webGpuAvailable() {
	const gpu = gpuApi();
	if (!gpu) return false;
	try {
		return await gpu.requestAdapter() !== null;
	} catch {
		return false;
	}
}
/** Dot-product rerank. Vectors must already be L2-normalized and length count * EMBED_DIM. */
async function rankOnGpu(docs, query, count) {
	const gpu = gpuApi();
	if (!gpu) throw new Error("webgpu_unavailable");
	const adapter = await gpu.requestAdapter();
	if (!adapter) throw new Error("webgpu_unavailable");
	const device = await adapter.requestDevice();
	try {
		const module = device.createShaderModule({ code: SHADER });
		const layout = device.createBindGroupLayout({ entries: [
			{
				binding: 0,
				visibility: COMPUTE,
				buffer: { type: "read-only-storage" }
			},
			{
				binding: 1,
				visibility: COMPUTE,
				buffer: { type: "read-only-storage" }
			},
			{
				binding: 2,
				visibility: COMPUTE,
				buffer: { type: "storage" }
			}
		] });
		const pipeline = device.createComputePipeline({
			layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
			compute: {
				module,
				entryPoint: "main"
			}
		});
		const docBuffer = device.createBuffer({
			size: docs.byteLength,
			usage: 136
		});
		const queryBuffer = device.createBuffer({
			size: Math.max(4, query.byteLength),
			usage: 136
		});
		const scoreBytes = Math.max(4, count * 4);
		const scoreBuffer = device.createBuffer({
			size: scoreBytes,
			usage: 132
		});
		const readBuffer = device.createBuffer({
			size: scoreBytes,
			usage: 9
		});
		device.queue.writeBuffer(docBuffer, 0, docs);
		device.queue.writeBuffer(queryBuffer, 0, query);
		const group = device.createBindGroup({
			layout,
			entries: [
				{
					binding: 0,
					resource: { buffer: docBuffer }
				},
				{
					binding: 1,
					resource: { buffer: queryBuffer }
				},
				{
					binding: 2,
					resource: { buffer: scoreBuffer }
				}
			]
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
var stamp$1 = "min-h-11 bg-stamp px-4 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50";
var ghost$1 = "min-h-11 border border-line bg-card px-4 text-sm font-medium text-ink hover:border-stamp disabled:opacity-50";
var PROMPTS = [
	"What is a deterioration callback?",
	"Is a physician inside the building at night?",
	"Which antibiotic should be started for a night delay?"
];
function Ask({ job, versions }) {
	const [question, setQuestion] = (0, import_react.useState)("");
	const [scope, setScope] = (0, import_react.useState)("current");
	const [answer, setAnswer] = (0, import_react.useState)(null);
	const [gpu, setGpu] = (0, import_react.useState)("idle");
	const [gpuKey, setGpuKey] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)(false);
	const views = (0, import_react.useMemo)(() => viewsFor(job, versions, scope), [
		job,
		versions,
		scope
	]);
	const fingerprint = views.map((view) => view.version_id).join(",");
	(0, import_react.useEffect)(() => {
		ledgerBridge.views = views;
	}, [views]);
	(0, import_react.useEffect)(() => {
		setGpu("idle");
		setGpuKey("");
	}, [fingerprint]);
	async function ask(next = question) {
		const trimmed = next.trim();
		setQuestion(next);
		if (!trimmed) {
			setAnswer(answerQuestion("", views));
			return;
		}
		let scores = null;
		if (gpu === "ready" && gpuKey === fingerprint) scores = await scoreViews(views, trimmed);
		setAnswer(answerQuestion(trimmed, views, scores));
	}
	async function indexOnDevice() {
		setGpu("working");
		if (!await webGpuAvailable()) {
			setGpu("unsupported");
			return;
		}
		try {
			const packed = pack(views);
			if (packed.count === 0) {
				setGpu("failed");
				return;
			}
			await rankOnGpu(packed.docs, embedText("ledger"), packed.count);
			setGpuKey(fingerprint);
			setGpu("ready");
		} catch {
			setGpu("failed");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-line bg-card p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl text-ink",
						children: "Ask the ledger"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "A reply is accepted quotes, or a refusal. Held rows stay out. Nothing here writes a new clinical fact."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-4 space-y-3",
						onSubmit: (event) => {
							event.preventDefault();
							ask();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm text-muted",
							children: ["Question", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: question,
								onChange: (event) => setQuestion(event.target.value),
								"aria-label": "Question for the ledger",
								className: "mt-1 h-24 w-full resize-y border border-line bg-paper p-3 text-sm text-ink"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: stamp$1,
								children: "Ask the ledger"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: ghost$1,
								onClick: () => void indexOnDevice(),
								disabled: gpu === "working",
								children: gpu === "working" ? "Indexing" : "Rank on this device"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: PROMPTS.map((prompt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `${ghost$1} max-w-full text-left`,
							onClick: () => void ask(prompt),
							children: prompt
						}, prompt))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-muted",
						children: gpuLabel(gpu)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
				className: "border border-line bg-card p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
						className: "px-1 text-sm text-muted",
						children: "Versions on this device"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: scope === "current" ? stamp$1 : ghost$1,
							onClick: () => setScope("current"),
							children: "This extract"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: scope === "saved" ? stamp$1 : ghost$1,
							onClick: () => setScope("saved"),
							children: "Every saved version"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: versions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-sm text-muted",
							children: "This extract is kept in the page. A second paste becomes the next version."
						}) : versions.map((version, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "font-mono text-xs text-ink",
							children: [
								"v",
								index + 1,
								" ",
								version.title,
								" · ",
								version.status === "complete" ? "gate closed" : "gate held",
								" ·",
								" ",
								version.review_count,
								" held",
								version.parent_version_id ? " · follows a prior version" : ""
							]
						}, version.version_id))
					})
				]
			}),
			answer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnswerCard, { answer }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-line bg-card p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg text-ink",
						children: "Connect a chatbot"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Streamable HTTP MCP at ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-ink",
								children: "/api/mcp"
							}),
							". Tools are list_versions, job_status, lookup, quote_answer, and ingest_document. quote_answer is the same refusal rules as this panel. Chrome WebMCP, when the browser exposes it, registers quote_ledger on this page. Do not send patient identifiers."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${ghost$1} mt-3`,
						onClick: () => {
							const body = JSON.stringify({ mcpServers: { "clef-ledger": { url: `${window.location.origin}/api/mcp` } } }, null, 2);
							navigator.clipboard?.writeText(body);
							setCopied(true);
						},
						children: copied ? "Copied" : "Copy MCP config"
					})
				]
			})
		]
	});
}
function AnswerCard({ answer }) {
	const tone = answer.stance === "conflict" ? "border-l-review" : answer.stance === "grounded" ? "border-l-stamp" : "border-l-line";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `border border-line border-l-2 ${tone} bg-card p-4`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-mono text-xs uppercase text-muted",
				children: [
					answer.stance,
					" · gate ",
					answer.gate,
					" · ",
					answer.scorer === "webgpu" ? "re-ranked on WebGPU" : "matched by words"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink",
				children: answer.text
			}),
			answer.hits.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-3",
				children: answer.hits.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-xs text-muted",
					children: [
						hit.record_id,
						" · ",
						hit.kind,
						" · ",
						hit.label
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", {
					className: "mt-1 border-l-2 border-line pl-3 font-mono text-sm text-ink",
					children: hit.quote
				})] }, `${hit.version_id}-${hit.record_id}`))
			}) : null
		]
	});
}
function viewsFor(job, versions, scope) {
	if (scope === "current") return [projectJob(job)];
	const saved = versions.map((version) => projectJob(version.job));
	if (!saved.some((view) => view.version_id === job.id)) saved.push(projectJob(job));
	return saved;
}
function projectJob(job) {
	return projectLedger({
		id: job.id,
		status: job.status,
		engine: job.engine,
		title: job.chunks[0]?.heading || "Document",
		review_count: job.review.length,
		output: job.output
	});
}
function gpuLabel(gpu) {
	if (gpu === "ready") return "WebGPU index is ready. The next question reranks overlapping quotes on this device. It cannot add a record the words do not already support.";
	if (gpu === "unsupported") return "WebGPU is not available here. Word match still answers.";
	if (gpu === "failed") return "The on-device index did not start. Word match still answers.";
	if (gpu === "working") return "Building the on-device index.";
	return "Word match is the default. Rank on this device only reorders quotes that already overlap the question.";
}
async function scoreViews(views, query) {
	const packed = pack(views);
	if (packed.count === 0) return null;
	try {
		const dots = await rankOnGpu(packed.docs, embedText(query), packed.count);
		const scores = /* @__PURE__ */ new Map();
		packed.keys.forEach((key, index) => scores.set(key, dots[index] ?? 0));
		return scores;
	} catch {
		return null;
	}
}
function pack(views) {
	const records = views.flatMap((view) => view.records.map((record) => ({
		key: hitKey(view.version_id, record.record_id),
		vector: embedText(`${record.text} ${record.quote}`)
	})));
	const docs = new Float32Array(records.length * 64);
	records.forEach((record, index) => docs.set(record.vector, index * 64));
	return {
		docs,
		keys: records.map((record) => record.key),
		count: records.length
	};
}
var STARTER_FILES = [
	{
		path: "cloudflare/wrangler.jsonc",
		body: "{\n  \"$schema\": \"node_modules/wrangler/config-schema.json\",\n  \"name\": \"clef-extract\",\n  \"main\": \"src/index.ts\",\n  \"compatibility_date\": \"2026-10-01\",\n  // AI Gateway and Workers AI bindings are account-level. The gateway id is\n  // passed on each AI.run options bag (see src/gateway.ts). Confirm the\n  // options shape if Cloudflare changes it after this compatibility date.\n  \"ai\": {\n    \"binding\": \"AI\"\n  },\n  \"d1_databases\": [\n    {\n      \"binding\": \"DB\",\n      \"database_name\": \"clef_extract\",\n      \"database_id\": \"00000000-0000-0000-0000-000000000000\"\n    }\n  ],\n  \"durable_objects\": {\n    \"bindings\": [\n      {\n        \"name\": \"REGISTRY\",\n        \"class_name\": \"IdRegistry\"\n      }\n    ]\n  },\n  \"migrations\": [\n    {\n      \"tag\": \"v1\",\n      \"new_sqlite_classes\": [\"IdRegistry\"]\n    }\n  ]\n}\n"
	},
	{
		path: "cloudflare/schema.sql",
		body: "-- Clef Extract v1. Apply with: wrangler d1 execute clef_extract --file=schema.sql\n\nCREATE TABLE IF NOT EXISTS documents (\n  id TEXT PRIMARY KEY,\n  created_at TEXT NOT NULL,\n  title TEXT,\n  source_text TEXT NOT NULL,\n  status TEXT NOT NULL,\n  engine TEXT NOT NULL,\n  result_json TEXT\n);\n\nCREATE TABLE IF NOT EXISTS chunks (\n  id TEXT PRIMARY KEY,\n  document_id TEXT NOT NULL,\n  ordinal INTEGER NOT NULL,\n  heading TEXT,\n  word_count INTEGER NOT NULL,\n  body TEXT NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS units (\n  id TEXT PRIMARY KEY,\n  document_id TEXT NOT NULL,\n  chunk_id TEXT NOT NULL,\n  ordinal INTEGER NOT NULL,\n  section_path TEXT NOT NULL,\n  text TEXT NOT NULL,\n  boilerplate INTEGER NOT NULL DEFAULT 0,\n  linked INTEGER NOT NULL DEFAULT 0\n);\n\nCREATE TABLE IF NOT EXISTS decisions (\n  id TEXT PRIMARY KEY,\n  unit_id TEXT NOT NULL,\n  document_id TEXT NOT NULL,\n  model TEXT NOT NULL,\n  confidence REAL NOT NULL,\n  accepted INTEGER NOT NULL DEFAULT 0,\n  payload TEXT NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS ids (\n  id TEXT PRIMARY KEY,\n  document_id TEXT NOT NULL,\n  kind TEXT NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS review_queue (\n  id TEXT PRIMARY KEY,\n  document_id TEXT NOT NULL,\n  unit_id TEXT NOT NULL,\n  reason TEXT NOT NULL,\n  confidence REAL,\n  payload TEXT NOT NULL,\n  status TEXT NOT NULL\n);\n\nCREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks (document_id, ordinal);\nCREATE INDEX IF NOT EXISTS idx_units_document ON units (document_id, ordinal);\nCREATE INDEX IF NOT EXISTS idx_decisions_document ON decisions (document_id);\nCREATE INDEX IF NOT EXISTS idx_review_document ON review_queue (document_id, status);\n"
	},
	{
		path: "cloudflare/RUNBOOK.md",
		body: "# Clef Extract — local runbook\n\nDeploy from the repository root's `cloudflare/` directory. The Worker bundles `src/engine`, which is the same compiler the preview desk runs. Do not copy this folder without `src/engine`.\n\nAssumptions pinned to compatibility date 2026-10-01: Workers AI `AI.run` third-argument `gateway.id`, Durable Object SQLite (`ctx.storage.sql`), and the Clef request (`model`, `state`, `questions` of type noul or choice). Clef has no separate boolean type; yes/no questions are noul. Confirm the segmenter model id `@cf/meta/llama-3.1-8b-instruct` against the current Workers AI catalog.\n\n1. Create resources. `npx wrangler login`, then `npx wrangler d1 create clef_extract`. In the Cloudflare dashboard, create an AI Gateway named `clef-extract`. Workers AI is enabled by the `ai` binding; no separate model install.\n2. Apply the schema. Paste the new database id into `database_id` in `wrangler.jsonc`. From `cloudflare/`: `npx wrangler d1 execute clef_extract --file=schema.sql`.\n3. Deploy. From `cloudflare/`: `npx wrangler deploy`. Note the workers.dev host.\n4. Submit one sample document. `curl -s -X POST https://<host>/extract -H 'content-type: application/json' --data '{\"text\":\"<paste the Ward callback drill sample>\"}'`. The response has `id`, `status`, `output`, and `review_queue`.\n5. Inspect coverage. `curl -s https://<host>/jobs/<id>` and read `output.coverage`. `segments_classified + unassigned_quotes.length` equals `segments_total`. Status stays `needs_review` while `unassigned_quotes` or `review_queue` is non-empty.\n6. Review low-confidence rows. Each `review_queue` item is also a D1 row in `review_queue` with status `open`. Accept or reject by posting the same document again with `resolutions`: `{\"text\":\"...\",\"resolutions\":[{\"unit_id\":\"U007\",\"action\":\"accept\"}]}`. There is no third route. Unclear, conflicting, and `external_check_required` rows stay out of `output` until a human resolution is sent. `boilerplate` drops the row and counts it as classified.\n7. Export JSON. The `output` object on the GET body is the contract: `concepts`, `facts`, `theories`, `workflows`, `relations`, `coverage`. Save that object. Do not treat it as a system of record until `status` is `complete`.\n8. Chat tools. `POST /mcp` is Model Context Protocol streamable HTTP (`initialize`, `tools/list`, `tools/call`). `GET /mcp` lists the tools. `lookup` and `quote_answer` return accepted records only. Held rows are counted and omitted. `ingest_document` compiles text the same way as `POST /extract`. Do not send source text that contains patient identifiers. The desk preview exposes the same protocol at `/api/mcp`.\n"
	},
	{
		path: "cloudflare/src/index.ts",
		body: "import type { Env } from \"./env.ts\";\nimport { handleExtract, handleGet, type ExtractBody } from \"./ingest.ts\";\nimport { handleMcp } from \"./mcp.ts\";\nimport { IdRegistry } from \"./registry.ts\";\n\nexport { IdRegistry };\n\n/**\n * Public surface: POST /extract, GET /jobs/:id, and POST|GET /mcp.\n * /mcp is a tool server. It quotes the accepted ledger. It is not a chat model.\n */\nexport default {\n  async fetch(request: Request, env: Env): Promise<Response> {\n    const url = new URL(request.url);\n    if (url.pathname === \"/mcp\") return handleMcp(request, env);\n    if (request.method === \"POST\" && url.pathname === \"/extract\") {\n      let body: ExtractBody;\n      try {\n        body = (await request.json()) as ExtractBody;\n      } catch {\n        return Response.json({ error: \"bad_json\" }, { status: 400 });\n      }\n      return handleExtract(env, body);\n    }\n    if (request.method === \"GET\" && url.pathname.startsWith(\"/jobs/\")) {\n      const id = decodeURIComponent(url.pathname.slice(\"/jobs/\".length));\n      if (!id) return Response.json({ error: \"not_found\" }, { status: 404 });\n      return handleGet(env, id);\n    }\n    return Response.json({ error: \"not_found\" }, { status: 404 });\n  },\n};"
	},
	{
		path: "cloudflare/src/mcp.ts",
		body: "import type { Env } from \"./env.ts\";\nimport { loadJob } from \"./compiler.ts\";\nimport { handleExtract } from \"./ingest.ts\";\nimport { mcpResponse, type Corpus, type VersionSummary } from \"./ledger/mcp.ts\";\nimport { projectLedger, type LedgerSource } from \"./ledger/project.ts\";\n\ninterface DocRow {\n  id: string;\n  title: string | null;\n  status: string;\n  engine: string;\n  created_at: string;\n  result_json: string | null;\n}\n\nexport async function handleMcp(request: Request, env: Env): Promise<Response> {\n  return mcpResponse(request, corpus(env));\n}\n\nfunction corpus(env: Env): Corpus {\n  return {\n    async list() {\n      const rows = await rowsOf(env);\n      return rows.map(summaryOf).filter((item): item is VersionSummary => item !== null);\n    },\n    async load(versionId: string) {\n      const job = await loadJob(env.DB, versionId);\n      if (!job) return null;\n      const row = await env.DB\n        .prepare(`SELECT id, title, created_at FROM documents WHERE id = ?`)\n        .bind(versionId)\n        .first<{ id: string; title: string | null; created_at: string }>();\n      return projectLedger(storedSource(job, row?.title, row?.created_at));\n    },\n    async loadAll() {\n      const views = [];\n      for (const row of await rowsOf(env)) {\n        const source = sourceFromRow(row);\n        if (source) views.push(projectLedger(source));\n      }\n      return views;\n    },\n    async ingest(text: string) {\n      const response = await handleExtract(env, { text });\n      const body = (await response.json()) as { id?: string; status?: string; review_queue?: unknown[]; error?: string };\n      if (!response.ok || !body.id) throw new Error(body.error || \"ingest_failed\");\n      const status = body.status === \"complete\" ? \"complete\" : \"needs_review\";\n      return {\n        version_id: body.id,\n        status,\n        review_count: Array.isArray(body.review_queue) ? body.review_queue.length : 0,\n      };\n    },\n  };\n}\n\nasync function rowsOf(env: Env): Promise<DocRow[]> {\n  const listed = await env.DB.prepare(\n    `SELECT id, title, status, engine, created_at, result_json\n     FROM documents ORDER BY created_at DESC LIMIT 40`,\n  ).all<DocRow>();\n  return listed.results ?? [];\n}\n\nfunction summaryOf(row: DocRow): VersionSummary | null {\n  const source = sourceFromRow(row);\n  if (!source) return null;\n  const view = projectLedger(source);\n  return {\n    version_id: view.version_id,\n    title: view.title,\n    status: view.status,\n    engine: view.engine,\n    created_at: view.created_at,\n    review_count: view.review_count,\n    segments_total: view.segments_total,\n    segments_classified: view.segments_classified,\n    unassigned: view.unassigned,\n  };\n}\n\nfunction sourceFromRow(row: DocRow): LedgerSource | null {\n  if (!row.result_json) return null;\n  try {\n    const parsed = JSON.parse(row.result_json) as { output?: LedgerSource[\"output\"]; review_queue?: unknown[] };\n    if (!parsed.output) return null;\n    return storedSource(\n      {\n        id: row.id,\n        status: row.status === \"complete\" ? \"complete\" : \"needs_review\",\n        engine: row.engine,\n        output: parsed.output,\n        review_queue: parsed.review_queue ?? [],\n      },\n      row.title,\n      row.created_at,\n    );\n  } catch {\n    return null;\n  }\n}\n\nfunction storedSource(\n  job: {\n    id: string;\n    status: \"complete\" | \"needs_review\";\n    engine: string;\n    output: LedgerSource[\"output\"];\n    review_queue: unknown[];\n  },\n  title?: string | null,\n  createdAt?: string,\n): LedgerSource {\n  return {\n    id: job.id,\n    status: job.status,\n    engine: job.engine,\n    title: title || undefined,\n    created_at: createdAt,\n    review_count: job.review_queue.length,\n    output: job.output,\n  };\n}\n"
	},
	{
		path: "cloudflare/src/ingest.ts",
		body: "import { extractDocument } from \"./engine/assemble.ts\";\nimport type { Resolution, TableInput } from \"./engine/types.ts\";\nimport { CHAR_LIMIT, type Env } from \"./env.ts\";\nimport { loadJob } from \"./compiler.ts\";\nimport { decideUnit } from \"./decision.ts\";\nimport { reserveIds } from \"./registry.ts\";\nimport { enqueueReview } from \"./review.ts\";\nimport { segmentWithModel, type SegmentResult } from \"./segmenter.ts\";\n\nexport interface ExtractBody {\n  text?: string;\n  tables?: TableInput[];\n  resolutions?: Resolution[];\n}\n\nexport async function handleExtract(env: Env, body: ExtractBody): Promise<Response> {\n  const text = typeof body.text === \"string\" ? body.text : \"\";\n  if (!text.trim() && !(body.tables && body.tables.length > 0)) {\n    return json({ error: \"empty_document\" }, 400);\n  }\n  if (text.length > CHAR_LIMIT) return json({ error: \"document_too_large\" }, 413);\n  const tables = Array.isArray(body.tables) ? body.tables : [];\n  const resolutions = Array.isArray(body.resolutions) ? body.resolutions : [];\n  const documentId = crypto.randomUUID();\n  const segmented = await segmentWithModel(env, text, tables);\n  const decisions = [];\n  for (let index = 0; index < segmented.units.length; index++) {\n    const unit = segmented.units[index];\n    const before = segmented.units[index - 1]?.text;\n    const after = segmented.units[index + 1]?.text;\n    decisions.push(await decideUnit(env, unit, { before, after }));\n  }\n  const engine = decisions.some((item) => item.model === \"clef\") ? \"clef\" : \"clef-flash\";\n  const job = extractDocument(text, tables, resolutions, {\n    units: segmented.units,\n    chunks: segmented.chunks,\n    decisions,\n    engine: `${engine}:${segmented.segmenter}`,\n  });\n  try {\n    await reserveIds(env, documentId, job.state.ids_used);\n  } catch (error) {\n    const message = error instanceof Error ? error.message : \"id_reuse\";\n    return json({ error: \"id_reuse\", detail: message }, 409);\n  }\n  await store(env, documentId, text, job, segmented);\n  return json(envelope(documentId, job), 200);\n}\n\nexport async function handleGet(env: Env, documentId: string): Promise<Response> {\n  const job = await loadJob(env.DB, documentId);\n  if (!job) return json({ error: \"not_found\" }, 404);\n  return json(job, 200);\n}\n\nasync function store(\n  env: Env,\n  documentId: string,\n  text: string,\n  job: ReturnType<typeof extractDocument>,\n  segmented: SegmentResult,\n): Promise<void> {\n  const db = env.DB;\n  const status = job.status;\n  const payload = JSON.stringify({ output: job.output, review_queue: job.review });\n  await db\n    .prepare(\n      `INSERT INTO documents (id, created_at, title, source_text, status, engine, result_json)\n       VALUES (?, ?, ?, ?, ?, ?, ?)`,\n    )\n    .bind(\n      documentId,\n      new Date().toISOString(),\n      job.chunks[0]?.heading ?? \"Document\",\n      text,\n      status,\n      job.engine,\n      payload,\n    )\n    .run();\n  for (const [index, chunk] of segmented.chunks.entries()) {\n    await db\n      .prepare(\n        `INSERT INTO chunks (id, document_id, ordinal, heading, word_count, body) VALUES (?, ?, ?, ?, ?, ?)`,\n      )\n      .bind(`${documentId}:${chunk.id}`, documentId, index + 1, chunk.heading, chunk.word_count, chunk.text)\n      .run();\n  }\n  const linked = new Set<string>();\n  for (const quote of job.output.coverage.unassigned_quotes) {\n    const unit = job.units.find((item) => item.text === quote);\n    if (unit) linked.add(unit.id);\n  }\n  for (const unit of job.units) {\n    const boilerplate = job.decisions.find((item) => item.unit_id === unit.id)?.boilerplate === \"yes\" ? 1 : 0;\n    await db\n      .prepare(\n        `INSERT INTO units (id, document_id, chunk_id, ordinal, section_path, text, boilerplate, linked)\n         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,\n      )\n      .bind(\n        `${documentId}:${unit.id}`,\n        documentId,\n        unit.chunk_id,\n        unit.ordinal,\n        unit.section_path,\n        unit.text,\n        boilerplate,\n        linked.has(unit.id) ? 0 : 1,\n      )\n      .run();\n  }\n  for (const decision of job.decisions) {\n    const accepted = job.review.some((item) => item.unit_id === decision.unit_id) ? 0 : 1;\n    await db\n      .prepare(\n        `INSERT INTO decisions (id, unit_id, document_id, model, confidence, accepted, payload)\n         VALUES (?, ?, ?, ?, ?, ?, ?)`,\n      )\n      .bind(\n        `${documentId}:${decision.unit_id}`,\n        decision.unit_id,\n        documentId,\n        decision.model,\n        decision.confidence,\n        accepted,\n        JSON.stringify(decision),\n      )\n      .run();\n  }\n  for (const id of job.state.ids_used) {\n    await db\n      .prepare(`INSERT INTO ids (id, document_id, kind) VALUES (?, ?, ?)`)\n      .bind(`${documentId}:${id}`, documentId, id.replace(/[0-9]/g, \"\") || \"id\")\n      .run();\n  }\n  await enqueueReview(db, documentId, job.review);\n}\n\nfunction envelope(documentId: string, job: ReturnType<typeof extractDocument>) {\n  return {\n    id: documentId,\n    status: job.status,\n    engine: job.engine,\n    output: job.output,\n    review_queue: job.review,\n  };\n}\n\nfunction json(body: unknown, status: number): Response {\n  return new Response(JSON.stringify(body), {\n    status,\n    headers: { \"content-type\": \"application/json; charset=utf-8\" },\n  });\n}\n"
	},
	{
		path: "cloudflare/src/segmenter.ts",
		body: "import { segmentDocument } from \"./engine/segment.ts\";\nimport { runModel } from \"./gateway.ts\";\nimport { SEGMENT_MODEL, type Env } from \"./env.ts\";\nimport type { Chunk, TableInput, Unit } from \"./engine/types.ts\";\n\nexport interface SegmentResult {\n  chunks: Chunk[];\n  units: Unit[];\n  segmenter: \"workers-ai\" | \"deterministic-fallback\";\n}\n\n/**\n * The text model may only propose exact substrings. Anything paraphrased,\n * empty, or the wrong shape is discarded and the deterministic segmenter stands.\n * Assumption: SEGMENT_MODEL is a current Workers AI chat model. Change the id\n * if the catalog has moved on.\n */\nexport async function segmentWithModel(env: Env, text: string, tables: TableInput[] = []): Promise<SegmentResult> {\n  const fallback = segmentDocument(text, tables);\n  try {\n    const raw = await runModel(env, env.SEGMENT_MODEL || SEGMENT_MODEL, {\n      messages: [\n        {\n          role: \"system\",\n          content:\n            \"Split the document into atomic sentences, bullets, steps, and definitions. \" +\n            \"Return JSON only: {\\\"units\\\":[\\\"exact substring\\\", ...]}. \" +\n            \"Copy text exactly. Do not paraphrase, merge claims, or add steps.\",\n        },\n        { role: \"user\", content: text },\n      ],\n      max_tokens: 4096,\n    });\n    const proposed = readUnits(raw);\n    if (!proposed || proposed.length === 0) return { ...fallback, segmenter: \"deterministic-fallback\" };\n    const usable = proposed.every((quote) => quote.length > 0 && text.includes(quote));\n    const ratio = proposed.length / Math.max(fallback.units.length, 1);\n    if (!usable || ratio < 0.5 || ratio > 1.5) return { ...fallback, segmenter: \"deterministic-fallback\" };\n    const units: Unit[] = proposed.map((quote, index) => ({\n      id: `U${String(index + 1).padStart(3, \"0\")}`,\n      chunk_id: fallback.chunks[0]?.id ?? \"K001\",\n      ordinal: index + 1,\n      section_path: sectionFor(quote, fallback.units) || \"Document\",\n      text: quote,\n      from_table: false,\n      list_order: /^\\d+[.)]\\s+/.test(quote) ? Number(/^(\\d+)/.exec(quote)?.[1]) : null,\n    }));\n    const tableUnits = fallback.units.filter((unit) => unit.from_table).map((unit, index) => ({\n      ...unit,\n      id: `U${String(units.length + index + 1).padStart(3, \"0\")}`,\n      ordinal: units.length + index + 1,\n    }));\n    return { chunks: fallback.chunks, units: [...units, ...tableUnits], segmenter: \"workers-ai\" };\n  } catch {\n    return { ...fallback, segmenter: \"deterministic-fallback\" };\n  }\n}\n\nfunction sectionFor(quote: string, units: Unit[]): string {\n  return units.find((unit) => unit.text === quote)?.section_path ?? \"\";\n}\n\nfunction readUnits(raw: unknown): string[] | null {\n  const text = readText(raw);\n  if (!text) return null;\n  const start = text.indexOf(\"{\");\n  const end = text.lastIndexOf(\"}\");\n  if (start < 0 || end <= start) return null;\n  try {\n    const parsed = JSON.parse(text.slice(start, end + 1)) as { units?: unknown };\n    if (!Array.isArray(parsed.units)) return null;\n    return parsed.units.filter((item): item is string => typeof item === \"string\").map((item) => item.trim());\n  } catch {\n    return null;\n  }\n}\n\nfunction readText(raw: unknown): string {\n  if (typeof raw === \"string\") return raw;\n  if (!raw || typeof raw !== \"object\") return \"\";\n  const obj = raw as Record<string, unknown>;\n  if (typeof obj.response === \"string\") return obj.response;\n  if (typeof obj.result === \"string\") return obj.result;\n  return \"\";\n}\n"
	},
	{
		path: "cloudflare/src/decision.ts",
		body: "import { buildClefRequest } from \"./engine/clef-questions.ts\";\nimport { normalizeAnswers } from \"./engine/normalize.ts\";\nimport type { NormalizedDecision, Unit } from \"./engine/types.ts\";\nimport { runModel } from \"./gateway.ts\";\nimport type { Env } from \"./env.ts\";\n\nconst FLASH = \"@cf/cloudflare/clef-flash\";\nconst FULL = \"@cf/cloudflare/clef\";\n\n/**\n * Clef decides. This function does not write summaries.\n * clef-flash is the default. Full clef runs once when confidence is low,\n * a label is unclear, or the top two choices are within 0.08.\n */\nexport async function decideUnit(\n  env: Env,\n  unit: Unit,\n  neighbors: { before?: string; after?: string },\n): Promise<NormalizedDecision> {\n  const flashBody = buildClefRequest(unit, neighbors, \"clef-flash\");\n  const flashRaw = await runModel(env, FLASH, flashBody);\n  const flash = normalizeAnswers(asClef(flashRaw, \"clef-flash\"), unit.id);\n  if (!needsFullClef(flash)) return flash;\n  const fullBody = buildClefRequest(unit, neighbors, \"clef\");\n  const fullRaw = await runModel(env, FULL, fullBody);\n  return normalizeAnswers(asClef(fullRaw, \"clef\"), unit.id);\n}\n\nexport function needsFullClef(decision: NormalizedDecision): boolean {\n  if (decision.confidence < 0.72 || decision.conflict) return true;\n  if (decision.polarity === \"unclear\") return true;\n  if (decision.record_kind === \"none\" && decision.boilerplate === \"no\") return true;\n  if (decision.record_kind === \"theory\" && (decision.causal === \"unclear\" || decision.falsifiable === \"unclear\")) {\n    return true;\n  }\n  return false;\n}\n\nfunction asClef(raw: unknown, model: string): { model: string; answers: Record<string, unknown> } {\n  const obj = raw && typeof raw === \"object\" ? (raw as Record<string, unknown>) : {};\n  const nested = obj.result && typeof obj.result === \"object\" ? (obj.result as Record<string, unknown>) : obj;\n  const answers = nested.answers && typeof nested.answers === \"object\" ? (nested.answers as Record<string, unknown>) : {};\n  return { model: typeof nested.model === \"string\" ? nested.model : model, answers };\n}\n"
	},
	{
		path: "cloudflare/src/registry.ts",
		body: "import type { Env } from \"./env.ts\";\n\n/**\n * Global id registry. Keys are `${documentId}:${localId}`.\n * Local ids (F001) may repeat across documents. Reuse inside one document is rejected.\n * Assumption: Durable Object SQLite storage (`ctx.storage.sql`) matches compatibility_date 2026-10-01.\n */\nexport class IdRegistry extends DurableObject<Env> {\n  constructor(ctx: DurableObjectState, env: Env) {\n    super(ctx, env);\n    void ctx.blockConcurrencyWhile(async () => {\n      ctx.storage.sql.exec(\n        `CREATE TABLE IF NOT EXISTS issued (\n          key TEXT PRIMARY KEY,\n          document_id TEXT NOT NULL,\n          local_id TEXT NOT NULL\n        )`,\n      );\n    });\n  }\n\n  async fetch(request: Request): Promise<Response> {\n    const body = (await request.json()) as { document_id?: string; ids?: string[] };\n    const documentId = body.document_id ?? \"\";\n    const ids = Array.isArray(body.ids) ? body.ids : [];\n    if (!documentId || ids.length === 0) {\n      return Response.json({ ok: false, error: \"bad_request\" }, { status: 400 });\n    }\n    const reused: string[] = [];\n    await this.ctx.blockConcurrencyWhile(async () => {\n      for (const id of ids) {\n        const key = `${documentId}:${id}`;\n        const existing = this.ctx.storage.sql.exec(\"SELECT key FROM issued WHERE key = ?\", key).toArray();\n        if (existing.length > 0) reused.push(id);\n      }\n      if (reused.length > 0) return;\n      for (const id of ids) {\n        const key = `${documentId}:${id}`;\n        this.ctx.storage.sql.exec(\n          \"INSERT INTO issued (key, document_id, local_id) VALUES (?, ?, ?)\",\n          key,\n          documentId,\n          id,\n        );\n      }\n    });\n    if (reused.length > 0) return Response.json({ ok: false, reused }, { status: 409 });\n    return Response.json({ ok: true });\n  }\n}\n\nexport async function reserveIds(env: Env, documentId: string, ids: string[]): Promise<void> {\n  if (ids.length === 0) return;\n  const stub = env.REGISTRY.get(env.REGISTRY.idFromName(\"clef-ids\"));\n  const response = await stub.fetch(\"https://registry/issue\", {\n    method: \"POST\",\n    body: JSON.stringify({ document_id: documentId, ids }),\n  });\n  if (!response.ok) {\n    const detail = await response.text();\n    throw new Error(`id registry rejected the set: ${detail}`);\n  }\n}\n"
	},
	{
		path: "cloudflare/src/compiler.ts",
		body: "import type { D1Database } from \"./env.ts\";\nimport type { ExtractionOutput, ReviewItem } from \"./engine/types.ts\";\n\nexport interface StoredJob {\n  id: string;\n  status: \"complete\" | \"needs_review\";\n  engine: string;\n  output: ExtractionOutput;\n  review_queue: ReviewItem[];\n}\n\n/** Reads the compiled JSON written by ingest. Does not invent rows. */\nexport async function loadJob(db: D1Database, documentId: string): Promise<StoredJob | null> {\n  const row = await db\n    .prepare(`SELECT id, status, engine, result_json FROM documents WHERE id = ?`)\n    .bind(documentId)\n    .first<{ id: string; status: string; engine: string; result_json: string | null }>();\n  if (!row || !row.result_json) return null;\n  const parsed = JSON.parse(row.result_json) as { output: ExtractionOutput; review_queue: ReviewItem[] };\n  const status = row.status === \"complete\" ? \"complete\" : \"needs_review\";\n  return { id: row.id, status, engine: row.engine, output: parsed.output, review_queue: parsed.review_queue };\n}\n"
	},
	{
		path: "cloudflare/src/review.ts",
		body: "import type { D1Database } from \"./env.ts\";\nimport type { ReviewItem } from \"./engine/types.ts\";\n\nexport async function enqueueReview(db: D1Database, documentId: string, items: ReviewItem[]): Promise<void> {\n  for (const item of items) {\n    await db\n      .prepare(\n        `INSERT INTO review_queue (id, document_id, unit_id, reason, confidence, payload, status)\n         VALUES (?, ?, ?, ?, ?, ?, 'open')`,\n      )\n      .bind(\n        `${documentId}:${item.id}`,\n        documentId,\n        item.unit_id,\n        item.reasons.join(\",\"),\n        item.confidence,\n        JSON.stringify(item),\n      )\n      .run();\n  }\n}\n\nexport async function listReview(db: D1Database, documentId: string): Promise<ReviewItem[]> {\n  const rows = await db\n    .prepare(\n      `SELECT payload FROM review_queue WHERE document_id = ? AND status = 'open' ORDER BY id`,\n    )\n    .bind(documentId)\n    .all<{ payload: string }>();\n  return rows.results.map((row) => JSON.parse(row.payload) as ReviewItem);\n}\n"
	},
	{
		path: "cloudflare/src/engine/clef-questions.ts",
		body: "import type { Unit } from \"./types.ts\";\n\n/**\n * Schema authoring note.\n * Written once. Grok is the planner and does not re-classify each sentence.\n * The Decision Worker sends this object to Clef on every unit.\n * Clef has no free-text answers. Evidence quotes come from the segmenter.\n *\n * Assumption (2026-10-02): Clef question types are noul, choice, and score.\n * This schema uses only noul (yes-probability; there is no separate boolean\n * type) and choice. Score is intentionally unused.\n */\nexport const CLEF_QUESTIONS = {\n  boilerplate: {\n    type: \"noul\",\n    instructions:\n      \"Is `text` only a heading, running header, page number, or other non-claim that asserts nothing?\",\n  },\n  deterministic: {\n    type: \"noul\",\n    instructions:\n      \"Does `text` state the claim as a fact, with no hedge such as may, might, could, likely, or suggests?\",\n  },\n  quantity_present: {\n    type: \"noul\",\n    instructions: \"Does `text` contain a number, count, percent, or clock time?\",\n  },\n  definition_present: {\n    type: \"noul\",\n    instructions:\n      \"Does `text` define a term with 'defined as', 'means', or 'refers to'?\",\n  },\n  decision_point: {\n    type: \"noul\",\n    instructions:\n      \"Does `text` mark an explicit decision, such as if, whether, otherwise, or decide?\",\n  },\n  fully_specified: {\n    type: \"noul\",\n    instructions:\n      \"Does `text` name the actor and either an input or an output of this step? Answer no if either is missing.\",\n  },\n  external_check: {\n    type: \"noul\",\n    instructions:\n      \"Does `text` rely on a citation, guideline, or outside source that is not contained in `text`?\",\n  },\n  polarity: {\n    type: \"choice\",\n    instructions:\n      \"What polarity does `text` assert? If it both negates and states a condition, choose conditional. If you cannot tell, choose unclear.\",\n    criteria: {\n      affirmed: \"The sentence asserts the claim.\",\n      denied: \"The sentence asserts that the claim is not the case.\",\n      conditional: \"The claim depends on an explicit if, unless, or when.\",\n      unclear: \"The sentence does not show which of the above applies.\",\n    },\n  },\n  record_kind: {\n    type: \"choice\",\n    instructions:\n      \"What kind of record is `text`? Choose one. Do not summarize. Judge only `text`.\",\n    criteria: {\n      fact: \"A checkable claim stated as fact, not a definition, step, or hedged reading.\",\n      theory: \"A hypothesis, model, interpretation, prediction, or hedged causal reading.\",\n      concept: \"A named term being defined.\",\n      workflow_step: \"An ordered action, trigger, or decision in a described procedure.\",\n      none: \"No claim, definition, or step.\",\n    },\n  },\n  theory_status: {\n    type: \"choice\",\n    instructions:\n      \"If `text` is a theory, which status fits? Otherwise choose not_applicable.\",\n    criteria: {\n      hypothesis: \"Hedged with may, might, could, or named as a hypothesis.\",\n      model: \"Named as a model or framework.\",\n      interpretation: \"A reading of evidence, including 'according to' or 'interpretation'.\",\n      prediction: \"A forecast about a future outcome.\",\n      not_applicable: \"Text is not a theory.\",\n    },\n  },\n  causal: {\n    type: \"choice\",\n    instructions:\n      \"Does `text` state a cause, using because, causes, leads to, results in, or due to? Choose unclear only if the causal direction is stated and cannot be read.\",\n    criteria: {\n      yes: \"An explicit causal connective is present.\",\n      no: \"No causal connective is present.\",\n      unclear: \"Causal language is present but the direction cannot be read.\",\n    },\n  },\n  falsifiable: {\n    type: \"choice\",\n    instructions:\n      \"If `text` is a theory, can it be falsified from what `text` itself says? Choose unclear unless the sentence states a measurement or says it cannot be tested. Do not use outside knowledge.\",\n    criteria: {\n      yes: \"The sentence states a measurement, threshold, or other explicit test.\",\n      no: \"The sentence says the claim cannot be tested.\",\n      unclear: \"The sentence does not say how the claim would be tested.\",\n    },\n  },\n  time_scope: {\n    type: \"choice\",\n    instructions:\n      \"What time does the main claim in `text` sit in? Choose unspecified if cues conflict or are absent. 'Shall' as a standing rule is present, not future.\",\n    criteria: {\n      past: \"The main verb is past or the sentence reports a completed event.\",\n      present: \"The sentence states a current fact or a standing rule.\",\n      future: \"The sentence uses will or an explicit future forecast.\",\n      unspecified: \"No single time scope is shown.\",\n    },\n  },\n  concept_type: {\n    type: \"choice\",\n    instructions:\n      \"If `text` defines a term, what type is that term? Otherwise choose not_applicable.\",\n    criteria: {\n      entity: \"A named organization, place, person, or product.\",\n      process: \"A procedure, protocol, callback, or pipeline.\",\n      metric: \"A score, rate, count, threshold, or index.\",\n      role: \"A person-role such as nurse, physician, or operator.\",\n      tool: \"A system, database, or software tool.\",\n      other: \"A defined term that is none of the above.\",\n      not_applicable: \"Text does not define a term.\",\n    },\n  },\n} as const;\n\nexport interface ClefRequest {\n  model: \"clef\" | \"clef-flash\";\n  state: {\n    section: string;\n    unit_id: string;\n    text: string;\n    before: string;\n    after: string;\n  };\n  questions: typeof CLEF_QUESTIONS;\n}\n\nexport function buildClefRequest(\n  unit: Unit,\n  neighbors: { before?: string; after?: string },\n  model: \"clef\" | \"clef-flash\" = \"clef-flash\",\n): ClefRequest {\n  return {\n    model,\n    state: {\n      section: unit.section_path,\n      unit_id: unit.id,\n      text: unit.text,\n      before: clip(neighbors.before ?? \"\"),\n      after: clip(neighbors.after ?? \"\"),\n    },\n    questions: CLEF_QUESTIONS,\n  };\n}\n\nfunction clip(text: string): string {\n  const clean = text.trim();\n  if (clean.length <= 180) return clean;\n  const slice = clean.slice(0, 180);\n  const sp = slice.lastIndexOf(\" \");\n  return sp > 80 ? slice.slice(0, sp) : slice;\n}\n"
	}
];
var DB_NAME = "clef-ledger";
var STORE = "versions";
var CAP = 24;
async function saveVersion(job) {
	if (typeof indexedDB === "undefined") return null;
	const db = await open();
	const existing = await request(db.transaction(STORE, "readonly").objectStore(STORE).get(job.id));
	if (existing) {
		db.close();
		return existing;
	}
	const newest = await newestVersion(db);
	const row = {
		version_id: job.id,
		title: job.chunks[0]?.heading || "Document",
		created_at: (/* @__PURE__ */ new Date()).toISOString(),
		parent_version_id: newest && newest.version_id !== job.id ? newest.version_id : null,
		status: job.status,
		review_count: job.review.length,
		engine: job.engine,
		job
	};
	await request(db.transaction(STORE, "readwrite").objectStore(STORE).put(row));
	const all = await request(db.transaction(STORE, "readonly").objectStore(STORE).getAll());
	const extra = all.sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(0, Math.max(0, all.length - CAP));
	if (extra.length > 0) {
		const tx = db.transaction(STORE, "readwrite");
		for (const item of extra) tx.objectStore(STORE).delete(item.version_id);
		await transactionDone(tx);
	}
	db.close();
	return row;
}
async function listVersions() {
	if (typeof indexedDB === "undefined") return [];
	const db = await open();
	const rows = await request(db.transaction(STORE, "readonly").objectStore(STORE).getAll());
	db.close();
	return rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
}
function open() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "version_id" });
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}
function newestVersion(db) {
	return request(db.transaction(STORE, "readonly").objectStore(STORE).getAll()).then((rows) => {
		return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
	});
}
function request(req) {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
function transactionDone(tx) {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});
}
var TABS = [
	{
		id: "overview",
		label: "Overview"
	},
	{
		id: "ask",
		label: "Ask"
	},
	{
		id: "concepts",
		label: "Concepts"
	},
	{
		id: "facts",
		label: "Facts"
	},
	{
		id: "theories",
		label: "Theories"
	},
	{
		id: "workflows",
		label: "Workflows"
	},
	{
		id: "relations",
		label: "Relations"
	},
	{
		id: "review",
		label: "Review"
	},
	{
		id: "json",
		label: "JSON"
	},
	{
		id: "contract",
		label: "Contract"
	}
];
function Console() {
	const [text, setText] = (0, import_react.useState)(SAMPLE_DOCUMENT);
	const [tableText, setTableText] = (0, import_react.useState)("");
	const [showTables, setShowTables] = (0, import_react.useState)(false);
	const [resolutions, setResolutions] = (0, import_react.useState)([]);
	const [job, setJob] = (0, import_react.useState)(() => extractDocument(SAMPLE_DOCUMENT));
	const [error, setError] = (0, import_react.useState)(null);
	const [tab, setTab] = (0, import_react.useState)("overview");
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [filePath, setFilePath] = (0, import_react.useState)(STARTER_FILES[0].path);
	const [copied, setCopied] = (0, import_react.useState)("");
	const [versions, setVersions] = (0, import_react.useState)([]);
	const tables = (0, import_react.useMemo)(() => parseTables(tableText), [tableText]);
	(0, import_react.useEffect)(() => {
		ledgerBridge.views = [projectLedger({
			id: job.id,
			status: job.status,
			engine: job.engine,
			title: job.chunks[0]?.heading || "Document",
			review_count: job.review.length,
			output: job.output
		})];
		registerLedgerTools();
		saveVersion(job).then(() => listVersions()).then(setVersions).catch(() => setVersions([]));
		if (text.trim() || tables.length > 0) fetch("/api/extract", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				text,
				tables,
				resolutions
			})
		}).catch(() => void 0);
	}, [
		job,
		resolutions,
		tables,
		text
	]);
	function run(nextText = text, nextTables = tables, nextResolutions = []) {
		if (!nextText.trim() && nextTables.length === 0) {
			setError("Paste a document first.");
			return;
		}
		if (nextText.length > 1e5) {
			setError("This desk reads up to 100,000 characters.");
			return;
		}
		try {
			const next = extractDocument(nextText, nextTables, nextResolutions);
			setJob(next);
			setResolutions(nextResolutions);
			setError(null);
			setTab("overview");
			fetch("/api/extract", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					text: nextText,
					tables: nextTables,
					resolutions: nextResolutions
				})
			});
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Could not read that document.");
		}
	}
	function resolve(unitId, action, polarity) {
		const next = [...resolutions.filter((item) => item.unit_id !== unitId), {
			unit_id: unitId,
			action,
			polarity
		}];
		try {
			setJob(extractDocument(text, tables, next));
			setResolutions(next);
			setError(null);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Could not apply that review.");
		}
	}
	const output = JSON.stringify(job.output, null, 2);
	const file = STARTER_FILES.find((item) => item.path === filePath) ?? STARTER_FILES[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-6 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid h-11 w-11 place-items-center bg-stamp font-display text-lg text-paper",
					children: "C"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl leading-none text-ink",
					children: "Clef Extract"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Closed labels, exact quotes, a human on anything unclear."
				})] })]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: ghost,
					onClick: () => download(output),
					children: "Export JSON"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: stamp,
					onClick: () => {
						navigator.clipboard?.writeText(output);
						setCopied("json");
					},
					children: copied === "json" ? "Copied" : "Copy JSON"
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "order-2 lg:sticky lg:top-4 lg:order-1 lg:self-start",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-baseline justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl text-ink",
							children: "Source"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono text-xs text-muted",
							children: [wordCount(text), " words"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: text,
						onChange: (event) => setText(event.target.value),
						onKeyDown: (event) => {
							if ((event.metaKey || event.ctrlKey) && event.key === "Enter") run();
						},
						spellCheck: false,
						"aria-label": "Document text",
						className: "h-56 w-full resize-y border border-line bg-card p-3 font-sans text-sm leading-relaxed text-ink lg:h-80"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: stamp,
								onClick: () => run(),
								children: "Extract"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: ghost,
								onClick: () => {
									setText(SAMPLE_DOCUMENT);
									setTableText("");
									run(SAMPLE_DOCUMENT, [], []);
								},
								children: "Load sample"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: ghost,
								onClick: () => setShowTables((open) => !open),
								children: showTables ? "Hide table" : "Add table"
							})
						]
					}),
					showTables ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-3 block text-sm text-muted",
						children: ["Table rows, cells separated by |", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: tableText,
							onChange: (event) => setTableText(event.target.value),
							"aria-label": "Table rows",
							className: "mt-1 h-24 w-full resize-y border border-line bg-card p-3 font-mono text-xs text-ink"
						})]
					}) : null,
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-review",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-xs leading-relaxed text-muted",
						children: [
							"This desk runs the closed-label stand-in so you can read a document without a Cloudflare account. The Worker sends the same questions to Clef-flash, then full Clef when confidence is under",
							" ",
							CONFIDENCE_THRESHOLD,
							"."
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "order-1 min-w-0 lg:order-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-4 flex gap-1 overflow-x-auto border-b border-line",
						role: "tablist",
						children: TABS.map((item) => {
							const active = tab === item.id;
							const extra = item.id === "review" && job.review.length > 0 ? ` ${job.review.length}` : "";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "tab",
								"aria-selected": active,
								className: `min-h-11 shrink-0 border-b-2 px-3 text-sm ${active ? "border-stamp text-ink" : "border-transparent text-muted"}`,
								onClick: () => setTab(item.id),
								children: [item.label, extra]
							}, item.id);
						})
					}),
					tab === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overview, {
						job,
						onReview: () => setTab("review")
					}) : null,
					tab === "ask" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ask, {
						job,
						versions
					}) : null,
					tab === "concepts" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Concepts, {
						job,
						onPick: setSelected,
						selected
					}) : null,
					tab === "facts" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Facts, {
						job,
						onPick: setSelected,
						selected
					}) : null,
					tab === "theories" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Theories, { job }) : null,
					tab === "workflows" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflows, { job }) : null,
					tab === "relations" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Relations, { job }) : null,
					tab === "review" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Review, {
						job,
						onResolve: resolve
					}) : null,
					tab === "json" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "max-h-[36rem] overflow-auto border border-line bg-card p-4 font-mono text-xs leading-relaxed text-ink",
						children: output
					}) : null,
					tab === "contract" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Contract, {
						job,
						selected,
						filePath: file.path,
						fileBody: file.body,
						onFile: setFilePath,
						copied: copied === file.path,
						onCopy: () => {
							navigator.clipboard?.writeText(file.body);
							setCopied(file.path);
						}
					}) : null
				]
			})]
		})]
	});
}
function Overview({ job, onReview }) {
	const coverage = job.output.coverage;
	const total = coverage.segments_total;
	const pct = total === 0 ? 100 : Math.round(coverage.segments_classified / total * 100);
	const link = job.output.relations.find((relation) => relation.relation === "contradicts");
	const left = job.output.facts.find((fact) => fact.id === link?.source_id);
	const right = job.output.facts.find((fact) => fact.id === link?.target_id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-line bg-card p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-baseline justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl text-ink",
							children: job.status === "complete" ? "Gate closed" : "Gate held"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-mono text-sm text-muted",
							children: [
								coverage.segments_classified,
								"/",
								total,
								" classified"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 h-2 bg-line",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-2 bg-stamp",
							style: { width: `${pct}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: job.status === "complete" ? "Every sentence is a record or boilerplate. Humans still own any field left unclear." : "Unclear and low-confidence rows stay out of the export until you accept them."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Concepts",
						value: job.output.concepts.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Facts",
						value: job.output.facts.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Theories",
						value: job.output.theories.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Workflows",
						value: job.output.workflows.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Relations",
						value: job.output.relations.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Held",
						value: job.review.length
					})
				]
			}),
			left && right ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-line bg-card p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg text-ink",
						children: "Contradiction kept apart"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							link?.source_id,
							" contradicts ",
							link?.target_id,
							". They were not merged."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", {
						className: "mt-3 border-l-2 border-review pl-3 font-mono text-sm text-ink",
						children: left.evidence_quote
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", {
						className: "mt-3 border-l-2 border-stamp pl-3 font-mono text-sm text-ink",
						children: right.evidence_quote
					})
				]
			}) : null,
			job.review.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: ghost,
				onClick: onReview,
				children: [
					"Review ",
					job.review.length,
					" held ",
					job.review.length === 1 ? "row" : "rows"
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-mono text-xs text-muted",
				children: [
					job.chunks.length,
					" chunk",
					job.chunks.length === 1 ? "" : "s",
					" · ",
					job.engine,
					" · ",
					job.id
				]
			})
		]
	});
}
function Concepts({ job, onPick, selected }) {
	if (job.output.concepts.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No accepted concepts." });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-3",
		children: job.output.concepts.map((concept) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => onPick(concept.id),
			className: `w-full border bg-card p-4 text-left ${selected === concept.id ? "border-stamp" : "border-line"}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-baseline justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs text-muted",
						children: concept.id
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs uppercase text-stamp",
						children: concept.type
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 font-display text-xl text-ink",
					children: concept.term
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-mono text-sm text-ink",
					children: concept.definition_present === "yes" ? concept.definition_quote : "No definition in the sentence."
				})
			]
		}) }, concept.id))
	});
}
function Facts({ job, onPick, selected }) {
	if (job.output.facts.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No accepted facts." });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-3",
		children: job.output.facts.map((fact) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => onPick(fact.id),
			className: `w-full border bg-card p-4 text-left ${selected === fact.id ? "border-stamp" : "border-line"}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-3 font-mono text-xs uppercase",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: fact.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Polarity, { value: fact.polarity }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: fact.time_scope
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: fact.deterministic === "yes" ? "deterministic" : "not deterministic"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: fact.quantity_present === "yes" ? "quantity" : "no quantity"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-mono text-sm text-ink",
				children: fact.evidence_quote
			})]
		}) }, fact.id))
	});
}
function Theories({ job }) {
	if (job.output.theories.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No theories in the export. Hedged readings wait in Review until you accept them." });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-3",
		children: job.output.theories.map((theory) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "border border-line bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-3 font-mono text-xs uppercase",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: theory.id
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-stamp",
							children: theory.status
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: ["causal ", theory.causal]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: ["falsifiable ", theory.falsifiable]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-mono text-sm text-ink",
					children: theory.evidence_quote
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-xs text-muted",
					children: ["Conflicts with ", theory.conflicts_with_fact_id]
				})
			]
		}, theory.id))
	});
}
function Workflows({ job }) {
	if (job.output.workflows.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No workflow in the accepted set." });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-4",
		children: job.output.workflows.map((workflow) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "border border-line bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-baseline justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-2xl text-ink",
						children: workflow.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs text-muted",
						children: workflow.id
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-3 space-y-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Trigger",
							v: workflow.trigger
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "End",
							v: workflow.end_condition
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Roles",
							v: workflow.roles.join(", ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Tools",
							v: workflow.tools_mentioned
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "Fully specified",
							v: workflow.fully_specified
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-4 space-y-3",
					children: workflow.steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-10 w-10 place-items-center bg-stamp font-mono text-sm text-paper",
							children: step.order
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-sm text-ink",
							children: step.action
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted",
							children: [
								step.actor,
								" · in ",
								step.input,
								" · out ",
								step.output,
								" · decision ",
								step.decision
							]
						})] })]
					}, step.order))
				})
			]
		}, workflow.id))
	});
}
function Relations({ job }) {
	if (job.output.relations.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No relations between accepted records." });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-2",
		children: job.output.relations.map((relation) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "border border-line bg-card px-4 py-3 font-mono text-sm text-ink",
			children: [
				relation.source_id,
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-stamp",
					children: relation.relation
				}),
				" ",
				relation.target_id
			]
		}, `${relation.source_id}-${relation.relation}-${relation.target_id}`))
	});
}
function Review({ job, onResolve }) {
	if (job.review.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Nothing is waiting. The gate is closed for this text." });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-3",
		children: job.review.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "border border-line border-l-2 border-l-review bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2 font-mono text-xs uppercase text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.id }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Math.round(item.confidence * 100), "%"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.reasons.join(" · ") })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-mono text-sm text-ink",
					children: item.quote
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-xs text-muted",
					children: [
						"Proposed ",
						item.proposed_kind,
						item.proposed_kind === "theory" ? ` · ${item.proposed_status}` : "",
						" · ",
						item.proposed_polarity,
						item.conflict ? " · choice was close" : ""
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [
						item.proposed_kind === "fact" && item.proposed_polarity === "unclear" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: stamp,
								onClick: () => onResolve(item.unit_id, "accept", "affirmed"),
								children: "Affirmed"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: ghost,
								onClick: () => onResolve(item.unit_id, "accept", "denied"),
								children: "Denied"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: ghost,
								onClick: () => onResolve(item.unit_id, "accept", "conditional"),
								children: "Conditional"
							})
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: stamp,
							onClick: () => onResolve(item.unit_id, "accept"),
							children: "Accept"
						}),
						item.conflict ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: ghost,
							onClick: () => onResolve(item.unit_id, "file_as_fact"),
							children: "File as fact"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: ghost,
							onClick: () => onResolve(item.unit_id, "boilerplate"),
							children: "Mark boilerplate"
						})
					]
				})
			]
		}, item.id))
	});
}
function Contract({ job, selected, filePath, fileBody, onFile, copied, onCopy }) {
	const unit = job.units.find((item) => item.id === selected) ?? job.units.find((item) => item.text === job.output.facts[0]?.statement) ?? job.units[0];
	const index = unit ? job.units.findIndex((item) => item.id === unit.id) : -1;
	const request = unit ? buildClefRequest(unit, {
		before: job.units[index - 1]?.text,
		after: job.units[index + 1]?.text
	}) : {
		model: "clef-flash",
		state: {},
		questions: CLEF_QUESTIONS
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-2xl text-ink",
					children: "Question schema"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Written once. Grok does not re-label each sentence. Clef returns probabilities over these noul and choice questions. Evidence quotes stay with the segmenter."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "mt-3 max-h-80 overflow-auto border border-line bg-card p-4 font-mono text-xs text-ink",
					children: JSON.stringify(request, null, 2)
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-2xl text-ink",
				children: "Runbook"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-3 list-decimal space-y-2 pl-5 text-sm text-ink",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Create the D1 database `clef_extract`, an AI Gateway named `clef-extract`, and log in with Wrangler." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Put the database id in `cloudflare/wrangler.jsonc`, then apply `schema.sql`." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "From `cloudflare/`, deploy with Wrangler. The bundle includes the shared engine." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "POST one document to `/extract`." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "GET `/jobs/:id` and read `output.coverage`. Classified plus unassigned equals the total." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Accept or drop held rows by POSTing the same text with `resolutions`. Review is not its own route." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Export the `output` object only after status is `complete` if you need a system of record." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A chatbot calls POST /api/mcp (streamable HTTP). lookup and quote_answer omit held rows." })
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-2xl text-ink",
				children: "v1 limits"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-3 list-disc space-y-2 pl-5 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Images are out of scope unless already OCR’d. Tables arrive as rows." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The desk you are using is the deterministic stand-in, not a Clef call." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Clef has noul, choice, and score. This schema uses noul and choice only." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "IDs are stable for the same text. They are not a global corpus sequence." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "One synchronous pass, 100,000 characters. Queue fan-out is deferred." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Unclear, conflicting, and external-check rows stay in the human queue." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Ask and MCP quote accepted records only. WebGPU reranks those quotes. It does not generate new ones." })
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-2xl text-ink",
						children: "Starter files"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: ghost,
						onClick: onCopy,
						children: copied ? "Copied" : "Copy file"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-3 block text-sm text-muted",
					children: ["File", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: filePath,
						onChange: (event) => onFile(event.target.value),
						className: "mt-1 min-h-11 w-full border border-line bg-card px-3 text-sm text-ink",
						children: STARTER_FILES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item.path,
							children: item.path
						}, item.path))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "mt-3 max-h-96 overflow-auto border border-line bg-card p-4 font-mono text-xs text-ink",
					children: fileBody
				})
			] })
		]
	});
}
function Tile({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border border-line bg-card px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-mono text-2xl text-ink",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs uppercase tracking-wide text-muted",
			children: label
		})]
	});
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "font-mono text-sm text-ink",
			children: v
		})]
	});
}
function Polarity({ value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: value === "denied" ? "text-review" : value === "affirmed" ? "text-stamp" : "text-ink",
		children: value
	});
}
function Empty({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "border border-line bg-card p-4 text-sm text-muted",
		children
	});
}
function parseTables(raw) {
	const rows = raw.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => line.split("|").map((cell) => cell.trim()));
	if (rows.length === 0) return [];
	return [{
		name: "Pasted",
		rows
	}];
}
function wordCount(text) {
	return text.trim().split(/\s+/).filter(Boolean).length;
}
function download(body) {
	const blob = new Blob([body], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "clef-extract.json";
	link.click();
	URL.revokeObjectURL(url);
}
var stamp = "min-h-11 bg-stamp px-4 text-sm font-medium text-paper hover:opacity-90";
var ghost = "min-h-11 border border-line bg-card px-4 text-sm font-medium text-ink hover:border-stamp";
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Console, {});
}
//#endregion
export { Home as component };
