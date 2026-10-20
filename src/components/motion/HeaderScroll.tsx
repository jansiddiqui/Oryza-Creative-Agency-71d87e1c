"use client";

import { useEffect } from "react";

/** Marks the sticky header once the page has scrolled, so CSS can shrink the logo and add a hairline shadow. */
export function HeaderScroll({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      el.toggleAttribute("data-scrolled", window.scrollY > 8);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [targetId]);
  return null;
}
