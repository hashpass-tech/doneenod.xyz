/**
 * Scroll + motion runtime.
 *
 * Lenis owns the scroll position and GSAP's ScrollTrigger reads from it, so
 * pinned sections stay glued to the smoothed position rather than the native
 * one. Registering the plugin and the ticker bridge exactly once matters —
 * doing it per component double-advances GSAP's clock.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useLayoutEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/** SSR-safe layout effect — this app is client-only but the guard is cheap. */
export const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

let lenis: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenis;
}

/** Start smooth scrolling. Returns a teardown that fully unwinds it. */
export function initSmoothScroll(): () => void {
  if (prefersReducedMotion()) return () => {};
  if (lenis) return () => {};

  lenis = new Lenis({
    duration: 1.05,
    // Heavy on arrival, light on departure — the page feels like it has mass,
    // which is the whole point of a collection made of ice blocks.
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: 0.95,
    touchMultiplier: 1.6,
  });

  const onScroll = () => ScrollTrigger.update();
  lenis.on("scroll", onScroll);

  const raf = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  // ScrollTrigger must measure against Lenis, not the native scroller.
  ScrollTrigger.scrollerProxy(document.documentElement, {
    scrollTop(value) {
      if (value !== undefined) lenis?.scrollTo(value, { immediate: true });
      return lenis?.scroll ?? window.scrollY;
    },
  });

  return () => {
    gsap.ticker.remove(raf);
    lenis?.off("scroll", onScroll);
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollTo(target: string | number, offset = -60): void {
  const l = getLenis();
  if (l) {
    l.scrollTo(target, { offset });
    return;
  }
  const el = typeof target === "string" ? document.querySelector(target) : null;
  if (el) {
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY + offset,
      behavior: "smooth",
    });
  } else if (typeof target === "number") {
    window.scrollTo({ top: target + offset, behavior: "smooth" });
  }
}

/**
 * Run GSAP setup inside a scoped context so every tween and ScrollTrigger it
 * creates is reverted together on unmount. Without this, client-side route
 * changes leave orphaned pins that corrupt the next page's layout.
 */
export function useGsap(
  setup: (ctx: { self: gsap.Context; root: HTMLElement }) => void,
  deps: unknown[] = []
) {
  const ref = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ctx = gsap.context((self) => setup({ self, root }), root);
    // Fonts load after first paint and change every measurement under them.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(() => {});
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/**
 * The house reveal: content rises into place from behind its own edge as it
 * enters the viewport. Applied to anything marked `data-anim`.
 */
export function revealIn(
  scope: HTMLElement | Document = document,
  selector = "[data-anim]"
): void {
  if (prefersReducedMotion()) {
    gsap.set(selector, { opacity: 1, y: 0, clearProps: "transform" });
    return;
  }

  const items = gsap.utils.toArray<HTMLElement>(
    (scope as HTMLElement).querySelectorAll?.(selector) ??
      document.querySelectorAll(selector)
  );

  for (const el of items) {
    const delay = Number(el.dataset.animDelay ?? 0);
    gsap.fromTo(
      el,
      { opacity: 0, y: 34 },
      {
        opacity: 1,
        y: 0,
        duration: 0.95,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          // Fire a little before the element is fully on screen so the motion
          // reads as the page settling, not as a delayed pop.
          start: "top 88%",
          once: true,
        },
      }
    );
  }
}
