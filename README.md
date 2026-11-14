# PINGUS²

### @plagainnvade × donedone.io

> 2,369 pingus are born frozen in ice. You thaw yours by doing things.

**Concept v0.2** · genesis 2,369 · hard cap 5,922 · **Ethereum mainnet** ·
no token, no roadmap

---

## The system in one diagram

```
GEN 0          GEN 1          GEN 2          GEN 3
HIELO    →     DESHIELO  →    CORRIENTE  →   VAPOR
NACE           CALIENTA       HACE           HECHO

frozen         cracking       flowing        done
cube           first crack    free, wet      outline, rising
───────────────────────────────────────────────────────────
no claim       sizing opens   CLAIM + BREED  terminal
calor 0–2      calor 3–7      calor 8–14     calor 15+

2,369     →    +2,369    →    +1,184    →    +0
                                              ↑
                              gas doesn't breed. it finishes.
```

**Three ideas, one mechanic:** the ice cube is potential · doing melts it ·
melting is visible · visible progress is identity.

---

## The three load-bearing decisions

### 1. `(pingus)²` had to be fixed

Raw squaring gives 5.6M tokens. Even ×2 per generation gives 35,535 — which
destroys the meaning of "2,369 doers."

The fix was already in the concept: **the water cycle ends in evaporation.**
Supply expands, converges, then stops. The cap is a consequence of the story,
so it cannot be lobbied away later. → `05-breeding/`

### 2. Money buys the outfit. Doing buys the state.

`FIT` is the only purchasable layer. `generacion`, `estado` and `calor` are
earned, never sold. If those ever mix, this is a loyalty program with extra
steps. → `02-identity/`

### 3. You can buy a finished pingu. You cannot buy having finished it.

Thawed state transfers with the token — the art earned it. But every `hecho`
is permanently attributed to the wallet that did it. → `02-identity/00-done-identity.md`

---

## Chain: Ethereum mainnet

Single network, no L2, no bridge. Chosen for permanence, art-collector
legitimacy, secondary depth, and zero bridge risk — for a collection whose
thesis is completion and whose record should outlive the project.
→ `08-tech/decisions/ADR-001-chain.md`

L1 made two parts of the design require re-engineering, not just re-pricing:

| | |
|---|---|
| **Thaw is pushed, never pulled** | donedone.io pays the gas on batch attestation. **A holder never pays to be recognised for doing something** — otherwise gas contaminates the one metric that tests the thesis. |
| **Breeding is one transaction** | Partner consents via off-chain EIP-712 signature and pays nothing. Two on-chain transactions would have killed cross-wallet cooperation. |

Protocol fee for `EL ENCUENTRO` is **0, permanently** — there is no fee setter
in the contract. The network charges gas; we charge nothing. The copy says
*"no cobramos nada,"* never "free."

**The cost this creates:** `attestBatch` gas × 3 years of deeds is
donedone.io's committed L1 operating expense. Model it before setting mint
price. → `08-tech/decisions/02-contract-spec.md`

---

## Folders

The repo is two halves. `01-`…`09-` are the **spec** — prose, decisions, and
the JSON configs that are the single source of truth. `apps/` and `packages/`
are the **software** that implements it, as a pnpm + Turborepo workspace.

| Folder | Contents |
|---|---|
| `apps/web/` | The landing page and the mint app → [`apps/web/README.md`](apps/web/README.md) |
| `packages/core/` | Trait engine. Bit-identical port of `08-tech/scripts/generate.mjs` |
| `packages/pingu-render/` | Procedural SVG renderer — every pingu at every calor |
| `packages/contracts/` | `Pingus2.sol` + Hardhat suite (30 tests) |
| `01-concept/` | Brief, lore, positioning |
| `02-identity/` | DONE identity system, **proof-of-doing** (the hard part) |
| `03-art-direction/` | Visual rules, the 4 generation states, temperature palette |
| `04-collection-spec/` | Supply, bands, reserve, full trait manifest |
| `05-breeding/` | `(pingus)²` resolved — el encuentro, windows, convergence |
| `06-donedone/` | Phygital layer, claim mechanics |
| `07-launch/` | 4-act launch plan, voice & copy |
| `08-tech/` | **Working generator**, configs, ADR-001 chain decision, L1 contract spec |
| `09-production/` | Layer structure, QA checklist, the render scale problem |

### Start here

1. `01-concept/00-brief.md` — the whole thing in one read
2. `05-breeding/00-breeding.md` — why the math works
3. `02-identity/01-proof-of-doing.md` — **the biggest unsolved problem**

---

## Running the workspace

Node 22 and pnpm 9. One install at the root covers every package.

