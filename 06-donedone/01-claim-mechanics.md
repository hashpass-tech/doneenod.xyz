# Claim Mechanics

## The gate

```
GEN 0  HIELO       →  no claim. you haven't started.
GEN 1  DESHIELO    →  no claim. sizing opens (register only).
GEN 2  CORRIENTE   →  CLAIM UNLOCKED
GEN 3  VAPOR       →  claim already taken, or expired
```

A pingu with `FIT != NADA` that reaches `GEN 2` unlocks exactly **one** claim
for exactly **one** garment: the one it is wearing.

## Flow

```
1. Pingu reaches GEN 2 CORRIENTE
2. Claim window opens — 90 days
3. Holder selects size, enters shipping
4. Claim is burned on-chain: claimed = true, permanent
5. Garment is produced in the next batch
6. Ships with sticker pack + certificate card
```

## Rules

| Rule | Value | Reason |
|---|---|---|
| Claims per pingu | **1, lifetime** | Trait count = run size. One trait, one garment. |
| Gate | `generacion >= 2` | The garment is earned |
| Claim window | 90 days from unlock | Prevents indefinite production liability |
| Cost to holder | **Shipping + L1 gas on the claim tx** | The garment itself is earned, not sold |
| Transferable | Claim right follows the token, until burned | |
| After claiming | Flag is permanent and public | No double-dipping |
| Expired claim | Unit is **never produced** | Supply shrinks. Stated upfront. |

### Unclaimed units are never made

If 158 pingus have `CHALECO` and only 90 claim in-window, **90 vests exist.**
Not 158.

donedone.io does not produce the remainder, does not sell them, does not
release them later. The real run size is determined by how many people
actually did the work.

This is the strongest version of scarcity available: the final number is
unknown until it is over, and it is set by behaviour rather than by a
marketing decision.

## Sizing

Register size at **GEN 1**, before the claim unlocks. This gives production a
forecast without committing to manufacture.

| Garment | Sizes |
|---|---|
| `TEE DONE` | XS–3XL |
| `CARGO WADDLE` | 28–40 waist |
| `HOODED TUX` | XS–3XL |
| `PUFFER` | S–2XL |
| `CHALECO` | One size |
| `MONO OBRERO` | S–2XL |

Size is editable until the claim is burned, then locked.

## Production batching

Do not produce per-claim. Batch.

| Batch | Trigger |
|---|---|
| `LOTE I` | 50 claims in a garment type, or 90 days — whichever first |
| `LOTE II+` | Same rule, repeating |
| Final batch | At the close of the last claim window |

Published lead time: **90 days from batch close to ship.** Under-promise. A
late garment on an "earned" product reads much worse than a late pre-order.

## The certificate card

Every shipment includes a card, letterpressed or risograph, carrying:

```
PINGU #1138
GEN 2 · CORRIENTE
CHALECO · 1 of 90

HECHOS
  1  PRIMER_DESHIELO    2026-03-04
  2  OBRA_ENTREGADA     2026-04-11
  3  ENCUENTRO          2026-06-02

hecho por  0x7a3f…
```

The card prints **the holder's own deed log.** It is not a certificate of
authenticity — it is a receipt for work. That is the artifact people keep.

## Edge cases

| Case | Resolution |
|---|---|
| Token sold mid-window | Claim right transfers, window does not reset |
| `FIT = NADA` | No claim, ever. **865 tokens / 36.5%.** Clearly stated pre-mint. |
| Pingu reaches GEN 3 unclaimed, in-window | Claim stays open until the window closes |
| Pingu reaches GEN 3, window expired | No claim. Permanent. |
| Bred child with a claimable `FIT` | Full claim right — children are real pingus |
| `MONO OBRERO` never produced | Those holders get choice of any other garment. **Decide pre-mint.** |
| Garment type sells out of fabric | Cannot happen — run size is known before cutting |

## Pre-mint disclosures — non-negotiable

Publish before mint, on the mint page:

1. `FIT = NADA` is **36.5%** of the collection and claims nothing
2. Claims require GEN 2 — which requires doing things
3. The claim window is 90 days and expires permanently
4. Unclaimed units are never produced
5. Shipping is paid by the holder; the garment is not
6. **The claim is an L1 transaction — the holder pays gas.** Published estimate.
7. Estimated lead time: 90 days from batch close

Anything undisclosed here becomes a complaint thread later.

### Where gas lands, and where it doesn't

Genesis is on Ethereum mainnet (`08-tech/decisions/ADR-001-chain.md`). Be
precise about who pays what:

| Action | Gas payer |
|---|---|
| **Thawing** (earning `calor`) | **donedone.io.** A holder never pays to be recognised for doing something. |
| Claiming a garment | Holder — it is a state-changing claim on a physical good |
| `EL ENCUENTRO` | Initiator only; partner pays nothing |

The split is deliberate. Recognition is free because it is the metric that
tests the whole thesis. Redeeming a physical object is a transaction, and
treating it like one is honest.
