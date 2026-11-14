# `@pingus/web`

The PINGUS² site: a scroll-driven landing page, a mint app, and a browser for
all 2,369 tokens. React 18 + Vite 6 + TypeScript, deployed to GitHub Pages.

```bash
pnpm install              # from the repo root
pnpm --filter @pingus/web dev
```

---

## Pages

| Route | What it is |
|---|---|
| `/` | The landing page. Hero → the thaw → four words → mosaic → figures → rules → close |
| `/mint` | The mint app. Supply, price, quantity, wallet, receipt |
| `/gallery` | All 2,369 tokens, filterable by any trait layer, generation, or id |
| `/pingu/:id` | One token at all four generations, with its full trait table and rarity |

Routing is a ~60-line hook in [`src/lib/router.ts`](src/lib/router.ts), not a
library. Paths are stored base-relative so the same build works at `/` locally
and at `/doneenod.xyz/` on project Pages. Pages serves no rewrites, so
`404.html` is a copy of `index.html` and the router recovers the path on load.

---

## Demo mode

The mint page works with no contract deployed. `VITE_CONTRACT_ADDRESS` is read
at build time; if it is absent or not a valid address,
[`src/lib/chain.ts`](src/lib/chain.ts) sets `DEMO_MODE` and
[`src/lib/useMint.ts`](src/lib/useMint.ts) swaps its chain reads and writes for
a localStorage-backed simulation with realistic signing and confirmation
delays.

Both backends satisfy one `MintState` interface, so **no component branches on
`DEMO_MODE`** — the UI is exercised identically in both. Going live is setting
a repository variable; there is no code change.

| Variable | Default | Effect |
|---|---|---|
| `VITE_CONTRACT_ADDRESS` | unset | A valid address leaves demo mode and talks to the chain |
| `VITE_CHAIN_ID` | `1` | `1` mainnet, `11155111` sepolia |
| `VITE_BASE` | `/` | Vite `base`. The workflows derive it — see below |

### Serving from the apex domain

`deploy.yml` picks the base from one file: if `apps/web/public/CNAME` exists it
builds at `/`, otherwise at `/<repo>/`. Vite copies `public/CNAME` into `dist`,
and that file is also what tells Pages to serve the custom domain — so the base
and the domain cannot drift apart. To move the site to `doneenod.xyz`, create
the file with the bare hostname in it and point the DNS at GitHub; nothing else
changes.

The page states which mode it is in, in plain language. It never implies a
simulated mint is real.

---

## The thaw

[`src/sections/Thaw.tsx`](src/sections/Thaw.tsx) is the centrepiece: four
screens of scroll that melt one cube through calor 0 → 21, the whole
generation arc in a single gesture.

Re-rendering the SVG per frame is unaffordable — each piece is hundreds of
splines plus a turbulence filter. So all twelve estados are drawn **once** at
mount, stacked, and the scrub only cross-fades between the two neighbouring
layers via `gsap.quickSetter`. A per-frame render becomes a per-frame opacity
write.

Smooth scroll is [Lenis](https://github.com/darkroomengineering/lenis) bridged
into GSAP's ticker and `ScrollTrigger.scrollerProxy`, so both agree on one
scroll position — see [`src/lib/motion.ts`](src/lib/motion.ts). `useGsap`
scopes every tween and trigger to a ref and reverts them on unmount, which is
what keeps route changes from leaking pinned sections.

`prefers-reduced-motion` is honoured: scrubs become static states rather than
being removed, so nothing silently disappears.

---

## Artwork

Nothing is a bitmap. Every pingu on every page is generated in the browser by
[`@pingus/pingu-render`](../../packages/pingu-render) from its traits, which
[`@pingus/core`](../../packages/core) derives from its id. There are no image
assets to ship and no CDN in the path.

Drawing 2,369 of them client-side needs three things, all in
[`src/lib/art.ts`](src/lib/art.ts) and
[`src/components/PinguArt.tsx`](src/components/PinguArt.tsx):

1. **Memoised** on every render input, cache cleared past 900 entries.
2. **`plain: true`** for grid tiles — skips grain and dust, which are
   invisible at 120px and most of the cost.
3. **Lazy** via `IntersectionObserver` with a 600px margin, so a scroll never
   waits on a render.

---

## ABI generation

[`src/lib/abi.ts`](src/lib/abi.ts) is **generated** — do not edit it.

```bash
pnpm --filter @pingus/web run abi        # regenerate
pnpm --filter @pingus/web run abi:check  # CI's drift gate
```

It is emitted as `export const pingus2Abi = [...] as const` from the compiled
artifact, sliced to the 41 entries the frontend actually calls. The `as const`
matters: importing the JSON directly loses the literal types viem and wagmi
need to infer argument and return types, and every call collapses to `unknown`.
The generator exits non-zero if a function the frontend calls is missing from
the artifact, so a renamed contract function fails CI instead of failing in
someone's wallet.

---

## Visual QA

```bash
pnpm --filter @pingus/web build
pnpm --filter @pingus/web preview --port 4317
node apps/web/scripts/shots.mjs http://localhost:4317 /tmp/shots
```

`vite preview` reads `VITE_BASE` the same way the build does, so set it on
both or neither — serving a `/<repo>/` build from `/` returns the HTML
fallback for every asset, and the result is a blank page with no console
error to explain it.

[`scripts/shots.mjs`](scripts/shots.mjs) drives a real headless Chromium over
the DevTools protocol and captures the site at fourteen specific scroll depths.
`chromium --screenshot` cannot do this: it fires at load, which lands
mid-intro-animation, and it cannot scroll — and scroll position is the entire
subject of this page. Home-page positions are fractions of scrollable height
rather than pixels, because the page length changes whenever a section is
resized and fixed offsets drift off the thing they were meant to show.

---

## Build

`vite.config.ts` splits the bundle into `motion` (gsap, lenis), `wallet`
(wagmi, viem, tanstack, connectors) and `vendor`, so the landing page does not
pay for the wallet stack it never loads.
