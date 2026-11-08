"use client";

import { useCallback } from "react";
import { createLocalStorageStore } from "@/lib/local-storage-store";

const EMPTY: string[] = [];

const paletteStore = createLocalStorageStore<string[]>(
  "sc2-mapping-reference:doodad-palette",
  EMPTY,
  (v): v is string[] =>
    Array.isArray(v) && v.every((k) => typeof k === "string")
);

const panelOpenStore = createLocalStorageStore<boolean>(
  "sc2-mapping-reference:doodad-palette-open",
  false,
  (v): v is boolean => typeof v === "boolean"
);

/**
 * The player's doodad palette: an ordered list of bookmarked entry keys
 * (see getEntryKey), persisted in localStorage and synced across tabs.
 */
export const useDoodadPalette = () => {
  const keys = paletteStore.useValue();

  const has = useCallback((key: string) => keys.includes(key), [keys]);

  const toggle = useCallback((key: string) => {
    const current = paletteStore.read();
    paletteStore.write(
      current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key]
    );
  }, []);

  const clear = useCallback(() => paletteStore.write([]), []);

  return { keys, has, toggle, clear };
};

/** Whether the palette side panel is open. Persisted so it survives navigation. */
export const usePalettePanel = () => {
  const isOpen = panelOpenStore.useValue();
  const setOpen = useCallback((open: boolean) => panelOpenStore.write(open), []);
  const toggleOpen = useCallback(
    () => panelOpenStore.write(!panelOpenStore.read()),
    []
  );
  return { isOpen, setOpen, toggleOpen };
};
