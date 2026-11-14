/**
 * The pingu. Squat, wide-footed, low centre of gravity. Never heroic.
 *
 * Drawn in a local box of 400 × 520 and transformed by the scene, so every
 * generation reuses one silhouette — that is what makes the face survive all
 * four states, which the art direction calls the identity anchor.
 */
import type { Rand } from "@pingus/core";
import {
  type P,
  circle,
  closedSpline,
  fill,
  handLine,
  jit,
  n,
  openSpline,
  polyline,
  scalePts,
  scatter,
  stroke,
  wobble,
} from "./geom.ts";

export interface Ink {
  ink: string;
  ground: string;
  accent: string | null;
  cold: string | null;
  bleed: string;
  lineOpacity: number;
  /** GEN 3 draws outline only — no tux fill. */
  outlineOnly: boolean;
  /** Base line weight. */
  w: number;
}

const CX = 200;

/** Base silhouette: head and body as one continuous shape. */
const SILHOUETTE: P[] = [
  [200, 8],
  [258, 30],
  [286, 92],
  [292, 140],
  [330, 210],
  [362, 300],
  [368, 392],
  [352, 462],
  [300, 500],
  [230, 512],
  [170, 512],
  [100, 500],
  [48, 462],
  [32, 392],
  [38, 300],
  [70, 210],
  [108, 140],
  [114, 92],
  [142, 30],
];

/** The tux opening — filled with ground, which is what reads as a penguin. */
const BELLY: P[] = [
  [200, 152],
  [266, 206],
  [292, 300],
  [286, 400],
  [246, 470],
  [200, 486],
  [154, 470],
  [114, 400],
  [108, 300],
  [134, 206],
];

export type Cuerpo =
  | "ESTANDAR"
  | "FLACO"
  | "GORDO"
  | "PELADO"
  | "CRIA"
  | "FANTASMA";

interface BodyGeom {
  silhouette: P[];
  belly: P[];
  /** Face anchor — eyes and beak hang off this. */
  faceY: number;
  scale: number;
  ragged: boolean;
  ghost: boolean;
}

export function bodyGeom(cuerpo: Cuerpo, _rand: Rand): BodyGeom {
  let sil = SILHOUETTE as P[];
  let belly = BELLY as P[];
  let faceY = 96;
  let scale = 1;
  let ragged = false;
  let ghost = false;

  switch (cuerpo) {
    case "FLACO":
      sil = scalePts(sil, 0.82, 1.02, CX, 0);
      belly = scalePts(belly, 0.8, 1.02, CX, 0);
      break;
    case "GORDO":
      sil = scalePts(sil, 1.17, 0.98, CX, 0);
      belly = scalePts(belly, 1.2, 0.98, CX, 0);
      break;
    case "PELADO":
      // Mid-moult. The silhouette itself is ragged.
      ragged = true;
      break;
    case "CRIA":
      // Chick: smaller, rounder, bigger head. Still does not smile.
      sil = scalePts(sil, 0.92, 0.84, CX, 512);
      belly = scalePts(belly, 0.9, 0.82, CX, 512);
      faceY = 120;
      scale = 0.9;
      break;
    case "FANTASMA":
      ghost = true;
      break;
  }

  return { silhouette: sil, belly, faceY, scale, ragged, ghost };
}

/** Flipper positions by pose. GEN 2 is the only one with real movement. */
function flippers(gen: number, rand: Rand, g: BodyGeom): string[] {
  const out: string[] = [];
  const L = g.silhouette;
  void L;

  if (gen === 0) {
    // Dead still. Flippers flat against the body.
    out.push(openSpline(wobble(rand, [[74, 216], [50, 300], [60, 388], [84, 398]], 3)));
    out.push(openSpline(wobble(rand, [[326, 216], [350, 300], [340, 388], [316, 398]], 3)));
  } else if (gen === 1) {
    // First movement: a shoulder turn, one flipper out.
    out.push(openSpline(wobble(rand, [[74, 216], [50, 300], [60, 388], [84, 398]], 3)));
    out.push(
      openSpline(wobble(rand, [[328, 212], [386, 262], [404, 330], [376, 344]], 3.5))
    );
  } else if (gen === 2) {
    // Mid-stride, leaning. Peak movement.
    out.push(openSpline(wobble(rand, [[72, 212], [26, 268], [14, 338], [44, 352]], 4)));
    out.push(
      openSpline(wobble(rand, [[330, 206], [392, 244], [416, 300], [388, 318]], 4))
    );
  } else {
    // Settled. Standing straight. Finished, never falling.
    out.push(openSpline(wobble(rand, [[76, 220], [54, 302], [66, 384], [88, 394]], 2)));
    out.push(openSpline(wobble(rand, [[324, 220], [346, 302], [334, 384], [312, 394]], 2)));
  }
  return out;
}

