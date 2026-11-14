import { useEffect, useState } from "react";

import { href, type Route } from "@/lib/router.ts";

export function Header({ route }: { route: Route }) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const current = (name: Route["name"]) =>
    route.name === name ? ("page" as const) : undefined;

  return (
    <header className="header" data-stuck={stuck}>
      <div className="shell">
        <a className="brand" href={href("/")}>
          pingus<sup>2</sup>
        </a>
        <nav className="nav">
          <a className="nav-hide" href={href("/#el-cubo")}>
            el cubo
          </a>
          <a href={href("/gallery")} aria-current={current("gallery")}>
            colección
          </a>
          <a href={href("/mint")} aria-current={current("mint")}>
            nacer
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-grid">
          <div>
            <div className="footer-mark">
              pingus<sup style={{ fontSize: "0.42em", top: "-0.9em" }}>2</sup>
            </div>
            <p className="mono dim" style={{ marginTop: "1.1rem" }}>
              @plagainnvade × donedone.io
            </p>
          </div>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <p className="mono dim">2.369 genesis · tope 5.922</p>
            <p className="mono dim">el arte se dibuja en tu navegador</p>
            <p className="mono dim">no hay token. no hay roadmap.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** The one piece of chrome that states the project's central claim. */
export function Marquee({ items }: { items: string[] }) {
  // Duplicated so the -50% keyframe loops seamlessly.
  const track = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {track.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}
