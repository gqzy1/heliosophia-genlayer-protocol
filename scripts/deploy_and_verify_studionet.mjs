/** Deploy and verify only on Stable Studionet. No keys are written or logged. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { transactionsStatusNumberToName } from 'genlayer-js/types';

const RPC_URL = 'https://studio.genlayer.com/api';
const CHAIN_ID = 61999;
const DISCOVERY_ID = 'HLS-2026-0104';
const progressPath = 'onchain-progress.json';
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const json = data => JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2) + '\n';
const code = fs.readFileSync('contracts/heliosophia_ledger.py', 'utf8');
const sourceSha256 = digest(code);
let progress = fs.existsSync(progressPath) ? JSON.parse(fs.readFileSync(progressPath, 'utf8')) : {
  chainId: CHAIN_ID, rpcUrl: RPC_URL, sourceSha256, discoveryId: DISCOVERY_ID,
  transactions: {}, receipts: {},
};
assert.equal(progress.chainId, CHAIN_ID);
if (Object.keys(progress.transactions).length === 0) progress.sourceSha256 = sourceSha256;
assert.equal(progress.sourceSha256, sourceSha256, 'Contract changed after submission. Inspect the existing transactions before starting another deployment.');
const saveProgress = () => fs.writeFileSync(progressPath, json({...progress, updatedAt: new Date().toISOString()}));

function receiptSummary(tx, hash) {
  const leaders = tx.consensus_data?.leader_receipt;
  const leader = Array.isArray(leaders) ? leaders[leaders.length - 1] : leaders;
  const execution = tx.txExecutionResultName ?? leader?.execution_result;
  return {
    hash, status: tx.statusName ?? transactionsStatusNumberToName[String(tx.status)] ?? tx.status,
    executionResult: execution,
    contractAddress: tx.to_address ?? tx.recipient,
    votes: tx.consensus_data?.votes ?? {},
    validatorCount: tx.consensus_data?.validators?.length ?? tx.lastRound?.roundValidators?.length ?? 0,
    error: leader?.error ?? leader?.result ?? leader?.genvm_result ?? null,
  };
}

async function main() {
  assert.equal(studionet.id, CHAIN_ID);
  const account = createAccount(process.env.GENLAYER_PRIVATE_KEY || undefined);
  const client = createClient({chain: studionet, endpoint: RPC_URL, account});
  console.log('Network:', RPC_URL, 'Signer:', account.address);
  const chainId = await client.request({method: 'eth_chainId', params: []});
  assert.equal(Number(BigInt(chainId)), CHAIN_ID, 'Wrong chain; refusing to broadcast');
  const gasPrice = await client.request({method: 'eth_gasPrice', params: []});
  assert.equal(BigInt(gasPrice), 0n, 'Nonzero gas price; this deployment permits zero-cost Studio transactions only');
  progress.rpcPreflight = {chainId, gasPrice, checkedAt: new Date().toISOString()};
  const ref = progress.evidenceRef ?? process.env.HELIOSOPHIA_EVIDENCE_REF ?? process.env.GITHUB_SHA;
  assert.match(ref || '', /^[a-f0-9]{40}$/, 'Supply HELIOSOPHIA_EVIDENCE_REF as the public evidence commit SHA');
  progress.evidenceRef = ref;
  const base = `https://raw.githubusercontent.com/gqzy1/heliosophia-genlayer-protocol/${ref}/public/evidence`;
  const sourceUrl = `${base}/preprint.txt`;
  const telemetryUrl = `${base}/replication.json`;
  for (const [name, url] of [['preprint.txt', sourceUrl], ['replication.json', telemetryUrl]]) {
    const response = await fetch(url);
    assert.equal(response.status, 200, `Evidence URL unavailable: ${name}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(digest(bytes), digest(fs.readFileSync(`public/evidence/${name}`)), 'Remote evidence does not match the checked-in fixture');
  }
  if (!progress.transactions.deployContract) {
    // Compile the exact production source through the official Studio RPC before signing.
    await client.getContractSchemaForCode(code);
    progress.deployerAddress = account.address;
    saveProgress();
  }
  async function execute(name, submit) {
    if (!progress.transactions[name]) {
      progress.transactions[name] = await submit();
      saveProgress(); // Persist the hash immediately; timeouts never trigger duplicate writes.
      console.log(name, progress.transactions[name]);
    } else {
      console.log('Resume', name, progress.transactions[name]);
    }
    const hash = progress.transactions[name];
    let lastStatus;
    for (let attempt = 0; attempt < 240; attempt++) {
      const tx = await client.getTransaction({hash});
      if (tx) {
        const summary = receiptSummary(tx, hash);
        progress.receipts[name] = summary;
        saveProgress();
        if (summary.status !== lastStatus) console.log(name, summary.status, summary.executionResult ?? '');
        lastStatus = summary.status;
        if (['CANCELED', 'UNDETERMINED', 'LEADER_TIMEOUT', 'VALIDATORS_TIMEOUT'].includes(summary.status)) {
          throw new Error(`${name} failed: ${json(summary)}`);
        }
        if (summary.status === 'FINALIZED') {
          assert.ok(['SUCCESS', 'FINISHED_WITH_RETURN'].includes(summary.executionResult), `${name} execution did not succeed: ${json(summary)}`);
          return tx;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    throw new Error(`Tracking timed out for ${hash}. Resume this same hash; do not submit a duplicate.`);
  }

  const deployment = await execute('deployContract', () => client.deployContract({code, args: [], leaderOnly: false}));
  const contractAddress = deployment.to_address ?? deployment.recipient ?? deployment.txDataDecoded?.contractAddress;
  assert.match(contractAddress || '', /^0x[a-fA-F0-9]{40}$/, 'Finalized deployment has no contract address');
  progress.contractAddress = contractAddress;
  saveProgress();
  const read = async (method, args = []) => {
    const result = await client.readContract({address: contractAddress, functionName: method, args});
    return typeof result === 'string' && /^[{\[]/.test(result) ? JSON.parse(result) : result;
  };
  await execute('registerDiscovery', () => client.writeContract({
    address: contractAddress, functionName: 'register_discovery',
    args: [DISCOVERY_ID, 'Heliosophia synthetic acceptance fixture', 'Synthetic structural benchmark: controlled acceptance fixture',
      sourceUrl, 'Across five seeds, backbone RMSD must be <= 1.26 Angstrom and compute reduction >= 38 percent on the synthetic target.', 80000, 2000],
    value: 0n, leaderOnly: false,
  }));
  const baseline = await read('get_discovery', [DISCOVERY_ID]);
  if (!progress.baselineState) progress.baselineState = baseline;
  assert.equal(baseline.id, DISCOVERY_ID);
  assert.equal(baseline.preprint_sha256, digest(fs.readFileSync('public/evidence/preprint.txt')));
  await execute('submitReplicationProof', () => client.writeContract({
    address: contractAddress, functionName: 'submit_replication_proof',
    args: [DISCOVERY_ID, 'Heliosophia controlled integration fixture', telemetryUrl,
      'Synthetic integration-test measurements only. Check all five runs against both limits. No real laboratory affiliation or scientific validation is claimed.'],
    value: 0n, leaderOnly: false,
  }));
  const state = await read('get_discovery', [DISCOVERY_ID]);
  const audit = await read('get_replication_log', [DISCOVERY_ID, 1]);
  assert.equal(Number(await read('get_discovery_count')), 1);
  assert.equal(state.status, 'REPLICATED_VERIFIED');
  assert.equal(state.replication_count, 1);
  assert.equal(state.epistemic_confidence_bps, 9550);
  assert.equal(state.author_royalty_released, 64000);
  assert.equal(state.replicator_royalty_released, 16000);
  assert.equal(state.last_telemetry_sha256, digest(fs.readFileSync('public/evidence/replication.json')));
  assert.equal(audit.verdict, 'REPLICATED_WITHIN_TOLERANCE');
  assert.equal(audit.telemetry_sha256, state.last_telemetry_sha256);
  const config = {
    mode: 'LIVE_STUDIONET_ONCHAIN_BOUND', network: 'GenLayer Stable Studionet', chainId: CHAIN_ID,
    rpcUrl: RPC_URL, contractAddress, deployerAddress: progress.deployerAddress,
    transactions: progress.transactions, lastOnchainState: state, updatedAt: new Date().toISOString(),
    notice: 'Stable Studionet 61999: deployment and both writes finalized successfully. Evidence uses a clearly labelled synthetic acceptance fixture. Royalty amounts are accounting entries; no USDC is held or transferred. The interactive workbench remains the original local demonstration.',
  };
  const proof = {...config, sourceSha256, evidenceRef: ref, receipts: progress.receipts,
    baselineState: progress.baselineState, replicationAudit: audit, rpcPreflight: progress.rpcPreflight,
    verification: {contractCount: 1, sourceDigestMatched: true, telemetryDigestMatched: true, allWritesFinalized: true,
      accountingOnly: true, scientificEvidenceType: 'SYNTHETIC_ACCEPTANCE_FIXTURE'}};
  fs.writeFileSync('src/config/deployment.json', json(config));
  fs.writeFileSync('onchain-deployment-proof.json', json(proof));
  progress.complete = true;
  saveProgress();
  console.log('Verified:', contractAddress, json(progress.transactions));
}

main().catch(error => {
  saveProgress();
  console.error(error.shortMessage ?? error.message);
  process.exitCode = 1;
});