```bash
pnpm install
pnpm dev           # site on :5173, hot reload
pnpm build         # everything, in dependency order
pnpm test          # core parity + renderer + contracts
pnpm typecheck
```

`08-tech/config/*.json` is the source of truth; `packages/core/src/config/` is
a generated TypeScript mirror of it. Edit the JSON, then:

```bash
pnpm --filter @pingus/core run sync:config    # regenerate
pnpm --filter @pingus/core run check:config   # CI's drift gate
```

Versions are managed by [`@edcalderon/versioning`](https://www.npmjs.com/package/@edcalderon/versioning),
which syncs every workspace manifest, writes the changelog from conventional
commits, commits and tags in one step:

```bash
pnpm version:status      # what would change
pnpm version:patch       # or minor / major
```

### CI and deployment

Four GitHub Actions workflows, all on Node 22:

| Workflow | Does |
|---|---|
| `ci.yml` | Drift gates → typecheck → tests → contracts → site build, on every PR |
| `deploy.yml` | Builds `apps/web` and publishes to GitHub Pages on push to `main` |
| `release.yml` | Manual (`workflow_dispatch`) version bump, changelog, tag — with a dry-run option |
| `dependabot.yml` | Weekly dependency PRs |

Pages needs two things set in repo settings before the first deploy:
**Settings → Pages → Source = "GitHub Actions"**, and the repository
*variables* `VITE_CONTRACT_ADDRESS` and `VITE_CHAIN_ID`. Until the contract
address is set, the mint app runs in demo mode — see
[`apps/web/README.md`](apps/web/README.md).

---

## The generator runs

```bash
node 08-tech/scripts/generate.mjs     # the reference implementation
pnpm --filter @pingus/core test       # proves the port still matches it
```

No dependencies, Node 18+. Deterministic. Verified on seed `pingus2`:

| Check | Result |
|---|---|
| Exclusion violations | **0 / 2,369** |
| Unique trait combinations | **2,369 / 2,369** |
| Deface rate (`SEÑA`) | 26.4% |
| `CUBO: PERFECTO` | 13 (0.5%) |
| `PALETA: SIN_COLOR` | 73 (3.1%) |

### It also outputs the manufacturing order

Because trait count = production run:

| `FIT` | Units ever made |
|---|---|
| `TEE_DONE` | 431 |
| `CARGO_WADDLE` | 324 |
| `HOODED_TUX` | 320 |
| `PUFFER` | 193 |
| `CHALECO` | 161 |
| `MONO_OBRERO` | 75 |
| **Claimable** | **1,504** |
| `NADA` — claims nothing | 865 (36.5%) |

---

## Blocking issues — honest status

| # | Issue | Owner | Severity |
|---|---|---|---|
| 1 | **No @plagainnvade references.** All art direction is assumed and may need a full re-cut. | Art | **Critical** |
| 2 | **Proof-of-doing undecided.** If thaw criteria are weak or purchasable, the project fails. | donedone.io | **Critical** |
| 3 | **~19,000 renders required at mint.** Not scheduled or budgeted. | Production | **High** |
| 4 | ~~Chain not chosen~~ → **CLOSED: Ethereum mainnet (ADR-001)** | Tech | Closed |
| 4b | **`attestBatch` 3-year gas budget unmodelled.** Direct consequence of L1. | donedone.io | **High** |
| 5 | donedone.io garment range unconfirmed — decides whether `FIT` can carry the identity layer. | donedone.io | Medium |
| 6 | Calor thresholds are proposals. Must be locked pre-mint and never changed. | All | Medium |
| 7 | Audit budget + auditor not selected. Mandatory on L1. | Tech | Medium |
| 8 | `NARANJA_DONE #FF5A1F` is a guess at donedone.io's brand primary. | Brand | Low |

### The one that decides everything

**Issue 2.** The mechanic only works if thawing is real. If `GEN 1` becomes
something you get by holding 30 days or joining a Discord, this is a skin on a
static collection and the audience will know within a week.

This also means donedone.io must staff a verification function for 3+ years.
**If that cannot be committed, cut the dynamic mechanic and ship a static
collection.** Half-implemented is the only version that fails outright.

---

## Non-negotiables

1. Generation is earned, never purchased. No pay-to-thaw, at any price.
2. Never cute. No smiles, no cheeks, no teeth.
3. Max 4 colours. **Rarity is subtractive** — the rarest pieces have fewest.
4. Melting means progress, not catastrophe. VAPOR = completion, never death.
5. The cube is the brand mark. It must be beautiful empty.
6. No generation 4. No Season 2. No successor collection.
7. No owner-only mint function. The cap is real or the story is a lie.
8. A holder never pays gas to be recognised for doing something.

```
el vapor no se reproduce.
el vapor terminó.
```
