import React from 'react';

interface Props {
  lang: 'en' | 'zh';
}

export const ArchitectureAndGovernance: React.FC<Props> = ({ lang }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 border border-hairline dark:border-nocturneRule bg-linen/60 dark:bg-nocturneSurface">
          <div className="font-mono text-xs text-vermilion uppercase">§ 01 // NON-COMPARATIVE SYNTHESIS</div>
          <h4 className="font-serif text-xl mt-1">
            {lang === 'en' ? 'Prior-Art & Falsifiability Indexing' : '先验文献与可证伪性合成'}
          </h4>
          <p className="text-xs text-graphite dark:text-stone-300 mt-2 leading-relaxed">
            {lang === 'en'
              ? 'Uses gl.eq_principle.prompt_non_comparative so the Leader extracts structured methodology vectors and SHA-256 commitments from preprint URLs while Validators verify schema and factual grounding without requiring byte-identical prose.'
              : '运用 gl.eq_principle.prompt_non_comparative，由 Leader 节点从预印本 URL 提取结构化方法论向量与 SHA-256 承诺，验证节点核验其事实依据与 JSON 结构，无需逐字完全相同即可达成共识。'}
          </p>
        </div>

        <div className="p-5 border border-hairline dark:border-nocturneRule bg-linen/60 dark:bg-nocturneSurface">
          <div className="font-mono text-xs text-prussian uppercase">§ 02 // COMPARATIVE REPLICATION</div>
          <h4 className="font-serif text-xl mt-1">
            {lang === 'en' ? 'Empirical Tolerance Verification' : '独立实测容差比较原则'}
          </h4>
          <p className="text-xs text-graphite dark:text-stone-300 mt-2 leading-relaxed">
            {lang === 'en'
              ? 'Uses gl.eq_principle.prompt_comparative so every validator independently fetches the replication laboratory telemetry and verifies that the empirical variance lies within the declared confidence interval.'
              : '运用 gl.eq_principle.prompt_comparative，每个验证节点独立抓取复现实验室的遥测数据，并交叉验证实测偏差是否严格落在声明的置信区间内。'}
          </p>
        </div>

        <div className="p-5 border border-hairline dark:border-nocturneRule bg-linen/60 dark:bg-nocturneSurface">
          <div className="font-mono text-xs text-verdigris uppercase">§ 03 // RISK & HONEST BOUNDARIES</div>
          <h4 className="font-serif text-xl mt-1">
            {lang === 'en' ? 'Cryptographic Digest & Appeal Guards' : '密码学摘要锚定与风险边界'}
          </h4>
          <p className="text-xs text-graphite dark:text-stone-300 mt-2 leading-relaxed">
            {lang === 'en'
              ? 'Prevents mutable web-page spoofing by committing the SHA-256 digest of fetched payloads directly inside the on-chain discovery record, and enforces strict input validation on royalty splits (500–5,000 bps).'
              : '通过将抓取网页的 SHA-256 摘要直接锚定在链上发现记录中防止事后篡改，并对复现分成比例（500–5,000 bps）实施严格边界检验。'}
          </p>
        </div>
      </div>

      {/* Product Roadmap Table */}
      <div className="p-6 border border-hairline dark:border-nocturneRule bg-alabaster dark:bg-nocturneBg">
        <div className="font-mono text-xs uppercase tracking-widest text-vermilion mb-3">
          § PRODUCT ROADMAP (IMPLEMENTED VS. FUTURE PHASES)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 border border-verdigris/50 bg-linen/40 dark:bg-nocturneSurface">
            <div className="text-verdigris font-semibold">[IMPLEMENTED // v1.0]</div>
            <div className="font-sans font-semibold text-sm mt-1">
              GenVM Preprint Synthesis & Replication Royalty Ledger
            </div>
            <p className="font-sans text-xs text-graphite dark:text-stone-300 mt-1">
              Full Python Intelligent Contract (`HeliosophiaLedger`), 4/4 unit tests, live Studionet 61999 RPC probe, and automated deployment writeback script.
            </p>
          </div>
          <div className="p-4 border border-hairline dark:border-nocturneRule bg-linen/40 dark:bg-nocturneSurface">
            <div className="text-prussian font-semibold">[PHASE II // Q1 2027]</div>
            <div className="font-sans font-semibold text-sm mt-1">
              DOI / ORCID Cryptographic Attestation Bridge
            </div>
            <p className="font-sans text-xs text-graphite dark:text-stone-300 mt-1">
              Zero-knowledge TLSNotary proofs binding institutional ORCID researcher identities directly to Lead Author payout addresses.
            </p>
          </div>
          <div className="p-4 border border-hairline dark:border-nocturneRule bg-linen/40 dark:bg-nocturneSurface">
            <div className="text-ochre font-semibold">[PHASE III // Q2 2027]</div>
            <div className="font-sans font-semibold text-sm mt-1">
              Autonomous IP Licensing AMM & Citation Yield
            </div>
            <p className="font-sans text-xs text-graphite dark:text-stone-300 mt-1">
              Dynamic pricing curves that scale commercial pharmaceutical and AI patent licensing fees automatically with on-chain ECI scores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
