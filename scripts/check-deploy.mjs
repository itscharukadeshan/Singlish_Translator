#!/usr/bin/env node
/** @format */
// Predeploy gate: fails the deploy if anything looks off or billable.
// Run: npm run check-deploy   (runs automatically before `npm run deploy`
// via the `predeploy` hook, and in CI before publishing).
//
// Checks:
//  1. dist/ exists with index.html (built output present)
//  2. dist size / file count well under Cloudflare Pages free limits
//     (25 MiB per file, 20k files; this app is < 2 MiB total)
//  3. Asset URLs are relative (./) so the same build works on Pages and
//     GitHub Pages project paths — absolute /assets/... would 404
//  4. No secret-looking strings bundled into dist/
//  5. No paid Cloudflare bindings (Workers/R2/D1/KV/etc.) — this project
//     must stay a static-only Pages site, which is free

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
let failures = 0;

function fail(msg) {
  failures += 1;
  console.error(`FAIL: ${msg}`);
}
function ok(msg) {
  console.log(`ok: ${msg}`);
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// 1. dist present
if (!existsSync(join(DIST, "index.html"))) {
  fail("dist/index.html missing — run `npm run build` first");
  process.exit(1);
}
ok("dist/index.html present");

// 2. size / file limits
const files = walk(DIST);
const sizes = files.map((f) => ({ f: relative(ROOT, f), b: statSync(f).size }));
const total = sizes.reduce((a, s) => a + s.b, 0);
const biggest = sizes.reduce((a, s) => (s.b > a.b ? s : a), sizes[0]);
console.log(
  `info: dist = ${files.length} files, ${(total / 1024).toFixed(0)} KiB total, ` +
    `biggest ${biggest.f} (${(biggest.b / 1024).toFixed(0)} KiB)`,
);
if (files.length > 20000) fail(`too many files (${files.length} > 20000)`);
else ok("file count under Pages limit");
if (biggest.b > 25 * 1024 * 1024)
  fail(`${biggest.f} exceeds 25 MiB per-file limit`);
else ok("all files under 25 MiB per-file limit");

// 3. relative asset URLs in index.html
const html = readFileSync(join(DIST, "index.html"), "utf8");
const absolute = [...html.matchAll(/(?:src|href)="(\/(?!\/)[^"]*)"/g)].map(
  (m) => m[1],
);
if (absolute.length > 0)
  fail(`absolute asset paths in index.html: ${absolute.join(", ")}`);
else ok("asset URLs are relative (portable build)");

// 4. secret scan (lightweight — bundled app code should contain none)
const SECRET_RES = [
  /sk-[A-Za-z0-9]{8,}/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9]{8,}/,
  /xox[bpas]-[A-Za-z0-9-]{8,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];
const textFiles = files.filter((f) => /\.(js|html|css|json|txt)$/.test(f));
let secretHits = 0;
for (const f of textFiles) {
  const content = readFileSync(f, "utf8");
  for (const re of SECRET_RES) {
    if (re.test(content)) {
      fail(`possible secret (${re}) in ${relative(ROOT, f)}`);
      secretHits += 1;
    }
  }
}
if (secretHits === 0) ok("no secret-looking strings in dist/");

// 5. no paid bindings — static-only Pages site
for (const name of ["wrangler.toml", "wrangler.json", "wrangler.jsonc"]) {
  const p = join(ROOT, name);
  if (!existsSync(p)) continue;
  const content = readFileSync(p, "utf8");
  const paid = [
    "r2_buckets",
    "d1_databases",
    "kv_namespaces",
    "hyperdrive",
    "queues",
    "durable_objects",
    "vectorize",
    "workers_dev",
    "main =",
  ];
  const hits = paid.filter((k) => content.includes(k));
  if (hits.length > 0)
    fail(`${name} binds billable services (${hits.join(", ")}) — remove for a free static site`);
  else ok(`${name} has no billable bindings`);
}
if (
  !["wrangler.toml", "wrangler.json", "wrangler.jsonc"].some((n) =>
    existsSync(join(ROOT, n)),
  )
)
  ok("no wrangler config — nothing billable to bind");

if (failures > 0) {
  console.error(`\ncheck-deploy: ${failures} failure(s) — deploy blocked`);
  process.exit(1);
}
console.log("\ncheck-deploy: all checks passed");
