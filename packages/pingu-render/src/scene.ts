/**
 * Everything that is not the pingu: the cube, the ground, the water, the
 * vapour and the signature layer.
 *
 * The cube is drawn in line only — never fill, never gradient — and is never a
 * perfect square (except CUBO: PERFECTO, which is unnatural on purpose).
 */
import type { Rand } from "@pingus/core";
import {
  type P,
  circle,
  handLine,
  jit,
  n,
  openSpline,
  polyline,
  scatter,
  stroke,
  wobble,
  wobblyQuad,
} from "./geom.ts";
import type { Ink } from "./pingu.ts";

export interface CubeResult {
  /** Painted behind the pingu. */
  back: string;
  /** Painted in front of the pingu — the near faces of the ice. */
  front: string;
  /** Rotation applied to the whole cube+pingu group. */
  rotate: number;
}

/** CUBO geometry. The cube occupies ~70% of frame height at GEN 0–1. */
export function cubo(
  key: string,
  gen: number,
  estadoIndex: number,
  ink: Ink,
  rand: Rand
): CubeResult {
  if (gen >= 2) return { back: "", front: "", rotate: 0 };

  const cold = ink.cold ?? ink.accent ?? ink.ink;
  const line = ink.accent ?? cold;
  const w = ink.w;

  // Base box, then per-trait deformation.
  let x0 = 140;
  let y0 = 150;
  let x1 = 860;
  let y1 = 862;
  let amt = 10; // corner wobble — "never a perfect square"
  let rotate = 0;

  switch (key) {
    case "GRUESO": // oversized cube, pingu small inside
      x0 = 100; y0 = 110; x1 = 900; y1 = 900; amt = 12;
      break;
    case "JUSTO": // cube barely contains the pingu
      x0 = 212; y0 = 206; x1 = 788; y1 = 884; amt = 8;
      break;
    case "TORCIDO": // visibly off-axis
      rotate = -6.5;
      amt = 14;
      break;
    case "PERFECTO": // a true square. unnatural. rarest.
      x0 = 160; y0 = 160; x1 = 840; y1 = 840; amt = 0;
      break;
    case "ASTILLADO":
      amt = 15;
      break;
  }

  const corners: [P, P, P, P] = [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];

  let back = "";
  let front = "";

  const S = (d: string, color = line, width = w, opacity = ink.lineOpacity) =>
    stroke(d, { color, width, opacity, passes: 2, rand });

  // GEN 1 MEDIO_LIBRE (estado 5): the upper body is out — only the lower
  // portion of the cube survives.
  const medioLibre = estadoIndex === 5;
  const esquinaIda = estadoIndex === 4;

  const box =
    amt === 0
      ? polyline([corners[0], corners[1], corners[2], corners[3]], true)
      : wobblyQuad(rand, corners, amt);

  // Depth edges — a cube, not a frame. Drawn lighter than the front face so
  // the silhouette still reads as a single hard-edged block at 48px.
  const dep = key === "GRUESO" ? 56 : 44;
  const depthOp = ink.lineOpacity * 0.6;

  if (!medioLibre) {
    front += S(
      polyline(wobble(rand, [[x0, y0], [x0 + dep, y0 - dep], [x1 + dep, y0 - dep], [x1, y0]], amt * 0.5)),
      line,
      w * 0.75,
      depthOp
    );
    front += S(
      polyline(wobble(rand, [[x1, y0], [x1 + dep, y0 - dep], [x1 + dep, y1 - dep], [x1, y1]], amt * 0.5)),
      line,
      w * 0.75,
      depthOp
    );
  }

  if (medioLibre) {
    // Draw only the bottom half of the cube, broken across the top.
    const midY = y0 + (y1 - y0) * 0.52;
    const broken: P[] = [];
    for (let i = 0; i <= 7; i++) {
      broken.push([x0 + ((x1 - x0) / 7) * i, midY + jit(rand, 46)]);
    }
    front += S(openSpline(broken), line, w * 1.1);
    front += S(polyline([[x0, midY], [x0, y1], [x1, y1], [x1, midY]]), line, w * 1.1);
  } else {
    front += S(box, line, w * 1.15);
  }

  // Internal fracture lines — pure line, no shading. 2–3 at GEN 0.
  // Kept strictly inside the ice: a fracture that escapes the cube reads as a
  // scratch on the artwork instead of a crack in the block.
  const inset = 26;
  const fractures = estadoIndex === 2 ? 3 : 2;
  for (let i = 0; i < fractures; i++) {
    const fx = (): number => x0 + inset + rand() * (x1 - x0 - inset * 2);
    const ax: P = [fx(), y0 + inset + rand() * 60];
    const bx: P = [fx(), y1 - inset - rand() * 90];
    back += S(handLine(rand, ax, bx, jit(rand, 18)), cold, w * 0.55, ink.lineOpacity * 0.75);
  }

  // Trait-specific interior.
  if (key === "BURBUJAS") {
    // Air pockets suspended in the ice.
    for (const p of scatter(rand, 16, [x0 + 30, y0 + 30, x1 - x0 - 60, y1 - y0 - 60])) {
      back += stroke(
        `M${n(p[0] - 7)},${n(p[1])}a7,7 0 1,0 14,0a7,7 0 1,0 -14,0`,
        { color: cold, width: w * 0.45, opacity: ink.lineOpacity * 0.8, passes: 1 }
      );
    }
  }

  if (key === "TURBIO") {
    // Milky ice — hatching, because the ice is never filled.
    for (let i = 0; i < 26; i++) {
      const y = y0 + 20 + ((y1 - y0 - 40) / 26) * i;
      back += stroke(handLine(rand, [x0 + 14, y], [x1 - 14, y], jit(rand, 8)), {
        color: cold,
        width: w * 0.3,
        opacity: 0.3,
        passes: 1,
      });
    }
  }

  if (key === "ASTILLADO") {
    // Already damaged at birth.
    for (let i = 0; i < 3; i++) {
      const sx = x0 + rand() * (x1 - x0);
      front += S(
        polyline(wobble(rand, [[sx, y0], [sx + 26, y0 + 40], [sx - 14, y0 + 36]], 4), true),
        line,
        w * 0.7
      );
    }
  }

  // GEN 1: cracks propagate *outward from the pingu* — it caused this.
  if (gen === 1) {
    // Cracks propagate outward from the pingu and die at the ice boundary —
    // the pingu caused this, and the first crack is the proof the mechanic is
    // real, so it is drawn heaviest.
    const cx = 500;
    const cy = 520;
    const cracks = estadoIndex === 3 ? 1 : 3;
    for (let i = 0; i < cracks; i++) {
      const a = rand() * Math.PI * 2;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      // Distance along the ray to the box edge.
      const tx = dx > 0 ? (x1 - cx) / dx : dx < 0 ? (x0 - cx) / dx : Infinity;
      const ty = dy > 0 ? (y1 - cy) / dy : dy < 0 ? (y0 - cy) / dy : Infinity;
      const edge = Math.min(tx, ty);
      // GRIETA is a hairline that barely travels; later states reach the edge.
      const reach = estadoIndex === 3 ? edge * 0.45 : edge * (0.8 + rand() * 0.18);
      const from: P = [cx + dx * 100, cy + dy * 100];
      const to: P = [cx + dx * reach, cy + dy * reach];
      front += S(
        openSpline(
          wobble(rand, [from, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2], to], 16)
        ),
        line,
        w * (i === 0 ? 1.1 : 0.7)
      );
    }

    if (esquinaIda) {
      // A corner has broken off and lies beside the cube.
      front += S(polyline([[x1 - 150, y0], [x1, y0], [x1, y0 + 140]], true), line, w);
      front += S(
        polyline(wobble(rand, [[x1 - 60, y1 - 40], [x1 + 60, y1 - 70], [x1 + 30, y1 + 10]], 6), true),
        line,
        w
      );
    }
  }

  // Cold condensation ticks on the outside of the cube.
  if (estadoIndex >= 1) {
    const ticks = estadoIndex >= 2 ? 22 : 12;
    for (let i = 0; i < ticks; i++) {
      const side = rand();
      const p: P =
        side < 0.5
          ? [x0 - 10 - rand() * 22, y0 + rand() * (y1 - y0)]
          : [x1 + 10 + rand() * 22, y0 + rand() * (y1 - y0)];
      front += stroke(handLine(rand, p, [p[0], p[1] + 10 + rand() * 14]), {
        color: cold,
        width: w * 0.5,
        opacity: 0.8,
        passes: 1,
      });
    }
  }

  return { back, front, rotate };
}

