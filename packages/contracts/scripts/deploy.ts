/**
 * PINGUS² deploy script. All constructor arguments come from the environment —
 * nothing is hardcoded, no keys live in this repo.
 *
 *   OWNER                 owner multisig (royalty recipient, freezeMetadata)
 *   TREASURY              reserve + proceeds destination (immutable)
 *   ATTESTOR              donedone.io attestor multisig (immutable, attestBatch only)
 *   MINT_PRICE_ETH        e.g. "0.045"
 *   ROYALTY_BPS           e.g. "500" (5%), max 1000
 *   TRAITS_ROOT           keccak256 of 08-tech/output/traits.json (0x…, 32 bytes)
 *   TRAITS_URI            ipfs://… full manifest
 *   SALE_OPEN_AT          unix seconds
 *   SALE_CLOSE_AT         unix seconds
 *   VENTANA_I_OPEN        unix seconds
 *   VENTANA_I_CLOSE       unix seconds
 *   VENTANA_II_OPEN       unix seconds
 *   VENTANA_II_CLOSE      unix seconds
 *   BASE_CID_GEN0..3      ipfs://… art CIDs, one per generation
 *
 * Usage: hardhat run scripts/deploy.ts --network sepolia
 */
import { ethers } from "hardhat";

function req(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") throw new Error(`missing required env var: ${name}`);
  return v.trim();
}

function reqUint64(name: string): bigint {
  const v = BigInt(req(name));
  if (v < 0n || v > 2n ** 64n - 1n) throw new Error(`${name} out of uint64 range`);
  return v;
}

async function main() {
  const owner = ethers.getAddress(req("OWNER"));
  const treasury = ethers.getAddress(req("TREASURY"));
  const attestor = ethers.getAddress(req("ATTESTOR"));
  const mintPrice = ethers.parseEther(req("MINT_PRICE_ETH"));
  const royaltyBps = BigInt(req("ROYALTY_BPS"));
  const traitsRoot = req("TRAITS_ROOT");
  const traitsUri = req("TRAITS_URI");

  if (!/^0x[0-9a-fA-F]{64}$/.test(traitsRoot)) throw new Error("TRAITS_ROOT must be a 32-byte hex string");
  if (royaltyBps > 1000n) throw new Error("ROYALTY_BPS must be <= 1000");

  const schedule: [bigint, bigint, bigint, bigint, bigint, bigint] = [
    reqUint64("SALE_OPEN_AT"),
    reqUint64("SALE_CLOSE_AT"),
    reqUint64("VENTANA_I_OPEN"),
    reqUint64("VENTANA_I_CLOSE"),
    reqUint64("VENTANA_II_OPEN"),
    reqUint64("VENTANA_II_CLOSE"),
  ];
  if (schedule[1] <= schedule[0]) throw new Error("SALE_CLOSE_AT must be after SALE_OPEN_AT");
  if (schedule[3] <= schedule[2]) throw new Error("VENTANA_I_CLOSE must be after VENTANA_I_OPEN");
  if (schedule[5] <= schedule[4]) throw new Error("VENTANA_II_CLOSE must be after VENTANA_II_OPEN");

  const baseCIDs: [string, string, string, string] = [
    req("BASE_CID_GEN0"),
    req("BASE_CID_GEN1"),
    req("BASE_CID_GEN2"),
    req("BASE_CID_GEN3"),
  ];

  const [deployer] = await ethers.getSigners();
  console.log("deployer:", await deployer.getAddress());
  console.log("owner:   ", owner);
  console.log("treasury:", treasury);
  console.log("attestor:", attestor);
  console.log("price:   ", ethers.formatEther(mintPrice), "ETH");

  const factory = await ethers.getContractFactory("Pingus2");
  const c = await factory.deploy(
    owner,
    treasury,
    attestor,
    mintPrice,
    royaltyBps,
    traitsRoot,
    traitsUri,
    schedule,
    baseCIDs,
  );
  await c.waitForDeployment();

  const address = await c.getAddress();
  console.log("\nPingus2 deployed at:", address);
  console.log("GENESIS :", (await c.GENESIS()).toString());
  console.log("HARD_CAP:", (await c.HARD_CAP()).toString());
  console.log("\nVerify with:");
  console.log(`  hardhat verify --network ${process.env.HARDHAT_NETWORK ?? "sepolia"} ${address} ...`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
