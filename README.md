# HELIOSOPHIA

Scientific reproducibility and evidence-backed royalty accounting on **GenLayer Stable Studionet**.

[Open the application](https://gqzy1.github.io/heliosophia-genlayer-protocol/) · [Verified on-chain evidence](onchain-deployment-proof.json)

Verified contract on chain 61999: `0x98E0fda73CD21b83f3A55491E64C03D650091029`.

Heliosophia records a falsifiable research claim, commits its source with SHA-256, and compares submitted replication evidence against the declared tolerance. GenLayer validators independently evaluate fetched evidence before the contract updates its epistemic index and accounting allocations.

## Experience

The original Swiss archival interface combines warm paper and mineral pigments, a high-DPI Canvas astrolabe, Alabaster and Nocturne themes, English and Chinese text, reduced-motion controls, and an optional mechanical sound engine. The frontend is preserved byte-for-byte, with `src/config/deployment.json` as the sole deployment writeback file.

The interactive replication workbench is a **browser-local demonstration**. A live deployment banner identifies the separately verified Studionet contract; it does not turn local workbench actions into blockchain transactions. The abbreviated contract excerpt in the inspector is illustrative; the canonical executable source is [contracts/heliosophia_ledger.py](contracts/heliosophia_ledger.py).

## Contract

- `register_discovery`: retrieve source content, agree on its digest, and produce a source-grounded baseline through non-comparative equivalence.
- `submit_replication_proof`: validators independently retrieve evidence, evaluate the declared measurements, and compare verdicts through comparative equivalence.
- `get_discovery`, `get_discovery_count`, `get_replication_log`: inspect committed state and audit provenance.
- Duplicate discovery IDs and repeated telemetry content are rejected. Missing or malformed model decisions fail closed. Partial or refuted evidence cannot unlock new allocations, and cumulative allocations never exceed the declared pool.

**Accounting boundary:** the USDC-denominated amounts are ledger units. The contract holds and transfers no USDC. ECI is a protocol heuristic, not a calibrated scientific probability. A URL, lab label, or validator vote does not authenticate a laboratory, establish independent replication, confer a patent, or prove scientific truth.

## Run

```bash
npm ci
python3 contracts/test_heliosophia_contract.py
node scripts/verify_frontend_integrity.mjs
npm run dev
npm run build
```

The Python tests import the production contract with mocked GenVM I/O and storage. They test deterministic logic, not real network consensus.

## Deployment

Network: **61999**. RPC: **https://studio.genlayer.com/api**. Only zero-cost Stable Studio transactions are permitted by the deployment script.

```bash
HELIOSOPHIA_EVIDENCE_REF=<public-commit-sha> npm run deploy:studionet
```

The script checks the chain and gas price, compiles the source through Studio, deploys with validator consensus enabled, registers a controlled fixture, submits its telemetry, waits for finalized successful execution, and verifies state and both evidence digests. It writes the real address and transaction hashes to `src/config/deployment.json` and `onchain-deployment-proof.json` only after every check succeeds. `onchain-progress.json` preserves submitted hashes so interrupted verification resumes without duplicate writes. Private keys are never logged or written; an optional `GENLAYER_PRIVATE_KEY` remains server-side only.

The public files in [public/evidence](public/evidence) are explicitly **synthetic acceptance fixtures**. The blockchain transactions and validator execution are real; the sample measurements are not a real scientific experiment or institutional endorsement.

The GitHub Actions workflow runs tests and the unchanged production build, then publishes `dist/` to GitHub Pages. Its manual `verify_onchain` option runs or resumes the same deployment script and commits the resulting public evidence.

## References

- [On-chain integration](docs/ONCHAIN_INTEGRATION.md)
- [Verification](docs/TESTING_AND_ACCEPTANCE.md)
- [Design rationale](DESIGN_RATIONALE.md)
- [GenLayer equivalence principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
- [GenVM SDK](https://sdk.genlayer.com/v0.2.9/api/genlayer.html)
