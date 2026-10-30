# Studionet integration

| Setting | Value |
| --- | --- |
| Network | GenLayer Stable Studionet |
| Chain ID | 61999 |
| RPC | https://studio.genlayer.com/api |
| SDK | genlayer-js 1.1.8, locked in package-lock.json |
| Source | contracts/heliosophia_ledger.py |
| Constructor | No arguments |
| Consensus | Validator consensus enabled; leaderOnly is false |
| Value | Zero |

Run `npm run deploy:studionet` with `HELIOSOPHIA_EVIDENCE_REF` set to a public commit containing the evidence fixtures. In GitHub Actions, `GITHUB_SHA` supplies that reference automatically. The immutable source URLs are committed in the proof.

The script refuses another network or a nonzero gas price. Every returned transaction hash is saved before polling begins. An interruption resumes tracking the same hash. A finalized receipt must also report successful execution, and the resulting state must match the expected source digest, telemetry digest, allocation split, count, and status before live configuration is written.

`register_discovery(id, author, title, preprint_url, clause, pool, share_bps)` creates one immutable discovery ID. `submit_replication_proof(id, lab, telemetry_url, notes)` records a new content digest and evaluates it. Read state with `get_discovery(id)`, count with `get_discovery_count()`, and an audit with `get_replication_log(id, index)`.

Source text is committed with strict equivalence before source-grounded baseline synthesis. The initial ECI is 7600 basis points. Replication uses independently fetched telemetry and comparative equivalence: verdict, digest, index delta, and unlock classification must match exactly, observed variance may differ by at most 100 basis points, and conclusions must agree in substance. Successful, partial, and refuted decisions change ECI by +1950, 0, and -3500 respectively, clamped to 0–10000. Only successful evidence unlocks accounting allocations.

The sample 80000-unit pool and 2000-basis-point replicator share produce 64000 author units and 16000 replicator units. These are accounting entries, not token transfers. Repeated distinct successful reports cannot release the pool twice. Lab identity and physical measurements remain external trust assumptions.

The frontend's original workbench remains a local demonstration. The deployment configuration supplies the verified live address and transaction evidence; the frontend does not sign writes.
