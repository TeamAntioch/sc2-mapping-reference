"use client";

import { useEffect, useMemo, useState } from "react";

import { useFilteredItems } from "@/app/components/use-filtered-items";
import type { SearchModes } from "@/lib/use-search-modes";
import type { DoodadSearchAnswer } from "@/lib/doodad-search/search";
import { GalleryEntry } from "@/lib/types";

export type RankedStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "searching" }
  | { readonly kind: "ranked" }
  | { readonly kind: "narrowed"; readonly why: string }
  | { readonly kind: "failed"; readonly why: string };

const NO_LEVELS: ReadonlyMap<GalleryEntry, number> = new Map();

/**
 * The gallery's entries for a filter: the name matches first, then the rest in the doodad search's
 * order. Until the search answers, or when it can't, they are just the name matches
 * useFilteredItems gives. Each hit is shown through its gallery picture, so doodads the gallery has
 * no picture of aren't shown.
 */
export function useRankedItems(
  items: GalleryEntry[],
  filter: string,
  enabled: boolean,
  modes: SearchModes,
  /** The lowest Jev grade a semantic match may have and still be listed. */
  minLevel: number,
): {
  items: GalleryEntry[];
  status: RankedStatus;
  /** Jev's grade for each entry the search graded. */
  levels: ReadonlyMap<GalleryEntry, number>;
} {
  const nameMatches = useFilteredItems(items, filter);
  // The search is only asked when semantic matches are shown.
  const searching = enabled && filter.trim() !== "";
  const ask = searching && modes.semantic ? filter.trim() : "";
  const [answer, setAnswer] = useState<
    { ask: string; result: DoodadSearchAnswer | { error: string } } | undefined
  >();

  const byPicture = useMemo(() => {
    const map = new Map<string, GalleryEntry[]>();
    for (const item of items)
      map.set(item.url, [...(map.get(item.url) ?? []), item]);
    return map;
  }, [items]);

  useEffect(() => {
    if (!ask) return;
    const controller = new AbortController();
    fetch(`/api/doodad-search?q=${encodeURIComponent(ask)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response
          .json()
          .catch(() => ({ error: `HTTP ${response.status}` }));
        setAnswer({
          ask,
          result: response.ok
            ? (body as DoodadSearchAnswer)
            : { error: body.error ?? `HTTP ${response.status}` },
        });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setAnswer({ ask, result: { error: (error as Error).message } });
      });
    return () => controller.abort();
  }, [ask]);

  return useMemo(() => {
    // With no search text, or no search on this page, everything is shown whatever the toggles say.
    const exact = !searching || modes.exact ? nameMatches : [];
    if (!ask)
      return { items: exact, status: { kind: "idle" }, levels: NO_LEVELS };
    if (answer?.ask !== ask)
      return { items: exact, status: { kind: "searching" }, levels: NO_LEVELS };
    const { result } = answer;
    if ("error" in result)
      return {
        items: exact,
        status: { kind: "failed", why: result.error },
        levels: NO_LEVELS,
      };
    // Exact name matches lead, in gallery order; the search's order follows for the rest.
    const placed = new Set<GalleryEntry>(nameMatches);
    const seen = new Set<string>();
    const ordered: GalleryEntry[] = [...exact];
    const levels = new Map<GalleryEntry, number>();
    for (const { image, level } of result.hits) {
      if (!image || seen.has(image)) continue;
      seen.add(image);
      for (const entry of byPicture.get(image) ?? []) {
        if (level !== undefined) levels.set(entry, level);
        if (placed.has(entry)) continue;
        // An unranked answer has no grades, so there is nothing to cut on.
        if (level !== undefined && level < minLevel) continue;
        ordered.push(entry);
      }
    }
    return {
      items: ordered,
      status: result.ranked
        ? { kind: "ranked" }
        : { kind: "narrowed", why: result.unranked ?? "no ranking" },
      levels,
    };
  }, [ask, answer, nameMatches, byPicture, searching, modes.exact, minLevel]);
}
