# Tech

```
08-tech/
├── decisions/
│   ├── ADR-001-chain.md   CHAIN: Ethereum mainnet. Rationale + consequences.
│   └── 02-contract-spec.md  L1 contract: storage, breeding, thaw, tests
├── config/
│   ├── traits.json        trait manifest, weights, exclusions, bands, breeding
│   ├── generations.json   state machine, calor thresholds, hechos catalogue
│   └── palette.json       temperature arc, per-generation colour rules
├── scripts/
│   └── generate.mjs       deterministic genesis generator
└── output/                generated — gitignored
    ├── traits.json        all 2,369 fixed trait sets
    ├── rarity.json        tallies + donedone.io production runs
    └── metadata/gen{0..3}/{id}.json
```

**Chain: Ethereum mainnet** (ADR-001). Single network, no L2, no bridge.

## Run

```bash
cd 08-tech/scripts
node generate.mjs                              # defaults: seed pingus2, 2369
node generate.mjs --seed otraseed --supply 100 # test run
```

No dependencies. Node 18+.

## Verified output (seed `pingus2`)

| Check | Result |
|---|---|
| Exclusion violations | **0 / 2,369** |
| Unique trait combinations | **2,369 / 2,369** |
| `CUBO: PERFECTO` | 13 (0.5%) |
| `PALETA: SIN_COLOR` | 73 (3.1%) |
| `Ruptura` tokens | 118 (ROMPEDORES band) |
| Deface rate (`SEÑA`) | 26.4% (target ~27%) |

### Production runs — the donedone.io number

| `FIT` | Units ever made |
|---|---|
| `TEE_DONE` | 431 |
| `CARGO_WADDLE` | 324 |
| `HOODED_TUX` | 320 |
| `PUFFER` | 193 |
| `CHALECO` | 161 |
| `MONO_OBRERO` | 75 |
| **Claimable total** | **1,504** |
| `NADA` — no claim | 865 (36.5%) |

This table *is* the manufacturing order. See `06-donedone/`.

## The constraint solver

Naive sequential rule application produces illegal combinations when rules
interact — `CUERPO=FANTASMA` forces `FIT=NADA` while `MARCA=CAPUCHA` requires
a hooded garment, and whichever rule runs last wins.

`solve()` instead computes the **legal domain** of every layer given the
current selection, re-picks anything outside its domain, and iterates to a
fixed point. When a domain goes empty — the rules are mutually unsatisfiable —
it re-rolls the *constraining* trait rather than silently emitting an illegal
piece.

This is why violations are 0 and not "approximately 0."

## Determinism

`mulberry32` seeded per-token with `${SEED}:${id}`. Same seed always produces
the same collection. Publish the seed post-mint so anyone can reproduce and
verify the distribution.

---

# Contract architecture

## Chain: Ethereum mainnet — DECIDED

**ADR-001. Single network, no L2, no bridge.** Full rationale and accepted
consequences: `decisions/ADR-001-chain.md`. Implementation spec:
`decisions/02-contract-spec.md`.

Chosen for permanence, art-collector legitimacy, secondary market depth, and
zero bridge risk — for a collection whose entire thesis is completion and
whose record is meant to outlive the project.

### The two consequences that changed the design

L1 makes every storage write a real cost borne by a real person. Two parts of
the spec were re-engineered rather than merely re-priced:

**1. Thaw is pushed, never pulled.** `attestBatch` is called by donedone.io,
who pays the gas. A holder never pays to be recognised for doing something.
This is architectural: the deciding metric for the project is *% of holders
who reach GEN 1*, and if gas suppresses that number the thesis cannot be
tested.

**2. Breeding is one transaction, not two.** The partner consents via an
off-chain EIP-712 signature and pays nothing. The naive two-transaction design
would have made cross-wallet cooperation expensive and time-coordinated,
killing the best mechanic in the project.

### The cost that needs modelling before mint

