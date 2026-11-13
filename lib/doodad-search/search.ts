// The doodad search behind /api/doodad-search: the Doodad Finder's narrowing (keyword search plus
// the gte-small embeddings model), then Jev's ranking when the key is set and today's budget
// allows. It reads only what scripts/build-search-index.mjs wrote into .search/, so a request never
// downloads the model or embeds the catalog, only its ask.
//
// The finder and Jev are opened once per function instance and kept.

import path from "node:path";

import { readStockDoodadSources } from "@team-antioch/sc2-asset-catalog/catalog/doodad-search.js";
import { localEmbedder } from "@team-antioch/sc2-doodad-finder/embedder.js";
import {
  type Finder,
  openFinder,
  vectorCacheFile,
} from "@team-antioch/sc2-doodad-finder/finder.js";
import { jevRanker } from "@team-antioch/sc2-doodad-finder/jev-ranker.js";
import {
  orderByFit,
  type Ranker,
  RankerError,
} from "@team-antioch/sc2-doodad-finder/ranker.js";

import type { DailyBudget } from "./limits";

/** The longest ask taken: anything past it is cut. */
export const MAX_ASK_LENGTH = 200;
/** How long Jev gets before the narrowing's order is shown instead. */
const JEV_TIMEOUT_MS = 8000;

export type DoodadHit = {
  readonly id: string;
  readonly name: string;
  /** The gallery picture's file name in public/doodads, when the gallery has one. */
  readonly image?: string;
  /** Jev's grade, 0 to 3, when the ask was ranked. */
  readonly level?: number;
};

export type DoodadSearchAnswer = {
  readonly hits: readonly DoodadHit[];
  readonly ranked: boolean;
  /** Why the ask wasn't ranked, when it wasn't. */
  readonly unranked?: string;
  readonly ms: { readonly narrow: number; readonly rank?: number };
};

type Opened = { readonly finder: Finder; readonly ranker: Ranker | undefined };

const searchDir = (): string => path.join(process.cwd(), ".search");

async function open(): Promise<Opened> {
  const dir = searchDir();
  const dataDir = path.join(dir, "data");
  const sourcesOptions = {
    cacheDir: dir,
    extractedDir: path.join(dir, "extracted"),
    descriptionsFile: path.join(dataDir, "doodad-descriptions.json"),
    usesDir: path.join(dataDir, "doodad-uses"),
  };
  // The weights are in .search/models already; never fetch them on a request.
  const { env } = await import("@huggingface/transformers");
  env.allowRemoteModels = false;
  const embedder = await localEmbedder({ cacheDir: path.join(dir, "models") });
  const finder = await openFinder({
    load: async () => readStockDoodadSources(sourcesOptions),
    embedder,
    cacheFile: vectorCacheFile(embedder.model, dir),
  });
  if (finder.embeddedOnOpen)
    console.warn(
      `[doodad-search] embedded ${finder.embeddedOnOpen} cards on open: .search/ is out of date`,
    );
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  return {
    finder,
    ranker: apiKey ? jevRanker({ apiKey, timeout: JEV_TIMEOUT_MS }) : undefined,
  };
}

let opening: Promise<Opened> | undefined;
/** The instance's finder and ranker, opened on the first ask; a failed open is tried again on the next. */
function opened(): Promise<Opened> {
  opening ??= open().catch((error: unknown) => {
    opening = undefined;
    throw error;
  });
  return opening;
}

export async function searchDoodads(
  rawAsk: string,
  budget: DailyBudget,
): Promise<DoodadSearchAnswer> {
  const ask = rawAsk.trim().slice(0, MAX_ASK_LENGTH);
  const { finder, ranker } = await opened();
  const { candidates, timings } = await finder.narrow(ask);
  const { doodads } = finder.sources;
  const hit = (id: string, name: string, level?: number): DoodadHit => {
    const image = doodads[id]?.image;
    return {
      id,
      name,
      ...(image ? { image } : {}),
      ...(level !== undefined ? { level } : {}),
    };
  };
  const narrowed = (unranked: string, rank?: number): DoodadSearchAnswer => ({
    hits: candidates.map(({ id, card }) => hit(id, card.name)),
    ranked: false,
    unranked,
    ms: { narrow: timings.total, ...(rank !== undefined ? { rank } : {}) },
  });

  if (!candidates.length)
    return { hits: [], ranked: false, ms: { narrow: timings.total } };
  if (!ranker)
    return narrowed(
      "no TypeSafe key is set, so results are in the narrowing's order",
    );
  const allowed = await budget.check();
  if (!allowed.allowed) return narrowed(allowed.reason);

  const started = performance.now();
  try {
    const ranking = await ranker.rank(
      { ask, candidates: candidates.map(({ card }) => card) },
      { signal: AbortSignal.timeout(JEV_TIMEOUT_MS) },
    );
    await budget.record(ranking.cost);
    return {
      hits: orderByFit(candidates, ranking.grades).map(({ id, card, level }) =>
        hit(id, card.name, level),
      ),
      ranked: true,
      ms: { narrow: timings.total, rank: performance.now() - started },
    };
  } catch (error) {
    // An answered call that couldn't be read was still paid for.
    if (error instanceof RankerError) await budget.record(error.cost);
    console.error("[doodad-search] ranking failed:", error);
    return narrowed(
      "Jev couldn't rank this ask, so results are in the narrowing's order",
      performance.now() - started,
    );
  }
}
