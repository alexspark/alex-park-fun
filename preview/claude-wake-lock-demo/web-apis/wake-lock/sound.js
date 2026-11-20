// Short tones made with the Web Audio API. No sound files.
// Browsers allow audio only after a user action, so call unlock() in a click handler.
// MDN: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
//      https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay (why audio needs a user action)

let ctx = null;

export function unlock() {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
}

function play(freqs) {
  if (!ctx) return;
  let t = ctx.currentTime;
  for (const freq of freqs) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
    t += 0.13;
  }
}

export const playOn = () => play([523, 784]); // up: C5, G5
export const playOff = () => play([784, 392]); // down: G5, G4
export const playDone = () => play([523, 659, 784]); // up three steps: C5, E5, G5
