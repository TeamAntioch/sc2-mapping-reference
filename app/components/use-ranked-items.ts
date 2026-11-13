"use client";

import { useEffect, useMemo, useState } from "react";

import { useFilteredItems } from "@/app/components/use-filtered-items";
import type { DoodadSearchAnswer } from "@/lib/doodad-search/search";
import { GalleryEntry } from "@/lib/types";

export type RankedStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "searching" }
  | { readonly kind: "ranked" }
  | { readonly kind: "narrowed"; readonly why: string }
  | { readonly kind: "failed"; readonly why: string };

/**
 * The gallery's entries for a filter, in the doodad search's order. Until the search answers, or
 * when it can't, they are the name matches useFilteredItems gives. Each hit is shown through its
 * gallery picture, so doodads the gallery has no picture of aren't shown.
 */
export function useRankedItems(
  items: GalleryEntry[],
  filter: string,
  enabled: boolean,
): { items: GalleryEntry[]; status: RankedStatus } {
  const nameMatches = useFilteredItems(items, filter);
  const ask = enabled ? filter.trim() : "";
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
    if (!ask) return { items: nameMatches, status: { kind: "idle" } };
    if (answer?.ask !== ask)
      return { items: nameMatches, status: { kind: "searching" } };
    const { result } = answer;
    if ("error" in result)
      return {
        items: nameMatches,
        status: { kind: "failed", why: result.error },
      };
    const seen = new Set<string>();
    const ranked: GalleryEntry[] = [];
    for (const { image } of result.hits) {
      if (!image || seen.has(image)) continue;
      seen.add(image);
      ranked.push(...(byPicture.get(image) ?? []));
    }
    return {
      items: ranked,
      status: result.ranked
        ? { kind: "ranked" }
        : { kind: "narrowed", why: result.unranked ?? "no ranking" },
    };
  }, [ask, answer, nameMatches, byPicture]);
}
