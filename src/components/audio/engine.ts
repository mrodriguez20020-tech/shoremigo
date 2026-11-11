/**
 * ShoreMigo sonic identity — 100% synthesized in the browser with Web Audio.
 * No samples, no third-party music: everything here is original and royalty-free.
 *
 *  ambience  : brown-noise surf with slow swell LFO + airy breeze band + sparse bird chirps
 *  motif     : a 5-note pentatonic "tide" phrase in a soft marimba-like voice
 *  character : Migo's short voice-like blips (greeting, curious, excited, listening, success, concern, resolve)
 */
export type Sfx = "greet" | "curious" | "excited" | "listen" | "success" | "concern" | "resolve" | "tap";

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private ambBus!: GainNode;
  private sfxBus!: GainNode;
  private ambNodes: AudioNode[] = [];
  private birdTimer: ReturnType<typeof setTimeout> | null = null;
  private ambOn = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);
    this.ambBus = this.ctx.createGain();
    this.ambBus.gain.value = 0;
    this.ambBus.connect(this.master);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.7;
    this.sfxBus.connect(this.master);
    return this.ctx;
  }

  async unlock() {
    const c = this.ensure();
    if (c.state === "suspended") await c.resume();
  }

  setVolume(v: number) {
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), this.ctx.currentTime, 0.1);
  }

  private noiseBuffer(c: AudioContext, seconds = 4) {
    const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02; // brown noise
      d[i] = last * 3.5;
    }
    return buf;
  }

  startAmbience() {
    const c = this.ensure();
    if (this.ambOn) return;
    this.ambOn = true;
    const buf = this.noiseBuffer(c);

    // Surf: lowpassed brown noise with a slow "swell" LFO on gain.
    const surf = c.createBufferSource();
    surf.buffer = buf;
    surf.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 650;
    const swell = c.createGain();
    swell.gain.value = 0.35;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoAmt = c.createGain();
    lfoAmt.gain.value = 0.25;
    lfo.connect(lfoAmt).connect(swell.gain);
    surf.connect(lp).connect(swell).connect(this.ambBus);

    // Breeze: bandpassed noise, very quiet, slowly wandering.
    const breeze = c.createBufferSource();
    breeze.buffer = buf;
    breeze.loop = true;
    breeze.playbackRate.value = 1.7;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    bp.Q.value = 0.6;
    const bg = c.createGain();
    bg.gain.value = 0.05;
    const lfo2 = c.createOscillator();
    lfo2.frequency.value = 0.05;
    const lfo2Amt = c.createGain();
    lfo2Amt.gain.value = 700;
    lfo2.connect(lfo2Amt).connect(bp.frequency);
    breeze.connect(bp).connect(bg).connect(this.ambBus);

    surf.start();
    breeze.start();
    lfo.start();
    lfo2.start();
    this.ambNodes = [surf, breeze, lfo, lfo2];
    this.ambBus.gain.setTargetAtTime(0.5, c.currentTime, 1.5);
    this.scheduleBird();
  }

  private scheduleBird() {
    this.birdTimer = setTimeout(() => {
      if (!this.ambOn || !this.ctx) return;
      const c = this.ctx;
      const t = c.currentTime;
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        const o = c.createOscillator();
        const g = c.createGain();
        const st = t + i * 0.13;
        const f = 2600 + Math.random() * 900;
        o.frequency.setValueAtTime(f, st);
        o.frequency.exponentialRampToValueAtTime(f * 1.35, st + 0.07);
        g.gain.setValueAtTime(0, st);
        g.gain.linearRampToValueAtTime(0.025, st + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.09);
        o.connect(g).connect(this.ambBus);
        o.start(st);
        o.stop(st + 0.1);
      }
      this.scheduleBird();
    }, 7000 + Math.random() * 9000);
  }

  stopAmbience() {
    if (!this.ctx || !this.ambOn) return;
    this.ambOn = false;
    if (this.birdTimer) clearTimeout(this.birdTimer);
    const c = this.ctx;
    this.ambBus.gain.setTargetAtTime(0, c.currentTime, 0.4);
    const nodes = this.ambNodes;
    setTimeout(() => nodes.forEach((n) => (n as AudioScheduledSourceNode).stop?.()), 1800);
    this.ambNodes = [];
  }

  /** Duck ambience (e.g. during checkout) without stopping it. */
  duck(on: boolean) {
    if (!this.ctx || !this.ambOn) return;
    this.ambBus.gain.setTargetAtTime(on ? 0 : 0.5, this.ctx.currentTime, 0.5);
  }

  private note(freq: number, start: number, dur: number, gain = 0.12, type: OscillatorType = "sine", bus?: GainNode) {
    const c = this.ctx!;
    const o = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    o2.type = "sine";
    o2.frequency.setValueAtTime(freq * 4, start); // marimba-ish overtone
    const g2 = c.createGain();
    g2.gain.setValueAtTime(gain * 0.15, start);
    g2.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.3);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(bus ?? this.sfxBus);
    o2.connect(g2).connect(bus ?? this.sfxBus);
    o.start(start);
    o2.start(start);
    o.stop(start + dur + 0.05);
    o2.stop(start + dur + 0.05);
  }

  /** Migo's voice: a pitch-gliding blip with a soft formant. */
  private chirp(f0: number, f1: number, start: number, dur: number, gain = 0.1) {
    const c = this.ctx!;
    const o = c.createOscillator();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(f0, start);
    o.frequency.exponentialRampToValueAtTime(f1, start + dur);
    f.type = "bandpass";
    f.frequency.value = 1400;
    f.Q.value = 1.2;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(f).connect(g).connect(this.sfxBus);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  sfx(kind: Sfx) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.01;
    switch (kind) {
      case "greet":
        this.chirp(520, 880, t, 0.14);
        this.chirp(700, 1040, t + 0.16, 0.16);
        break;
      case "curious":
        this.chirp(600, 980, t, 0.22, 0.08);
        break;
      case "excited":
        [660, 880, 1100].forEach((f, i) => this.chirp(f, f * 1.2, t + i * 0.08, 0.09, 0.08));
        break;
      case "listen":
        this.note(784, t, 0.25, 0.05);
        break;
      case "success":
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.note(f, t + i * 0.11, 0.6, 0.09));
        break;
      case "concern":
        this.chirp(620, 420, t, 0.28, 0.08);
        break;
      case "resolve":
        [587.33, 739.99, 880].forEach((f, i) => this.note(f, t + i * 0.13, 0.7, 0.08));
        break;
      case "tap":
        this.note(1200, t, 0.08, 0.04);
        break;
    }
  }

  /** Soft scene-change motif (pentatonic), routed through ambience bus so it obeys the ambience toggle. */
  motif(scene: string) {
    if (!this.ctx || !this.ambOn) return;
    const t = this.ctx.currentTime + 0.05;
    const base = scene === "sunset" ? 392 : scene === "night" ? 329.63 : 440;
    [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3].forEach((r, i) => this.note(base * r, t + i * 0.22, 1.4, 0.035, "sine", this.ambBus));
  }
}
