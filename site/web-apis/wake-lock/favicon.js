// Draws the favicon and sets the tab title for each lock state.

const COLORS = { on: "#1f9d55", paused: "#e0a800", off: "#8a8a8a", error: "#d64545" };
const EMOJI = { on: "🟢", paused: "🟡", off: "⚪", error: "🔴" };

function svg(state) {
  const c = COLORS[state];
  const inner = state === "paused"
    ? `<rect x="11" y="9" width="4" height="14" rx="1" fill="#fff"/><rect x="17" y="9" width="4" height="14" rx="1" fill="#fff"/>`
    : state === "on"
      ? `<circle cx="16" cy="16" r="6" fill="#fff"/>`
      : `<circle cx="16" cy="16" r="6" fill="none" stroke="#fff" stroke-width="3"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="${c}"/>${inner}</svg>`;
}

export function showState(state, base, extra = "") {
  const link = document.getElementById("favicon");
  link.href = "data:image/svg+xml," + encodeURIComponent(svg(state));
  document.title = `${EMOJI[state]} ${extra ? extra + " · " : ""}${base}`;
}
