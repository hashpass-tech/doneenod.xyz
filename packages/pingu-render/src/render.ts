/**
 * Compose one pingu at one calor into a standalone SVG string.
 *
 * Deterministic in (id, generation): the same token always renders the same
 * artwork, so the browser can derive all four generations of all 2,369 tokens
 * with no image assets at all.
 */
import {
  type Pingu,
  resolvePalette,
  rng,
  stateFor,
  SEED,
} from "@pingus/core";
import { n } from "./geom.ts";
import { type Cuerpo, type Ink, drawPingu } from "./pingu.ts";
import { cubo, fondo, sena, vapor, water, wetGround } from "./scene.ts";
import { type Treatment, treatment, warpDefs } from "./treatments.ts";

export const CANVAS = 1000;

export interface RenderOptions {
  /** Earned heat. Decides generation and sub-state. */
  calor?: number;
  /** Rendered pixel size. The viewBox is always 1000. */
  size?: number;
  /** Unique id for filter/pattern defs — required if several SVGs share a DOM. */
  uid?: string;
  seed?: string;
  /** Skip grain/dust. Much cheaper — use for dense grids. */
  plain?: boolean;
  /** Extra attributes on the root <svg>. */
  attrs?: string;
  title?: string;
}

/** How much of the frame the pingu occupies, per generation and cube. */
function layout(gen: number, cuboKey: string): { scale: number; bottom: number } {
  if (gen >= 3) {
    // Subject ~60%, with deliberate empty space ABOVE — never below.
    return { scale: 1.12, bottom: 884 };
  }
  if (gen === 2) {
    // The pingu occupies ~70% of the frame. Hero generation.
    return { scale: 1.32, bottom: 828 };
  }
  // GEN 0–1: the cube occupies ~70%, the pingu sits inside it.
  const factor =
    cuboKey === "JUSTO"
      ? 1.12
      : cuboKey === "GRUESO"
        ? 0.68
        : cuboKey === "PERFECTO"
          ? 0.94
          : 0.9;
  return { scale: factor, bottom: 816 };
}

