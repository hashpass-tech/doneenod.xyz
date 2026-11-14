/**
 * Renderer smoke tests.
 *
 * The renderer's output is art, so most of its quality is not testable. What
 * IS testable is everything the art direction states as a hard rule — and
 * those rules are exactly the ones a refactor is most likely to break
 * silently, because a slightly wrong colour still renders fine.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { allPingus, generatePingu, GENESIS_SUPPLY } from "@pingus/core";
import { renderPingu, renderStrip, CANVAS } from "../src/index.ts";

const ILLEGAL_COLOURS = ["#000000", "#000", "#ffffff", "#fff", "#FFFFFF", "#FFF"];
const COLD = ["#7FD4E8", "#4A90A8"];
const WARM = ["#FF5A1F", "#C8FF00", "#E8A33D", "#D1202A"];

/**
 * Every colour actually used as paint.
 *
 * Scoped to fill/stroke rather than any hex in the document, because a raw
 * scan also picks up `#fff` inside the VAPOR dissolve mask — which is a
 * luminance value, not a pigment — and fragments of uids like `p113g21`.
 */
function coloursIn(svg) {
  const out = new Set();
  for (const m of svg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,6})"/g)) {
    out.add(m[1].toUpperCase());
  }
  return out;
}

test("renders a well-formed svg for every generation", () => {
  const p = generatePingu(1337);
  for (const { gen, svg } of renderStrip(p)) {
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, `gen ${gen}`);
    assert.ok(svg.endsWith("</svg>"), `gen ${gen} is not closed`);
    assert.match(svg, new RegExp(`viewBox="0 0 ${CANVAS} ${CANVAS}"`), `gen ${gen}`);
    // Balanced groups — an unclosed <g> renders as a blank page in Safari.
    const open = (svg.match(/<g[\s>]/g) ?? []).length;
    const close = (svg.match(/<\/g>/g) ?? []).length;
    assert.equal(open, close, `gen ${gen} has unbalanced <g>`);
  }
});

test("is deterministic in (id, calor)", () => {
  for (const id of [1, 42, 999, 2369]) {
    for (const calor of [0, 6, 10, 21]) {
      const a = renderPingu(generatePingu(id), { calor });
      const b = renderPingu(generatePingu(id), { calor });
      assert.equal(a, b, `#${id} at calor ${calor} is not stable`);
    }
  }
});

test("never emits pure black or pure white", () => {
  // palette.json lists both as illegal: the piece is printed, not displayed.
  for (const id of [1, 7, 500, 1337, 2369]) {
    for (const calor of [0, 3, 8, 15, 21]) {
      const used = coloursIn(renderPingu(generatePingu(id), { calor }));
      for (const bad of ILLEGAL_COLOURS) {
        assert.ok(
          !used.has(bad.toUpperCase()),
          `#${id} at calor ${calor} painted with ${bad}`
        );
      }
    }
  }
});

test("no warm colour at GEN 0 and no cold colour at GEN 3", () => {
  // The temperature arc is the whole collection. Both directions are listed
  // under palette.json "illegal".
  const sample = allPingus().filter((_, i) => i % 53 === 0);
  assert.ok(sample.length > 20, "sample is too small to be meaningful");

  for (const p of sample) {
    const cold = coloursIn(renderPingu(p, { calor: 0 }));
    for (const warm of WARM) {
      assert.ok(!cold.has(warm), `#${p.id} used ${warm} at GEN 0`);
    }

    const hot = coloursIn(renderPingu(p, { calor: 21 }));
    for (const c of COLD) {
      assert.ok(!hot.has(c), `#${p.id} used ${c} at GEN 3`);
    }
  }
});

test("GEN 3 is a two-colour piece", () => {
  // palette.json: VAPOR has colors: 2. Ground plus ink, nothing else.
  for (const id of [1, 113, 777, 1500, 2251]) {
    const svg = renderPingu(generatePingu(id), { calor: 21, plain: true });
    const used = coloursIn(svg);
    assert.ok(
      used.size <= 3,
      `#${id} at VAPOR used ${used.size} colours: ${[...used].join(", ")}`
    );
  }
});

test("every token in the collection renders at every generation", () => {
  // The expensive one: proves there is no trait combination that throws.
  // Sampled rather than exhaustive so the suite stays under a second.
  const roster = allPingus();
  assert.equal(roster.length, GENESIS_SUPPLY);

  for (let i = 0; i < roster.length; i += 37) {
    const p = roster[i];
    for (const calor of [0, 2, 4, 9, 13, 18, 21]) {
      const svg = renderPingu(p, { calor, plain: true });
      assert.ok(svg.length > 500, `#${p.id} at calor ${calor} rendered almost nothing`);
    }
  }
});

test("unique uid keeps filter ids from colliding", () => {
  // Two pingus in one document must not share a filter id, or the first one
  // on the page wins and every later one inherits its grain.
  const a = renderPingu(generatePingu(1), { uid: "a" });
  const b = renderPingu(generatePingu(2), { uid: "b" });
  const idsOf = (svg) => (svg.match(/id="([^"]+)"/g) ?? []).sort();
  const shared = idsOf(a).filter((id) => idsOf(b).includes(id));
  assert.deepEqual(shared, [], `shared ids: ${shared.join(", ")}`);
});
