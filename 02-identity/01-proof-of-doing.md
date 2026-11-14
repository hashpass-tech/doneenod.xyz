# Proof of Doing

> **This is the hardest design problem in the project and the most likely
> point of failure.** Everything else is art and math. This is governance.
>
> Status: **DRAFT — requires decision from donedone.io before mint.**

---

## The requirement

A `hecho` must be:

1. **Verifiable** — someone or something can confirm it happened
2. **Not purchasable** — money alone can never produce one
3. **Not time-based** — holding for 90 days is not doing anything
4. **Legible** — a holder knows in advance how to earn one
5. **Finite in effort** — not a grind loop

Rule 2 is the one that will be under constant commercial pressure. Protect it.

---

## Three models

### Model A — Closed verification (donedone.io attests)

donedone.io maintains the list of qualifying acts and signs attestations.

**Pros:** full control, launch-ready, no new infrastructure
**Cons:** fully centralised, trust-dependent, staff cost forever
**Verdict:** the realistic launch model. Must be paired with a public ledger.

### Model B — Open contribution (community attests)

Holders submit evidence; a council or peer vote confirms.

**Pros:** scales, decentralises, builds culture
**Cons:** collusion, drama, slow, becomes a political body
**Verdict:** possible at GEN 2+, not at launch. Do not start here.

### Model C — Automated proof (on-chain / API)

Only acts a machine can verify. Purchases, GitHub commits, Strava runs,
verified check-ins.

**Pros:** trustless, cheap, instant
**Cons:** the only thing easy to verify is *spending money*, which violates
rule 2 and quietly turns the project into a loyalty program
**Verdict:** dangerous. Use sparingly, and never for purchases.

### Recommendation

**Launch with A. Automate pieces of it with C where C does not mean spending.
Open to B only after GEN 2 exists.** Publish the full ledger from day one.

---

## The gas guarantee — non-negotiable

Genesis is on Ethereum mainnet (`08-tech/decisions/ADR-001-chain.md`), so this
has to be stated as a rule rather than left implicit:

> **A holder never pays gas to be recognised for doing something.**

`calor` updates are **pushed** by donedone.io in Merkle batches, never pulled
by the holder. No `hecho` in the catalogue below requires an on-chain
transaction from the person who earned it.

The reason is measurement, not generosity. The deciding metric for this entire
project is *% of holders who reach GEN 1*. If any part of non-thaw is "gas was
too expensive," that number stops testing the thesis and starts testing the
gas price. donedone.io absorbs the cost so the metric stays honest.

The only `hecho` involving a holder transaction is `ENCUENTRO`, and that is
because breeding mints a token — the gas is for the mint, not for the
recognition.

## Draft `hecho` catalogue

Weights feed `calor`. Thresholds in `03-art-direction/01-states.md`.

### Peso 1 — entry

| `hecho` | Description | Verification |
|---|---|---|
| `PRIMER_DESHIELO` | Claim your pingu and set a public intent | Automated — **no holder tx** |
| `PRESENTADO` | Introduce yourself and what you do | Manual, one-time |
| `ETIQUETADO` | Your pingu is your public avatar for 30 days | Semi-automated |

### Peso 2 — participation

| `hecho` | Description | Verification |
|---|---|---|
| `ENCUENTRO` | Breed with another pingu (GEN 2 only) | Automated, on-chain |
| `COLABORA` | Make something *with* another holder | Manual |
| `TALLER` | Attend a donedone.io workshop / IRL event | Check-in |
| `VESTIDO` | Wear a claimed garment, in public, documented | Manual |

### Peso 3 — real work

| `hecho` | Description | Verification |
|---|---|---|
| `OBRA_ENTREGADA` | Ship a thing you made. Anything. Publicly. | Manual review |
| `ENSEÑADO` | Teach a skill to the community, documented | Manual |
| `TRAIDO` | Bring in a new doer who themselves completes a `hecho` | Semi-automated |

### Peso 5 — rare

| `hecho` | Description | Verification |
|---|---|---|
| `OBRA_MAYOR` | A significant body of work, reviewed and accepted | Council |
| `CICLO` | Take a pingu all the way to VAPOR | Automated |

### Explicitly NOT a `hecho`

- Buying anything, at any price
- Holding for any duration
- Joining a Discord
- Owning multiple pingus
- Liking, retweeting, following
- Referring someone who does nothing

---

## Anti-gaming

| Attack | Defence |
|---|---|
| Sybil / fake deeds | Manual review on peso 3+, rate limits on peso 1–2 |
| Buying a thawed pingu to look like a doer | `hechos` are attributed to the original wallet, permanently |
| Low-effort spam submissions | Cooldown: max one `hecho` per pingu per 14 days |
| Whales thawing 50 pingus | Deeds are per-pingu and require per-pingu work; one person cannot do 50x the work |
| Insider favouritism | Public ledger, published criteria, appeals process |

## The ledger

Non-negotiable. Publish, publicly and permanently:

- Every `hecho` granted: token, wallet, type, date, verifier
- Every `hecho` **rejected**, with reason
- Every criteria change, with date

Rejections matter more than approvals. A thaw ledger showing only approvals is
not a ledger, it is a press release.

## Decisions needed from donedone.io

1. Who verifies? Named person or team?
2. What is the review SLA? (Recommend: 14 days, published.)
3. What is the appeals process?
4. Final `hecho` list and weights — the draft above is a starting point
5. **Hard commitment: can you staff this for 3+ years?** If no, cut the
   mechanic now and ship static.
6. **Can you fund the L1 gas for 3+ years of `attestBatch`?** Mainnet means
   every thaw batch is a real expense on top of the staffing cost. Model it at
   projected deed volume before mint. If the answer is no, the options are:
   raise `calor` cost per generation (fewer, heavier deeds), lengthen batch
   cadence, or revisit ADR-001.

The two commitments in 5 and 6 are the same decision viewed from different
budgets. A thaw mechanic that stops being verified — or stops being written to
chain — is worse than never having shipped one.
