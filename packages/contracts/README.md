# `@pingus/contracts` — PINGUS²

`contracts/Pingus2.sol` — ERC-721 · ERC-2981 · EIP-712. Ethereum mainnet, one
contract, no bridge. Per [`08-tech/decisions/02-contract-spec.md`](../../08-tech/decisions/02-contract-spec.md)
and `ADR-001`.

```
Genesis 2,369   ·   Hard cap 5,922   ·   Reserve 162 (declared, pre-mint, exact)
Max per wallet 3   ·   Breeding protocol fee 0, permanently
```

---

## The trust statement — what the owner CANNOT do

This is the list that matters. Read it before you read anything else about the
project, and verify every line against the source.

| The owner cannot… | How it is prevented |
|---|---|
| **Mint a single token** | There is no owner-only mint. The only two `_safeMint` call sites in the file are `mint()` (public, payable, capped at `GENESIS`) and `encuentro()` (capped at `HARD_CAP`). Neither is `onlyOwner`. |
| **Mint past 2,369 genesis** | `mint()` reverts `GenesisCapReached`. There is no second genesis path. |
| **Mint past 5,922 total** | `encuentro()` reverts `CapReached`. There is no other child path. |
| **Mint for free** | `mint()` reverts `WrongPayment` unless `msg.value == mintPrice * qty`. `mintPrice` is `immutable`. |
| **Change the calor thresholds** | `CALOR_GEN_1/2/3` are Solidity `constant`. No setter exists — not disabled, *absent*. |
| **Extend, shorten, pause or re-open a breeding window** | `VENTANA_I_OPEN/CLOSE` and `VENTANA_II_OPEN/CLOSE` are `immutable`, fixed at deploy. No toggle, no pause, no extend. Unbred capacity expires and does not roll over. |
| **Charge a fee to breed** | `encuentro()` is not `payable`. There is no fee variable and no fee setter anywhere in the file. |
| **Decrease anyone's `calor`** | Only `attestBatch` writes `calor`, and it reverts `NotMonotonic` on any delta that would decrease or overflow it. There is no other write path. |
| **Thaw a token** | `attestBatch` is `onlyAttestor`. The owner is not the attestor. |
| **Rotate the attestor** | `attestor` is `immutable`. No setter. |
| **Advance EL PRIMERO past GEN 1** | Token 2369 carries `FLAG_GEN_LOCKED`; `generacion()` returns `1` unconditionally for it, and `encuentro()` therefore always reverts `NotCorriente` for it. |
| **Let a GEN 3 pingu breed** | `encuentro()` requires `generacion == 2` for **both** parents. No alternative function exists. `el vapor no se reproduce. el vapor terminó.` |
| **Breed a pingu twice** | `FLAG_HAS_BRED`, one lifetime encuentro per pingu, reverts `AlreadyBred`. |
| **Give a child inherited progress** | Children are written with `calor: 0, hechosCount: 0, flags: 0`. |
| **Change the art after launch** | `freezeMetadata()` is one-way. After it, `setBaseCID` reverts `MetadataIsFrozen` forever. There is no unfreeze. |
| **Change the traits** | Traits are not on-chain and never change. `TRAITS_ROOT` is `immutable` and commits to the whole published manifest. |
| **Redirect mint proceeds** | `withdraw()` is callable by *anyone* and can only send to `TREASURY`, which is `immutable`. |
| **Move or seize someone's pingu** | Standard ERC-721 approvals only. No `onlyOwner` transfer hook, no blocklist, no "recovery" function. |

**The owner's complete power set is:** be the ERC-2981 royalty recipient, call
`setBaseCID` until the freeze, call `freezeMetadata()` once, and transfer or
renounce ownership. That is all of it.

**The attestor's complete power set is:** call `attestBatch`, which can only
ever *increase* `calor`.

### Known, stated centralisation