/** A wet ring / puddle under the cube. Grows with calor. */
export function wetGround(gen: number, estadoIndex: number, ink: Ink, rand: Rand): string {
  if (gen === 0 && estadoIndex === 0) return ""; // pristine cube sits on nothing
  const cold = ink.cold ?? ink.accent ?? ink.ink;
  const spread = gen === 0 ? 0.3 : gen === 1 ? 0.7 : 1;
  const w = 300 * spread;
  const y = 892;
  let out = stroke(
    openSpline(wobble(rand, [[500 - w, y], [500, y + 10], [500 + w, y]], 6)),
    { color: cold, width: ink.w * 0.7, opacity: 0.7, passes: 1 }
  );
  if (gen >= 1) {
    // First drip forming below.
    for (let i = 0; i < 3; i++) {
      const x = 400 + rand() * 200;
      out += stroke(handLine(rand, [x, y - 70 - rand() * 40], [x, y - 10]), {
        color: cold,
        width: ink.w * 0.5,
        opacity: 0.8,
        passes: 1,
      });
    }
  }
  return out;
}

/**
 * GEN 2 — shallow moving water, drawn as directional line only, never fill.
 * Reflections are broken line.
 */
export function water(estadoIndex: number, ink: Ink, rand: Rand): string {
  const acc = ink.accent ?? ink.bleed;
  const moving = estadoIndex >= 7;
  let out = "";

  for (let i = 0; i < 9; i++) {
    const y = 790 + i * 17;
    const len = 150 + rand() * 300;
    const x = 500 - len / 2 + jit(rand, 160);
    // CORRIENTE_MEDIA and up: lines lengthen and gain direction.
    const bow = moving ? 10 + rand() * 14 : 2;
    out += stroke(handLine(rand, [x, y], [x + len * (moving ? 1.25 : 1), y], bow), {
      color: acc,
      width: ink.w * (i % 3 === 0 ? 0.8 : 0.5),
      opacity: 0.85,
      passes: 1,
    });
  }

  // Broken-line reflection under the body.
  for (let i = 0; i < 5; i++) {
    const y = 800 + i * 22;
    out += stroke(handLine(rand, [430 + jit(rand, 30), y], [570 + jit(rand, 30), y]), {
      color: ink.ink,
      width: ink.w * 0.4,
      opacity: 0.3,
      passes: 1,
      extra: `stroke-dasharray="${n(8 + rand() * 14)} ${n(6 + rand() * 10)}"`,
    });
  }

  // CORRIENTE_ALTA: steam at the edges. Transition warning.
  if (estadoIndex === 8) {
    for (let i = 0; i < 7; i++) {
      const x = 180 + rand() * 640;
      out += stroke(
        openSpline(wobble(rand, [[x, 760], [x + jit(rand, 30), 700], [x + jit(rand, 40), 640]], 14)),
        { color: acc, width: ink.w * 0.4, opacity: 0.35, passes: 1 }
      );
    }
  }

  return out;
}

