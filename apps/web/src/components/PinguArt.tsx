/**
 * Draw one pingu.
 *
 * The SVG is produced synchronously from trait data, so for anything in a grid
 * we defer the work until the tile is actually near the viewport. Scrolling
 * the full 2,369-token gallery otherwise means thousands of multi-pass spline
 * renders on the main thread before the first paint.
 */
import { memo, useEffect, useRef, useState } from "react";

import { art, type ArtOptions } from "@/lib/art.ts";

export interface PinguArtProps extends ArtOptions {
  id: number;
  className?: string;
  /** Wait until the element is within rootMargin of the viewport. */
  lazy?: boolean;
  title?: string;
}

function PinguArtImpl({
  id,
  calor = 0,
  size = 1000,
  plain = false,
  lazy = false,
  className,
  title,
}: PinguArtProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy || visible) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      // Start drawing a screen and a half early so tiles are never blank by
      // the time they are actually read.
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy, visible]);

  return (
    <div
      ref={ref}
      className={className ? `pingu-art ${className}` : "pingu-art"}
      role={title ? "img" : undefined}
      aria-label={title}
      // The renderer emits a complete, self-contained <svg>; React has no
      // reason to reconcile its internals.
      dangerouslySetInnerHTML={
        visible
          ? { __html: art(id, { calor, size, plain }) }
          : { __html: '<div class="tile-skeleton"></div>' }
      }
    />
  );
}

export const PinguArt = memo(PinguArtImpl);
