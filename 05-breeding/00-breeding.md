# (pingus)² — Breeding & Supply Convergence

> **The idea:** pingus breed pingus. `(pingus)²`.
> **The problem:** `(pingus)²` is mathematically fatal.
> **The fix:** the water cycle already ends in evaporation. Use it.

---

## 1. Why raw `(pingus)²` cannot ship

| Gen | Literal `(pingus)²` | Each breeds 2 | Each breeds 1 |
|---|---|---|---|
| 0 | 2,369 | 2,369 | 2,369 |
| 1 | 5,612,161 | 4,738 | 2,369 |
| 2 | 3.1 × 10¹³ | 9,476 | 2,369 |
| 3 | — | 18,952 | 2,369 |
| **Total** | **absurd** | **35,535** | **9,476** |

The number 2,369 is doing real work in this concept — it means *this many
doers, specifically.* A collection that announces 2,369 and ships 35,000 has
lied, and the audience will say so.

**So `²` has to mean something other than "multiply forever."**

## 2. What `²` actually means here

Three readings, all true at once:

1. **Two parents.** It takes a pair to make the next one. `²` is the pairing.
2. **The exponent is the generation.** `pingu¹` → `pingu²` → `pingu³` is the
   state, not the headcount. A pingu squared is a pingu *raised to a higher
   power* — thawed, upgraded.
3. **Doing compounds, headcount doesn't.** The square is the effect, not the
   population.

> **PINGUS² is about raising pingus to a higher power, not multiplying them
> into the ground.**

## 3. The convergence curve

```
GEN 0  HIELO       2,369   ████████████████████  minted
GEN 1  DESHIELO   +2,369   ████████████████████  1 child per genesis
GEN 2  CORRIENTE  +1,184   ██████████            2 parents → 1 child
GEN 3  VAPOR          + 0   ·                     nothing is born here

                   ─────────
TOTAL EVER          5,922
```

Expansion → convergence → stop.

| Gen | New | Cumulative | Rule |
|---|---|---|---|
| 0 | 2,369 | 2,369 | Genesis mint only |
| 1 | 2,369 | 4,738 | Each genesis may produce exactly **one** |
| 2 | 1,184 | 5,922 | Two GEN 1 parents → **one** child (`floor(2369/2)`) |
| 3 | 0 | 5,922 | **Vapor does not reproduce. It finishes.** |

**Hard cap: 5,922. Enforced in the contract, not by promise.**

### Why this is better than a cap announcement

Most collections cap supply with a number in a contract. This caps supply with
a **story**: gas cannot breed. The limit is a consequence of the concept, so it
cannot be lobbied away by a community vote later. The answer to "will there be
a gen 4" is not "no, we promised" — it's *"evaporated water has nothing left to
give."*

## 4. El Encuentro — the meeting

Breeding is called `EL ENCUENTRO`. Never "breeding," never "minting."

### Rules

| Rule | Value |
|---|---|
| Who can breed | **GEN 2 CORRIENTE only** |
| Why | Solid can't move. Gas is gone. Only flowing water meets. |
| Parents required | 2 |
| Protocol fee | **0. Permanently.** No fee setter exists in the contract. |
| Gas | Initiator pays L1 gas on one transaction. **Partner pays nothing.** |
| Output | 1 child, born `GEN 0 HIELO`, calor 0 |
| Per-pingu limit | 1 encuentro per pingu, lifetime |
| Parent effect | Both parents gain `hecho: ENCUENTRO` (peso 2) |
| Cross-wallet | **Allowed and encouraged** — two different holders can pair |

### The child is born frozen

A child enters at `GEN 0 HIELO`, calor 0. It inherits nothing earned.

> **Doing is not hereditary.**

Your work melted *your* cube. Your child starts in its own. This is the
thematic core of the whole mechanic, and it also happens to be the only
inheritance model that cannot be farmed.

### What a child does inherit

Visual lineage only — never progress:

| Inherited | From | Mechanism |
|---|---|---|
| `CUERPO` | One parent, 50/50 | Direct |
| `PALETA` | Blend of both parents' accents | Deterministic rule table |
| `CUBO` shape | Averaged from both | Direct |
| `LINAJE` | Both parent token IDs | Metadata, permanent |
| `FIT`, `MARCA`, `CARGA` | **Re-rolled fresh** | Generative |
| `calor`, `hechos` | **Nothing. Zero.** | By design |

