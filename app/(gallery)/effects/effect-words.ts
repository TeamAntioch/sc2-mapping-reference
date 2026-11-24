import type { EffectKind } from "@team-antioch/sc2-asset-catalog/catalog/effect-looks.js";

/** What each kind of effect is, for its chip's title. */
export const KIND_WORDS: Readonly<Record<EffectKind, string>> = {
  burst: "A one-off flash, explosion, splash or impact",
  beam: "A line between two points",
  projectile: "A missile, bolt or shot",
  aura: "Something that stays on or around its host: a shield, glow, flames or cloud",
  ground: "Something laid on the ground: a ring, pool, scorch or marker",
  trail: "A ribbon or streak left behind a mover",
  glow: "A light or flare with no shape of its own",
  object: "A solid model, such as debris or a summoned thing",
  nothing: "Nothing showed when it was filmed on its own",
};

/** What the moving and after-destroy stills showed, as the viewer says it. */
export const MOVING_WORDS = {
  follows: "Moves with its host",
  stays: "Stays put when its host moves",
  trails: "Streaks behind a moving host",
  unclear: "",
} as const;
export const AFTER_DESTROY_WORDS = {
  gone: "Gone at once when destroyed",
  lingers: "Lingers after it is destroyed",
  unclear: "",
} as const;

/** How many facets an effect's card shows. */
export const CARD_FACETS = 5;

/** What the gallery shows of an effect, and its search needs: an effect's answer, less the grades. */
export type EffectSummary = {
  /** The model's path in the game's data, the effect's id. */
  readonly file: string;
  /** Its media's path under /effects, without an extension (`Protoss/Blink/Blink`). */
  readonly media: string;
  readonly name: string;
  readonly folder: string;
  readonly kind: EffectKind;
  readonly look: string;
  readonly colors: readonly string[];
  readonly size?: string;
  readonly moving: keyof typeof MOVING_WORDS;
  readonly afterDestroy: keyof typeof AFTER_DESTROY_WORDS;
  readonly facets: readonly string[];
  readonly suits: readonly string[];
  readonly confidence: "high" | "medium" | "low";
  readonly problems: readonly string[];
  readonly thumbnail: string;
};

/** public/effects/media.json: each effect's key frames' labels in its strip's order, and whether it has a clip. */
export type EffectMedia = Readonly<
  Record<string, { readonly frames: readonly string[]; readonly clip: boolean }>
>;
