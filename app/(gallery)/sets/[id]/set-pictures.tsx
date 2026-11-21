"use client";

import { Gallery, Item } from "react-photoswipe-gallery";

/** One picture as the set's page shows it. */
export type ShownPicture = {
  readonly url: string;
  readonly thumbnail: string;
  /** What it shows, and what it is ("Blender render", "In game"), for its caption. */
  readonly caption: string;
  readonly label: string;
};

/** One row: a card picture beside its in-game frame, or one of the plan and overview. */
export type PictureRow = {
  readonly shows: string;
  readonly pictures: readonly ShownPicture[];
};

/** Every set picture is 1280 by 720 (sc2-mapping-reference#10). */
const WIDTH = 1280;
const HEIGHT = 720;

const Picture: React.FC<{ picture: ShownPicture }> = ({ picture }) => (
  <Item
    original={picture.url}
    thumbnail={picture.thumbnail}
    width={WIDTH}
    height={HEIGHT}
    caption={picture.caption}
    alt={picture.caption}
  >
    {({ ref, open }) => (
      <figure className="group cursor-pointer transition hover:drop-shadow-glow">
        <div
          ref={ref}
          onClick={open}
          className="clip-corner bg-sky-400/35 p-px transition-colors group-hover:bg-cyan-400"
        >
          <div className="clip-corner bg-slate-900 p-1">
            <img
              src={picture.thumbnail}
              alt={picture.caption}
              width={320}
              height={180}
              loading="lazy"
              className="block aspect-video w-full object-cover"
            />
          </div>
        </div>
        <figcaption className="mt-1.5 font-display text-[10px] uppercase tracking-wider text-sky-300/70">
          {picture.label}
        </figcaption>
      </figure>
    )}
  </Item>
);

/** The set's pictures, row by row, all in one PhotoSwipe lightbox. */
export const SetPictures: React.FC<{
  rows: readonly PictureRow[];
  views: readonly PictureRow[];
}> = ({ rows, views }) => (
  <Gallery withCaption>
    <div className="space-y-6">
      {rows.map((row) => (
        <div key={row.pictures[0]?.url ?? row.shows}>
          <p className="mb-2 text-sm text-slate-400">{row.shows}</p>
          <div className="grid max-w-3xl grid-cols-2 gap-4">
            {row.pictures.map((picture) => (
              <Picture key={picture.url} picture={picture} />
            ))}
          </div>
        </div>
      ))}
    </div>
    <h2 className="mb-3 mt-10 font-display text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">
      Plan and overview
    </h2>
    <div className="grid max-w-3xl grid-cols-2 gap-4">
      {views.flatMap((row) =>
        row.pictures.map((picture) => (
          <Picture key={picture.url} picture={picture} />
        )),
      )}
    </div>
  </Gallery>
);
