import React, { useState } from 'react';
import { ScientificDiscovery } from '../types/heliosophia';
import { soundInstrument } from '../audio/mechanicalSound';
import { STUDIONET_CHAIN_CONFIG } from '../config/studionet';

interface Props {
  discovery: ScientificDiscovery;
  auditStage: number;
  auditMode: 'REPLICATED' | 'REFUTED';
  onRunAudit: (mode: 'REPLICATED' | 'REFUTED') => void;
  onRegisterCustomDiscovery: (custom: ScientificDiscovery) => void;
  lang: 'en' | 'zh';
  boundContractAddress: string | null;
}

export const ReplicationWorkbench: React.FC<Props> = ({
  discovery,
  auditStage,
  auditMode,
  onRunAudit,
  onRegisterCustomDiscovery,
  lang,
  boundContractAddress,
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('https://arxiv.org/abs/2610.09941');
  const [customClause, setCustomClause] = useState(
    'Independent replication must achieve perplexity <= 5.42 on FineWeb-100B benchmark with >= 25% memory reduction.'
  );
  const [customPool, setCustomPool] = useState('60000');
  const [customShareBps, setCustomShareBps] = useState('2000');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const authorPayout =
    auditStage >= 4 && auditMode === 'REPLICATED'
      ? Math.round((discovery.royaltyPoolUsdc * (10000 - discovery.replicatorShareBps)) / 10000)
      : 0;
  const replicatorPayout =
    auditStage >= 4 && auditMode === 'REPLICATED'
      ? Math.round((discovery.royaltyPoolUsdc * discovery.replicatorShareBps) / 10000)
      : 0;

  const handleExportDossier = () => {
    soundInstrument.playApertureClick();
    const dossier = {
      protocol: 'HELIOSOPHIA // Epistemic Reproducibility & IP Royalty Ledger v1.0',
      network: {
        name: STUDIONET_CHAIN_CONFIG.networkName,
        chainId: STUDIONET_CHAIN_CONFIG.chainIdDecimal,
        rpcEndpoint: STUDIONET_CHAIN_CONFIG.rpcEndpoint,
        boundContractAddress: boundContractAddress || 'LOCAL_GENVM_VERIFIED_SIMULATION',
      },
      discoveryFolio: discovery.id,
      title: discovery.titleEn,
      preprintUrl: discovery.preprintUrl,
      preprintSha256: discovery.preprintSha256,
      replicationTelemetryUrl: discovery.replicationTelemetryUrl,
      replicationTelemetrySha256: discovery.replicationTelemetrySha256,
      equivalenceModes: {
        registration: 'gl.eq_principle.prompt_non_comparative',
        replicationAudit: 'gl.eq_principle.prompt_comparative',
      },
      verdict: auditMode === 'REPLICATED' ? 'REPLICATED_WITHIN_TOLERANCE' : 'REPLICATION_REFUTED',
      epistemicConfidenceBps:
        auditMode === 'REPLICATED' ? discovery.verifiedEciBps : discovery.refutedEciBps,
      royaltySettlementUsdc: {
        totalPool: discovery.royaltyPoolUsdc,
        leadAuthorReleased: authorPayout,
        replicatorLabReleased: replicatorPayout,
      },
      timestampIso: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${discovery.id}-epistemic-dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (customTitle.trim().length < 8) {
      setFormError(
        lang === 'en'
          ? 'Discovery title must be at least 8 characters.'
          : '科学发现标题不得少于 8 个字符。'
      );
      return;
    }
    if (!customUrl.startsWith('https://') && !customUrl.startsWith('http://')) {
      setFormError(
        lang === 'en'
          ? 'Preprint URL must start with https:// or http://.'
          : '预印本链接必须以 https:// 或 http:// 开头。'
      );
      return;
    }
    if (customClause.trim().length < 20) {
      setFormError(
        lang === 'en'
          ? 'Falsifiable metric clause must be at least 20 characters.'
          : '可证伪量化指标条款不得少于 20 个字符。'
      );
      return;
    }
    const poolVal = Number(customPool);
    const shareVal = Number(customShareBps);
    if (isNaN(poolVal) || poolVal < 1000 || isNaN(shareVal) || shareVal < 500 || shareVal > 5000) {
      setFormError(
        lang === 'en'
          ? 'Pool must be >= 1,000 USDC and Replicator Share between 500 and 5,000 bps (5%-50%).'
          : '版税池需 >= 1,000 USDC，复现实验室分成比例需在 500 至 5,000 bps（5%-50%）之间。'
      );
      return;
    }

    const newId = `HLS-2026-0${Math.floor(300 + Math.random() * 600)}`;
    const customItem: ScientificDiscovery = {
      id: newId,
      folioNumber: `FOLIO // CUSTOM-${newId.slice(-4)}`,
      domainEn: 'Custom Epistemic Discovery Bond',
      domainZh: '自定义科学复现契约',
      titleEn: customTitle.trim(),
      titleZh: customTitle.trim(),
      leadAuthor: '0x7F4C...91A0 (Researcher Signer)',
      institutionEn: 'Independent Open-Science Laboratory',
      institutionZh: '独立开放科学实验室',
      preprintUrl: customUrl.trim(),
      preprintSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
      targetMetricClauseEn: customClause.trim(),
      targetMetricClauseZh: customClause.trim(),
      royaltyPoolUsdc: poolVal,
      replicatorShareBps: shareVal,
      noveltyTier: 'BREAKTHROUGH',
      initialEciBps: 7500,
      verifiedEciBps: 9480,
      refutedEciBps: 3900,
      baselineMetricValue: 5.42,
      baselineMetricUnit: 'PPL / Metric',
      tolerancePlusMinus: 0.15,
      replicatedMetricValue: 5.38,
      refutedMetricValue: 7.95,
      replicationLabEn: 'GenLayer Decentralized Replicator Quorum',
      replicationLabZh: 'GenLayer 去中心化独立复现节点联盟',
      replicationTelemetryUrl: `${customUrl.trim().replace(/\/$/, '')}/telemetry-repro.json`,
      replicationTelemetrySha256: 'f0e1d2c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
      replicationTelemetryJson: JSON.stringify(
        {
          folio_id: newId,
          preprint_source: customUrl.trim(),
          clause_evaluated: customClause.trim(),
          reproducible: true,
          confidence_interval_satisfied: true,
        },
        null,
        2
      ),
      refutationTelemetryJson: JSON.stringify(
        {
          folio_id: newId,
          preprint_source: customUrl.trim(),
          reproducible: false,
          reason: 'Empirical metric drifted outside declared tolerance corridor',
        },
        null,
        2
      ),
      synthesisSummaryEn:
        'Custom discovery synthesized via GenVM prompt_non_comparative; falsifiable metric corridor anchored.',
      synthesisSummaryZh:
        '已通过 GenVM 非比较式等价原则完成自定义发现的方法论提取与可证伪阈值锚定。',
      auditConclusionVerifiedEn:
        'Independent replication telemetry satisfied the custom falsifiable metric clause. Dynamic royalties settled.',
      auditConclusionVerifiedZh:
        '独立复现遥测完全满足自定义可证伪指标条款，动态科研版税已完成链上分账。',
      auditConclusionRefutedEn:
        'Independent replication telemetry breached tolerance bounds; Epistemic Confidence slashed.',
      auditConclusionRefutedZh:
        '独立复现遥测超出容差走廊，认知置信度（ECI）已执行罚没下调。',
    };

    soundInstrument.playEpistemicSeal();
    onRegisterCustomDiscovery(customItem);
    setCustomTitle('');
    setFormSuccess(
      lang === 'en'
        ? `Registered Folio ${newId} and switched active workbench!`
        : `已成功登记档案 ${newId} 并切换至当前复现工作台！`
    );
  };

  const steps = [
    {
      idx: 1,
      code: 'STEP 01 // gl.get_webpage(preprint_url)',
      titleEn: 'Preprint & Prior-Art Web Retrieval',
      titleZh: '预印本与先验文献实时网页抓取',
      descEn: `Fetches ${discovery.preprintUrl} and commits SHA-256 (${discovery.preprintSha256.slice(0, 14)}...).`,
      descZh: `抓取 ${discovery.preprintUrl} 并计算内容 SHA-256 摘要（${discovery.preprintSha256.slice(0, 14)}...）。`,
    },
    {
      idx: 2,
      code: 'STEP 02 // gl.eq_principle.prompt_non_comparative',
      titleEn: 'Non-Comparative Epistemic Baseline Synthesis',
      titleZh: '非比较式等价原则：方法论基线合成',
      descEn: `Synthesizes falsifiable metric corridor (${discovery.baselineMetricValue} ${discovery.baselineMetricUnit} ± ${discovery.tolerancePlusMinus}).`,
      descZh: `提炼可证伪量化指标走廊（${discovery.baselineMetricValue} ${discovery.baselineMetricUnit} ± ${discovery.tolerancePlusMinus}）。`,
    },
    {
      idx: 3,
      code: 'STEP 03 // gl.get_webpage(telemetry_url)',
      titleEn: 'Independent Lab Replication Telemetry Ingestion',
      titleZh: '独立实验室复现遥测数据流接入',
      descEn: `Ingests signed benchmark JSON from ${discovery.replicationLabEn}.`,
      descZh: `从 ${discovery.replicationLabZh} 读取签名实测基准 JSON 载荷。`,
    },
    {
      idx: 4,
      code: 'STEP 04 // gl.eq_principle.prompt_comparative',
      titleEn: '5-Validator Optimistic Democracy Equivalence Audit',
      titleZh: '5 验证节点乐观民主比较式等价裁决',
      descEn:
        auditMode === 'REPLICATED'
          ? `Observed ${discovery.replicatedMetricValue} ${discovery.baselineMetricUnit} verified within tolerance.`
          : `Observed ${discovery.refutedMetricValue} ${discovery.baselineMetricUnit} breached falsifiability ceiling!`,
      descZh:
        auditMode === 'REPLICATED'
          ? `实测值 ${discovery.replicatedMetricValue} ${discovery.baselineMetricUnit} 严格处于容差区间内，5 节点达成一致。`
          : `实测值 ${discovery.refutedMetricValue} ${discovery.baselineMetricUnit} 突破可证伪红线，触发证伪罚没！`,
    },
    {
      idx: 5,
      code: 'STEP 05 // DYNAMIC ECI & ROYALTY SETTLEMENT',
      titleEn: 'Epistemic Confidence Update & Royalty Split Execution',
      titleZh: '认知置信度（ECI）更新与科研版税自动分账',
      descEn:
        auditMode === 'REPLICATED'
          ? `ECI upgraded to ${(discovery.verifiedEciBps / 100).toFixed(2)}%. Released ${authorPayout.toLocaleString()} USDC to Author & ${replicatorPayout.toLocaleString()} USDC to Replicator.`
          : `ECI slashed to ${(discovery.refutedEciBps / 100).toFixed(2)}%. Royalty pool locked against irreproducible claim.`,
      descZh:
        auditMode === 'REPLICATED'
          ? `ECI 升级至 ${(discovery.verifiedEciBps / 100).toFixed(2)}%。向原作者释放 ${authorPayout.toLocaleString()} USDC，向复现方释放 ${replicatorPayout.toLocaleString()} USDC。`
          : `ECI 罚没下调至 ${(discovery.refutedEciBps / 100).toFixed(2)}%。冻结版税池并标记不可复现警告。`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Action Control Bar */}
      <div className="p-5 border border-hairline dark:border-nocturneRule bg-linen/70 dark:bg-nocturneSurface flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-vermilion">
            {discovery.folioNumber} // {lang === 'en' ? discovery.domainEn : discovery.domainZh}
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-carbon dark:text-alabaster mt-1">
            {lang === 'en' ? discovery.titleEn : discovery.titleZh}
          </h3>
          <p className="text-xs font-mono text-graphite dark:text-stone-400 mt-1">
            {lang === 'en' ? discovery.institutionEn : discovery.institutionZh} • Lead:{' '}
            {discovery.leadAuthor}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onRunAudit('REPLICATED')}
            className="px-4 py-2.5 bg-vermilion text-alabaster font-mono text-xs uppercase tracking-wider hover:opacity-90 transition"
          >
            {lang === 'en'
              ? '▶ Run Successful Replication Audit'
              : '▶ 执行成功复现与版税分账推演'}
          </button>
          <button
            onClick={() => onRunAudit('REFUTED')}
            className="px-4 py-2.5 border border-carbon dark:border-alabaster text-carbon dark:text-alabaster font-mono text-xs uppercase tracking-wider hover:bg-carbon hover:text-alabaster dark:hover:bg-alabaster dark:hover:text-carbon transition"
          >
            {lang === 'en'
              ? '⚡ Simulate Empirical Refutation (Slash ECI)'
              : '⚡ 模拟复现证伪与置信度罚没'}
          </button>
          <button
            onClick={handleExportDossier}
            className="px-3.5 py-2.5 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg font-mono text-xs text-graphite dark:text-stone-300 hover:border-carbon transition"
          >
            {lang === 'en' ? '↓ Export Epistemic Dossier (.JSON)' : '↓ 导出认知审计档案 (.JSON)'}
          </button>
        </div>
      </div>

      {/* 5-Stage GenVM Execution Stepper & Live Telemetry Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-3">
          <div className="font-mono text-xs uppercase tracking-widest text-graphite dark:text-stone-400">
            {lang === 'en'
              ? 'GENVM OPTIMISTIC DEMOCRACY PIPELINE (5 STAGES)'
              : 'GENVM 乐观民主科学复现流水线（5 阶段状态机）'}
          </div>
          {steps.map((st) => {
            const done = auditStage >= st.idx;
            const current = auditStage === st.idx;
            return (
              <div
                key={st.idx}
                className={`p-4 border transition-all ${
                  current
                    ? 'border-vermilion bg-vermilion/5'
                    : done
                    ? 'border-verdigris/60 bg-linen/50 dark:bg-nocturneSurface'
                    : 'border-hairline dark:border-nocturneRule bg-alabaster/50 dark:bg-nocturneBg opacity-75'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-vermilion font-semibold">{st.code}</span>
                  <span className="uppercase">
                    {done ? (lang === 'en' ? '[VERIFIED]' : '[已核验]') : '[STANDBY]'}
                  </span>
                </div>
                <div className="font-semibold text-sm mt-1">
                  {lang === 'en' ? st.titleEn : st.titleZh}
                </div>
                <p className="text-xs text-graphite dark:text-stone-300 mt-1 leading-relaxed">
                  {lang === 'en' ? st.descEn : st.descZh}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Telemetry Snapshot & Royalty Ledger */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 border border-hairline dark:border-nocturneRule bg-linen/50 dark:bg-nocturneSurface">
            <div className="font-mono text-xs uppercase tracking-widest text-graphite dark:text-stone-400">
              {lang === 'en'
                ? 'DYNAMIC ROYALTY & EPISTEMIC VALUATION LEDGER'
                : '动态科研版税与认知置信度账本'}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg">
                <div className="text-[10px] text-graphite dark:text-stone-400">
                  {lang === 'en' ? 'TOTAL ROYALTY ESCROW' : '锁定科研版税总池'}
                </div>
                <div className="text-lg font-semibold mt-0.5 tabular-nums">
                  {discovery.royaltyPoolUsdc.toLocaleString()} USDC
                </div>
              </div>
              <div className="p-3 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg">
                <div className="text-[10px] text-graphite dark:text-stone-400">
                  {lang === 'en' ? 'REPLICATOR INCENTIVE' : '复现实验室分成比例'}
                </div>
                <div className="text-lg font-semibold mt-0.5 tabular-nums">
                  {(discovery.replicatorShareBps / 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg">
                <div className="text-[10px] text-graphite dark:text-stone-400">
                  {lang === 'en' ? 'AUTHOR RELEASED' : '原作者已解锁版税'}
                </div>
                <div className="text-lg font-semibold text-verdigris mt-0.5 tabular-nums">
                  {authorPayout.toLocaleString()} USDC
                </div>
              </div>
              <div className="p-3 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg">
                <div className="text-[10px] text-graphite dark:text-stone-400">
                  {lang === 'en' ? 'REPLICATOR RELEASED' : '复现方已获赏金'}
                </div>
                <div className="text-lg font-semibold text-prussian mt-0.5 tabular-nums">
                  {replicatorPayout.toLocaleString()} USDC
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-hairline dark:border-nocturneRule">
              <div className="font-mono text-[11px] uppercase text-vermilion">
                {lang === 'en' ? 'ON-CHAIN AUDIT CONCLUSION' : '链上乐观民主裁决结论'}
              </div>
              <p className="text-xs text-carbon dark:text-stone-200 mt-1.5 leading-relaxed">
                {auditMode === 'REPLICATED'
                  ? lang === 'en'
                    ? discovery.auditConclusionVerifiedEn
                    : discovery.auditConclusionVerifiedZh
                  : lang === 'en'
                  ? discovery.auditConclusionRefutedEn
                  : discovery.auditConclusionRefutedZh}
              </p>
            </div>
          </div>

          <div className="p-4 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg">
            <div className="flex items-center justify-between font-mono text-[11px] text-graphite dark:text-stone-400 mb-2">
              <span>LIVE TELEMETRY PAYLOAD (`gl.get_webpage`)</span>
              <span>SHA-256 VERIFIED</span>
            </div>
            <pre className="p-3 bg-linen dark:bg-nocturneSurface border border-hairline dark:border-nocturneRule font-mono text-[11px] overflow-x-auto leading-relaxed">
              {auditMode === 'REPLICATED'
                ? discovery.replicationTelemetryJson
                : discovery.refutationTelemetryJson}
            </pre>
          </div>
        </div>
      </div>

      {/* Custom Discovery Registration Sandbox */}
      <form
        onSubmit={handleCreateCustom}
        className="p-6 border border-hairline dark:border-nocturneRule bg-linen/40 dark:bg-nocturneSurface space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline dark:border-nocturneRule pb-3">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-vermilion">
              § REGISTER NEW EPISTEMIC DISCOVERY BOND (`register_discovery`)
            </span>
            <h4 className="font-serif text-xl mt-0.5">
              {lang === 'en'
                ? 'Anchor Your Own Preprint & Falsifiable Benchmark Clause'
                : '登记自定义预印本与可证伪复现契约'}
            </h4>
          </div>
          <span className="font-mono text-[11px] text-graphite dark:text-stone-400">
            Equivalence Mode: gl.eq_principle.prompt_non_comparative
          </span>
        </div>

        {formError && (
          <div className="p-3 border border-vermilion bg-vermilion/10 font-mono text-xs text-vermilion">
            {formError}
          </div>
        )}
        {formSuccess && (
          <div className="p-3 border border-verdigris bg-verdigris/10 font-mono text-xs text-verdigris">
            {formSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-xs uppercase mb-1">
              {lang === 'en' ? 'Discovery Title' : '科学发现标题'}
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g., Zero-Overhead Homomorphic Matrix Multiplication"
              className="w-full px-3 py-2 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg font-sans text-sm"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase mb-1">
              {lang === 'en' ? 'Preprint / Benchmark URL (http/https)' : '预印本或基准仓库 URL'}
            </label>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="w-full px-3 py-2 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg font-mono text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs uppercase mb-1">
            {lang === 'en'
              ? 'Falsifiable Empirical Reproducibility Clause (>= 20 chars)'
              : '可证伪量化复现条款（不少于 20 个字符）'}
          </label>
          <textarea
            rows={2}
            value={customClause}
            onChange={(e) => setCustomClause(e.target.value)}
            className="w-full px-3 py-2 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg font-sans text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block font-mono text-xs uppercase mb-1">
              {lang === 'en' ? 'Royalty Escrow Pool (USDC)' : '版税托管池 (USDC)'}
            </label>
            <input
              type="number"
              value={customPool}
              onChange={(e) => setCustomPool(e.target.value)}
              className="w-full px-3 py-2 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg font-mono text-sm"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase mb-1">
              {lang === 'en' ? 'Replicator Share (bps, 500-5000)' : '复现方分成 (bps, 500-5000)'}
            </label>
            <input
              type="number"
              value={customShareBps}
              onChange={(e) => setCustomShareBps(e.target.value)}
              className="w-full px-3 py-2 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-carbon dark:bg-alabaster text-alabaster dark:text-carbon font-mono text-xs uppercase tracking-wider hover:opacity-90 transition"
          >
            {lang === 'en' ? '+ Anchor Discovery Folio' : '+ 锚定科学发现契约'}
          </button>
        </div>
      </form>
    </div>
  );
};
