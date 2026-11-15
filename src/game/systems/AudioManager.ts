import type { GameSettings } from '../types';

/**
 * 100% procedural Web Audio synthesizer for BOUNCEBACK: THE GREAT ROAD ADVENTURE.
 * Indian pentatonic raga-inspired synth arpeggio + footsteps + horns + monsoon thunder.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private rollOsc: OscillatorNode | null = null;
  private rollFilter: BiquadFilterNode | null = null;
  private rollGain: GainNode | null = null;

  private padOsc1: OscillatorNode | null = null;
  private padOsc2: OscillatorNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private padGain: GainNode | null = null;

  private muted = false;
  private settings: GameSettings;
  private baseHz = 55;
  private musicStep = 0;
  private musicTimer: number | null = null;
  private footstepAccum = 0;

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    const ua = (navigator as unknown as { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua && !ua.hasBeenActive) return;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
        void this.ctx.resume().catch(() => {});
      }
    } catch {
      // Browser blocked or lacks Web Audio support; keep game silent without crashing
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
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume * 0.36, now, 0.08);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume * 0.72, now, 0.04);
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
    this.padGain.gain.value = 0.2;

    this.padOsc1.connect(this.padFilter);
    this.padOsc2.connect(this.padFilter);
    this.padFilter.connect(this.padGain);
    this.padGain.connect(this.musicGain);

    this.padOsc1.start();
    this.padOsc2.start();

    // Upbeat Indian-inspired Raga Bhupali arcade rhythm pulse
    if (this.musicTimer === null && typeof window !== 'undefined') {
      const ratios = [1, 1.125, 1.25, 1.5, 1.667, 2.0, 1.667, 1.25];
      this.musicTimer = window.setInterval(() => {
        if (!this.ctx || this.ctx.state !== 'running' || this.muted || !this.musicGain) return;
        const ratio = ratios[this.musicStep % ratios.length];
        const isBeat = this.musicStep % 2 === 0;
        this.musicStep++;
        const noteHz = this.baseHz * 2 * ratio;
        this.playTone(noteHz, 0.55, 'triangle', 0.085, this.musicGain, 0.02);
        if (isBeat) {
          // Subtle tabla-like low percussive pulse
          this.playTone(this.baseHz * 1.5, 0.14, 'sine', 0.09, this.musicGain, 0.005, this.baseHz * 0.9);
        }
      }, 650);
    }
  }

  public setWorldProfile(baseHz: number): void {
    this.baseHz = baseHz;
    if (!this.ctx || !this.padOsc1 || !this.padOsc2) return;
    const now = this.ctx.currentTime;
    this.padOsc1.frequency.setTargetAtTime(baseHz, now, 0.35);
    this.padOsc2.frequency.setTargetAtTime(baseHz * 1.5, now, 0.35);
  }

  public updateMovementAudio(dt: number, speed: number, grounded: boolean, isSliding: boolean, specialActive: boolean): void {
    if (!this.ctx || !this.rollGain || !this.rollOsc || !this.rollFilter) return;
    const now = this.ctx.currentTime;
    const targetGain = isSliding ? 0.14 : grounded ? Math.min(0.06, Math.max(0, (speed - 1.5) * 0.005)) : 0;
    const freq = isSliding ? 130 : 52 + Math.min(90, speed * 3.5);
    this.rollGain.gain.setTargetAtTime(targetGain, now, 0.05);
    this.rollOsc.frequency.setTargetAtTime(freq, now, 0.05);
    this.rollFilter.frequency.setTargetAtTime(specialActive ? 220 : 320 + speed * 12, now, 0.08);
    if (this.padFilter) {
      this.padFilter.frequency.setTargetAtTime(specialActive ? 220 : 420, now, 0.12);
    }

    // Crisp rhythmic footsteps while walking/running/sprinting
    if (grounded && !isSliding && speed > 1.8 && this.sfxGain) {
      const interval = Math.max(0.18, 0.42 - speed * 0.015);
      this.footstepAccum += dt;
      if (this.footstepAccum >= interval) {
        this.footstepAccum = 0;
        this.playTone(95 + Math.random() * 25, 0.055, 'triangle', 0.08, this.sfxGain, 0.004, 55);
      }
    } else {
      this.footstepAccum = 0;
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

  public playJump(isDouble = false): void {
    this.unlock();
    if (!this.sfxGain) return;
    const base = isDouble ? 290 : 195;
    this.playTone(base, 0.18, 'triangle', 0.25, this.sfxGain, 0.008, base * 2.1);
  }

  public playSlide(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(170, 0.22, 'sawtooth', 0.12, this.sfxGain, 0.01, 75);
  }

  public playBounce(intensity = 1): void {
    this.unlock();
    if (!this.sfxGain) return;
    const scale = Math.min(1.5, Math.max(0.5, intensity));
    this.playTone(120, 0.28, 'sine', 0.34 * scale, this.sfxGain, 0.005, 62);
    this.playTone(340 * scale, 0.24, 'triangle', 0.22 * scale, this.sfxGain, 0.01, 680);
  }

  public playDash(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(280, 0.26, 'sawtooth', 0.18, this.sfxGain, 0.006, 95);
    this.playTone(540, 0.2, 'sine', 0.22, this.sfxGain, 0.006, 200);
  }

  public playSpecial(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(330, 0.35, 'triangle', 0.24, this.sfxGain, 0.01, 660);
    this.playTone(495, 0.35, 'sine', 0.18, this.sfxGain, 0.02, 880);
  }

  public playHorn(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(310, 0.18, 'sawtooth', 0.11, this.sfxGain, 0.008);
    this.playTone(390, 0.18, 'sawtooth', 0.09, this.sfxGain, 0.008);
  }

  public playDamage(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(140, 0.28, 'sawtooth', 0.25, this.sfxGain, 0.005, 52);
  }

  public playThunder(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(75, 0.9, 'sawtooth', 0.14, this.sfxGain, 0.04, 34);
  }

  public playGravityShift(inverted: boolean): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(inverted ? 180 : 340, 0.32, 'sine', 0.24, this.sfxGain, 0.01, inverted ? 360 : 160);
  }

  public playPortal(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(330, 0.35, 'sine', 0.24, this.sfxGain, 0.01, 780);
    this.playTone(495, 0.35, 'triangle', 0.16, this.sfxGain, 0.02, 990);
  }

  public playCollectible(comboIndex = 0, isRare = false): void {
    this.unlock();
    if (!this.sfxGain) return;
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const hz = pentatonic[comboIndex % pentatonic.length] * (isRare ? 1.25 : 1.0);
    this.playTone(hz, 0.26, 'sine', 0.24, this.sfxGain, 0.005);
    this.playTone(hz * 1.5, 0.2, 'triangle', 0.14, this.sfxGain, 0.01);
  }

  public playCheckpoint(): void {
    this.unlock();
    if (!this.sfxGain) return;
    this.playTone(392, 0.3, 'sine', 0.2, this.sfxGain, 0.01);
    setTimeout(() => {
      if (this.sfxGain) this.playTone(587.33, 0.4, 'sine', 0.22, this.sfxGain, 0.01);
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
    const notes = [440, 554.37, 659.25, 880, 1046.5];
    notes.forEach((hz, i) => {
      setTimeout(() => {
        if (this.sfxGain) this.playTone(hz, 0.45, 'triangle', 0.22, this.sfxGain, 0.01);
      }, i * 90);
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