/**
 * GEN 3 — everything rises. Nothing sags, drips or droops.
 * Dissolves upward from the feet; the head is last and clearest.
 */
export function vapor(estadoIndex: number, ink: Ink, rand: Rand): string {
  const ghost = ink.accent;
  let out = "";

  // Rising ticks. Upward only — a sagging line would invert the whole thesis.
  const count = estadoIndex >= 11 ? 26 : 16;
  for (let i = 0; i < count; i++) {
    const x = 240 + rand() * 520;
    const y = 560 + rand() * 300;
    const h = 60 + rand() * 150;
    out += stroke(
      openSpline([
        [x, y],
        [x + jit(rand, 26), y - h * 0.5],
        [x + jit(rand, 34), y - h],
      ]),
      {
        color: ghost ?? ink.ink,
        width: ink.w * 0.4,
        opacity: 0.22,
        passes: 1,
      }
    );
  }
  return out;
}

/** FONDO — drawn behind everything, sparse line, never competing. */
export function fondo(key: string, ink: Ink, rand: Rand): string {
  if (key === "VACIO" || key === "SIN_FONDO") return "";
  const acc = ink.accent ?? ink.bleed;
  const w = ink.w * 0.55;
  const S = (d: string, color = ink.bleed, width = w, opacity = 0.5) =>
    stroke(d, { color, width, opacity, passes: 1, rand });

  switch (key) {
    case "MUELLE": {
      // Dock: horizon line and pilings.
      let o = S(handLine(rand, [0, 700], [1000, 694]), ink.bleed, w * 1.2, 0.55);
      for (let i = 0; i < 6; i++) {
        const x = 60 + i * 180;
        o += S(handLine(rand, [x, 700], [x + jit(rand, 8), 880]));
      }
      return o;
    }
    case "TALLER": {
      // Workshop: pegboard grid and a hanging tool.
      let o = "";
      for (let i = 0; i < 7; i++) o += S(handLine(rand, [120, 180 + i * 70], [880, 180 + i * 70]), ink.bleed, w, 0.3);
      for (let i = 0; i < 5; i++) o += S(handLine(rand, [160 + i * 180, 170], [160 + i * 180, 600]), ink.bleed, w, 0.22);
      return o;
    }
    case "TUNEL": {
      // Receding arch.
      let o = "";
      for (let i = 0; i < 5; i++) {
        const k = i * 60;
        o += S(
          openSpline([[120 + k, 880], [120 + k, 420 + k * 0.6], [500, 250 + k], [880 - k, 420 + k * 0.6], [880 - k, 880]]),
          ink.bleed,
          w,
          0.45 - i * 0.06
        );
      }
      return o;
    }
    case "ANDAMIO": {
      // Scaffold.
      let o = "";
      for (let i = 0; i < 4; i++) o += S(handLine(rand, [0, 220 + i * 190], [1000, 220 + i * 190]), ink.bleed, w * 1.1, 0.42);
      for (let i = 0; i < 6; i++) o += S(handLine(rand, [90 + i * 170, 180], [90 + i * 170, 880]), ink.bleed, w, 0.36);
      for (let i = 0; i < 3; i++) o += S(handLine(rand, [90 + i * 340, 220], [430 + i * 340, 410]), ink.bleed, w * 0.8, 0.3);
      return o;
    }
    case "OBRA": {
      // Construction barrier — defined by its orange, so illegal with SIN_COLOR.
      let o = S(polyline([[60, 640], [940, 628], [940, 760], [60, 772]], true), ink.ink, w, 0.5);
      for (let i = 0; i < 14; i++) {
        const x = 70 + i * 62;
        o += S(handLine(rand, [x, 768], [x + 56, 632]), acc, ink.w * 1.6, 0.6);
      }
      return o;
    }
    case "PERSIANA": {
      // Roller shutter.
      let o = "";
      for (let i = 0; i < 20; i++) o += S(handLine(rand, [70, 170 + i * 36], [930, 170 + i * 36]), ink.bleed, w * 1.2, 0.34);
      return o;
    }
    case "BALDOSA": {
      // Tiled floor in perspective.
      let o = "";
      for (let i = 0; i < 7; i++) o += S(handLine(rand, [0, 640 + i * 42], [1000, 640 + i * 42]), ink.bleed, w, 0.34);
      for (let i = 0; i < 9; i++) {
        const x = i * 125;
        o += S(handLine(rand, [x, 640], [x * 1.5 - 250, 900]), ink.bleed, w, 0.28);
      }
      return o;
    }
    case "AZOTEA": {
      // Rooftop: skyline below the horizon, antenna above.
      let o = S(handLine(rand, [0, 720], [1000, 716]), ink.bleed, w * 1.2, 0.5);
      for (let i = 0; i < 9; i++) {
        const x = i * 115;
        const h = 60 + rand() * 150;
        o += S(polyline([[x, 716], [x, 716 - h], [x + 100, 716 - h], [x + 100, 716]]), ink.bleed, w, 0.3);
      }
      return o;
    }
    case "CAMARA_FRIA": {
      // Cold room — where the cubes were found.
      let o = S(polyline([[120, 150], [880, 150], [880, 880], [120, 880]], true), ink.bleed, w, 0.4);
      for (let i = 0; i < 6; i++) o += S(handLine(rand, [120, 240 + i * 120], [880, 240 + i * 120]), ink.bleed, w, 0.26);
      o += S(polyline([[430, 150], [570, 150], [570, 880], [430, 880]]), ink.bleed, w, 0.3);
      return o;
    }
    case "HIELO_SUCIO": {
      // The old home. Dirty ice.
      let o = S(handLine(rand, [0, 760], [1000, 748]), ink.cold ?? ink.bleed, w * 1.2, 0.45);
      for (let i = 0; i < 10; i++) {
        const x = rand() * 1000;
        o += S(polyline(wobble(rand, [[x, 760], [x + 60, 700], [x + 130, 762]], 10)), ink.cold ?? ink.bleed, w, 0.3);
      }
      for (const p of scatter(rand, 30, [0, 760, 1000, 130])) {
        o += circle(p, rand() * 3 + 0.6, ink.bleed, 0.35);
      }
      return o;
    }
  }
  return "";
}

