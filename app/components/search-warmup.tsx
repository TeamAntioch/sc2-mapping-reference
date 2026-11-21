"use client";

import { useEffect } from "react";

/**
 * Asks a search to load (the doodad search by default, on any page; the set search on the Sets
 * pages), so the visitor's first search doesn't wait for the model to start. Once per tab: after
 * that the instance is warm or the visitor has searched anyway.
 */
export function SearchWarmup({
  route = "/api/doodad-search",
}: {
  readonly route?: string;
}) {
  useEffect(() => {
    const key = `${route.replace(/^\/api\//, "")}-warmed`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // No storage (private mode, blocked): warm on every load instead.
    }
    // After the page has loaded, so the warm-up never competes with it.
    const warm = () => {
      fetch(`${route}?warm`).catch(() => {});
    };
    if (document.readyState === "complete") warm();
    else window.addEventListener("load", warm, { once: true });
    return () => window.removeEventListener("load", warm);
  }, [route]);
  return null;
}
