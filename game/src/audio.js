// audio.js — tiny WebAudio bleeps, synthesized in code, no sound files.
// One job: short cues for grab, alarm, win and loss. Silent until the
// player first interacts, so the AudioContext is never created uninvited.
export class VaultAudio {
  constructor() {
    this.context = null;
  }

  /** Create the context on a user gesture; safe to call any time. */
  ensure() {
    try {
      if (!this.context) {
        const Ctor = window.AudioContext ?? window.webkitAudioContext;
        if (Ctor) this.context = new Ctor();
      }
      if (this.context && this.context.state === 'suspended') void this.context.resume();
    } catch {
      this.context = null;
    }
  }

  tone(freq, seconds, type, volume) {
    if (!this.context) return;
    try {
      const now = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start(now);
      osc.stop(now + seconds);
    } catch {
      // Sound is garnish; a failure must never break the game.
    }
  }

  /** Bright two-note chime when the diamond is taken. */
  playGrab() {
    this.tone(880, 0.12, 'sine', 0.12);
    window.setTimeout(() => this.tone(1318, 0.18, 'sine', 0.12), 90);
  }

  /** Harsh alarm blip while the meter is full. */
  playAlarm() {
    this.tone(220, 0.16, 'square', 0.07);
    window.setTimeout(() => this.tone(175, 0.16, 'square', 0.07), 160);
  }

  /** Rising fanfare for the getaway. */
  playWin() {
    this.tone(523, 0.14, 'triangle', 0.12);
    window.setTimeout(() => this.tone(659, 0.14, 'triangle', 0.12), 130);
    window.setTimeout(() => this.tone(784, 0.26, 'triangle', 0.12), 260);
  }

  /** Low falling note for being caught. */
  playLose() {
    this.tone(196, 0.35, 'sawtooth', 0.08);
    window.setTimeout(() => this.tone(131, 0.5, 'sawtooth', 0.08), 200);
  }
}
