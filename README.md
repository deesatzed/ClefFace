# AI Evidence Laboratory

A local-first workspace for controlled document-reasoning experiments. Change a precise span of evidence, hold the question fixed, and inspect whether an answer changes when it should. The offline demo uses conspicuously labeled simulated controls; it does not claim real-model behavior.

## Quick start

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:8080`. If that port is occupied, use `npm run dev -- --port 8081` for local inspection. The homepage includes a no-key demo and an exploratory case editor. Saved experiments stay in browser local storage until explicitly archived or deleted; export JSON for backup.

## Commands

```sh
npm test                 # unit, integration, and invariant checks
npm run typecheck        # strict TypeScript check
npm run lint             # lint (see known existing findings)
npm run build:dev        # local build without database migration
npm run demo:offline     # deterministic simulated demonstration
npm run experiment       # headless replay summary
npm run experiment -- --artifact replay.json
```

`npm run build` also runs the inherited database migration step; use `build:dev` for the local offline Evidence Lab until migration behavior is separately configured.

## Privacy and evidence labels

No account, telemetry, provider call, or upload is required for the demo. Local JSON and HTML reports contain experiment content, so review them before sharing. Labels distinguish `simulated`, `recorded`, and `live` response evidence. A generic live-pair boundary is present but is not configured with credentials or a provider.

See [docs/EVIDENCE_LAB.md](docs/EVIDENCE_LAB.md) for architecture, artifact format, validation, and limits.
