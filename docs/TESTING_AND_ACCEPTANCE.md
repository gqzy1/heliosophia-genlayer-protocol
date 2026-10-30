# Verification

## Deterministic tests

`python3 contracts/test_heliosophia_contract.py` imports the production contract and runs 14 tests using mocked GenVM I/O and storage. Coverage includes source commitment, baseline synthesis, successful and refuted evidence, partial evidence, duplicate IDs, repeated content under a different URL, bounded cumulative accounting, malformed model decisions, HTTP errors, input bounds, and view methods.

These tests do not claim to run a real GenVM or establish validator agreement. Live execution is verified separately through finalized successful receipts and contract reads.

## Frontend preservation

`frontend-integrity.json` records SHA-256 values from the original source package. `node scripts/verify_frontend_integrity.mjs` requires the original file set and exact bytes for all 11 protected frontend files. Only `src/config/deployment.json` may change to contain verified deployment data. The original `npm run build` command is used unchanged.

## Live integration

`npm run deploy:studionet` verifies deployment, registration, replication, readback, evidence digests, count, and accounting split on Stable Studionet 61999. Finalized transaction summaries and results are written to `onchain-deployment-proof.json`. The deployment configuration remains in local demonstration mode until the entire sequence passes.

The public evidence is a controlled synthetic fixture. Its purpose is to verify real web retrieval and multi-validator contract execution, not to establish a real scientific result. Accounting amounts do not represent token transfers.

## Publication

The GitHub Actions workflow repeats production-source unit tests, checks frontend preservation, executes `npm run build`, and publishes the complete static output to GitHub Pages. Internal handoff files, dependencies, local environments, and private keys are excluded from publication.
