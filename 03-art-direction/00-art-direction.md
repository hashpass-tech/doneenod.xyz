# Art Direction

> **Assumption flag:** assumes @plagainnvade works in a gritty, hand-pulled
> street/sticker idiom. If the real portfolio is clean vector or
> digital-painterly, this document must be re-cut. Drop references in
> `09-production/references/` and flag it.

---

## 1. Line

- Thick, confident, **hand-pulled marker** line
- Variable weight — swells and thins within a single stroke
- Visible wobble. No vector smoothness. No uniform stroke width.
- First-take energy. Drawn at speed, not refined.
- Silhouette reads at **48px** while the surface rewards a 4000px zoom

**Test:** export at 48×48. If you cannot tell it is a penguin, cannot tell it
is in a cube, and cannot tell it is unimpressed — the line failed.

## 2. The cube is the brand mark

A pingu in a cube is the logo. Not a container, not packaging — **the mark.**

| Rule | Detail |
|---|---|
| Never a perfect square | Hand-drawn, slightly off-axis, imperfect corners |
| Line only | Ice is drawn with line, never fill, never gradient |
| Fracture lines | 2–3 internal, pure line, no shading |
| The pingu is visible | Reduced contrast through ice, never hidden |
| Breaks outward | All cracks propagate *from* the pingu — it caused this |

**The cube must be beautiful empty.** Draw it as a standalone mark first. If
the empty cube is not a good logo, the cube is wrong.

## 3. Surface — never float

Every piece is printed *on* something. One treatment per piece:

| Treatment | Description |
|---|---|
| `SERIGRAFIA` | Screenprint on fabric. Visible weave, ink on top of threads. |
| `RISO` | Risograph misregistration — accent offset 2px from black |
| `XEROX` | 3rd-gen photocopy. Blown blacks, dust specks. |
| `CONCRETO` | Spray over raw concrete. Overspray haze at edges. |
| `PAPEL_MOJADO` | Wet paper. Buckled, bled edges. **GEN 2 only.** |

Grain, dust and registration error are **mandatory**. A clean piece is an
off-brand piece.

## 4. Colour — the temperature arc

See `02-palette.md` for values. The governing principle:

**Palette is a function of generation.** Cold at GEN 0, hot at GEN 2, nearly
gone at GEN 3.

```
GEN 0  HIELO      cold      cyan-dominant        4 colours
GEN 1  DESHIELO   warming   cyan + first warm    4 colours
GEN 2  CORRIENTE  hot       full warm accent     3–4 colours
GEN 3  VAPOR      spent     almost nothing       2 colours
```

### The inversion rule

**Rarity is subtractive. The rarest pieces have the fewest colours.**

`GEN 3 VAPOR` is both the most earned state and the most minimal artwork. The
reward for finishing is *less*, not more. No gold tier, no holographic, no
rainbow. Enforce this in QA — it is the rule most likely to break under
deadline pressure.

Hard limit: **4 colours per piece. Never 5.** (Except `Ruptura: QUINTO_COLOR`.)

## 5. Face

- Flat, unimpressed, slightly menacing
- Eyes: **two dots and a line.** That is the whole vocabulary.
- **No smiles.** No open mouths, teeth, tongues, cheeks, eyebrows.
- Beak is a hard wedge, not a soft triangle
- **The face survives all four generations.** Even at `HECHO` the face is
  readable. This is the identity anchor.

The joke is that they are completely serious. The moment one smiles it becomes
a mascot and the project loses.

## 6. Pose by generation

| Gen | Pose |
|---|---|
| 0 HIELO | Dead still. Flippers flat to the body. Waiting, not suffering. |
| 1 DESHIELO | First movement. A shoulder turn. One flipper out. |
| 2 CORRIENTE | **The only generation with real movement.** Mid-stride, leaning. |
| 3 VAPOR | Settled. Standing straight. Finished — never falling. |

Squat, wide-footed, low centre of gravity throughout. Never heroic, never
action-posed. Slight asymmetry so it does not feel templated.

## 7. Composition

- Square canvas, subject centred
- GEN 0–1: the **cube** occupies ~70% of frame height
- GEN 2: the **pingu** occupies ~70%
- GEN 3: subject ~60%, with deliberate empty space **above** — never below

## 8. Specs

| Spec | Value |
|---|---|
| Canvas | 2048 × 2048 (render), 4000 × 4000 (ROMPEDORES) |
| Colour mode | RGB, sRGB IEC61966-2.1 |
| Format | PNG-24, no interlace |
| Thumbnail test | 48 × 48 |
| Print sibling | 300dpi CMYK derivative, separate pipeline |
| Renders per pingu | Up to 12 (4 gens × up to 3 sub-states) |

## 9. The anti-reference list

Do not look at these while drawing:
- Pudgy Penguins, Club Penguin, Happy Feet, Pingu (claymation)
- Any melting-ice climate imagery
- Anything with a gradient
- Anything rendered in 3D
- Any penguin with visible cheeks

## 10. The one rule above all others

**Melting means progress, not catastrophe.**

Every visual decision passes through this filter. A VAPOR pingu that reads as
sad, lost, dying, or dissolving inverts the entire thesis. Test on people with
no context: *"what happened to this penguin?"* Correct answer: **"it
finished."**
