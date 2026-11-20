# Status

Update this file at the end of each session. Put the newest entry at the top.

## Decisions

- No dependencies, no build step, no server. Reason: long life and a small supply chain.
- GitHub Pages serves the `gh-pages` branch. A bash-and-git workflow writes to it. No third-party Actions.
- The repo allows only GitHub-owned Actions (repo setting).
- Each branch gets a preview at `/preview/<branch>/`.

- Web API demos live in `site/web-apis/<api>/`. The list page is `site/web-apis/index.html`. Shared styles are in `site/web-apis/demo.css`.
- Wake Lock demo: no video fallback. Release reasons are guesses, and the page says so.
- Replies and docs use short, simple STE-style English.
- Each demo ends with a "Used on this page" list. Each item has an MDN link and one line on how the page uses it. Code comments also link to MDN. Reason: the owner reviews the code and wants to learn the APIs.

## Log

### 2026-11-19: Wake Lock demo, step 1

Branch: `claude/wake-lock-demo`.

- Made `/web-apis/` (demo list) and `/web-apis/wake-lock/`.
- Wake Lock page has: start/stop button, auto-off (5/15/30/60 min), turn on again after a tab switch, start/stop sounds (Web Audio), favicon and title that show the state, support checks, event log, copy report, MDN/spec links.
- Tested in headless Chromium at 360px: start, stop, checks. Headless tabs do not become hidden, so the tab-switch test was not done.

Later the same day:
- Added "Used on this page" list with MDN links.
- Added `.claude/settings.json` allow list (fewer permission prompts). Merge to `main` to use it everywhere.
- Step 2 done: proof test (`proof.js`, `heartbeat.js`). Step 1 measures the sleep time (lock off, up to 10 min). Step 2 tests the lock for that time + 30 s. The sleep time is saved in localStorage. Tested with a fake clock in headless Chromium.

Not finished:
- Test on a real iPhone and Android phone: tab switch, auto-off, sound, favicon, proof test.
- Step 3: lab (two locks, blocked iframe) and code panel.

Questions: Is the URL OK? Keep the tool at the top?

### 2026-11-19: Setup

- Made the repo, the publish workflow, and a placeholder page.
- Next: start on site ideas from the phone.
