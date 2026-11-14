# Contract Spec — Ethereum Mainnet

Per `ADR-001`. Single contract, single network, no bridge.

> **Design pressure:** on L1 every storage write is a real cost borne by a real
> person. The mechanic survives only if the holder's *required* on-chain
> footprint is near zero. Everything below is organised around that.

---

## Standards

| Standard | Use |
|---|---|
| **ERC-721** | Core. Genesis + bred children on one contract. |
| **ERC-2981** | Royalties. |
| **EIP-712** | Typed signatures for breeding consent and thaw attestation. |
| ERC-6551 | **Deferred.** Only if garment claims become token-bound. Not at launch. |
| ERC-721A | **Open decision** — see ADR-001 follow-on #5. |

## Storage layout — packed

The entire mutable state per token fits in **one 32-byte slot.** This is the
single most important optimisation in the contract.

```solidity
struct Pingu {
    uint16  calor;        // 0–65535, monotonic
    uint8   hechosCount;  // deed count; log itself is off-chain
    uint8   flags;        // bit 0: hasBred
                          // bit 1: claimBurned
                          // bit 2: genLocked (EL PRIMERO)
                          // bits 3-7: reserved
    uint16  parentA;      // 0 = genesis
    uint16  parentB;      // 0 = genesis
    uint32  bornAt;       // block timestamp
    // 96 bits free
}

mapping(uint256 => Pingu) private _pingus;
```

Traits are **not stored on-chain.** They are immutable, published pre-mint,
and committed to by a single hash:

```solidity
bytes32 public immutable TRAITS_ROOT;  // keccak of 08-tech/output/traits.json
string  public immutable TRAITS_URI;   // ipfs:// the full manifest
```

Anyone can verify any token's traits against the published manifest. Storing
them on-chain would cost a fortune and buy nothing — they never change.

### Why `generacion` and `estado` are not stored

Both are **pure functions of `calor`.** Storing them would be redundant state
that can drift out of sync.

```solidity
function generacion(uint256 id) public view returns (uint8) {
    uint16 c = _pingus[id].calor;
    if (_pingus[id].flags & FLAG_GEN_LOCKED != 0) return 1; // EL PRIMERO
    if (c >= 15) return 3;
    if (c >= 8)  return 2;
    if (c >= 3)  return 1;
    return 0;
}
```

Thresholds are **immutable constants**, hardcoded at deploy. Per
`04-collection-spec/`, they are locked before mint and can never change. A
settable threshold would make the whole state machine a suggestion.

---

## Thaw — the critical path

### Requirement: the holder never pays to be recognised

From `ADR-001` consequence #4. The deciding project metric is *% of holders
reaching GEN 1*. If gas suppresses that number, the metric is contaminated and
the thesis cannot be tested.

**Therefore thaw is PUSHED by donedone.io, never PULLED by the holder.**

```solidity
/// @notice Batch thaw. Called by donedone.io attestor multisig.
/// @dev Gas paid by donedone.io, NOT by holders. Non-negotiable.
function attestBatch(
    uint256[] calldata ids,
    uint16[]  calldata calorDelta,
    bytes32   ledgerRoot
) external onlyAttestor {
    uint256 n = ids.length;
    for (uint256 i; i < n; ++i) {
        Pingu storage p = _pingus[ids[i]];
        uint16 next = p.calor + calorDelta[i];
        if (next <= p.calor) revert NotMonotonic();   // no decrease, no overflow
        p.calor = next;
        p.hechosCount += 1;
    }
    emit Thawed(ledgerRoot, ids, calorDelta);
}
```

| Property | Value |
|---|---|
| Who pays gas | **donedone.io** |
| Holder action required | **None, ever** |
| `calor` direction | Monotonically increasing. Enforced. |
| Batch cadence | Open decision — recommend weekly or on-demand at 50+ deeds |
| Ledger | `ledgerRoot` commits to the full public ledger incl. rejections |

**Cost note:** one warm-slot update per token, batched. This is a recurring
operating cost for donedone.io on L1 and must be budgeted explicitly — it is
the price of choosing mainnet. See `02-identity/01-proof-of-doing.md` for the
staffing commitment this sits on top of.

