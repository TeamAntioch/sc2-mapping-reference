// The effect models as the site shows them: the catalog's effect looks
// (@team-antioch/sc2-asset-catalog), made into the Effect Finder's cards with their pictures served
// from this site's own public/effects, not GitHub. The page reads them when it is built; the search
// reads its copy in .search/.

import {
  type EffectAnswer,
  effectAnswer,
  type EffectCard,
  effectCards,
} from "@team-antioch/sc2-effect-finder";

/** Where this site serves the effects' media: public/effects, at each model's path under Assets/Effects. */
export const EFFECT_MEDIA_BASE = "/effects";

let cards: EffectCard[] | undefined;
const publishedCards = (): EffectCard[] =>
  (cards ??= effectCards(undefined, { base: EFFECT_MEDIA_BASE }));

/** Every published effect, by name, as the page shows it. */
export const publishedEffects = (): EffectAnswer[] =>
  publishedCards().map((card) => effectAnswer(card));

/** An effect's media folder name: its path under Assets/Effects without .m3 (`Protoss/Blink/Blink`). */
export const effectMediaPath = (file: string): string =>
  file.replace(/^Assets\/Effects\//, "").replace(/\.m3$/i, "");
