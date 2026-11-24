"use client";

import { useEffect, useMemo, useState } from "react";

import type { EffectKind } from "@team-antioch/sc2-asset-catalog/catalog/effect-looks.js";

import type { EffectSummary } from "@/app/(gallery)/effects/effect-words";
import type { RankedStatus } from "@/app/components/use-ranked-items";
import { useFilteredItems } from "@/app/components/use-filtered-items";
import type { EffectSearchAnswer } from "@/lib/effect-search/search";
import type { SearchModes } from "@/lib/use-search-modes";

const NO_LEVELS: ReadonlyMap<string, number> = new Map();

/**
 * The effects for a filter and the picked kinds, as useRankedItems gives the doodads: the name matches
 * first, then the rest in the effect search's order. Until the search answers, or when it can't, they
 * are just the name matches. With no kinds picked every kind is shown.
 */
export function useRankedEffects(
  effects: EffectSummary[],
  filter: string,
  kinds: readonly EffectKind[],
  modes: SearchModes,
  /** The lowest Jev grade a semantic match may have and still be listed. */
  minLevel: number,
): {
  effects: EffectSummary[];
  status: RankedStatus;
  /** Jev's grade for each effect the search graded, by model path. */
  levels: ReadonlyMap<string, number>;
} {
  const ofKinds = useMemo(
    () =>
      kinds.length ? effects.filter((effect) => kinds.includes(effect.kind)) : effects,
    [effects, kinds],
  );
  const nameMatches = useFilteredItems(ofKinds, filter);
  const searching = filter.trim() !== "";
  const ask = searching && modes.semantic ? filter.trim() : "";
  const kindParam = [...kinds].sort().join(",");
  const query = ask
    ? `q=${encodeURIComponent(ask)}${kindParam ? `&kind=${kindParam}` : ""}`
    : "";
  const [answer, setAnswer] = useState<
    { query: string; result: EffectSearchAnswer | { error: string } } | undefined
  >();

  const byId = useMemo(
    () => new Map(ofKinds.map((effect) => [effect.file, effect])),
    [ofKinds],
  );

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    fetch(`/api/effect-search?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response
          .json()
          .catch(() => ({ error: `HTTP ${response.status}` }));
        setAnswer({
          query,
          result: response.ok
            ? (body as EffectSearchAnswer)
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
      return { effects: exact, status: { kind: "idle" }, levels: NO_LEVELS };
    if (answer?.query !== query)
      return { effects: exact, status: { kind: "searching" }, levels: NO_LEVELS };
    const { result } = answer;
    if ("error" in result)
      return {
        effects: exact,
        status: { kind: "failed", why: result.error },
        levels: NO_LEVELS,
      };
    const placed = new Set<string>(nameMatches.map((effect) => effect.file));
    const ordered: EffectSummary[] = [...exact];
    const levels = new Map<string, number>();
    for (const { file, level } of result.hits) {
      const effect = byId.get(file);
      if (!effect) continue;
      if (level !== undefined) levels.set(file, level);
      if (placed.has(file)) continue;
      if (level !== undefined && level < minLevel) continue;
      placed.add(file);
      ordered.push(effect);
    }
    return {
      effects: ordered,
      status: result.ranked
        ? { kind: "ranked" }
        : { kind: "narrowed", why: result.unranked ?? "no ranking" },
      levels,
    };
  }, [query, answer, nameMatches, byId, searching, modes.exact, minLevel]);
}
