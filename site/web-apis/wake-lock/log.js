// Event log with times. The newest line is at the top.

const MAX = 200;
const lines = [];

export function createLog(listEl) {
  function add(text, kind = "info") {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    lines.unshift(`${time}  ${text}`);
    if (lines.length > MAX) lines.pop();
    const li = document.createElement("li");
    li.className = kind;
    const t = document.createElement("time");
    t.textContent = time;
    li.append(t, " ", text);
    listEl.prepend(li);
    while (listEl.children.length > MAX) listEl.lastChild.remove();
  }
  function clear() {
    lines.length = 0;
    listEl.replaceChildren();
  }
  return { add, clear, text: () => lines.join("\n") };
}
