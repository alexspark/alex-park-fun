// Wraps the Screen Wake Lock API.
// States: "off", "on", "paused" (you want the lock, but the tab is hidden), "error".
// The API does not say why a lock was released. This class guesses the reason.
//
// MDN:
//   Screen Wake Lock API  https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
//   WakeLockSentinel      https://developer.mozilla.org/en-US/docs/Web/API/WakeLockSentinel
//   visibilitychange      https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
//   EventTarget           https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
//
// A "sentinel" is the object that request() gives back. It is your handle to one lock.
// The browser always releases the lock when the tab is hidden. So we request it again on visibilitychange.

export class WakeLock extends EventTarget {
  supported = "wakeLock" in navigator;
  sentinel = null;
  wanted = false;
  reacquire = true;
  state = "off";
  #reason = null;

  constructor() {
    super();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.wanted && !this.sentinel) {
        this.#request("tab is visible again");
      }
    });
  }

  async start() {
    this.wanted = true;
    await this.#request("you pressed start");
  }

  async stop(reason = "you pressed stop") {
    this.wanted = false;
    if (this.sentinel) {
      this.#reason = reason;
      await this.sentinel.release();
    } else {
      this.#set("off", reason);
    }
  }

  async #request(reason) {
    if (!this.supported) {
      this.#fail(new Error("This browser does not have the Wake Lock API."));
      return;
    }
    if (this.sentinel) return;
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      sentinel.addEventListener("release", () => this.#onRelease(sentinel), { once: true });
      this.sentinel = sentinel;
      if (!this.wanted) {
        // stop() ran while the request was in progress.
        this.#reason = "you pressed stop";
        await sentinel.release();
        return;
      }
      this.#set("on", reason);
    } catch (err) {
      this.#fail(err);
    }
  }

  #onRelease(sentinel) {
    if (this.sentinel !== sentinel) return;
    this.sentinel = null;
    const reason = this.#reason ?? (document.hidden ? "tab is hidden" : "the browser or system released it");
    this.#reason = null;
    if (this.wanted && this.reacquire && document.hidden) {
      this.#set("paused", reason);
    } else {
      this.wanted = false;
      this.#set("off", reason);
    }
  }

  #fail(err) {
    this.wanted = false;
    this.#set("error", `${err.name}: ${err.message}`);
  }

  #set(state, reason) {
    this.state = state;
    this.dispatchEvent(new CustomEvent("change", { detail: { state, reason } }));
  }
}
