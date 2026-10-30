import React, { useState } from 'react';
import {
  INITIAL_DEPLOYMENT_BRIDGE,
  probeStudionetEndpoint,
  STUDIONET_CHAIN_CONFIG,
  StudionetRpcTelemetry,
} from '../config/studionet';
import { soundInstrument } from '../audio/mechanicalSound';

interface Props {
  rpcTelemetry: StudionetRpcTelemetry | null;
  onRefreshRpc: (txMethod: 'eth_chainId' | 'eth_blockNumber' | 'net_version') => void;
  customContractAddr: string;
  onChangeContractAddr: (addr: string) => void;
  lang: 'en' | 'zh';
}

const CONTRACT_SOURCE_DISPLAY = `# { "Depends": "py-genlayer:latest" }
from genlayer import *
import json
import hashlib

class HeliosophiaLedger(gl.Contract):
    discoveries: TreeMap[str, str]
    replication_logs: TreeMap[str, str]
    discovery_count: u256

    def __init__(self):
        self.discovery_count = u256(0)

    @gl.public.write
    def register_discovery(
        self,
        discovery_id: str,
        lead_author: str,
        title: str,
        preprint_url: str,
        target_metric_clause: str,
        royalty_pool_usdc: u256,
        replicator_share_bps: u256
    ) -> str:
        def synthesize_epistemic_baseline() -> str:
            webpage_text = gl.get_webpage(preprint_url, mode="text")
            source_sha256 = hashlib.sha256(webpage_text.encode("utf-8")).hexdigest()
            return gl.exec_prompt(f"Synthesize baseline for {title} ({source_sha256})")

        synthesis_raw = gl.eq_principle.prompt_non_comparative(
            synthesize_epistemic_baseline,
            task="Synthesize falsifiable methodology baseline from preprint URL",
            criteria="Valid JSON with novelty_tier, initial_eci_bps, methodology_summary"
        )
        # Stores canonical discovery record in self.discoveries[discovery_id]
        ...

    @gl.public.write
    def submit_replication_proof(
        self,
        discovery_id: str,
        replication_lab: str,
        telemetry_url: str,
        lab_notes: str
    ) -> str:
        # Uses gl.eq_principle.prompt_comparative to verify empirical replication
        # and automatically settle dynamic royalty splits between Author & Replicator
        ...`;

export const ContractAndRpcInspector: React.FC<Props> = ({
  rpcTelemetry,
  onRefreshRpc,
  customContractAddr,
  onChangeContractAddr,
  lang,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    soundInstrument.playApertureClick();
    navigator.clipboard.writeText(CONTRACT_SOURCE_DISPLAY).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Deployment Bridge Status Banner */}
      <div className="p-5 border border-hairline dark:border-nocturneRule bg-linen/70 dark:bg-nocturneSurface grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-1.5">
          <div className="font-mono text-xs uppercase tracking-widest text-vermilion">
            § GPT WORK AUTO-WRITEBACK BRIDGE (`src/config/deployment.json`)
          </div>
          <h3 className="font-serif text-2xl">
            {INITIAL_DEPLOYMENT_BRIDGE.mode === 'LIVE_STUDIONET_ONCHAIN_BOUND'
              ? lang === 'en'
                ? 'Bound to Live GenLayer Stable Studionet Contract'
                : '已绑定 GenLayer Stable Studionet 真实链上合约'
              : lang === 'en'
              ? 'Local Verified GenVM Simulation (Ready for Studionet Deployment)'
              : '本地已核验 GenVM 沙盒状态（待执行 Studionet 链上部署脚本）'}
          </h3>
          <p className="text-xs text-graphite dark:text-stone-300 leading-relaxed">
            {INITIAL_DEPLOYMENT_BRIDGE.notice}
          </p>
        </div>

        <div className="lg:col-span-5 space-y-2">
          <label className="block font-mono text-[11px] uppercase">
            {lang === 'en'
              ? 'Mount Deployed HeliosophiaLedger Contract Address (61999)'
              : '挂载已部署的 HeliosophiaLedger 合约地址 (61999)'}
          </label>
          <input
            type="text"
            value={customContractAddr}
            onChange={(e) => onChangeContractAddr(e.target.value)}
            placeholder="0x... (Auto-populated by npm run deploy:studionet)"
            className="w-full px-3 py-2 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg font-mono text-xs"
          />
        </div>
      </div>

      {/* Live Studionet 61999 JSON-RPC Inspector & Python Intelligent Contract */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-5 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-vermilion">
              LIVE STUDIONET 61999 JSON-RPC PROBE
            </span>
            <span className="font-mono text-xs tabular-nums">
              {rpcTelemetry ? `${rpcTelemetry.latencyMs} ms` : 'PROBING...'}
            </span>
          </div>

          <div className="text-xs font-mono space-y-1 text-graphite dark:text-stone-300">
            <div>ENDPOINT: {STUDIONET_CHAIN_CONFIG.rpcEndpoint}</div>
            <div>EXPECTED CHAIN ID: 61999 (0xF22F)</div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['eth_chainId', 'eth_blockNumber', 'net_version'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  soundInstrument.playApertureClick();
                  onRefreshRpc(m);
                }}
                className="px-3 py-1.5 border border-hairline dark:border-nocturneRule bg-linen dark:bg-nocturneSurface font-mono text-xs hover:border-vermilion transition"
              >
                POST {m}
              </button>
            ))}
          </div>

          <pre className="p-3 bg-linen dark:bg-nocturneSurface border border-hairline dark:border-nocturneRule font-mono text-[11px] overflow-x-auto leading-relaxed">
            {rpcTelemetry ? rpcTelemetry.rawJsonPayload : '// Probing https://studio.genlayer.com/api ...'}
          </pre>
        </div>

        <div className="lg:col-span-7 p-5 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-graphite dark:text-stone-300">
              contracts/heliosophia_ledger.py (GenVM Python Intelligent Contract)
            </span>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1 border border-hairline dark:border-nocturneRule font-mono text-xs hover:border-carbon transition"
            >
              {copied ? 'COPIED ✓' : 'COPY CONTRACT'}
            </button>
          </div>
          <pre className="p-4 bg-linen dark:bg-nocturneSurface border border-hairline dark:border-nocturneRule font-mono text-[11px] overflow-x-auto leading-relaxed max-h-[360px]">
            {CONTRACT_SOURCE_DISPLAY}
          </pre>
        </div>
      </div>
    </div>
  );
};
