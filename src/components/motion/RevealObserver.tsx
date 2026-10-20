"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll reveals for elements marked `data-reveal` ("" = fade and rise, "draw" = infographic parts animate).
 * Only elements still below the fold are hidden ("armed"), and only once JS runs — so nothing visible on
 * first paint ever waits, and with JS off everything simply shows. Each element reveals once.
 * Skipped entirely for prefers-reduced-motion.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const show = (el: Element) => {
      el.classList.remove("reveal-armed");
      el.setAttribute("data-revealed", "");
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          show(e.target);
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const fold = window.innerHeight * 0.92;
    const toAnimateNow: Element[] = [];
    document.querySelectorAll("[data-reveal]:not([data-revealed])").forEach((el) => {
      const inView = el.getBoundingClientRect().top < fold;
      if (inView && el.getAttribute("data-reveal") !== "draw") {
        el.setAttribute("data-revealed", "");
        return;
      }
      el.classList.add("reveal-armed");
      if (inView) toAnimateNow.push(el);
      else io.observe(el);
    });
    // Infographics already on screen still draw in, starting on the next frame.
    let raf = 0;
    if (toAnimateNow.length) raf = requestAnimationFrame(() => requestAnimationFrame(() => toAnimateNow.forEach(show)));

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
