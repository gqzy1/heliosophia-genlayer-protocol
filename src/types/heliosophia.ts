export type NoveltyTier = 'BREAKTHROUGH' | 'INCREMENTAL_VALIDATED' | 'DERIVATIVE';

export type ReplicationVerdict =
  | 'REPLICATED_WITHIN_TOLERANCE'
  | 'PARTIAL_CONVERGENCE'
  | 'REPLICATION_REFUTED';

export type WalletSignerMode = 'DISCONNECTED' | 'METAMASK_EIP1193' | 'STUDIONET_SDK_SIGNER';

export interface WalletConnectionState {
  connected: boolean;
  mode: WalletSignerMode;
  address: string | null;
  chainIdDecimal: number | null;
  statusMessage: string;
}

export type OnChainLifecyclePhase =
  | 'IDLE'
  | 'CONNECTING_WALLET'
  | 'SIGNING_AND_SUBMITTING'
  | 'PENDING_PROPOSING'
  | 'COMMITTING_EQUIVALENCE'
  | 'ACCEPTED'
  | 'FINALIZED'
  | 'READBACK_VERIFIED'
  | 'ERROR';

export interface OnChainTransactionLifecycle {
  phase: OnChainLifecyclePhase;
  functionName: 'register_discovery' | 'submit_replication_proof' | 'deployContract' | null;
  discoveryId: string | null;
  txHash: string | null;
  receiptStatus: string | null;
  readbackDataJson: string | null;
  errorMessage: string | null;
  updatedAtIso: string | null;
}

export interface EpistemicValidator {
  id: string;
  designation: string;
  modelArchitecture: string;
  provider: string;
  epistemicRole: 'SYNTHESIS_CHAIR' | 'EMPIRICAL_AUDITOR' | 'STATISTICAL_ARBITER';
  stakeGen: number;
  domainSpecialtyEn: string;
  domainSpecialtyZh: string;
  phaseAngleRad: number;
  harmonicRadius: number;
}

export interface ScientificDiscovery {
  id: string;
  folioNumber: string;
  domainEn: string;
  domainZh: string;
  titleEn: string;
  titleZh: string;
  leadAuthor: string;
  institutionEn: string;
  institutionZh: string;
  preprintUrl: string;
  preprintSha256: string;
  targetMetricClauseEn: string;
  targetMetricClauseZh: string;
  royaltyPoolUsdc: number;
  replicatorShareBps: number;
  noveltyTier: NoveltyTier;
  initialEciBps: number;
  verifiedEciBps: number;
  refutedEciBps: number;
  baselineMetricValue: number;
  baselineMetricUnit: string;
  tolerancePlusMinus: number;
  replicatedMetricValue: number;
  refutedMetricValue: number;
  replicationLabEn: string;
  replicationLabZh: string;
  replicationTelemetryUrl: string;
  replicationTelemetrySha256: string;
  replicationTelemetryJson: string;
  refutationTelemetryJson: string;
  synthesisSummaryEn: string;
  synthesisSummaryZh: string;
  auditConclusionVerifiedEn: string;
  auditConclusionVerifiedZh: string;
  auditConclusionRefutedEn: string;
  auditConclusionRefutedZh: string;
}
