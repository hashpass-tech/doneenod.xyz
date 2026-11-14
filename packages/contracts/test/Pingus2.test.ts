import { expect } from "chai";
import { ethers, artifacts } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import * as fs from "node:fs";
import * as path from "node:path";

const MINT_PRICE = ethers.parseEther("0.01");
const ROYALTY_BPS = 500n;
const TRAITS_ROOT = ethers.keccak256(ethers.toUtf8Bytes("08-tech/output/traits.json"));
const TRAITS_URI = "ipfs://bafyTraitsManifest";
const BASE_CIDS: [string, string, string, string] = [
  "ipfs://gen0HIELO",
  "ipfs://gen1DESHIELO",
  "ipfs://gen2CORRIENTE",
  "ipfs://gen3VAPOR",
];

const ENCUENTRO_TYPES = {
  Encuentro: [
    { name: "partnerId", type: "uint256" },
    { name: "initiatorId", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

type Deployed = Awaited<ReturnType<typeof deploy>>;

async function deploy(genesisCap: bigint, hardCap: bigint) {
  const [deployer, owner, treasury, attestor, alice, bob, carol, dave] = await ethers.getSigners();
  const now = BigInt(await time.latest());

  const saleOpenAt = now - 10n;
  const saleCloseAt = now + 1_000_000n;
  const ventanaIOpen = now - 5n;
  const ventanaIClose = now + 1_000n;
  const ventanaIIOpen = now + 5_000n;
  const ventanaIIClose = now + 6_000n;

  const factory = await ethers.getContractFactory("Pingus2Harness", deployer);
  const c = await factory.deploy(
    genesisCap,
    hardCap,
    owner.address,
    treasury.address,
    attestor.address,
    MINT_PRICE,
    ROYALTY_BPS,
    TRAITS_ROOT,
    TRAITS_URI,
    [saleOpenAt, saleCloseAt, ventanaIOpen, ventanaIClose, ventanaIIOpen, ventanaIIClose],
    BASE_CIDS,
  );
  await c.waitForDeployment();

  return {
    c,
    deployer,
    owner,
    treasury,
    attestor,
    alice,
    bob,
    carol,
    dave,
    schedule: { saleOpenAt, saleCloseAt, ventanaIOpen, ventanaIClose, ventanaIIOpen, ventanaIIClose },
  };
}

/** Default fixture: 6 genesis (token 6 = EL PRIMERO), hard cap 12. */
async function fixture() {
  return deploy(6n, 12n);
}

/** Tight-cap fixture for the HARD_CAP breeding row: only one child fits. */
async function tightCapFixture() {
  return deploy(6n, 7n);
}

async function mintTo(d: Deployed, who: HardhatEthersSigner, qty: bigint) {
  await d.c.connect(who).mint(qty, { value: MINT_PRICE * qty });
}

/** donedone.io pushes calor. Holders never pay. */
async function thaw(d: Deployed, ids: bigint[], deltas: bigint[]) {
  await d.c
    .connect(d.attestor)
    .attestBatch(ids, deltas, ethers.keccak256(ethers.toUtf8Bytes("ledger")));
}

async function signEncuentro(
  d: Deployed,
  signer: HardhatEthersSigner,
  partnerId: bigint,
  initiatorId: bigint,
  deadline: bigint,
  nonceOverride?: bigint,
) {
  const net = await ethers.provider.getNetwork();
  const domain = {
    name: "PINGUS2",
    version: "1",
    chainId: net.chainId,
    verifyingContract: await d.c.getAddress(),
  };
  const nonce = nonceOverride ?? (await d.c.nonces(signer.address));
  return signer.signTypedData(domain, ENCUENTRO_TYPES, { partnerId, initiatorId, nonce, deadline });
}

function writableFunctions(abi: readonly any[]) {
  return abi.filter((e) => e.type === "function" && e.stateMutability !== "view" && e.stateMutability !== "pure");
}

let PINGUS2_ABI: readonly any[];
let PINGUS2_SOURCE: string;

before(async () => {
  PINGUS2_ABI = (await artifacts.readArtifact("Pingus2")).abi;
  PINGUS2_SOURCE = fs.readFileSync(path.resolve(__dirname, "..", "contracts", "Pingus2.sol"), "utf8");
});

describe("Pingus2", () => {
  // ════════════════════════════════════════════════════════════════════════════
  //  Published constants — these are the numbers in 04-collection-spec/00-supply.md
  // ════════════════════════════════════════════════════════════════════════════
  describe("published supply constants (production contract)", () => {
    it("GENESIS = 2369, HARD_CAP = 5922, EL_PRIMERO = 2369, RESERVE = 162, maxPerWallet = 3", async () => {
      const [, owner, treasury, attestor] = await ethers.getSigners();
      const now = BigInt(await time.latest());
      const f = await ethers.getContractFactory("Pingus2");
      const p = await f.deploy(
        owner.address,
        treasury.address,
        attestor.address,
        MINT_PRICE,
        ROYALTY_BPS,
        TRAITS_ROOT,
        TRAITS_URI,
        [now, now + 100n, now, now + 100n, now + 200n, now + 300n],
        BASE_CIDS,
      );
      expect(await p.GENESIS()).to.equal(2369n);
      expect(await p.HARD_CAP()).to.equal(5922n);
      expect(await p.EL_PRIMERO()).to.equal(2369n);
      expect(await p.RESERVE()).to.equal(162n);
      expect(await p.maxPerWallet()).to.equal(3n);
      expect(await p.CALOR_GEN_1()).to.equal(3n);
      expect(await p.CALOR_GEN_2()).to.equal(8n);
      expect(await p.CALOR_GEN_3()).to.equal(15n);
      expect(await p.TRAITS_ROOT()).to.equal(TRAITS_ROOT);
      expect(await p.TRAITS_URI()).to.equal(TRAITS_URI);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  Mint path
  // ════════════════════════════════════════════════════════════════════════════
  describe("mint — the only genesis path", () => {
    it("mints sequentially from id 1, at calor 0 / GEN 0 / estado 0", async () => {
      const d = await loadFixture(fixture);
      expect(await d.c.saleOpen()).to.equal(true);
      await mintTo(d, d.alice, 2n);

      expect(await d.c.totalSupply()).to.equal(2n);
      expect(await d.c.totalMintedGenesis()).to.equal(2n);
      expect(await d.c.mintedBy(d.alice.address)).to.equal(2n);
      expect(await d.c.balanceOf(d.alice.address)).to.equal(2n);
      expect(await d.c.ownerOf(1n)).to.equal(d.alice.address);
      expect(await d.c.ownerOf(2n)).to.equal(d.alice.address);
      expect(await d.c.calor(1n)).to.equal(0n);
      expect(await d.c.generacion(1n)).to.equal(0n);
      expect(await d.c.estado(1n)).to.equal(0n);
      expect(await d.c.hechosCount(1n)).to.equal(0n);
      expect(await d.c.hasBred(1n)).to.equal(false);
      expect(await d.c.parentsOf(1n)).to.deep.equal([0n, 0n]);
      expect(await d.c.mintPrice()).to.equal(MINT_PRICE);
    });

    it("enforces exact payment and non-zero quantity", async () => {
      const d = await loadFixture(fixture);
      await expect(d.c.connect(d.alice).mint(1n, { value: 0n })).to.be.revertedWithCustomError(d.c, "WrongPayment");
      await expect(d.c.connect(d.alice).mint(2n, { value: MINT_PRICE })).to.be.revertedWithCustomError(
        d.c,
        "WrongPayment",
      );
      await expect(d.c.connect(d.alice).mint(0n, { value: 0n })).to.be.revertedWithCustomError(d.c, "BadQuantity");
    });

    it("enforces max_per_wallet = 3 (traits.json)", async () => {
      const d = await loadFixture(fixture);
      await expect(d.c.connect(d.alice).mint(4n, { value: MINT_PRICE * 4n })).to.be.revertedWithCustomError(
        d.c,
        "MaxPerWallet",
      );
      await mintTo(d, d.alice, 3n);
      await expect(d.c.connect(d.alice).mint(1n, { value: MINT_PRICE })).to.be.revertedWithCustomError(
        d.c,
        "MaxPerWallet",
      );
      expect(await d.c.mintedBy(d.alice.address)).to.equal(3n);
    });

    it("reserve (162) goes to TREASURY through the SAME public, paid, capped mint()", async () => {
      const d = await loadFixture(fixture);
      // treasury is allowed a larger *quantity* (RESERVE), nothing else
      await expect(d.c.connect(d.treasury).mint(5n, { value: 0n })).to.be.revertedWithCustomError(d.c, "WrongPayment");
      await mintTo(d, d.treasury, 5n);
      expect(await d.c.mintedBy(d.treasury.address)).to.equal(5n);
      expect(await d.c.totalMintedGenesis()).to.equal(5n);
      // still bound by the genesis cap
      await expect(d.c.connect(d.treasury).mint(2n, { value: MINT_PRICE * 2n })).to.be.revertedWithCustomError(
        d.c,
        "GenesisCapReached",
      );
      // proceeds can only go to the immutable TREASURY
      const before = await ethers.provider.getBalance(d.treasury.address);
      await d.c.connect(d.alice).withdraw();
      expect(await ethers.provider.getBalance(d.treasury.address)).to.equal(before + MINT_PRICE * 5n);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  TEST MATRIX — 02-contract-spec.md
  // ════════════════════════════════════════════════════════════════════════════
  describe("spec test matrix", () => {
    it("ROW 1 — mint beyond GENESIS via public mint: revert", async () => {
      const d = await loadFixture(fixture); // GENESIS = 6
      await mintTo(d, d.alice, 3n);
      await mintTo(d, d.bob, 2n); // 5 minted
      // a quantity that straddles the cap reverts
      await expect(d.c.connect(d.carol).mint(3n, { value: MINT_PRICE * 3n })).to.be.revertedWithCustomError(
        d.c,
        "GenesisCapReached",
      );
      await mintTo(d, d.carol, 1n); // exactly 6
      expect(await d.c.totalMintedGenesis()).to.equal(await d.c.GENESIS());
      // and once exhausted the sale is closed forever
      expect(await d.c.saleOpen()).to.equal(false);
      await expect(d.c.connect(d.dave).mint(1n, { value: MINT_PRICE })).to.be.revertedWithCustomError(
        d.c,
        "SaleClosed",
      );
    });

    it("ROW 2 — any owner-callable mint path exists: NO SUCH FUNCTION", async () => {
      const writable = writableFunctions(PINGUS2_ABI);

      // (a) the only writable function whose name mentions minting is `mint`
      const mintish = writable.filter((f) => /mint/i.test(f.name)).map((f) => f.name);
      expect(mintish).to.deep.equal(["mint"]);

      // (b) `mint` takes a quantity only — it cannot mint *to* an arbitrary address
      const mintFn = PINGUS2_ABI.find((e) => e.type === "function" && e.name === "mint");
      expect(mintFn.inputs.map((i: any) => i.type)).to.deep.equal(["uint256"]);
      expect(mintFn.inputs.map((i: any) => i.name)).to.deep.equal(["qty"]);
      expect(mintFn.stateMutability).to.equal("payable");

      // (c) no admin/airdrop/reserve style aliases
      const forbidden =
        /^(ownerMint|adminMint|mintTo|mintFor|mintForAddress|mintReserve|reserveMint|teamMint|devMint|batchMint|safeMint|airdrop|gift|claim|premint|preMint)/i;
      expect(writable.filter((f) => forbidden.test(f.name)).map((f) => f.name)).to.deep.equal([]);

      // (d) the complete set of writable functions is exactly this allowlist
      expect(writable.map((f) => f.name).sort()).to.deep.equal(
        [
          "approve",
          "attestBatch",
          "encuentro",
          "freezeMetadata",
          "mint",
          "renounceOwnership",
          "safeTransferFrom",
          "safeTransferFrom",
          "setApprovalForAll",
          "setBaseCID",
          "transferFrom",
          "transferOwnership",
          "withdraw",
        ].sort(),
      );

      // (e) source level: exactly two `_safeMint(` call sites, and no raw `_mint(`
      const code = PINGUS2_SOURCE.split("\n")
        .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l))
        .join("\n");
      const safeMintCalls = code.match(/_safeMint\(/g) ?? [];
      expect(safeMintCalls.length, "exactly two mint call sites: mint() and encuentro()").to.equal(2);
      expect(/[^e]_mint\(/.test(code), "no raw _mint call site").to.equal(false);
    });

    it("ROW 3 — encuentro from a GEN 0 / GEN 1 / GEN 3 parent: revert NotCorriente", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 3n); // 1,2,3
      await mintTo(d, d.bob, 2n); // 4,5
      const deadline = BigInt(await time.latest()) + 600n;

      // token 1 GEN 0 (calor 0), token 2 GEN 1 (calor 3), token 3 GEN 3 (calor 15)
      await thaw(d, [2n, 3n, 4n], [3n, 15n, 8n]);
      expect(await d.c.generacion(1n)).to.equal(0n);
      expect(await d.c.generacion(2n)).to.equal(1n);
      expect(await d.c.generacion(3n)).to.equal(3n);
      expect(await d.c.generacion(4n)).to.equal(2n);

      for (const bad of [1n, 2n, 3n]) {
        const sig = await signEncuentro(d, d.bob, 4n, bad, deadline);
        await expect(d.c.connect(d.alice).encuentro(bad, 4n, deadline, sig)).to.be.revertedWithCustomError(
          d.c,
          "NotCorriente",
        );
      }

      // and symmetrically when the *partner* is not GEN 2 — GEN 3 cannot breed
      await thaw(d, [1n], [8n]); // token 1 -> GEN 2
      await thaw(d, [5n], [15n]); // token 5 -> GEN 3
      const sig2 = await signEncuentro(d, d.bob, 5n, 1n, deadline);
      await expect(d.c.connect(d.alice).encuentro(1n, 5n, deadline, sig2)).to.be.revertedWithCustomError(
        d.c,
        "NotCorriente",
      );
    });

    it("ROW 4 — encuentro twice with the same pingu: revert AlreadyBred", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 3n); // 1,2,3
      await mintTo(d, d.bob, 2n); // 4,5
      await thaw(d, [1n, 2n, 4n, 5n], [8n, 8n, 8n, 8n]);
      const deadline = BigInt(await time.latest()) + 600n;

      const sig1 = await signEncuentro(d, d.bob, 4n, 1n, deadline);
      await d.c.connect(d.alice).encuentro(1n, 4n, deadline, sig1);
      expect(await d.c.hasBred(1n)).to.equal(true);
      expect(await d.c.hasBred(4n)).to.equal(true);

      // initiator already bred
      const sig2 = await signEncuentro(d, d.bob, 5n, 1n, deadline);
      await expect(d.c.connect(d.alice).encuentro(1n, 5n, deadline, sig2)).to.be.revertedWithCustomError(
        d.c,
        "AlreadyBred",
      );
      // partner already bred
      const sig3 = await signEncuentro(d, d.bob, 4n, 2n, deadline);
      await expect(d.c.connect(d.alice).encuentro(2n, 4n, deadline, sig3)).to.be.revertedWithCustomError(
        d.c,
        "AlreadyBred",
      );
    });

    it("ROW 5 — encuentro with a forged partner signature: revert", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 3n);
      await mintTo(d, d.bob, 2n);
      await thaw(d, [1n, 2n, 4n, 5n], [8n, 8n, 8n, 8n]);
      const deadline = BigInt(await time.latest()) + 600n;

      // signed by the wrong wallet
      const forged = await signEncuentro(d, d.carol, 4n, 1n, deadline);
      await expect(d.c.connect(d.alice).encuentro(1n, 4n, deadline, forged)).to.be.revertedWithCustomError(
        d.c,
        "BadSignature",
      );
      // the initiator signing on the partner's behalf
      const selfSigned = await signEncuentro(d, d.alice, 4n, 1n, deadline);
      await expect(d.c.connect(d.alice).encuentro(1n, 4n, deadline, selfSigned)).to.be.revertedWithCustomError(
        d.c,
        "BadSignature",
      );
      // right signer, wrong token (consent is bound to the exact pairing)
      const wrongPairing = await signEncuentro(d, d.bob, 5n, 1n, deadline);
      await expect(d.c.connect(d.alice).encuentro(1n, 4n, deadline, wrongPairing)).to.be.revertedWithCustomError(
        d.c,
        "BadSignature",
      );
      // replay of a consumed signature
      const good = await signEncuentro(d, d.bob, 4n, 1n, deadline);
      await d.c.connect(d.alice).encuentro(1n, 4n, deadline, good);
      await expect(d.c.connect(d.alice).encuentro(2n, 5n, deadline, good)).to.be.revertedWithCustomError(
        d.c,
        "BadSignature",
      );
      // an expired deadline
      const past = BigInt(await time.latest()) - 1n;
      const expiredSig = await signEncuentro(d, d.bob, 5n, 2n, past);
      await expect(d.c.connect(d.alice).encuentro(2n, 5n, past, expiredSig)).to.be.revertedWithCustomError(
        d.c,
        "Expired",
      );
    });

    it("ROW 6 — encuentro after window close: revert WindowClosed", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 3n);
      await mintTo(d, d.bob, 2n);
      await thaw(d, [1n, 4n], [8n, 8n]);
      expect(await d.c.windowOpen()).to.equal(true);

      // move past VENTANA_I_CLOSE but before VENTANA_II_OPEN
      await time.increaseTo(d.schedule.ventanaIClose + 1n);
      expect(await d.c.windowOpen()).to.equal(false);

      const deadline = BigInt(await time.latest()) + 600n;
      const sig = await signEncuentro(d, d.bob, 4n, 1n, deadline);
      await expect(d.c.connect(d.alice).encuentro(1n, 4n, deadline, sig)).to.be.revertedWithCustomError(
        d.c,
        "WindowClosed",
      );

      // VENTANA_II reopens it; the windows themselves are immutable
      await time.increaseTo(d.schedule.ventanaIIOpen + 1n);
      expect(await d.c.windowOpen()).to.equal(true);
      const deadline2 = BigInt(await time.latest()) + 600n;
      const sig2 = await signEncuentro(d, d.bob, 4n, 1n, deadline2);
      await expect(d.c.connect(d.alice).encuentro(1n, 4n, deadline2, sig2)).to.emit(d.c, "Encuentro");

      // after VENTANA_II closes, nothing can reopen it
      await time.increaseTo(d.schedule.ventanaIIClose + 1n);
      expect(await d.c.windowOpen()).to.equal(false);
    });

    it("ROW 7 — mint beyond HARD_CAP via breeding: revert CapReached", async () => {
      const d = await loadFixture(tightCapFixture); // GENESIS 6, HARD_CAP 7 => one child
      await mintTo(d, d.alice, 3n); // 1,2,3
      await mintTo(d, d.bob, 3n); // 4,5,6 (6 = EL PRIMERO)
      await thaw(d, [1n, 2n, 4n, 5n], [8n, 8n, 8n, 8n]);
      const deadline = BigInt(await time.latest()) + 600n;

      const sig1 = await signEncuentro(d, d.bob, 4n, 1n, deadline);
      await d.c.connect(d.alice).encuentro(1n, 4n, deadline, sig1);
      expect(await d.c.totalSupply()).to.equal(await d.c.HARD_CAP());

      const sig2 = await signEncuentro(d, d.bob, 5n, 2n, deadline);
      await expect(d.c.connect(d.alice).encuentro(2n, 5n, deadline, sig2)).to.be.revertedWithCustomError(
        d.c,
        "CapReached",
      );
    });

    it("ROW 8 — calor decrease attempt: revert NotMonotonic", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 2n);
      await thaw(d, [1n], [5n]);
      expect(await d.c.calor(1n)).to.equal(5n);

      const root = ethers.keccak256(ethers.toUtf8Bytes("ledger"));
      // a zero delta is a no-op and is rejected
      await expect(d.c.connect(d.attestor).attestBatch([1n], [0n], root)).to.be.revertedWithCustomError(
        d.c,
        "NotMonotonic",
      );
      // a wrapping delta (the only way to express a decrease in uint16) is rejected
      await expect(d.c.connect(d.attestor).attestBatch([1n], [65535n], root)).to.be.revertedWithCustomError(
        d.c,
        "NotMonotonic",
      );
      expect(await d.c.calor(1n)).to.equal(5n);

      // and there is no function anywhere that writes calor downward
      const writable = writableFunctions(PINGUS2_ABI).map((f) => f.name);
      expect(writable.filter((n) => /calor|burn|reset|decrease|slash|freeze(?!Metadata)/i.test(n))).to.deep.equal([]);
    });

    it("ROW 9 — non-attestor calls attestBatch: revert", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 1n);
      const root = ethers.keccak256(ethers.toUtf8Bytes("ledger"));
      for (const who of [d.alice, d.owner, d.deployer, d.treasury]) {
        await expect(d.c.connect(who).attestBatch([1n], [1n], root)).to.be.revertedWithCustomError(d.c, "NotAttestor");
      }
      await expect(d.c.connect(d.attestor).attestBatch([1n], [1n], root)).to.emit(d.c, "Thawed");
      // the attestor is immutable — there is no rotation setter
      expect(writableFunctions(PINGUS2_ABI).filter((f) => /attestor/i.test(f.name))).to.deep.equal([]);
      expect(await d.c.attestor()).to.equal(d.attestor.address);
    });

    it("ROW 10 — threshold mutation attempt: NO SUCH FUNCTION", async () => {
      const writable = writableFunctions(PINGUS2_ABI);
      const suspects = writable.filter((f) => /threshold|calor|generacion|estado|gen_|gen1|gen2|gen3/i.test(f.name));
      expect(suspects.map((f) => f.name)).to.deep.equal([]);

      // the thresholds are solidity `constant`s, not storage
      for (const name of ["CALOR_GEN_1", "CALOR_GEN_2", "CALOR_GEN_3"]) {
        const fn = PINGUS2_ABI.find((e) => e.type === "function" && e.name === name);
        expect(fn, `${name} must exist as a read`).to.not.equal(undefined);
        expect(fn.inputs.length, `${name} takes no arguments`).to.equal(0);
        expect(["pure", "view"], `${name} must be read-only`).to.include(fn.stateMutability);
      }
      expect(/uint16 public constant CALOR_GEN_1 = 3;/.test(PINGUS2_SOURCE)).to.equal(true);
      expect(/uint16 public constant CALOR_GEN_2 = 8;/.test(PINGUS2_SOURCE)).to.equal(true);
      expect(/uint16 public constant CALOR_GEN_3 = 15;/.test(PINGUS2_SOURCE)).to.equal(true);
    });

    it("ROW 11 — window extension attempt: NO SUCH FUNCTION", async () => {
      const writable = writableFunctions(PINGUS2_ABI);
      const suspects = writable.filter((f) =>
        /ventana|window|pause|unpause|extend|schedule|sale(Open|Close)|deadline/i.test(f.name),
      );
      expect(suspects.map((f) => f.name)).to.deep.equal([]);

      for (const name of ["VENTANA_I_OPEN", "VENTANA_I_CLOSE", "VENTANA_II_OPEN", "VENTANA_II_CLOSE"]) {
        const fn = PINGUS2_ABI.find((e) => e.type === "function" && e.name === name);
        expect(fn, `${name} must exist as a read`).to.not.equal(undefined);
        expect(fn.stateMutability).to.equal("view");
        expect(new RegExp(`uint64 public immutable ${name};`).test(PINGUS2_SOURCE), `${name} immutable`).to.equal(true);
      }
    });

    it("ROW 12 — breed fee setter: NO SUCH FUNCTION", async () => {
      const writable = writableFunctions(PINGUS2_ABI);
      const suspects = writable.filter((f) => /fee|price|cost|tax|royalt|tribut/i.test(f.name));
      expect(suspects.map((f) => f.name)).to.deep.equal([]);

      // encuentro is not even payable — there is nowhere for a fee to go
      const enc = PINGUS2_ABI.find((e) => e.type === "function" && e.name === "encuentro");
      expect(enc.stateMutability).to.equal("nonpayable");
      expect(enc.inputs.map((i: any) => `${i.type} ${i.name}`)).to.deep.equal([
        "uint256 initiatorId",
        "uint256 partnerId",
        "uint256 deadline",
        "bytes partnerSig",
      ]);
      // mintPrice is immutable, not a storage variable with a setter
      expect(/uint256 public immutable mintPrice;/.test(PINGUS2_SOURCE)).to.equal(true);
    });

    it("ROW 13 — token 2369 (EL PRIMERO) advances past GEN 1: NEVER", async () => {
      const d = await loadFixture(fixture); // EL_PRIMERO == GENESIS == 6 here
      await mintTo(d, d.alice, 3n);
      await mintTo(d, d.bob, 3n); // token 6
      const primero = await d.c.EL_PRIMERO();
      expect(primero).to.equal(6n);
      expect(await d.c.genLocked(primero)).to.equal(true);
      expect(await d.c.genLocked(1n)).to.equal(false);

      // GEN 1 from birth, at calor 0
      expect(await d.c.calor(primero)).to.equal(0n);
      expect(await d.c.generacion(primero)).to.equal(1n);
      expect(await d.c.estado(primero)).to.equal(3n);

      // calor can still accumulate; the generation never moves
      for (const delta of [3n, 5n, 7n, 100n, 1000n]) {
        await thaw(d, [primero], [delta]);
        expect(await d.c.generacion(primero)).to.equal(1n);
        const e = await d.c.estado(primero);
        expect(e >= 3n && e <= 5n, `estado stays inside GEN 1, got ${e}`).to.equal(true);
        expect(await d.c.tokenURI(primero)).to.contain(BASE_CIDS[1]);
      }
      expect(await d.c.calor(primero)).to.equal(1115n);

      // and it can never breed, as initiator or as partner
      await thaw(d, [1n], [8n]);
      const deadline = BigInt(await time.latest()) + 600n;
      const sigA = await signEncuentro(d, d.bob, primero, 1n, deadline);
      await expect(d.c.connect(d.alice).encuentro(1n, primero, deadline, sigA)).to.be.revertedWithCustomError(
        d.c,
        "NotCorriente",
      );
      const sigB = await signEncuentro(d, d.alice, 1n, primero, deadline);
      await expect(d.c.connect(d.bob).encuentro(primero, 1n, deadline, sigB)).to.be.revertedWithCustomError(
        d.c,
        "NotCorriente",
      );
    });

    it("ROW 14 — tokenURI tracks calor across all 4 gens: correct CID + estado", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 1n);
      const id = 1n;

      // every estado band from generations.json, walked monotonically
      const walk: Array<[bigint, number, number, string]> = [
        // [targetCalor, gen, estado, cid]
        [0n, 0, 0, BASE_CIDS[0]], // HIELO_SOLIDO
        [1n, 0, 1, BASE_CIDS[0]], // HIELO_SUDADO
        [2n, 0, 2, BASE_CIDS[0]], // HIELO_TENSO
        [3n, 1, 3, BASE_CIDS[1]], // GRIETA
        [4n, 1, 4, BASE_CIDS[1]], // ESQUINA_IDA
        [5n, 1, 4, BASE_CIDS[1]],
        [6n, 1, 5, BASE_CIDS[1]], // MEDIO_LIBRE
        [7n, 1, 5, BASE_CIDS[1]],
        [8n, 2, 6, BASE_CIDS[2]], // CORRIENTE_BAJA
        [9n, 2, 6, BASE_CIDS[2]],
        [10n, 2, 7, BASE_CIDS[2]], // CORRIENTE_MEDIA
        [12n, 2, 7, BASE_CIDS[2]],
        [13n, 2, 8, BASE_CIDS[2]], // CORRIENTE_ALTA
        [14n, 2, 8, BASE_CIDS[2]],
        [15n, 3, 9, BASE_CIDS[3]], // VAPOR_BAJO
        [17n, 3, 9, BASE_CIDS[3]],
        [18n, 3, 10, BASE_CIDS[3]], // VAPOR_ALTO
        [20n, 3, 10, BASE_CIDS[3]],
        [21n, 3, 11, BASE_CIDS[3]], // HECHO
        [500n, 3, 11, BASE_CIDS[3]],
      ];

      let current = 0n;
      for (const [target, gen, est, cid] of walk) {
        if (target > current) {
          await thaw(d, [id], [target - current]);
          current = target;
        }
        expect(await d.c.calor(id), `calor ${target}`).to.equal(target);
        expect(await d.c.generacion(id), `gen at calor ${target}`).to.equal(BigInt(gen));
        expect(await d.c.estado(id), `estado at calor ${target}`).to.equal(BigInt(est));
        expect(await d.c.tokenURI(id), `uri at calor ${target}`).to.equal(`${cid}/${est}/1.json`);
      }
    });

    it("ROW 15 — metadata change after freezeMetadata(): revert", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 1n);
      expect(await d.c.metadataFrozen()).to.equal(false);

      // only the owner can touch the CIDs at all
      await expect(d.c.connect(d.alice).setBaseCID(0, "ipfs://evil")).to.be.revertedWithCustomError(
        d.c,
        "OwnableUnauthorizedAccount",
      );
      await d.c.connect(d.owner).setBaseCID(0, "ipfs://corrected0");
      expect(await d.c.baseCID(0)).to.equal("ipfs://corrected0");

      await expect(d.c.connect(d.alice).freezeMetadata()).to.be.revertedWithCustomError(
        d.c,
        "OwnableUnauthorizedAccount",
      );
      await expect(d.c.connect(d.owner).freezeMetadata()).to.emit(d.c, "MetadataFrozenForever");
      expect(await d.c.metadataFrozen()).to.equal(true);

      // irreversible — no CID can ever change again, and freeze cannot be undone
      await expect(d.c.connect(d.owner).setBaseCID(0, "ipfs://rug")).to.be.revertedWithCustomError(
        d.c,
        "MetadataIsFrozen",
      );
      await expect(d.c.connect(d.owner).setBaseCID(3, "ipfs://rug")).to.be.revertedWithCustomError(
        d.c,
        "MetadataIsFrozen",
      );
      await expect(d.c.connect(d.owner).freezeMetadata()).to.be.revertedWithCustomError(d.c, "MetadataIsFrozen");
      expect(await d.c.tokenURI(1n)).to.equal("ipfs://corrected0/0/1.json");

      // there is no unfreeze / thaw-metadata function
      expect(
        writableFunctions(PINGUS2_ABI)
          .map((f) => f.name)
          .filter((n) => /unfreeze|unlock|thawMetadata|setTraits/i.test(n)),
      ).to.deep.equal([]);
    });

    it("ROW 16 — child inherits calor/hechos: ALWAYS 0", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 3n);
      await mintTo(d, d.bob, 2n);
      // give the parents a lot of progress
      await thaw(d, [1n, 4n], [12n, 9n]);
      await thaw(d, [1n, 4n], [2n, 1n]);
      expect(await d.c.calor(1n)).to.equal(14n);
      expect(await d.c.calor(4n)).to.equal(10n);
      expect(await d.c.hechosCount(1n)).to.equal(2n);

      const deadline = BigInt(await time.latest()) + 600n;
      const sig = await signEncuentro(d, d.bob, 4n, 1n, deadline);
      await expect(d.c.connect(d.alice).encuentro(1n, 4n, deadline, sig))
        .to.emit(d.c, "Encuentro")
        .withArgs(1n, 4n, 7n, d.bob.address);

      const child = 7n;
      expect(await d.c.ownerOf(child)).to.equal(d.alice.address); // initiator receives it
      expect(await d.c.calor(child)).to.equal(0n);
      expect(await d.c.hechosCount(child)).to.equal(0n);
      expect(await d.c.generacion(child)).to.equal(0n);
      expect(await d.c.estado(child)).to.equal(0n);
      expect(await d.c.hasBred(child)).to.equal(false);
      expect(await d.c.genLocked(child)).to.equal(false);
      expect(await d.c.parentsOf(child)).to.deep.equal([1n, 4n]); // permanent lineage
      expect(await d.c.tokenURI(child)).to.equal(`${BASE_CIDS[0]}/0/7.json`);
      expect(await d.c.totalSupply()).to.equal(6n);
      expect(await d.c.totalMintedGenesis()).to.equal(5n); // children do not touch the genesis count
    });

    it("ROW 17 — partner pays gas on encuentro: NEVER", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 3n);
      await mintTo(d, d.bob, 2n);
      await thaw(d, [1n, 4n], [8n, 8n]);

      const deadline = BigInt(await time.latest()) + 600n;
      const partnerBefore = await ethers.provider.getBalance(d.bob.address);
      const partnerNonceBefore = await ethers.provider.getTransactionCount(d.bob.address);

      // the partner's entire contribution: an off-chain signature
      const sig = await signEncuentro(d, d.bob, 4n, 1n, deadline);

      const initiatorBefore = await ethers.provider.getBalance(d.alice.address);
      const tx = await d.c.connect(d.alice).encuentro(1n, 4n, deadline, sig);
      const receipt = await tx.wait();

      // partner: not one wei, not one transaction
      expect(await ethers.provider.getBalance(d.bob.address)).to.equal(partnerBefore);
      expect(await ethers.provider.getTransactionCount(d.bob.address)).to.equal(partnerNonceBefore);

      // initiator paid exactly the gas and nothing else — no protocol fee
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      expect(await ethers.provider.getBalance(d.alice.address)).to.equal(initiatorBefore - gasCost);
      expect(await ethers.provider.getBalance(await d.c.getAddress())).to.equal(MINT_PRICE * 5n); // mint proceeds only
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  attestBatch — donedone.io pays, holders never do
  // ════════════════════════════════════════════════════════════════════════════
  describe("attestBatch", () => {
    it("batches many tokens in one call, increments hechosCount, emits the ledger root", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 3n);
      await mintTo(d, d.bob, 3n);
      const root = ethers.keccak256(ethers.toUtf8Bytes("week-1"));
      const ids = [1n, 2n, 3n, 4n, 5n];
      const deltas = [1n, 2n, 3n, 4n, 5n];

      const holderBalanceBefore = await ethers.provider.getBalance(d.alice.address);
      await expect(d.c.connect(d.attestor).attestBatch(ids, deltas, root))
        .to.emit(d.c, "Thawed")
        .withArgs(root, ids, deltas);
      expect(await ethers.provider.getBalance(d.alice.address)).to.equal(holderBalanceBefore);

      for (let i = 0; i < ids.length; i++) {
        expect(await d.c.calor(ids[i]!)).to.equal(deltas[i]!);
        expect(await d.c.hechosCount(ids[i]!)).to.equal(1n);
      }
    });

    it("rejects mismatched array lengths and nonexistent tokens", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 1n);
      const root = ethers.ZeroHash;
      await expect(d.c.connect(d.attestor).attestBatch([1n, 2n], [1n], root)).to.be.revertedWithCustomError(
        d.c,
        "LengthMismatch",
      );
      await expect(d.c.connect(d.attestor).attestBatch([99n], [1n], root)).to.be.revertedWithCustomError(
        d.c,
        "ERC721NonexistentToken",
      );
    });

    it("reports a per-token gas figure for the donedone.io opex budget", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 3n);
      await mintTo(d, d.bob, 3n);
      const ids = [1n, 2n, 3n, 4n, 5n, 6n];
      const tx = await d.c
        .connect(d.attestor)
        .attestBatch(ids, ids.map(() => 1n), ethers.ZeroHash);
      const r = await tx.wait();
      const perToken = Number(r!.gasUsed) / ids.length;
      console.log(`        attestBatch: ${r!.gasUsed} gas for ${ids.length} tokens (~${perToken.toFixed(0)}/token)`);
      expect(perToken).to.be.lessThan(40_000);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  EIP-712 + packing + royalties
  // ════════════════════════════════════════════════════════════════════════════
  describe("EIP-712 encuentro consent", () => {
    it("matches the on-chain digest for a real signer and advances the signer nonce", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 3n);
      await mintTo(d, d.bob, 2n);
      await thaw(d, [1n, 2n, 4n, 5n], [8n, 8n, 8n, 8n]);
      const deadline = BigInt(await time.latest()) + 600n;

      const net = await ethers.provider.getNetwork();
      const domain = {
        name: "PINGUS2",
        version: "1",
        chainId: net.chainId,
        verifyingContract: await d.c.getAddress(),
      };
      const value = { partnerId: 4n, initiatorId: 1n, nonce: 0n, deadline };
      const digest = ethers.TypedDataEncoder.hash(domain, ENCUENTRO_TYPES, value);
      expect(await d.c.encuentroDigest(4n, 1n, 0n, deadline)).to.equal(digest);

      const sig = await d.bob.signTypedData(domain, ENCUENTRO_TYPES, value);
      expect(ethers.verifyTypedData(domain, ENCUENTRO_TYPES, value, sig)).to.equal(d.bob.address);

      expect(await d.c.nonces(d.bob.address)).to.equal(0n);
      await d.c.connect(d.alice).encuentro(1n, 4n, deadline, sig);
      expect(await d.c.nonces(d.bob.address)).to.equal(1n);

      // the typehash is the one in the spec
      expect(await d.c.ENCUENTRO_TYPEHASH()).to.equal(
        ethers.keccak256(
          ethers.toUtf8Bytes("Encuentro(uint256 partnerId,uint256 initiatorId,uint256 nonce,uint256 deadline)"),
        ),
      );
    });

    it("requires the initiator to own the initiating pingu and rejects self-pairing", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 3n);
      await mintTo(d, d.bob, 2n);
      await thaw(d, [1n, 4n], [8n, 8n]);
      const deadline = BigInt(await time.latest()) + 600n;
      const sig = await signEncuentro(d, d.bob, 4n, 1n, deadline);
      await expect(d.c.connect(d.carol).encuentro(1n, 4n, deadline, sig)).to.be.revertedWithCustomError(
        d.c,
        "NotOwner",
      );
      const selfSig = await signEncuentro(d, d.alice, 1n, 1n, deadline);
      await expect(d.c.connect(d.alice).encuentro(1n, 1n, deadline, selfSig)).to.be.revertedWithCustomError(
        d.c,
        "SelfEncuentro",
      );
    });
  });

  describe("storage packing", () => {
    it("keeps the whole mutable per-token state in ONE slot", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 3n);
      await mintTo(d, d.bob, 2n);
      await thaw(d, [1n, 4n], [8n, 9n]);
      const deadline = BigInt(await time.latest()) + 600n;
      const sig = await signEncuentro(d, d.bob, 4n, 1n, deadline);
      await d.c.connect(d.alice).encuentro(1n, 4n, deadline, sig);

      // one slot holds calor | hechosCount | flags | parentA | parentB | bornAt
      expect(await d.c.calor(7n)).to.equal(0n);
      const [pa, pb] = await d.c.parentsOf(7n);
      expect([pa, pb]).to.deep.equal([1n, 4n]);
      expect(await d.c.bornAt(7n)).to.be.greaterThan(0n);
      expect(await d.c.hasBred(1n)).to.equal(true);
      expect(await d.c.calor(1n)).to.equal(8n); // breeding did not disturb calor
      expect(await d.c.hechosCount(1n)).to.equal(1n);

      // the struct is the spec's struct
      expect(/uint16 calor;/.test(PINGUS2_SOURCE)).to.equal(true);
      expect(/uint8 hechosCount;/.test(PINGUS2_SOURCE)).to.equal(true);
      expect(/uint8 flags;/.test(PINGUS2_SOURCE)).to.equal(true);
      expect(/uint16 parentA;/.test(PINGUS2_SOURCE)).to.equal(true);
      expect(/uint16 parentB;/.test(PINGUS2_SOURCE)).to.equal(true);
      expect(/uint32 bornAt;/.test(PINGUS2_SOURCE)).to.equal(true);
    });
  });

  describe("ERC-2981 royalties", () => {
    it("pays the owner, with an immutable bps and no recipient setter", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 1n);
      const [receiver, amount] = await d.c.royaltyInfo(1n, ethers.parseEther("10"));
      expect(receiver).to.equal(d.owner.address);
      expect(amount).to.equal((ethers.parseEther("10") * ROYALTY_BPS) / 10_000n);
      expect(await d.c.supportsInterface("0x2a55205a")).to.equal(true); // IERC2981
      expect(await d.c.supportsInterface("0x80ac58cd")).to.equal(true); // IERC721
      expect(await d.c.supportsInterface("0x5b5e139f")).to.equal(true); // IERC721Metadata
    });
  });

  describe("the owner's complete power set", () => {
    it("is exactly: receive royalties, setBaseCID until freeze, freezeMetadata, transfer/renounce ownership", async () => {
      const d = await loadFixture(fixture);
      await mintTo(d, d.alice, 1n);
      const root = ethers.ZeroHash;

      // cannot mint
      expect(writableFunctions(PINGUS2_ABI).filter((f) => /mint/i.test(f.name)).length).to.equal(1);
      await expect(d.c.connect(d.owner).mint(1n, { value: 0n })).to.be.revertedWithCustomError(d.c, "WrongPayment");
      // cannot thaw
      await expect(d.c.connect(d.owner).attestBatch([1n], [1n], root)).to.be.revertedWithCustomError(
        d.c,
        "NotAttestor",
      );
      // cannot move someone else's token
      await expect(
        d.c.connect(d.owner).transferFrom(d.alice.address, d.owner.address, 1n),
      ).to.be.revertedWithCustomError(d.c, "ERC721InsufficientApproval");
      // cannot redirect the proceeds
      expect(await d.c.TREASURY()).to.equal(d.treasury.address);
      expect(writableFunctions(PINGUS2_ABI).filter((f) => /treasury|withdrawTo|sweepTo/i.test(f.name))).to.deep.equal(
        [],
      );
    });
  });
});
