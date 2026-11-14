# The Four Generations — Visual & State Spec

The water cycle, drawn. Each generation is a different artwork for the same
pingu, resolved by its `calor`.

---

## State machine

```
         calor 0            calor 3           calor 8          calor 15
            │                  │                 │                 │
            ▼                  ▼                 ▼                 ▼
    ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
    │    GEN 0      │→ │    GEN 1      │→ │    GEN 2      │→ │    GEN 3      │
    │    HIELO      │  │   DESHIELO    │  │   CORRIENTE   │  │    VAPOR      │
    │   born        │  │   warming     │  │   doing       │  │    DONE       │
    └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘
      solid              cracking            liquid              gas
      can't breed        can't breed         CAN BREED           can't breed
```

Thresholds are proposals. Lock before mint; never change after.

---

## GEN 0 — HIELO  `calor 0–2`

**The pingu is fully encased in a solid cube.**

| Element | Direction |
|---|---|
| Cube | Hard-edged, imperfect hand-drawn rectangle. Not a perfect square. |
| Ice interior | 2–3 internal fracture lines, drawn as pure line, no shading |
| Pingu | Visible through the ice, slightly reduced contrast. Eyes open. |
| Pose | Dead still. Flippers flat against the body. |
| Face | Unimpressed. Waiting, not suffering. |
| Edges | Cold condensation ticks on the outside of the cube |
| Palette | Coldest. `CIAN HIELO` accent dominant. |
| Ground | Minimal — the cube sits on nothing in particular |

**Critical:** GEN 0 must be **genuinely desirable on its own.** Most holders
will never thaw. If the cube reads as a placeholder or a loot box, the
collection looks broken at scale. The cube is the brand mark — treat it as the
hero image, not the "before" photo.

**Sub-states** (visible progress without a generation change):

| `estado` | calor | Change |
|---|---|---|
| `HIELO_SOLIDO` | 0 | Pristine cube, no marks |
| `HIELO_SUDADO` | 1 | Condensation beads, a wet ring underneath |
| `HIELO_TENSO` | 2 | One new internal fracture. Something is about to happen. |

---

## GEN 1 — DESHIELO  `calor 3–7`

**The cube cracks. From the inside.**

| Element | Direction |
|---|---|
| Cube | A corner is gone. A real fracture runs through it. |
| Breakage | Cracks propagate *outward from the pingu* — it caused this |
| Pingu | Partially free. One flipper out. Full contrast restored where exposed. |
| Pose | First movement. A shoulder turn. Still not dramatic. |
| Water | Beads on the outside, first drip forming below |
| Palette | `CIAN HIELO` retreating, first warm accent appears |
| Ground | A small wet patch |

**The first crack is the single most important image in the collection.** It is
the proof the mechanic is real. Draw it 20 times and pick the best one.

**Sub-states:**

| `estado` | calor | Change |
|---|---|---|
| `GRIETA` | 3 | One hairline fracture. Nothing else. |
| `ESQUINA_IDA` | 4–5 | A corner has broken off and lies beside the cube |
| `MEDIO_LIBRE` | 6–7 | Upper body out of the ice, lower half still encased |

---

## GEN 2 — CORRIENTE  `calor 8–14`

**No cube. Water, and it is moving.**

| Element | Direction |
|---|---|
| Cube | Gone. Optionally one small surviving shard nearby. |
| Water | Shallow moving water, drawn as directional line only, no fill |
| Pingu | Fully free, standing in it, wet. Highest contrast of any generation. |
| Pose | **The only generation with real movement.** Mid-stride, leaning. |
| Face | Still unimpressed. Now unimpressed *while busy.* |
| `FIT` | **Garments are only fully visible here.** Peak apparel moment. |
| Palette | Warmest. Full accent saturation. |
| Ground | Wet surface, reflections as broken line |

This is the **hero generation** for marketing and the only one that can breed.
It is also where the donedone.io garments read best — plan the lookbook here.

**Sub-states:**

| `estado` | calor | Change |
|---|---|---|
| `CORRIENTE_BAJA` | 8–9 | Standing in still water |
| `CORRIENTE_MEDIA` | 10–12 | Water moving, directional, pingu mid-stride |
| `CORRIENTE_ALTA` | 13–14 | Steam starting at the edges. Transition warning. |

---

## GEN 3 — VAPOR  `calor 15+`

**No cube, no water. An outline, rising.**

| Element | Direction |
|---|---|
| Pingu | Outline only. 30–50% opacity. Line, never fill. |
| Dissolution | Dissolves upward from the feet. Head is last and clearest. |
| Face | **Still visible. Still unimpressed.** Non-negotiable. |
| Pose | Settled. Standing straight. Finished, not falling. |
| Direction | Everything rises. Nothing sags, drips, or droops. |
| Palette | **Fewest colours.** Many are 2-colour. The rarest look. |
| Ground | Nothing. No water, no shadow, no surface. |

### The hardest art rule in the project

**VAPOR must read as COMPLETION, never as DEATH.**

| Do | Do not |
|---|---|
| Rising, upward lines | Sagging, falling, drooping |
| Face clear and calm | Face dissolved or absent |
| Standing straight | Slumping, kneeling, lying down |
| Warm light, thinning | Grey, cold, ashen |
| Empty space above | Empty space below |
| Reads as "graduated" | Reads as "melted away" / "lost" |

If a `GEN 3` pingu reads as sad, the project becomes a climate-doom parable
and the whole thesis inverts. Test every VAPOR piece on someone with no
context and ask one question: *"what happened to this penguin?"* If the answer
is "it died" or "it melted," reject the piece.

Target answer: **"it finished."**

**Sub-states:**

| `estado` | calor | Change |
|---|---|---|
| `VAPOR_BAJO` | 15–17 | Feet gone, body translucent |
| `VAPOR_ALTO` | 18–20 | Only chest and head remain |
| `HECHO` | 21+ | Faintest line. Face still readable. Terminal state. |

---

## Metadata exposure

```json
{
  "attributes": [
    { "trait_type": "Generacion", "value": "2 — CORRIENTE" },
    { "trait_type": "Estado",     "value": "CORRIENTE_MEDIA" },
    { "trait_type": "Calor",      "value": 11, "display_type": "number" },
    { "trait_type": "Hechos",     "value": 3,  "display_type": "number" }
  ]
}
```

## Production implication

Every pingu needs **4 generation artworks × up to 3 sub-states = up to 12
renders.** At 2,369 genesis that is ~28,000 images.

This is not optional and it is not a later phase. All states must exist at
mint — that is what makes this a product rather than a promise. Budget the
render pipeline accordingly; see `09-production/`.
