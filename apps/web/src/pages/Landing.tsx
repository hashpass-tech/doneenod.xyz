/**
 * The landing page.
 *
 * Structure follows the collection's own logic rather than a marketing
 * funnel: what it is → what happens to it → what it refuses to be → how to
 * get one. Copy is taken verbatim from 07-launch/01-voice.md and obeys its
 * rules — Spanish first, lowercase always, no exclamation points, and no
 * crypto vocabulary anywhere on the page.
 */
import { useEffect, useMemo, useRef } from "react";

import { Marquee } from "@/components/Chrome.tsx";
import { PinguArt } from "@/components/PinguArt.tsx";
import { sampleIds } from "@/lib/art.ts";
import { gsap, prefersReducedMotion, revealIn, scrollTo, useGsap } from "@/lib/motion.ts";
import { label, num } from "@/lib/format.ts";
import { href } from "@/lib/router.ts";
import { Thaw } from "@/sections/Thaw.tsx";
import { GENESIS_SUPPLY, HARD_CAP, productionRuns } from "@pingus/core";

export function Landing() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => revealIn(pageRef.current ?? document), pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef}>
      <Hero />
      <Thaw />
      <FourWords />
      <Collection />
      <Figures />
      <Rules />
      <Transfer />
      <Cta />
    </div>
  );
}

/* ------------------------------------------------------------------ hero --- */

function Hero() {
  const rootRef = useGsap(({ root }) => {
    if (prefersReducedMotion()) {
      gsap.set(root.querySelectorAll("[data-hero]"), { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // The title lines ride up from behind their own masks, then everything
    // else settles. One gesture, not eight staggered fades.
    tl.fromTo(
      root.querySelectorAll(".reveal-line > span"),
      { yPercent: 112 },
      { yPercent: 0, duration: 1.15, stagger: 0.08 }
    )
      .fromTo(
        root.querySelectorAll("[data-hero]"),
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.09 },
        "-=0.72"
      )
      .fromTo(
        root.querySelector(".hero-art"),
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 1.3 },
        "-=1.1"
      );

    // Slow parallax drift so the cube feels heavier than the type above it.
    gsap.to(root.querySelector(".hero-art"), {
      yPercent: 12,
      ease: "none",
      scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
    });
  }, []);

  return (
    <section className="hero" ref={rootRef as React.RefObject<HTMLElement>}>
      <div className="shell">
        {/* The wordmark spans the full measure — it is the masthead of a
            printed sheet, not a headline sitting in a column. */}
        <h1 className="hero-title">
          <span className="reveal-line">
            <span>
              pingus<sup>2</sup>
            </span>
          </span>
        </h1>

        <div className="hero-grid">
          <div>
            <p className="lede" data-hero>
              2.369 pingus. todos congelados.
              <br />
              ninguno está terminado.
            </p>

            <div
              data-hero
              style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginTop: "2rem" }}
            >
              <a className="btn btn-solid" href={href("/mint")}>
                nacer en hielo
              </a>
              <button className="btn" type="button" onClick={() => scrollTo("#el-cubo")}>
                ver el deshielo
              </button>
            </div>

            <div className="hero-meta" data-hero>
              <div>
                <b>2.369</b>
                <span>genesis</span>
              </div>
              <div>
                <b>4</b>
                <span>estados</span>
              </div>
              <div>
                <b>12</b>
                <span>sub-estados</span>
              </div>
              <div>
                <b>{num(HARD_CAP)}</b>
                <span>tope absoluto</span>
              </div>
            </div>
          </div>

          <div className="hero-art">
            <div className="art-frame">
              <PinguArt id={1} calor={0} size={900} title="pingu #1 en hielo sólido" />
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-cue" aria-hidden="true">
        <span>desliza</span>
        <i />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ four words --- */

function FourWords() {
  const rootRef = useGsap(({ root }) => {
    const track = root.querySelector(".words-track");
    if (!track || prefersReducedMotion()) return;

    // The four words run horizontally as the page runs vertically — the
    // collection's whole vocabulary passes in one scroll.
    gsap.fromTo(
      track,
      { xPercent: 4 },
      {
        xPercent: -46,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.6 },
      }
    );
  }, []);

  const words = ["nace", "calienta", "hace", "hecho"];

  return (
    <section className="words" ref={rootRef as React.RefObject<HTMLElement>} aria-label="las cuatro palabras">
      <div className="words-track">
        {words.map((w, i) => (
          <span key={w} className={i % 2 === 1 ? "o" : undefined}>
            {w}
          </span>
        ))}
        <span className="o">nace</span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ collection --- */

function Collection() {
  // A fixed, well-spread sample — enough to show the range without asking the
  // browser to draw the whole collection on the landing page.
  const ids = useMemo(() => sampleIds(48, 7), []);

  const rootRef = useGsap(({ root }) => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      root.querySelectorAll(".tile"),
      { opacity: 0, scale: 0.86 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
        // Tiles arrive from the top-left corner outward, like a sheet being
        // pulled off a press.
        stagger: { each: 0.012, from: "start", grid: "auto" },
        scrollTrigger: { trigger: root, start: "top 78%", once: true },
      }
    );
  }, []);

  return (
    <section
      className="section"
      ref={rootRef as React.RefObject<HTMLElement>}
      id="coleccion"
    >
      <div className="shell">
        <div className="section-tag">
          <b>01</b>
          <span className="mono dim">la colección</span>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "2.4rem",
          }}
        >
          <h2 className="h-xl" data-anim>
            cada uno nace
            <br />
            con lo mismo:
            <br />
            nada hecho.
          </h2>
          <p className="lede dim" data-anim data-anim-delay="0.1">
            nueve capas, fijas al nacer. el estado es lo único que se gana.
          </p>
        </div>

        <div className="mosaic">
          {ids.map((id) => (
            <a key={id} className="tile" href={href(`/pingu/${id}`)}>
              <PinguArt
                id={id}
                calor={0}
                size={260}
                plain
                lazy
                className="tile-art"
                title={`pingu #${id}`}
              />
              <span className="tile-id">#{id}</span>
            </a>
          ))}
        </div>

        <div style={{ marginTop: "2rem" }} data-anim>
          <a className="btn" href={href("/gallery")}>
            ver las 2.369
          </a>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- figures --- */

