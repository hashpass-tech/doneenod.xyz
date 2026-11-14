/**
 * Hand-drawn geometry primitives.
 *
 * The art direction forbids vector smoothness: "thick, confident, hand-pulled
 * marker line, variable weight, visible wobble, no uniform stroke width."
 * SVG has no variable-width stroke, so weight variation is faked by laying
 * two or three slightly displaced passes over the same path — which is also
 * how a real marker behaves when you go over a line twice.
 */
import type { Rand } from "@pingus/core";

export type P = readonly [number, number];

export const TAU = Math.PI * 2;

export function n(v: number): string {
  // Trim float noise — keeps emitted SVG small and diffable.
  return (Math.round(v * 100) / 100).toString();
}

/** Signed jitter in [-amt/2, amt/2]. */
export function jit(rand: Rand, amt: number): number {
  return (rand() - 0.5) * amt;
}

export function nudge(rand: Rand, p: P, amt: number): P {
  return [p[0] + jit(rand, amt), p[1] + jit(rand, amt)];
}

export function wobble(rand: Rand, pts: readonly P[], amt: number): P[] {
  return pts.map((p) => nudge(rand, p, amt));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpP(a: P, b: P, t: number): P {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

export function scalePts(pts: readonly P[], sx: number, sy: number, cx = 0, cy = 0): P[] {
  return pts.map(([x, y]) => [cx + (x - cx) * sx, cy + (y - cy) * sy] as P);
}

export function translatePts(pts: readonly P[], dx: number, dy: number): P[] {
  return pts.map(([x, y]) => [x + dx, y + dy] as P);
}

/**
 * Closed Catmull-Rom spline as cubic beziers. Gives organic curvature through
 * every anchor without the mechanical feel of a plain ellipse.
 */
export function closedSpline(pts: readonly P[], tension = 1): string {
  const len = pts.length;
  if (len < 3) return "";
  const at = (i: number): P => pts[((i % len) + len) % len] as P;
  const k = tension / 6;

  let d = `M${n(at(0)[0])},${n(at(0)[1])}`;
  for (let i = 0; i < len; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${n(c1[0])},${n(c1[1])} ${n(c2[0])},${n(c2[1])} ${n(p2[0])},${n(p2[1])}`;
  }
  return d + "Z";
}

/** Open Catmull-Rom spline — endpoints are duplicated so the curve reaches them. */
export function openSpline(pts: readonly P[], tension = 1): string {
  const len = pts.length;
  if (len < 2) return "";
  if (len === 2) return `M${n(pts[0]![0])},${n(pts[0]![1])}L${n(pts[1]![0])},${n(pts[1]![1])}`;
  const at = (i: number): P => pts[Math.max(0, Math.min(len - 1, i))] as P;
  const k = tension / 6;

  let d = `M${n(at(0)[0])},${n(at(0)[1])}`;
  for (let i = 0; i < len - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${n(c1[0])},${n(c1[1])} ${n(c2[0])},${n(c2[1])} ${n(p2[0])},${n(p2[1])}`;
  }
  return d;
}

export function polyline(pts: readonly P[], close = false): string {
  if (!pts.length) return "";
  let d = `M${n(pts[0]![0])},${n(pts[0]![1])}`;
  for (let i = 1; i < pts.length; i++) d += `L${n(pts[i]![0])},${n(pts[i]![1])}`;
  return close ? d + "Z" : d;
}

/**
 * A straight-ish line that bows slightly, the way a hand-pulled stroke does.
 * `bow` is perpendicular deflection at the midpoint.
 */
export function handLine(rand: Rand, a: P, b: P, bow = 0): string {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const k = bow + jit(rand, len * 0.045);
  return `M${n(a[0])},${n(a[1])}Q${n(mx + px * k)},${n(my + py * k)} ${n(b[0])},${n(b[1])}`;
}

/** Four-cornered shape that is never a perfect square. */
export function wobblyQuad(rand: Rand, corners: readonly [P, P, P, P], amt: number): string {
  const c = corners.map((p) => nudge(rand, p, amt)) as unknown as [P, P, P, P];
  let d = `M${n(c[0][0])},${n(c[0][1])}`;
  for (let i = 1; i < 4; i++) {
    const prev = c[i - 1] as P;
    const cur = c[i] as P;
    d += handLine(rand, prev, cur).replace(/^M[^Q]*/, "");
  }
  d += handLine(rand, c[3], c[0]).replace(/^M[^Q]*/, "");
  return d + "Z";
}

export interface StrokeOpts {
  color: string;
  width: number;
  opacity?: number;
  /** Number of overlapping passes — 2 reads as a confident marker line. */
  passes?: number;
  rand?: Rand;
  linecap?: "round" | "butt" | "square";
  fill?: string;
  /** Extra attributes, e.g. stroke-dasharray. */
  extra?: string;
}

/**
 * Emit one path as overlapping passes so the weight swells and thins.
 * This is the single most load-bearing function for the brand's line quality.
 */
export function stroke(d: string, o: StrokeOpts): string {
  if (!d) return "";
  const passes = o.passes ?? 2;
  const cap = o.linecap ?? "round";
  const op = o.opacity ?? 1;
  const fill = o.fill ?? "none";
  let out = "";

  for (let i = 0; i < passes; i++) {
    // First pass carries the fill and full weight; later passes thin out and
    // sit slightly off-register, which is what produces the wobble.
    const w = i === 0 ? o.width : o.width * (0.55 + (o.rand ? o.rand() * 0.3 : 0.2));
    const dx = i === 0 || !o.rand ? 0 : jit(o.rand, o.width * 0.5);
    const dy = i === 0 || !o.rand ? 0 : jit(o.rand, o.width * 0.5);
    const a = i === 0 ? op : op * 0.65;
    const t = dx || dy ? ` transform="translate(${n(dx)},${n(dy)})"` : "";
    out +=
      `<path d="${d}"${t} fill="${i === 0 ? fill : "none"}" stroke="${o.color}" ` +
      `stroke-width="${n(w)}" stroke-linecap="${cap}" stroke-linejoin="round" ` +
      `opacity="${n(a)}"${o.extra ? " " + o.extra : ""}/>`;
  }
  return out;
}

/** Filled shape with no stroke — the tux, the ground patch. */
export function fill(d: string, color: string, opacity = 1): string {
  if (!d) return "";
  return `<path d="${d}" fill="${color}" opacity="${n(opacity)}"/>`;
}

export function circle(c: P, r: number, color: string, opacity = 1): string {
  return `<circle cx="${n(c[0])}" cy="${n(c[1])}" r="${n(r)}" fill="${color}" opacity="${n(opacity)}"/>`;
}

/** Scatter n points inside a box — dust, bubbles, overspray, condensation. */
export function scatter(
  rand: Rand,
  count: number,
  box: readonly [number, number, number, number]
): P[] {
  const [x, y, w, h] = box;
  const out: P[] = [];
  for (let i = 0; i < count; i++) out.push([x + rand() * w, y + rand() * h]);
  return out;
}
