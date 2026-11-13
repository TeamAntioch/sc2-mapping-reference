"use client";

import {
  ItemFilter,
  ItemFilterContext,
  ItemFilterProvider,
} from "@/app/components/item-filter";
import { HudTile } from "@/app/components/hud-tile";
import { PaletteToggle } from "@/app/components/palette-toggle";
import {
  RankedStatus,
  useRankedItems,
} from "@/app/components/use-ranked-items";
import { getEntryKey } from "@/lib/get-entry-key";
import { getThumbnailUrl } from "@/lib/get-thumbnail-url";
import { GalleryEntry } from "@/lib/types";
import { useContext } from "react";
import { Gallery, Item } from "react-photoswipe-gallery";

type GalleryProps = {
  items: GalleryEntry[];
  slug: string;
  /** Show a bookmark toggle on each tile for adding it to the doodad palette. */
  paletteEnabled?: boolean;
  /** Search in plain words through /api/doodad-search, in place of matching names. */
  rankedSearch?: boolean;
};

const RANKED_HINT = (
  <>
    Describe what you need in plain words, such as &quot;cover a Marine could
    hide behind&quot; or &quot;Protoss ruin pillar&quot;, and the doodads that
    fit best come first. Doodad descriptions are from{" "}
    <a
      className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-200"
      href="https://github.com/TeamAntioch/sc2-asset-catalog"
    >
      sc2-asset-catalog
    </a>{" "}
    (CC BY 4.0).
  </>
);

const statusText = (status: RankedStatus): string | undefined => {
  switch (status.kind) {
    case "searching":
      return "Searching… (showing name matches meanwhile)";
    case "ranked":
      return "Best fits first, ranked by Jev.";
    case "narrowed":
      return `Closest matches first: ${status.why}.`;
    case "failed":
      return `The search couldn't run (${status.why}), so these are name matches.`;
    default:
      return undefined;
  }
};

const GalleryChildren: React.FC<GalleryProps> = ({
  items,
  slug,
  paletteEnabled = false,
  rankedSearch = false,
}) => {
  const { filter } = useContext(ItemFilterContext);
  const { items: filteredItems, status } = useRankedItems(
    items,
    filter,
    rankedSearch,
  );
  const note = statusText(status);
  return (
    <>
      {note && (
        <p className="mb-4 font-display text-xs tracking-wide text-sky-300/70">
          <span className="text-cyan-400/80">{"// "}</span>
          {note}
        </p>
      )}
      <section className="grid grid-cols-auto-fill-100 gap-8 items-start">
        <Gallery>
          {filteredItems.map((entry) => (
            <Item
              key={getEntryKey(entry)}
              original={`/${slug}/${entry.url}`}
              thumbnail={`/${slug}/${getThumbnailUrl(entry.url)}`}
              width={1168}
              height={915}
            >
              {({ ref, open }) => (
                <HudTile
                  ref={ref}
                  onClick={open}
                  src={`/${slug}/${getThumbnailUrl(entry.url)}`}
                  name={entry.name}
                  badge={
                    paletteEnabled && (
                      <PaletteToggle
                        entryKey={getEntryKey(entry)}
                        name={entry.name}
                      />
                    )
                  }
                />
              )}
            </Item>
          ))}
        </Gallery>
      </section>
    </>
  );
};

export const GalleryPage: React.FC<GalleryProps> = (props) => {
  return (
    <section>
      <ItemFilterProvider>
        <ItemFilter {...(props.rankedSearch ? { hint: RANKED_HINT } : {})} />
        <GalleryChildren {...props} />
      </ItemFilterProvider>
    </section>
  );
};
