import type { Metadata } from "next";

import { EFFECT_KINDS } from "@team-antioch/sc2-asset-catalog/catalog/effect-looks.js";

import { EffectGallery } from "@/app/(gallery)/effects/effect-gallery";
import type { EffectSummary } from "@/app/(gallery)/effects/effect-words";
import {
  effectMediaPath,
  publishedEffects,
} from "@/lib/effect-search/effects";

export const metadata: Metadata = {
  title: "Effects · StarCraft 2 Mapping Reference",
  description:
    "The game's effect models, each filmed in the game, with its clip, key frames, look and a plain-words search.",
};

const EffectsPage: React.FC = () => {
  const effects = publishedEffects().map(
    (effect): EffectSummary => ({
      file: effect.file,
      media: effectMediaPath(effect.file),
      name: effect.name,
      folder: effect.folder,
      kind: effect.kind,
      look: effect.look,
      colors: effect.colors,
      ...(effect.size ? { size: effect.size } : {}),
      moving: effect.moving,
      afterDestroy: effect.afterDestroy,
      facets: effect.facets,
      suits: effect.suits,
      confidence: effect.confidence,
      problems: effect.problems,
      thumbnail: effect.picture.thumbnail,
    }),
  );
  // The chips: each kind the effects have, in the catalog's order.
  const kinds = EFFECT_KINDS.map((kind) => ({
    kind,
    count: effects.filter((effect) => effect.kind === kind).length,
  })).filter(({ count }) => count > 0);
  return <EffectGallery effects={effects} kinds={kinds} />;
};

export default EffectsPage;
