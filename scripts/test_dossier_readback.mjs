/** Steward check 3: exported dossier values come from the FINALIZED get_discovery readback.
 * Compiles src/utils/dossier.ts with the repo's own TypeScript (no new dependency)
 * and asserts the dossier builder's contract: success / partial / refuted, plus
 * refusal before any FINALIZED readback. Run with: npm run test:dossier
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'heliosophia-dossier-test-'));
try {
  execFileSync(
    path.join(repo, 'node_modules/.bin/tsc'),
    ['src/utils/dossier.ts', '--module', 'nodenext', '--target', 'es2022', '--outDir', tmp],
    { cwd: repo, stdio: 'inherit' },
  );
  const { buildDossierFromReadback, modeFromVerdict, parseReadback } = await import(
    path.join(tmp, 'dossier.js')
  );

  const network = { name: 'GenLayer Stable Studionet', chainId: 61999, rpcEndpoint: 'https://studio.genlayer.com/api' };
  const base = {
    discoveryId: 'HLS-2026-0104',
    txHash: '0x' + 'a'.repeat(64),
    receiptStatus: 'FINALIZED',
    lifecyclePhase: 'READBACK_VERIFIED',
    network,
    boundContractAddress: '0xf0C3D7e7a4c31fda6a07ED96575f15a8Ac86f240',
    connectedSigner: '0x855CDA44cd803770c2acD6Fa5e9d7DcCC8B4A223',
    title: 'Synthetic structural benchmark: controlled acceptance fixture',
    preprintUrl: 'https://raw.githubusercontent.com/gqzy1/heliosophia-genlayer-protocol/f9e37bf76a59ca17b4b75b8fb3822c95bbe8287e/public/evidence/preprint.txt',
    replicationTelemetryUrl: 'https://raw.githubusercontent.com/gqzy1/heliosophia-genlayer-protocol/f9e37bf76a59ca17b4b75b8fb3822c95bbe8287e/public/evidence/replication.json',
  };
  const readback = (overrides) => JSON.stringify({
    id: 'HLS-2026-0104',
    title: 'Synthetic structural benchmark: controlled acceptance fixture',
    preprint_url: base.preprintUrl,
    preprint_sha256: '10862ba20088193744a5a54de7ec3a6af682fe31b836262689f0cbda6f3128d6',
    novelty_tier: 'DERIVATIVE',
    epistemic_confidence_bps: 9550,
    royalty_pool_usdc: 80000,
    replicator_share_bps: 2000,
    status: 'REPLICATED_VERIFIED',
    replication_count: 1,
    author_royalty_released: 64000,
    replicator_royalty_released: 16000,
    last_verdict: 'REPLICATED_WITHIN_TOLERANCE',
    last_audit_conclusion: 'All five synthetic runs satisfy both the backbone RMSD and compute reduction requirements.',
    last_telemetry_sha256: 'af08c1ee58643c105427aedb00344a2b5cd44264dead55b495444f43e3b7dc3f',
    ...overrides,
  });

  // Success: every dossier field equals the readback field.
  const success = buildDossierFromReadback({ ...base, readbackJson: readback({}) });
  assert.equal(success.verdict, 'REPLICATED_WITHIN_TOLERANCE');
  assert.equal(success.status, 'REPLICATED_VERIFIED');
  assert.equal(success.success, true);
  assert.equal(success.epistemicConfidenceBps, 9550);
  assert.equal(success.preprintSha256, '10862ba20088193744a5a54de7ec3a6af682fe31b836262689f0cbda6f3128d6');
  assert.equal(success.replicationTelemetrySha256, 'af08c1ee58643c105427aedb00344a2b5cd44264dead55b495444f43e3b7dc3f');
  assert.equal(success.royaltyUnlockBpsByThisVerdict, 10000);
  assert.deepEqual(success.royaltySettlementUsdc, {
    totalPool: 80000, leadAuthorReleasedCumulative: 64000, replicatorLabReleasedCumulative: 16000,
  });
  assert.equal(success.onChainTransaction.txHash, base.txHash);
  assert.equal(success.onChainTransaction.receiptStatus, 'FINALIZED');

  // PARTIAL: distinct, ECI unchanged, nothing unlocked, never presented as success.
  const partial = buildDossierFromReadback({
    ...base,
    readbackJson: readback({
      epistemic_confidence_bps: 7600,
      status: 'CONTESTED_VARIANCE',
      author_royalty_released: 0,
      replicator_royalty_released: 0,
      last_verdict: 'PARTIAL_CONVERGENCE',
      last_audit_conclusion: 'Required measurements are missing; the claim can neither be confirmed nor refuted.',
    }),
  });
  assert.equal(partial.verdict, 'PARTIAL_CONVERGENCE');
  assert.equal(partial.status, 'CONTESTED_VARIANCE');
  assert.equal(partial.success, false);
  assert.equal(partial.epistemicConfidenceBps, 7600);
  assert.equal(partial.royaltyUnlockBpsByThisVerdict, 0);
  assert.deepEqual(partial.royaltySettlementUsdc, {
    totalPool: 80000, leadAuthorReleasedCumulative: 0, replicatorLabReleasedCumulative: 0,
  });
  assert.equal(modeFromVerdict('PARTIAL_CONVERGENCE'), 'PARTIAL');

  // Refuted: ECI slashed, nothing unlocked, never success.
  const refuted = buildDossierFromReadback({
    ...base,
    readbackJson: readback({
      epistemic_confidence_bps: 4100,
      status: 'REFUTED_SLASHED',
      author_royalty_released: 0,
      replicator_royalty_released: 0,
      last_verdict: 'REPLICATION_REFUTED',
    }),
  });
  assert.equal(refuted.verdict, 'REPLICATION_REFUTED');
  assert.equal(refuted.success, false);
  assert.equal(refuted.epistemicConfidenceBps, 4100);
  assert.equal(refuted.royaltyUnlockBpsByThisVerdict, 0);
  assert.equal(modeFromVerdict('REPLICATION_REFUTED'), 'REFUTED');
  assert.equal(modeFromVerdict('REPLICATED_WITHIN_TOLERANCE'), 'REPLICATED');

  // parseReadback: no readback -> null; malformed / unknown verdict -> throws.
  assert.equal(parseReadback(null), null);
  assert.equal(parseReadback(''), null);
  assert.throws(() => parseReadback('not json'), /not valid JSON/);
  assert.throws(() => parseReadback(readback({ last_verdict: 'MAYBE' })), /unknown verdict/);

  // Refusal: no readback, wrong phase, or wrong discovery -> no dossier at all.
  assert.throws(() => buildDossierFromReadback({ ...base, readbackJson: null }), /No FINALIZED readback/);
  assert.throws(() => buildDossierFromReadback({ ...base, readbackJson: readback({}), lifecyclePhase: 'FINALIZED' }), /No FINALIZED readback/);
  assert.throws(() => buildDossierFromReadback({ ...base, readbackJson: readback({ id: 'HLS-OTHER' }) }), /belongs to HLS-OTHER/);
  assert.throws(() => modeFromVerdict('MAYBE'), /Unknown replication verdict/);

  // Readback-only export: a plain get_discovery readback with no transaction
  // in this session is sufficient — this is how a reviewer verifies the
  // corrected flow without sending a transaction. The dossier says so.
  const readbackOnly = buildDossierFromReadback({
    ...base, readbackJson: readback({}), txHash: null, receiptStatus: null,
  });
  assert.equal(readbackOnly.verdict, 'REPLICATED_WITHIN_TOLERANCE');
  assert.equal(readbackOnly.epistemicConfidenceBps, 9550);
  assert.equal(readbackOnly.preprintSha256, '10862ba20088193744a5a54de7ec3a6af682fe31b836262689f0cbda6f3128d6');
  assert.equal(readbackOnly.onChainTransaction.txHash, null);
  assert.equal(readbackOnly.exportSource, 'FINALIZED get_discovery readback (no transaction in this session)');
  const fromSession = buildDossierFromReadback({ ...base, readbackJson: readback({}) });
  assert.equal(fromSession.exportSource, 'FINALIZED transaction in this session');

  console.log('dossier readback tests: PASS (success + partial + refuted + refusals)');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
