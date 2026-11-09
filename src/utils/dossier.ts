/**
 * Dossier values come ONLY from a FINALIZED `get_discovery` readback.
 *
 * This module is the single place where a displayed or exported verdict, ECI,
 * digest, telemetry hash, status or allocation is derived. It takes the raw
 * readback JSON string (plus the FINALIZED transaction that produced it) and
 * nothing else: no static discovery data, no local simulation state, no
 * locally computed payout. Anything that cannot be read from the readback is
 * reported as unconfirmed by the caller, never filled in from a fallback.
 *
 * Verdicts are exhaustive. PARTIAL_CONVERGENCE is a distinct outcome: the ECI
 * is unchanged, nothing is unlocked by that verdict, and the dossier must
 * never present it as a success.
 */

export type ReadbackVerdict =
  | 'REPLICATED_WITHIN_TOLERANCE'
  | 'PARTIAL_CONVERGENCE'
  | 'REPLICATION_REFUTED';

export interface ReadbackRecord {
  id: string;
  title?: string;
  preprint_url?: string;
  preprint_sha256: string;
  novelty_tier?: string;
  epistemic_confidence_bps: number;
  royalty_pool_usdc: number;
  replicator_share_bps: number;
  status: string;
  replication_count: number;
  author_royalty_released: number;
  replicator_royalty_released: number;
  last_verdict: ReadbackVerdict | string;
  last_audit_conclusion?: string;
  last_telemetry_sha256?: string;
}

const VERDICTS: ReadonlySet<string> = new Set([
  'REPLICATED_WITHIN_TOLERANCE',
  'PARTIAL_CONVERGENCE',
  'REPLICATION_REFUTED',
]);

/** Parse a `get_discovery` readback JSON string. Returns null when there is no readback yet. Throws on malformed or incomplete readback. */
export function parseReadback(readbackJson: string | null | undefined): ReadbackRecord | null {
  if (!readbackJson) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readbackJson);
  } catch {
    throw new Error('Readback is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Readback is not a discovery record.');
  const record = parsed as Partial<ReadbackRecord>;
  if (typeof record.id !== 'string' || !record.id) throw new Error('Readback has no discovery id.');
  if (typeof record.preprint_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(record.preprint_sha256)) {
    throw new Error('Readback has no valid preprint SHA-256 digest.');
  }
  if (typeof record.epistemic_confidence_bps !== 'number') {
    throw new Error('Readback has no epistemic confidence (ECI) value.');
  }
  if (typeof record.last_verdict !== 'string' || !VERDICTS.has(record.last_verdict)) {
    throw new Error(`Readback has an unknown verdict: ${String(record.last_verdict)}.`);
  }
  if (typeof record.author_royalty_released !== 'number' || typeof record.replicator_royalty_released !== 'number') {
    throw new Error('Readback has no royalty release values.');
  }
  return record as ReadbackRecord;
}

/** Map a readback verdict to a UI mode. Exhaustive: any other value throws instead of defaulting to success. */
export function modeFromVerdict(verdict: string): 'REPLICATED' | 'PARTIAL' | 'REFUTED' {
  switch (verdict) {
    case 'REPLICATED_WITHIN_TOLERANCE':
      return 'REPLICATED';
    case 'PARTIAL_CONVERGENCE':
      return 'PARTIAL';
    case 'REPLICATION_REFUTED':
      return 'REFUTED';
    default:
      throw new Error(`Unknown replication verdict: ${verdict}.`);
  }
}

/** Royalty unlock caused by this verdict alone. Only a success unlocks anything. */
export function unlockBpsForVerdict(verdict: string): number {
  return verdict === 'REPLICATED_WITHIN_TOLERANCE' ? 10000 : 0;
}

export interface DossierInput {
  readbackJson: string | null | undefined;
  discoveryId: string;
  txHash: string | null | undefined;
  receiptStatus: string | null | undefined;
  lifecyclePhase: string | null | undefined;
  network: { name: string; chainId: number; rpcEndpoint: string };
  boundContractAddress: string | null;
  connectedSigner: string | null;
  title: string;
  preprintUrl: string;
  replicationTelemetryUrl: string;
}

