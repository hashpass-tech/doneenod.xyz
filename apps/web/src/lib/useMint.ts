/**
 * One mint interface, two backends.
 *
 * Components never branch on DEMO_MODE — they consume this hook's state and
 * the page behaves the same whether a contract is configured or not. When the
 * contract is deployed, the demo branch stops being reachable and nothing
 * downstream changes.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { decodeEventLog, type Address } from "viem";
import {
  useAccount,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import {
  CONTRACT_ADDRESS,
  DEMO_MINT_PRICE,
  DEMO_MODE,
  MAX_PER_WALLET,
  pingus2Abi,
} from "./chain.ts";

export type MintPhase = "idle" | "signing" | "pending" | "success" | "error";

export interface MintState {
  /** Genesis tokens minted so far. */
  minted: number;
  /** Genesis supply — 2,369. */
  supply: number;
  price: bigint;
  maxPerWallet: number;
  /** How many this wallet has already taken. */
  mintedByYou: number;
  saleOpen: boolean;
  /** Reads still in flight. */
  loading: boolean;
  phase: MintPhase;
  error: string | null;
  txHash: string | null;
  /** Token ids from the most recent successful mint. */
  lastTokens: number[];
  mint: (quantity: number) => void;
  reset: () => void;
}

const GENESIS = 2369;
const DEMO_KEY = "pingus2:demo-mint";

interface DemoState {
  minted: number;
  byYou: number;
  tokens: number[];
}

function readDemo(): DemoState {
  // A plausible-looking starting point so the supply bar is not empty, offset
  // by whatever this browser has minted in demo mode before.
  const base = 1417;
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DemoState>;
      return {
        minted: base + (parsed.byYou ?? 0),
        byYou: parsed.byYou ?? 0,
        tokens: parsed.tokens ?? [],
      };
    }
  } catch {
    /* corrupt or unavailable storage is not worth a crash */
  }
  return { minted: base, byYou: 0, tokens: [] };
}

function writeDemo(s: DemoState): void {
  try {
    localStorage.setItem(
      DEMO_KEY,
      JSON.stringify({ byYou: s.byYou, tokens: s.tokens })
    );
  } catch {
    /* private mode — the session still works, it just will not persist */
  }
}

export function useMint(): MintState {
  const { address, isConnected } = useAccount();

  // ---------------------------------------------------------------- demo ---
  const [demo, setDemo] = useState<DemoState>(() =>
    DEMO_MODE ? readDemo() : { minted: 0, byYou: 0, tokens: [] }
  );
  const [phase, setPhase] = useState<MintPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [demoTokens, setDemoTokens] = useState<number[]>([]);

  // ---------------------------------------------------------------- real ---
  const contract = CONTRACT_ADDRESS
    ? ({ address: CONTRACT_ADDRESS, abi: pingus2Abi } as const)
    : undefined;

  const reads = useReadContracts({
    allowFailure: false,
    contracts: contract
      ? [
          { ...contract, functionName: "totalMintedGenesis" },
          { ...contract, functionName: "GENESIS" },
          { ...contract, functionName: "mintPrice" },
          { ...contract, functionName: "maxPerWallet" },
          { ...contract, functionName: "saleOpen" },
          {
            ...contract,
            functionName: "mintedBy",
            args: [(address ?? "0x0000000000000000000000000000000000000000") as Address],
          },
        ]
      : [],
    query: {
      enabled: !DEMO_MODE,
      // The supply bar should drift upward on its own while the page is open.
      refetchInterval: 15_000,
    },
  });

  const { writeContract, data: writeHash, reset: resetWrite } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: writeHash,
    query: { enabled: Boolean(writeHash) },
  });

  // Derive the minted token ids from the Transfer logs of our own receipt.
  const realTokens = useMemo(() => {
    if (!receipt.data || !address) return [];
    const ids: number[] = [];
    for (const log of receipt.data.logs) {
      if (
        CONTRACT_ADDRESS &&
        log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()
      ) {
        continue;
      }
      try {
        const decoded = decodeEventLog({
          abi: pingus2Abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "Transfer") {
          const args = decoded.args as unknown as { to: Address; tokenId: bigint };
          if (args.to.toLowerCase() === address.toLowerCase()) {
            ids.push(Number(args.tokenId));
          }
        }
      } catch {
        // Not one of ours — an approval or an unrelated log in the same block.
      }
    }
    return ids;
  }, [receipt.data, address]);

  // Track the real-mode phase off wagmi's machine.
  useEffect(() => {
    if (DEMO_MODE) return;
    if (receipt.isSuccess) setPhase("success");
    else if (receipt.isError) {
      setPhase("error");
      setError("la transacción falló en cadena");
    } else if (writeHash) setPhase("pending");
  }, [writeHash, receipt.isSuccess, receipt.isError]);

  const mint = useCallback(
    (quantity: number) => {
      setError(null);

      if (DEMO_MODE) {
        setPhase("signing");
        // Two beats: one standing in for the wallet prompt, one for the block.
        window.setTimeout(() => setPhase("pending"), 700);
        window.setTimeout(() => {
          setDemo((prev) => {
            const start = prev.minted + 1;
            const tokens = Array.from({ length: quantity }, (_, i) => start + i);
            const next: DemoState = {
              minted: prev.minted + quantity,
              byYou: prev.byYou + quantity,
              tokens: [...prev.tokens, ...tokens],
            };
            writeDemo(next);
            setDemoTokens(tokens);
            return next;
          });
          setPhase("success");
        }, 2300);
        return;
      }

      if (!contract) return;
      setPhase("signing");
      const price = (reads.data?.[2] as bigint | undefined) ?? DEMO_MINT_PRICE;
      writeContract(
        {
          ...contract,
          functionName: "mint",
          args: [BigInt(quantity)],
          value: price * BigInt(quantity),
        },
        {
          onError: (e) => {
            setPhase("error");
            // Rejecting in the wallet is a choice, not a failure.
            setError(
              /user rejected|denied/i.test(e.message)
                ? "firma cancelada"
                : e.message.split("\n")[0] ?? "algo salió mal"
            );
          },
        }
      );
    },
    [contract, reads.data, writeContract]
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
    setDemoTokens([]);
    if (!DEMO_MODE) resetWrite();
  }, [resetWrite]);

  if (DEMO_MODE) {
    return {
      minted: demo.minted,
      supply: GENESIS,
      price: DEMO_MINT_PRICE,
      maxPerWallet: MAX_PER_WALLET,
      mintedByYou: demo.byYou,
      saleOpen: true,
      loading: false,
      phase,
      error,
      txHash: null,
      lastTokens: demoTokens,
      mint,
      reset,
    };
  }

  const d = reads.data as
    | [bigint, bigint, bigint, bigint, boolean, bigint]
    | undefined;

  return {
    minted: d ? Number(d[0]) : 0,
    supply: d ? Number(d[1]) : GENESIS,
    price: d ? d[2] : DEMO_MINT_PRICE,
    maxPerWallet: d ? Number(d[3]) : MAX_PER_WALLET,
    mintedByYou: d && isConnected ? Number(d[5]) : 0,
    saleOpen: d ? d[4] : false,
    loading: reads.isLoading,
    phase,
    error,
    txHash: writeHash ?? null,
    lastTokens: realTokens,
    mint,
    reset,
  };
}
