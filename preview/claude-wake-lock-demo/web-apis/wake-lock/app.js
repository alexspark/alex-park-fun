import { WakeLock } from "./lock.js";
import { unlock, playOn, playOff } from "./sound.js";
import { showState } from "./favicon.js";
import { runChecks } from "./checks.js";
import { createLog } from "./log.js";

const BASE_TITLE = "Wake Lock demo";
const $ = (id) => document.getElementById(id);

const lock = new WakeLock();
const log = createLog($("log"));

const settings = load();
let endsAt = null; // time (ms) when auto-off stops the lock
let onSince = null; // time (ms) when you pressed start

// ---- Settings (saved in this browser only) ----

function load() {
  const d = { minutes: 0, sound: true, reacquire: true };
  try { return { ...d, ...JSON.parse(localStorage.getItem("wake-lock-demo")) }; } catch { return d; }
}
function save() {
  try { localStorage.setItem("wake-lock-demo", JSON.stringify(settings)); } catch { /* ignore */ }
}

const minuteInput = document.querySelector(`input[name="minutes"][value="${settings.minutes}"]`);
if (minuteInput) minuteInput.checked = true;
$("sound").checked = settings.sound;
$("reacquire").checked = settings.reacquire;
lock.reacquire = settings.reacquire;

document.querySelectorAll('input[name="minutes"]').forEach((el) =>
  el.addEventListener("change", () => {
    settings.minutes = Number(el.value);
    save();
    if (lock.wanted) setTimer();
  }));
$("sound").addEventListener("change", (e) => { settings.sound = e.target.checked; save(); });
$("reacquire").addEventListener("change", (e) => {
  settings.reacquire = lock.reacquire = e.target.checked;
  save();
});

function setTimer() {
  endsAt = settings.minutes ? Date.now() + settings.minutes * 60_000 : null;
  if (endsAt) log.add(`Auto-off in ${settings.minutes} min.`);
}

// ---- Main button ----

$("toggle").addEventListener("click", async () => {
  unlock();
  if (lock.wanted) {
    await lock.stop();
  } else {
    log.add("Request the lock…");
    await lock.start();
  }
});

// ---- State changes ----

const STATUS = {
  off: "Off. The screen can sleep.",
  on: "On. The screen stays awake.",
  paused: "Paused. The tab is hidden. The lock turns on again when you come back.",
  error: "Error. See the log.",
};

lock.addEventListener("change", (e) => {
  const { state, reason } = e.detail;
  const kind = state === "on" ? "on" : state === "error" ? "error" : state === "paused" ? "paused" : "off";
  const verb = { on: "Lock on", off: "Lock off", paused: "Lock paused", error: "Lock failed" }[state];
  log.add(`${verb}: ${reason}.`, kind);

  if (state === "on" && !onSince) {
    onSince = Date.now();
    setTimer();
  }
  if (state === "off" || state === "error") {
    onSince = null;
    endsAt = null;
  }
  if (settings.sound) {
    // No sound for pause and resume. They happen each time you switch tabs.
    if (state === "on" && reason === "you pressed start") playOn();
    if (state === "off" || state === "error") playOff();
  }
  render();
});

document.addEventListener("visibilitychange", () => {
  log.add(document.hidden ? "Tab hidden." : "Tab visible.");
});

// ---- Display ----

function mmss(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0");
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}

function render() {
  const state = lock.state;
  document.body.dataset.state = state;
  $("toggle").setAttribute("aria-pressed", String(lock.wanted));
  $("toggle-label").textContent = lock.wanted ? "Stop" : "Keep screen awake";
  $("status").textContent = STATUS[state];

  const now = Date.now();
  $("held").textContent = onSince ? `On for ${mmss(now - onSince)}` : "";
  $("left").textContent = endsAt ? `Auto-off in ${mmss(endsAt - now)}` : "";
  showState(state, BASE_TITLE, endsAt ? `${mmss(endsAt - now)} left` : state === "on" ? "Awake" : state === "paused" ? "Paused" : "");
}

setInterval(() => {
  if (endsAt && Date.now() >= endsAt) {
    endsAt = null;
    lock.stop("auto-off timer ended");
  }
  if (lock.wanted) render();
}, 1000);

// ---- Checks ----

const checksEl = $("checks");
let checkResults = [];
runChecks().then((checks) => {
  checkResults = checks;
  checksEl.replaceChildren(...checks.map((c) => {
    const li = document.createElement("li");
    li.className = c.ok === true ? "ok" : c.ok === false ? "bad" : "unknown";
    const mark = c.ok === true ? "✅" : c.ok === false ? "❌" : "❔";
    li.innerHTML = `<span class="mark" aria-hidden="true">${mark}</span><span><b></b><br><small></small></span>`;
    li.querySelector("b").textContent = c.label;
    li.querySelector("small").textContent = c.note;
    return li;
  }));
  if (!lock.supported) $("toggle").disabled = true;
});

// ---- Log tools ----

$("clear").addEventListener("click", () => log.clear());
$("copy").addEventListener("click", async () => {
  const report = [
    "Wake Lock demo report",
    `Page: ${location.href}`,
    `Browser: ${navigator.userAgent}`,
    `State: ${lock.state}`,
    "",
    "Checks:",
    ...checkResults.map((c) => `- ${c.ok === true ? "yes" : c.ok === false ? "NO" : "?"}  ${c.label}: ${c.note}`),
    "",
    "Log (newest first):",
    log.text(),
  ].join("\n");
  try {
    await navigator.clipboard.writeText(report);
    $("copy").textContent = "Copied";
  } catch {
    $("copy").textContent = "Copy failed";
  }
  setTimeout(() => ($("copy").textContent = "Copy report"), 1500);
});

log.add(lock.supported ? "Page loaded. The API is available." : "Page loaded. The API is not available.", lock.supported ? "info" : "error");
render();
