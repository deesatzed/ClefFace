# Clef Extract — local runbook

Local model, no Cloudflare account. From a machine with the ClefExtract virtualenv:

```
python cloudflare/scripts/serve-clef.py 8010
```

Open `http://127.0.0.1:8010/` for a status page. Decisions are `POST /v1/systemone`.

Then, from `ClefFace/`:

```
CLEF_URL=http://127.0.0.1:8010 node --experimental-strip-types cloudflare/scripts/extract-real.ts
```

That classifies the built-in ward-callback sample with Clef-flash and writes `/tmp/clef-extract-real.json`. Set `CLEF_URL` the same way for the desk at `POST /api/extract`. Leave it unset and the desk keeps the rule stand-in. A second server at `CLEF_FULL_URL` is used only when flash is low-confidence, conflicting, or unclear. Port 8000 is not used; another local app already listens there.

Deploy from the repository root's `cloudflare/` directory. The Worker bundles `src/engine`, which is the same compiler the preview desk runs. Do not copy this folder without `src/engine`.

Assumptions pinned to compatibility date 2026-10-01: Workers AI `AI.run` third-argument `gateway.id`, Durable Object SQLite (`ctx.storage.sql`), and the Clef request (`model`, `state`, `questions` of type noul or choice). Clef has no separate boolean type; yes/no questions are noul. Confirm the segmenter model id `@cf/meta/llama-3.1-8b-instruct` against the current Workers AI catalog.

1. Create resources. `npx wrangler login`, then `npx wrangler d1 create clef_extract`. In the Cloudflare dashboard, create an AI Gateway named `clef-extract`. Workers AI is enabled by the `ai` binding; no separate model install.
2. Apply the schema. Paste the new database id into `database_id` in `wrangler.jsonc`. From `cloudflare/`: `npx wrangler d1 execute clef_extract --file=schema.sql`.
3. Deploy. From `cloudflare/`: `npx wrangler deploy`. Note the workers.dev host.
4. Submit one sample document. `curl -s -X POST https://<host>/extract -H 'content-type: application/json' --data '{"text":"<paste the Ward callback drill sample>"}'`. The response has `id`, `status`, `output`, and `review_queue`.
5. Inspect coverage. `curl -s https://<host>/jobs/<id>` and read `output.coverage`. `segments_classified + unassigned_quotes.length` equals `segments_total`. Status stays `needs_review` while `unassigned_quotes` or `review_queue` is non-empty.
6. Review low-confidence rows. Each `review_queue` item is also a D1 row in `review_queue` with status `open`. Accept or reject by posting the same document again with `resolutions`: `{"text":"...","resolutions":[{"unit_id":"U007","action":"accept"}]}`. There is no third route. Unclear, conflicting, and `external_check_required` rows stay out of `output` until a human resolution is sent. `boilerplate` drops the row and counts it as classified.
7. Export JSON. The `output` object on the GET body is the contract: `concepts`, `facts`, `theories`, `workflows`, `relations`, `coverage`. Save that object. Do not treat it as a system of record until `status` is `complete`.
8. Chat tools. `POST /mcp` is Model Context Protocol streamable HTTP (`initialize`, `tools/list`, `tools/call`). `GET /mcp` lists the tools. `lookup` and `quote_answer` return accepted records only. Held rows are counted and omitted. `ingest_document` compiles text the same way as `POST /extract`. Do not send source text that contains patient identifiers. The desk preview exposes the same protocol at `/api/mcp`.