Deed verification is centralised — a human must judge whether you shipped a
thing, and `attestBatch` is the on-chain expression of that judgement. The
mitigation is not cryptographic, it is procedural: every batch commits a
`ledgerRoot` over the full public ledger **including rejections**. See
`02-identity/01-proof-of-doing.md`. The art, the caps and the thresholds are
not centralised — see the table above.

---

## How to verify there is no owner mint

Four independent checks, cheapest first.

**1. Grep the source.** There must be exactly two mint call sites.

```bash
grep -n '_safeMint(' contracts/Pingus2.sol | grep -v '\*'
# 258:            _safeMint(msg.sender, id);        <- inside mint()
# 435:        _safeMint(msg.sender, childId);       <- inside encuentro()

grep -nE '(^|[^e])_mint\(' contracts/Pingus2.sol   # empty: no raw _mint call site
grep -n 'onlyOwner' contracts/Pingus2.sol          # only setBaseCID and freezeMetadata
```

Both call sites mint to `msg.sender`. Neither function takes a recipient
address, so there is no `to` parameter for an admin to point anywhere.

**2. Grep the ABI.** The committed [`abi/Pingus2.json`](./abi/Pingus2.json) is
what the front end uses and what a block explorer shows.

```bash
jq -r '.[] | select(.type=="function" and .stateMutability!="view" and .stateMutability!="pure") | .name' abi/Pingus2.json | sort
# approve
# attestBatch
# encuentro
# freezeMetadata
# mint
# renounceOwnership
# safeTransferFrom
# safeTransferFrom
# setApprovalForAll
# setBaseCID
# transferFrom
# transferOwnership
# withdraw
```

That is the **complete** list of state-changing functions. There is no
`ownerMint`, `mintTo`, `mintReserve`, `airdrop`, `teamMint` or `safeMint`.

```bash
jq '.[] | select(.name=="mint") | {inputs, stateMutability}' abi/Pingus2.json
# { "inputs": [ { "name": "qty", "type": "uint256" } ], "stateMutability": "payable" }
```

**3. Run the test.** `test/Pingus2.test.ts` row 2 asserts all of the above at
the ABI and source level, and will fail the build if a mint path is ever added.

```bash
pnpm --filter @pingus/contracts test
```

**4. Check the deployed bytecode.** After deploy, verify on Etherscan and
confirm the verified source matches this file byte for byte, then re-run checks
1–3 against Etherscan's copy rather than ours.

### Why the 162 reserve is not a backdoor

The reserve (plagainnvade 60 · donedone.io 60 · collabs 30 · archive 12 = 162)
is minted by the `TREASURY` address calling **the same public `mint()`
function** as everyone else:

- same `mintPrice`, actually paid;
- counted against the same `GENESIS` cap;
- recorded in the same `mintedBy` ledger;
- cannot mint token 2370+, cannot mint after genesis is exhausted.

The single difference is the per-wallet *quantity* allowance: `RESERVE` (162)
instead of `maxPerWallet` (3). It is a quantity allowance on a public, paid,
capped path — not a privileged function.

A `mintReserve()` owner function would have been cheaper in gas and strictly
worse in trust, because it would have required you to believe a comment instead
of reading a cap. Reserved tokens thaw under identical rules; a team pingu
sitting at GEN 0 is a feature.

---

## Gas budget — `attestBatch` is donedone.io's committed opex

Thaw is **pushed** by donedone.io, never pulled by the holder. From `ADR-001`
consequence #4: the deciding project metric is *% of holders reaching GEN 1*,
and if gas suppresses that number the metric is contaminated and the thesis
cannot be tested. **Holders never pay to be recognised. Non-negotiable.**

Measured on this implementation (solc 0.8.24, optimizer `runs: 800`, warm
slot, one 32-byte slot per token):

| Operation | Payer | Measured gas |
|---|---|---|
| `attestBatch`, per token in a batch | **donedone.io** | **≈ 13.5k** (80,769 for a 6-token batch) |
| `attestBatch`, single-token call | donedone.io | ≈ 34.7k (the 21k tx base dominates) |
| `encuentro` (incl. minting the child) | initiator | ≈ 147k |
| `encuentro` | **partner** | **0 — not one wei, not one transaction** |
| `mint(1)` | holder | ≈ 120k |
| `mint(3)` | holder | ≈ 210k (≈ 70k/token) |

