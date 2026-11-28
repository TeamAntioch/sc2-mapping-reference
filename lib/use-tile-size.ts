"use client";

import { createLocalStorageStore } from "@/lib/local-storage-store";

/**
 * The gallery's tile sizes, smallest first, each the narrowest a grid column may be. Columns
 * stretch to fill the row, so tiles show somewhat wider. Small is the size the grid had before
 * the slider.
 */
export const TILE_SIZE_STEPS = [
  { label: "Small", minWidth: 100 },
  { label: "Medium", minWidth: 150 },
  { label: "Large", minWidth: 200 },
  { label: "Larger", minWidth: 260 },
  { label: "Largest", minWidth: 320 },
] as const;

/**
 * The widest column, in CSS pixels, that the 128 px thumbnail still covers on a 1x screen.
 * Tiles any wider load the 512 px medium thumbnail.
 */
export const THUMBNAIL_MAX_WIDTH = 128;

/**
 * The narrowest column that fits a full tile. Narrower tiles use a smaller name, and the
 * Effects and Sets cards show only the picture and name.
 */
export const CARD_DETAIL_MIN_WIDTH = 200;

/** Larger: seven columns on a 1920 px screen, as in the gallery mockup. */
const DEFAULT_TILE_SIZE = 3;

const tileSizeStore = createLocalStorageStore<number>(
  "sc2-mapping-reference:tile-size",
  DEFAULT_TILE_SIZE,
  (v): v is number =>
    typeof v === "number" &&
    Number.isInteger(v) &&
    v >= 0 &&
    v < TILE_SIZE_STEPS.length,
);

/** The gallery's tile size, as an index into TILE_SIZE_STEPS, kept in localStorage. */
export const useTileSize = () => {
  const step = tileSizeStore.useValue();
  return { step, setStep: tileSizeStore.write };
};
