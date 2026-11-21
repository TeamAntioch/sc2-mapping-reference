import type { Metadata } from "next";

import { SET_KINDS } from "@team-antioch/sc2-asset-catalog/catalog/set-looks.js";

import { SetGallery } from "@/app/(gallery)/sets/set-gallery";
import { CARD_FACETS, type SetSummary } from "@/app/(gallery)/sets/set-words";
import { publishedSets } from "@/lib/set-search/sets";

export const metadata: Metadata = {
  title: "Sets · StarCraft 2 Mapping Reference",
  description:
    "The cinematic sets Blizzard's campaign cutscenes are filmed in, with pictures, looks and a plain-words search.",
};

const SetsPage: React.FC = () => {
  const sets = publishedSets().map((set): SetSummary => {
    const first = set.pictures[0] ?? set.views[0];
    return {
      id: set.id,
      name: set.name,
      kind: set.kind,
      look: set.look,
      facets: set.facets.slice(0, CARD_FACETS),
      size: set.size,
      cameras: set.cameras,
      ...(first
        ? { picture: { thumbnail: first.thumbnail, shows: first.shows } }
        : {}),
    };
  });
  // The chips: each kind the sets have, in the catalog's order.
  const kinds = SET_KINDS.map((kind) => ({
    kind,
    count: sets.filter((set) => set.kind === kind).length,
  })).filter(({ count }) => count > 0);
  return <SetGallery sets={sets} kinds={kinds} />;
};

export default SetsPage;