### The deed log stays off-chain

`hechos` detail (type, date, verifier, original wallet) lives in the public
ledger, committed per batch via `ledgerRoot`. Only the **count** is on-chain.

Storing 12 deed types × 5,922 tokens on L1 buys nothing that a Merkle
commitment doesn't. The attribution guarantee from transfer policy C is
preserved cryptographically, not by storage.

---

## EL ENCUENTRO — single-transaction breeding

### The problem

Naive two-signature breeding = two on-chain transactions from two different
wallets, coordinated in time. On L1 that is both expensive and a UX failure.
It would kill the cross-wallet cooperation that is the best mechanic in the
project.

### The fix: EIP-712 off-chain consent

The partner signs a typed message **off-chain, for free.** The initiator
submits one transaction carrying that signature.

```solidity
bytes32 constant ENCUENTRO_TYPEHASH = keccak256(
    "Encuentro(uint256 partnerId,uint256 initiatorId,uint256 nonce,uint256 deadline)"
);

function encuentro(
    uint256 initiatorId,
    uint256 partnerId,
    uint256 deadline,
    bytes calldata partnerSig
) external {
    if (ownerOf(initiatorId) != msg.sender)  revert NotOwner();
    if (block.timestamp > deadline)          revert Expired();
    if (!_windowOpen())                      revert WindowClosed();

    if (generacion(initiatorId) != 2) revert NotCorriente();
    if (generacion(partnerId)   != 2) revert NotCorriente();

    Pingu storage a = _pingus[initiatorId];
    Pingu storage b = _pingus[partnerId];
    if (a.flags & FLAG_HAS_BRED != 0) revert AlreadyBred();
    if (b.flags & FLAG_HAS_BRED != 0) revert AlreadyBred();

    // partner consents off-chain, pays nothing
    _verify712(partnerId, initiatorId, deadline, partnerSig, ownerOf(partnerId));

    a.flags |= FLAG_HAS_BRED;
    b.flags |= FLAG_HAS_BRED;

    uint256 childId = _nextChildId();
    if (childId > HARD_CAP) revert CapReached();

    _mint(msg.sender, childId);          // initiator receives the child
    _pingus[childId] = Pingu({
        calor: 0, hechosCount: 0, flags: 0,
        parentA: uint16(initiatorId),
        parentB: uint16(partnerId),
        bornAt: uint32(block.timestamp)
    });

    emit Encuentro(initiatorId, partnerId, childId, ownerOf(partnerId));
}
```

| Property | Value |
|---|---|
| Protocol fee | **0. Permanently. No admin setter exists.** |
| Transactions | **1** |
| Who pays gas | Initiator only |
| Partner cost | **Zero** — signature is off-chain |
| Partner receives | `hecho: ENCUENTRO` (peso 2) + permanent lineage attribution |
| Per-pingu limit | 1 lifetime, enforced by `FLAG_HAS_BRED` |
| Child born at | `calor 0`, `GEN 0 HIELO`, inherits no progress |

This preserves every rule in `05-breeding/00-breeding.md` while making the
partner's participation genuinely costless — which is what "we charge nothing"
has to mean on L1.

### Windows

```solidity
uint64 public immutable VENTANA_I_OPEN;
uint64 public immutable VENTANA_I_CLOSE;
uint64 public immutable VENTANA_II_OPEN;
uint64 public immutable VENTANA_II_CLOSE;
```

**Immutable timestamps, set at deploy. No admin toggle.** Per
`05-breeding/`, unbred capacity expires and does not roll over. An
admin-extendable window would make expiry a negotiation.

---

## Supply

```solidity
uint256 public constant GENESIS   = 2369;
uint256 public constant HARD_CAP  = 5922;   // 2369 + 2369 + 1184
```

### No owner mint

Per the project non-negotiables, stated as a contract property:

```solidity
// There is no owner-only mint function in this contract.
// Genesis: public/allowlist mint only, capped at GENESIS.
// Children: encuentro() only, capped at HARD_CAP.
// No other mint path exists. Verify by reading the source.
```

