/**
 * Chain configuration and the demo-mode switch.
 *
 * The contract is written and tested but not deployed. Rather than ship a mint
 * page that cannot be used, the app reads its address from the environment and
 * falls back to a fully simulated local mint when that address is absent. The
 * UI states are identical either way, so pointing the live site at a real
 * deployment is a repository-variable change, not a code change.
 */
import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import type { Address } from "viem";

import { pingus2Abi } from "./abi.ts";

export { pingus2Abi };

const rawAddress = import.meta.env.VITE_CONTRACT_ADDRESS?.trim();

/** A deployed address, or null when the app should simulate. */
export const CONTRACT_ADDRESS: Address | null =
  rawAddress && /^0x[0-9a-fA-F]{40}$/.test(rawAddress)
    ? (rawAddress as Address)
    : null;

/** True when no contract is configured — every write is local and free. */
export const DEMO_MODE = CONTRACT_ADDRESS === null;

const chainId = Number(import.meta.env.VITE_CHAIN_ID ?? sepolia.id);
export const ACTIVE_CHAIN = chainId === mainnet.id ? mainnet : sepolia;

export const wagmiConfig = createConfig({
  chains: [ACTIVE_CHAIN],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(import.meta.env.VITE_RPC_URL || undefined),
    [sepolia.id]: http(import.meta.env.VITE_RPC_URL || undefined),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

/** Mint price in wei. Demo mode uses the launch price from the spec. */
export const DEMO_MINT_PRICE = 40_000_000_000_000_000n; // 0.04 ETH
export const MAX_PER_WALLET = 3;

export function shortAddress(a?: string | null): string {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function explorerTx(hash: string): string {
  const base =
    ACTIVE_CHAIN.id === mainnet.id
      ? "https://etherscan.io"
      : "https://sepolia.etherscan.io";
  return `${base}/tx/${hash}`;
}

/** Format wei as ETH with the fewest digits that stay honest. */
export function formatEth(wei: bigint, maxDecimals = 4): string {
  const whole = wei / 10n ** 18n;
  const frac = wei % 10n ** 18n;
  if (frac === 0n) return `${whole}`;
  const padded = frac.toString().padStart(18, "0").slice(0, maxDecimals);
  const trimmed = padded.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : `${whole}`;
}