/** Wide, flat feet. Gone by VAPOR_BAJO — dissolution starts at the feet. */
function feet(gen: number, rand: Rand, lean: number): string[] {
  if (gen === 3) return [];
  const dx = lean;
  return [
    polyline(wobble(rand, [[126 + dx, 498], [74 + dx, 528], [158 + dx, 526]], 3), true),
    polyline(wobble(rand, [[274 + dx, 498], [326 + dx, 528], [242 + dx, 526]], 3), true),
  ];
}

/**
 * Face: two dots and a line, plus a hard wedge beak.
 * No smiles, no cheeks, no teeth, no eyebrows. The joke is that they are
 * completely serious — the moment one smiles the project loses.
 */
export function face(ink: Ink, g: BodyGeom, rand: Rand, gen: number): string {
  const y = g.faceY;
  const r = g.scale * (gen === 3 ? 9 : 10.5);
  const spread = 34 * g.scale;
  let out = "";

  // Two dots. Light on the ink head — a flat, unimpressed stare.
  const eyeColor = ink.outlineOnly ? ink.ink : ink.ground;
  const eyeOp = ink.outlineOnly ? ink.lineOpacity : 1;
  out += circle([CX - spread + jit(rand, 1.5), y], r, eyeColor, eyeOp);
  out += circle([CX + spread + jit(rand, 1.5), y], r, eyeColor, eyeOp);

  if (ink.outlineOnly) {
    // At VAPOR the eyes are rings, not dots — still clearly readable.
    out += stroke(
      `M${n(CX - spread - r)},${n(y)}a${n(r)},${n(r)} 0 1,0 ${n(r * 2)},0a${n(r)},${n(r)} 0 1,0 ${n(-r * 2)},0`,
      { color: ink.ink, width: ink.w * 0.5, opacity: ink.lineOpacity, passes: 1 }
    );
    out += stroke(
      `M${n(CX + spread - r)},${n(y)}a${n(r)},${n(r)} 0 1,0 ${n(r * 2)},0a${n(r)},${n(r)} 0 1,0 ${n(-r * 2)},0`,
      { color: ink.ink, width: ink.w * 0.5, opacity: ink.lineOpacity, passes: 1 }
    );
  }

  // Beak — a hard wedge, never a soft triangle.
  const by = y + 26 * g.scale;
  const bw = 17 * g.scale;
  const bh = 30 * g.scale;
  const beak = polyline(
    [
      [CX - bw, by],
      [CX + bw, by],
      [CX + jit(rand, 2), by + bh],
    ],
    true
  );
  out += stroke(beak, {
    color: ink.ink,
    width: ink.w * 0.8,
    fill: ink.outlineOnly ? "none" : ink.ground,
    opacity: ink.lineOpacity,
    passes: 2,
    rand,
    linecap: "butt",
  });
  // The line. The beak seam.
  out += stroke(handLine(rand, [CX - bw * 0.8, by + 1], [CX + bw * 0.8, by + 1]), {
    color: ink.ink,
    width: ink.w * 0.55,
    opacity: ink.lineOpacity * 0.9,
    passes: 1,
  });

  return out;
}

