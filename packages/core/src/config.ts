import traitsJson from "./config/traits.ts";
import paletteJson from "./config/palette.ts";
import generationsJson from "./config/generations.ts";

import type { GenerationDef, LayerKey } from "./types.ts";

export interface TraitDef {
  key: string;
  weight: number;
  desc?: string;
  garment?: string | null;
  claimable?: boolean | string;
}

export interface LayerDef {
  order?: number;
  key: string;
  label: string;
  visible_gens?: number[];
  note?: string;
  derived?: boolean;
  traits: TraitDef[];
}

export interface ExclusionRule {
  if: Record<string, string>;
  force?: Record<string, string>;
  deny?: Record<string, string[]>;
  allow_only?: Record<string, string[]>;
  reason: string;
}

export interface BandDef {
  key: string;
  count: number;
  ids: [number, number];
  nature: string;
  exclusive_trait?: string;
  locked_gen?: number;
  can_breed?: boolean;
}

export interface TraitsConfig {
  genesis_supply: number;
  hard_cap: number;
  canvas: number;
  layers: LayerDef[];
  post_process: LayerDef[];
  exclusions: ExclusionRule[];
  bands: BandDef[];
  rupturas: string[];
  reserve: Record<string, number | string>;
  mint: Record<string, unknown>;
  breeding: Record<string, unknown>;
  chain: Record<string, unknown>;
}

export const TRAITS = traitsJson as unknown as TraitsConfig;
export const PALETTE = paletteJson as unknown as PaletteConfig;

export interface ColorDef {
  hex: string | null;
  rgb: [number, number, number] | null;
  role?: string;
  weight?: number;
  colors?: number;
  rarest?: boolean;
}

export interface PaletteConfig {
  hard_limit: number;
  core: Record<string, ColorDef>;
  cold: Record<string, ColorDef>;
  warm: Record<string, ColorDef>;
  generation_rules: Record<
    string,
    {
      name: string;
      accent_pool: string;
      dominant?: string;
      secondary?: string;
      colors: number | number[];
      warm_allowed?: boolean;
      cold_allowed?: boolean;
      line_opacity?: [number, number];
      ghost_accent_max_opacity?: number;
    }
  >;
  illegal: string[];
}

export const GENERATIONS = (
  generationsJson as unknown as { generations: GenerationDef[] }
).generations;

export const GENESIS_SUPPLY = TRAITS.genesis_supply;
export const HARD_CAP = TRAITS.hard_cap;
export const SEED = "pingus2";

/** Layer order is the draw order — index 0 paints first. */
export const LAYER_ORDER: LayerKey[] = [
  "CUBO",
  "CUERPO",
  "FIT",
  "MARCA",
  "CARGA",
  "FONDO",
  "SENA",
  "TRATAMIENTO",
  "PALETA",
];

export const ALL_KEYS: string[] = [
  ...TRAITS.layers.map((l) => l.key),
  ...TRAITS.post_process.map((p) => p.key),
];

export function layerByKey(key: string): LayerDef {
  const found =
    TRAITS.layers.find((l) => l.key === key) ??
    TRAITS.post_process.find((p) => p.key === key);
  if (!found) throw new Error(`unknown layer: ${key}`);
  return found;
}

export function traitDef(layer: string, key: string): TraitDef | undefined {
  return layerByKey(layer).traits.find((t) => t.key === key);
}

/** Total weight for a layer — denominator for published rarity. */
export function layerWeight(key: string): number {
  return layerByKey(key).traits.reduce((s, t) => s + t.weight, 0);
}
