# Trait Manifest

Seven layers. Machine-readable source: `08-tech/config/traits.json`.

**Traits are fixed at birth. Generation is earned.** A pingu's traits never
change — only its generation, estado, and calor do. This separation is
absolute: generative randomness decides what you look like, your own actions
decide how far along you are.

---

## Layer stack

| # | Layer | Spanish | Question | Visible at |
|---|---|---|---|---|
| 0 | CUBO | *cubo* | What shape was the ice? | GEN 0–1 |
| 1 | CUERPO | *cuerpo* | The base pingu | all |
| 2 | FIT | *fit* | Which donedone.io garment? | GEN 1–2 |
| 3 | MARCA | *marca* | What's on its head? | GEN 1–3 |
| 4 | CARGA | *carga* | What is it holding? | GEN 2 only |
| 5 | FONDO | *fondo* | Where is it? | all |
| 6 | SEÑA | *seña* | The overlay / mark | all |

Plus two post-process traits: `TRATAMIENTO` (surface) and `PALETA` (derived).

---

## Layer 0 — CUBO

8 variants. The cube it was born in. **The brand mark.**
Visible at GEN 0–1; recorded in metadata forever.

| Trait | Weight | Notes |
|---|---|---|
| `LIMPIO` — Clean | 300 | Pristine, 2 internal fractures |
| `GRUESO` — Thick | 200 | Oversized cube, pingu small inside it |
| `JUSTO` — Tight | 170 | Cube barely contains the pingu |
| `TURBIO` — Cloudy | 140 | Milky ice, pingu half-obscured |
| `BURBUJAS` — Bubbled | 100 | Air pockets suspended in the ice |
| `ASTILLADO` — Chipped | 60 | Already damaged at birth |
| `TORCIDO` — Skewed | 25 | Visibly off-axis, leaning |
| `PERFECTO` — Perfect | 5 | **Rarest.** A true square. Unnatural. |

> `PERFECTO` is rare *because* it is perfect — in a hand-drawn collection, the
> machine-precise cube is the anomaly.

## Layer 1 — CUERPO

6 variants. Deliberately few — the body is a uniform. That is the joke.

| Trait | Weight | Notes |
|---|---|---|
| `ESTANDAR` | 400 | The classic tux |
| `FLACO` | 180 | Taller, narrower |
| `GORDO` | 180 | Wider, lower, immovable |
| `PELADO` | 120 | Mid-moult, ragged edges |
| `CRIA` | 90 | Chick. Grey fluff. Still does not smile. |
| `FANTASMA` | 30 | Outline only, no fill |

## Layer 2 — FIT  ← the donedone.io layer

**Trait count = production run.** If 180 pingus wear the vest, donedone.io
makes 180 vests, ever. See `06-donedone/`.

Fully visible only at GEN 2 — plan the lookbook there.

| Trait | Weight | Real garment | Claimable |
|---|---|---|---|
| `NADA` | 500 | — | No |
| `TEE DONE` | 300 | DONE box-logo tee | **Yes** |
| `CARGO WADDLE` | 220 | Cargo waddle pant | **Yes** |
| `HOODED TUX` | 180 | Hooded tux crew | **Yes** |
| `PUFFER` | 140 | Puffer shell | **Yes** |
| `CHALECO` | 100 | Hi-vis reflective vest | **Yes** |
| `MONO OBRERO` | 60 | Work coverall *(stretch)* | TBD |

> `NADA` at 500 is intentional. If everyone is dressed, clothing stops being a
> signal. The bare tux is the control group.

## Layer 3 — MARCA

11 variants. Wear and work, not accessories.

| Trait | Weight | Notes |
|---|---|---|
| `LIMPIO` | 330 | Nothing. Just the face. |
| `BANDANA` | 150 | Pulled up over the beak |
| `RESPIRADOR` | 130 | Industrial half-mask |
| `GORRO CUBO` | 120 | Bucket hat, worn low |
| `GORRA NATACION` | 100 | Swim cap. Absurd. Nobody comments. |
| `PICO PARTIDO` | 80 | Chipped beak, healed badly |
| `PARCHE` | 70 | Taped gauze patch |
| `CASCO` | 60 | Hard hat |
| `CAPUCHA` | 50 | Hood up, face in shadow |
| `ANTIPARRAS` | 40 | Goggles pushed up on the forehead |
| `VENDADO` | 15 | Head wrapped. Only the eyes. |

## Layer 4 — CARGA

11 variants. **GEN 2 only** — you cannot hold things inside a cube.

| Trait | Weight | Notes |
|---|---|---|
| `VACIO` | 340 | Flippers hang |
| `LATA` | 170 | Spray can. Core prop. |
| `MARTILLO` | 140 | Hammer. The doer's tool. |
| `CAJON` | 110 | Crate |
| `SARDINA` | 95 | Half-eaten, unbothered |
| `ROLO` | 80 | Paint roller on an extension pole |
| `LLAVE` | 70 | Oversized pipe wrench |
| `CUADERNO` | 55 | Notebook, open, written in |
| `RADIO` | 40 | Boombox. Off. Never playing. |
| `CONO` | 30 | Traffic cone, carried like a trophy |
| `ASTILLA` | 10 | **A shard of its own cube.** Kept it. |

> `ASTILLA` is the sentimental trait. It kept a piece of where it started.

