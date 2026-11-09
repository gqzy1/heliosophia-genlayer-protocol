# HELIOSOPHIA

Scientific reproducibility and evidence-backed royalty accounting on **GenLayer Stable Studionet**.

[Open the application](https://gqzy1.github.io/heliosophia-genlayer-protocol/) · [Verified on-chain evidence](onchain-deployment-proof.json) · [Browser lifecycle proof](docs/evidence/browser-lifecycle-v2.json)

Verified contract on chain 61999: `0xf0C3D7e7a4c31fda6a07ED96575f15a8Ac86f240`.

Heliosophia records a falsifiable research claim, commits its source with SHA-256, and compares submitted replication evidence against the declared tolerance. GenLayer validators independently evaluate fetched evidence before the contract updates its epistemic index and accounting allocations.

## Experience

The Swiss archival interface retains its warm paper palette, high-DPI Canvas astrolabe, Alabaster and Nocturne themes, bilingual text, reduced-motion controls, and mechanical sound engine.

The v2 workbench signs real transactions using an EIP-1193 wallet on chain 61999 or a browser-generated GenLayer SDK signer. Registration and replication wait for **FINALIZED, successful leader execution and majority agreement**, then verify the discovery readback. The inspector can query count and individual records, or deploy the canonical contract source. No ACCEPTED fallback is represented as finality.

To try the complete flow, connect a signer, register a new discovery using the default explicitly synthetic source and metric clause, then submit its replication telemetry using the public telemetry URL field. Readback JSON and transaction hashes appear in the lifecycle panel and dossier export. Existing editorial samples illustrate the visual model; they are not automatically registered on-chain. A matching evidence digest cannot be replayed on the same discovery.

SDK signer keys stay in this browser's local storage. Use this convenience signer only for the free Studionet; do not import or fund a valuable wallet. Injected-wallet transactions require the wallet's own signature approval. Displayed royalty amounts are accounting units, not USDC transfers. The live readback panel is authoritative; the animated instrument is a presentation of the selected scenario. Every displayed and exported verdict, ECI, digest, telemetry hash and allocation value comes from the FINALIZED `get_discovery` readback. Before a readback, the interface shows unconfirmed placeholders and the dossier export is disabled. `PARTIAL_CONVERGENCE` is shown as its own outcome: the ECI is unchanged and it unlocks nothing. A real on-chain PARTIAL case is recorded in [docs/evidence/partial-case.json](docs/evidence/partial-case.json).

## Contract

- `register_discovery`: retrieve source content, agree on its digest, and produce a source-grounded baseline through non-comparative equivalence.
- `submit_replication_proof`: validators independently retrieve evidence, evaluate the declared measurements, and compare verdicts through comparative equivalence.
- `get_discovery`, `get_discovery_count`, `get_replication_log`: inspect committed state and audit provenance.
- Duplicate discovery IDs and repeated telemetry content are rejected. Missing or malformed model decisions fail closed. Partial or refuted evidence cannot unlock new allocations, and cumulative allocations never exceed the declared pool.

**Accounting boundary:** the USDC-denominated amounts are ledger units. The contract holds and transfers no USDC. ECI is a protocol heuristic, not a calibrated scientific probability. A URL, lab label, or validator vote does not authenticate a laboratory, establish independent replication, confer a patent, or prove scientific truth.

## Run

```bash
npm ci
npm test  # contract tests (registration readback + all three verdicts) and dossier readback tests
node scripts/verify_frontend_integrity.mjs
npm run dev
npm run build
```

The Python tests import the production contract with mocked GenVM I/O and storage. They test deterministic logic, not real network consensus. The dossier tests compile `src/utils/dossier.ts` and assert that the exported dossier takes its verdict, ECI, digest, telemetry hash and allocations from the FINALIZED readback, that PARTIAL_CONVERGENCE unlocks nothing, and that export is refused before a FINALIZED readback.

```bash
# Real on-chain PARTIAL case (registers a fresh discovery; the submitted
# HLS-2026-0104 record is untouched). Requires the partial telemetry file
# to already be on GitHub at the given commit.
npm run partial-case -- --evidence-ref <public-commit-sha>
```

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
