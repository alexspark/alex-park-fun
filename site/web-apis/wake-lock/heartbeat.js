// Finds gaps in a 1-second timer.
// When the screen turns off or the page freezes, timers stop. When they start again,
// the time since the last tick is much more than 1 second. That is a gap.
//
// We use Date.now() (the wall clock), not performance.now(). On some systems
// performance.now() does not move while the device sleeps.
//
// MDN: https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval
//      https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#timeouts_in_inactive_tabs
//      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now

const TICK_MS = 1000;
const GAP_MS = 3000; // a delay longer than this counts as a gap

export function startHeartbeat(onGap) {
  let last = Date.now();
  setInterval(() => {
    const now = Date.now();
    const late = now - last;
    if (late > GAP_MS) onGap({ start: last, end: now, ms: late });
    last = now;
  }, TICK_MS);
}
