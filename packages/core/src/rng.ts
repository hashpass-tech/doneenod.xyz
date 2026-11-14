/**
 * Deterministic PRNG — byte-for-byte port of 08-tech/scripts/generate.mjs.
 *
 * Any divergence here changes every pingu in the collection, so this file is
 * covered by a test that compares against the generator's own output.
 */

export function hash(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export type Rand = () => number;

export function rng(seed: string): Rand {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Weighted pick. Port of `pick()` in generate.mjs — same traversal order. */
export function pick<T extends { weight?: number }>(rand: Rand, list: readonly T[]): T {
  const total = list.reduce((s, t) => s + (t.weight ?? 0), 0);
  let r = rand() * total;
  for (const t of list) {
    r -= t.weight ?? 0;
    if (r <= 0) return t;
  }
  return list[list.length - 1] as T;
}

/** Uniform integer in [0, n). */
export function pickIndex(rand: Rand, n: number): number {
  return Math.floor(rand() * n);
}
