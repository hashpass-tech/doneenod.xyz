# Your Pingu Is Your DONE Identity

> "DONE is a brand for doers."
> Then the collection cannot be a picture you bought. It has to be a record of
> what you did.

---

## The thesis

Most brand NFTs are **membership cards** — identical, static, proof you paid.

A pingu is the opposite: a **public résumé** that happens to be a penguin.
Two holders who bought on the same day at the same price can own visibly
different art a year later, because one of them did things.

| Membership card | DONE identity |
|---|---|
| Proves you paid | Proves you did |
| Identical across holders | Diverges over time |
| Static forever | Changes state |
| Value from floor price | Value from your own history |
| Transfer = same card | Transfer = see below |

---

## The identity stack

A pingu carries four things, and only one of them is cosmetic:

```
┌─────────────────────────────────────────────┐
│  GENERATION    how far you've gotten        │  earned
│  ESTADO        the visible state of the ice │  earned, derived
│  HECHOS        the log of what you did      │  earned, permanent
│  FIT           what it's wearing            │  cosmetic + phygital
└─────────────────────────────────────────────┘
```

**GENERATION** — `HIELO → DESHIELO → CORRIENTE → VAPOR`. The headline.
**ESTADO** — the fine-grained melt within a generation. Visible progress
between milestones, so the art is never static for long.
**HECHOS** — *deeds.* An append-only list of what this specific pingu's holder
accomplished. This is the résumé.
**FIT** — the donedone.io garment. The only purchasable layer, and
deliberately so: it changes how you look, never how far you've gotten.

That separation is load-bearing. **Money buys the outfit. Doing buys the
state.** If those ever mix, the project is a loyalty program with extra steps.

---

## HECHOS — the deed log

Each pingu has a permanent, append-only record:

```json
{
  "token_id": 1138,
  "generation": 2,
  "estado": "CORRIENTE_MEDIA",
  "hechos": [
    { "n": 1, "fecha": "2026-03-04", "hecho": "PRIMER_DESHIELO",  "peso": 1 },
    { "n": 2, "fecha": "2026-04-11", "hecho": "OBRA_ENTREGADA",   "peso": 3 },
    { "n": 3, "fecha": "2026-06-02", "hecho": "ENCUENTRO",        "peso": 2 }
  ],
  "calor": 6
}
```

- `hechos` never shrink. You cannot un-do something you did.
- `calor` (heat) is the sum of weights. Heat drives state.
- The log is public. That is the entire point of an identity.

---

## The transfer problem — and the decision

**The question:** if you sell a thawed pingu, does the buyer inherit your work?

Three options, honestly assessed:

| Option | Behaviour | Problem |
|---|---|---|
| **A — Heat transfers** | Buyer gets your `GEN 2` pingu as-is | Thaw becomes a tradeable commodity. Doing becomes purchasable. Kills the thesis. |
| **B — Full reset** | Pingu refreezes to `GEN 0` on transfer | Honest but brutal. Destroys secondary market entirely. |
| **C — Heat stays, deeds are attributed** | Art keeps its state; `hechos` permanently credit the original doer | Slightly complex to explain |

### Decision: C.

The pingu keeps its melted state — the art earned that. But each `hecho` is
permanently stamped with **who did it.** A buyer of a `GEN 3 VAPOR` pingu owns
a finished pingu whose log reads, visibly and forever, *someone else finished
this.*

```
HECHOS
  1. PRIMER_DESHIELO    0x7a3f…  (original)
  2. OBRA_ENTREGADA     0x7a3f…  (original)
  3. ENCUENTRO          0x7a3f…  (original)
  —— transferido ——
  4. (vacío)
```

You can buy a finished pingu. You cannot buy having finished it. That
asymmetry is the most interesting thing in the project and it should be stated
loudly, not buried in docs.

---

## What this gives donedone.io

1. **A customer record that customers want to display.** Nobody screenshots a
   loyalty tier. People screenshot a PFP.
2. **A reason to re-engage that isn't a discount email.** The pingu is the
   reminder. It sits unfinished in your profile.
3. **Segmentation that is honest.** `GEN 3` holders are genuinely your most
   active customers, verifiably, on-chain.
4. **A brand claim that is falsifiable.** "A brand for doers" is a slogan
   until the doing is logged. Then it's a fact.

## What it costs donedone.io

Be clear-eyed: this requires **operating a verification process indefinitely.**
Someone has to decide what counts as a `hecho` and attest to it. That is staff
time, forever. A collection with a thaw mechanic that stops being verified is
worse than a static collection.

If donedone.io cannot commit to that operationally, cut the mechanic and ship
a static collection instead. Half-implemented is the only outcome that fails.
