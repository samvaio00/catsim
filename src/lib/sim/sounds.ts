type SoundName =
  | "meow"
  | "meowHungry"
  | "meowAnnoyed"
  | "trill"
  | "chirp"
  | "purrStart"
  | "purrStop"
  | "hiss"
  | "eat"
  | "drink"
  | "litterScratch"
  | "stepWood"
  | "stepRug"
  | "land"
  | "jump"
  | "bat"
  | "bounce"
  | "ceramic"
  | "plastic"
  | "woodHit"
  | "cushion"
  | "pet"
  | "kibble"
  | "waterPour"
  | "scoop"
  | "wipe"
  | "treat"
  | "ui";

type MeowKind = "hello" | "hungry" | "annoyed" | "demand";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private purrGain: GainNode | null = null;
  private purrNodes: AudioNode[] = [];
  private roomGain: GainNode | null = null;
  private unlocked = false;
  private muted = false;
  private lastPlayed = new Map<string, number>();

  get ready() {
    return this.unlocked && !!this.ctx;
  }

  async unlock() {
    if (this.unlocked && this.ctx?.state === "running") return;
    const ctx = this.ctx ?? new AudioContext();
    this.ctx = ctx;
    if (ctx.state === "suspended") await ctx.resume();
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(ctx.destination);
      this.startRoomTone();
    }
    this.unlocked = true;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.55;
  }

  play(name: SoundName, intensity = 1) {
    if (!this.ctx || !this.master || this.muted) return;
    if (!this.throttle(name, 70)) return;
    const g = Math.max(0.05, Math.min(1.4, intensity));
    switch (name) {
      case "meow":
        this.meow("hello", g);
        break;
      case "meowHungry":
        this.meow("hungry", g);
        break;
      case "meowAnnoyed":
        this.meow("annoyed", g);
        break;
      case "trill":
        this.trill(g);
        break;
      case "chirp":
        this.chirp(g);
        break;
      case "purrStart":
        this.startPurr();
        break;
      case "purrStop":
        this.stopPurr();
        break;
      case "hiss":
        this.hiss(g);
        break;
      case "eat":
        this.eat(g);
        break;
      case "drink":
        this.drink(g);
        break;
      case "litterScratch":
        this.litterScratch(g);
        break;
      case "stepWood":
        this.step(false, g);
        break;
      case "stepRug":
        this.step(true, g);
        break;
      case "land":
        this.land(g);
        break;
      case "jump":
        this.jump(g);
        break;
      case "bat":
        this.bat(g);
        break;
      case "bounce":
        this.bounce(g);
        break;
      case "ceramic":
        this.ceramic(g);
        break;
      case "plastic":
        this.plastic(g);
        break;
      case "woodHit":
        this.woodHit(g);
        break;
      case "cushion":
        this.cushion(g);
        break;
      case "pet":
        this.pet(g);
        break;
      case "kibble":
        this.kibble(g);
        break;
      case "waterPour":
        this.waterPour(g);
        break;
      case "scoop":
        this.scoop(g);
        break;
      case "wipe":
        this.wipe(g);
        break;
      case "treat":
        this.treat(g);
        break;
      case "ui":
        this.ui();
        break;
    }
  }

  meow(kind: MeowKind = "hello", intensity = 1) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const dur =
      kind === "hungry" ? 0.62 : kind === "annoyed" ? 0.28 : kind === "demand" ? 0.8 : 0.42;
    const startF =
      kind === "hungry" ? 920 : kind === "annoyed" ? 540 : kind === "demand" ? 780 : 740;
    const endF =
      kind === "hungry" ? 380 : kind === "annoyed" ? 320 : kind === "demand" ? 340 : 410;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(endF, now + dur * 0.72);

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(startF * 0.5, now);
    osc2.frequency.exponentialRampToValueAtTime(endF * 0.52, now + dur * 0.72);

    const formant = ctx.createBiquadFilter();
    formant.type = "bandpass";
    formant.frequency.setValueAtTime(kind === "hungry" ? 1400 : 1100, now);
    formant.frequency.linearRampToValueAtTime(700, now + dur);
    formant.Q.value = 6;

    const body = ctx.createBiquadFilter();
    body.type = "lowpass";
    body.frequency.value = 2200;

    const gain = ctx.createGain();
    const peak = 0.18 * intensity;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.04);
    if (kind === "hungry" || kind === "demand") {
      gain.gain.exponentialRampToValueAtTime(peak * 0.7, now + dur * 0.35);
      gain.gain.exponentialRampToValueAtTime(peak, now + dur * 0.5);
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(formant);
    osc2.connect(formant);
    formant.connect(body);
    body.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + dur + 0.02);
    osc2.stop(now + dur + 0.02);
  }

  private trill(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.linearRampToValueAtTime(820, now + 0.18);
    osc.frequency.linearRampToValueAtTime(560, now + 0.34);
    const trem = ctx.createOscillator();
    trem.frequency.value = 28;
    const tremGain = ctx.createGain();
    tremGain.gain.value = 0.35;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12 * intensity, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    trem.connect(tremGain);
    tremGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    trem.start(now);
    osc.stop(now + 0.4);
    trem.stop(now + 0.4);
  }

  private chirp(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.09);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1500;
    filter.Q.value = 4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08 * intensity, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  private startPurr() {
    if (!this.ctx || !this.master || this.purrGain) return;
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.25);

    const pulse = ctx.createOscillator();
    pulse.type = "sine";
    pulse.frequency.value = 26;
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0.7;
    pulse.connect(pulseGain);

    const noise = this.noise(2);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 90;
    filter.Q.value = 2.2;
    const rumble = ctx.createOscillator();
    rumble.type = "triangle";
    rumble.frequency.value = 52;

    pulseGain.connect(gain.gain);
    noise.connect(filter);
    filter.connect(gain);
    rumble.connect(gain);
    gain.connect(this.master);
    pulse.start();
    rumble.start();
    this.purrGain = gain;
    this.purrNodes = [pulse, rumble, noise, filter, pulseGain];
  }

  private stopPurr() {
    if (!this.ctx || !this.purrGain) return;
    const now = this.ctx.currentTime;
    this.purrGain.gain.cancelScheduledValues(now);
    this.purrGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    const nodes = this.purrNodes;
    const gain = this.purrGain;
    this.purrGain = null;
    this.purrNodes = [];
    window.setTimeout(() => {
      for (const n of nodes) {
        if ("stop" in n && typeof n.stop === "function") {
          try {
            n.stop();
          } catch {
            /* already stopped */
          }
        }
        n.disconnect();
      }
      gain.disconnect();
    }, 260);
  }

  private hiss(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const noise = this.noise(0.55);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16 * intensity, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    noise.connect(hp);
    hp.connect(gain);
    gain.connect(this.master);
    window.setTimeout(() => noise.stop(), 560);
  }

  private eat(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    for (let i = 0; i < 5; i++) {
      const t = ctx.currentTime + i * 0.09 + Math.random() * 0.03;
      const n = this.noise(0.07);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800 + Math.random() * 900;
      bp.Q.value = 3;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1 * intensity, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      n.connect(bp);
      bp.connect(g);
      g.connect(this.master);
      window.setTimeout(() => n.stop(), 120 + i * 90);
    }
  }

  private drink(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    for (let i = 0; i < 4; i++) {
      const t = ctx.currentTime + i * 0.14;
      const n = this.noise(0.08);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07 * intensity, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      n.connect(lp);
      lp.connect(g);
      g.connect(this.master);
      window.setTimeout(() => n.stop(), 200 + i * 140);
    }
  }

  private litterScratch(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    for (let i = 0; i < 6; i++) {
      const t = ctx.currentTime + i * 0.07;
      const n = this.noise(0.06);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 420 + Math.random() * 280;
      bp.Q.value = 1.4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09 * intensity, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      n.connect(bp);
      bp.connect(g);
      g.connect(this.master);
      window.setTimeout(() => n.stop(), 90 + i * 70);
    }
  }

  private step(rug: boolean, intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const n = this.noise(0.05);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = rug ? 280 : 520;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime((rug ? 0.035 : 0.055) * intensity, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + (rug ? 0.07 : 0.045));
    n.connect(f);
    f.connect(g);
    g.connect(this.master);
    window.setTimeout(() => n.stop(), 90);
  }

  private land(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);
    const n = this.noise(0.1);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16 * intensity, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(g);
    n.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.18);
    window.setTimeout(() => n.stop(), 180);
  }

  private jump(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const n = this.noise(0.06);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06 * intensity, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    n.connect(hp);
    hp.connect(g);
    g.connect(this.master);
    window.setTimeout(() => n.stop(), 100);
  }

  private bat(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const n = this.noise(0.05);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 700;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12 * intensity, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    n.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    window.setTimeout(() => n.stop(), 90);
  }

  private bounce(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.11 * intensity, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  private ceramic(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    for (const freq of [1900, 2730, 4100]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.35);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.05 * intensity, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.42);
    }
  }

  private plastic(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);
    const n = this.noise(0.06);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.09 * intensity, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(g);
    n.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.11);
    window.setTimeout(() => n.stop(), 110);
  }

  private woodHit(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.14);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.14 * intensity, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  private cushion(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const n = this.noise(0.12);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 220;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08 * intensity, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    n.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    window.setTimeout(() => n.stop(), 200);
  }

  private pet(intensity: number) {
    if (!this.ctx || !this.master) return;
    if (!this.throttle("pet", 180)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const n = this.noise(0.16);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 240;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.045 * intensity, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    n.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    window.setTimeout(() => n.stop(), 180);
  }

  private kibble(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    for (let i = 0; i < 14; i++) {
      const t = ctx.currentTime + i * 0.035 + Math.random() * 0.02;
      const n = this.noise(0.04);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2200 + Math.random() * 1400;
      bp.Q.value = 4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07 * intensity, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      n.connect(bp);
      bp.connect(g);
      g.connect(this.master);
      window.setTimeout(() => n.stop(), 80 + i * 35);
    }
  }

  private waterPour(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const n = this.noise(0.7);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(900, now);
    bp.frequency.linearRampToValueAtTime(1400, now + 0.5);
    bp.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.08 * intensity, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    n.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    window.setTimeout(() => n.stop(), 760);
  }

  private scoop(intensity: number) {
    if (!this.ctx || !this.master) return;
    this.litterScratch(intensity * 0.8);
    this.plastic(intensity * 0.6);
  }

  private wipe(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const n = this.noise(0.28);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.06 * intensity, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    n.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    window.setTimeout(() => n.stop(), 300);
  }

  private treat(intensity: number) {
    this.plastic(intensity * 0.5);
    window.setTimeout(() => this.kibble(0.4 * intensity), 80);
  }

  private ui() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 660;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.04, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  private startRoomTone() {
    if (!this.ctx || !this.master || this.roomGain) return;
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.018;
    const hum = ctx.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 58;
    const air = this.noise(60);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 180;
    hum.connect(gain);
    air.connect(lp);
    lp.connect(gain);
    gain.connect(this.master);
    hum.start();
    this.roomGain = gain;
  }

  private noise(duration: number) {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.start();
    return src;
  }

  private throttle(key: string, ms: number) {
    const now = performance.now();
    const last = this.lastPlayed.get(key) ?? 0;
    if (now - last < ms) return false;
    this.lastPlayed.set(key, now);
    return true;
  }
}

export const sounds = new SoundEngine();
