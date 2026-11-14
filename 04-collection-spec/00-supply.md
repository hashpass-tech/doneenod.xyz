# Supply

**Genesis: 2,369 · Hard cap: 5,922**

---

## The number

**2,369 doers.** Not 2,500, not 2,000, not 10,000.

A round number signals a marketing decision. An odd number signals a real
count. 2,369 reads as a headcount — a roster of actual people — which is what
it is supposed to be.

It is also small enough that the roster is knowable. At 10,000 you have an
audience; at 2,369 you have a block.

## Genesis breakdown — LOS FUNDADORES

| Band | Count | Token IDs | Nature |
|---|---|---|---|
| LOS FUNDADORES | 2,250 | 1 – 2250 | Fully generative genesis |
| LOS ROMPEDORES | 118 | 2251 – 2368 | Hand-finished by @plagainnvade |
| EL PRIMERO | 1 | 2369 | 1/1 — the first cube ever cracked |
| **Genesis total** | **2,369** | | |

### LOS ROMPEDORES — 118

Hand-finished. **Each breaks exactly one generator rule**, logged as a
`Ruptura` trait that exists on no other token.

| `Ruptura` | What it breaks |
|---|---|
| `QUINTO_COLOR` | A fifth colour. Only legal here. |
| `CUBO_ROTO` | The cube is broken at GEN 0 — impossible by the rules |
| `FUERA_DE_MARCO` | Bleeds off-canvas |
| `NOTA_A_MANO` | Handwritten note in the margin, Plaga's own hand |
| `DOS_PINGUS` | Two pingus in one cube |
| `INVERTIDO` | Ground and ink swapped |
| `SIN_CUERPO` | Only the cube. The pingu already left. |
| `CUBO_VACIO` | Empty cube, cracked from inside, nobody home |

118 is ~5% of genesis — meaningful, not a rounding error.

### EL PRIMERO — token 2369

The first cube that ever cracked. The one that proved it was possible.

- Permanently locked at `GEN 1 DESHIELO`. **It cannot thaw further.**
- It is the proof of concept, not a participant.
- Physical: one hand-painted panel, delivered.
- Never revealed pre-mint. Not in the lookbook.
- Signed by @plagainnvade and donedone.io.
- Cannot breed.

## Full lifecycle supply

| Gen | New | Cumulative |
|---|---|---|
| 0 — HIELO (genesis) | 2,369 | 2,369 |
| 1 — DESHIELO children | ≤ 2,369 | ≤ 4,738 |
| 2 — CORRIENTE children | ≤ 1,184 | ≤ 5,922 |
| 3 — VAPOR | 0 | 5,922 |

**Hard cap 5,922, enforced in the contract.** Breeding carries no protocol
fee, is optional, and is window-bound — so real supply will likely land *below*
the cap. See `05-breeding/00-breeding.md`.

> The collection's final size is determined by how many people actually did
> something. Publish the final number when the last window closes.

## Reserve — declared pre-mint, exact

Hiding allocation is how trust dies. Publish this table on the mint page.

| Purpose | Count | Notes |
|---|---|---|
| @plagainnvade | 60 | Artist allocation |
| donedone.io | 60 | Brand allocation |
| Collabs / gifting | 30 | |
| Archive — never sold | 12 | Permanent record |
| **Total reserved** | **162** | **6.8% of genesis** |

**Public genesis mint: 2,207**

Reserved tokens thaw under the same rules as everyone else. No exemptions, no
pre-thawed team pingus. A team pingu sitting at `GEN 0` is a feature.

## Mint mechanics

| Parameter | Value | Reason |
|---|---|---|
| Max per wallet | **3** | Doing is per-pingu work. Whales cannot thaw 50. |
| Price | TBD — single tier | No tiered pricing. Everyone starts frozen. |
| Allowlist | donedone.io customers first | Doers before collectors |
| Reveal | **Immediate** | Everyone is a cube. There is nothing to hide. |

### No delayed reveal

Every genesis pingu mints as `GEN 0 HIELO`. The cube is the point. A reveal
countdown would imply the cube is a wrapper around the real art, which inverts
the entire concept.

The reveal *is* the thaw, and the holder controls when it happens.

## What we are never doing

- Generation 4, 5, "Season 2," or any successor collection
- A token
- Open editions
- Pay-to-thaw or pay-to-breed, at any price
- Pre-thawed team allocations
- An owner-only mint function outside the cap
