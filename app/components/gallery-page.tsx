"use client";

import {
  ItemFilter,
  ItemFilterContext,
  ItemFilterProvider,
} from "@/app/components/item-filter";
import { AdvancedSettings } from "@/app/components/advanced-settings";
import { GalleryTile } from "@/app/components/gallery-tile";
import { SearchModeToggles } from "@/app/components/search-mode-toggles";
import { PaletteToggle } from "@/app/components/palette-toggle";
import { TileSizeSlider } from "@/app/components/tile-size-slider";
import {
  RankedStatus,
  useRankedItems,
} from "@/app/components/use-ranked-items";
import { getEntryKey } from "@/lib/get-entry-key";
import { getMediumUrl, getThumbnailUrl } from "@/lib/get-thumbnail-url";
import { GalleryEntry } from "@/lib/types";
import { useJevGrades } from "@/lib/use-jev-grades";
import { useSearchCertainty, useSearchModes } from "@/lib/use-search-modes";
import {
  THUMBNAIL_MAX_WIDTH,
  TILE_SIZE_STEPS,
  useTileSize,
} from "@/lib/use-tile-size";
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
  const { modes } = useSearchModes();
  const showGrades = useJevGrades();
  const { minLevel } = useSearchCertainty();
  const {
    items: filteredItems,
    status,
    levels,
  } = useRankedItems(items, filter, rankedSearch, modes, minLevel);
  const note = statusText(status);
  const { step } = useTileSize();
  const { minWidth } = TILE_SIZE_STEPS[step];
  const tileUrl = (url: string) =>
    `/${slug}/${minWidth > THUMBNAIL_MAX_WIDTH ? getMediumUrl(url) : getThumbnailUrl(url)}`;
  return (
    <>
      {note && (
        <p className="mx-1.5 mb-2 mt-2 font-display text-xs tracking-wide text-sky-300/70">
          <span className="text-cyan-400/80">{"// "}</span>
          {note}
        </p>
      )}
      <section
        className="grid gap-2 px-2"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
        }}
      >
        <Gallery>
          {filteredItems.map((entry) => (
            <Item
              key={getEntryKey(entry)}
              original={`/${slug}/${entry.url}`}
              thumbnail={tileUrl(entry.url)}
              width={1168}
              height={915}
            >
              {({ ref, open }) => (
                <GalleryTile
                  ref={ref}
                  onClick={open}
                  src={tileUrl(entry.url)}
                  name={entry.name}
                  badge={
                    <>
                      {showGrades && levels.has(entry) && (
                        <span className="absolute left-1 top-1 bg-slate-950/90 px-1.5 py-0.5 font-display text-[10px] font-semibold text-orange-300">
                          J{levels.get(entry)}
                        </span>
                      )}
                      {paletteEnabled && (
                        <PaletteToggle
                          entryKey={getEntryKey(entry)}
                          name={entry.name}
                        />
                      )}
                    </>
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
        <ItemFilter
          {...(props.rankedSearch ? { hint: RANKED_HINT } : {})}
          controls={
            props.rankedSearch ? (
              <SearchModeToggles>
                <TileSizeSlider />
              </SearchModeToggles>
            ) : (
              <AdvancedSettings>
                <TileSizeSlider />
              </AdvancedSettings>
            )
          }
        />
        <GalleryChildren {...props} />
      </ItemFilterProvider>
    </section>
  );
};
