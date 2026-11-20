// The proof test.
// You run it once with the lock off and once with the lock on. You do not touch the device.
// The test records the first sign that the screen went off:
//   - the page became hidden (most phones hide the page when the screen turns off), or
//   - a gap in the 1-second timer (see heartbeat.js).
//
// MDN: https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
//      https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event

import { mmss } from "./time.js";

export function createProofTest({ lock, log, els, sound }) {
  let run = null;
  const results = [];

  function minutes() {
    return Number(document.querySelector('input[name="proof-minutes"]:checked').value);
  }

  async function start(withLock) {
    if (run) return;
    let ownLock = false;
    if (withLock && !lock.wanted) {
      await lock.start();
      if (lock.state !== "on") {
        els.status.textContent = "The test cannot start. The lock did not turn on. See the log.";
        return;
      }
      ownLock = true;
    }
    if (!withLock && lock.wanted) {
      await lock.stop("the test needs the lock off");
    }
    const durationMs = minutes() * 60_000;
    run = { withLock, ownLock, startedAt: Date.now(), durationMs, offAt: null, offHow: "", touches: 0 };
    log.add(`Test started: lock ${withLock ? "on" : "off"}, ${minutes()} min. Do not touch the device.`);
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

    const offAfter = r.offAt ? Math.max(0, r.offAt - r.startedAt) : null;
    const result = {
      withLock: r.withLock,
      duration: r.durationMs,
      offAfter: offAfter !== null && offAfter < r.durationMs ? offAfter : null,
      offHow: r.offHow,
      touches: r.touches,
    };
    results.unshift(result);
    log.add(`Test done: ${summary(result)}`, result.offAfter === null ? "on" : "off");
    if (result.offAfter === null && !document.hidden) sound.done();
    render();
  }

  function summary(r) {
    const lockText = r.withLock ? "Lock on" : "Lock off";
    const what = r.offAfter === null
      ? `the screen stayed on for all ${mmss(r.duration)}.`
      : `the screen went off after ${mmss(r.offAfter)} (${r.offHow}).`;
    return `${lockText}: ${what}`;
  }

  function verdict(r) {
    if (r.withLock && r.offAfter === null) return "✅ The lock worked.";
    if (r.withLock) return "❌ The lock did not keep the screen on. Battery saver or a system setting can cause this.";
    if (r.offAfter !== null) return `This is your normal sleep time: about ${mmss(r.offAfter)}.`;
    return "Your screen timeout is longer than the test. Pick a longer test, or set a shorter auto-lock time in your device settings.";
  }

  function render() {
    const running = Boolean(run);
    els.withLock.disabled = running || !lock.supported;
    els.withoutLock.disabled = running;
    els.cancel.hidden = !running;
    if (running) {
      const left = run.startedAt + run.durationMs - Date.now();
      const touched = run.touches ? ` You touched the screen ${run.touches}×. A touch resets the sleep timer.` : "";
      els.status.textContent = `Testing with the lock ${run.withLock ? "on" : "off"}. Put the device down. ${mmss(left)} left.${touched}`;
    } else if (!results.length) {
      els.status.textContent = "";
    } else {
      els.status.textContent = "Test done. See the results below.";
    }
    els.results.replaceChildren(...results.map((r) => {
      const li = document.createElement("li");
      li.className = r.offAfter === null ? "stayed" : "slept";
      const b = document.createElement("b");
      b.textContent = summary(r);
      const p = document.createElement("span");
      p.textContent = verdict(r) + (r.touches ? ` (You touched the screen ${r.touches}×.)` : "");
      li.append(b, document.createElement("br"), p);
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
  els.withLock.addEventListener("click", () => start(true));
  els.withoutLock.addEventListener("click", () => start(false));
  els.cancel.addEventListener("click", cancel);

  // This timer also checks for its own gaps. The heartbeat cannot do it here:
  // after a long gap, this timer can fire first and end the test before the heartbeat reports.
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    if (run && now - lastTick > 3000) markOff(lastTick, "timer stopped");
    lastTick = now;
    if (!run) return;
    if (now >= run.startedAt + run.durationMs) finish();
    else render();
  }, 500);

  render();

  return {
    // Call this when the heartbeat finds a gap.
    gap(g) { markOff(g.start, "timer stopped"); },
    text() { return results.map((r) => `- ${summary(r)} ${verdict(r)}`).join("\n") || "(none)"; },
  };
}
