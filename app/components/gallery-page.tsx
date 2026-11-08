"use client";

import {
  ItemFilter,
  ItemFilterContext,
  ItemFilterProvider,
} from "@/app/components/item-filter";
import { PaletteToggle } from "@/app/components/palette-toggle";
import { useFilteredItems } from "@/app/components/use-filtered-items";
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
};

const GalleryChildren: React.FC<GalleryProps> = ({
  items,
  slug,
  paletteEnabled = false,
}) => {
  const { filter } = useContext(ItemFilterContext);
  const filteredItems = useFilteredItems(items, filter);
  return (
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
  );
};

export const GalleryPage: React.FC<GalleryProps> = (props) => {
  return (
    <section>
      <ItemFilterProvider>
        <ItemFilter />
        <GalleryChildren {...props} />
      </ItemFilterProvider>
    </section>
  );
};
