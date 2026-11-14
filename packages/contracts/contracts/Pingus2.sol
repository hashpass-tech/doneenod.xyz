// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title PINGUS² — 2,369 pingus born frozen. Generation is earned, never bought.
 * @notice Per `08-tech/decisions/02-contract-spec.md` and `ADR-001`.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 *  THE TRUST STATEMENT — WHAT THIS CONTRACT CANNOT DO
 * ──────────────────────────────────────────────────────────────────────────────
 *
 *  1. THERE IS NO OWNER MINT FUNCTION OF ANY KIND.
 *     Exactly two functions in this file call `_safeMint`:
 *       - `mint(uint256)`      — public sale, hard-capped at GENESIS (2369)
 *       - `encuentro(...)`     — breeding, hard-capped at HARD_CAP (5922)
 *     Neither is `onlyOwner`, neither can be called by the owner in any
 *     privileged way, and there is no `_mint`/`_safeMint` reachable from any
 *     other entry point. Verify by grepping this file for `_safeMint(`.
 *
 *     THE 162 RESERVE TOKENS ARE NOT A BACKDOOR.
 *     The declared reserve (plagainnvade 60, donedone.io 60, collabs 30,
 *     archive 12 = 162, per `04-collection-spec/00-supply.md`) is minted by
 *     the TREASURY address calling the SAME public `mint()` function, paying
 *     the SAME `mintPrice`, counted against the SAME `GENESIS` cap, and
 *     recorded in the SAME `mintedBy` ledger. The ONLY difference is that
 *     TREASURY's per-wallet limit is `RESERVE` (162) instead of
 *     `MAX_PER_WALLET` (3) — a quantity allowance on a public, paid, capped
 *     path, not a privileged mint. It cannot mint token 2370+, it cannot mint
 *     for free, it cannot mint after GENESIS is exhausted, and it cannot mint
 *     more than 162. This was a deliberate choice: a `mintReserve()` owner
 *     function would have been cheaper in gas and strictly worse in trust.
 *
 *  2. CALOR THRESHOLDS ARE `constant`. There is no setter. Not disabled —
 *     absent. A settable threshold would make the state machine a suggestion.
 *
 *  3. BREEDING WINDOWS ARE `immutable`, fixed at deploy. No extend, no toggle,
 *     no pause. Unbred capacity expires and does not roll over.
 *
 *  4. THE PROTOCOL FEE FOR `encuentro` IS 0, PERMANENTLY. There is no fee
 *     variable and no fee setter anywhere in this file.
 *
 *  5. `calor` IS MONOTONICALLY INCREASING, ENFORCED. `attestBatch` reverts on
 *     any delta that would decrease or overflow it. Nobody — not the owner,
 *     not the attestor — can take progress away.
 *
 *  6. GEN 3 HAS NO BREED PATH. `encuentro` reverts unless BOTH parents are
 *     `generacion == 2`, and no alternative mint-from-parent function exists.
 *     `el vapor no se reproduce. el vapor terminó.`
 *
 *  7. TOKEN 2369 (EL PRIMERO) IS GEN-LOCKED FOREVER. `generacion()` returns 1
 *     for it regardless of calor, and it can never breed.
 *
 *  The owner's total power is: receive royalties, set the four art CIDs until
 *  `freezeMetadata()` is called, and call `freezeMetadata()` once. That is all.
 *  The attestor's total power is `attestBatch`, which can only ever increase
 *  calor. Both are `immutable`/ownership-bound; the attestor cannot be rotated.
 */
