// Checks that tell if the Wake Lock API can work on this page.
// Each check gives { label, ok, note }. ok is true, false, or null (unknown).
// MDN: https://developer.mozilla.org/en-US/docs/Web/API/Window/isSecureContext
//      https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy
//      https://developer.mozilla.org/en-US/docs/Web/API/Permissions/query
//      https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getBattery

export async function runChecks() {
  const checks = [];

  const has = "wakeLock" in navigator;
  checks.push({
    label: "Browser has the API",
    ok: has,
    note: has ? "navigator.wakeLock exists." : "Use a newer Chrome, Edge, Safari, or Firefox.",
  });

  checks.push({
    label: "Secure page (HTTPS)",
    ok: window.isSecureContext,
    note: window.isSecureContext ? "The API needs HTTPS or localhost." : "Open the page with HTTPS.",
  });

  const policy = document.permissionsPolicy ?? document.featurePolicy;
  const allowed = policy ? policy.allowsFeature("screen-wake-lock") : null;
  checks.push({
    label: "Permissions Policy allows it",
    ok: allowed,
    note: allowed === null
      ? "This browser cannot report the policy."
      : allowed ? "The page may use the lock." : "A parent page or a header blocks the lock.",
  });

  try {
    const status = await navigator.permissions.query({ name: "screen-wake-lock" });
    checks.push({
      label: "Permission",
      ok: status.state === "denied" ? false : true,
      note: `The browser says "${status.state}".`,
    });
  } catch {
    // Many browsers do not have this permission name. Skip the check.
  }

  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      const pct = Math.round(b.level * 100);
      checks.push({
        label: "Battery",
        ok: b.charging || pct > 20 ? true : null,
        note: `${pct}%, ${b.charging ? "charging" : "not charging"}. Battery saver can block the lock.`,
      });
    } catch { /* skip */ }
  }

  return checks;
}
