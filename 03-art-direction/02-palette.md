# Palette — The Temperature Arc

Palette is a **function of generation**, not a free choice.
Machine-readable source: `08-tech/config/palette.json`.

---

## Core — all generations

```
NEGRO DONE       #111111   rgb(17,17,17)       ink, line, tux. Never pure #000.
HUESO            #EDE6D6   rgb(237,230,214)    primary ground
PERIODICO        #D8D2C4   rgb(216,210,196)    aged ground (XEROX)
CONCRETO         #6E6E68   rgb(110,110,104)    bleed, shadow
```

## The arc

```
GEN 0 ──────────── GEN 1 ──────────── GEN 2 ──────────── GEN 3
cold               warming            hot                spent

CIAN HIELO         CIAN + warm        full warm          almost nothing
#7FD4E8            two-tone           #FF5A1F etc        2 colours
4 colours          4 colours          3–4 colours        2 colours
```

### GEN 0 — HIELO · cold

```
CIAN HIELO       #7FD4E8   rgb(127,212,232)    the ice. dominant.
AZUL FRIO        #4A90A8   rgb(74,144,168)     fracture lines, depth
```
Accent is always cold. No warm colour may appear at GEN 0.

### GEN 1 — DESHIELO · warming

The only generation where cold and warm coexist. The tension is the point.

```
CIAN HIELO       #7FD4E8   retreating — surviving ice only
+ one warm accent at low saturation:
AMBAR            #E8A33D   rgb(232,163,61)     first heat
```

### GEN 2 — CORRIENTE · hot

Full saturation. One warm accent per piece, never two.

| Name | Hex | Weight |
|---|---|---|
| `NARANJA DONE` | `#FF5A1F` | 380 — common, the brand accent |
| `LIMA BIO` | `#C8FF00` | 250 |
| `AMBAR` | `#E8A33D` | 220 |
| `ROJO AVISO` | `#D1202A` | 100 — rare |
| `SIN COLOR` | — | 50 — **rarest**, 2-colour |

### GEN 3 — VAPOR · spent

```
Ink + ground only. 2 colours.
Line at 30–50% opacity.
Optional: faintest trace of the pingu's GEN 2 accent, ≤15% opacity.
```

**The most earned state is the most minimal artwork.** The reward for
finishing is less, not more.

---

## Legal combinations

| # | Composition | Where |
|---|---|---|
| 4 | ink + ground + accent + bleed | GEN 0–2 standard |
| 3 | ink + ground + accent | GEN 2 elevated |
| 2 | ink + ground | **GEN 3, and the rarest GEN 2** |

**Illegal:** two accents in one piece · five colours · any gradient between
two named colours · pure `#000000` · pure `#FFFFFF` · any warm colour at
GEN 0 · any cold colour at GEN 3.

## Why not pure black and white

`#000000` on `#FFFFFF` reads as digital. The collection is pretending to be
printed. `#111111` on `#EDE6D6` reads as ink on paper. This matters more than
it sounds like it does.

## Overprint (RISO)

Accent over black **multiplies** — it does not sit on top. Offset the accent
channel 2px on a random axis per piece. The misregistration is the point.

## donedone.io brand alignment

`NARANJA DONE #FF5A1F` is proposed as the shared accent across NFT and
garment. **Needs confirmation** against donedone.io's actual brand palette —
if they have an existing primary, substitute it here and re-weight.
