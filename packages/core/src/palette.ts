/**
 * Palette is a function of generation, never a free choice.
 * Cold at GEN 0, hot at GEN 2, spent at GEN 3.
 *
 * Illegal by construction here: two accents in one piece, five colours,
 * warm at GEN 0, cold at GEN 3, pure #000 / #fff.
 */
import { PALETTE } from "./config.ts";

export const INK = "#111111"; // never pure black — reads as print, not screen
export const HUESO = "#EDE6D6";
export const PERIODICO = "#D8D2C4";
export const CONCRETO = "#6E6E68";
export const CIAN_HIELO = "#7FD4E8";
export const AZUL_FRIO = "#4A90A8";
export const AMBAR = "#E8A33D";

export interface ResolvedPalette {
  ink: string;
  ground: string;
  /** The single accent. null for SIN_COLOR and all of GEN 3. */
  accent: string | null;
  /** Secondary cold tone — GEN 0/1 only. */
  cold: string | null;
  bleed: string;
  /** Count of distinct colours actually used. Hard limit 4. */
  colors: number;
  /** Line opacity — GEN 3 thins out. */
  lineOpacity: number;
  /** Faint trace of the GEN 2 accent at GEN 3, ≤0.15. */
  ghostAccent: string | null;
  ghostOpacity: number;
}

function warmHex(paleta: string): string | null {
  const warm = PALETTE.warm[paleta];
  return warm?.hex ?? null;
}

/**
 * Resolve the palette for a pingu's PALETA trait at a given generation.
 * `tratamiento` only changes the ground (XEROX ages the paper).
 */
export function resolvePalette(
  paleta: string,
  gen: number,
  tratamiento?: string
): ResolvedPalette {
  const ground = tratamiento === "XEROX" ? PERIODICO : HUESO;
  const base = {
    ink: INK,
    ground,
    bleed: CONCRETO,
    cold: null as string | null,
    accent: null as string | null,
    lineOpacity: 1,
    ghostAccent: null as string | null,
    ghostOpacity: 0,
    colors: 2,
  };

  // GEN 0 — cold only. No warm colour may appear.
  if (gen === 0) {
    return { ...base, accent: CIAN_HIELO, cold: AZUL_FRIO, colors: 4 };
  }

  // GEN 1 — the only generation where cold and warm coexist.
  if (gen === 1) {
    return { ...base, accent: CIAN_HIELO, cold: AMBAR, colors: 4 };
  }

  // GEN 2 — full saturation, one warm accent, never two.
  if (gen === 2) {
    const accent = warmHex(paleta);
    return {
      ...base,
      accent,
      cold: null,
      colors: accent ? (paleta === "ROJO_AVISO" ? 3 : 4) : 2,
    };
  }

  // GEN 3 — spent. Ink + ground. The most earned state is the most minimal.
  return {
    ...base,
    accent: null,
    cold: null,
    colors: 2,
    lineOpacity: 0.42,
    ghostAccent: warmHex(paleta),
    ghostOpacity: 0.12,
  };
}

/** Every colour a piece legally contains — used by the QA colour-count check. */
export function colorsUsed(p: ResolvedPalette): string[] {
  return [p.ink, p.ground, p.accent, p.cold, p.bleed].filter(
    (c): c is string => typeof c === "string"
  );
}

export { PALETTE };
