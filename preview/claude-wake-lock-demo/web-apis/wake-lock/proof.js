// The proof test. It has two steps. You do not touch the device during a step.
//   1. Measure: the lock is off. Wait until the screen turns off (up to 10 min).
//      The result is your device's sleep time.
//   2. Test the lock: the lock is on. Wait for the sleep time plus 30 s.
//      If the screen stays on, the lock works.
//
// The first sign that the screen went off is one of these:
//   - the page became hidden (most phones hide the page when the screen turns off), or
//   - a gap in a timer (timers stop while the screen is off).
//
// MDN: https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
//      https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event

import { mmss } from "./time.js";

const MEASURE_MAX_MS = 10 * 60_000;
const MARGIN_MS = 30_000;
const DEFAULT_TEST_MS = 2 * 60_000;
const GAP_MS = 3000;
const STORE_KEY = "wake-lock-demo-sleep-ms";

export function createProofTest({ lock, log, els, sound }) {
  let run = null;
  const results = [];
  let sleepMs = loadSleep();

  function loadSleep() {
    try { return Number(localStorage.getItem(STORE_KEY)) || null; } catch { return null; }
  }
  function saveSleep(ms) {
    sleepMs = ms;
    try { localStorage.setItem(STORE_KEY, String(ms)); } catch { /* ignore */ }
  }
  function testMs() {
    return sleepMs ? sleepMs + MARGIN_MS : DEFAULT_TEST_MS;
  }

  async function start(mode) {
    if (run) return;
    let ownLock = false;
    if (mode === "lock" && !lock.wanted) {
      await lock.start();
      if (lock.state !== "on") {
        els.status.textContent = "The test cannot start. The lock did not turn on. See the log.";
        return;
      }
      ownLock = true;
    }
    if (mode === "measure" && lock.wanted) {
      await lock.stop("the measure step needs the lock off");
    }
    const durationMs = mode === "measure" ? MEASURE_MAX_MS : testMs();
    run = { mode, ownLock, startedAt: Date.now(), durationMs, offAt: null, offHow: "", touches: 0 };
    log.add(mode === "measure"
      ? "Measure started. Lock off. Do not touch the device."
      : `Lock test started. Lock on, ${mmss(durationMs)}. Do not touch the device.`);
    render();
  }

  function markOff(at, how) {
    if (!run || run.offAt) return;
    run.offAt = at;
    run.offHow = how;
  }

  function cancel() {
    if (!run) return;
    log.add("Test canceled.");
    finish(true);
  }

  function finish(canceled = false) {
    const r = run;
    run = null;
    if (r.ownLock && lock.wanted) lock.stop("the test ended");
    if (canceled) { render(); return; }

    const offAfter = r.offAt !== null && r.offAt - r.startedAt < r.durationMs
      ? Math.max(0, r.offAt - r.startedAt) : null;
    const result = { mode: r.mode, duration: r.durationMs, offAfter, offHow: r.offHow, touches: r.touches };
    if (r.mode === "measure" && offAfter !== null && r.touches === 0) saveSleep(offAfter);
    results.unshift(result);
    log.add(`Test done. ${describe(result)}`, offAfter === null ? "on" : "off");
    if (offAfter === null && !document.hidden) sound.done();
    render();
  }

  function describe(r) {
    const touched = r.touches ? ` You touched the screen ${r.touches}×, so the result may be wrong.` : "";
    if (r.mode === "measure") {
      return (r.offAfter !== null
        ? `Your screen turns off after about ${mmss(r.offAfter)}.`
        : `The screen stayed on for ${mmss(r.duration)}. Your auto-lock may be set to "Never".`) + touched;
    }
    return (r.offAfter === null
      ? `✅ The lock worked. The screen stayed on for ${mmss(r.duration)}.`
      : `❌ The screen went off after ${mmss(r.offAfter)}, with the lock on. Battery saver or a system setting can cause this.`) + touched;
  }

  function render() {
    const running = Boolean(run);
    els.measure.disabled = running;
    els.test.disabled = running || !lock.supported;
    els.cancel.hidden = !running;
    els.sleep.textContent = sleepMs
      ? `Measured sleep time: ${mmss(sleepMs)}. The lock test runs for ${mmss(testMs())}.`
      : `No sleep time yet. Without it, the lock test runs for ${mmss(DEFAULT_TEST_MS)}.`;

    if (running) {
      const touched = run.touches ? ` You touched the screen ${run.touches}×. A touch resets the sleep timer.` : "";
      const elapsed = Date.now() - run.startedAt;
      els.status.textContent = run.mode === "measure"
        ? `Measuring. Put the device down and wait for the screen to turn off. Then wake it. (${mmss(elapsed)})${touched}`
        : `Testing the lock. Put the device down. ${mmss(run.durationMs - elapsed)} left.${touched}`;
    } else {
      els.status.textContent = results.length ? "Done. See the results below." : "";
    }

    els.results.replaceChildren(...results.map((r) => {
      const li = document.createElement("li");
      li.className = r.mode === "lock" ? (r.offAfter === null ? "stayed" : "failed") : "measured";
      const b = document.createElement("b");
      b.textContent = r.mode === "measure" ? "Measure" : "Lock test";
      li.append(b, document.createElement("br"), describe(r));
      return li;
    }));
  }

  // ---- Signals ----

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) markOff(Date.now(), "page hidden");
  });
  for (const type of ["pointerdown", "keydown"]) {
    document.addEventListener(type, (e) => {
      if (!run || e.target.closest?.("#proof-cancel")) return;
      run.touches++;
    }, { capture: true });
  }
  els.measure.addEventListener("click", () => start("measure"));
  els.test.addEventListener("click", () => start("lock"));
  els.cancel.addEventListener("click", cancel);

  // This timer also checks for its own gaps. After a long gap it can fire before
  // the heartbeat, so it must not wait for the heartbeat to report.
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    if (run && now - lastTick > GAP_MS) markOff(lastTick, "timer stopped");
    lastTick = now;
    if (!run || document.hidden) return;
    // Measure ends when the screen came back on. A lock test ends at its time.
    if ((run.mode === "measure" && run.offAt) || now >= run.startedAt + run.durationMs) finish();
    else render();
  }, 500);

  render();

  return {
    // Call this when the heartbeat finds a gap.
    gap(g) { markOff(g.start, "timer stopped"); },
    text() {
      const lines = results.map((r) => `- ${r.mode === "measure" ? "Measure" : "Lock test"}: ${describe(r)}`);
      return [sleepMs ? `Sleep time: ${mmss(sleepMs)}` : "Sleep time: not measured", ...lines].join("\n");
    },
  };
}
