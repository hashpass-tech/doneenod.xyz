/**
 * The state machine. `generacion` and `estado` are pure functions of `calor`,
 * exactly as in the contract — storing them would let them drift.
 */
import { GENERATIONS, traitDef } from "./config.ts";
import { bandFor } from "./traits.ts";
import type { EstadoDef, GenerationDef, Pingu, PinguState } from "./types.ts";

export const MAX_CALOR_DISPLAY = 21;

export function generationFor(calor: number): GenerationDef {
  // Mirrors the contract: descending threshold checks.
  for (let i = GENERATIONS.length - 1; i >= 0; i--) {
    const g = GENERATIONS[i] as GenerationDef;
    if (calor >= g.calor_min) return g;
  }
  return GENERATIONS[0] as GenerationDef;
}

export function estadoFor(calor: number): { estado: EstadoDef; index: number } {
  const gen = generationFor(calor);

  let localIndex = gen.estados.length - 1;
  for (let i = 0; i < gen.estados.length; i++) {
    const e = gen.estados[i] as EstadoDef;
    const [lo, hi] = e.calor;
    if (calor >= lo && (hi === null || calor <= hi)) {
      localIndex = i;
      break;
    }
  }

  return {
    estado: gen.estados[localIndex] as EstadoDef,
    // Matches the contract's uint8 estado(): gen * 3 + sub-state
    index: gen.gen * 3 + localIndex,
  };
}

/** Resolve the full earned state for a pingu at a given calor. */
export function stateFor(pingu: Pingu, calor: number, hechos = 0): PinguState {
  const band = bandFor(pingu.id);
  const locked = band.locked_gen !== undefined && band.locked_gen !== null;

  // EL PRIMERO: permanently GEN 1 regardless of calor.
  const effective = locked
    ? (GENERATIONS[band.locked_gen as number] as GenerationDef)
    : generationFor(calor);

  const { estado, index } = locked
    ? { estado: effective.estados[0] as EstadoDef, index: effective.gen * 3 }
    : estadoFor(calor);

  const fit = traitDef("FIT", pingu.traits.FIT);
  const claimable = fit?.claimable === true;

  return {
    calor,
    generacion: effective.gen,
    gen: effective,
    estado,
    estadoIndex: index,
    hechos,
    can_breed: effective.can_breed && !locked && band.can_breed !== false,
    can_claim: effective.can_claim && claimable,
    locked,
  };
}

/** calor needed to reach the next generation, or null at terminal. */
export function calorToNextGen(calor: number): number | null {
  const current = generationFor(calor);
  const next = GENERATIONS[current.gen + 1];
  if (!next) return null;
  return next.calor_min - calor;
}

/** 0..1 progress through the whole arc, for scroll and progress UI. */
export function thawProgress(calor: number): number {
  return Math.max(0, Math.min(1, calor / MAX_CALOR_DISPLAY));
}

export { GENERATIONS };
