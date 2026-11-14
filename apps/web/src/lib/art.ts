/**
 * Art access layer.
 *
 * There are no image assets in this project. Every pingu is drawn from its
 * traits at request time by @pingus/pingu-render, which means the browser can
 * show any of the 2,369 tokens at any of its four generations with nothing but
 * the token id. The cost of that is CPU, so everything here exists to avoid
 * drawing the same thing twice.
 */
import { type Pingu, generatePingu } from "@pingus/core";
import { renderPingu } from "@pingus/pingu-render";

/** Calor values that sit squarely inside each generation. */
export const GEN_CALOR = [0, 3, 8, 15] as const;

const pinguCache = new Map<number, Pingu>();

export function pingu(id: number): Pingu {
  let p = pinguCache.get(id);
  if (!p) {
    p = generatePingu(id);
    pinguCache.set(id, p);
  }
  return p;
}

const svgCache = new Map<string, string>();

export interface ArtOptions {
  calor?: number;
  size?: number;
  /** Skip grain and dust. Much cheaper — use for anything in a grid. */
  plain?: boolean;
}

/**
 * Rendered SVG markup for one token. Memoised on every input that changes the
 * output, so a mosaic that scrolls back into view costs nothing the second
 * time.
 */
export function art(id: number, options: ArtOptions = {}): string {
  const calor = options.calor ?? 0;
  const size = options.size ?? 1000;
  const plain = options.plain ?? false;
  const key = `${id}:${calor}:${size}:${plain ? 1 : 0}`;

  let svg = svgCache.get(key);
  if (svg === undefined) {
    svg = renderPingu(pingu(id), {
      calor,
      size,
      plain,
      // Filter and mask ids must be unique across the whole document or the
      // first token on the page wins and every later one inherits its grain.
      uid: `w${id}c${calor}${plain ? "p" : ""}`,
      attrs: 'preserveAspectRatio="xMidYMid meet"',
    });
    // A full mosaic of 2,369 plain tiles is a few MB of strings; cap it so a
    // long browse session cannot grow without bound.
    if (svgCache.size > 900) svgCache.clear();
    svgCache.set(key, svg);
  }
  return svg;
}

/**
 * The entry calor of each of the twelve estados, in order.
 *
 * These are the exact lower bounds from 08-tech/config/generations.json, so
 * stepping through this array walks every distinct artwork a token can have
 * with no repeats and nothing skipped.
 */
export const THAW_CALOR = [0, 1, 2, 3, 4, 6, 8, 10, 13, 15, 18, 21] as const;

/** A stable, well-spread sample of ids — used for every decorative grid. */
export function sampleIds(count: number, offset = 0): number[] {
  const total = 2369;
  // A stride coprime with the supply walks the whole collection without
  // repeating, so the sample never clusters in one trait neighbourhood.
  const stride = 331;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push(((offset + i * stride) % total) + 1);
  }
  return out;
}
