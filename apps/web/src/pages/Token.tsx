/**
 * One pingu, all four of its futures.
 *
 * The generation switch is the point of the page: the same nine traits render
 * as four different artworks, and only earned calor moves between them. The
 * page says so plainly rather than calling it an "evolution".
 */
import { useMemo, useState } from "react";

import { PinguArt } from "@/components/PinguArt.tsx";
import { GEN_CALOR, pingu } from "@/lib/art.ts";
import { label, num, pct } from "@/lib/format.ts";
import { href } from "@/lib/router.ts";
import {
  GENESIS_SUPPLY,
  LAYER_ORDER,
  countOf,
  isValidId,
  layerByKey,
  rarityRank,
  stateFor,
  traitDef,
} from "@pingus/core";

export function Token({ id }: { id: number }) {
  const [gen, setGen] = useState(0);

  if (!isValidId(id)) {
    return (
      <main className="section" style={{ paddingTop: "calc(var(--header-h) + 5rem)" }}>
        <div className="shell">
          <h1 className="h-xl">no existe.</h1>
          <p className="lede dim" style={{ marginTop: "1rem" }}>
            hay 2.369 pingus genesis. ese número no es uno de ellos.
          </p>
          <a className="btn" style={{ marginTop: "2rem" }} href={href("/gallery")}>
            volver a la colección
          </a>
        </div>
      </main>
    );
  }

  return <TokenView id={id} gen={gen} setGen={setGen} />;
}

function TokenView({
  id,
  gen,
  setGen,
}: {
  id: number;
  gen: number;
  setGen: (g: number) => void;
}) {
  const p = useMemo(() => pingu(id), [id]);
  const calor = GEN_CALOR[gen] ?? 0;
  const state = useMemo(() => stateFor(p, calor), [p, calor]);
  const rank = useMemo(() => rarityRank(id), [id]);

  return (
    <main className="section" style={{ paddingTop: "calc(var(--header-h) + 3rem)" }}>
      <div className="shell">
        <div className="section-tag">
          <b>#{id}</b>
          <span className="mono dim">{p.band.toLowerCase()}</span>
          <span className="mono dim" style={{ marginLeft: "auto" }}>
            rareza {rank} / {num(GENESIS_SUPPLY)}
          </span>
        </div>

        <div className="token">
          <div className="token-col">
            <div className="token-art">
              <PinguArt
                id={id}
                calor={calor}
                size={1000}
                title={`pingu #${id} en ${state.gen.key.toLowerCase()}`}
              />
            </div>

            <div className="gen-switch" role="group" aria-label="generación">
              {["nace", "calienta", "hace", "hecho"].map((word, i) => (
                <button
                  key={word}
                  type="button"
                  aria-pressed={gen === i}
                  onClick={() => setGen(i)}
                >
                  {i} · {word}
                </button>
              ))}
            </div>

            <p className="mono dim" style={{ marginTop: "0.9rem", lineHeight: 1.7 }}>
              las nueve capas son las mismas en los cuatro. lo único que cambia
              es lo que se ha hecho.
            </p>
          </div>

          <div>
            <h1 className="h-md" style={{ marginBottom: "0.4rem" }}>
              {state.gen.word.toLowerCase()}
            </h1>
            <p className="mono dim" style={{ marginBottom: "1.6rem" }}>
              gen {state.generacion} · {label(state.estado.key)}
            </p>

            <div className="rows" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
              <div className="row">
                <span>calor</span>
                <span>{calor}</span>
              </div>
              <div className="row">
                <span>estado</span>
                <span>{state.estadoIndex} / 11</span>
              </div>
              <div className="row">
                <span>puede encontrarse</span>
                <span>{state.can_breed ? "sí" : "no"}</span>
              </div>
              <div className="row">
                <span>puede reclamar prenda</span>
                <span>{state.can_claim ? "sí" : "no"}</span>
              </div>
            </div>

            <p className="mono dim" style={{ margin: "1.6rem 0 0.8rem" }}>
              capas
            </p>
            <div className="traits">
              {LAYER_ORDER.map((key) => {
                const value = p.traits[key];
                const count = countOf(key, value);
                const def = traitDef(key, value);
                return (
                  <div className="trait" key={key}>
                    <span>{layerByKey(key).label.toLowerCase()}</span>
                    <b>{label(value)}</b>
                    <i>
                      {count} · {pct(count / GENESIS_SUPPLY)}
                      {def?.garment ? ` · ${def.garment.toLowerCase()}` : ""}
                    </i>
                  </div>
                );
              })}
            </div>

            {p.traits.Ruptura ? (
              <div className="notice warn" style={{ marginTop: "1.4rem" }}>
                <b>ruptura</b>
                <span>{label(p.traits.Ruptura)}</span>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.8rem", flexWrap: "wrap" }}>
              <a className="btn btn-sm" href={href(`/pingu/${id > 1 ? id - 1 : GENESIS_SUPPLY}`)}>
                ← anterior
              </a>
              <a className="btn btn-sm" href={href(`/pingu/${id < GENESIS_SUPPLY ? id + 1 : 1}`)}>
                siguiente →
              </a>
              <a className="btn btn-sm" href={href("/gallery")}>
                la colección
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
