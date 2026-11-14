/**
 * The explorer — all 2,369 tokens, filterable by any of the nine layers.
 *
 * Every tile is drawn from trait data in the browser, so there is no API and
 * no image host behind this page. The list is windowed by the tiles' own lazy
 * observers rather than by a virtualiser: the grid is cheap to lay out, it is
 * only the drawing that is expensive, and that is what gets deferred.
 */
import { useMemo, useState } from "react";

import { PinguArt } from "@/components/PinguArt.tsx";
import { GEN_CALOR } from "@/lib/art.ts";
import { label, num } from "@/lib/format.ts";
import { href } from "@/lib/router.ts";
import {
  type LayerKey,
  LAYER_ORDER,
  allPingus,
  layerByKey,
  layerDistribution,
} from "@pingus/core";

const PAGE = 120; // divides evenly into the 12 / 6 / 4 column grids

export function Gallery() {
  const roster = useMemo(() => allPingus(), []);

  const [layer, setLayer] = useState<LayerKey | "">("");
  const [value, setValue] = useState("");
  const [gen, setGen] = useState(0);
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(PAGE);

  const values = useMemo(
    () => (layer ? layerDistribution(layer) : []),
    [layer]
  );

  const filtered = useMemo(() => {
    let out = roster;

    if (layer && value) out = out.filter((p) => p.traits[layer] === value);

    const id = Number(search);
    if (search && Number.isFinite(id)) out = out.filter((p) => p.id === id);

    return out;
  }, [roster, layer, value, search]);

  const visible = filtered.slice(0, shown);
  const calor = GEN_CALOR[gen] ?? 0;

  return (
    <main className="section" style={{ paddingTop: "calc(var(--header-h) + 3rem)" }}>
      <div className="shell">
        <div className="section-tag">
          <b>03</b>
          <span className="mono dim">la colección completa</span>
        </div>

        <h1 className="h-xl" style={{ marginBottom: "1.4rem" }}>
          2.369 cubos.
        </h1>

        <div className="filters">
          <div className="select">
            <select
              aria-label="capa"
              value={layer}
              onChange={(e) => {
                setLayer(e.target.value as LayerKey | "");
                setValue("");
                setShown(PAGE);
              }}
            >
              <option value="">todas las capas</option>
              {LAYER_ORDER.map((k) => (
                <option key={k} value={k}>
                  {layerByKey(k).label.toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {layer ? (
            <div className="select">
              <select
                aria-label="valor"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setShown(PAGE);
                }}
              >
                <option value="">cualquiera</option>
                {values.map((v) => (
                  <option key={v.value} value={v.value}>
                    {label(v.value)} — {v.count}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="select">
            <select
              aria-label="generación"
              value={gen}
              onChange={(e) => setGen(Number(e.target.value))}
            >
              {["gen 0 — hielo", "gen 1 — deshielo", "gen 2 — corriente", "gen 3 — vapor"].map(
                (label, i) => (
                  <option key={i} value={i}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <input
            className="input"
            placeholder="# id"
            inputMode="numeric"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value.replace(/\D/g, ""));
              setShown(PAGE);
            }}
          />

          <span className="mono dim" style={{ marginLeft: "auto" }}>
            {num(filtered.length)} resultados
          </span>
        </div>

        <div className="mosaic" style={{ marginTop: "1.4rem" }}>
          {visible.map((p) => (
            <a key={p.id} className="tile" href={href(`/pingu/${p.id}`)}>
              <PinguArt
                id={p.id}
                calor={calor}
                size={260}
                plain
                lazy
                className="tile-art"
                title={`pingu #${p.id}`}
              />
              <span className="tile-id">#{p.id}</span>
            </a>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="loading">ningún pingu con esa combinación</p>
        ) : null}

        {shown < filtered.length ? (
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <button
              type="button"
              className="btn"
              onClick={() => setShown((s) => s + PAGE)}
            >
              ver más — quedan {(filtered.length - shown).toLocaleString("es")}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
