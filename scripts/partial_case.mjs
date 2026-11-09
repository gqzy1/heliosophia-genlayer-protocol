/** Real on-chain PARTIAL_CONVERGENCE case on Stable Studionet.
 * Registers a fresh discovery (the submitted HLS-2026-0104 stays untouched) and
 * submits the incomplete telemetry in public/evidence/replication-partial.json.
 * Expected readback: status CONTESTED_VARIANCE, last_verdict PARTIAL_CONVERGENCE,
 * epistemic_confidence_bps 7600 (unchanged), both royalty releases 0.
 * Signer is a fresh ephemeral account (GENLAYER_PRIVATE_KEY env or generated);
 * no key is written or logged. The telemetry file must already be on GitHub:
 *   node scripts/partial_case.mjs --evidence-ref <commit-sha>
 * Evidence is written to docs/evidence/partial-case.json.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { summarizeReceipt } from './studionet_receipt.mjs';

const RPC_URL = 'https://studio.genlayer.com/api';
const CHAIN_ID = 61999;
const CONTRACT = '0xf0C3D7e7a4c31fda6a07ED96575f15a8Ac86f240';
const DISCOVERY_ID = 'HLS-2026-1104-PARTIAL';
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const json = data => JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2) + '\n';

const refArg = process.argv.indexOf('--evidence-ref');
const ref = refArg >= 0 ? process.argv[refArg + 1] : process.env.HELIOSOPHIA_EVIDENCE_REF;
assert.match(ref || '', /^[a-f0-9]{40}$/, 'Supply --evidence-ref as the public evidence commit SHA');
const base = `https://raw.githubusercontent.com/gqzy1/heliosophia-genlayer-protocol/${ref}/public/evidence`;
const preprintUrl = 'https://raw.githubusercontent.com/gqzy1/heliosophia-genlayer-protocol/f9e37bf76a59ca17b4b75b8fb3822c95bbe8287e/public/evidence/preprint.txt';
const telemetryUrl = `${base}/replication-partial.json`;

async function main() {
  assert.equal(studionet.id, CHAIN_ID);
  const account = createAccount(process.env.GENLAYER_PRIVATE_KEY || undefined);
  const client = createClient({ chain: studionet, endpoint: RPC_URL, account });
  console.log('Network:', RPC_URL, 'Signer:', account.address);
  const chainId = await client.request({ method: 'eth_chainId', params: [] });
  assert.equal(Number(BigInt(chainId)), CHAIN_ID, 'Wrong chain; refusing to broadcast');
  const gasPrice = await client.request({ method: 'eth_gasPrice', params: [] });
  assert.equal(BigInt(gasPrice), 0n, 'Nonzero gas price; this case permits zero-cost Studio transactions only');

  for (const [name, url, local] of [
    ['preprint.txt', preprintUrl, 'public/evidence/preprint.txt'],
    ['replication-partial.json', telemetryUrl, 'public/evidence/replication-partial.json'],
  ]) {
    const response = await fetch(url);
    assert.equal(response.status, 200, `Evidence URL unavailable: ${name} (${url})`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(digest(bytes), digest(fs.readFileSync(local)), `Remote evidence does not match the checked-in fixture: ${name}`);
  }

  const read = async (method, args = []) => {
    const result = await client.readContract({ address: CONTRACT, functionName: method, args });
    return typeof result === 'string' && /^[{\[]/.test(result) ? JSON.parse(result) : result;
  };
  const existing = await client.readContract({ address: CONTRACT, functionName: 'get_discovery', args: [DISCOVERY_ID] });
  // Resumable: if a previous run already registered this discovery (FINALIZED)
  // but stopped before the replication proof, reuse it instead of registering
  // twice. Pass the register tx hash so the evidence stays complete:
  //   PARTIAL_REGISTER_TX=0x... node scripts/partial_case.mjs --evidence-ref <sha>
  let register;
  if (existing !== '{}') {
    const parsed = JSON.parse(existing);
    assert.equal(parsed.id, DISCOVERY_ID);
    assert.equal(parsed.replication_count, 0, `Discovery ${DISCOVERY_ID} already has a replication; pick a fresh id.`);
    assert.equal(parsed.status, 'OPEN_FOR_REPLICATION');
    const resumeHash = process.env.PARTIAL_REGISTER_TX || '';
    assert.match(resumeHash, /^0x[a-fA-F0-9]{64}$/, 'Discovery already registered: supply its FINALIZED register tx hash as PARTIAL_REGISTER_TX to resume.');
    const tx = await client.getTransaction({ hash: resumeHash });
    assert.ok(tx, `Register tx ${resumeHash} not found on-chain.`);
    register = { hash: resumeHash, receipt: summarizeReceipt(tx, resumeHash) };
    assert.equal(register.receipt.status, 'FINALIZED');
    console.log('Resume registerDiscovery', resumeHash);
  }

  async function execute(name, submit) {
    const hash = await submit();
    console.log(name, hash);
    let lastStatus;
    for (let attempt = 0; attempt < 240; attempt++) {
      const tx = await client.getTransaction({ hash });
      if (tx) {
        const summary = summarizeReceipt(tx, hash);
        if (summary.status !== lastStatus) console.log(name, summary.status, summary.executionResult ?? '');
        lastStatus = summary.status;
        if (['CANCELED', 'UNDETERMINED', 'LEADER_TIMEOUT', 'VALIDATORS_TIMEOUT'].includes(summary.status)) {
          throw new Error(`${name} failed: ${json(summary)}`);
        }
        if (summary.status === 'FINALIZED') {
          assert.equal(summary.successful, true, `${name} execution did not succeed: ${json(summary)}`);
          return { hash, receipt: summary };
        }
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    throw new Error(`Tracking timed out for ${hash}. Resume this same hash; do not submit a duplicate.`);
  }

  if (!register) {
    register = await execute('registerDiscovery', () => client.writeContract({
      address: CONTRACT, functionName: 'register_discovery',
      args: [DISCOVERY_ID, 'Heliosophia synthetic acceptance fixture',
        'Synthetic structural benchmark: controlled acceptance fixture (PARTIAL case)',
        preprintUrl, 'Across five seeds, backbone RMSD must be <= 1.26 Angstrom and compute reduction >= 38 percent on the synthetic target.',
        80000, 2000],
      value: 0n, leaderOnly: false,
    }));
  }
  const baseline = await read('get_discovery', [DISCOVERY_ID]);
  assert.equal(baseline.id, DISCOVERY_ID);
  assert.equal(baseline.epistemic_confidence_bps, 7600);
  assert.equal(baseline.status, 'OPEN_FOR_REPLICATION');

  const replication = await execute('submitReplicationProof', () => client.writeContract({
    address: CONTRACT, functionName: 'submit_replication_proof',
    args: [DISCOVERY_ID, 'Heliosophia controlled integration fixture', telemetryUrl,
      'PARTIAL case: only two of five seeds reported; compute_reduction missing entirely. Expected PARTIAL_CONVERGENCE.'],
    value: 0n, leaderOnly: false,
  }));
  const state = await read('get_discovery', [DISCOVERY_ID]);
  const audit = await read('get_replication_log', [DISCOVERY_ID, 1]);
  assert.equal(state.status, 'CONTESTED_VARIANCE');
  assert.equal(state.last_verdict, 'PARTIAL_CONVERGENCE');
  assert.equal(state.epistemic_confidence_bps, 7600);
  assert.equal(state.author_royalty_released, 0);
  assert.equal(state.replicator_royalty_released, 0);
  assert.equal(state.replication_count, 1);
  assert.equal(audit.verdict, 'PARTIAL_CONVERGENCE');

  const evidence = {
    case: 'PARTIAL_CONVERGENCE on-chain case',
    network: 'GenLayer Stable Studionet', chainId: CHAIN_ID, rpcUrl: RPC_URL,
    contractAddress: CONTRACT, discoveryId: DISCOVERY_ID, replicationSignerAddress: account.address,
    evidenceRef: ref, preprintUrl, telemetryUrl,
    transactions: { registerDiscovery: register.hash, submitReplicationProof: replication.hash },
    receipts: { registerDiscovery: register.receipt, submitReplicationProof: replication.receipt },
    baselineState: baseline, lastOnchainState: state, replicationAudit: audit,
    assertions: {
      status: 'CONTESTED_VARIANCE', last_verdict: 'PARTIAL_CONVERGENCE',
      epistemic_confidence_bps: 7600, author_royalty_released: 0, replicator_royalty_released: 0,
      replication_count: 1,
    },
    updatedAt: new Date().toISOString(),
  };
  fs.mkdirSync('docs/evidence', { recursive: true });
  fs.writeFileSync('docs/evidence/partial-case.json', json(evidence));
  console.log('PARTIAL case verified:', JSON.stringify(evidence.assertions));
}

main().catch(error => {
  console.error(error.shortMessage ?? error.message);
  process.exitCode = 1;
});