export function renderPingu(pingu: Pingu, options: RenderOptions = {}): string {
  const calor = options.calor ?? 0;
  const size = options.size ?? CANVAS;
  const seed = options.seed ?? SEED;
  const uid = options.uid ?? `p${pingu.id}g${calor}`;

  const state = stateFor(pingu, calor);
  const gen = state.generacion;
  const t = pingu.traits;

  const pal = resolvePalette(t.PALETA, gen, t.TRATAMIENTO);
  const trat = t.TRATAMIENTO as Treatment;

  // Seeded per (token, generation): each generation is a different artwork of
  // the same pingu, which is exactly what the state spec asks for.
  const rand = rng(`${seed}:${pingu.id}:g${gen}:e${state.estadoIndex}`);

  const ink: Ink = {
    ink: pal.ink,
    ground: pal.ground,
    accent: pal.accent,
    cold: pal.cold,
    bleed: pal.bleed,
    lineOpacity: pal.lineOpacity,
    outlineOnly: gen === 3 || t.CUERPO === "FANTASMA",
    w: 8,
  };

  const { scale, bottom } = layout(gen, t.CUBO);
  const cube = cubo(t.CUBO, gen, state.estadoIndex, ink, rand);

  // Local pingu box is 400 × 520, anchored bottom-centre on the canvas.
  const px = CANVAS / 2 - 200 * scale;
  const py = bottom - 520 * scale;
  const pinguSvg = drawPingu({
    cuerpo: t.CUERPO as Cuerpo,
    marca: t.MARCA,
    fit: t.FIT,
    carga: t.CARGA,
    gen,
    ink,
    rand,
  });

  // ---- assemble the artwork (everything except ground + treatment) ----
  let art = "";
  art += fondo(t.FONDO, ink, rand);
  art += cube.back;

  const lean = gen === 2 ? " rotate(-2.5 500 828)" : "";

  // VAPOR dissolves upward from the feet — the head is last and clearest.
  // This is an alpha mask on one ink, not a gradient between two colours.
  const dissolveId = `diss-${uid}`;
  const dissolve =
    gen === 3
      ? ` mask="url(#${dissolveId})"`
      : "";

  art +=
    `<g transform="translate(${n(px)},${n(py)}) scale(${n(scale)})"${dissolve}>` +
    pinguSvg +
    `</g>`;

  art += cube.front;

  if (gen === 2) art += water(state.estadoIndex, ink, rand);
  else if (gen === 3) art += vapor(state.estadoIndex, ink, rand);
  else art += wetGround(gen, state.estadoIndex, ink, rand);

  // At VAPOR everything thins out together — a full-strength stamp over a
  // dissolving pingu would read as damage rather than completion.
  const senaSvg = sena(t.SENA, ink, rand);
  art +=
    gen === 3 && senaSvg
      ? `<g opacity="${n(pal.lineOpacity)}">${senaSvg}</g>`
      : senaSvg;

  // TORCIDO leans the whole cube; GEN 2 leans into the stride.
  const rotate = cube.rotate
    ? ` rotate(${n(cube.rotate)} 500 520)`
    : lean;
  const artGroup = rotate ? `<g transform="${rotate.trim()}">${art}</g>` : art;

  // ---- treatment ----
  const layers = options.plain
    ? { defs: "", filter: "", overlay: "", registration: [0, 0] as const }
    : treatment(uid, trat, rand, ink.ink);
  let defs = options.plain ? "" : warpDefs(uid, trat, rand) + layers.defs;

  if (gen === 3) {
    // VAPOR_BAJO: feet gone. VAPOR_ALTO: only chest and head. HECHO: faintest.
    const hold = state.estadoIndex >= 11 ? 0.28 : state.estadoIndex >= 10 ? 0.44 : 0.66;
    defs +=
      `<linearGradient id="dg-${uid}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="#fff" stop-opacity="1"/>` +
      `<stop offset="${n(hold * 100)}%" stop-color="#fff" stop-opacity="0.92"/>` +
      `<stop offset="100%" stop-color="#fff" stop-opacity="0.04"/>` +
      `</linearGradient>` +
      `<mask id="diss-${uid}"><rect width="${CANVAS}" height="${CANVAS}" fill="url(#dg-${uid})"/></mask>`;
  }

  // RISO: the accent channel misregisters by ~2px and multiplies. Approximated
  // by multiplying an offset, accent-recoloured copy of the artwork over it.
  let registration = "";
  const [rx, ry] = layers.registration;
  if ((rx || ry) && pal.accent) {
    const recoloured = artGroup.split(ink.ink).join(pal.accent);
    registration =
      `<g transform="translate(${n(rx)},${n(ry)})" opacity="0.42" ` +
      `style="mix-blend-mode:multiply">${recoloured}</g>`;
  }

  // GEN 3 keeps the faintest trace of its GEN 2 accent — carried by the rising
  // vapour itself, never as a wash over the paper. The reward for finishing is
  // less, not more.
  const ghost = "";

  const title = options.title ?? `Pingu #${pingu.id} — ${state.gen.key}`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" ` +
    `width="${n(size)}" height="${n(size)}" role="img" aria-label="${escapeAttr(title)}"` +
    (options.attrs ? ` ${options.attrs}` : "") +
    `>` +
    (defs ? `<defs>${defs}</defs>` : "") +
    // The piece is printed ON something — it never floats.
    `<rect width="${CANVAS}" height="${CANVAS}" fill="${pal.ground}"/>` +
    (layers.filter ? `<g ${layers.filter}>` : "<g>") +
    artGroup +
    registration +
    `</g>` +
    ghost +
    layers.overlay +
    `</svg>`
  );
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Data URI — for <img src>, downloads and og:image generation. */
export function pinguDataUri(pingu: Pingu, options: RenderOptions = {}): string {
  const svg = renderPingu(pingu, options);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** All four generations of one pingu — the thaw strip. */
export function renderStrip(
  pingu: Pingu,
  options: RenderOptions = {}
): { gen: number; calor: number; svg: string }[] {
  return [0, 3, 8, 15].map((calor, gen) => ({
    gen,
    calor,
    svg: renderPingu(pingu, { ...options, calor, uid: `${options.uid ?? pingu.id}-g${gen}` }),
  }));
}
