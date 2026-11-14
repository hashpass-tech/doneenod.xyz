/**
 * TRATAMIENTO — every piece is printed *on* something, never floating.
 * Grain, dust and registration error are mandatory.
 *
 * Each treatment contributes three things: filter defs, a filter attribute
 * applied to the artwork group, and an overlay painted on top.
 */
import type { Rand } from "@pingus/core";
import { circle, n, scatter } from "./geom.ts";

export type Treatment =
  | "SERIGRAFIA"
  | "RISO"
  | "XEROX"
  | "CONCRETO"
  | "PAPEL_MOJADO";

export interface TreatmentLayers {
  defs: string;
  /** Applied to the artwork group. */
  filter: string;
  /** Painted over the artwork. */
  overlay: string;
  /** Accent channel offset, in px — RISO misregistration. */
  registration: readonly [number, number];
}

const SIZE = 1000;

function grainFilter(id: string, freq: number, octaves: number): string {
  return (
    `<filter id="${id}" x="0" y="0" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" stitchTiles="stitch" result="n"/>` +
    `<feColorMatrix in="n" type="saturate" values="0"/>` +
    `</filter>`
  );
}

/** Displacement — buckles the whole image. Wet paper and photocopier drift. */
function warpFilter(id: string, freq: number, scale: number, seed: number): string {
  return (
    `<filter id="${id}" x="-6%" y="-6%" width="112%" height="112%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="w"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="w" scale="${n(scale)}" xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter>`
  );
}

export function treatment(
  uid: string,
  key: Treatment,
  rand: Rand,
  ink: string
): TreatmentLayers {

  switch (key) {
    // Screenprint on fabric. Visible weave, ink sitting on top of threads.
    case "SERIGRAFIA": {
      const gid = `g-${uid}`;
      const weave = `weave-${uid}`;
      return {
        defs:
          grainFilter(gid, 0.9, 3) +
          `<pattern id="${weave}" width="4" height="4" patternUnits="userSpaceOnUse">` +
          `<rect width="4" height="4" fill="none"/>` +
          `<path d="M0,0H4M0,2H4" stroke="${ink}" stroke-width="0.5" opacity="0.5"/>` +
          `<path d="M0,0V4M2,0V4" stroke="${ink}" stroke-width="0.5" opacity="0.28"/>` +
          `</pattern>`,
        filter: `filter="url(#${warpId(uid)})"`,
        overlay:
          `<rect width="${SIZE}" height="${SIZE}" fill="url(#${weave})" opacity="0.2" style="mix-blend-mode:multiply"/>` +
          `<rect width="${SIZE}" height="${SIZE}" filter="url(#${gid})" opacity="0.1" style="mix-blend-mode:multiply"/>`,
        registration: [0, 0],
      };
    }

    // Risograph. The accent channel misregisters by ~2px and multiplies.
    case "RISO": {
      const gid = `g-${uid}`;
      const ang = rand() * Math.PI * 2;
      return {
        defs: grainFilter(gid, 0.65, 2),
        filter: "",
        overlay: `<rect width="${SIZE}" height="${SIZE}" filter="url(#${gid})" opacity="0.14" style="mix-blend-mode:multiply"/>`,
        // 2px offset on a random axis — the misregistration is the point.
        registration: [Math.cos(ang) * 2.2, Math.sin(ang) * 2.2],
      };
    }

    // 3rd-generation photocopy. Blown blacks, dust specks, drift.
    case "XEROX": {
      const gid = `g-${uid}`;
      const dust = scatter(rand, 90, [0, 0, SIZE, SIZE])
        .map((p) => circle(p, rand() * 1.9 + 0.4, ink, 0.5 + rand() * 0.4))
        .join("");
      const hairs = Array.from({ length: 5 }, () => {
        const x = rand() * SIZE;
        const y = rand() * SIZE;
        return `<path d="M${n(x)},${n(y)}q${n(rand() * 30 - 15)},${n(rand() * 22)} ${n(rand() * 46 - 23)},${n(rand() * 34)}" stroke="${ink}" stroke-width="0.9" fill="none" opacity="0.4"/>`;
      }).join("");
      return {
        defs: grainFilter(gid, 1.1, 4),
        filter: `filter="url(#${warpId(uid)})"`,
        overlay:
          dust +
          hairs +
          `<rect width="${SIZE}" height="${SIZE}" filter="url(#${gid})" opacity="0.17" style="mix-blend-mode:multiply"/>`,
        registration: [0.8, -0.6],
      };
    }

    // Spray over raw concrete. Overspray haze at the edges.
    case "CONCRETO": {
      const gid = `g-${uid}`;
      const hid = `haze-${uid}`;
      const spray = scatter(rand, 220, [0, 0, SIZE, SIZE])
        .map((p) => {
          // Density rises towards the edges — that is where overspray lands.
          const edge =
            Math.min(p[0], p[1], SIZE - p[0], SIZE - p[1]) / (SIZE / 2);
          if (rand() < edge * 0.85) return "";
          return circle(p, rand() * 2.6 + 0.5, ink, 0.1 + rand() * 0.3);
        })
        .join("");
      return {
        defs:
          grainFilter(gid, 0.4, 5) +
          `<radialGradient id="${hid}"><stop offset="55%" stop-color="${ink}" stop-opacity="0"/><stop offset="100%" stop-color="${ink}" stop-opacity="0.2"/></radialGradient>`,
        filter: "",
        overlay:
          spray +
          `<rect width="${SIZE}" height="${SIZE}" fill="url(#${hid})" style="mix-blend-mode:multiply"/>` +
          `<rect width="${SIZE}" height="${SIZE}" filter="url(#${gid})" opacity="0.2" style="mix-blend-mode:multiply"/>`,
        registration: [0, 0],
      };
    }

    // Wet paper. Buckled, bled edges. GEN 2 only.
    case "PAPEL_MOJADO": {
      const gid = `g-${uid}`;
      const bleed = scatter(rand, 16, [40, 40, SIZE - 80, SIZE - 80])
        .map((p) => circle(p, rand() * 26 + 8, ink, 0.05 + rand() * 0.07))
        .join("");
      return {
        defs: grainFilter(gid, 0.3, 2),
        filter: `filter="url(#${warpId(uid)})"`,
        overlay:
          bleed +
          `<rect width="${SIZE}" height="${SIZE}" filter="url(#${gid})" opacity="0.12" style="mix-blend-mode:multiply"/>`,
        registration: [1.2, 1.2],
      };
    }
  }
}

export function warpId(uid: string): string {
  return `warp-${uid}`;
}

/** Warp strength per treatment — wet paper buckles most, riso not at all. */
export function warpDefs(uid: string, key: Treatment, rand: Rand): string {
  const cfg: Record<Treatment, [number, number]> = {
    SERIGRAFIA: [0.014, 3],
    RISO: [0.01, 1.5],
    XEROX: [0.02, 5],
    CONCRETO: [0.012, 2],
    PAPEL_MOJADO: [0.009, 11],
  };
  const [freq, scale] = cfg[key];
  // Seeded per token so two pieces on the same sheet buckle differently.
  const seed = Math.floor(rand() * 9999);
  return warpFilter(warpId(uid), freq, scale, seed);
}
