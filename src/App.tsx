import React, { useState, useEffect } from 'react';
import {
  EPISTEMIC_VALIDATOR_COMMITTEE,
  SCIENTIFIC_DISCOVERIES,
} from './data/discoveries';
import { EpistemicValidator, ScientificDiscovery } from './types/heliosophia';
import {
  INITIAL_DEPLOYMENT_BRIDGE,
  probeStudionetEndpoint,
  STUDIONET_CHAIN_CONFIG,
  StudionetRpcTelemetry,
} from './config/studionet';
import { soundInstrument } from './audio/mechanicalSound';
import { EpistemicCartographyCanvas } from './components/EpistemicCartographyCanvas';
import { ReplicationWorkbench } from './components/ReplicationWorkbench';
import { ContractAndRpcInspector } from './components/ContractAndRpcInspector';
import { ArchitectureAndGovernance } from './components/ArchitectureAndGovernance';

export default function App() {
  const [discoveries, setDiscoveries] = useState<ScientificDiscovery[]>(SCIENTIFIC_DISCOVERIES);
  const [activeDiscovery, setActiveDiscovery] = useState<ScientificDiscovery>(SCIENTIFIC_DISCOVERIES[0]);
  const [selectedValidator, setSelectedValidator] = useState<EpistemicValidator>(
    EPISTEMIC_VALIDATOR_COMMITTEE[0]
  );
  const [activeTab, setActiveTab] = useState<'FOLIO' | 'WORKBENCH' | 'CONTRACT' | 'GOVERNANCE'>('FOLIO');
  const [auditStage, setAuditStage] = useState<number>(4);
  const [auditMode, setAuditMode] = useState<'REPLICATED' | 'REFUTED'>('REPLICATED');
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [rpcTelemetry, setRpcTelemetry] = useState<StudionetRpcTelemetry | null>(null);
  const [boundContractAddr, setBoundContractAddr] = useState<string>(
    INITIAL_DEPLOYMENT_BRIDGE.contractAddress || ''
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setReducedMotion(true);
    probeStudionetEndpoint('eth_chainId').then(setRpcTelemetry);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  const triggerAuditSimulation = (mode: 'REPLICATED' | 'REFUTED') => {
    soundInstrument.playApertureClick();
    soundInstrument.pulseHaptic(14);
    setAuditMode(mode);
    setAuditStage(1);
    [2, 3, 4, 5].forEach((st, idx) => {
      setTimeout(() => {
        setAuditStage(st);
        if (st === 5) {
          soundInstrument.playEpistemicSeal();
        } else {
          soundInstrument.playHarmonicStep(idx, !(mode === 'REFUTED' && st >= 4));
        }
      }, (idx + 1) * 380);
    });
  };

  const handleRegisterCustom = (custom: ScientificDiscovery) => {
    setDiscoveries((prev) => [custom, ...prev]);
    setActiveDiscovery(custom);
    setAuditMode('REPLICATED');
    setAuditStage(5);
  };

  return (
    <div className="min-h-screen bg-alabaster dark:bg-nocturneBg text-carbon dark:text-alabaster swiss-grid-bg transition-colors">
      {/* Top Archival Telemetry & Instrument Header */}
      <header className="sticky top-0 z-30 border-b border-hairline dark:border-nocturneRule bg-alabaster/95 dark:bg-nocturneBg/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-vermilion" aria-hidden="true" />
            <div>
              <div className="font-mono text-[11px] tracking-widest uppercase">
                HELIOSOPHIA // EPISTEMIC REPRODUCIBILITY LEDGER
              </div>
              <div className="font-mono text-[10px] text-graphite dark:text-stone-400">
                GENLAYER STABLE STUDIONET • CHAIN ID: {STUDIONET_CHAIN_CONFIG.chainIdDecimal} (
                {STUDIONET_CHAIN_CONFIG.chainIdHex})
              </div>
            </div>
          </div>

          {/* Right Instrument Controls */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 border border-hairline dark:border-nocturneRule bg-linen dark:bg-nocturneSurface text-[11px]">
              RPC:{' '}
              {rpcTelemetry?.online
                ? `ONLINE (${rpcTelemetry.latencyMs}ms)`
                : 'LOCAL GENVM VERIFIED'}
            </span>

            <button
              onClick={() => {
                const next = !audioEnabled;
                soundInstrument.enabled = next;
                setAudioEnabled(next);
                if (next) soundInstrument.playApertureClick();
              }}
              className={`px-2.5 py-1 border transition ${
                audioEnabled
                  ? 'border-vermilion bg-vermilion text-alabaster'
                  : 'border-hairline dark:border-nocturneRule bg-linen dark:bg-nocturneSurface'
              }`}
            >
              AUDIO: {audioEnabled ? 'ON' : 'MUTED'}
            </button>

            <button
              onClick={() => setReducedMotion((m) => !m)}
              className="px-2.5 py-1 border border-hairline dark:border-nocturneRule bg-linen dark:bg-nocturneSurface"
            >
              {reducedMotion ? 'STATIC' : 'KINETIC'}
            </button>

            <button
              onClick={() => setDarkMode((d) => !d)}
              className="px-2.5 py-1 border border-hairline dark:border-nocturneRule bg-linen dark:bg-nocturneSurface"
            >
              {darkMode ? 'ALABASTER' : 'NOCTURNE'}
            </button>

            <button
              onClick={() => setLang((l) => (l === 'en' ? 'zh' : 'en'))}
              className="px-2.5 py-1 border border-carbon dark:border-alabaster font-semibold"
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>
          </div>
        </div>

        {/* Navigation Monograph Bar */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-hairline dark:border-nocturneRule grid grid-cols-2 sm:grid-cols-4 font-mono text-xs">
          {[
            { id: 'FOLIO', labelEn: '§ 01 // CARTOGRAPHY & FOLIOS', labelZh: '§ 01 // 认知星图与文献档案' },
            { id: 'WORKBENCH', labelEn: '§ 02 // REPLICATION STUDIO', labelZh: '§ 02 // 科学复现与版税工作台' },
            { id: 'CONTRACT', labelEn: '§ 03 // GENVM CONTRACT & RPC', labelZh: '§ 03 // 智能合约与链上终端' },
            { id: 'GOVERNANCE', labelEn: '§ 04 // ARCHITECTURE & ROADMAP', labelZh: '§ 04 // 架构机制与路线图' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundInstrument.playApertureClick();
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`py-3 px-3 text-left border-r last:border-r-0 border-hairline dark:border-nocturneRule transition ${
                activeTab === tab.id
                  ? 'bg-carbon text-alabaster dark:bg-alabaster dark:text-carbon font-semibold'
                  : 'hover:bg-linen/70 dark:hover:bg-nocturneSurface'
              }`}
            >
              {lang === 'en' ? tab.labelEn : tab.labelZh}
            </button>
          ))}
        </nav>
      </header>

      {/* Editorial Monograph Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6 border-b border-hairline dark:border-nocturneRule">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-8">
            <div className="font-mono text-xs uppercase tracking-widest text-vermilion">
              {lang === 'en'
                ? 'SWISS ARCHIVAL MONOGRAPH // AUTONOMOUS DESCI & IP PROTOCOL'
                : '瑞士文献馆级科学仪器 // 自主科学复现与动态知识版税协议'}
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl leading-[1.04] tracking-tight mt-2">
              {lang === 'en'
                ? 'Where Empirical Truth Becomes Programmable Sovereign Equity.'
                : '让可复现的科学真理，成为链上可编程的主权资产。'}
            </h1>
          </div>
          <div className="lg:col-span-4 space-y-2 border-l border-hairline dark:border-nocturneRule pl-4">
            <p className="text-xs sm:text-sm text-graphite dark:text-stone-300 leading-relaxed">
              {lang === 'en'
                ? 'Heliosophia binds GenLayer Python Intelligent Contracts directly to live scientific preprints and laboratory replication telemetry—replacing static peer-review bottlenecks with Optimistic Democracy equivalence.'
                : 'Heliosophia 将 GenLayer Python 智能合约直接绑定至实时科学预印本与独立实验室复现遥测，以乐观民主多模型等价原则取代传统静态同行评审瓶颈。'}
            </p>
            <div className="font-mono text-[11px] text-vermilion">
              {boundContractAddr
                ? `ON-CHAIN CONTRACT: ${boundContractAddr}`
                : 'MODE: VERIFIED GENVM SANDBOX (STUDIONET 61999 READY)'}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'FOLIO' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Discovery Folios */}
            <div className="lg:col-span-5 space-y-4">
              <div className="font-mono text-xs uppercase tracking-widest text-graphite dark:text-stone-400">
                {lang === 'en'
                  ? 'INDEXED SCIENTIFIC DISCOVERY FOLIOS'
                  : '已索引的科学发现与复现契约档案'}
              </div>
              {discoveries.map((d) => {
                const selected = activeDiscovery.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      soundInstrument.playApertureClick();
                      setActiveDiscovery(d);
                    }}
                    className={`w-full text-left p-5 border transition ${
                      selected
                        ? 'border-vermilion bg-linen dark:bg-nocturneSurface'
                        : 'border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg hover:border-carbon'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-graphite dark:text-stone-400">
                      <span className="text-vermilion font-semibold">{d.folioNumber}</span>
                      <span>POOL: {d.royaltyPoolUsdc.toLocaleString()} USDC</span>
                    </div>
                    <h2 className="font-serif text-xl mt-1.5">
                      {lang === 'en' ? d.titleEn : d.titleZh}
                    </h2>
                    <p className="text-xs text-graphite dark:text-stone-300 mt-1.5 line-clamp-2">
                      {lang === 'en' ? d.targetMetricClauseEn : d.targetMetricClauseZh}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-hairline dark:border-nocturneRule flex items-center justify-between font-mono text-[11px]">
                      <span>
                        TARGET: {d.baselineMetricValue} {d.baselineMetricUnit} (±{d.tolerancePlusMinus})
                      </span>
                      <span className="text-verdigris font-semibold">
                        VERIFIED ECI: {(d.verifiedEciBps / 100).toFixed(2)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Interactive Phase-Space Cartography & Validator Dossier */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-vermilion">
                    INSTRUMENT // MULTI-LLM EQUIVALENCE ASTROLABE
                  </span>
                  <h3 className="font-serif text-2xl">
                    {lang === 'en'
                      ? 'Confidence Corridor & Validator Convergence'
                      : '置信走廊与异构验证节点谐波收敛'}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => triggerAuditSimulation('REPLICATED')}
                    className="px-3 py-1.5 bg-vermilion text-alabaster font-mono text-xs"
                  >
                    {lang === 'en' ? 'Verify Replication' : '验证独立复现'}
                  </button>
                  <button
                    onClick={() => triggerAuditSimulation('REFUTED')}
                    className="px-3 py-1.5 border border-carbon dark:border-alabaster font-mono text-xs"
                  >
                    {lang === 'en' ? 'Test Refutation' : '测试证伪罚没'}
                  </button>
                </div>
              </div>

              <EpistemicCartographyCanvas
                discovery={activeDiscovery}
                selectedValidator={selectedValidator}
                onSelectValidator={(v) => {
                  soundInstrument.playApertureClick();
                  setSelectedValidator(v);
                }}
                auditStage={auditStage}
                auditMode={auditMode}
                reducedMotion={reducedMotion}
                darkMode={darkMode}
                lang={lang}
              />

              {/* Selected Validator Details Card */}
              <div className="p-5 border border-hairline dark:border-nocturneRule bg-linen/60 dark:bg-nocturneSurface grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-8">
                  <div className="font-mono text-[11px] text-vermilion uppercase">
                    SELECTED VALIDATOR // {selectedValidator.id} ({selectedValidator.epistemicRole})
                  </div>
                  <div className="font-serif text-2xl mt-0.5">
                    {selectedValidator.designation} — {selectedValidator.modelArchitecture}
                  </div>
                  <p className="text-xs text-graphite dark:text-stone-300 mt-1">
                    {lang === 'en'
                      ? selectedValidator.domainSpecialtyEn
                      : selectedValidator.domainSpecialtyZh}
                  </p>
                </div>
                <div className="sm:col-span-4 sm:text-right font-mono">
                  <div className="text-xs text-graphite dark:text-stone-400">BONDED STAKE</div>
                  <div className="text-xl font-semibold tabular-nums">
                    {selectedValidator.stakeGen.toLocaleString()} GEN
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'WORKBENCH' && (
          <ReplicationWorkbench
            discovery={activeDiscovery}
            auditStage={auditStage}
            auditMode={auditMode}
            onRunAudit={triggerAuditSimulation}
            onRegisterCustomDiscovery={handleRegisterCustom}
            lang={lang}
            boundContractAddress={boundContractAddr || null}
          />
        )}

        {activeTab === 'CONTRACT' && (
          <ContractAndRpcInspector
            rpcTelemetry={rpcTelemetry}
            onRefreshRpc={(m) => probeStudionetEndpoint(m).then(setRpcTelemetry)}
            customContractAddr={boundContractAddr}
            onChangeContractAddr={setBoundContractAddr}
            lang={lang}
          />
        )}

        {activeTab === 'GOVERNANCE' && <ArchitectureAndGovernance lang={lang} />}
      </main>

      {/* Archival Colophon Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-hairline dark:border-nocturneRule font-mono text-[11px] text-graphite dark:text-stone-400 flex flex-wrap items-center justify-between gap-4">
        <div>
          HELIOSOPHIA v1.0 // AUTONOMOUS SCIENTIFIC REPRODUCIBILITY & IP ROYALTY LEDGER
        </div>
        <div>
          GENLAYER STABLE STUDIONET (CHAIN ID: 61999) • RPC: https://studio.genlayer.com/api
        </div>
      </footer>
    </div>
  );
}
