/**
 * Rarity is computed from the actual roster, not from the configured weights —
 * the constraint solver shifts real distributions away from nominal weights.
 */
import { GENESIS_SUPPLY, layerByKey, traitDef } from "./config.ts";
import { allPingus } from "./traits.ts";
import type { LayerKey, Pingu } from "./types.ts";

export type Tally = Record<string, Record<string, number>>;

let _tally: Tally | null = null;

export function tally(): Tally {
  if (_tally) return _tally;
  const t: Tally = {};
  for (const p of allPingus()) {
    for (const [k, v] of Object.entries(p.traits)) {
      t[k] ??= {};
      const bucket = t[k] as Record<string, number>;
      bucket[v] = (bucket[v] ?? 0) + 1;
    }
  }
  _tally = t;
  return t;
}

/** How many tokens share this exact trait value. */
export function countOf(layer: string, value: string): number {
  return tally()[layer]?.[value] ?? 0;
}

export function shareOf(layer: string, value: string): number {
  return countOf(layer, value) / GENESIS_SUPPLY;
}

/**
 * Classic trait-rarity score: sum of 1/frequency across layers.
 * Higher = rarer. Deliberately excludes TRATAMIENTO and PALETA weighting
 * beyond their own frequency — there is no gold tier here.
 */
export function rarityScore(p: Pingu): number {
  let score = 0;
  for (const [layer, value] of Object.entries(p.traits)) {
    const share = shareOf(layer, value);
    if (share > 0) score += 1 / share;
  }
  return score;
}

let _ranks: Map<number, number> | null = null;

/** 1 = rarest. Computed once over the whole roster. */
export function rarityRank(id: number): number {
  if (!_ranks) {
    const scored = allPingus()
      .map((p) => ({ id: p.id, score: rarityScore(p) }))
      .sort((a, b) => b.score - a.score);
    _ranks = new Map(scored.map((s, i) => [s.id, i + 1]));
  }
  return _ranks.get(id) ?? 0;
}

/**
 * Production runs — trait count IS the manufacturing order.
 * This is the donedone.io number: units ever made.
 */
export function productionRuns(): { fit: string; garment: string; units: number }[] {
  const t = tally()["FIT"] ?? {};
  return Object.entries(t)
    .map(([fit, units]) => {
      const def = traitDef("FIT", fit);
      return { fit, garment: def?.garment ?? "", units };
    })
    .filter((r) => {
      const def = traitDef("FIT", r.fit);
      return def?.claimable === true || def?.claimable === "TBD";
    })
    .sort((a, b) => b.units - a.units);
}

export function layerLabel(key: LayerKey): string {
  return layerByKey(key).label;
}

/** Ordered rarity breakdown for one layer, rarest last. */
export function layerDistribution(
  key: string
): { value: string; count: number; share: number; desc?: string }[] {
  const t = tally()[key] ?? {};
  return Object.entries(t)
    .map(([value, count]) => ({
      value,
      count,
      share: count / GENESIS_SUPPLY,
      desc: traitDef(key, value)?.desc,
    }))
    .sort((a, b) => b.count - a.count);
}
