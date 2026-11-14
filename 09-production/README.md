# Production

```
09-production/
├── layers/              source art, one folder per layer
│   ├── 0-cubo/
│   ├── 1-cuerpo/
│   ├── 2-estado/        per-generation body/ice states
│   ├── 3-fit/
│   ├── 4-marca/
│   ├── 5-carga/
│   └── 6-overlay/       seña
├── references/          @plagainnvade portfolio — NEEDED, see below
└── exports/             flattened renders
```

## The scale problem — read this first

```
2,369 pingus × 4 generations × up to 3 sub-states = ~28,000 renders
```

This is the largest practical risk in the project and it is not a later phase.
**All generation states must exist at mint.** That is precisely what makes the
mechanic a product rather than a promise — nothing is withheld, nothing can be
cancelled, the holder simply has not unlocked theirs yet.

Budget and schedule accordingly before committing to the mechanic.

### Reducing the render count

| Option | Saving | Cost |
|---|---|---|
| Drop sub-states, 4 renders per pingu | ~9,500 total | Art is static between milestones. Weakens the mechanic. |
| Sub-states for GEN 0–1 only | ~19,000 total | Early progress stays visible where it matters most |
| **Recommended:** sub-states on GEN 0–1, single render GEN 2–3 | ~19,000 | Best effort/impact ratio |

GEN 0 and GEN 1 need fine-grained visible progress because that is where
holders are deciding whether the system is real. By GEN 2 they are convinced.

## Layer naming

```
{layer-order}-{LAYER}/{TRAIT_KEY}__{gen}.png

0-cubo/LIMPIO__g0.png
0-cubo/LIMPIO__g1.png
1-cuerpo/ESTANDAR__g2.png
2-estado/HIELO_SOLIDO__g0.png
```

- Trait keys must match `08-tech/config/traits.json` **exactly**
- `__g{0..3}` suffix marks which generation the asset serves
- Layers absent at a generation need no asset — see `visible_gens` in config

## Canvas

| Spec | Value |
|---|---|
| Render canvas | 2048 × 2048 |
| ROMPEDORES | 4000 × 4000 |
| Colour | RGB, sRGB IEC61966-2.1 |
| Format | PNG-24, no interlace |
| Layer assets | Transparent PNG, full canvas, pre-registered |

## QA checklist — every piece

| # | Check | Fail condition |
|---|---|---|
| 1 | **48px test** | Cannot tell it is a penguin / in a cube / unimpressed |
| 2 | **Colour count** | More than 4 colours (except `QUINTO_COLOR`) |
| 3 | **Subtractive rarity** | A rare piece has *more* colours than a common one |
| 4 | **No pure black/white** | `#000000` or `#FFFFFF` present |
| 5 | **Surface** | Piece floats — no treatment, clean gradient background |
| 6 | **Face** | Smiling, open mouth, teeth, cheeks, or eyebrows |
| 7 | **Temperature arc** | Warm colour at GEN 0, or cold colour at GEN 3 |
| 8 | **Cube breaks outward** | Cracks propagate inward — the pingu must have caused it |
| 9 | **VAPOR reads as done** | See below |
| 10 | **Face survives GEN 3** | Face dissolved or absent at VAPOR |

### Check 9 — the VAPOR test

Show any GEN 3 piece to someone with no context. Ask exactly one question:

> **"What happened to this penguin?"**

| Answer | Action |
|---|---|
| "it finished" / "it's done" | **Pass** |
| "it died" / "it melted away" / "it's sad" | **Reject and redraw** |

If VAPOR reads as loss, the project becomes a climate-doom parable and the
entire thesis inverts. This check is not negotiable and cannot be rushed at
the end of the schedule.

## Blocking requirement — reference lock

**`references/` is empty and the whole art direction is unverified.**

All of `03-art-direction/` assumes @plagainnvade works in a gritty hand-pulled
street/sticker idiom. If the real portfolio is clean vector or
digital-painterly, the following must be re-cut before any layer art begins:

- `03-art-direction/00-art-direction.md` — line, surface, treatment
- `03-art-direction/02-palette.md` — may survive; the temperature arc is
  style-independent
- `04-collection-spec/01-traits.md` — trait *names* survive; execution changes

Drop portfolio samples in `references/` and flag the discrepancy before
production starts. Re-cutting the direction after 19,000 renders is not an
option.

## Order of work

1. **Reference lock** ← blocking
2. Draw the empty cube as a standalone mark. If it is not a good logo, stop.
3. Draw one pingu through all 4 generations. The full arc, one character.
4. **The first crack** (GEN 1 `GRIETA`) — draw it 20 times, pick the best.
5. **The VAPOR test piece** — validate check 9 before committing to the style.
6. Produce the 5–6 real garments *before* drawing the `FIT` layer.
7. Layer production, in `traits.json` order.
8. Batch render + automated QA on checks 2, 4, 7.
9. Manual QA on checks 1, 3, 5, 6, 8, 9, 10.
10. ROMPEDORES, hand-finished, last.
