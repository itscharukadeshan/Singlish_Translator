# Free hosting — Cloudflare Pages (recommended) or GitHub Pages

This app is a **static Vite build**. `npm run build` outputs `dist/` — host it anywhere.

## Option A — Cloudflare Pages (free, recommended)

1. Push this repo to GitHub.
2. Cloudflare Dashboard → **Workers & Pages → Create application → select
   the Pages tab** (the screen defaults to the Worker tab — that path runs
   `wrangler deploy`, which fails on this repo).
3. Pick **Import an existing Git repository** → select `Singlish_Translator`.
4. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (leave default)
   - Environment variables: `NODE_VERSION = 20`
     (`package.json` also pins `engines.node >= 20.19`, which Vite 7 needs)
   - **Deploy command: leave EMPTY.** Pages uploads `dist/` itself.
     Anything in this field makes Pages shell out to wrangler.
5. Deploy. You get `https://<project>.pages.dev`. Add a custom domain free under
   **Custom domains**.

> If you used the **Worker** tab you get
> `✘ [ERROR] Error parsing file: .../vite.config.js` +
> `Failed: error occurred while running deploy command`.
> This repo is static-only on purpose (no `wrangler.toml`, no Workers
> bindings) so it stays free — wrangler must never run here. Delete that
> project and redo the steps above on the **Pages** tab.

No-dashboard alternative (same free result, skips the UI entirely):

```bash
npm run build
npx wrangler pages deploy dist --project-name singlish-translator
```

This uploads the already-built folder as a Pages deployment — still no
Worker, still free.

## Troubleshooting

| Symptom | Cause → Fix |
|---|---|
| `Error parsing file: .../vite.config.js`, then `Failed: ... running deploy command` | Used the **Worker** tab or set a **Deploy command** → redo on the **Pages** tab (steps above) with Deploy command empty, or use `npx wrangler pages deploy dist` locally |
| `vite build` fails with syntax/`??`/ESM errors | Build host on old Node → set env `NODE_VERSION = 20` |
| Deployed site shows 404 on assets / blank page | Absolute `/assets/...` paths → our `vite.config.js` uses portable `base: "./"`; `npm run check-deploy` verifies this |
| `npm ci` fails: lock file out of sync | Run `npm install` locally, commit the updated `package-lock.json` |

CLI path (also the no-dashboard fallback):

```bash
npm run build
npx wrangler pages deploy dist --project-name singlish-translator
```

Notes:
- No `_redirects` needed (single page, no router).
- `public/_headers` sets long cache for `/assets/*`.
- HTTPS + preview deployments are free.

## Option B — GitHub Pages (already wired)

`.github/workflows/deploy.yml` builds on push to `main` and publishes `dist/`
via `peaceiris/actions-gh-pages@v4` to the `gh-pages` branch.

Because `vite.config.js` uses `base: "./"`, the same build works at
`https://<user>.github.io/Singlish_Translator/` **and** on Cloudflare Pages
without rebuilds.

If you prefer an absolute project path, build with:

```bash
BASE_PATH=/Singlish_Translator/ npm run build
```

## Will I be charged? (No — if you check these)

**Cloudflare Pages is free for this project:** unlimited bandwidth and
requests on the free plan, ~500 builds/month. A charge can only appear if
*you* attach something billable (Workers Paid, R2, D1, Images, etc.).
This repo attaches none of that — it is a static `dist/` folder.

Pre-publish checks (also enforced automatically — see below):

```bash
npm run lint          # no broken code
npm run build         # produces dist/
npm run check-deploy  # size/path/secret/billable-binding gate
```

`npm run check-deploy` fails the deploy if: `dist/` is missing or over
the free limits (~1 MiB total vs 25 MiB/file allowed), asset URLs are
absolute (would 404), secret-looking strings got bundled, or a wrangler
config binds a billable service. `npm run deploy` runs
lint → build → check automatically via the `predeploy` hook, and CI runs
the same steps before publishing to GitHub Pages.

Billing safeguards:

1. **Cloudflare: no card needed.** The free plan requires no payment
   method. If the dashboard ever asks for one for Pages alone, stop and
   re-check what you clicked.
2. **Deploy the static way only:** dashboard Git integration, or
   `wrangler pages deploy dist`. Never `wrangler deploy` — that targets
   Workers, which has paid usage dimensions.
3. **After first deploy, verify:** Workers & Pages → your project shows
   deploys succeeding; Manage account → Billing shows the Free plan with
   no usage-based items. That is your $0 proof.
4. **GitHub Pages:** free for **public** repos (this deploys with the
   built-in `GITHUB_TOKEN`, nothing to pay). Private repos need a paid
   GitHub plan for Pages — keep the repo public or skip this option.

## Local check

```bash
npm ci
npm run build
npx vite preview --port 4173
```
