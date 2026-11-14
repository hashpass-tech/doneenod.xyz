#!/usr/bin/env node
/**
 * Mirrors 08-tech/config/*.json into packages/core/src/config/*.ts.
 *
 * Emitted as TypeScript rather than copied JSON so the package resolves
 * identically under Node ESM, Vite and tsc without import attributes, and so
 * the config is typed at the point of use.
 *
 * 08-tech/config remains the single source of truth. Run with --check in CI to
 * fail the build when the mirror has drifted.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "../../../08-tech/config");
const DEST = resolve(here, "../src/config");
const FILES = ["traits.json", "palette.json", "generations.json"];

const check = process.argv.includes("--check");
let drifted = 0;

function render(name, json) {
  return (
    `// GENERATED — do not edit.\n` +
    `// Source: 08-tech/config/${name}\n` +
    `// Regenerate: pnpm --filter @pingus/core sync:config\n\n` +
    `export default ${JSON.stringify(json, null, 2)} as const;\n`
  );
}

for (const f of FILES) {
  const json = JSON.parse(readFileSync(`${SRC}/${f}`, "utf8"));
  const out = render(f, json);
  const target = `${DEST}/${f.replace(/\.json$/, ".ts")}`;

  let existing = null;
  try {
    existing = readFileSync(target, "utf8");
  } catch {
    /* missing counts as drift */
  }

  if (existing === out) continue;

  drifted++;
  if (check) {
    console.error(`  drift: ${target.replace(/.*\/src\//, "src/")} is stale`);
  } else {
    writeFileSync(target, out);
    console.log(`  synced: ${f} -> ${f.replace(/\.json$/, ".ts")}`);
  }
}

if (check && drifted) {
  console.error(
    `\n${drifted} config file(s) out of sync with 08-tech/config.\n` +
      `Run: pnpm --filter @pingus/core sync:config\n`
  );
  process.exit(1);
}

console.log(check ? "config mirror in sync" : `done — ${drifted} file(s) updated`);
