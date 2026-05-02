/* ============================================================
   AUDIO ENGINE – Web Audio API synthesizer
   ============================================================ */

let ctx = null;
let masterGain = null;
let enabled = true;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, type, duration, volume, startTime, endFreq) {
  if (!enabled) return;
  const ac = getCtx();
  const now = startTime ?? ac.currentTime;

  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

function noise(duration, volume) {
  if (!enabled) return;
  const ac = getCtx();
  const now = ac.currentTime;
  const bufSize = Math.floor(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

  const src = ac.createBufferSource();
  src.buffer = buf;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value = 0.5;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start(now);
}

export const Audio = {
  setEnabled(v) { enabled = v; },

  splash() {
    noise(0.15, 0.4);
    tone(220, 'sine', 0.3, 0.3, undefined, 80);
  },

  bite() {
    tone(800, 'square', 0.1, 0.4);
    tone(1200, 'square', 0.1, 0.4, getCtx().currentTime + 0.12);
    tone(800, 'square', 0.1, 0.4, getCtx().currentTime + 0.24);
  },

  reel() {
    const ac = getCtx();
    tone(1800, 'sawtooth', 0.04, 0.15, ac.currentTime);
    tone(1600, 'sawtooth', 0.04, 0.15, ac.currentTime + 0.05);
  },

  catchSmall() {
    const ac = getCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => tone(f, 'sine', 0.25, 0.3, ac.currentTime + i * 0.08));
  },

  catchBig() {
    const ac = getCtx();
    const notes = [392, 523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => tone(f, 'triangle', 0.35, 0.4, ac.currentTime + i * 0.07));
    setTimeout(() => noise(0.3, 0.3), 500);
  },

  catchLegendary() {
    const ac = getCtx();
    const now = ac.currentTime;
    // Big dramatic chord
    [261, 329, 392, 523].forEach(f => tone(f, 'triangle', 1.2, 0.35, now));
    // Rising arpeggio
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      tone(f, 'sine', 0.4, 0.5, now + 0.5 + i * 0.06)
    );
    setTimeout(() => noise(0.5, 0.5), 1200);
  },

  escape() {
    const ac = getCtx();
    tone(600, 'sawtooth', 0.4, 0.4, undefined, 150);
    tone(400, 'sine', 0.3, 0.2, ac.currentTime + 0.15);
  },

  tension() {
    tone(440, 'square', 0.06, 0.2);
  },

  lineCast() {
    noise(0.2, 0.25);
    const ac = getCtx();
    tone(300, 'sine', 0.3, 0.2, ac.currentTime, 100);
  },

  buttonTap() {
    tone(880, 'sine', 0.06, 0.15);
  },

  menuIn() {
    const ac = getCtx();
    tone(440, 'sine', 0.15, 0.2, ac.currentTime);
    tone(660, 'sine', 0.15, 0.2, ac.currentTime + 0.08);
  },
};
