import type { SetKind } from "@team-antioch/sc2-asset-catalog/catalog/set-looks.js";

/** What each kind of set is, for its chip's title. */
export const KIND_WORDS: Readonly<Record<SetKind, string>> = {
  room: "An interior: one or more rooms",
  exterior: "An outdoor place",
  space: "A space scene: ships, stations or planets in space",
  props: "Loose objects with no room around them",
  effects: "Only particles, holograms or light",
  unclear: "The pictures didn't show what it is",
};

/** A set's size in cells, as its card says it. */
export const sizeText = ([x, y, z]: readonly [
  number,
  number,
  number,
]): string => `${Math.round(x)}×${Math.round(y)}×${Math.round(z)} cells`;

/** How many facets a set's card shows. */
export const CARD_FACETS = 6;

/** What the gallery's card shows of a set, and its search needs: a set's answer, cut down. */
export type SetSummary = {
  readonly id: string;
  readonly name: string;
  readonly kind: SetKind;
  readonly look: string;
  readonly facets: readonly string[];
  readonly size: readonly [number, number, number];
  readonly cameras: number;
  /** Its first picture's thumbnail and what it shows. */
  readonly picture?: { readonly thumbnail: string; readonly shows: string };
};
