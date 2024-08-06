"use client";

import {
  ItemFilter,
  ItemFilterContext,
  ItemFilterProvider,
} from "@/app/components/item-filter";
import { useFilteredItems } from "@/app/components/use-filtered-items";
import { getThumbnailUrl } from "@/lib/get-thumbnail-url";
import { GalleryEntry } from "@/lib/types";
import { useContext } from "react";
import { Gallery, Item } from "react-photoswipe-gallery";

const GalleryChildren: React.FC<{ items: GalleryEntry[]; slug: string }> = ({
  items,
  slug,
}) => {
  const { filter } = useContext(ItemFilterContext);
  const filteredItems = useFilteredItems(items, filter);
  return (
    <section className="grid grid-cols-auto-fill-100 gap-8 items-start">
      <Gallery>
        {filteredItems.map((cliff) => (
          <Item
            key={cliff.url}
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
                <img
                  src={`/${slug}/${getThumbnailUrl(cliff.url)}`}
                  alt={cliff.name}
                />
                <div className="text-center">{cliff.name}</div>
              </div>
            )}
          </Item>
        ))}
      </Gallery>
    </section>
  );
};

export const GalleryPage: React.FC<
  React.PropsWithChildren<{ items: GalleryEntry[]; slug: string }>
> = ({ items, slug }) => {
  return (
    <section>
      <ItemFilterProvider>
        <ItemFilter />
        <GalleryChildren {...{ slug, items }} />
      </ItemFilterProvider>
    </section>
  );
};
