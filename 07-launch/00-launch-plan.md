# Launch Plan

Four acts, mapped to the four generations. The collection's own state machine
is the marketing calendar — which means the campaign cannot be faked or rushed.

---

## ACT 0 — NACE · pre-mint

**Goal:** establish the cube as a mark before anyone knows it is an NFT.

| Action | Note |
|---|---|
| Sticker packs in **every** donedone.io order | Starts now, no announcement. The cube appears in the world first. |
| Cube-only posts | No pingu visible. Just the mark. No text. |
| Produce the 5–6 garments | They must exist before they are drawn |
| Shoot the lookbook at GEN 2 | The only generation where `FIT` reads fully |
| Publish the full trait + reserve tables | Including the 36.5% that claim nothing |
| Lock calor thresholds | Publicly, permanently |

**Deliberately withheld:** EL PRIMERO, the ROMPEDORES, and any VAPOR artwork.

### The pre-mint disclosure page

Non-negotiable. One page, plain language:

1. `FIT = NADA` is 36.5% of the collection and claims nothing
2. Claims require GEN 2, which requires doing things
3. Thaw verification is centralised; here is the ledger and the criteria
4. Reserve is 162 of 2,369 (6.8%), itemised
5. Hard cap 5,922, enforced in the contract
6. There is no token, no staking, no roadmap, and no generation 4
7. **Chain is Ethereum mainnet. Here is what gas will cost you** — see below

Publishing the unflattering numbers yourself is the cheapest trust you will
ever buy.

### The gas disclosure

Per `08-tech/decisions/ADR-001-chain.md`, genesis is on L1. That has real
consequences for holders and they get stated upfront, not discovered at
signing:

| Action | Who pays gas | Note |
|---|---|---|
| Minting | Holder | Published estimate; mint in a low-fee window |
| **Thawing** | **donedone.io** | **A holder never pays to be recognised for doing something.** |
| `EL ENCUENTRO` | Initiator, one tx | Partner pays nothing — off-chain signature |
| Claiming a garment | Holder | Plus shipping |

The second row is the important one and it is architectural, not generous.
Thaw is pushed in batches by donedone.io because the deciding metric for this
whole project is *% of holders who reach GEN 1* — and if gas suppresses that
number, the metric is contaminated and the thesis cannot be tested.

Say plainly: **we charge nothing for breeding and nothing for thawing. The
network charges gas on mainnet. Here are the numbers.**

---

## ACT I — mint

| Parameter | Value |
|---|---|
| **Chain** | **Ethereum mainnet** — ADR-001 |
| Supply | 2,369 (2,207 public) |
| Max per wallet | 3 |
| Allowlist | donedone.io customers first — doers before collectors |
| Reveal | **Immediate.** Everyone is a cube. |
| Price | Single tier, TBD — must account for L1 gas on top |
| Timing | Target a low-gas window. Do not mint into a congestion spike. |

### No reveal countdown

Every pingu mints as `GEN 0 HIELO`. A delayed reveal would imply the cube is a
wrapper around the real art, which inverts the concept.

**The reveal is the thaw, and the holder controls when it happens.**

### Mint-day copy

```
2.369 pingus. todos congelados.

ninguno está terminado.
eso es tu problema ahora.
```

---

## ACT II — CALIENTA · the first thaw

**The single most important moment in the project.** The first crack is the
proof the mechanic is real.

| Action | Note |
|---|---|
| `PRIMER_DESHIELO` opens | Set a public intent → peso 1 |
| First GEN 1 is announced publicly | Named holder, named deed. Not anonymous. |
| Garment sizing registration opens | Forecast without committing production |
| Publish the thaw ledger | Approvals **and rejections**, with reasons |
| `CALIENTA` garment drops | Second word in the product line |

### The risk to manage here

If thawing looks like a Discord grind or a hold-timer, the project is dead
within a week and the audience will say so out loud. The first ten `hechos`
granted set the standard for everything after. Grant them for real work, make
the reasoning public, and reject liberally.

---

## ACT III — HACE · the current

GEN 2 arrives: garments claimable, breeding opens, the lookbook becomes real.

| Action | Note |
|---|---|
| **Claims unlock** at GEN 2 | 90-day window, shipping-only cost |
| `VENTANA I` opens | At 25% GEN 1. No fee, cross-wallet, 90 days. |
| Publish real production runs | The actual number made, per garment |
| IRL `TALLER` events | peso 2 — check-in verified |
| `HACE` garment drops | |

### The breeding story

Two different people cooperating to make a third pingu — with no advantage to
owning both parents, and the partner paying nothing at all. That is the
headline, not "breeding is live." A social act with an artifact as output.

`VENTANA II` follows 30 days after `VENTANA I` closes. Then breeding is
**permanently over.**

---

## ACT IV — HECHO · completion

| Action | Note |
|---|---|
| First VAPOR announced | The first pingu to finish |
| `HECHO` garment unlocks | **Only** once the first VAPOR exists |
| VAPOR artwork revealed publicly | Held back until this moment |
| Publish the final supply number | The true size of the collection |
| Close the last claim window | Unclaimed units are never produced |

### The closing statement

When the last window shuts, publish the real numbers: how many thawed, how
many finished, how many garments exist, how many pingus were born. Then stop.

```
el vapor no se reproduce.
el vapor terminó.
```

**No Season 2. No generation 4. No successor collection.** Saying no here is
the product.

---

## Channel strategy

| Channel | Role |
|---|---|
| **Physical stickers** | Primary acquisition. Costs nothing, spreads offline, perfectly on-concept. |
| donedone.io customer base | Allowlist. Doers before collectors. |
| @plagainnvade audience | Art credibility. The ROMPEDORES are for them. |
| Public thaw ledger | Trust infrastructure, not marketing |
| Discord | **One channel.** Not forty. |

### What we are not doing

- Paid influencer threads
- Giveaway/raid campaigns for allowlist
- "Floor price" talk from official accounts
- Roadmap graphics
- Countdown timers

---

## Success metrics — the honest ones

Floor price is not a success metric. These are:

| Metric | Why it matters |
|---|---|
| **% of holders who reach GEN 1** | Did anyone actually do anything? The only metric that tests the thesis. |
| `hecho` rejection rate | A ledger with no rejections is a press release |
| Cross-wallet encuentro rate | Did strangers cooperate for free? |
| Garment claim rate at GEN 2 | Does earned beat purchased? |
| % reaching VAPOR | Completion rate |
| Sticker-to-mint attribution | Does offline distribution work? |

### The number that decides everything

**% of holders who reach GEN 1.**

If that number is low, you have sold 2,369 pictures of ice cubes and the
identity thesis is wrong. Measure it at 90 days post-mint and be willing to
say so publicly if it fails.