/** MARCA — one head slot. */
export function marca(key: string, ink: Ink, g: BodyGeom, rand: Rand): string {
  const y = g.faceY;
  const acc = ink.accent ?? ink.ink;
  const w = ink.w;
  const s = (d: string, color = ink.ink, width = w, f = "none") =>
    stroke(d, { color, width, fill: f, opacity: ink.lineOpacity, passes: 2, rand });

  switch (key) {
    case "LIMPIO":
      return "";

    case "BANDANA":
      // Over the beak, under the eyes.
      return s(
        closedSpline(wobble(rand, [[112, y + 20], [CX, y + 14], [288, y + 20], [284, y + 62], [CX, y + 78], [116, y + 62]], 3)),
        ink.ink,
        w,
        acc
      );

    case "RESPIRADOR":
      return (
        s(closedSpline(wobble(rand, [[134, y + 16], [CX, y + 10], [266, y + 16], [258, y + 70], [CX, y + 86], [142, y + 70]], 3)), ink.ink, w, ink.bleed) +
        s(`M158,${n(y + 44)}h84`, ink.ink, w * 0.7) +
        circle([168, y + 60], 7, ink.ink, ink.lineOpacity) +
        circle([232, y + 60], 7, ink.ink, ink.lineOpacity)
      );

    case "GORRO_CUBO":
      // A little ice cube worn as a hat. The mark, worn.
      return s(
        polyline([[152, 4], [248, 4], [248, -44], [152, -44]], true),
        ink.cold ?? acc,
        w
      ) + s(`M152,-20h96M200,-44v40`, ink.cold ?? acc, w * 0.6);

    case "GORRA_NATACION":
      return s(
        openSpline(wobble(rand, [[110, y - 4], [CX, -22], [290, y - 4]], 3)),
        ink.ink,
        w * 1.1,
        acc
      );

    case "PICO_PARTIDO": {
      // The beak itself is broken — drawn as a chip out of it.
      const by = y + 26 * g.scale;
      return s(`M${n(CX + 4)},${n(by + 8)}l14,8l-16,6`, ink.ink, w * 0.7);
    }

    case "PARCHE":
      return (
        s(polyline(wobble(rand, [[216, y - 16], [262, y - 10], [256, y + 20], [212, y + 14]], 3), true), ink.ink, w, ink.ink) +
        s(handLine(rand, [256, y - 12], [310, y - 28]), ink.ink, w * 0.6)
      );

    case "CASCO":
      return (
        s(openSpline(wobble(rand, [[104, y + 6], [CX, -32], [296, y + 6]], 3)), ink.ink, w * 1.1, acc) +
        s(handLine(rand, [104, y + 4], [296, y + 4]), ink.ink, w * 0.8)
      );

    case "CAPUCHA":
      // A hood needs a hood — FIT is constrained to a hooded garment.
      return s(
        closedSpline(wobble(rand, [[96, y + 70], [78, y - 10], [CX, -44], [322, y - 10], [304, y + 70], [268, y + 30], [CX, y + 18], [132, y + 30]], 4)),
        ink.ink,
        w,
        ink.outlineOnly ? "none" : ink.bleed
      );

    case "ANTIPARRAS":
      return (
        s(polyline([[128, y - 18], [272, y - 18], [272, y + 16], [128, y + 16]], true), ink.ink, w, acc) +
        s(`M${n(CX)},${n(y - 18)}v34`, ink.ink, w * 0.6) +
        s(handLine(rand, [128, y - 2], [96, y - 8]), ink.ink, w * 0.6) +
        s(handLine(rand, [272, y - 2], [304, y - 8]), ink.ink, w * 0.6)
      );

    case "VENDADO":
      // Eyes already covered — one head slot, no other face gear.
      return (
        s(polyline(wobble(rand, [[104, y - 20], [296, y - 26], [300, y + 18], [108, y + 24]], 3), true), ink.ink, w, ink.ground) +
        s(handLine(rand, [104, y - 2], [300, y - 6]), ink.ink, w * 0.5)
      );
  }
  return "";
}

