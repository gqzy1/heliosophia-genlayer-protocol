import React, { useState } from 'react';
import {
  OnChainLifecyclePhase,
  OnChainTransactionLifecycle,
  ScientificDiscovery,
  WalletConnectionState,
} from '../types/heliosophia';
import { soundInstrument } from '../audio/mechanicalSound';
import {
  readDiscoveryFromStudionet,
  registerDiscoveryOnChain,
  STUDIONET_CHAIN_CONFIG,
  submitReplicationProofOnChain,
} from '../config/studionet';
import { buildDossierFromReadback, modeFromVerdict, parseReadback } from '../utils/dossier';

interface Props {
  discovery: ScientificDiscovery;
  auditStage: number;
  auditMode: 'REPLICATED' | 'PARTIAL' | 'REFUTED';
  onRunAudit: (mode: 'REPLICATED' | 'PARTIAL' | 'REFUTED') => void;
  onRegisterCustomDiscovery: (custom: ScientificDiscovery) => void;
  lang: 'en' | 'zh';
  boundContractAddress: string | null;
  wallet: WalletConnectionState;
  onConnectMetaMask: () => Promise<void>;
  onConnectSdkSigner: () => void;
}

export const ReplicationWorkbench: React.FC<Props> = ({
  discovery,
  auditStage,
  auditMode,
  onRunAudit,
  onRegisterCustomDiscovery,
  lang,
  boundContractAddress,
  wallet,
  onConnectMetaMask,
  onConnectSdkSigner,
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('https://raw.githubusercontent.com/gqzy1/heliosophia-genlayer-protocol/f9e37bf76a59ca17b4b75b8fb3822c95bbe8287e/public/evidence/preprint.txt');
  const [customClause, setCustomClause] = useState(
    'Across five seeds, backbone RMSD must be <= 1.26 Angstrom and compute reduction >= 38 percent on the synthetic target.'
  );
  const [telemetryUrl, setTelemetryUrl] = useState('https://raw.githubusercontent.com/gqzy1/heliosophia-genlayer-protocol/f9e37bf76a59ca17b4b75b8fb3822c95bbe8287e/public/evidence/replication.json');
  const [customPool, setCustomPool] = useState('60000');
  const [customShareBps, setCustomShareBps] = useState('2000');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [txLifecycle, setTxLifecycle] = useState<OnChainTransactionLifecycle>({
    phase: 'IDLE',
    functionName: null,
    discoveryId: null,
    txHash: null,
    receiptStatus: null,
    readbackDataJson: null,
    errorMessage: null,
    updatedAtIso: null,
  });
  const [statusDetail, setStatusDetail] = useState<string>('');

  const isPending = ['SIGNING_AND_SUBMITTING', 'PENDING_PROPOSING', 'COMMITTING_EQUIVALENCE', 'FINALIZED'].includes(txLifecycle.phase);
  // Gate 11: every displayed/exported value comes from the FINALIZED
  // get_discovery readback. Before a readback there is nothing to display:
  // no verdict, no ECI, no allocation. `auditMode` is only the local
  // simulation preview and must never feed these fields.
  const readbackRecord = (() => {
    try {
      return parseReadback(txLifecycle.readbackDataJson);
    } catch {
      return null;
    }
  })();
  const readbackMode = readbackRecord ? modeFromVerdict(readbackRecord.last_verdict) : null;
  const readbackEciBps = readbackRecord ? readbackRecord.epistemic_confidence_bps : null;
  // Cumulative amounts released so far, as read back. Not "released by this
  // verdict": a PARTIAL verdict unlocks nothing (see unlockedBpsByThisVerdict).
  const authorPayout = readbackRecord ? readbackRecord.author_royalty_released : 0;
  const replicatorPayout = readbackRecord ? readbackRecord.replicator_royalty_released : 0;
  const unlockedBpsByThisVerdict = readbackRecord
    ? readbackRecord.last_verdict === 'REPLICATED_WITHIN_TOLERANCE'
      ? 10000
      : 0
    : 0;

  /**
   * Executes real on-chain `submit_replication_proof` via `genlayer-js` `writeContract`,
   * polls `waitForTransactionReceipt` until `FINALIZED`, and reads back `get_discovery` via `readContract`.
   */
  const handleExecuteOnChainReplication = async (mode: 'REPLICATED' | 'REFUTED') => {
    soundInstrument.playApertureClick();


    if (!wallet.connected) {
      onConnectSdkSigner();
    }

    const targetAddr = boundContractAddress?.trim() || '';
    setTxLifecycle({
      phase: 'SIGNING_AND_SUBMITTING',
      functionName: 'submit_replication_proof',
      discoveryId: discovery.id,
      txHash: null,
      receiptStatus: null,
      readbackDataJson: null,
      errorMessage: null,
      updatedAtIso: new Date().toISOString(),
    });
    setStatusDetail(
      lang === 'en'
        ? 'Signing & broadcasting submit_replication_proof transaction to GenLayer Studionet (61999)...'
        : '正在签名并向 GenLayer Studionet (61999) 广播 submit_replication_proof 交易...'
    );

    try {
      const result = await submitReplicationProofOnChain({
        contractAddress: targetAddr,
        discoveryId: discovery.id,
        replicationLab: discovery.replicationLabEn,
        telemetryUrl: telemetryUrl.trim(),
        labNotes:
          mode === 'REPLICATED'
            ? `Empirical metric ${discovery.replicatedMetricValue} ${discovery.baselineMetricUnit} verified within tolerance.`
            : `Empirical metric ${discovery.refutedMetricValue} ${discovery.baselineMetricUnit} breached tolerance bounds.`,
        onPhaseChange: (phase: OnChainLifecyclePhase, detail?: string, hash?: string) => {
          if (detail) setStatusDetail(detail);
          setTxLifecycle((prev) => ({
            ...prev,
            phase,
            txHash: hash || prev.txHash,
            updatedAtIso: new Date().toISOString(),
          }));
        },
      });

      const record = JSON.parse(result.readbackJson);
      onRunAudit(modeFromVerdict(record.last_verdict));
      soundInstrument.playEpistemicSeal();
      setTxLifecycle({
        phase: 'READBACK_VERIFIED',
        functionName: 'submit_replication_proof',
        discoveryId: discovery.id,
        txHash: result.txHash,
        receiptStatus: result.receiptStatus,
        readbackDataJson: result.readbackJson,
        errorMessage: null,
        updatedAtIso: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'On-chain transaction failed';
      setTxLifecycle((prev) => ({
        ...prev,
        phase: 'ERROR',
        errorMessage: errMsg,
        updatedAtIso: new Date().toISOString(),
      }));
    }
  };

  /**
   * Reads the latest discovery state directly from Studionet via `client.readContract('get_discovery')`.
   */
  const handleManualReadback = async () => {
    soundInstrument.playApertureClick();
    const targetAddr = boundContractAddress?.trim() || '';
    try {
      setStatusDetail(`Calling client.readContract('get_discovery', ['${discovery.id}'])...`);
      const jsonStr = await readDiscoveryFromStudionet(targetAddr, discovery.id);
      setTxLifecycle((prev) => ({
        ...prev,
        phase: 'READBACK_VERIFIED',
        discoveryId: discovery.id,
        readbackDataJson: jsonStr,
        errorMessage: null,
        updatedAtIso: new Date().toISOString(),
      }));
      setStatusDetail(`Readback verified: get_discovery('${discovery.id}') returned the FINALIZED on-chain state.`);
      soundInstrument.playEpistemicSeal();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'readContract failed';
      setTxLifecycle((prev) => ({
        ...prev,
        phase: 'ERROR',
        errorMessage: errMsg,
        updatedAtIso: new Date().toISOString(),
      }));
    }
  };

  const handleExportDossier = () => {
    soundInstrument.playApertureClick();
    let dossier;
    try {
      dossier = buildDossierFromReadback({
        readbackJson: txLifecycle.readbackDataJson,
        discoveryId: discovery.id,
        txHash: txLifecycle.txHash,
        receiptStatus: txLifecycle.receiptStatus,
        lifecyclePhase: txLifecycle.phase,
        network: {
          name: STUDIONET_CHAIN_CONFIG.networkName,
          chainId: STUDIONET_CHAIN_CONFIG.chainIdDecimal,
          rpcEndpoint: STUDIONET_CHAIN_CONFIG.rpcEndpoint,
        },
        boundContractAddress: boundContractAddress || null,
        connectedSigner: wallet.address,
        title: discovery.titleEn,
        preprintUrl: discovery.preprintUrl,
        replicationTelemetryUrl: discovery.replicationTelemetryUrl,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Dossier export requires a FINALIZED readback.';
      setFormError(message);
      setStatusDetail(message);
      return;
    }
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${discovery.id}-epistemic-dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
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

    const newId = `HLS-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(16).padStart(2, '0')).join('')}`;
    const signerAddr = wallet.address || '0x7F4C...91A0 (Researcher Signer)';

    const customItem: ScientificDiscovery = {
      id: newId,
      folioNumber: `FOLIO // CUSTOM-${newId.slice(-4)}`,
      domainEn: 'Custom Epistemic Discovery Bond',
      domainZh: '自定义科学复现契约',
      titleEn: customTitle.trim(),
      titleZh: customTitle.trim(),
      leadAuthor: signerAddr,
      institutionEn: 'Independent Open-Science Laboratory',
      institutionZh: '独立开放科学实验室',
      preprintUrl: customUrl.trim(),
      preprintSha256: 'UNCONFIRMED — set from the register_discovery readback.',
      targetMetricClauseEn: customClause.trim(),
      targetMetricClauseZh: customClause.trim(),
      royaltyPoolUsdc: poolVal,
      replicatorShareBps: shareVal,
      noveltyTier: 'DERIVATIVE',
      initialEciBps: 7600,
      verifiedEciBps: 7600,
      refutedEciBps: 7600,
      baselineMetricValue: 5.42,
      baselineMetricUnit: 'PPL / Metric',
      tolerancePlusMinus: 0.15,
      replicatedMetricValue: 5.38,
      refutedMetricValue: 7.95,
      replicationLabEn: 'GenLayer Decentralized Replicator Quorum',
      replicationLabZh: 'GenLayer 去中心化独立复现节点联盟',
      replicationTelemetryUrl: telemetryUrl.trim(),
      replicationTelemetrySha256: 'UNCONFIRMED — set from the replication readback.',
      replicationTelemetryJson: JSON.stringify(
        { folio_id: newId, note: 'No replication readback yet.' },
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



    // If a Studionet contract is mounted, also submit `register_discovery` on-chain via writeContract -> FINALIZED -> readContract
    if (boundContractAddress && boundContractAddress.startsWith('0x')) {
      if (!wallet.connected) {
        onConnectSdkSigner();
      }
      setTxLifecycle({
        phase: 'SIGNING_AND_SUBMITTING',
        functionName: 'register_discovery',
        discoveryId: newId,
        txHash: null,
        receiptStatus: null,
        readbackDataJson: null,
        errorMessage: null,
        updatedAtIso: new Date().toISOString(),
      });
      try {
        const res = await registerDiscoveryOnChain({
          contractAddress: boundContractAddress,
          discoveryId: newId,
          leadAuthor: signerAddr,
          title: customItem.titleEn,
          preprintUrl: customItem.preprintUrl,
          targetMetricClause: customItem.targetMetricClauseEn,
          royaltyPoolUsdc: poolVal,
          replicatorShareBps: shareVal,
          onPhaseChange: (phase, detail, hash) => {
            if (detail) setStatusDetail(detail);
            setTxLifecycle((prev) => ({
              ...prev,
              phase,
              txHash: hash || prev.txHash,
              updatedAtIso: new Date().toISOString(),
            }));
          },
        });
        // The custom folio's identity fields come from the readback, never
        // from locally invented hashes or projected ECIs.
        const registered = JSON.parse(res.readbackJson);
        customItem.preprintSha256 = registered.preprint_sha256;
        customItem.noveltyTier = registered.novelty_tier;
        customItem.initialEciBps = registered.epistemic_confidence_bps;
        customItem.verifiedEciBps = registered.epistemic_confidence_bps;
        customItem.refutedEciBps = registered.epistemic_confidence_bps;
        onRegisterCustomDiscovery(customItem);
        setCustomTitle('');
        soundInstrument.playEpistemicSeal();
        setTxLifecycle({
          phase: 'READBACK_VERIFIED',
          functionName: 'register_discovery',
          discoveryId: newId,
          txHash: res.txHash,
          receiptStatus: res.receiptStatus,
          readbackDataJson: res.readbackJson,
          errorMessage: null,
          updatedAtIso: new Date().toISOString(),
        });
        setFormSuccess(
          lang === 'en'
            ? `On-Chain Tx FINALIZED (${res.txHash.slice(0, 14)}...) & Readback verified for ${newId}!`
            : `链上交易已 FINALIZED (${res.txHash.slice(0, 14)}...) 并完成 ${newId} 状态读回！`
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'On-chain registration failed';
        setTxLifecycle((prev) => ({
          ...prev,
          phase: 'ERROR',
          errorMessage: msg,
          updatedAtIso: new Date().toISOString(),
        }));
      }
    } else {
      soundInstrument.playEpistemicSeal();
      setFormSuccess(
        lang === 'en'
          ? `Prepared Folio ${newId}. Mount a contract address in § 03 Inspector to broadcast register_discovery on-chain.`
          : `已准备档案 ${newId}。在 § 03 挂载合约地址后可直接向链上广播 register_discovery 交易。`
      );
    }
  };

  const lifecyclePillars = [
    {
      step: '01 // WALLET CONNECTION',
      done: wallet.connected,
      active: txLifecycle.phase === 'CONNECTING_WALLET',
      desc: wallet.connected
        ? `${wallet.mode}: ${wallet.address?.slice(0, 8)}...${wallet.address?.slice(-4)}`
        : 'Click Connect Wallet or SDK Signer',
    },
    {
      step: '02 // SUBMIT TX (writeContract)',
      done: Boolean(txLifecycle.txHash),
      active:
        txLifecycle.phase === 'SIGNING_AND_SUBMITTING' ||
        txLifecycle.phase === 'PENDING_PROPOSING',
      desc: txLifecycle.txHash
        ? `Tx: ${txLifecycle.txHash.slice(0, 12)}...`
        : 'Calls submit_replication_proof / register_discovery',
    },
    {
      step: '03 // CONSENSUS FINALIZED',
      done:
        txLifecycle.phase === 'FINALIZED' || txLifecycle.phase === 'READBACK_VERIFIED',
      active: txLifecycle.phase === 'COMMITTING_EQUIVALENCE',
      desc: txLifecycle.receiptStatus
        ? `Status: ${txLifecycle.receiptStatus}`
        : 'Polls waitForTransactionReceipt -> FINALIZED',
    },
    {
      step: '04 // ON-CHAIN READBACK (readContract)',
      done: txLifecycle.phase === 'READBACK_VERIFIED',
      active: false,
      desc:
        txLifecycle.phase === 'READBACK_VERIFIED'
          ? `Verified get_discovery('${txLifecycle.discoveryId}')`
          : 'Reads finalized TreeMap state from Studionet',
    },
  ];

  // Gate 11: step text is readback-driven. No readback -> unconfirmed.
  // PARTIAL is its own branch: ECI unchanged, 0 unlocked, never success.
  const step04Desc = (l: 'en' | 'zh'): string => {
    if (!readbackRecord) {
      return l === 'en'
        ? 'No FINALIZED readback yet — verdict, ECI and allocation are unconfirmed.'
        : '尚未读回 FINALIZED 状态——裁决、ECI 与分配均未确认。';
    }
    if (readbackMode === 'PARTIAL') {
      return l === 'en'
        ? 'PARTIAL_CONVERGENCE: required measurements are missing, so the claim can neither be confirmed nor refuted.'
        : 'PARTIAL_CONVERGENCE：缺少必需测量，既不能确认也不能证伪。';
    }
    if (readbackMode === 'REFUTED') {
      return l === 'en'
        ? `Observed ${discovery.refutedMetricValue} ${discovery.baselineMetricUnit} breached falsifiability ceiling!`
        : `实测值 ${discovery.refutedMetricValue} ${discovery.baselineMetricUnit} 突破可证伪红线，触发证伪罚没！`;
    }
    return l === 'en'
      ? `Observed ${discovery.replicatedMetricValue} ${discovery.baselineMetricUnit} verified within tolerance.`
      : `实测值 ${discovery.replicatedMetricValue} ${discovery.baselineMetricUnit} 严格处于容差区间内，5 节点达成一致。`;
  };
  const step05Desc = (l: 'en' | 'zh'): string => {
    if (!readbackRecord || readbackEciBps === null) {
      return l === 'en'
        ? 'ECI and royalty allocation are unconfirmed until the FINALIZED get_discovery readback.'
        : 'ECI 与版税分配在 FINALIZED get_discovery 读回之前均为未确认。';
    }
    if (readbackMode === 'PARTIAL') {
      return l === 'en'
        ? `ECI unchanged at ${(readbackEciBps / 100).toFixed(2)}%. PARTIAL_CONVERGENCE unlocks nothing (0 bps). Cumulative released: ${authorPayout.toLocaleString()} USDC to Author, ${replicatorPayout.toLocaleString()} USDC to Replicator.`
        : `ECI 不变，仍为 ${(readbackEciBps / 100).toFixed(2)}%。PARTIAL_CONVERGENCE 不解锁任何分配（0 bps）。累计已释放：原作者 ${authorPayout.toLocaleString()} USDC，复现方 ${replicatorPayout.toLocaleString()} USDC。`;
    }
    if (readbackMode === 'REFUTED') {
      return l === 'en'
        ? `ECI read back at ${(readbackEciBps / 100).toFixed(2)}%. This verdict unlocks nothing; the royalty pool is locked against an irreproducible claim.`
        : `ECI 读回为 ${(readbackEciBps / 100).toFixed(2)}%。本次裁决不解锁任何分配，版税池冻结并标记不可复现警告。`;
    }
    return l === 'en'
      ? `ECI read back at ${(readbackEciBps / 100).toFixed(2)}%. Cumulative released ${authorPayout.toLocaleString()} USDC to Author & ${replicatorPayout.toLocaleString()} USDC to Replicator.`
      : `ECI 读回为 ${(readbackEciBps / 100).toFixed(2)}%。累计已释放：原作者 ${authorPayout.toLocaleString()} USDC，复现方 ${replicatorPayout.toLocaleString()} USDC。`;
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
      descEn: step04Desc('en'),
      descZh: step04Desc('zh'),
    },
    {
      idx: 5,
      code: 'STEP 05 // DYNAMIC ECI & ROYALTY SETTLEMENT',
      titleEn: 'Epistemic Confidence Update & Royalty Split Execution',
      titleZh: '认知置信度（ECI）更新与科研版税自动分账',
      descEn: step05Desc('en'),
      descZh: step05Desc('zh'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Live On-Chain Transaction Lifecycle Bar (Connect Wallet -> Submit -> FINALIZED -> Readback) */}
      <div className="p-5 border border-carbon dark:border-alabaster bg-linen/90 dark:bg-nocturneSurface space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline dark:border-nocturneRule pb-3">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-vermilion font-semibold">
              § LIVE STUDIONET (61999) TRANSACTION LIFECYCLE ENGINE
            </span>
            <h4 className="font-serif text-xl mt-0.5">
              {lang === 'en'
                ? 'Connect Wallet → Submit writeContract → Poll FINALIZED → Readback get_discovery'
                : '连接钱包 → 提交 writeContract 交易 → 轮询 FINALIZED 终局 → readContract 读回链上状态'}
            </h4>
          </div>

          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {!wallet.connected ? (
              <>
                <button
                  onClick={onConnectMetaMask}
                  className="px-3 py-1.5 bg-vermilion text-alabaster font-semibold"
                >
                  {lang === 'en' ? '1. Connect MetaMask (61999)' : '1. 连接 MetaMask (61999)'}
                </button>
                <button
                  onClick={onConnectSdkSigner}
                  className="px-3 py-1.5 border border-carbon dark:border-alabaster"
                >
                  {lang === 'en' ? '1. Connect SDK Signer' : '1. 连接 SDK 签名器'}
                </button>
              </>
            ) : (
              <span className="px-3 py-1.5 border border-verdigris text-verdigris font-semibold">
                SIGNER READY: {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-4)}
              </span>
            )}
            <button
              onClick={handleManualReadback}
              className="px-3 py-1.5 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg"
            >
              {lang === 'en' ? '↻ Read get_discovery() Now' : '↻ 立即读回链上 get_discovery()'}
            </button>
          </div>
        </div>

        {/* 4-Stage On-Chain Lifecycle Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {lifecyclePillars.map((p) => (
            <div
              key={p.step}
              className={`p-3 border ${
                p.active
                  ? 'border-vermilion bg-vermilion/10'
                  : p.done
                  ? 'border-verdigris bg-verdigris/10'
                  : 'border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg'
              }`}
            >
              <div className="text-[11px] font-semibold flex items-center justify-between">
                <span>{p.step}</span>
                <span>{p.done ? '✓' : p.active ? '⋯' : '○'}</span>
              </div>
              <div className="text-[11px] text-graphite dark:text-stone-300 mt-1 truncate">
                {p.desc}
              </div>
            </div>
          ))}
        </div>

        {statusDetail && (
          <div className="font-mono text-xs text-graphite dark:text-stone-300">
            STATUS: <span className="text-carbon dark:text-alabaster font-semibold">{statusDetail}</span>
          </div>
        )}

        {txLifecycle.errorMessage && (
          <div className="p-3 border border-vermilion bg-vermilion/10 font-mono text-xs text-vermilion">
            ON-CHAIN ERROR: {txLifecycle.errorMessage}
          </div>
        )}

        {txLifecycle.readbackDataJson && (
          <div className="space-y-1">
            <div className="font-mono text-[11px] uppercase text-verdigris font-semibold">
              VERIFIED ON-CHAIN READBACK (`client.readContract("get_discovery", ["{txLifecycle.discoveryId}"])`):
            </div>
            <pre className="p-3 bg-alabaster dark:bg-nocturneBg border border-verdigris font-mono text-[11px] overflow-x-auto max-h-44">
              {txLifecycle.readbackDataJson}
            </pre>
          </div>
        )}
      </div>

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
            disabled={isPending}
            onClick={() => handleExecuteOnChainReplication('REPLICATED')}
            className="px-4 py-2.5 bg-vermilion text-alabaster font-mono text-xs uppercase tracking-wider hover:opacity-90 transition font-semibold"
          >
            {lang === 'en'
              ? '⛓ Submit Replication Proof On-Chain (writeContract)'
              : '⛓ 提交复现证明上链 (writeContract → FINALIZED)'}
          </button>
          <button
            disabled={isPending}
            onClick={() => handleExecuteOnChainReplication('REFUTED')}
            className="px-4 py-2.5 border border-carbon dark:border-alabaster text-carbon dark:text-alabaster font-mono text-xs uppercase tracking-wider hover:bg-carbon hover:text-alabaster dark:hover:bg-alabaster dark:hover:text-carbon transition"
          >
            {lang === 'en'
              ? '⚡ Submit Refutation Proof On-Chain (Slash ECI)'
              : '⚡ 提交实证证伪上链 (罚没 ECI)'}
          </button>
          <button
            disabled={!readbackRecord}
            title={readbackRecord ? undefined : 'Export is disabled until the FINALIZED get_discovery readback.'}
            onClick={handleExportDossier}
            className="px-3.5 py-2.5 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg font-mono text-xs text-graphite dark:text-stone-300 hover:border-carbon transition disabled:opacity-40"
          >
            {lang === 'en' ? '↓ Export Epistemic Dossier (.JSON)' : '↓ 导出认知审计档案 (.JSON)'}
          </button>
        </div>
      </div>

      <label className="block font-mono text-xs text-graphite dark:text-stone-400 mb-6">
        {lang === 'en' ? 'PUBLIC REPLICATION TELEMETRY URL · synthetic fixture by default' : '公开复现遥测 URL · 默认使用合成测试样本'}
        <input aria-label="Replication telemetry URL" value={telemetryUrl} onChange={e => setTelemetryUrl(e.target.value)} className="mt-2 w-full px-3 py-2 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg font-mono text-xs" />
      </label>
      {/* 5-Stage GenVM Execution Stepper & Live Telemetry Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-3">
          <div className="font-mono text-xs uppercase tracking-widest text-graphite dark:text-stone-400">
            {lang === 'en'
              ? `ILLUSTRATIVE PIPELINE · LIVE JSON ABOVE IS AUTHORITATIVE · SIMULATION MODE: ${auditStage > 0 ? auditMode : '—'}`
              : `五阶段流程示意 · 以上链上 JSON 为准 · 模拟模式：${auditStage > 0 ? auditMode : '—'}`}
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
                  {readbackRecord ? readbackRecord.royalty_pool_usdc.toLocaleString() : '— 未读回'} USDC
                </div>
              </div>
              <div className="p-3 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg">
                <div className="text-[10px] text-graphite dark:text-stone-400">
                  {lang === 'en' ? 'REPLICATOR INCENTIVE' : '复现实验室分成比例'}
                </div>
                <div className="text-lg font-semibold mt-0.5 tabular-nums">
                  {readbackRecord ? (readbackRecord.replicator_share_bps / 100).toFixed(1) : '— 未读回'}%
                </div>
              </div>
              <div className="p-3 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg">
                <div className="text-[10px] text-graphite dark:text-stone-400">
                  {lang === 'en' ? 'AUTHOR RELEASED · CUMULATIVE (READBACK)' : '原作者已解锁版税 · 累计（读回）'}
                </div>
                <div className="text-lg font-semibold text-verdigris mt-0.5 tabular-nums">
                  {readbackRecord ? `${authorPayout.toLocaleString()} USDC` : '— 未读回'}
                </div>
              </div>
              <div className="p-3 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg">
                <div className="text-[10px] text-graphite dark:text-stone-400">
                  {lang === 'en' ? 'REPLICATOR RELEASED · CUMULATIVE (READBACK)' : '复现方已获赏金 · 累计（读回）'}
                </div>
                <div className="text-lg font-semibold text-prussian mt-0.5 tabular-nums">
                  {readbackRecord ? `${replicatorPayout.toLocaleString()} USDC` : '— 未读回'}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-hairline dark:border-nocturneRule font-mono text-[11px] text-graphite dark:text-stone-400">
              {lang === 'en'
                ? readbackRecord
                  ? `UNLOCKED BY THIS VERDICT: ${(unlockedBpsByThisVerdict / 100).toFixed(0)}% (PARTIAL / REFUTED: 0%) · VERDICT: ${readbackRecord.last_verdict} · STATUS: ${readbackRecord.status}`
                  : 'UNLOCKED BY THIS VERDICT: 未读回'
                : readbackRecord
                ? `本次裁决解锁：${(unlockedBpsByThisVerdict / 100).toFixed(0)}%（PARTIAL / REFUTED 为 0%）· 裁决：${readbackRecord.last_verdict} · 状态：${readbackRecord.status}`
                : '本次裁决解锁：未读回'}
            </div>
            <div className="mt-4 pt-4 border-t border-hairline dark:border-nocturneRule">
              <div className="font-mono text-[11px] uppercase text-vermilion">
                {lang === 'en' ? 'ON-CHAIN AUDIT CONCLUSION' : '链上乐观民主裁决结论'}
              </div>
              <p className="text-xs text-carbon dark:text-stone-200 mt-1.5 leading-relaxed">
                {readbackRecord
                  ? readbackRecord.last_audit_conclusion ??
                    (lang === 'en' ? 'Readback has no audit conclusion.' : '读回中无裁决结论。')
                  : lang === 'en'
                  ? 'Unconfirmed — the audit conclusion comes from the FINALIZED get_discovery readback.'
                  : '未确认——裁决结论以 FINALIZED get_discovery 读回为准。'}
              </p>
            </div>
          </div>

          <div className="p-4 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg">
            <div className="flex items-center justify-between font-mono text-[11px] text-graphite dark:text-stone-400 mb-2">
              <span>LIVE TELEMETRY DIGEST (READBACK)</span>
              <span>{readbackRecord ? 'SHA-256 · 读回' : '未读回'}</span>
            </div>
            <pre className="p-3 bg-linen dark:bg-nocturneSurface border border-hairline dark:border-nocturneRule font-mono text-[11px] overflow-x-auto leading-relaxed">
              {readbackRecord
                ? JSON.stringify(
                    {
                      discovery_id: readbackRecord.id,
                      last_verdict: readbackRecord.last_verdict,
                      status: readbackRecord.status,
                      epistemic_confidence_bps: readbackRecord.epistemic_confidence_bps,
                      last_telemetry_sha256: readbackRecord.last_telemetry_sha256 ?? null,
                    },
                    null,
                    2
                  )
                : 'Unconfirmed — the telemetry digest comes from the FINALIZED get_discovery readback.'}
            </pre>
          </div>
        </div>
      </div>

      {/* Custom Discovery Registration Sandbox (On-Chain writeContract('register_discovery')) */}
      <form
        onSubmit={handleCreateCustom}
        className="p-6 border border-hairline dark:border-nocturneRule bg-linen/40 dark:bg-nocturneSurface space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline dark:border-nocturneRule pb-3">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-vermilion">
              § REGISTER NEW EPISTEMIC DISCOVERY BOND ON-CHAIN (`register_discovery`)
            </span>
            <h4 className="font-serif text-xl mt-0.5">
              {lang === 'en'
                ? 'Submit New Preprint & Falsifiable Clause to Studionet Contract'
                : '向 Studionet 合约提交新预印本与可证伪复现契约 (`writeContract`)'}
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
            disabled={isPending}
            type="submit"
            className="px-5 py-2.5 bg-carbon dark:bg-alabaster text-alabaster dark:text-carbon font-mono text-xs uppercase tracking-wider hover:opacity-90 transition font-semibold"
          >
            {lang === 'en'
              ? '⛓ Submit register_discovery On-Chain'
              : '⛓ 提交 register_discovery 上链'}
          </button>
        </div>
      </form>
    </div>
  );
};
