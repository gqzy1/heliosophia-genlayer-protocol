import { EpistemicValidator, ScientificDiscovery } from '../types/heliosophia';

export const EPISTEMIC_VALIDATOR_COMMITTEE: EpistemicValidator[] = [
  {
    id: 'VAL-ZURICH-01',
    designation: 'Kepler-Alpha',
    modelArchitecture: 'Claude-3.7-Sonnet (Reasoning)',
    provider: 'Anthropic',
    epistemicRole: 'SYNTHESIS_CHAIR',
    stakeGen: 54000,
    domainSpecialtyEn: 'Prior-Art Methodology Synthesis & Mathematical Proof Auditing',
    domainSpecialtyZh: '先验文献方法论综合与数学证明审计',
    phaseAngleRad: 0.35,
    harmonicRadius: 0.52,
  },
  {
    id: 'VAL-GENEVA-02',
    designation: 'Euler-Prime',
    modelArchitecture: 'DeepSeek-R1-671B',
    provider: 'DeepSeek',
    epistemicRole: 'EMPIRICAL_AUDITOR',
    stakeGen: 49500,
    domainSpecialtyEn: 'Statistical Variance & Confidence Interval Telemetry Verification',
    domainSpecialtyZh: '统计方差与置信区间遥测核验',
    phaseAngleRad: 1.55,
    harmonicRadius: 0.52,
  },
  {
    id: 'VAL-BASEL-03',
    designation: 'Paracelsus-V',
    modelArchitecture: 'Gemini-2.5-Pro',
    provider: 'Google',
    epistemicRole: 'EMPIRICAL_AUDITOR',
    stakeGen: 58200,
    domainSpecialtyEn: 'Long-Context Preprint & Structural Biology Dataset Cross-Check',
    domainSpecialtyZh: '超长上下文预印本与结构生物学数据集交叉比对',
    phaseAngleRad: 2.75,
    harmonicRadius: 0.52,
  },
  {
    id: 'VAL-OXFORD-04',
    designation: 'Noether-70B',
    modelArchitecture: 'Llama-3.3-70B-Instruct',
    provider: 'Meta',
    epistemicRole: 'STATISTICAL_ARBITER',
    stakeGen: 36800,
    domainSpecialtyEn: 'Canonical JSON Schema Enforcement & SHA-256 Digest Commitment',
    domainSpecialtyZh: '规范化 JSON 结构强制与 SHA-256 摘要锚定',
    phaseAngleRad: 3.95,
    harmonicRadius: 0.52,
  },
  {
    id: 'VAL-KYOTO-05',
    designation: 'Yukawa-Q',
    modelArchitecture: 'GPT-4o-2026',
    provider: 'OpenAI',
    epistemicRole: 'STATISTICAL_ARBITER',
    stakeGen: 51000,
    domainSpecialtyEn: 'Materials Science & Condensed-Matter Telemetry Anomaly Detection',
    domainSpecialtyZh: '材料科学与凝聚态物理遥测异常检测',
    phaseAngleRad: 5.15,
    harmonicRadius: 0.52,
  },
];