contract Pingus2 is ERC721, Ownable, EIP712, IERC2981 {
    // ─── Supply ───────────────────────────────────────────────────────────────
    // Declared `virtual` for one reason only: the test suite subclasses this
    // contract with smaller caps so that the "mint beyond GENESIS" and
    // "mint beyond HARD_CAP" matrix rows can be executed for real rather than
    // asserted by inspection. The deployed contract is `Pingus2` itself; the
    // values below are the ones published in `04-collection-spec/00-supply.md`.
    function GENESIS() public view virtual returns (uint256) {
        return 2369;
    }

    function HARD_CAP() public view virtual returns (uint256) {
        return 5922; // 2369 genesis + 2369 gen-1 children + 1184 gen-2 children
    }

    /// @notice EL PRIMERO is always the last genesis token id.
    function EL_PRIMERO() public view returns (uint256) {
        return GENESIS();
    }

    /// @notice Declared reserve, pre-mint, exact. Minted through `mint()`.
    uint256 public constant RESERVE = 162;

    uint256 private constant MAX_PER_WALLET = 3;

    // ─── Calor thresholds — `constant`, no setter exists ──────────────────────
    uint16 public constant CALOR_GEN_1 = 3; // DESHIELO
    uint16 public constant CALOR_GEN_2 = 8; // CORRIENTE
    uint16 public constant CALOR_GEN_3 = 15; // VAPOR

    // ─── Packed mutable state: ONE 32-byte slot per token ─────────────────────
    uint8 public constant FLAG_HAS_BRED = 1 << 0;
    uint8 public constant FLAG_CLAIM_BURNED = 1 << 1;
    uint8 public constant FLAG_GEN_LOCKED = 1 << 2;

    struct Pingu {
        uint16 calor; // 0–65535, monotonic
        uint8 hechosCount; // deed count; the log itself is off-chain
        uint8 flags; // bit0 hasBred · bit1 claimBurned · bit2 genLocked
        uint16 parentA; // 0 = genesis
        uint16 parentB; // 0 = genesis
        uint32 bornAt; // block timestamp
        // 96 bits free
    }

    mapping(uint256 => Pingu) private _pingus;

    // ─── Traits are NOT on-chain. One hash commits to the whole manifest ──────
    bytes32 public immutable TRAITS_ROOT;
    string public TRAITS_URI;

    // ─── Sale ─────────────────────────────────────────────────────────────────
    uint256 public immutable mintPrice;
    uint64 public immutable SALE_OPEN_AT;
    uint64 public immutable SALE_CLOSE_AT;
    address public immutable TREASURY;
    mapping(address => uint256) public mintedBy;

    // ─── Breeding windows — immutable, no toggle, no extension ────────────────
    uint64 public immutable VENTANA_I_OPEN;
    uint64 public immutable VENTANA_I_CLOSE;
    uint64 public immutable VENTANA_II_OPEN;
    uint64 public immutable VENTANA_II_CLOSE;

    // ─── Thaw ─────────────────────────────────────────────────────────────────
    /// @notice donedone.io attestor multisig. Immutable: cannot be rotated.
    address public immutable attestor;

    // ─── Royalties (ERC-2981) ─────────────────────────────────────────────────
    uint96 public immutable ROYALTY_BPS;

    // ─── Metadata ─────────────────────────────────────────────────────────────
    string[4] private _baseCID;
    bool public metadataFrozen;

    // ─── Counters ─────────────────────────────────────────────────────────────
    uint256 private _genesisMinted;
    uint256 private _childrenMinted;

    // ─── EIP-712 ──────────────────────────────────────────────────────────────
    bytes32 public constant ENCUENTRO_TYPEHASH =
        keccak256("Encuentro(uint256 partnerId,uint256 initiatorId,uint256 nonce,uint256 deadline)");

    /// @notice Replay protection for off-chain `encuentro` consent, per signer.
    mapping(address => uint256) public nonces;

    // ─── Events ───────────────────────────────────────────────────────────────
    event Thawed(bytes32 ledgerRoot, uint256[] ids, uint16[] calorDelta);
    event Encuentro(uint256 initiatorId, uint256 partnerId, uint256 childId, address partnerOwner);
    event MetadataFrozenForever();
    event BaseCIDSet(uint8 gen, string cid);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error NotOwner();
    error NotAttestor();
    error NotMonotonic();
    error NotCorriente();
    error AlreadyBred();
    error GenLocked();
    error Expired();
    error WindowClosed();
    error CapReached();
    error GenesisCapReached();
    error SaleClosed();
    error MaxPerWallet();
    error WrongPayment();
    error BadQuantity();
    error BadSignature();
    error LengthMismatch();
    error SelfEncuentro();
    error MetadataIsFrozen();
    error BadGen();
    error NothingToWithdraw();

    constructor(
        address owner_,
        address treasury_,
        address attestor_,
        uint256 mintPrice_,
        uint96 royaltyBps_,
        bytes32 traitsRoot_,
        string memory traitsUri_,
        uint64[6] memory schedule_, // saleOpen, saleClose, vIOpen, vIClose, vIIOpen, vIIClose
        string[4] memory baseCID_
    ) ERC721("PINGUS2", "PINGU2") Ownable(owner_) EIP712("PINGUS2", "1") {
        require(treasury_ != address(0) && attestor_ != address(0), "zero addr");
        require(royaltyBps_ <= 1000, "royalty > 10%");
        TREASURY = treasury_;
        attestor = attestor_;
        mintPrice = mintPrice_;
        ROYALTY_BPS = royaltyBps_;
        TRAITS_ROOT = traitsRoot_;
        TRAITS_URI = traitsUri_;
        SALE_OPEN_AT = schedule_[0];
        SALE_CLOSE_AT = schedule_[1];
        VENTANA_I_OPEN = schedule_[2];
        VENTANA_I_CLOSE = schedule_[3];
        VENTANA_II_OPEN = schedule_[4];
        VENTANA_II_CLOSE = schedule_[5];
        for (uint256 i; i < 4; ++i) {
            _baseCID[i] = baseCID_[i];
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  SALE — the only genesis mint path. Not `onlyOwner`. Capped at GENESIS.
    // ══════════════════════════════════════════════════════════════════════════

    function totalSupply() public view returns (uint256) {
        return _genesisMinted + _childrenMinted;
    }

    function totalMintedGenesis() public view returns (uint256) {
        return _genesisMinted;
    }

    function maxPerWallet() public view returns (uint256) {
        return MAX_PER_WALLET;
    }

    function saleOpen() public view returns (bool) {
        return block.timestamp >= SALE_OPEN_AT && block.timestamp < SALE_CLOSE_AT && _genesisMinted < GENESIS();
    }

    /// @notice Mint genesis pingus. The only genesis mint path that exists.
    /// @dev Called by the public AND by TREASURY for the declared 162 reserve.
    ///      No privileged variant exists. See the trust statement above.
    function mint(uint256 qty) external payable {
        if (!saleOpen()) revert SaleClosed();
        if (qty == 0) revert BadQuantity();

        uint256 minted = _genesisMinted;
        if (minted + qty > GENESIS()) revert GenesisCapReached();

        uint256 limit = msg.sender == TREASURY ? RESERVE : maxPerWallet();
        if (mintedBy[msg.sender] + qty > limit) revert MaxPerWallet();
        if (msg.value != mintPrice * qty) revert WrongPayment();

        _genesisMinted = minted + qty;
        mintedBy[msg.sender] += qty;

        uint256 primero = EL_PRIMERO();
        for (uint256 i; i < qty; ++i) {
            uint256 id = minted + i + 1;
            _pingus[id] = Pingu({
                calor: 0,
                hechosCount: 0,
                flags: id == primero ? FLAG_GEN_LOCKED : 0,
                parentA: 0,
                parentB: 0,
                bornAt: uint32(block.timestamp)
            });
            _safeMint(msg.sender, id);
        }
    }

    /// @notice Sweep mint proceeds to the immutable TREASURY. Callable by anyone;
    ///         the destination cannot be changed by anyone, including the owner.
    function withdraw() external {
        uint256 bal = address(this).balance;
        if (bal == 0) revert NothingToWithdraw();
        (bool ok, ) = TREASURY.call{value: bal}("");
        require(ok, "withdraw failed");
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  STATE — derived purely from calor. Nothing redundant is stored.
    // ══════════════════════════════════════════════════════════════════════════

    function calor(uint256 id) public view returns (uint16) {
        _requireOwned(id);
        return _pingus[id].calor;
    }

    function hechosCount(uint256 id) public view returns (uint8) {
        _requireOwned(id);
        return _pingus[id].hechosCount;
    }

    function hasBred(uint256 id) public view returns (bool) {
        _requireOwned(id);
        return _pingus[id].flags & FLAG_HAS_BRED != 0;
    }

    function genLocked(uint256 id) public view returns (bool) {
        _requireOwned(id);
        return _pingus[id].flags & FLAG_GEN_LOCKED != 0;
    }

    function parentsOf(uint256 id) public view returns (uint16 parentA, uint16 parentB) {
        _requireOwned(id);
        Pingu storage p = _pingus[id];
        return (p.parentA, p.parentB);
    }

    function bornAt(uint256 id) public view returns (uint32) {
        _requireOwned(id);
        return _pingus[id].bornAt;
    }

    /// @notice 0 HIELO · 1 DESHIELO · 2 CORRIENTE · 3 VAPOR. Pure fn of calor.
    function generacion(uint256 id) public view returns (uint8) {
        _requireOwned(id);
        Pingu storage p = _pingus[id];
        if (p.flags & FLAG_GEN_LOCKED != 0) return 1; // EL PRIMERO, forever
        uint16 c = p.calor;
        if (c >= CALOR_GEN_3) return 3;
        if (c >= CALOR_GEN_2) return 2;
        if (c >= CALOR_GEN_1) return 1;
        return 0;
    }

    /// @notice Global sub-state index 0..11 = generacion * 3 + subState.
    ///         Bands per `08-tech/config/generations.json`.
    function estado(uint256 id) public view returns (uint8) {
        _requireOwned(id);
        Pingu storage p = _pingus[id];
        uint16 c = p.calor;

        if (p.flags & FLAG_GEN_LOCKED != 0) {
            // EL PRIMERO is clamped into the GEN 1 bands. It cannot thaw further.
            if (c < CALOR_GEN_1) c = CALOR_GEN_1;
            if (c > CALOR_GEN_2 - 1) c = CALOR_GEN_2 - 1;
        }

        if (c < CALOR_GEN_1) {
            // GEN 0: HIELO_SOLIDO 0 · HIELO_SUDADO 1 · HIELO_TENSO 2
            return uint8(c);
        }
        if (c < CALOR_GEN_2) {
            // GEN 1: GRIETA 3 · ESQUINA_IDA 4-5 · MEDIO_LIBRE 6-7
            if (c == 3) return 3;
            if (c <= 5) return 4;
            return 5;
        }
        if (c < CALOR_GEN_3) {
            // GEN 2: CORRIENTE_BAJA 8-9 · MEDIA 10-12 · ALTA 13-14
            if (c <= 9) return 6;
            if (c <= 12) return 7;
            return 8;
        }
        // GEN 3: VAPOR_BAJO 15-17 · VAPOR_ALTO 18-20 · HECHO 21+
        if (c <= 17) return 9;
        if (c <= 20) return 10;
        return 11;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  THAW — pushed by donedone.io. The holder never pays. Non-negotiable.
    // ══════════════════════════════════════════════════════════════════════════

    modifier onlyAttestor() {
        if (msg.sender != attestor) revert NotAttestor();
        _;
    }

    /// @notice Batch thaw. Gas paid by the donedone.io attestor, NOT by holders.
    /// @dev `calor` can only ever increase. A zero or overflowing delta reverts.
    ///      There is no function anywhere that decreases `calor`.
    function attestBatch(
        uint256[] calldata ids,
        uint16[] calldata calorDelta,
        bytes32 ledgerRoot
    ) external onlyAttestor {
        uint256 n = ids.length;
        if (n != calorDelta.length) revert LengthMismatch();
        for (uint256 i; i < n; ++i) {
            _requireOwned(ids[i]);
            Pingu storage p = _pingus[ids[i]];
            uint16 prev = p.calor;
            uint16 next;
            unchecked {
                next = prev + calorDelta[i];
            }
            if (next <= prev) revert NotMonotonic(); // no decrease, no overflow
            p.calor = next;
            p.hechosCount += 1;
        }
        emit Thawed(ledgerRoot, ids, calorDelta);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  EL ENCUENTRO — one transaction, zero fee, partner pays nothing.
    // ══════════════════════════════════════════════════════════════════════════

    function windowOpen() public view returns (bool) {
        return
            (block.timestamp >= VENTANA_I_OPEN && block.timestamp < VENTANA_I_CLOSE) ||
            (block.timestamp >= VENTANA_II_OPEN && block.timestamp < VENTANA_II_CLOSE);
    }

    /// @notice Breed two GEN 2 pingus. Initiator submits and receives the child.
    ///         Partner consents off-chain via EIP-712 and pays absolutely nothing.
    /// @dev No `payable`, no fee, no fee setter. Permanently free of protocol fee.
    function encuentro(uint256 initiatorId, uint256 partnerId, uint256 deadline, bytes calldata partnerSig) external {
        if (ownerOf(initiatorId) != msg.sender) revert NotOwner();
        if (block.timestamp > deadline) revert Expired();
        if (!windowOpen()) revert WindowClosed();
        if (initiatorId == partnerId) revert SelfEncuentro();

        // GEN 3 cannot breed. GEN 0 and GEN 1 cannot breed. EL PRIMERO is
        // permanently GEN 1, so this single check also locks it out forever.
        if (generacion(initiatorId) != 2) revert NotCorriente();
        if (generacion(partnerId) != 2) revert NotCorriente();

        Pingu storage a = _pingus[initiatorId];
        Pingu storage b = _pingus[partnerId];
        if (a.flags & FLAG_HAS_BRED != 0) revert AlreadyBred();
        if (b.flags & FLAG_HAS_BRED != 0) revert AlreadyBred();

        address partnerOwner = ownerOf(partnerId);
        _verify712(partnerId, initiatorId, deadline, partnerSig, partnerOwner);

        a.flags |= FLAG_HAS_BRED;
        b.flags |= FLAG_HAS_BRED;

        uint256 childId = GENESIS() + _childrenMinted + 1;
        if (childId > HARD_CAP()) revert CapReached();
        _childrenMinted += 1;

        // Child is born at calor 0, GEN 0 HIELO. It inherits no progress.
        _pingus[childId] = Pingu({
            calor: 0,
            hechosCount: 0,
            flags: 0,
            parentA: uint16(initiatorId),
            parentB: uint16(partnerId),
            bornAt: uint32(block.timestamp)
        });
        _safeMint(msg.sender, childId);

        emit Encuentro(initiatorId, partnerId, childId, partnerOwner);
    }

    function encuentroDigest(
        uint256 partnerId,
        uint256 initiatorId,
        uint256 nonce,
        uint256 deadline
    ) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(ENCUENTRO_TYPEHASH, partnerId, initiatorId, nonce, deadline)));
    }

    function _verify712(
        uint256 partnerId,
        uint256 initiatorId,
        uint256 deadline,
        bytes calldata sig,
        address signer
    ) private {
        uint256 nonce = nonces[signer];
        bytes32 digest = encuentroDigest(partnerId, initiatorId, nonce, deadline);
        if (!SignatureChecker.isValidSignatureNow(signer, digest, sig)) revert BadSignature();
        nonces[signer] = nonce + 1;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  METADATA — four CIDs pinned pre-mint. Only the pointer moves, by calor.
    // ══════════════════════════════════════════════════════════════════════════

    function baseCID(uint8 gen) external view returns (string memory) {
        if (gen > 3) revert BadGen();
        return _baseCID[gen];
    }

    /// @dev Correctable only until `freezeMetadata()`. Irreversible after.
    function setBaseCID(uint8 gen, string calldata cid) external onlyOwner {
        if (metadataFrozen) revert MetadataIsFrozen();
        if (gen > 3) revert BadGen();
        _baseCID[gen] = cid;
        emit BaseCIDSet(gen, cid);
    }

    /// @notice One-time, irreversible. After this the art pointers are frozen.
    function freezeMetadata() external onlyOwner {
        if (metadataFrozen) revert MetadataIsFrozen();
        metadataFrozen = true;
        emit MetadataFrozenForever();
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        _requireOwned(id);
        uint8 g = generacion(id);
        uint8 e = estado(id);
        return string.concat(_baseCID[g], "/", Strings.toString(e), "/", Strings.toString(id), ".json");
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  ERC-2981 — recipient follows ownership. No recipient setter exists.
    // ══════════════════════════════════════════════════════════════════════════

    function royaltyInfo(uint256 id, uint256 salePrice) external view returns (address, uint256) {
        _requireOwned(id);
        return (owner(), (salePrice * ROYALTY_BPS) / 10_000);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}