export interface Dossier {
  protocol: string;
  network: {
    name: string;
    chainId: number;
    rpcEndpoint: string;
    boundContractAddress: string | null;
    connectedSigner: string | null;
  };
  onChainTransaction: {
    txHash: string;
    receiptStatus: string;
    lifecyclePhase: string;
    readbackDataJson: string;
  };
  discoveryFolio: string;
  title: string;
  preprintUrl: string;
  /** From readback only. */
  preprintSha256: string;
  replicationTelemetryUrl: string;
  /** From readback only; null when no replication has been read back. */
  replicationTelemetrySha256: string | null;
  equivalenceModes: {
    registration: string;
    replicationAudit: string;
  };
  verdict: ReadbackVerdict;
  status: string;
  success: boolean;
  epistemicConfidenceBps: number;
  royaltyUnlockBpsByThisVerdict: number;
  royaltySettlementUsdc: {
    totalPool: number;
    /** Cumulative amounts released so far, as read back. Not "released by this verdict". */
    leadAuthorReleasedCumulative: number;
    replicatorLabReleasedCumulative: number;
  };
  timestampIso: string;
}

/**
 * Build the exported epistemic dossier from a FINALIZED readback.
 * Throws (and the caller must not download anything) when there is no
 * FINALIZED readback, when the readback belongs to another discovery, or
 * when any readback field is missing or unknown.
 */
export function buildDossierFromReadback(input: DossierInput): Dossier {
  if (input.lifecyclePhase !== 'READBACK_VERIFIED') {
    throw new Error('No FINALIZED readback yet. Export is disabled until get_discovery has been read back.');
  }
  if (!input.txHash || input.receiptStatus !== 'FINALIZED') {
    throw new Error('No FINALIZED transaction yet. Export is disabled until the transaction is FINALIZED.');
  }
  const record = parseReadback(input.readbackJson);
  if (!record) throw new Error('No FINALIZED readback yet. Export is disabled until get_discovery has been read back.');
  if (record.id !== input.discoveryId) {
    throw new Error(`Readback belongs to ${record.id}, not ${input.discoveryId}.`);
  }
  const verdict = record.last_verdict as ReadbackVerdict;
  return {
    protocol: 'HELIOSOPHIA // Epistemic Reproducibility & IP Royalty Ledger v2.0',
    network: {
      name: input.network.name,
      chainId: input.network.chainId,
      rpcEndpoint: input.network.rpcEndpoint,
      boundContractAddress: input.boundContractAddress,
      connectedSigner: input.connectedSigner,
    },
    onChainTransaction: {
      txHash: input.txHash,
      receiptStatus: input.receiptStatus,
      lifecyclePhase: input.lifecyclePhase,
      readbackDataJson: input.readbackJson as string,
    },
    discoveryFolio: record.id,
    title: input.title,
    preprintUrl: input.preprintUrl,
    preprintSha256: record.preprint_sha256,
    replicationTelemetryUrl: input.replicationTelemetryUrl,
    replicationTelemetrySha256: record.last_telemetry_sha256 ?? null,
    equivalenceModes: {
      registration: 'gl.eq_principle.prompt_non_comparative',
      replicationAudit: 'gl.eq_principle.prompt_comparative',
    },
    verdict,
    status: record.status,
    success: verdict === 'REPLICATED_WITHIN_TOLERANCE',
    epistemicConfidenceBps: record.epistemic_confidence_bps,
    royaltyUnlockBpsByThisVerdict: unlockBpsForVerdict(verdict),
    royaltySettlementUsdc: {
      totalPool: record.royalty_pool_usdc,
      leadAuthorReleasedCumulative: record.author_royalty_released,
      replicatorLabReleasedCumulative: record.replicator_royalty_released,
    },
    timestampIso: new Date().toISOString(),
  };
}
