/**
 * Genesis trait generation — port of 08-tech/scripts/generate.mjs.
 *
 * Traits are fixed at birth and committed to on-chain as TRAITS_ROOT, so this
 * must stay bit-identical to the generator. `test/parity.test.mjs` compares a
 * full 2,369-token run against the generator's own output.
 */
import { ALL_KEYS, SEED, TRAITS, layerByKey } from "./config.ts";
import { pick, pickIndex, rng, type Rand } from "./rng.ts";
import type { BandKey, Pingu, TraitSet } from "./types.ts";

type Selection = Record<string, string>;

/** Legal domain of every layer given the current selection. */
function domains(sel: Selection): Record<string, Set<string>> {
  const dom: Record<string, Set<string>> = {};
  for (const key of ALL_KEYS) {
    dom[key] = new Set(layerByKey(key).traits.map((t) => t.key));
  }

  for (const rule of TRAITS.exclusions) {
    const entry = Object.entries(rule.if)[0];
    if (!entry) continue;
    const [ifKey, ifVal] = entry;
    if (sel[ifKey] !== ifVal) continue;

    if (rule.force) {
      for (const [k, v] of Object.entries(rule.force)) {
        const d = dom[k];
        if (d) dom[k] = new Set([v].filter((x) => d.has(x)));
      }
    }
    if (rule.allow_only) {
      for (const [k, vals] of Object.entries(rule.allow_only)) {
        const d = dom[k];
        if (d) dom[k] = new Set([...d].filter((x) => vals.includes(x)));
      }
    }
    if (rule.deny) {
      for (const [k, vals] of Object.entries(rule.deny)) {
        if (k === ifKey) continue; // self-referential guard
        const d = dom[k];
        if (d) dom[k] = new Set([...d].filter((x) => !vals.includes(x)));
      }
    }
  }
  return dom;
}

/** Which already-selected trait is responsible for constraining `key`? */
function blamedFor(sel: Selection, key: string): string | null {
  for (const rule of TRAITS.exclusions) {
    const entry = Object.entries(rule.if)[0];
    if (!entry) continue;
    const [ifKey, ifVal] = entry;
    if (sel[ifKey] !== ifVal) continue;
    const touches =
      (rule.force && key in rule.force) ||
      (rule.allow_only && key in rule.allow_only) ||
      (rule.deny && key in rule.deny);
    if (touches) return ifKey;
  }
  return null;
}

/**
 * Iterate to a fixed point. Rules interact — FANTASMA forces FIT=NADA while
 * CAPUCHA requires a hooded FIT — so sequential application would leave
 * whichever ran last. On an empty domain the *constraining* trait is re-rolled
 * rather than emitting an illegal combination.
 */
function solve(rand: Rand, sel: Selection): Selection {
  for (let pass = 0; pass < 40; pass++) {
    const dom = domains(sel);
    let changed = false;

    for (const key of ALL_KEYS) {
      const d = dom[key];
      if (!d) continue;

      if (d.size === 0) {
        const blame = blamedFor(sel, key);
        if (blame) {
          const pool = layerByKey(blame).traits.filter((t) => t.key !== sel[blame]);
          if (pool.length) {
            sel[blame] = pick(rand, pool).key;
            changed = true;
            break;
          }
        }
        continue;
      }

      if (!d.has(sel[key] as string)) {
        const pool = layerByKey(key).traits.filter((t) => d.has(t.key));
        sel[key] = pick(rand, pool).key;
        changed = true;
      }
    }

    if (!changed) return sel; // all constraints satisfied
  }
  return sel;
}

export function bandFor(id: number) {
  const band = TRAITS.bands.find((b) => id >= b.ids[0] && id <= b.ids[1]);
  if (!band) throw new Error(`id ${id} is outside every band`);
  return band;
}

/**
 * Generate one pingu's fixed traits. Pure and deterministic in (seed, id) —
 * the whole collection is derivable in the browser, no data files needed.
 */
export function generatePingu(id: number, seed: string = SEED): Pingu {
  const rand = rng(`${seed}:${id}`);
  const sel: Selection = {};

  for (const layer of TRAITS.layers) sel[layer.key] = pick(rand, layer.traits).key;
  for (const pp of TRAITS.post_process) sel[pp.key] = pick(rand, pp.traits).key;

  solve(rand, sel);

  const band = bandFor(id);
  if (band.key === "ROMPEDORES") {
    sel.Ruptura = TRAITS.rupturas[pickIndex(rand, TRAITS.rupturas.length)] as string;
  }

  return { id, band: band.key as BandKey, traits: sel as TraitSet };
}

let _all: Pingu[] | null = null;

/** The full genesis roster, memoised. ~2,369 solver runs — a few ms. */
export function allPingus(seed: string = SEED): Pingu[] {
  if (seed === SEED && _all) return _all;
  const out: Pingu[] = [];
  for (let id = 1; id <= TRAITS.genesis_supply; id++) out.push(generatePingu(id, seed));
  if (seed === SEED) _all = out;
  return out;
}

export function isValidId(id: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= TRAITS.genesis_supply;
}
