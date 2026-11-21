"use client";

import { useEffect, useMemo, useState } from "react";

import type { SetKind } from "@team-antioch/sc2-asset-catalog/catalog/set-looks.js";

import type { SetSummary } from "@/app/(gallery)/sets/set-words";
import type { RankedStatus } from "@/app/components/use-ranked-items";
import { useFilteredItems } from "@/app/components/use-filtered-items";
import type { SetSearchAnswer } from "@/lib/set-search/search";
import type { SearchModes } from "@/lib/use-search-modes";

const NO_LEVELS: ReadonlyMap<string, number> = new Map();

/**
 * The sets for a filter and the picked kinds, as useRankedItems gives the doodads: the name matches
 * first, then the rest in the set search's order. Until the search answers, or when it can't, they
 * are just the name matches. With no kinds picked every kind is shown.
 */
export function useRankedSets(
  sets: SetSummary[],
  filter: string,
  kinds: readonly SetKind[],
  modes: SearchModes,
  /** The lowest Jev grade a semantic match may have and still be listed. */
  minLevel: number,
): {
  sets: SetSummary[];
  status: RankedStatus;
  /** Jev's grade for each set the search graded, by id. */
  levels: ReadonlyMap<string, number>;
} {
  const ofKinds = useMemo(
    () =>
      kinds.length ? sets.filter((set) => kinds.includes(set.kind)) : sets,
    [sets, kinds],
  );
  const nameMatches = useFilteredItems(ofKinds, filter);
  const searching = filter.trim() !== "";
  const ask = searching && modes.semantic ? filter.trim() : "";
  const kindParam = [...kinds].sort().join(",");
  const query = ask
    ? `q=${encodeURIComponent(ask)}${kindParam ? `&kind=${kindParam}` : ""}`
    : "";
  const [answer, setAnswer] = useState<
    { query: string; result: SetSearchAnswer | { error: string } } | undefined
  >();

  const byId = useMemo(
    () => new Map(ofKinds.map((set) => [set.id, set])),
    [ofKinds],
  );

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    fetch(`/api/set-search?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response
          .json()
          .catch(() => ({ error: `HTTP ${response.status}` }));
        setAnswer({
          query,
          result: response.ok
            ? (body as SetSearchAnswer)
            : { error: body.error ?? `HTTP ${response.status}` },
        });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setAnswer({ query, result: { error: (error as Error).message } });
      });
    return () => controller.abort();
  }, [query]);

  return useMemo(() => {
    const exact = !searching || modes.exact ? nameMatches : [];
    if (!query)
      return { sets: exact, status: { kind: "idle" }, levels: NO_LEVELS };
    if (answer?.query !== query)
      return { sets: exact, status: { kind: "searching" }, levels: NO_LEVELS };
    const { result } = answer;
    if ("error" in result)
      return {
        sets: exact,
        status: { kind: "failed", why: result.error },
        levels: NO_LEVELS,
      };
    const placed = new Set<string>(nameMatches.map((set) => set.id));
    const ordered: SetSummary[] = [...exact];
    const levels = new Map<string, number>();
    for (const { id, level } of result.hits) {
      const set = byId.get(id);
      if (!set) continue;
      if (level !== undefined) levels.set(id, level);
      if (placed.has(id)) continue;
      if (level !== undefined && level < minLevel) continue;
      placed.add(id);
      ordered.push(set);
    }
    return {
      sets: ordered,
      status: result.ranked
        ? { kind: "ranked" }
        : { kind: "narrowed", why: result.unranked ?? "no ranking" },
      levels,
    };
  }, [query, answer, nameMatches, byId, searching, modes.exact, minLevel]);
}
