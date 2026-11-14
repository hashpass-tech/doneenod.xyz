/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Deployed Pingus2 address. Unset ⇒ the app runs in simulated demo mode. */
  readonly VITE_CONTRACT_ADDRESS?: string;
  /** 1 = mainnet, 11155111 = sepolia. Defaults to sepolia. */
  readonly VITE_CHAIN_ID?: string;
  /** Optional RPC override; falls back to the chain's public endpoint. */
  readonly VITE_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
