/**
 * Dieter Rams / Leica Inspired Mechanical Laboratory Acoustic Engine
 * Synthesizes subtle mechanical shutter clicks, tuning-fork harmonics,
 * and vernier caliper ticks using native Web Audio API.
 * Strictly muted by default; zero external audio dependencies.
 */
export class MechanicalSoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = false;
  public gainLevel = 0.28;

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctx) this.ctx = new Ctx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public pulseHaptic(durationMs = 10): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(durationMs);
      } catch {
        // Ignore on unsupported devices
      }
    }
  }

  /** Mechanical aperture click (short damped high-frequency impulse) */
  public playApertureClick(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1240, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.032);
    gain.gain.setValueAtTime(this.gainLevel * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.032);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  }

  /** Tuning-fork harmonic chime for validator consensus convergence */
  public playHarmonicStep(stepIndex: number, coherent = true): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const frequencies = [440.0, 554.37, 659.25, 880.0, 1108.73, 1318.51];
    const freq = coherent ? frequencies[stepIndex % frequencies.length] : 196.0;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = coherent ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(this.gainLevel * 0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.24);
  }

  /** Warm acoustic chord upon Epistemic Confidence Index finality */
  public playEpistemicSeal(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const chord = [293.66, 440.0, 554.37, 659.25]; // D major 9th open fifths
    chord.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.04);
      gain.gain.setValueAtTime(this.gainLevel * 0.2, ctx.currentTime + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.04);
      osc.stop(ctx.currentTime + 0.9);
    });
  }
}

export const soundInstrument = new MechanicalSoundEngine();