function Figures() {
  // productionRuns() filters FIT down to the values that are actually
  // manufactured, so NADA — the commonest value by far — stays out of a row
  // captioned "production run".
  const runs = useMemo(() => productionRuns().slice(0, 4), []);

  return (
    <section className="section" style={{ paddingBlock: 0 }}>
      <div className="shell">
        <div className="figures" data-anim>
          <div>
            <b>{num(GENESIS_SUPPLY)}</b>
            <span>pingus genesis</span>
          </div>
          {runs.map((r) => (
            <div key={r.fit}>
              <b>{num(r.units)}</b>
              <span>{r.garment ? label(r.garment) : label(r.fit)}</span>
            </div>
          ))}
        </div>
        <p className="mono dim" style={{ marginTop: "1rem" }} data-anim>
          el número de la capa es la tirada de producción. nunca se fabrican más.
        </p>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- rules --- */

const RULES: { n: string; text: string; en?: string }[] = [
  { n: "01", text: "no hay token." },
  { n: "02", text: "no hay staking." },
  { n: "03", text: "no hay roadmap." },
  {
    n: "04",
    text: "hay 2.369 cubos y lo que hagas con el tuyo.",
    en: "There are 2,369 cubes and whatever you do with yours.",
  },
  {
    n: "05",
    text: "el encuentro no cuesta nada. nosotros no cobramos.",
    en: "The network charges gas. We charge nothing — consent is an off-chain signature.",
  },
  {
    n: "06",
    text: "hacer no se hereda.",
    en: "Your work thawed your cube. Your child starts in its own.",
  },
];

function Rules() {
  return (
    <section className="section">
      <div className="shell">
        <div className="section-tag">
          <b>02</b>
          <span className="mono dim">lo que no hay</span>
        </div>
        <ul className="rules">
          {RULES.map((r) => (
            <li key={r.n} data-anim>
              <b>{r.n}</b>
              <p>
                {r.text}
                {r.en ? <em>{r.en}</em> : null}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- transfer --- */

function Transfer() {
  const rootRef = useGsap(({ root }) => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      root.querySelector("p"),
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: root, start: "top 72%", once: true },
      }
    );
  }, []);

  return (
    <section className="quote" ref={rootRef as React.RefObject<HTMLElement>}>
      <div className="shell">
        <p>
          puedes comprar un pingu terminado.
          <br />
          no puedes comprar haberlo terminado.
        </p>
        <span>la línea más importante del proyecto</span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- cta --- */

function Cta() {
  return (
    <>
      <Marquee
        items={[
          "nace en hielo",
          "el calor viene de hacer",
          "no de tener",
          "2.369",
          "el vapor terminó",
          "no hay generación 4",
        ]}
      />
      <section className="section">
        <div className="shell" style={{ textAlign: "center" }}>
          <h2 className="display" data-anim>
            nace
            <br />
            en hielo
          </h2>
          <p className="lede" style={{ margin: "1.8rem auto 2.4rem" }} data-anim>
            el cubo no se abre comprando. se abre haciendo.
          </p>
          <div data-anim>
            <a className="btn btn-solid" href={href("/mint")}>
              ir al nacimiento
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