Reproduce with `REPORT_GAS=true pnpm --filter @pingus/contracts test`.

### The number that needs a decision before mint

```
attestBatch cost  ≈  21,000 + (13,500 × tokens in batch)   gas
3-year opex       ≈  total deeds × 13,500 gas  +  21,000 per batch
```

Batching is everything: the 21k transaction base amortises across the batch, so
a weekly batch of 300 deeds costs ≈ 4.07M gas (≈ 13.6k/deed) while 300
single-token calls cost ≈ 14.4M (≈ 48k/deed) — **3.5× more for identical
state**. Recommended cadence: weekly, or on demand at 50+ pending deeds.

Model `attestBatch cost × expected total deeds over 3 years` at a realistic gas
price **before** finalising the mint price. If it is unaffordable at projected
volume the options are, in order: lengthen the batch cadence, raise the `calor`
cost per generation (fewer deeds for the same journey), or revisit `ADR-001`.
Do not ship on estimates — these are measured numbers on Hardhat, re-measure
against mainnet state before committing.

---

## Public surface

The web app is written against exactly these signatures.

```solidity
// supply & sale
GENESIS() view returns (uint256)              // 2369
HARD_CAP() view returns (uint256)             // 5922
EL_PRIMERO() view returns (uint256)           // 2369
RESERVE() view returns (uint256)              // 162
totalSupply() view returns (uint256)
totalMintedGenesis() view returns (uint256)
mintPrice() view returns (uint256)
maxPerWallet() view returns (uint256)         // 3
mintedBy(address) view returns (uint256)
saleOpen() view returns (bool)
mint(uint256 qty) payable
withdraw()                                    // anyone -> TREASURY

// state, all derived from calor
calor(uint256 id) view returns (uint16)
generacion(uint256 id) view returns (uint8)   // 0..3
estado(uint256 id) view returns (uint8)       // 0..11 = generacion*3 + subState
hechosCount(uint256 id) view returns (uint8)
hasBred(uint256 id) view returns (bool)
genLocked(uint256 id) view returns (bool)
bornAt(uint256 id) view returns (uint32)
parentsOf(uint256 id) view returns (uint16 parentA, uint16 parentB)

// breeding
windowOpen() view returns (bool)
nonces(address) view returns (uint256)
ENCUENTRO_TYPEHASH() view returns (bytes32)
encuentroDigest(uint256 partnerId, uint256 initiatorId, uint256 nonce, uint256 deadline) view returns (bytes32)
encuentro(uint256 initiatorId, uint256 partnerId, uint256 deadline, bytes partnerSig)

// thaw
attestor() view returns (address)
attestBatch(uint256[] ids, uint16[] calorDelta, bytes32 ledgerRoot)   // onlyAttestor

// metadata
tokenURI(uint256 id) view returns (string)    // baseCID[gen]/estado/id.json
baseCID(uint8 gen) view returns (string)
TRAITS_ROOT() view returns (bytes32)
TRAITS_URI() view returns (string)
metadataFrozen() view returns (bool)
setBaseCID(uint8 gen, string cid)             // onlyOwner, until freeze
freezeMetadata()                              // onlyOwner, once, irreversible

// events
event Thawed(bytes32 ledgerRoot, uint256[] ids, uint16[] calorDelta)
event Encuentro(uint256 initiatorId, uint256 partnerId, uint256 childId, address partnerOwner)
```

Plus the standard ERC-721 / ERC-721Metadata / ERC-2981 surface
(`ownerOf`, `balanceOf`, `approve`, `transferFrom`, `royaltyInfo`, …).

### `estado` → generations.json

