#!/usr/bin/env node
/**
 * PINGUS² — genesis trait generator
 *
 * Generates deterministic genesis traits + metadata for all four generations.
 *
 *   node generate.mjs --seed pingus2 --supply 2369 --out ../output
 *
 * Key invariant: traits are fixed at birth, generation is earned.
 * This script emits every generation's metadata at once — that is what makes
 * the mechanic a product rather than a promise.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG = resolve(__dirname, "../config");

// ---------- args ----------
const args = process.argv.slice(2);
const arg = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : d;
};

const SEED = arg("seed", "pingus2");
const OUT = resolve(__dirname, arg("out", "../output"));

const traits = JSON.parse(readFileSync(`${CONFIG}/traits.json`, "utf8"));
const gens = JSON.parse(readFileSync(`${CONFIG}/generations.json`, "utf8"));

const SUPPLY = parseInt(arg("supply", traits.genesis_supply), 10);

// ---------- deterministic PRNG (mulberry32 + string hash) ----------
function hash(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- weighted pick ----------
function pick(rand, list) {
  const total = list.reduce((s, t) => s + t.weight, 0);
  let r = rand() * total;
  for (const t of list) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return list[list.length - 1];
}

function layerByKey(key) {
  return (
    traits.layers.find((l) => l.key === key) ||
    traits.post_process.find((p) => p.key === key)
  );
}

const ALL_KEYS = [
  ...traits.layers.map((l) => l.key),
  ...traits.post_process.map((p) => p.key),
];

/**
 * Constraint solver.
 *
 * The naive "apply rules in order" approach fails on rule interaction — e.g.
 * CUERPO=FANTASMA forces FIT=NADA, while MARCA=CAPUCHA requires FIT to be a
 * hooded garment. Applying them sequentially leaves whichever ran last.
 *
 * Instead: compute the legal domain of every layer given the current
 * selection, re-pick anything outside its domain, and iterate to a fixed
 * point. If a domain goes empty, the *constraining* trait is relaxed rather
 * than silently emitting an illegal combination.
 */
function domains(sel) {
  const dom = {};
  for (const key of ALL_KEYS) {
    dom[key] = new Set(layerByKey(key).traits.map((t) => t.key));
  }

  for (const rule of traits.exclusions) {
    const [ifKey, ifVal] = Object.entries(rule.if)[0];
    if (sel[ifKey] !== ifVal) continue;

    if (rule.force) {
      for (const [k, v] of Object.entries(rule.force)) {
        dom[k] = new Set([v].filter((x) => dom[k].has(x)));
      }
    }
    if (rule.allow_only) {
      for (const [k, vals] of Object.entries(rule.allow_only)) {
        dom[k] = new Set([...dom[k]].filter((x) => vals.includes(x)));
      }
    }
    if (rule.deny) {
      for (const [k, vals] of Object.entries(rule.deny)) {
        if (k === ifKey) continue; // self-referential guard
        dom[k] = new Set([...dom[k]].filter((x) => !vals.includes(x)));
      }
    }
  }
  return dom;
}

/** Which already-selected trait is responsible for constraining `key`? */
function blamedFor(sel, key) {
  for (const rule of traits.exclusions) {
    const [ifKey, ifVal] = Object.entries(rule.if)[0];
    if (sel[ifKey] !== ifVal) continue;
    const touches =
      (rule.force && key in rule.force) ||
      (rule.allow_only && key in rule.allow_only) ||
      (rule.deny && key in rule.deny);
    if (touches) return ifKey;
  }
  return null;
}

function solve(rand, sel) {
  for (let pass = 0; pass < 40; pass++) {
    const dom = domains(sel);
    let changed = false;

    for (const key of ALL_KEYS) {
      const d = dom[key];

      // Empty domain: rules are mutually unsatisfiable given this selection.
      // Relax the constraining trait by re-rolling it, rather than emitting
      // an illegal combination.
      if (d.size === 0) {
        const blame = blamedFor(sel, key);
        if (blame) {
          const pool = layerByKey(blame).traits.filter(
            (t) => t.key !== sel[blame]
          );
          if (pool.length) {
            sel[blame] = pick(rand, pool).key;
            changed = true;
            break;
          }
        }
        continue;
      }

      if (!d.has(sel[key])) {
        const pool = layerByKey(key).traits.filter((t) => d.has(t.key));
        sel[key] = pick(rand, pool).key;
        changed = true;
      }
    }

    if (!changed) return sel; // fixed point: all constraints satisfied
  }
  return sel;
}

// ---------- band resolution ----------
function bandFor(id) {
  return traits.bands.find((b) => id >= b.ids[0] && id <= b.ids[1]);
}

// ---------- generate one pingu's fixed traits ----------
function generate(id) {
  const rand = rng(`${SEED}:${id}`);
  const sel = {};

  for (const layer of traits.layers) {
    sel[layer.key] = pick(rand, layer.traits).key;
  }
  for (const pp of traits.post_process) {
    sel[pp.key] = pick(rand, pp.traits).key;
  }

  solve(rand, sel);

  const band = bandFor(id);

  if (band.key === "ROMPEDORES") {
    sel.Ruptura = traits.rupturas[Math.floor(rand() * traits.rupturas.length)];
  }

  return { id, band: band.key, traits: sel };
}

