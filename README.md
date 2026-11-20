# alex-park-fun

A static website. Plain HTML, CSS, and JavaScript. There are no dependencies and no build step.

- Live site: https://alexspark.github.io/alex-park-fun/
- Branch previews: https://alexspark.github.io/alex-park-fun/preview/

## Folders

| Path | Contents |
|---|---|
| `site/` | The website. Only this folder is published. |
| `docs/status.md` | Current status, next steps, and decisions. Read this first. |
| `CLAUDE.md` | Rules for Claude sessions. |
| `.github/workflows/publish.yml` | Copies `site/` to the `gh-pages` branch. |

## Publish

- Push to `main` to update the live site.
- Push a different branch to make a preview at `/preview/<branch>/`.
- Delete a branch to remove its preview.

## Test locally

```sh
python3 -m http.server -d site 8000
```
