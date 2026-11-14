/**
 * Parity: the TypeScript port must reproduce the reference generator exactly.
 *
 * Traits are committed to on-chain as TRAITS_ROOT, so a single divergence here
 * would mean the website renders a different collection than the one that was
 * minted. If 08-tech/output is absent (it is gitignored), the cross-check is
 * skipped and the structural invariants still run.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  GENESIS_SUPPLY,
  HARD_CAP,
  allPingus,
  estadoFor,
  generatePingu,
  generationFor,
  resolvePalette,
  stateFor,
  TRAITS,
} from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const REFERENCE = resolve(here, "../../../08-tech/output/traits.json");

test("supply constants match the trait manifest", () => {
  assert.equal(GENESIS_SUPPLY, 2369);
  assert.equal(HARD_CAP, 5922);
  assert.equal(HARD_CAP, 2369 + 2369 + 1184);
});

test("generation is a pure function of calor, at every threshold", () => {
  assert.equal(generationFor(0).gen, 0);
  assert.equal(generationFor(2).gen, 0);
  assert.equal(generationFor(3).gen, 1);
  assert.equal(generationFor(7).gen, 1);
  assert.equal(generationFor(8).gen, 2);
  assert.equal(generationFor(14).gen, 2);
  assert.equal(generationFor(15).gen, 3);
  assert.equal(generationFor(9999).gen, 3);
});

test("estado index matches the contract encoding gen*3 + substate", () => {
  assert.equal(estadoFor(0).index, 0); // HIELO_SOLIDO
  assert.equal(estadoFor(1).index, 1); // HIELO_SUDADO
  assert.equal(estadoFor(2).index, 2); // HIELO_TENSO
  assert.equal(estadoFor(3).index, 3); // GRIETA
  assert.equal(estadoFor(8).index, 6); // CORRIENTE_BAJA
  assert.equal(estadoFor(21).index, 11); // HECHO — terminal
  assert.equal(estadoFor(0).estado.key, "HIELO_SOLIDO");
  assert.equal(estadoFor(21).estado.key, "HECHO");
});

test("only GEN 2 can breed or claim", () => {
  const p = generatePingu(1);
  assert.equal(stateFor(p, 0).can_breed, false);
  assert.equal(stateFor(p, 5).can_breed, false);
  assert.equal(stateFor(p, 20).can_breed, false, "el vapor no se reproduce");

  // A pingu with a claimable FIT, at GEN 2, can breed.
  const claimable = allPingus().find(
    (x) => x.traits.FIT === "TEE_DONE" && x.band === "FUNDADORES"
  );
  assert.ok(claimable);
  assert.equal(stateFor(claimable, 10).can_breed, true);
  assert.equal(stateFor(claimable, 10).can_claim, true);
  assert.equal(stateFor(claimable, 2).can_claim, false, "no claim before GEN 2");
});

test("EL PRIMERO (2369) is pinned to GEN 1 and cannot breed", () => {
  const primero = generatePingu(2369);
  assert.equal(primero.band, "PRIMERO");
  for (const calor of [0, 5, 10, 20, 500]) {
    const s = stateFor(primero, calor);
    assert.equal(s.generacion, 1, `calor ${calor} must still read GEN 1`);
    assert.equal(s.locked, true);
    assert.equal(s.can_breed, false);
  }
});

test("palette obeys the temperature arc and the 4-colour hard limit", () => {
  const g0 = resolvePalette("NARANJA_DONE", 0);
  assert.equal(g0.accent, "#7FD4E8", "GEN 0 accent must be cold");
  assert.ok(g0.colors <= 4);

  const g2 = resolvePalette("NARANJA_DONE", 2);
  assert.equal(g2.accent, "#FF5A1F");
  assert.ok(g2.colors <= 4);

  const g2none = resolvePalette("SIN_COLOR", 2);
  assert.equal(g2none.accent, null, "SIN_COLOR is 2-colour");
  assert.equal(g2none.colors, 2);

  const g3 = resolvePalette("NARANJA_DONE", 3);
  assert.equal(g3.accent, null, "no cold or warm accent at GEN 3");
  assert.equal(g3.colors, 2, "the most earned state is the most minimal");
  assert.ok(g3.lineOpacity < 1);
  assert.ok(g3.ghostOpacity <= 0.15);
});

test("every exclusion rule holds across the whole roster", () => {
  const all = allPingus();
  assert.equal(all.length, 2369);

  for (const p of all) {
    const t = p.traits;
    if (t.CUERPO === "FANTASMA") {
      assert.equal(t.FIT, "NADA", `#${p.id}: an outline cannot wear clothes`);
      assert.equal(t.CARGA, "VACIO", `#${p.id}: an outline cannot hold things`);
    }
    if (t.CUERPO === "CRIA") {
      assert.ok(!["PUFFER", "MONO_OBRERO"].includes(t.FIT), `#${p.id}: chick sizing`);
    }
    if (t.MARCA === "CAPUCHA") {
      assert.ok(["HOODED_TUX", "PUFFER"].includes(t.FIT), `#${p.id}: a hood needs a hood`);
    }
    if (t.PALETA === "SIN_COLOR") {
      assert.notEqual(t.FONDO, "OBRA", `#${p.id}`);
      assert.notEqual(t.FIT, "CHALECO", `#${p.id}: hi-vis is defined by its colour`);
    }
    if (t.TRATAMIENTO === "RISO") {
      assert.notEqual(t.PALETA, "SIN_COLOR", `#${p.id}: riso needs 2 channels`);
    }
    if (t.FONDO === "SIN_FONDO") {
      assert.notEqual(t.SENA, "TAG_PARED", `#${p.id}: no wall to tag`);
    }
    if (t.CARGA === "ASTILLA") {
      assert.notEqual(t.CUBO, "PERFECTO", `#${p.id}: a perfect cube leaves no shard`);
    }
  }
});

test("bands and the Ruptura layer are assigned correctly", () => {
  assert.equal(generatePingu(1).band, "FUNDADORES");
  assert.equal(generatePingu(2250).band, "FUNDADORES");
  assert.equal(generatePingu(2251).band, "ROMPEDORES");
  assert.equal(generatePingu(2368).band, "ROMPEDORES");
  assert.equal(generatePingu(2369).band, "PRIMERO");

  for (const p of allPingus()) {
    if (p.band === "ROMPEDORES") {
      assert.ok(p.traits.Ruptura, `#${p.id} must carry a Ruptura`);
      assert.ok(TRAITS.rupturas.includes(p.traits.Ruptura));
    } else {
      assert.equal(p.traits.Ruptura, undefined, `#${p.id} must not carry a Ruptura`);
    }
  }
});

test("generation is deterministic in (seed, id)", () => {
  for (const id of [1, 42, 1000, 2251, 2369]) {
    assert.deepEqual(generatePingu(id), generatePingu(id));
  }
});

test("port is bit-identical to 08-tech/scripts/generate.mjs", (t) => {
  if (!existsSync(REFERENCE)) {
    t.skip("08-tech/output/traits.json absent — run `pnpm generate` to enable");
    return;
  }
  const reference = JSON.parse(readFileSync(REFERENCE, "utf8"));
  const ours = allPingus();

  assert.equal(ours.length, reference.length, "supply mismatch");
  for (let i = 0; i < reference.length; i++) {
    assert.deepEqual(
      ours[i],
      reference[i],
      `divergence at token #${reference[i].id} — the port changed the collection`
    );
  }
});