// ---------- metadata for a given generation ----------
function metadataFor(pingu, genDef) {
  const g = genDef.gen;
  const t = pingu.traits;
  const fitLayer = layerByKey("FIT");
  const fitTrait = fitLayer.traits.find((x) => x.key === t.FIT);
  const band = traits.bands.find((b) => b.key === pingu.band);

  const attrs = [
    { trait_type: "Generacion", value: genDef.label },
    { trait_type: "Estado", value: genDef.estados[0].key },
    { trait_type: "Calor", value: genDef.calor_min, display_type: "number" },
    { trait_type: "Hechos", value: 0, display_type: "number" },
    { trait_type: "Banda", value: pingu.band },
    { trait_type: "Cubo", value: t.CUBO },
    { trait_type: "Cuerpo", value: t.CUERPO },
    { trait_type: "Fit", value: t.FIT },
    { trait_type: "Marca", value: t.MARCA },
    { trait_type: "Fondo", value: t.FONDO },
    { trait_type: "Sena", value: t.SENA },
    { trait_type: "Tratamiento", value: t.TRATAMIENTO },
    { trait_type: "Paleta", value: t.PALETA },
  ];

  // CARGA is GEN 2 only
  if (g === 2) attrs.push({ trait_type: "Carga", value: t.CARGA });

  if (t.Ruptura) attrs.push({ trait_type: "Ruptura", value: t.Ruptura });

  return {
    name: `Pingu #${String(pingu.id).padStart(4, "0")}`,
    description: `${genDef.word} — ${genDef.key}. PINGUS² — @plagainnvade x donedone.io`,
    image: `ipfs://PLACEHOLDER/gen${g}/${pingu.id}.png`,
    external_url: `https://donedone.io/pingu/${pingu.id}`,
    attributes: attrs,
    pingus2: {
      generacion: g,
      estado: genDef.estados[0].key,
      calor: genDef.calor_min,
      can_breed: genDef.can_breed,
      can_claim: genDef.can_claim && !!fitTrait.claimable && fitTrait.claimable !== "TBD",
      garment: fitTrait.garment,
      linaje: null,
      hechos: [],
      locked_gen: band.locked_gen ?? null,
    },
  };
}

// ---------- run ----------
console.log(`PINGUS² generator — seed "${SEED}", supply ${SUPPLY}`);

const all = [];
for (let id = 1; id <= SUPPLY; id++) all.push(generate(id));

// rarity tally
const tally = {};
for (const p of all) {
  for (const [k, v] of Object.entries(p.traits)) {
    tally[k] ??= {};
    tally[k][v] = (tally[k][v] || 0) + 1;
  }
}

// production run sizes (the donedone.io number)
const runs = {};
for (const p of all) {
  const fit = layerByKey("FIT").traits.find((x) => x.key === p.traits.FIT);
  if (fit.claimable) runs[p.traits.FIT] = (runs[p.traits.FIT] || 0) + 1;
}

mkdirSync(OUT, { recursive: true });
mkdirSync(`${OUT}/metadata`, { recursive: true });

writeFileSync(`${OUT}/traits.json`, JSON.stringify(all, null, 2));
writeFileSync(
  `${OUT}/rarity.json`,
  JSON.stringify({ supply: SUPPLY, seed: SEED, tally, production_runs: runs }, null, 2)
);

for (const genDef of gens.generations) {
  mkdirSync(`${OUT}/metadata/gen${genDef.gen}`, { recursive: true });
  for (const p of all) {
    writeFileSync(
      `${OUT}/metadata/gen${genDef.gen}/${p.id}.json`,
      JSON.stringify(metadataFor(p, genDef), null, 2)
    );
  }
}

// ---------- report ----------
console.log(`\n  wrote ${all.length} pingus x ${gens.generations.length} generations`);
console.log(`  -> ${OUT}\n`);

console.log("  PRODUCTION RUNS (donedone.io — units ever made):");
const sorted = Object.entries(runs).sort((a, b) => b[1] - a[1]);
for (const [fit, n] of sorted) {
  const g = layerByKey("FIT").traits.find((x) => x.key === fit);
  console.log(`    ${fit.padEnd(14)} ${String(n).padStart(4)}  ${g.garment ?? ""}`);
}
const claimable = sorted.reduce((s, [, n]) => s + n, 0);
console.log(`    ${"—".repeat(14)} ${String(claimable).padStart(4)}  claimable total`);
console.log(`    ${"NADA".padEnd(14)} ${String(SUPPLY - claimable).padStart(4)}  no claim\n`);

console.log("  SUPPLY CURVE:");
console.log(`    GEN 0  HIELO       ${String(SUPPLY).padStart(5)}  minted`);
console.log(`    GEN 1  DESHIELO   +${String(SUPPLY).padStart(5)}  1 child per genesis`);
console.log(`    GEN 2  CORRIENTE  +${String(Math.floor(SUPPLY / 2)).padStart(5)}  2 parents -> 1 child`);
console.log(`    GEN 3  VAPOR      +${String(0).padStart(5)}  nothing is born here`);
console.log(`    ${"".padEnd(23)}${"-".repeat(6)}`);
console.log(`    HARD CAP           ${String(SUPPLY * 2 + Math.floor(SUPPLY / 2)).padStart(5)}\n`);
