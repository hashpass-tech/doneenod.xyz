export type LayerKey =
  | "CUBO"
  | "CUERPO"
  | "FIT"
  | "MARCA"
  | "CARGA"
  | "FONDO"
  | "SENA"
  | "TRATAMIENTO"
  | "PALETA";

export type BandKey = "FUNDADORES" | "ROMPEDORES" | "PRIMERO";

/** Traits are fixed at birth. Nothing here ever changes. */
export type TraitSet = Record<LayerKey, string> & { Ruptura?: string };

export interface Pingu {
  id: number;
  band: BandKey;
  traits: TraitSet;
}

export type GenKey = "HIELO" | "DESHIELO" | "CORRIENTE" | "VAPOR";

export interface GenerationDef {
  gen: 0 | 1 | 2 | 3;
  key: GenKey;
  label: string;
  /** NACE · CALIENTA · HACE · HECHO */
  word: string;
  calor_min: number;
  calor_max: number | null;
  can_breed: boolean;
  can_claim: boolean;
  estados: EstadoDef[];
}

export interface EstadoDef {
  key: string;
  calor: [number, number | null];
  change: string;
}

/** The earned half of a pingu's identity. Never purchasable. */
export interface PinguState {
  calor: number;
  generacion: 0 | 1 | 2 | 3;
  gen: GenerationDef;
  estado: EstadoDef;
  /** Index 0..11 — matches the contract's `estado()` return. */
  estadoIndex: number;
  hechos: number;
  can_breed: boolean;
  can_claim: boolean;
  /** EL PRIMERO is pinned to GEN 1 forever. */
  locked: boolean;
}

export interface TraitTallyEntry {
  value: string;
  count: number;
  /** Share of genesis supply, 0..1 */
  share: number;
}

export interface LayerMeta {
  key: LayerKey;
  label: string;
  visible_gens: number[];
  traits: { key: string; weight: number; desc?: string }[];
}