`attestBatch` gas × total expected deeds over 3 years = **donedone.io's
committed L1 operating expense.** This is the direct financial consequence of
ADR-001 and it sits on top of the staffing commitment in
`02-identity/01-proof-of-doing.md`. Model it at projected volume before
finalising mint price.

## The hard problem: dynamic metadata

`generacion`, `estado`, `calor` and `hechos` are **mutable**. Traits are not.
That requires a specific architecture, and the naive version is centralised in
a way that undermines the whole premise.

### Options

| Approach | Trust model | Verdict |
|---|---|---|
| Off-chain API `tokenURI` | Fully centralised. API dies → art dies. | **Reject.** |
| On-chain `calor`, off-chain images | Calor is verifiable; images pinned on IPFS | **Recommended** |
| Fully on-chain SVG | Trustless, expensive, limits the art | Incompatible with this art direction |
| Merkle-root thaw batches | Calor updated in signed batches, auditable | **Recommended pairing** |

### Adopted (mandatory on L1)

1. **All 4 generations' images pinned to IPFS/Arweave at mint.** Nothing is
   generated later. Immutable CIDs, published pre-mint.
2. **`calor` stored on-chain** per token — packed into a single 32-byte slot
   with flags, lineage and deed count.
3. **Thaw updates via Merkle batch** — donedone.io publishes a root plus the
   full ledger; anyone can verify any grant. On L1 this is not a preference,
   it is the only affordable path.
4. **`tokenURI` resolves on-chain** from `calor` → generation → pre-pinned CID.
5. **Traits are not stored on-chain** — they never change. One immutable
   `TRAITS_ROOT` hash commits to the published manifest.
6. **`generacion` and `estado` are computed, not stored** — pure functions of
   `calor` against immutable thresholds.

The art is immutable. Only the *pointer* moves, and it moves by a rule anyone
can check.

### Be honest about the trust model

`hecho` verification is centralised. It cannot not be — someone has to judge
whether you shipped a thing. Say so publicly rather than implying
decentralisation. The mitigation is the **public ledger**, including
rejections. See `02-identity/01-proof-of-doing.md`.

## Contract requirements

| Requirement | Reason |
|---|---|
| Hard cap 5,922, immutable | No mint path beyond it |
| **No owner-only mint function** | If one exists, the cap is a suggestion and the story is a lie |
| **No fee setter** | `EL ENCUENTRO` protocol cost is 0 and cannot be changed |
| `hasBred` per token | One encuentro per pingu, lifetime |
| Generation gate on `encuentro()` | Only `generacion == 2` |
| Two-party consent, **one transaction** | Partner signs off-chain (EIP-712), pays no gas |
| Window enforcement by immutable timestamp | Not admin-toggleable |
| **No GEN 3 breed path** | Function must not exist, not merely be disabled |
| Immutable calor thresholds | Hardcoded constants. A settable threshold makes the state machine a suggestion. |
| `linaje` write-once | Immutable at birth |
| `calor` monotonically increasing | You cannot un-do something you did |
| Token 2369 gen-locked at 1 | EL PRIMERO cannot thaw or breed |
| `hechos` attributed to original wallet | Transfer policy C — see `02-identity/` |
| Attestor is a multisig | Not a single EOA |
| `freezeMetadata()` one-way | Called publicly at launch, irreversible |

Full implementation with Solidity, storage layout and a 17-case test matrix:
`decisions/02-contract-spec.md`.

## Open decisions

| # | Decision | Status |
|---|---|---|
| 1 | ~~Chain~~ | **CLOSED — Ethereum mainnet, ADR-001** |
| 2 | ERC-721A vs. ERC-721 + consecutive-id optimisation | Open — gas-model both |
| 3 | **Calor thresholds** in `generations.json` are proposals | **Must lock pre-mint, never change** |
| 4 | Thaw batch cadence — weekly vs. on-demand at 50+ deeds | Open |
| 5 | Audit budget and auditor selection | Open — mandatory on L1 |
| 6 | `attestBatch` 3-year gas budget | **Open — model before mint price** |
| 7 | Render pipeline, ~19–28k images | Open — see `09-production/` |
