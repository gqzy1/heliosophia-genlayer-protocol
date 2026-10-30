export type NoveltyTier = 'BREAKTHROUGH' | 'INCREMENTAL_VALIDATED' | 'DERIVATIVE';

export type ReplicationVerdict =
  | 'REPLICATED_WITHIN_TOLERANCE'
  | 'PARTIAL_CONVERGENCE'
  | 'REPLICATION_REFUTED';

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
