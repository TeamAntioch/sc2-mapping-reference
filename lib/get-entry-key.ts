import { GalleryEntry } from "@/lib/types";

/**
 * Unique, stable identifier for a gallery entry. Names alone and URLs alone
 * are not unique (several doodads share an image), so combine both.
 */
export const getEntryKey = (entry: GalleryEntry): string =>
  `${entry.name}|${entry.url}`;
