#!/usr/bin/env node
/**
 * Contact sheet for eyeballing the renderer.
 *
 *   node scripts/preview.mjs            # thaw strips for a sample of tokens
 *   node scripts/preview.mjs --ids 1,42 # specific tokens
 *   node scripts/preview.mjs --trait CUBO   # one of every value of a layer
 *   node scripts/preview.mjs --thumb    # the 48px legibility test
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { allPingus, generatePingu, layerByKey, stateFor } from "@pingus/core";
import { renderPingu } from "../src/render.ts";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../preview");
mkdirSync(OUT, { recursive: true });

const argv = process.argv.slice(2);
const flag = (k) => {
  const i = argv.indexOf(`--${k}`);
  if (i === -1) return null;
  const next = argv[i + 1];
  // A flag with no value (or followed by another flag) is a boolean.
  return next === undefined || next.startsWith("--") ? true : next;
};

const CALORS = [0, 1, 2, 3, 4, 6, 8, 10, 13, 15, 18, 21];

function cell(p, calor, size, label) {
  const svg = renderPingu(p, { calor, size, uid: `u${p.id}-${calor}` });
  const st = stateFor(p, calor);
  return `<figure><div class="art">${svg}</div><figcaption>${
    label ?? `#${p.id} · GEN ${st.generacion} ${st.gen.key}<br><span>${st.estado.key} · calor ${calor}</span>`
  }</figcaption></figure>`;
}

let sections = "";

if (flag("thumb")) {
  // The 48px test: if you cannot tell it is a penguin, in a cube, and
  // unimpressed — the line failed.
  const ids = [1, 7, 42, 113, 500, 777, 1000, 1337, 1500, 2000, 2251, 2369];
  for (const size of [48, 96, 220]) {
    sections += `<h2>${size}px</h2><div class="grid tight">`;
    for (const id of ids) {
      const p = generatePingu(id);
      for (const calor of [0, 10]) sections += cell(p, calor, size, `#${id}`);
    }
    sections += `</div>`;
  }
} else if (flag("trait")) {
  // One representative token for every value of a layer.
  const layer = String(flag("trait")).toUpperCase();
  const values = layerByKey(layer).traits.map((t) => t.key);
  const roster = allPingus();
  sections += `<h2>${layer}</h2><div class="grid">`;
  for (const v of values) {
    const p = roster.find((x) => x.traits[layer] === v);
    if (!p) {
      sections += `<figure><div class="art missing">none</div><figcaption>${v}<br><span>no token</span></figcaption></figure>`;
      continue;
    }
    // Show each trait at the generation where it is actually visible.
    const calor = layer === "CARGA" ? 10 : layer === "CUBO" ? 0 : layer === "FIT" ? 10 : 10;
    sections += cell(p, calor, 300, `${v}<br><span>#${p.id}</span>`);
  }
  sections += `</div>`;
} else {
  const ids = flag("ids")
    ? String(flag("ids")).split(",").map(Number)
    : [1, 42, 500, 1337, 2251, 2369];
  for (const id of ids) {
    const p = generatePingu(id);
    const tr = Object.entries(p.traits)
      .map(([k, v]) => `${k}:${v}`)
      .join(" · ");
    sections += `<h2>#${id} <small>${p.band} — ${tr}</small></h2><div class="grid">`;
    for (const calor of CALORS) sections += cell(p, calor, 260);
    sections += `</div>`;
  }
}

const html = `<!doctype html><meta charset="utf-8"><title>pingus² preview</title>
<style>
  body{background:#2a2a28;color:#EDE6D6;font:13px/1.4 ui-monospace,monospace;margin:0;padding:28px}
  h2{font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;margin:34px 0 14px;border-bottom:1px solid #4a4a46;padding-bottom:8px}
  h2 small{display:block;font-weight:400;opacity:.5;letter-spacing:.04em;text-transform:none;margin-top:6px;font-size:11px}
  .grid{display:flex;flex-wrap:wrap;gap:14px}
  .grid.tight{gap:8px;align-items:flex-end}
  figure{margin:0}
  .art{line-height:0;box-shadow:0 2px 14px rgba(0,0,0,.45)}
  .missing{display:grid;place-items:center;width:300px;height:300px;background:#1c1c1a;color:#8a8a84;line-height:1}
  figcaption{margin-top:6px;font-size:10px;letter-spacing:.08em;opacity:.8}
  figcaption span{opacity:.55}
  svg{display:block}
</style>
${sections}`;

const name = flag("thumb") ? "thumb" : flag("trait") ? `trait-${flag("trait")}` : "strip";
const file = `${OUT}/${name}.html`;
writeFileSync(file, html);
console.log(file);
