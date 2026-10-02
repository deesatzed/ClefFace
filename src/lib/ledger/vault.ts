import type { Job } from "@/lib/clef";

const DB_NAME = "clef-ledger";
const STORE = "versions";
const CAP = 24;

export interface LocalVersion {
  version_id: string;
  title: string;
  created_at: string;
  parent_version_id: string | null;
  status: Job["status"];
  review_count: number;
  engine: string;
  job: Job;
}

export async function saveVersion(job: Job): Promise<LocalVersion | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await open();
  const existing = await request<LocalVersion | undefined>(db.transaction(STORE, "readonly").objectStore(STORE).get(job.id));
  if (existing) {
    db.close();
    return existing;
  }
  const newest = await newestVersion(db);
  const row: LocalVersion = {
    version_id: job.id,
    title: job.chunks[0]?.heading || "Document",
    created_at: new Date().toISOString(),
    parent_version_id: newest && newest.version_id !== job.id ? newest.version_id : null,
    status: job.status,
    review_count: job.review.length,
    engine: job.engine,
    job,
  };
  await request(db.transaction(STORE, "readwrite").objectStore(STORE).put(row));
  const all = await request<LocalVersion[]>(db.transaction(STORE, "readonly").objectStore(STORE).getAll());
  const extra = all.sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(0, Math.max(0, all.length - CAP));
  if (extra.length > 0) {
    const tx = db.transaction(STORE, "readwrite");
    for (const item of extra) tx.objectStore(STORE).delete(item.version_id);
    await transactionDone(tx);
  }
  db.close();
  return row;
}

export async function listVersions(): Promise<LocalVersion[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await open();
  const rows = await request<LocalVersion[]>(db.transaction(STORE, "readonly").objectStore(STORE).getAll());
  db.close();
  return rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function open(): Promise<IDBDatabase> {
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

function newestVersion(db: IDBDatabase): Promise<LocalVersion | null> {
  return request<LocalVersion[]>(db.transaction(STORE, "readonly").objectStore(STORE).getAll()).then((rows) => {
    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  });
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
