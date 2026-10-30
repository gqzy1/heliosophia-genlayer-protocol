import React, { useEffect, useRef } from 'react';
import { EPISTEMIC_VALIDATOR_COMMITTEE } from '../data/discoveries';
import { EpistemicValidator, ScientificDiscovery } from '../types/heliosophia';

interface Props {
  discovery: ScientificDiscovery;
  selectedValidator: EpistemicValidator;
  onSelectValidator: (v: EpistemicValidator) => void;
  auditStage: number; // 0..5
  auditMode: 'REPLICATED' | 'REFUTED';
  reducedMotion: boolean;
  darkMode: boolean;
  lang: 'en' | 'zh';
}

export const EpistemicCartographyCanvas: React.FC<Props> = ({
  discovery,
  selectedValidator,
  onSelectValidator,
  auditStage,
  auditMode,
  reducedMotion,
  darkMode,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }
      ctx.save();
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const maxR = Math.min(w, h) * 0.39;

      if (!reducedMotion) {
        phaseRef.current += 0.008;
      }
      const t = phaseRef.current;

      // Palette tokens adapting to Archival Alabaster vs. Astronomical Nocturne
      const bgFill = darkMode ? '#121519' : '#EFECE4';
      const inkMain = darkMode ? '#F4F1EA' : '#141413';
      const inkMuted = darkMode ? 'rgba(244,241,234,0.38)' : 'rgba(20,20,19,0.38)';
      const gridStroke = darkMode ? 'rgba(244,241,234,0.09)' : 'rgba(20,20,19,0.09)';
      const vermilion = '#D9381E';
      const verdigris = '#15803D';
      const prussian = '#1D4ED8';

      ctx.fillStyle = bgFill;
      ctx.fillRect(0, 0, w, h);

      // 1. Fine Vernier Coordinate Crosshairs & Azimuthal Ticks
      ctx.strokeStyle = gridStroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, cy);
      ctx.lineTo(w - 20, cy);
      ctx.moveTo(cx, 20);
      ctx.lineTo(cx, h - 20);
      ctx.stroke();

      // Concentric Epistemic Confidence Rings (50%, 75%, 95% ECI contours)
      [0.36, 0.68, 1.0].forEach((ratio, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * ratio, 0, Math.PI * 2);
        ctx.setLineDash(idx === 1 ? [4, 4] : []);
        ctx.strokeStyle = gridStroke;
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Degree tick marks around outer astrolabe ring
      for (let deg = 0; deg < 360; deg += 10) {
        const rad = (deg * Math.PI) / 180;
        const inner = deg % 30 === 0 ? maxR * 0.95 : maxR * 0.975;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(rad) * inner, cy + Math.sin(rad) * inner);
        ctx.lineTo(cx + Math.cos(rad) * maxR, cy + Math.sin(rad) * maxR);
        ctx.strokeStyle = deg % 90 === 0 ? vermilion : gridStroke;
        ctx.stroke();
      }

      // 2. Empirical Confidence Corridor Ellipse
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(t * 0.5) * 0.12);
      ctx.beginPath();
      const rx = maxR * (auditMode === 'REFUTED' && auditStage >= 4 ? 0.58 : 0.34);
      const ry = maxR * (auditMode === 'REFUTED' && auditStage >= 4 ? 0.22 : 0.29);
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle =
        auditStage >= 4
          ? auditMode === 'REPLICATED'
            ? verdigris
            : vermilion
          : prussian;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle =
        auditStage >= 4
          ? auditMode === 'REPLICATED'
            ? 'rgba(21, 128, 61, 0.08)'
            : 'rgba(217, 56, 30, 0.09)'
          : 'rgba(29, 78, 216, 0.06)';
      ctx.fill();
      ctx.restore();

      // 3. Validator Nodes & Equivalence Harmonics
      EPISTEMIC_VALIDATOR_COMMITTEE.forEach((val, idx) => {
        const angle = val.phaseAngleRad + t * (0.28 + idx * 0.03);
        const orbitR = maxR * 0.76;
        const vx = cx + Math.cos(angle) * orbitR;
        const vy = cy + Math.sin(angle) * orbitR;

        // Harmonic vector ray to center discovery nucleus
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(vx, vy);
        ctx.strokeStyle =
          selectedValidator.id === val.id
            ? vermilion
            : auditStage >= 3
            ? auditMode === 'REPLICATED'
              ? 'rgba(21,128,61,0.4)'
              : 'rgba(217,56,30,0.45)'
            : gridStroke;
        ctx.lineWidth = selectedValidator.id === val.id ? 1.6 : 1;
        ctx.stroke();

        // Validator Node Marker
        const isSelected = selectedValidator.id === val.id;
        ctx.beginPath();
        ctx.arc(vx, vy, isSelected ? 9 : 6.5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? vermilion
          : auditStage >= 4
          ? auditMode === 'REPLICATED'
            ? verdigris
            : vermilion
          : inkMain;
        ctx.fill();

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(vx, vy, 14, 0, Math.PI * 2);
          ctx.strokeStyle = vermilion;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Precision Monospace Callout Label
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillStyle = inkMain;
        const labelOffset = vx >= cx ? 13 : -92;
        ctx.fillText(`${val.designation}`, vx + labelOffset, vy - 3);
        ctx.fillStyle = inkMuted;
        ctx.fillText(`${(val.stakeGen / 1000).toFixed(1)}k GEN`, vx + labelOffset, vy + 9);
      });

      // 4. Central Discovery Nucleus Reticle
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = vermilion;
      ctx.fill();

      // Corner Cartographic Telemetry Stamp
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = inkMuted;
      ctx.fillText(`FIG. 01 // EPISTEMIC PHASE-SPACE (${discovery.id})`, 16, 22);
      ctx.fillText(
        `TARGET: ${discovery.baselineMetricValue} ${discovery.baselineMetricUnit} (±${discovery.tolerancePlusMinus})`,
        16,
        h - 14
      );
      const eciCurrent =
        auditStage >= 4
          ? auditMode === 'REPLICATED'
            ? discovery.verifiedEciBps
            : discovery.refutedEciBps
          : discovery.initialEciBps;
      ctx.fillStyle = inkMain;
      ctx.fillText(`ECI: ${(eciCurrent / 100).toFixed(2)}%`, w - 115, 22);

      ctx.restore();
      if (!reducedMotion) {
        frameRef.current = requestAnimationFrame(render);
      }
    };

    render();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [discovery, selectedValidator, auditStage, auditMode, reducedMotion, darkMode, lang]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const cx = rect.width * 0.5;
    const cy = rect.height * 0.5;
    const maxR = Math.min(rect.width, rect.height) * 0.39;
    const t = phaseRef.current;

    for (let idx = 0; idx < EPISTEMIC_VALIDATOR_COMMITTEE.length; idx++) {
      const val = EPISTEMIC_VALIDATOR_COMMITTEE[idx];
      const angle = val.phaseAngleRad + t * (0.28 + idx * 0.03);
      const vx = cx + Math.cos(angle) * (maxR * 0.76);
      const vy = cy + Math.sin(angle) * (maxR * 0.76);
      const dist = Math.hypot(clickX - vx, clickY - vy);
      if (dist <= 26) {
        onSelectValidator(val);
        break;
      }
    }
  };

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-[350px] sm:h-[390px] cursor-crosshair border border-hairline dark:border-nocturneRule"
        aria-label="Interactive Epistemic Phase-Space and Validator Harmonics Instrument"
      />
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {EPISTEMIC_VALIDATOR_COMMITTEE.map((v) => {
          const active = selectedValidator.id === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onSelectValidator(v)}
              className={`text-left px-2.5 py-2 border transition-colors font-mono text-[11px] ${
                active
                  ? 'border-vermilion bg-vermilion/10 text-carbon dark:text-alabaster'
                  : 'border-hairline dark:border-nocturneRule bg-linen/60 dark:bg-nocturneSurface text-graphite dark:text-stone-300 hover:border-carbon'
              }`}
            >
              <div className="font-semibold truncate">{v.designation}</div>
              <div className="text-[10px] opacity-75 truncate">{v.provider}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
