"use client";

import { useCallback } from "react";
import { createLocalStorageStore } from "@/lib/local-storage-store";

export type SearchModes = {
  /** Doodads whose name contains the search text. */
  readonly exact: boolean;
  /** Doodads the plain-words search finds that the name doesn't contain. */
  readonly semantic: boolean;
};

const DEFAULT_MODES: SearchModes = { exact: true, semantic: true };

const modesStore = createLocalStorageStore<SearchModes>(
  "sc2-mapping-reference:search-modes",
  DEFAULT_MODES,
  (v): v is SearchModes =>
    typeof v === "object" &&
    v !== null &&
    typeof (v as SearchModes).exact === "boolean" &&
    typeof (v as SearchModes).semantic === "boolean",
);

/** Which kinds of match the search shows, persisted in localStorage and synced across tabs. */
export const useSearchModes = () => {
  const modes = modesStore.useValue();
  const setMode = useCallback(
    (mode: keyof SearchModes, on: boolean) =>
      modesStore.write({ ...modesStore.read(), [mode]: on }),
    [],
  );
  return { modes, setMode };
};

/** The five settings of semantic certainty, strictest first, and the lowest Jev grade each lists. */
export const CERTAINTY_STEPS = [
  { label: "Very strict", minLevel: 2.5 },
  { label: "Strict", minLevel: 2.1 },
  { label: "Balanced", minLevel: 1.75 },
  { label: "Loose", minLevel: 1.25 },
  { label: "Very loose", minLevel: 0 },
] as const;
const DEFAULT_CERTAINTY = 2;

const certaintyStore = createLocalStorageStore<number>(
  "sc2-mapping-reference:search-certainty",
  DEFAULT_CERTAINTY,
  (v): v is number =>
    typeof v === "number" &&
    Number.isInteger(v) &&
    v >= 0 &&
    v < CERTAINTY_STEPS.length,
);

/** How sure a semantic match must be to be listed, as an index into CERTAINTY_STEPS. */
export const useSearchCertainty = () => {
  const certainty = certaintyStore.useValue();
  const setCertainty = useCallback(
    (step: number) => certaintyStore.write(step),
    [],
  );
  return {
    certainty,
    setCertainty,
    minLevel: CERTAINTY_STEPS[certainty].minLevel,
  };
};
