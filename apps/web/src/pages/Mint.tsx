/**
 * The mint app.
 *
 * Deliberately plain: a quantity, a price, a button, and an honest statement
 * of what you are and are not buying. The voice guide forbids hype, so the
 * page sells nothing — it states the mechanic and gets out of the way.
 */
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";

import { PinguArt } from "@/components/PinguArt.tsx";
import {
  ACTIVE_CHAIN,
  CONTRACT_ADDRESS,
  DEMO_MODE,
  explorerTx,
  formatEth,
  shortAddress,
} from "@/lib/chain.ts";
import { num } from "@/lib/format.ts";
import { href } from "@/lib/router.ts";
import { useMint } from "@/lib/useMint.ts";

export function Mint() {
  const [qty, setQty] = useState(1);
  const m = useMint();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const remaining = Math.max(0, m.maxPerWallet - m.mintedByYou);
  const soldOut = m.minted >= m.supply;
  const wrongChain = !DEMO_MODE && isConnected && chainId !== ACTIVE_CHAIN.id;

  // Never let the quantity sit above what the wallet is still allowed.
  useEffect(() => {
    if (remaining > 0 && qty > remaining) setQty(remaining);
  }, [remaining, qty]);

  const injectedConnector = connectors[0];
  const busy = m.phase === "signing" || m.phase === "pending";
  const canMint =
    (DEMO_MODE || isConnected) &&
    !wrongChain &&
    !busy &&
    !soldOut &&
    m.saleOpen &&
    remaining > 0;

  return (
    <main className="section" style={{ paddingTop: "calc(var(--header-h) + 4rem)" }}>
      <div className="shell">
        <div className="section-tag">
          <b>00</b>
          <span className="mono dim">nacimiento</span>
        </div>

        <div className="mint-wrap">
          {/* ------------------------------------------------ left: copy --- */}
          <div>
            <h1 className="h-xl">
              2.369 pingus nacen
              <br />
              dentro de un cubo
              <br />
              de hielo.
            </h1>

            <p className="lede" style={{ marginTop: "1.6rem" }}>
              el cubo no se abre comprando. se abre haciendo.
            </p>

            <p className="mono dim" style={{ marginTop: "2.4rem", letterSpacing: "0.22em" }}>
              nace · calienta · hace · hecho
            </p>

            <div className="rows" style={{ maxWidth: "34rem" }}>
              <div className="row">
                <span>lo que compras</span>
                <span>el cubo y lo que lleva puesto</span>
              </div>
              <div className="row">
                <span>lo que no compras</span>
                <span>el estado. eso se gana.</span>
              </div>
              <div className="row">
                <span>generaciones</span>
                <span>4 — la última es final</span>
              </div>
              <div className="row">
                <span>tope absoluto</span>
                <span>5.922, incluidas las crías</span>
              </div>
            </div>

            <div
              style={{
                marginTop: "2.4rem",
                border: "1px solid var(--rule)",
                padding: "1.2rem",
                maxWidth: "34rem",
              }}
            >
              <p className="mono dim" style={{ marginBottom: "0.9rem" }}>
                lo que recibes al nacer
              </p>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                {[1, 2, 3].map((n) => (
                  <PinguArt
                    key={n}
                    id={400 + n * 211}
                    calor={0}
                    size={200}
                    plain
                    lazy
                    className="tile"
                    title={`ejemplo ${n}`}
                  />
                ))}
              </div>
              <p className="mono dim" style={{ marginTop: "0.9rem", lineHeight: 1.6 }}>
                todos los pingus nacen en gen 0. el arte de arriba es el estado
                inicial, no el final.
              </p>
            </div>
          </div>

          {/* --------------------------------------------- right: panel --- */}
          <div className="panel">
            <div className="panel-head">
              <strong className="mono">nacer</strong>
              <span className="mono dim">
                {DEMO_MODE ? "demo" : ACTIVE_CHAIN.name.toLowerCase()}
              </span>
            </div>

            {DEMO_MODE ? (
              <div className="notice">
                <b>modo demostración</b>
                <span>
                  el contrato está escrito y probado pero aún no desplegado.
                  nada de esto toca una cadena ni cuesta nada. la interfaz es la
                  definitiva.
                </span>
              </div>
            ) : null}

            {wrongChain ? (
              <div className="notice warn">
                <b>red incorrecta</b>
                <span>
                  cambia a {ACTIVE_CHAIN.name.toLowerCase()} para continuar.
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ marginTop: "0.6rem", justifySelf: "start" }}
                  onClick={() => switchChain({ chainId: ACTIVE_CHAIN.id })}
                >
                  cambiar de red
                </button>
              </div>
            ) : null}

            {/* supply */}
            <div className="field">
              <label htmlFor="supply">nacidos</label>
              <div className="supply-bar" id="supply">
                <i style={{ width: `${(m.minted / m.supply) * 100}%` }} />
              </div>
              <div className="row" style={{ marginTop: "0.4rem" }}>
                <span>{m.loading ? "…" : num(m.minted)}</span>
                <span>de {num(m.supply)}</span>
              </div>
            </div>

            {/* quantity */}
            <div className="field">
              <label htmlFor="qty">cantidad</label>
              <div className="stepper">
                <button
                  type="button"
                  aria-label="menos"
                  disabled={qty <= 1 || busy}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <output id="qty">{qty}</output>
                <button
                  type="button"
                  aria-label="más"
                  disabled={qty >= Math.max(1, remaining) || busy}
                  onClick={() => setQty((q) => Math.min(Math.max(1, remaining), q + 1))}
                >
                  +
                </button>
              </div>
              <span className="mono dim" style={{ fontSize: "0.62rem" }}>
                máximo {m.maxPerWallet} por cartera · te quedan {remaining}
              </span>
            </div>

            <div className="rows">
              <div className="row">
                <span>precio</span>
                <span>{formatEth(m.price)} eth</span>
              </div>
              <div className="row">
                <span>cantidad</span>
                <span>× {qty}</span>
              </div>
              <div className="row total">
                <span>total</span>
                <span>{formatEth(m.price * BigInt(qty))} eth</span>
              </div>
            </div>

            {m.error ? (
              <div className="notice bad">
                <b>no se completó</b>
                <span>{m.error}</span>
              </div>
            ) : null}

            {m.phase === "success" ? (
              <Success tokens={m.lastTokens} txHash={m.txHash} onReset={m.reset} />
            ) : (
              <MintButton
                busy={busy}
                phase={m.phase}
                canMint={canMint}
                soldOut={soldOut}
                saleOpen={m.saleOpen}
                remaining={remaining}
                isConnected={DEMO_MODE || isConnected}
                connecting={connecting}
                onConnect={() =>
                  injectedConnector && connect({ connector: injectedConnector })
                }
                onMint={() => m.mint(qty)}
              />
            )}

            <div
              className="rows"
              style={{ marginTop: "1.4rem", borderTop: "1px solid var(--rule)" }}
            >
              {!DEMO_MODE && isConnected ? (
                <div className="row">
                  <span>cartera</span>
                  <button
                    type="button"
                    className="mono"
                    style={{ textDecoration: "underline" }}
                    onClick={() => disconnect()}
                  >
                    {shortAddress(address)} · salir
                  </button>
                </div>
              ) : null}
              <div className="row">
                <span>contrato</span>
                <span>
                  {CONTRACT_ADDRESS ? shortAddress(CONTRACT_ADDRESS) : "sin desplegar"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function MintButton(props: {
  busy: boolean;
  phase: string;
  canMint: boolean;
  soldOut: boolean;
  saleOpen: boolean;
  remaining: number;
  isConnected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onMint: () => void;
}) {
  if (!props.isConnected) {
    return (
      <button
        type="button"
        className="btn btn-solid"
        style={{ width: "100%" }}
        disabled={props.connecting}
        onClick={props.onConnect}
      >
        {props.connecting ? "esperando cartera…" : "conectar cartera"}
      </button>
    );
  }

  const label = props.soldOut
    ? "todos nacidos"
    : !props.saleOpen
      ? "aún no abre"
      : props.remaining === 0
        ? "ya tienes los tuyos"
        : props.phase === "signing"
          ? "firma en tu cartera…"
          : props.phase === "pending"
            ? "esperando el bloque…"
            : "nacer";

  return (
    <button
      type="button"
      className="btn btn-solid"
      style={{ width: "100%" }}
      disabled={!props.canMint}
      onClick={props.onMint}
    >
      {label}
    </button>
  );
}

function Success({
  tokens,
  txHash,
  onReset,
}: {
  tokens: number[];
  txHash: string | null;
  onReset: () => void;
}) {
  return (
    <div>
      <div className="notice">
        <b>nacido en hielo</b>
        <span>
          {tokens.length === 1
            ? "tu pingu no está terminado. eso es lo interesante."
            : "tus pingus no están terminados. eso es lo interesante."}
        </span>
      </div>

      <div className="receipts">
        {tokens.map((id) => (
          <a key={id} className="receipt" href={href(`/pingu/${id}`)}>
            <PinguArt id={id} calor={0} size={300} title={`pingu #${id}`} />
            <figcaption>
              #{id} · gen 0 hielo
            </figcaption>
          </a>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.4rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-sm" onClick={onReset}>
          nacer otro
        </button>
        {txHash ? (
          <a
            className="btn btn-sm"
            href={explorerTx(txHash)}
            target="_blank"
            rel="noreferrer"
          >
            ver transacción
          </a>
        ) : null}
      </div>
    </div>
  );
}