/** FIT — the only purchasable layer. Fully visible at GEN 2 only. */
export function fit(key: string, ink: Ink, _g: BodyGeom, rand: Rand, gen: number): string {
  if (key === "NADA" || gen === 0 || gen === 3) return "";
  const acc = ink.accent ?? ink.bleed;
  const w = ink.w;
  const s = (d: string, color = ink.ink, width = w, f = "none") =>
    stroke(d, { color, width, fill: f, opacity: ink.lineOpacity, passes: 2, rand });

  // At GEN 1 the lower body is still encased, so garments are partial.
  const partial = gen === 1;

  switch (key) {
    case "TEE_DONE": {
      const tee = closedSpline(
        wobble(rand, [[CX, 180], [296, 206], [312, 268], [286, 282], [282, 360], [CX, 374], [118, 360], [114, 282], [88, 268], [104, 206]], 3)
      );
      return (
        s(tee, ink.ink, w, acc) +
        // DONE box logo
        s(polyline([[172, 250], [228, 250], [228, 282], [172, 282]], true), ink.ink, w * 0.7, ink.ground) +
        s(`M180,268h40`, ink.ink, w * 0.6)
      );
    }

    case "CARGO_WADDLE": {
      if (partial) return "";
      const pant = closedSpline(
        wobble(rand, [[CX, 352], [284, 364], [292, 470], [252, 498], [CX, 486], [148, 498], [108, 470], [116, 364]], 3)
      );
      return (
        s(pant, ink.ink, w, acc) +
        // Cargo pockets
        s(polyline([[128, 398], [168, 398], [168, 440], [128, 440]], true), ink.ink, w * 0.7) +
        s(polyline([[232, 398], [272, 398], [272, 440], [232, 440]], true), ink.ink, w * 0.7)
      );
    }

    case "HOODED_TUX": {
      const body = closedSpline(
        wobble(rand, [[CX, 176], [300, 204], [316, 290], [288, 300], [284, 390], [CX, 404], [116, 390], [112, 300], [84, 290], [100, 204]], 3)
      );
      return (
        s(body, ink.ink, w, acc) +
        // Hood bunched at the neck
        s(openSpline(wobble(rand, [[124, 186], [CX, 214], [276, 186]], 3)), ink.ink, w * 0.8) +
        s(`M${n(CX)},230v70`, ink.ink, w * 0.6)
      );
    }

    case "PUFFER": {
      const shell = closedSpline(
        wobble(rand, [[CX, 168], [312, 200], [334, 300], [304, 316], [298, 400], [CX, 416], [102, 400], [96, 316], [66, 300], [88, 200]], 4)
      );
      // Horizontal baffles — the only way a puffer reads in pure line.
      let baffles = "";
      for (let i = 0; i < 4; i++) {
        const y = 212 + i * 50;
        baffles += s(handLine(rand, [100 + i * 2, y], [300 - i * 2, y], 6), ink.ink, w * 0.7);
      }
      return s(shell, ink.ink, w * 1.1, acc) + baffles;
    }

    case "CHALECO": {
      // Hi-vis. Defined by its colour — illegal with SIN_COLOR.
      const vest = closedSpline(
        wobble(rand, [[CX, 184], [286, 208], [290, 380], [CX, 394], [110, 380], [114, 208]], 3)
      );
      return (
        s(vest, ink.ink, w, acc) +
        s(handLine(rand, [120, 262], [280, 262], 4), ink.ground, w * 2.2) +
        s(handLine(rand, [120, 312], [280, 312], 4), ink.ground, w * 2.2) +
        s(`M${n(CX)},198v196`, ink.ink, w * 0.6)
      );
    }

    case "MONO_OBRERO": {
      const suit = closedSpline(
        wobble(rand, [[CX, 178], [298, 206], [310, 300], [292, 420], [262, 492], [CX, 480], [138, 492], [108, 420], [90, 300], [102, 206]], 3)
      );
      return (
        s(suit, ink.ink, w, acc) +
        s(`M${n(CX)},206v274`, ink.ink, w * 0.6) +
        // Chest pocket — MONO carries the wearer's wallet short-code
        s(polyline([[214, 236], [268, 236], [268, 274], [214, 274]], true), ink.ink, w * 0.7)
      );
    }
  }
  return "";
}