/**
 * SEÑA — the signature layer. Some values deface the artwork itself.
 * ~27% of the collection is defaced.
 */
export function sena(key: string, ink: Ink, rand: Rand): string {
  if (key === "NINGUNA") return "";
  const acc = ink.accent ?? ink.ink;
  const w = ink.w;

  switch (key) {
    case "ESQUINAS": {
      // Registration marks in the corners.
      let o = "";
      for (const [x, y] of [[60, 60], [940, 60], [60, 940], [940, 940]] as P[]) {
        o += stroke(`M${n(x - 22)},${n(y)}h44M${n(x)},${n(y - 22)}v44`, {
          color: ink.ink,
          width: w * 0.5,
          opacity: 0.7,
          passes: 1,
        });
      }
      return o;
    }
    case "TAG_PARED":
      // Tagged on the wall behind — needs a wall, so illegal with SIN_FONDO.
      return stroke(
        openSpline(wobble(rand, [[90, 300], [180, 250], [150, 350], [260, 290], [230, 370], [330, 310]], 8)),
        { color: acc, width: w * 1.5, opacity: 0.75, passes: 2, rand }
      );
    case "SELLO_HECHO": {
      // HECHO stamped across the piece.
      const y = 600;
      return (
        stroke(polyline([[300, y - 60], [700, y - 76], [708, y + 24], [308, y + 40]], true), {
          color: acc,
          width: w * 1.3,
          opacity: 0.8,
          passes: 2,
          rand,
        }) +
        `<text x="500" y="${n(y - 6)}" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="74" letter-spacing="10" text-anchor="middle" fill="${acc}" opacity="0.8" transform="rotate(-2.4 500 ${n(y - 6)})">HECHO</text>`
      );
    }
    case "TAG_PECHO":
      // Tagged directly on the body.
      return stroke(
        openSpline(wobble(rand, [[420, 520], [520, 490], [480, 560], [580, 520]], 6)),
        { color: acc, width: w * 1.2, opacity: 0.9, passes: 2, rand }
      );
    case "GOTEO": {
      // Paint runs down over the artwork.
      let o = "";
      for (let i = 0; i < 7; i++) {
        const x = 180 + rand() * 640;
        const top = 300 + rand() * 260;
        const len = 120 + rand() * 300;
        o += stroke(handLine(rand, [x, top], [x + jit(rand, 10), top + len]), {
          color: acc,
          width: w * (0.8 + rand()),
          opacity: 0.7,
          passes: 1,
        });
        o += circle([x, top + len], w * (0.8 + rand()) * 0.9, acc, 0.7);
      }
      return o;
    }
    case "CENSURADO":
      // A bar over the eyes. Illegal with VENDADO — eyes already covered.
      return stroke(polyline([[250, 320], [760, 306], [764, 392], [254, 406]], true), {
        color: ink.ink,
        width: w,
        fill: ink.ink,
        opacity: 1,
        passes: 1,
      });
    case "TACHADO":
      // Crossed out. The whole piece.
      return (
        stroke(handLine(rand, [120, 160], [880, 870], 24), {
          color: acc,
          width: w * 2.4,
          opacity: 0.85,
          passes: 2,
          rand,
        }) +
        stroke(handLine(rand, [880, 160], [120, 870], -24), {
          color: acc,
          width: w * 2.4,
          opacity: 0.85,
          passes: 2,
          rand,
        })
      );
    case "FECHA":
      // Handwritten date in the margin. The rarest seña.
      return `<text x="880" y="930" font-family="Courier,monospace" font-size="30" text-anchor="end" fill="${ink.ink}" opacity="0.72" transform="rotate(-1.5 880 930)">2026 · HECHO POR</text>`;
  }
  return "";
}
