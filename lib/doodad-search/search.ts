// The doodad search behind /api/doodad-search: the Doodad Finder's narrowing (keyword search plus
// the gte-small embeddings model), then Jev's ranking when the key is set and today's budget
// allows. It reads only what scripts/build-search-index.mjs wrote into .search/, so a request never
// downloads the model or embeds the catalog, only its ask.
//
// An ask in another language is translated to English first (the catalog's words are English), when
// VERCEL_API_GATEWAY_KEY is set: through the AI Gateway for other scripts, with a Jev language check
// first for Latin-script asks that aren't made of the catalog's own words. English asks make no call.
// A failed or slow translation leaves the ask as typed, so it can never stop a search.
//
// The finder, Jev, the translator and the language detector are opened once per function instance
// and kept, and so are the translator's and detector's caches of what they were asked.

import path from "node:path";

import { readStockDoodadSources } from "@team-antioch/sc2-asset-catalog/catalog/doodad-search.js";
import { localEmbedder } from "@team-antioch/sc2-doodad-finder/embedder.js";
import {
  type Finder,
  openFinder,
  vectorCacheFile,
} from "@team-antioch/sc2-doodad-finder/finder.js";
import {
  cachingTranslator,
  gatewayTranslator,
} from "@team-antioch/sc2-finder-kit/gateway-translator.js";
import { jevLanguageDetector } from "@team-antioch/sc2-finder-kit/jev-language-detector.js";
import { cachingDetector } from "@team-antioch/sc2-finder-kit/language-detector.js";
import { jevRanker } from "@team-antioch/sc2-doodad-finder/jev-ranker.js";
import {
  orderByFit,
  type Ranker,
  RankerError,
} from "@team-antioch/sc2-doodad-finder/ranker.js";

import type { DailyBudget } from "@/lib/search-limits";

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
  /** The ask in English, when it was in another language and was translated. */
  readonly translated?: string;
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
  // No gateway key, no translator: asks are searched as typed. The detector is only for a
  // translator to use, so it needs the TypeSafe key as well.
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  const gatewayKey = process.env.VERCEL_API_GATEWAY_KEY?.trim();
  const translator = gatewayKey
    ? cachingTranslator(gatewayTranslator({ apiKey: gatewayKey }))
    : undefined;
  const languageDetector =
    translator && apiKey
      ? cachingDetector(jevLanguageDetector({ apiKey }))
      : undefined;
  const finder = await openFinder({
    load: async () => readStockDoodadSources(sourcesOptions),
    embedder,
    cacheFile: vectorCacheFile(embedder.model, dir),
    ...(translator ? { translator } : {}),
    ...(languageDetector ? { languageDetector } : {}),
  });
  if (finder.embeddedOnOpen)
    console.warn(
      `[doodad-search] embedded ${finder.embeddedOnOpen} cards on open: .search/ is out of date`,
    );
  const ranker = apiKey
    ? jevRanker({ apiKey, timeout: JEV_TIMEOUT_MS })
    : undefined;
  return { finder, ranker };
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

let warming: Promise<void> | undefined;
/**
 * Opens the instance's finder and narrows one throwaway ask, so the model is loaded and its first
 * (slowest) embedding done before anyone searches. Later calls on the same instance cost nothing.
 */
export function warmDoodadSearch(): Promise<void> {
  warming ??= opened()
    .then(({ finder }) => finder.narrow("warm up"))
    .then(
      () => {},
      (error: unknown) => {
        warming = undefined;
        throw error;
      },
    );
  return warming;
}

export async function searchDoodads(
  rawAsk: string,
  budget: DailyBudget,
): Promise<DoodadSearchAnswer> {
  const ask = rawAsk.trim().slice(0, MAX_ASK_LENGTH);
  const { finder, ranker } = await opened();
  const { candidates, timings, translation } = await finder.narrow(ask);
  // A language check is paid for whatever happens to the ask after it.
  if (translation?.detection && "cost" in translation.detection)
    await budget.record(translation.detection.cost);
  // What Jev ranks against: the English, when the ask was translated.
  const rankAsk = translation?.english ?? ask;
  const translated = translation?.translated ? translation.english : undefined;
  const extra = translated !== undefined ? { translated } : {};
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
    ...extra,
    ms: { narrow: timings.total, ...(rank !== undefined ? { rank } : {}) },
  });

  if (!candidates.length)
    return {
      hits: [],
      ranked: false,
      ...extra,
      ms: { narrow: timings.total },
    };
  if (!ranker)
    return narrowed(
      "no TypeSafe key is set, so results are in the narrowing's order",
    );
  const allowed = await budget.check();
  if (!allowed.allowed) return narrowed(allowed.reason);

  const started = performance.now();
  try {
    const ranking = await ranker.rank(
      { ask: rankAsk, candidates: candidates.map(({ card }) => card) },
      { signal: AbortSignal.timeout(JEV_TIMEOUT_MS) },
    );
    await budget.record(ranking.cost);
    return {
      hits: orderByFit(candidates, ranking.grades).map(({ id, card, level }) =>
        hit(id, card.name, level),
      ),
      ranked: true,
      ...extra,
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
