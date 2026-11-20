# Instructions for Claude

Read this file and `docs/status.md` at the start of each session.

## Project

A static website. Plain HTML, CSS, and JavaScript. GitHub Pages serves it.

- Live site: https://alexspark.github.io/alex-park-fun/
- Branch previews: https://alexspark.github.io/alex-park-fun/preview/
- Repo: https://github.com/alexspark/alex-park-fun

## Rules

1. **No dependencies.** Do not add npm, package.json, build tools, frameworks, CDN scripts, or third-party GitHub Actions. If a task seems to need one, write the small part yourself, or ask the owner first.
2. **No server.** All code runs in the browser.
3. **Relative paths only.** The site runs at `/alex-park-fun/` and at `/alex-park-fun/preview/<branch>/`. Write `href="page.html"` or `./img/a.png`. Do not write `href="/page.html"`.
4. **Put published files in `site/`.** Only `site/` goes to the web. Do not make a `site/preview/` folder.
5. **Use JS modules.** Use `<script type="module">` and `import ... from "./file.js"`.
6. **Write docs in simple English.** Use the ASD-STE100 style as a guide: short sentences, one instruction in each sentence, active voice, common words.
7. **Keep it working on a phone.** Make each page work at 360px width.

## How the owner works

The owner often works from a phone with Claude Code remote sessions. The owner is not near the laptop.

- Do not wait for approval on small decisions. Make a sensible decision and write it in `docs/status.md`.
- Ask only when a decision is hard to change or the owner must do something (for example, change a GitHub setting).
- Work on a branch. Push the branch. A push publishes a preview in approximately 1 minute.
- At the end of a session, give the preview URL: `https://alexspark.github.io/alex-park-fun/preview/<branch>/`. In the branch name, each character that is not `A-Z a-z 0-9 . _ -` changes to `-`. Example: `claude/new-idea` becomes `claude-new-idea`.
- Merge to `main` to update the live site.

## At the end of each session

Update `docs/status.md`:
- What changed.
- What is not finished.
- Next steps and open questions.

Keep it short. The next session must be able to start from it.

## Test locally (laptop only)

```sh
python3 -m http.server -d site 8000
```

Then open http://localhost:8000/.

## How publishing works

See `.github/workflows/publish.yml`. It uses only bash and git. It copies `site/` to the `gh-pages` branch. GitHub Pages serves `gh-pages`. The CDN can cache pages for up to 10 minutes. If a preview looks old, reload the page or wait.
