# ADR-001 — Chain: Ethereum Mainnet

**Status:** ACCEPTED · decided by project owner
**Date:** 2026-11-14
**Supersedes:** blocking issue #4 in root `README.md`
**Decision:** Genesis mints on **Ethereum mainnet (L1)**. Single network. No
L2, no multichain, no bridge.

---

## Decision

PINGUS² genesis (2,369) deploys to Ethereum mainnet as ERC-721.

All subsequent generations (`EL ENCUENTRO` children, up to hard cap 5,922)
mint on the same contract on the same network.

## Rationale

| Factor | Why L1 |
|---|---|
| **Permanence** | The collection's thesis is completion. `HECHO` is terminal and the record is meant to outlive the project. L1 has the strongest credible-neutrality and longest expected survival of any option. |
| **Art-collector legitimacy** | @plagainnvade's audience and the 118 hand-finished ROMPEDORES belong where art collections are taken seriously. L1 is where that culture lives. |
| **Secondary market depth** | Deepest NFT liquidity and the most mature marketplace/royalty tooling. |
| **No bridge risk** | One network, one contract, no wrapped assets, no bridge as a dependency or a failure mode. |
| **Settlement finality** | Deed attestations are a permanent public record. They settle where nothing reorgs them. |
| **Tooling maturity** | ERC-721 / ERC-2981 / ERC-6551, largest audit pool, best indexer support. |

## Consequences — accepted

These are real costs, accepted knowingly. They are not deferred problems.

### 1. "Breeding is free" needs re-wording, not abandoning

`05-breeding/` specifies `cost: 0`. That remains true of **protocol cost** —
donedone.io charges nothing for `EL ENCUENTRO`, ever. But the holder pays L1
gas, and on a two-signature transaction that is not trivial.

**Resolution:** the protocol fee stays zero and the copy changes from "free" to
*"no cobramos nada"* — we charge nothing. Gas is disclosed pre-mint, plainly.

Additionally the write path is gas-engineered rather than naive. See
`02-contract-spec.md`. Target: a single-transaction breed, both consents
collected off-chain via EIP-712 signature, so only one party pays gas once.

### 2. Thaw updates must be batched, not per-deed

A `calor` write per `hecho` is unaffordable at any realistic volume. This was
already the recommended architecture in `08-tech/README.md`; on L1 it becomes
**mandatory**.

**Resolution:** Merkle-root batches, published on a fixed cadence. Holders
claim their thaw by submitting a proof when they choose, or the root alone is
treated as canonical by the renderer. Full spec in `02-contract-spec.md`.

### 3. Onboarding is harder, and the allowlist absorbs it

donedone.io's audience is apparel customers with low crypto literacy. L1 has
no equivalent of a one-click card onramp to a cheap network.

**Resolution:** this is an operational problem, not a contract problem. The
allowlist phase gets a walkthrough, a recommended wallet, and a published
gas-cost expectation. Mint during a low-fee window.

### 4. Gas becomes a real barrier to participation

The deciding metric for the whole project is *% of holders who reach GEN 1*.
On L1, some fraction of non-thaw is now "gas was too expensive," not "didn't
bother" — which contaminates the one number that tests the thesis.

**Resolution:** `PRIMER_DESHIELO` requires no on-chain action from the holder.
Thaw attestation is pushed by batch, not pulled by claim. The holder never
pays to be recognised for doing something. Non-negotiable.

### 5. Higher mint price floor

L1 gas plus a mint price prices out part of the apparel audience. Accepted as
a filter consistent with `01-concept/02-positioning.md` — a filtered audience
that cares beats a broad one that doesn't.

## Options rejected

| Option | Reason for rejection |
|---|---|
| **Base** | Cheaper writes and a far better consumer onramp. Rejected on permanence, art-collector legitimacy, and secondary depth. |
| **Solana** | Cheapest, best mobile UX, strong art culture. Rejected: non-EVM rewrite, smaller audit pool, no bridge-free path to L1 legitimacy. |
| **Polygon** | Brand drift, weaker collector perception. |
| **Arbitrum / Optimism** | No consumer-onboarding advantage over Base, without L1's legitimacy. |
| **Bitcoin / Ordinals** | **Technically impossible.** Mutable `calor` cannot exist. The core mechanic would not work at all. |
| **Multichain / bridged** | Adds a bridge as a permanent failure mode for a collection whose premise is permanence. |

## What does NOT change

- Genesis 2,369 · hard cap 5,922
- Generative output, trait manifest, exclusions — generator needs no edits
- Four-generation state machine and calor thresholds
- Transfer policy C (deeds attributed to the original wallet)
- **No owner-only mint function.** The cap is real or the story is a lie.
- No GEN 3 breed path — the function must not exist
- Protocol cost of `EL ENCUENTRO` remains exactly zero

## Follow-on actions

| # | Action | Status |
|---|---|---|
| 1 | L1 contract spec with gas-engineered write path | `02-contract-spec.md` |
| 2 | Re-word "free" → "we charge nothing" across breeding docs | Done |
| 3 | Pre-mint gas disclosure added to launch plan | Done |
| 4 | `PRIMER_DESHIELO` must require no holder transaction | Specified |
| 5 | Choose ERC-721A vs. ERC-721 + consecutive-id optimisation | **Open** |
| 6 | Audit budget and auditor selection | **Open** |
| 7 | Decide batch cadence for thaw roots | **Open** |
