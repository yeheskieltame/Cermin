"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps the app in Lenis smooth scroll + a global MotionConfig.
 *
 * Reduced-motion users get native scroll (no Lenis) and Framer auto-strips
 * transforms via `reducedMotion="user"`. This sits INSIDE Web3Provider, so the
 * rare reduced-motion remount never tears down the wallet connection.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      {reduce ? (
        children
      ) : (
        <ReactLenis
          root
          options={{ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 }}
        >
          {children}
        </ReactLenis>
      )}
    </MotionConfig>
  );
}