### Cross-wallet pairing is the real feature

The single best mechanic here: **two different people must cooperate to make a
third pingu.** No fee, no marketplace, no advantage to owning both parents. It
is a social act with an artifact as output — which is exactly what "a brand for
doers" should produce.

Both holders get `hecho: ENCUENTRO` and the child's `LINAJE` names both
wallets permanently.

### What "we charge nothing" means on Ethereum mainnet

Per `08-tech/decisions/ADR-001-chain.md`, genesis mints on L1. That makes the
distinction between *fee* and *gas* material, so state it precisely:

| | |
|---|---|
| What donedone.io charges | **Nothing. Ever.** There is no fee setter in the contract. |
| What the network charges | L1 gas, on one transaction, paid by the initiator |
| What the partner pays | **Nothing.** Consent is an off-chain EIP-712 signature. |

The naive design — two on-chain transactions from two wallets — would have
made cooperation expensive and time-coordinated, which would have killed the
best mechanic in the project. Instead the partner signs a typed message for
free and the initiator submits a single transaction carrying it.

So the copy is *"no cobramos nada"* — **we charge nothing** — rather than
"free." Gas is disclosed plainly pre-mint. Claiming "free" on L1 and then
presenting a gas estimate at signing is the kind of small dishonesty this
project cannot afford.

### Who gets the child?

| Option | Verdict |
|---|---|
| Random of the two | Creates a gamble. Reject. |
| Both get one (2 children) | Breaks the math. Reject. |
| **Initiator gets it, other gets `hecho` + lineage credit** | **Chosen** |
| Shared/escrow ownership | Too complex. Reject. |

Chosen: the initiator receives the child. The partner receives the `hecho`
(peso 2) and permanent lineage attribution. Since nobody can breed twice,
reciprocity emerges naturally — you initiate one, you partner on another.

## 5. Breeding windows

Unlimited-time breeding means the collection never feels resolved. Bound it.

| Window | Opens | Closes | Allowed |
|---|---|---|---|
| `VENTANA I` | GEN 1 reaches 25% of genesis | +90 days | GEN 1 children |
| `VENTANA II` | VENTANA I closes +30 days | +90 days | GEN 2 children |
| — | after that | **permanently** | nothing |

Unbred capacity **expires.** It does not roll over. Missing a window is a real
consequence — which is the only thing that makes a window meaningful.

Final supply may therefore land *under* 5,922. That is correct and should be
stated as a feature: the collection's true size is determined by how many
people actually did something.

## 6. Why no GEN 3 breeding — say it plainly

```
HIELO       solid    cannot move           cannot meet
DESHIELO    cracking still stuck           cannot meet
CORRIENTE   liquid   moves and mixes       ✓ MEETS
VAPOR       gas      dispersed, finished   nothing left to give
```

The one-line public answer:

> `el vapor no se reproduce. el vapor terminó.`
> *Vapor doesn't reproduce. Vapor is done.*

## 7. Metadata

```json
{
  "token_id": 3104,
  "generacion": 0,
  "estado": "HIELO_SOLIDO",
  "calor": 0,
  "linaje": {
    "gen": 1,
    "padres": [1138, 0472],
    "wallets": ["0x7a3f…", "0x91cd…"],
    "encuentro": "2026-07-19",
    "ventana": "VENTANA_I"
  },
  "hechos": []
}
```

Genesis tokens carry `"linaje": null`. Permanently distinguishable.

## 8. Contract requirements

| Requirement | Why |
|---|---|
| Hard cap 5,922 | Immutable, no mint function beyond it |
| `hasBred` flag per token | One encuentro per pingu, lifetime |
| Generation gate | Only `generacion == 2` may call `encuentro()` |
| Two-party consent | Both parent owners must consent — **partner via off-chain EIP-712 signature** |
| Single transaction | Initiator submits once. Partner never transacts. |
| No fee setter | Protocol cost is 0 and cannot be changed |
| Window enforcement | Immutable timestamps, not admin-toggled |
| No GEN 3 breed path | Function cannot exist, not merely disabled |
| `linaje` immutable | Written once at birth |

**No admin function may mint outside these rules.** If an owner-only mint
exists, the cap is a suggestion and the story is a lie.

Chain: **Ethereum mainnet.** Full implementation spec, including the
gas-engineered single-transaction breed path, in
`08-tech/decisions/02-contract-spec.md`.

See `08-tech/README.md`.
