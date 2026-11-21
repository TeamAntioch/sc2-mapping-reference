// The cinematic sets as the site shows them: the catalog's looks (@team-antioch/sc2-asset-catalog),
// made into the Set Finder's cards with their pictures served from this site's own public/sets,
// not GitHub. The pages read them when they are built; the search reads its copy in .search/.

import type { SetLook } from "@team-antioch/sc2-asset-catalog/catalog/set-looks.js";
import {
  setAnswer,
  type SetAnswer,
  type SetCard,
  setCards,
} from "@team-antioch/sc2-set-finder";

/** Where this site serves the sets' pictures: public/sets, laid out a folder a set id. */
export const SET_PICTURES_BASE = "/sets";

let cards: SetCard[] | undefined;
const publishedCards = (): SetCard[] =>
  (cards ??= setCards(undefined, { base: SET_PICTURES_BASE }));

/** Every published set, by name, as the pages show it. */
export const publishedSets = (): SetAnswer[] =>
  publishedCards().map((card) => setAnswer(card));

/** One published set, and its whole look (its basis and problems, which an answer leaves out). */
export function publishedSet(
  id: string,
): { readonly set: SetAnswer; readonly look: SetLook } | undefined {
  const card = publishedCards().find((each) => each.id === id);
  return card ? { set: setAnswer(card), look: card.look } : undefined;
}
