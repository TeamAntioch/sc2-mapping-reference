"use client";

import { useEffect } from "react";

/**
 * Asks the doodad search to load when someone opens the app, on any page, so their first search
 * doesn't wait for the model to start. Once per tab: after that the instance is warm or the
 * visitor has searched anyway.
 */
export function SearchWarmup() {
  useEffect(() => {
    const key = "doodad-search-warmed";
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // No storage (private mode, blocked): warm on every load instead.
    }
    // After the page has loaded, so the warm-up never competes with it.
    const warm = () => {
      fetch("/api/doodad-search?warm").catch(() => {});
    };
    if (document.readyState === "complete") warm();
    else window.addEventListener("load", warm, { once: true });
    return () => window.removeEventListener("load", warm);
  }, []);
  return null;
}
