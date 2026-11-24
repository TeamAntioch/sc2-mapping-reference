// The effect search behind /api/effect-search, built as the set search is (lib/set-search): the
// Effect Finder's narrowing (keyword search plus the gte-small embeddings model, cut to the best 30
// effects), then Jev's ranking when the key is set and today's budget allows. It reads only what
// scripts/build-search-index.mjs wrote into .search/ (the looks and the effects' vectors, beside
// the doodads' and sets'), so a request never downloads the model or embeds the effects, only its
// ask.
//
// Asks in another language are translated as the other searches translate them. Kinds, when the
// page's chips pick some, are a pinned `kind` tag: the narrowing keeps only effects of those kinds.
//
// The finder, Jev, the translator and the language detector are opened once per function instance.

import path from "node:path";

import {
  EFFECT_KINDS,
  type EffectKind,
  readEffectLooks,
} from "@team-antioch/sc2-asset-catalog/catalog/effect-looks.js";
import {
  type EffectCard,
  effectCards,
  type EffectFinder,
  effectVectorCacheFile,
  JEV_WORDING,
  openEffectFinder,
} from "@team-antioch/sc2-effect-finder";
import { localEmbedder } from "@team-antioch/sc2-finder-kit/embedder.js";
import {
  cachingTranslator,
  gatewayTranslator,
} from "@team-antioch/sc2-finder-kit/gateway-translator.js";
import { jevLanguageDetector } from "@team-antioch/sc2-finder-kit/jev-language-detector.js";
import { jevRanker } from "@team-antioch/sc2-finder-kit/jev-ranker.js";
import { cachingDetector } from "@team-antioch/sc2-finder-kit/language-detector.js";
import {
  orderByFit,
  type Ranker,
  RankerError,
} from "@team-antioch/sc2-finder-kit/ranker.js";

import type { DailyBudget } from "@/lib/search-limits";

import { EFFECT_MEDIA_BASE } from "./effects";

/** The longest ask taken: anything past it is cut. */
export const MAX_ASK_LENGTH = 200;
/** How long Jev gets before the narrowing's order is shown instead. */
const JEV_TIMEOUT_MS = 8000;

export type EffectHit = {
  /** The model's path, the effect's id. */
  readonly file: string;
  readonly name: string;
  readonly kind: EffectKind;
  /** Jev's grade, 0 to 3, when the ask was ranked. */
  readonly level?: number;
};

export type EffectSearchAnswer = {
  readonly hits: readonly EffectHit[];
  readonly ranked: boolean;
  /** Why the ask wasn't ranked, when it wasn't. */
  readonly unranked?: string;
  /** The ask in English, when it was in another language and was translated. */
  readonly translated?: string;
  readonly ms: { readonly narrow: number; readonly rank?: number };
};

/** The kinds a `kind` parameter names (comma apart), less any that aren't kinds. */
export const kindsParam = (value: string | null): EffectKind[] =>
  (value ?? "")
    .split(",")
    .map((kind) => kind.trim().toLowerCase())
    .filter((kind): kind is EffectKind =>
      (EFFECT_KINDS as readonly string[]).includes(kind),
    );

type Opened = {
  readonly finder: EffectFinder;
  readonly ranker: Ranker<EffectCard> | undefined;
};

const searchDir = (): string => path.join(process.cwd(), ".search");

async function open(): Promise<Opened> {
  const dir = searchDir();
  // The weights are in .search/models already; never fetch them on a request.
  const { env } = await import("@huggingface/transformers");
  env.allowRemoteModels = false;
  const embedder = await localEmbedder({ cacheDir: path.join(dir, "models") });
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  const gatewayKey = process.env.VERCEL_API_GATEWAY_KEY?.trim();
  const translator = gatewayKey
    ? cachingTranslator(gatewayTranslator({ apiKey: gatewayKey }))
    : undefined;
  const languageDetector =
    translator && apiKey
      ? cachingDetector(jevLanguageDetector({ apiKey }))
      : undefined;
  const finder = await openEffectFinder({
    cards: effectCards(
      readEffectLooks(path.join(dir, "data", "effect-looks.json")),
      { base: EFFECT_MEDIA_BASE },
    ),
    embedder,
    cacheFile: effectVectorCacheFile(embedder.model, dir),
    ...(translator ? { translator } : {}),
    ...(languageDetector ? { languageDetector } : {}),
  });
  if (finder.embeddedOnOpen)
    console.warn(
      `[effect-search] embedded ${finder.embeddedOnOpen} cards on open: .search/ is out of date`,
    );
  // Only TYPESAFE_API_KEY, never a key file a finder's `login` saves on this machine.
  const ranker = apiKey
    ? jevRanker<EffectCard>({
        apiKey,
        wording: JEV_WORDING,
        timeout: JEV_TIMEOUT_MS,
      })
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
/** Opens the instance's finder and narrows one throwaway ask, so the first real ask doesn't pay for the cold start. */
export function warmEffectSearch(): Promise<void> {
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

export async function searchEffects(
  rawAsk: string,
  kinds: readonly EffectKind[],
  budget: DailyBudget,
): Promise<EffectSearchAnswer> {
  const ask = rawAsk.trim().slice(0, MAX_ASK_LENGTH);
  const { finder, ranker } = await opened();
  const tags = kinds.length
    ? [{ facet: "kind", value: kinds.join(", "), pinned: true }]
    : [];
  const { candidates, timings, translation } = await finder.narrow(ask, {
    tags,
  });
  // A language check is paid for whatever happens to the ask after it.
  if (translation?.detection && "cost" in translation.detection)
    await budget.record(translation.detection.cost);
  const rankAsk = translation?.english ?? ask;
  const translated = translation?.translated ? translation.english : undefined;
  const extra = translated !== undefined ? { translated } : {};
  const hit = (card: EffectCard, level?: number): EffectHit => ({
    file: card.file,
    name: card.name,
    kind: card.look.kind,
    ...(level !== undefined ? { level } : {}),
  });
  const narrowed = (unranked: string, rank?: number): EffectSearchAnswer => ({
    hits: candidates.map(({ card }) => hit(card)),
    ranked: false,
    unranked,
    ...extra,
    ms: { narrow: timings.total, ...(rank !== undefined ? { rank } : {}) },
  });

  if (!candidates.length)
    return { hits: [], ranked: false, ...extra, ms: { narrow: timings.total } };
  if (!ranker)
    return narrowed(
      "no TypeSafe key is set, so results are in the narrowing's order",
    );
  const allowed = await budget.check();
  if (!allowed.allowed) return narrowed(allowed.reason);

  const started = performance.now();
  try {
    const ranking = await ranker.rank(
      { ask: rankAsk, tags, candidates: candidates.map(({ card }) => card) },
      { signal: AbortSignal.timeout(JEV_TIMEOUT_MS) },
    );
    await budget.record(ranking.cost);
    return {
      hits: orderByFit(candidates, ranking.grades).map(({ card, level }) =>
        hit(card, level),
      ),
      ranked: true,
      ...extra,
      ms: { narrow: timings.total, rank: performance.now() - started },
    };
  } catch (error) {
    // An answered call that couldn't be read was still paid for.
    if (error instanceof RankerError) await budget.record(error.cost);
    console.error("[effect-search] ranking failed:", error);
    return narrowed(
      "Jev couldn't rank this ask, so results are in the narrowing's order",
      performance.now() - started,
    );
  }
}
