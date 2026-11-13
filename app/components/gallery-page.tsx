"use client";

import {
  ItemFilter,
  ItemFilterContext,
  ItemFilterProvider,
} from "@/app/components/item-filter";
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
      className="underline"
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
      {note && <p className="mb-4 text-sm opacity-80">{note}</p>}
      <section className="grid grid-cols-auto-fill-100 gap-8 items-start">
        <Gallery>
          {filteredItems.map((cliff) => (
            <Item
              key={getEntryKey(cliff)}
              original={`/${slug}/${cliff.url}`}
              thumbnail={`/${slug}/${getThumbnailUrl(cliff.url)}`}
              width={1168}
              height={915}
            >
              {({ ref, open }) => (
                <div
                  ref={ref}
                  onClick={open}
                  className="flex flex-col justify-center cursor-pointer hover:text-orange-400 transition-colors"
                >
                  <div className="relative">
                    <img
                      src={`/${slug}/${getThumbnailUrl(cliff.url)}`}
                      alt={cliff.name}
                    />
                    {paletteEnabled && (
                      <PaletteToggle
                        entryKey={getEntryKey(cliff)}
                        name={cliff.name}
                      />
                    )}
                  </div>
                  <div className="text-center break-words">{cliff.name}</div>
                </div>
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
