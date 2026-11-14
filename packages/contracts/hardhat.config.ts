import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Env is OPTIONAL. `compile`, `test` and `typecheck` must work with no env at
// all — the RPC urls and the deploy key are only read when a live network is
// selected, and a missing PRIVATE_KEY simply yields an empty accounts list.
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ?? "";
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL ?? "";
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";

const accounts = PRIVATE_KEY ? [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 800 },
      evmVersion: "cancun",
      viaIR: false,
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
      // generous so that the cap tests can mint in large batches
      blockGasLimit: 60_000_000,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts,
      chainId: 11155111,
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts,
      chainId: 1,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY ?? "",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts",
  },
  mocha: {
    timeout: 300_000,
  },
};

export default config;