| estado | gen | key | calor |
|---|---|---|---|
| 0 | 0 HIELO | `HIELO_SOLIDO` | 0 |
| 1 | 0 | `HIELO_SUDADO` | 1 |
| 2 | 0 | `HIELO_TENSO` | 2 |
| 3 | 1 DESHIELO | `GRIETA` | 3 |
| 4 | 1 | `ESQUINA_IDA` | 4–5 |
| 5 | 1 | `MEDIO_LIBRE` | 6–7 |
| 6 | 2 CORRIENTE | `CORRIENTE_BAJA` | 8–9 |
| 7 | 2 | `CORRIENTE_MEDIA` | 10–12 |
| 8 | 2 | `CORRIENTE_ALTA` | 13–14 |
| 9 | 3 VAPOR | `VAPOR_BAJO` | 15–17 |
| 10 | 3 | `VAPOR_ALTO` | 18–20 |
| 11 | 3 | `HECHO` | 21+ |

EL PRIMERO (2369) is clamped into the GEN 1 band (`estado` 3–5) forever,
however much `calor` it accumulates.

---

## EIP-712 — the partner's free consent

Domain: `name: "PINGUS2"`, `version: "1"`, the deploy chain id, the contract
address.

```
Encuentro(uint256 partnerId,uint256 initiatorId,uint256 nonce,uint256 deadline)
```

`nonce` is `nonces(partnerOwnerAddress)` and is consumed on use, so a signature
cannot be replayed. The signature is verified with `SignatureChecker`, so a
partner whose wallet is a smart contract can consent via ERC-1271 — still with
zero gas. The initiator submits one transaction and receives the child.

---

## Layout

```
contracts/Pingus2.sol              the contract
contracts/test/Pingus2Harness.sol  TEST ONLY, never deployed — shrinks the two
                                   supply caps so the "mint beyond GENESIS" and
                                   "mint beyond HARD_CAP" matrix rows can be
                                   executed rather than argued. Adds no mint
                                   path, no setter, no privileged function.
test/Pingus2.test.ts               all 17 spec matrix rows + mint/limits/712/URI
scripts/deploy.ts                  constructor args from env, no keys in repo
scripts/extract-abi.js             artifact -> abi/Pingus2.json
abi/Pingus2.json                   ABI array only. COMMITTED. The web app imports this.
```

## Scripts

```bash
pnpm --filter @pingus/contracts build       # hardhat compile + write abi/Pingus2.json
pnpm --filter @pingus/contracts test        # 17 matrix rows + the rest
pnpm --filter @pingus/contracts typecheck
pnpm --filter @pingus/contracts clean
```

`compile`, `test` and `typecheck` require **no environment variables at all**.

## Deploy

Copy `.env.example`, fill it, then:

```bash
pnpm --filter @pingus/contracts deploy:sepolia
pnpm --filter @pingus/contracts deploy:mainnet
```

Constructor:

```solidity
constructor(
    address owner_,            // owner multisig: royalties + freezeMetadata
    address treasury_,         // reserve minter + proceeds destination (immutable)
    address attestor_,         // donedone.io attestor multisig (immutable)
    uint256 mintPrice_,        // wei
    uint96  royaltyBps_,       // <= 1000
    bytes32 traitsRoot_,       // keccak256 of the published traits manifest
    string  memory traitsUri_, // ipfs:// manifest
    uint64[6] memory schedule_,// [saleOpen, saleClose, vI_open, vI_close, vII_open, vII_close]
    string[4] memory baseCID_  // art CID per generation 0..3
)
```

**Pre-deploy checklist**

- [ ] `thresholds_locked: true` in `08-tech/config/generations.json` — they can
      never change after this.
- [ ] All four generation CIDs pinned and published in the ADR.
- [ ] `TRAITS_ROOT` = keccak256 of the exact published manifest bytes.
- [ ] `owner_` and `attestor_` are **multisigs, not EOAs**, and are different.
- [ ] Breeding windows final — there is no extend function.
- [ ] `attestBatch` 3-year opex modelled at a real gas price.
- [ ] `freezeMetadata()` scheduled, announced publicly, with a date.