If an owner mint existed, the cap would be a suggestion and the story a lie.
This is the first thing an auditor should confirm and the first thing to point
at publicly.

### No GEN 3 breed path

There is no function that mints from a GEN 3 parent. Not disabled — **absent.**
`encuentro()` reverts on `generacion != 2`, and no alternative exists.

> `el vapor no se reproduce. el vapor terminó.`

---

## tokenURI

Resolves on-chain from `calor`. All four generations' art is pinned **before
mint** — nothing is generated later, nothing can be cancelled.

```solidity
function tokenURI(uint256 id) public view returns (string memory) {
    uint8 g = generacion(id);
    uint8 e = estado(id);                       // sub-state from calor
    return string.concat(_baseCID[g], "/", _str(e), "/", _str(id), ".json");
}
```

| Property | Value |
|---|---|
| Art immutability | 4 CIDs pinned pre-mint, published in ADR |
| What moves | Only the pointer, and only by `calor` |
| `_baseCID` | `immutable` after a one-time `freezeMetadata()` |
| Freeze | Called publicly at launch; irreversible |

Be honest in public: *deed verification is centralised* — someone must judge
whether you shipped a thing. The art is not. The mitigation is the public
ledger including rejections, per `02-identity/01-proof-of-doing.md`.

---

## Access control

| Role | Powers | Form |
|---|---|---|
| `attestor` | `attestBatch` only | **Multisig, not an EOA** |
| `owner` | Royalty recipient, `freezeMetadata` once | Multisig |
| — | **Cannot** mint, cannot change thresholds, cannot alter windows, cannot decrease `calor`, cannot set a breed fee | — |

Enumerate the powers the owner does **not** have, publicly, pre-mint. That
list is the actual trust statement.

---

## EL PRIMERO — token 2369

```solidity
// Minted with FLAG_GEN_LOCKED. generacion() always returns 1.
// encuentro() reverts: generacion != 2.
// attestBatch() may still add calor, but generation never advances.
```

Permanently `GEN 1 DESHIELO`. The proof of concept, not a participant.

---

## Test matrix — must all pass before audit

| # | Test | Expected |
|---|---|---|
| 1 | Mint beyond `GENESIS` via public mint | revert |
| 2 | Any owner-callable mint path exists | **no such function** |
| 3 | `encuentro` from GEN 0/1/3 parent | revert `NotCorriente` |
| 4 | `encuentro` twice with same pingu | revert `AlreadyBred` |
| 5 | `encuentro` with forged partner signature | revert |
| 6 | `encuentro` after window close | revert `WindowClosed` |
| 7 | Mint beyond `HARD_CAP` via breeding | revert `CapReached` |
| 8 | `calor` decrease attempt | revert `NotMonotonic` |
| 9 | Non-attestor calls `attestBatch` | revert |
| 10 | Threshold mutation attempt | **no such function** |
| 11 | Window extension attempt | **no such function** |
| 12 | Breed fee setter | **no such function** |
| 13 | Token 2369 advances past GEN 1 | never |
| 14 | `tokenURI` tracks `calor` across all 4 gens | correct CID + estado |
| 15 | Metadata change after `freezeMetadata()` | revert |
| 16 | Child inherits `calor`/`hechos` | always 0 |
| 17 | Partner pays gas on `encuentro` | never |

---

## Gas budget — to be measured, not guessed

Model these before finalising mint price. Do not ship on estimates.

| Operation | Payer | Priority |
|---|---|---|
| Genesis mint (1 token) | Holder | Drives mint price floor |
| `attestBatch` per token | **donedone.io** | **Recurring opex. Model at 3-year volume.** |
| `encuentro` | Initiator | Must stay low enough that cooperation happens |
| Transfer | Market | Standard |

### The number that needs a decision

**`attestBatch` cost × expected total deeds over 3 years.**

That is donedone.io's committed L1 operating expense, and it is the direct
financial consequence of this ADR. If it is unaffordable at projected volume,
the options are: raise the `calor` cost per generation (fewer deeds), lengthen
batch cadence, or revisit ADR-001. Model it before mint, not after.