## Layer 5 — FONDO

12 variants. Changes meaning by generation — same backdrop, dry at GEN 0, wet
at GEN 2.

| Trait | Weight | Notes |
|---|---|---|
| `VACIO` | 200 | Nothing. Bone ground. |
| `MUELLE` | 160 | Loading dock, corrugated shutter |
| `TALLER` | 150 | Workshop — pegboard, tools on hooks |
| `TUNEL` | 130 | Subway tile, grime in the grout |
| `ANDAMIO` | 110 | Scaffolding mesh, pipe silhouettes |
| `OBRA` | 95 | Construction site |
| `PERSIANA` | 85 | Rolling shutter, tagged |
| `BALDOSA` | 70 | Sidewalk tile, top-down |
| `AZOTEA` | 50 | Rooftop, sky as flat bone |
| `CAMARA FRIA` | 35 | Cold room. Where the cubes were found. |
| `HIELO SUCIO` | 25 | Dirty floe. The old home. |
| `SIN FONDO` | 10 | Pure void. Rarest. |

## Layer 6 — SEÑA (overlay) — the signature layer

**This layer can deface the artwork itself.** Carried over from the PLAGA
concept — it is the thing people screenshot.

| Trait | Weight | Defaces? | Notes |
|---|---|---|---|
| `NINGUNA` | 420 | — | Clean composite |
| `ESQUINAS` | 180 | No | Die-cut stickers crowd the frame edges |
| `TAG PARED` | 160 | No | Tag on the background, behind the subject |
| `SELLO HECHO` | 90 | **Yes** | `HECHO` stamped across the piece |
| `TAG PECHO` | 80 | **Yes** | Sprayed across its own chest |
| `GOTEO` | 50 | **Yes** | Paint/water runs down over everything |
| `CENSURADO` | 30 | **Yes** | Black bar across the eyes |
| `TACHADO` | 20 | **Yes** | A single X over the whole piece |
| `FECHA` | 10 | **Yes** | A date hand-written over the art |

**Defacing total: 280/1040 ≈ 27%.** High enough to be a known feature, low
enough that clean still feels default.

## TRATAMIENTO — post-process

| Trait | Weight | Note |
|---|---|---|
| `SERIGRAFIA` | 280 | |
| `RISO` | 250 | |
| `CONCRETO` | 200 | |
| `XEROX` | 170 | |
| `PAPEL_MOJADO` | 100 | **GEN 2 renders only** |

## PALETA — derived, not drawn

Computed. Exposed as metadata so the subtractive rarity rule is visible.
Resolves differently per generation — see `03-art-direction/02-palette.md`.

| Accent (GEN 2 value) | Weight | Colours |
|---|---|---|
| `NARANJA DONE` | 380 | 4 |
| `LIMA BIO` | 250 | 4 |
| `AMBAR` | 220 | 4 |
| `ROJO AVISO` | 100 | 3 |
| `SIN COLOR` | 50 | **2 — rarest** |

---

## Combinatorics

```
CUBO 8 × CUERPO 6 × FIT 7 × MARCA 11 × CARGA 11 × FONDO 12 × SEÑA 9
  × TRATAMIENTO 5 × PALETA 5
= 8 × 6 × 7 × 11 × 11 × 12 × 9 × 5 × 5
= 109,771,200 theoretical combinations
```

Against 2,369 genesis: **0.002% fill rate.** No forced duplicates, genuine
uniqueness, without needing 300 traits.

## Exclusion rules

Enforced in `08-tech/scripts/generate.mjs`.

| Rule | Reason |
|---|---|
| `CUERPO=FANTASMA` → `FIT=NADA` | An outline cannot wear clothes |
| `CUERPO=FANTASMA` → `CARGA=VACIO` | An outline cannot hold things |
| `CUERPO=CRIA` → no `PUFFER`, no `MONO OBRERO` | Chick doesn't fit adult sizes |
| `MARCA=VENDADO` → no `RESPIRADOR`/`BANDANA`/`ANTIPARRAS` | One head slot |
| `MARCA=CAPUCHA` → `FIT` ∈ {`HOODED TUX`,`PUFFER`} | A hood needs a hood |
| `SEÑA=CENSURADO` → `MARCA≠VENDADO` | Eyes already covered |
| `PALETA=SIN COLOR` → `FONDO≠OBRA` | Barrier is defined by its orange |
| `PALETA=SIN COLOR` → `FIT≠CHALECO` | Hi-vis is defined by its colour |
| `TRATAMIENTO=RISO` → `PALETA≠SIN COLOR` | Riso needs 2 channels to misregister |
| `FONDO=SIN FONDO` → `SEÑA≠TAG PARED` | No wall to tag |
| `CUBO=PERFECTO` → `CUBO≠ASTILLADO` | Mutually exclusive by definition |
| `CARGA=ASTILLA` → `CUBO≠PERFECTO` | A perfect cube leaves no shard |

## Band-exclusive traits

| Trait | Present on | Purpose |
|---|---|---|
| `Ruptura` | ROMPEDORES only (2251–2368) | Makes the band on-chain queryable |
| `Linaje` | Bred pingus only | Genesis carries `null`, permanently distinct |
| `Generacion`, `Estado`, `Calor`, `Hechos` | All | **Mutable.** Earned, not generated. |
