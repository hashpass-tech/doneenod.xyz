/**
 * The centrepiece: four screens of scroll that melt one cube.
 *
 * The artwork is pinned and the page scrolls past it, driving calor 0 → 21 —
 * the entire generation arc in a single gesture. Rather than re-render the SVG
 * on every scroll frame (each one is hundreds of splines and a turbulence
 * filter), all twelve estados are drawn once at mount and the scrub only
 * cross-fades between stacked layers. That turns a per-frame render into a
 * per-frame opacity write.
 */
import { useRef } from "react";

import { PinguArt } from "@/components/PinguArt.tsx";
import { GEN_CALOR, THAW_CALOR } from "@/lib/art.ts";
import { gsap, prefersReducedMotion, useGsap } from "@/lib/motion.ts";
import { stateFor } from "@pingus/core";
import { pingu } from "@/lib/art.ts";

/** The token used for the hero thaw. Picked for a legible silhouette. */
const HERO_ID = 1337;

const STEPS = [
  {
    gen: 0,
    word: "nace",
    body: "2.369 pingus nacen dentro de un cubo de hielo. ninguno está terminado.",
  },
  {
    gen: 1,
    word: "calienta",
    body: "el hielo no se derrite solo. nadie derrite tu cubo por ti.",
  },
  {
    gen: 2,
    word: "hace",
    body: "la única generación con movimiento. la única que puede encontrarse.",
  },
  {
    gen: 3,
    word: "hecho",
    body: "el vapor terminó. no hay generación 4.",
  },
];

const GEN_NAMES = ["hielo", "deshielo", "corriente", "vapor"] as const;

/**
 * The same four beats with no scrub and no pin.
 *
 * Reduced motion means no continuous animation, not less content — so the
 * generations stop being one cube over time and become four cubes in a column,
 * all four captions visible at once.
 */
function ThawStatic() {
  return (
    <section className="thaw thaw-static" id="el-cubo" aria-label="el deshielo">
      {STEPS.map((s) => (
        <div className="thaw-static-row" key={s.gen}>
          <div className="thaw-static-art">
            <PinguArt
              id={HERO_ID}
              calor={GEN_CALOR[s.gen] ?? 0}
              size={720}
              title={`pingu #${HERO_ID} en gen ${s.gen}`}
            />
          </div>
          <div className="thaw-static-copy">
            <span className="gen-no">
              gen {s.gen} — {GEN_NAMES[s.gen]}
            </span>
            <h3>{s.word}</h3>
            <p>{s.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function Thaw() {
  if (prefersReducedMotion()) return <ThawStatic />;
  return <ThawScrub />;
}

function ThawScrub() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fillRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLElement>(null);

  const rootRef = useGsap(({ root }) => {
    const frames = frameRefs.current.filter(Boolean) as HTMLDivElement[];
    const steps = stepRefs.current.filter(Boolean) as HTMLDivElement[];
    if (frames.length === 0) return;

    // quickSetter skips GSAP's property parsing on every write — at 12 layers
    // × 60fps that difference is the whole frame budget.
    const setOpacity = frames.map((f) => gsap.quickSetter(f, "opacity"));
    const setFill = gsap.quickSetter(fillRef.current, "width", "%");

    gsap.set(frames[0] as HTMLDivElement, { opacity: 1 });
    gsap.set(steps[0] as HTMLDivElement, { opacity: 1 });

    let lastStep = -1;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.7,
        onUpdate: (self) => {
          const p = self.progress;

          // Position along the 12 estados as a continuous value, so the two
          // neighbouring layers can cross-fade rather than hard-cut.
          const pos = p * (THAW_CALOR.length - 1);
          const i = Math.floor(pos);
          const frac = pos - i;

          for (let k = 0; k < frames.length; k++) {
            const o = k === i ? 1 - frac : k === i + 1 ? frac : 0;
            setOpacity[k]?.(o);
          }

          setFill(p * 100);

          const calor = THAW_CALOR[Math.min(Math.round(pos), 11)] ?? 0;
          if (labelRef.current) {
            const st = stateFor(pingu(HERO_ID), calor);
            labelRef.current.textContent = `calor ${calor} · ${st.estado.key.toLowerCase().replace(/_/g, " ")}`;
            // The label is centred on its own position, so without a clamp it
            // runs off both ends of the rail at calor 0 and calor 21.
            labelRef.current.style.left = `${Math.min(91, Math.max(9, p * 100))}%`;
          }

          // Copy changes once per generation, not once per estado — the words
          // are the slow layer under the fast one.
          const step = Math.min(3, Math.floor(p * 4));
          if (step !== lastStep) {
            lastStep = step;
            steps.forEach((el, k) => {
              gsap.to(el, {
                opacity: k === step ? 1 : 0,
                y: k === step ? 0 : 18,
                duration: 0.5,
                ease: "power2.out",
                overwrite: true,
              });
            });
          }
        },
      },
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      className="thaw"
      id="el-cubo"
      ref={rootRef as React.RefObject<HTMLElement>}
      aria-label="el deshielo"
    >
      <div className="thaw-scroll">
        <div className="thaw-pin">
          <div className="thaw-art">
            {THAW_CALOR.map((calor, i) => (
              <div
                key={calor}
                className="frame"
                style={{ opacity: 0 }}
                ref={(el) => {
                  frameRefs.current[i] = el;
                }}
              >
                <PinguArt
                  id={HERO_ID}
                  calor={calor}
                  size={900}
                  title={`pingu #${HERO_ID} a calor ${calor}`}
                />
              </div>
            ))}
          </div>

          <div className="thaw-copy">
            {STEPS.map((s, i) => (
              <div
                key={s.gen}
                className="thaw-step"
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
              >
                <span className="gen-no">
                  gen {s.gen} — {GEN_NAMES[s.gen]}
                </span>
                <h3>{s.word}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>

          <div className="thaw-rail">
            <b ref={labelRef as React.RefObject<HTMLElement>}>calor 0</b>
            <i ref={fillRef as React.RefObject<HTMLElement>} />
          </div>
        </div>
      </div>
    </section>
  );
}
