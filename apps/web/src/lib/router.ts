/**
 * A ~60-line router.
 *
 * The whole site is four screens. Pulling in react-router for that would cost
 * more bytes than the renderer. The only genuinely fiddly part is the base
 * path: on GitHub Pages the site lives under /pingus-squared/, so every path
 * here is stored base-relative and only gains the prefix at the browser edge.
 */
import { useCallback, useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type Route =
  | { name: "home" }
  | { name: "mint" }
  | { name: "gallery" }
  | { name: "token"; id: number };

function parse(pathname: string): Route {
  const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  const clean = path.replace(/\/+$/, "") || "/";

  if (clean === "/mint") return { name: "mint" };
  if (clean === "/gallery") return { name: "gallery" };

  const token = /^\/pingu\/(\d+)$/.exec(clean);
  if (token) return { name: "token", id: Number(token[1]) };

  return { name: "home" };
}

export function href(path: string): string {
  return `${BASE}${path}`;
}

export function useRoute(): [Route, (path: string) => void] {
  const [route, setRoute] = useState<Route>(() => parse(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(parse(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((path: string) => {
    const target = href(path);
    if (target === window.location.pathname) return;
    window.history.pushState({}, "", target);
    setRoute(parse(target));
    window.scrollTo(0, 0);
  }, []);

  return [route, navigate];
}

/**
 * Intercept same-origin clicks so internal links are client-side but still
 * work as real URLs for middle-click, copy-link and the Pages 404 fallback.
 */
export function useLinkInterceptor(navigate: (path: string) => void): void {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (!url.pathname.startsWith(BASE || "/")) return;

      e.preventDefault();
      navigate(url.pathname.slice(BASE.length) || "/");
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);
}