/** CARGA — GEN 2 only. You cannot hold things inside a cube. */
export function carga(key: string, ink: Ink, rand: Rand): string {
  if (key === "VACIO") return "";
  const acc = ink.accent ?? ink.bleed;
  const w = ink.w;
  const s = (d: string, color = ink.ink, width = w, f = "none") =>
    stroke(d, { color, width, fill: f, opacity: ink.lineOpacity, passes: 2, rand });

  // Held out at the end of the forward flipper.
  const hx = 408;
  const hy = 300;

  switch (key) {
    case "LATA": // spray can — the core prop
      return (
        s(polyline([[hx - 16, hy], [hx + 16, hy], [hx + 16, hy + 64], [hx - 16, hy + 64]], true), ink.ink, w, acc) +
        s(polyline([[hx - 7, hy - 14], [hx + 7, hy - 14], [hx + 7, hy], [hx - 7, hy]], true), ink.ink, w * 0.8, ink.ink) +
        s(handLine(rand, [hx - 16, hy + 22], [hx + 16, hy + 22]), ink.ink, w * 0.6)
      );
    case "MARTILLO": // the doer's tool
      return (
        s(`M${n(hx)},${n(hy - 10)}v76`, ink.ink, w * 1.4) +
        s(polyline([[hx - 24, hy - 24], [hx + 24, hy - 24], [hx + 24, hy - 4], [hx - 24, hy - 4]], true), ink.ink, w, ink.ink)
      );
    case "CAJON":
      return (
        s(polyline([[hx - 30, hy + 8], [hx + 30, hy + 8], [hx + 30, hy + 58], [hx - 30, hy + 58]], true), ink.ink, w, acc) +
        s(handLine(rand, [hx - 30, hy + 26], [hx + 30, hy + 26]), ink.ink, w * 0.6)
      );
    case "SARDINA":
      return (
        s(closedSpline(wobble(rand, [[hx - 30, hy + 30], [hx, hy + 12], [hx + 26, hy + 30], [hx, hy + 48]], 2)), ink.ink, w, acc) +
        s(polyline([[hx + 26, hy + 30], [hx + 46, hy + 16], [hx + 46, hy + 44]], true), ink.ink, w * 0.8) +
        circle([hx - 14, hy + 26], 3.5, ink.ink, ink.lineOpacity)
      );
    case "ROLO": // paint roller
      return (
        s(polyline([[hx - 26, hy], [hx + 26, hy], [hx + 26, hy + 24], [hx - 26, hy + 24]], true), ink.ink, w, acc) +
        s(`M${n(hx)},${n(hy + 24)}v52`, ink.ink, w)
      );
    case "LLAVE": // wrench
      return (
        s(`M${n(hx)},${n(hy + 4)}v64`, ink.ink, w * 1.2) +
        s(polyline([[hx - 16, hy - 16], [hx + 16, hy - 16], [hx + 10, hy + 6], [hx - 10, hy + 6]], true), ink.ink, w)
      );
    case "CUADERNO":
      return (
        s(polyline([[hx - 24, hy + 6], [hx + 24, hy + 6], [hx + 24, hy + 66], [hx - 24, hy + 66]], true), ink.ink, w, ink.ground) +
        s(`M${n(hx - 12)},${n(hy + 6)}v60`, ink.ink, w * 0.6) +
        s(handLine(rand, [hx - 4, hy + 26], [hx + 16, hy + 26]), ink.ink, w * 0.5) +
        s(handLine(rand, [hx - 4, hy + 42], [hx + 16, hy + 42]), ink.ink, w * 0.5)
      );
    case "RADIO": // off. never playing.
      return (
        s(polyline([[hx - 34, hy + 10], [hx + 34, hy + 10], [hx + 34, hy + 56], [hx - 34, hy + 56]], true), ink.ink, w, ink.bleed) +
        circle([hx - 14, hy + 33], 11, ink.ground, ink.lineOpacity) +
        s(handLine(rand, [hx + 6, hy + 24], [hx + 26, hy + 24]), ink.ink, w * 0.5) +
        s(handLine(rand, [hx + 6, hy + 42], [hx + 26, hy + 42]), ink.ink, w * 0.5)
      );
    case "CONO":
      return (
        s(polyline([[hx, hy], [hx + 28, hy + 62], [hx - 28, hy + 62]], true), ink.ink, w, acc) +
        s(handLine(rand, [hx - 14, hy + 36], [hx + 14, hy + 36]), ink.ground, w * 1.6)
      );
    case "ASTILLA": // a shard of its own cube. kept it.
      return s(
        polyline(wobble(rand, [[hx - 18, hy + 10], [hx + 20, hy + 2], [hx + 8, hy + 58], [hx - 22, hy + 44]], 2), true),
        ink.cold ?? ink.ink,
        w,
        "none"
      );
  }
  return "";
}