export const SCIENTIFIC_DISCOVERIES: ScientificDiscovery[] = [
  {
    id: 'HLS-2026-0104',
    folioNumber: 'FOLIO // I-0104',
    domainEn: 'Computational Structural Biology',
    domainZh: '计算结构生物学与蛋白质折叠',
    titleEn: 'Sub-Quadratic State-Space Protein Folding with Zero-Shot Allosteric Binding',
    titleZh: '亚二次复杂度状态空间蛋白质折叠与零样本变构结合预测',
    leadAuthor: '0x81C4...90E2',
    institutionEn: 'ETH Zurich / MIT Computational Biophysics Consortium',
    institutionZh: '苏黎世联邦理工 / 麻省理工计算生物物理联合实验室',
    preprintUrl: 'https://arxiv.org/html/2609.04182v1',
    preprintSha256: '4b9c8e12f0a54d7781c3a90e2b147f63829104c5d6e7f8a9b0c1d2e3f4a5b6c7',
    targetMetricClauseEn:
      'Independent replication on CASP16 target T1124 must achieve backbone RMSD <= 1.26 Angstrom (baseline claim: 1.18 A +/- 0.08 A) while reducing inference FLOPs by at least 38.0% relative to AlphaFold-3 baseline.',
    targetMetricClauseZh:
      '在 CASP16 靶点 T1124 上的独立复现必须达到主链 RMSD <= 1.26 埃（原论文声称值：1.18 埃 +/- 0.08 埃容差），且相对于 AlphaFold-3 基线降低至少 38.0% 的推理浮点运算量（FLOPs）。',
    royaltyPoolUsdc: 80000,
    replicatorShareBps: 2000,
    noveltyTier: 'BREAKTHROUGH',
    initialEciBps: 7600,
    verifiedEciBps: 9550,
    refutedEciBps: 4100,
    baselineMetricValue: 1.18,
    baselineMetricUnit: 'Å RMSD',
    tolerancePlusMinus: 0.08,
    replicatedMetricValue: 1.21,
    refutedMetricValue: 2.84,
    replicationLabEn: 'Max Planck & ETH Independent Bio-Compute Verification Node',
    replicationLabZh: '马克斯·普朗克与苏黎世独立生物计算验证节点',
    replicationTelemetryUrl: 'https://telemetry.eth-zurich-biolab.ch/runs/casp16-t1124-repro.json',
    replicationTelemetrySha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    replicationTelemetryJson: JSON.stringify(
      {
        folio_id: 'HLS-2026-0104',
        benchmark_target: 'CASP16-T1124-Allosteric',
        hardware_cluster: '8x NVIDIA H200 SXM (Deterministic Seed 42..46)',
        claimed_backbone_rmsd_angstrom: 1.18,
        observed_backbone_rmsd_angstrom: 1.21,
        allowed_ceiling_angstrom: 1.26,
        flop_reduction_pct: 40.9,
        required_flop_reduction_pct: 38.0,
        p_value: 0.00014,
        reproducible: true,
      },
      null,
      2
    ),
    refutationTelemetryJson: JSON.stringify(
      {
        folio_id: 'HLS-2026-0104',
        benchmark_target: 'CASP16-T1124-Allosteric',
        observed_backbone_rmsd_angstrom: 2.84,
        allowed_ceiling_angstrom: 1.26,
        flop_reduction_pct: 11.2,
        anomaly_detected: 'Training-set template leakage detected in holo-structure weights',
        reproducible: false,
      },
      null,
      2
    ),
    synthesisSummaryEn:
      'GenVM Non-Comparative Synthesis indexed 38 pages of preprint equations & benchmark logs: replaces cubic triangle-attention with bidirectional Mamba-3 geometric operators.',
    synthesisSummaryZh:
      'GenVM 非比较式等价原则已索引 38 页预印本方程与基准日志：通过双向状态空间几何算子替代传统三次方三角注意力机制。',
    auditConclusionVerifiedEn:
      'Observed 1.21 Å RMSD lies strictly within the [1.10 Å, 1.26 Å] confidence corridor (+0.03 Å drift) with 40.9% FLOP savings. Epistemic Confidence upgraded to 95.50%; 64,000 USDC released to Lead Authors and 16,000 USDC to Replicator Lab.',
    auditConclusionVerifiedZh:
      '独立实测 1.21 Å RMSD 严格落在 [1.10 Å, 1.26 Å] 置信走廊内（仅偏差 +0.03 Å），且算力节省达 40.9%。认知置信度（ECI）提升至 95.50%；自动向原作者释放 64,000 USDC 版税，向复现实验室发放 16,000 USDC 激励。',
    auditConclusionRefutedEn:
      'Observed 2.84 Å RMSD violates the 1.26 Å falsifiability threshold due to template weight leakage. Epistemic Confidence slashed to 41.00%; Author royalty locked and whistleblowing bounty allocated to Auditor.',
    auditConclusionRefutedZh:
      '实测 RMSD 高达 2.84 Å，突破 1.26 Å 可证伪红线（检出训练集模板权重泄漏）。认知置信度被罚没至 41.00%；冻结原作者版税并将审计赏金划拨给证伪实验室。',
  },
  {
    id: 'HLS-2026-0188',
    folioNumber: 'FOLIO // II-0188',
    domainEn: 'Solid-State Electrochemistry & Grid Storage',
    domainZh: '固态电化学与长时储能材料',
    titleEn: 'Dendrite-Free Sodium-Sulfur Solid Electrolyte at 1,200 Cycles (25°C)',
    titleZh: '室温 1,200 次循环零枝晶钠硫固态电解质界面相',
    leadAuthor: '0x39A1...77C8',
    institutionEn: 'Delft & Fraunhofer Solid-State Ionics Laboratory',
    institutionZh: '代尔夫特理工与弗劳恩霍夫固态离子学联合实验室',
    preprintUrl: 'https://chemrxiv.org/engage/chemrxiv/article-details/6712a98b012',
    preprintSha256: '7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
    targetMetricClauseEn:
      'Maintain >= 91.5% capacity retention after 1,200 cycles at 2C rate (25°C ambient) with interfacial impedance growth <= 4.2 Ohm*cm2 verified via electrochemical impedance spectroscopy (EIS).',
    targetMetricClauseZh:
      '在 25°C 室温、2C 倍率下完成 1,200 次充放电循环后容量保持率 >= 91.5%，且电化学阻抗谱（EIS）测得的界面阻抗增长不超过 4.2 Ohm*cm2。',
    royaltyPoolUsdc: 125000,
    replicatorShareBps: 2400,
    noveltyTier: 'BREAKTHROUGH',
    initialEciBps: 7400,
    verifiedEciBps: 9420,
    refutedEciBps: 3850,
    baselineMetricValue: 92.8,
    baselineMetricUnit: '% Retention',
    tolerancePlusMinus: 1.3,
    replicatedMetricValue: 92.1,
    refutedMetricValue: 74.6,
    replicationLabEn: 'Argonne & PSI Independent Battery Cyclers Consortium',
    replicationLabZh: '阿贡与保罗谢勒研究所独立电化学循环测试联盟',
    replicationTelemetryUrl: 'https://telemetry.psi-electrochem.ch/eis/na-s-1200c-audit.json',
    replicationTelemetrySha256: '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    replicationTelemetryJson: JSON.stringify(
      {
        folio_id: 'HLS-2026-0188',
        test_protocol: '1200-Cycle-2C-25C-EIS',
        claimed_retention_pct: 92.8,
        observed_retention_pct: 92.1,
        minimum_required_pct: 91.5,
        interfacial_impedance_delta_ohm_cm2: 3.74,
        max_allowed_impedance_ohm_cm2: 4.2,
        reproducible: true,
      },
      null,
      2
    ),
    refutationTelemetryJson: JSON.stringify(
      {
        folio_id: 'HLS-2026-0188',
        test_protocol: '1200-Cycle-2C-25C-EIS',
        observed_retention_pct: 74.6,
        interfacial_impedance_delta_ohm_cm2: 19.8,
        failure_mode: 'Micro-short circuit via Na dendrite penetration at cycle 640',
        reproducible: false,
      },
      null,
      2
    ),
    synthesisSummaryEn:
      'GenVM indexed crystallographic XRD tables and oxysulfide doping stoichiometry; locks falsifiable EIS impedance and cycle retention thresholds on-chain.',
    synthesisSummaryZh:
      'GenVM 已提取晶体学 XRD 表征与硫氧化物掺杂化学计量比，将可证伪的 EIS 阻抗与循环保持率阈值锚定上链。',
    auditConclusionVerifiedEn:
      'Independent cycler telemetry confirms 92.1% retention at cycle 1,200 and 3.74 Ohm*cm2 EIS delta. Royalty pool unlocked: 95,000 USDC to Patent Authors, 30,000 USDC to Replication Consortium.',
    auditConclusionVerifiedZh:
      '独立充放电遥测证实 1,200 次循环后容量保持率达 92.1%，阻抗增幅仅 3.74 Ohm*cm2。工业专利池自动解锁：向专利作者拨付 95,000 USDC，向复现联盟拨付 30,000 USDC。',
    auditConclusionRefutedEn:
      'EIS telemetry revealed dendrite short-circuit at cycle 640 (74.6% retention). Epistemic Confidence slashed to 38.50%; licensing pool frozen.',
    auditConclusionRefutedZh:
      'EIS 遥测显示第 640 次循环出现钠枝晶微短路（容量跌至 74.6%）。认知置信度下调至 38.50%，工业授权资金池冻结。',
  },
  {
    id: 'HLS-2026-0245',
    folioNumber: 'FOLIO // III-0245',
    domainEn: 'Zero-Knowledge Cryptography & Formal Systems',
    domainZh: '零知识密码学与形式化验证系统',
    titleEn: 'Linear-Time Prover Folding over Goldilocks-3 Field Without Trusted Setup',
    titleZh: '基于 Goldilocks-3 域的无可信设置线性时间折叠证明器',
    leadAuthor: '0x62E9...14B0',
    institutionEn: 'Ecole Polytechnique & Technion Applied Cryptography Group',
    institutionZh: '巴黎综合理工与以色列理工应用密码学研究组',
    preprintUrl: 'https://eprint.iacr.org/2026/1492',
    preprintSha256: 'c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
    targetMetricClauseEn:
      'Prove 2^20 R1CS constraints on 16-core ARM64 in <= 1,450 ms with proof size <= 34.0 KB and 128-bit soundness verified in Lean-4 formal proof check.',
    targetMetricClauseZh:
      '在 16 核 ARM64 架构上对 2^20 规模 R1CS 约束生成证明耗时 <= 1,450 ms，证明体积 <= 34.0 KB，且通过 Lean-4 形式化可靠性检验（128-bit 安全强度）。',
    royaltyPoolUsdc: 95000,
    replicatorShareBps: 1800,
    noveltyTier: 'BREAKTHROUGH',
    initialEciBps: 7900,
    verifiedEciBps: 9780,
    refutedEciBps: 4300,
    baselineMetricValue: 1380,
    baselineMetricUnit: 'ms Prover',
    tolerancePlusMinus: 70,
    replicatedMetricValue: 1412,
    refutedMetricValue: 3190,
    replicationLabEn: 'zkVerify & Inria Formal Methods Benchmarking Cluster',
    replicationLabZh: 'zkVerify 与法国国家信息与自动化研究所形式化基准集群',
    replicationTelemetryUrl: 'https://benchmarks.zkverify-inria.fr/2026-1492/arm64-lean4.json',
    replicationTelemetrySha256: '5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a',
    replicationTelemetryJson: JSON.stringify(
      {
        folio_id: 'HLS-2026-0245',
        constraints_power_of_two: 20,
        claimed_prover_ms: 1380,
        observed_prover_ms: 1412,
        ceiling_prover_ms: 1450,
        proof_size_kb: 31.8,
        lean4_kernel_check: 'SOUNDNESS_128BIT_VERIFIED',
        reproducible: true,
      },
      null,
      2
    ),
    refutationTelemetryJson: JSON.stringify(
      {
        folio_id: 'HLS-2026-0245',
        observed_prover_ms: 3190,
        lean4_kernel_check: 'SOUNDNESS_GAP_AT_FOLDING_CHALLENGE_ROUND_3',
        reproducible: false,
      },
      null,
      2
    ),
    synthesisSummaryEn:
      'GenVM extracted sumcheck polynomial commitment bounds and Lean-4 theorem signatures from IACR ePrint 2026/1492.',
    synthesisSummaryZh:
      'GenVM 已从 IACR ePrint 2026/1492 提取和检验多项式承诺复杂度上界与 Lean-4 定理签名。',
    auditConclusionVerifiedEn:
      '1,412 ms prover time and 31.8 KB proof size verified with zero sorry axioms in Lean-4 kernel. ECI reaches 97.80%; 77,900 USDC to Authors, 17,100 USDC to Formal Verifiers.',
    auditConclusionVerifiedZh:
      '实测证明耗时 1,412 ms、体积 31.8 KB，且 Lean-4 内核零未证公理通过。认知置信度达 97.80%；向作者释放 77,900 USDC，向形式化验证节点释放 17,100 USDC。',
    auditConclusionRefutedEn:
      'Lean-4 kernel flagged grinding vulnerability in round-3 folding challenge; prover fallback took 3,190 ms. Claim refuted.',
    auditConclusionRefutedZh:
      'Lean-4 内核检出第 3 轮折叠挑战存在磨削攻击漏洞，补丁后耗时退化至 3,190 ms，原复杂度声称被证伪。',
  },
];
