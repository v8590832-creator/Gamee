import type { GameSettings } from '../types';

/**
 * 100% procedural Web Audio synthesizer for BOUNCEBACK.
 * Zero external audio files — eliminates 404s and allows real-time velocity/time-scale modulation.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Continuous rolling loop
  private rollOsc: OscillatorNode | null = null;
  private rollFilter: BiquadFilterNode | null = null;
  private rollGain: GainNode | null = null;

  // Ambient music pad
  private padOsc1: OscillatorNode | null = null;
  private padOsc2: OscillatorNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private padGain: GainNode | null = null;

  private muted = false;
  private settings: GameSettings;
  private baseHz = 55;
  private musicStep = 0;
  private musicTimer: number | null = null;

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    const ua = (navigator as unknown as { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua && !ua.hasBeenActive) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyVolumes();
      this.initRollingLoop();
      this.initAmbientPad();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public updateSettings(settings: GameSettings): void {
    this.settings = settings;
    this.applyVolumes();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyVolumes();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const master = this.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setTargetAtTime(master, now, 0.04);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume * 0.35, now, 0.08);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume * 0.7, now, 0.04);
  }

  private initRollingLoop(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.rollOsc = this.ctx.createOscillator();
    this.rollOsc.type = 'triangle';
    this.rollOsc.frequency.value = 55;

    this.rollFilter = this.ctx.createBiquadFilter();
    this.rollFilter.type = 'lowpass';
    this.rollFilter.frequency.value = 180;

    this.rollGain = this.ctx.createGain();
    this.rollGain.gain.value = 0;

    this.rollOsc.connect(this.rollFilter);
    this.rollFilter.connect(this.rollGain);
    this.rollGain.connect(this.sfxGain);
    this.rollOsc.start();
  }

  private initAmbientPad(): void {
    if (!this.ctx || !this.musicGain) return;
    this.padOsc1 = this.ctx.createOscillator();
    this.padOsc2 = this.ctx.createOscillator();
    this.padOsc1.type = 'sine';
    this.padOsc2.type = 'triangle';
    this.padOsc1.frequency.value = this.baseHz;
    this.padOsc2.frequency.value = this.baseHz * 1.5;

    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 340;

    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.22;

    this.padOsc1.connect(this.padFilter);
    this.padOsc2.connect(this.padFilter);
    this.padFilter.connect(this.padGain);
    this.padGain.connect(this.musicGain);

    this.padOsc1.start();
    this.padOsc2.start();

    // Gentle generative architectural arpeggio pulse every 1.6s
    if (this.musicTimer === null && typeof window !== 'undefined') {
      const ratios = [1, 1.5, 1.2, 1.8, 1.333, 2.0, 1.5, 1.125];
      this.musicTimer = window.setInterval(() => {
        if (!this.ctx || this.ctx.state !== 'running' || this.muted || !this.musicGain) return;
        const ratio = ratios[this.musicStep % ratios.length];
        this.musicStep++;
        const noteHz = this.baseHz * 2 * ratio;
        this.playTone(noteHz, 0.85, 'sine', 0.09, this.musicGain, 0.08);
      }, 1600);
    }
  }

  public setWorldProfile(baseHz: number): void {
    this.baseHz = baseHz;
    if (!this.ctx || !this.padOsc1 || !this.padOsc2) return;
    const now = this.ctx.currentTime;
    this.padOsc1.frequency.setTargetAtTime(baseHz, now, 0.35);
    this.padOsc2.frequency.setTargetAtTime(baseHz * 1.5, now, 0.35);
  }

  public updateRolling(speed: number, grounded: boolean, timeSlow: boolean): void {
    if (!this.ctx || !this.rollGain || !this.rollOsc || !this.rollFilter) return;
    const now = this.ctx.currentTime;
    const targetGain = grounded ? Math.min(0.16, Math.max(0, (speed - 0.8) * 0.012)) : 0;
    const freq = 42 + Math.min(140, speed * 5.5);
    this.rollGain.gain.setTargetAtTime(targetGain, now, 0.06);
    this.rollOsc.frequency.setTargetAtTime(freq, now, 0.06);
    this.rollFilter.frequency.setTargetAtTime(timeSlow ? 140 : 260 + speed * 14, now, 0.08);
    if (this.padFilter) {
      this.padFilter.frequency.setTargetAtTime(timeSlow ? 160 : 380, now, 0.12);
    }
  }

  public silenceLoops(): void {
    if (!this.ctx || !this.rollGain) return;
    this.rollGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    dest: AudioNode,
    attack = 0.01,
    endFreq?: number
  ): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playJump(): void {
    this.unlock();
    if (!this.sfxGain) return;
    const jitter = 0.94 + Math.random() * 0.12;
    this.playTone(190 * jitter, 0.18, 'triangle', 0.28, this.sfxGain, 0.008, 420 * jitter);
  }

  public playBounce(intensity = 1): void {
    this.unlock();
    if (!this.sfxGain) return;
    const scale = Math.min(1.5, Math.max(0.5, intensity));
    this.playTone(115, 0.28, 'sine', 0.35 * scale, this.sfxGain, 0.005, 58);
    this.playTone(320 * scale, 0.24, 'triangle', 0.22 * scale, this.sfxGain, 0.01, 640);
  }

  public playDash(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(280, 0.26, 'sawtooth', 0.18, this.sfxGain, 0.006, 95);
    this.playTone(520, 0.2, 'sine', 0.22, this.sfxGain, 0.006, 180);
  }

  public playGravityShift(inverted: boolean): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(inverted ? 180 : 340, 0.32, 'sine', 0.26, this.sfxGain, 0.01, inverted ? 360 : 160);
  }

  public playTimeControl(active: boolean): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(active ? 440 : 220, 0.28, 'triangle', 0.2, this.sfxGain, 0.01, active ? 180 : 380);
  }

  public playPortal(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(330, 0.35, 'sine', 0.24, this.sfxGain, 0.01, 780);
    this.playTone(495, 0.35, 'triangle', 0.16, this.sfxGain, 0.02, 990);
  }

  public playCollectible(comboIndex = 0): void {
    this.unlock();
    if (!this.sfxGain) return;
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const hz = pentatonic[comboIndex % pentatonic.length];
    this.playTone(hz, 0.28, 'sine', 0.26, this.sfxGain, 0.005);
    this.playTone(hz * 1.5, 0.22, 'triangle', 0.14, this.sfxGain, 0.01);
  }

  public playCheckpoint(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(392, 0.32, 'sine', 0.22, this.sfxGain, 0.01);
    setTimeout(() => {
      if (this.sfxGain) this.playTone(587.33, 0.42, 'sine', 0.22, this.sfxGain, 0.01);
    }, 90);
  }

  public playSwitch(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(260, 0.15, 'square', 0.14, this.sfxGain, 0.005, 520);
  }

  public playFall(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(220, 0.38, 'sawtooth', 0.18, this.sfxGain, 0.01, 65);
  }

  public playVictory(): void {
    this.unlock();
    if (!this.sfxGain) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((hz, i) => {
      setTimeout(() => {
        if (this.sfxGain) this.playTone(hz, 0.45, 'triangle', 0.22, this.sfxGain, 0.01);
      }, i * 100);
    });
  }

  public playUiClick(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(620, 0.06, 'sine', 0.12, this.sfxGain, 0.003, 440);
  }

  public dispose(): void {
    if (this.musicTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
