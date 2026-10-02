-- Clef Extract v1. Apply with: wrangler d1 execute clef_extract --file=schema.sql

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  title TEXT,
  source_text TEXT NOT NULL,
  status TEXT NOT NULL,
  engine TEXT NOT NULL,
  result_json TEXT
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  heading TEXT,
  word_count INTEGER NOT NULL,
  body TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  section_path TEXT NOT NULL,
  text TEXT NOT NULL,
  boilerplate INTEGER NOT NULL DEFAULT 0,
  linked INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  model TEXT NOT NULL,
  confidence REAL NOT NULL,
  accepted INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ids (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  kind TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_queue (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  confidence REAL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks (document_id, ordinal);
CREATE INDEX IF NOT EXISTS idx_units_document ON units (document_id, ordinal);
CREATE INDEX IF NOT EXISTS idx_decisions_document ON decisions (document_id);
CREATE INDEX IF NOT EXISTS idx_review_document ON review_queue (document_id, status);