/**
 * Compose the pingu. Order matters: body, then tux opening, then garment,
 * then face, then head gear.
 */
export function drawPingu(
  opts: {
    cuerpo: Cuerpo;
    marca: string;
    fit: string;
    carga: string;
    gen: number;
    ink: Ink;
    rand: Rand;
    /** How much of the body is still encased — hides the lower half at GEN 1. */
    encased?: number;
  }
): string {
  const { ink, rand, gen } = opts;
  const g = bodyGeom(opts.cuerpo, rand);
  const wob = g.ragged ? 7 : 3;
  const lean = gen === 2 ? 6 : 0;

  let out = "";

  // Feet first — they sit behind the body.
  for (const f of feet(gen, rand, lean)) {
    out += stroke(f, {
      color: ink.ink,
      width: ink.w,
      fill: ink.outlineOnly ? "none" : ink.ink,
      opacity: ink.lineOpacity,
      passes: 2,
      rand,
    });
  }

  // Flippers behind the torso.
  for (const f of flippers(gen, rand, g)) {
    out += stroke(f, {
      color: ink.ink,
      width: ink.w * 1.6,
      opacity: ink.lineOpacity,
      passes: 2,
      rand,
      linecap: "round",
    });
  }

  // The silhouette. FANTASMA is outline only — an outline cannot wear clothes,
  // which the generator already enforces on FIT and CARGA.
  const sil = closedSpline(wobble(rand, g.silhouette, wob));
  const solid = !g.ghost && !ink.outlineOnly;
  out += stroke(sil, {
    color: ink.ink,
    width: ink.w * 1.15,
    fill: solid ? ink.ink : "none",
    opacity: ink.lineOpacity,
    passes: 2,
    rand,
  });

  // Moult: ragged ticks along the edge.
  if (g.ragged) {
    for (const p of scatter(rand, 16, [40, 180, 320, 280])) {
      out += stroke(handLine(rand, p, [p[0] + jit(rand, 18), p[1] + jit(rand, 18)]), {
        color: ink.ink,
        width: ink.w * 0.6,
        opacity: ink.lineOpacity * 0.8,
        passes: 1,
      });
    }
  }

  // The tux opening.
  if (solid) {
    out += fill(closedSpline(wobble(rand, g.belly, wob)), ink.ground);
  } else {
    out += stroke(closedSpline(wobble(rand, g.belly, wob)), {
      color: ink.ink,
      width: ink.w * 0.5,
      opacity: ink.lineOpacity * 0.7,
      passes: 1,
    });
  }

  // Chick fluff.
  if (opts.cuerpo === "CRIA" && solid) {
    for (const p of scatter(rand, 22, [110, 180, 180, 240])) {
      out += stroke(handLine(rand, p, [p[0] + jit(rand, 12), p[1] - 8 - rand() * 10]), {
        color: ink.bleed,
        width: ink.w * 0.5,
        opacity: 0.6,
        passes: 1,
      });
    }
  }

  out += fit(opts.fit, ink, g, rand, gen);
  out += face(ink, g, rand, gen);
  out += marca(opts.marca, ink, g, rand);
  if (gen === 2) out += carga(opts.carga, ink, rand);

  return out;
}
