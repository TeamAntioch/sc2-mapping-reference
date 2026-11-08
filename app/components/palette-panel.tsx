"use client";

import doodads from "@/app/(gallery)/doodads/doodad-list";
import { PaletteToggle } from "@/app/components/palette-toggle";
import { getEntryKey } from "@/lib/get-entry-key";
import { getThumbnailUrl } from "@/lib/get-thumbnail-url";
import { GalleryEntry } from "@/lib/types";
import { useDoodadPalette, usePalettePanel } from "@/lib/use-doodad-palette";
import { useMemo } from "react";
import { Gallery, Item } from "react-photoswipe-gallery";

const doodadsByKey = new Map<string, GalleryEntry>(
  doodads.map((d) => [getEntryKey(d), d])
);

/**
 * Width of the docked panel. The gallery layout pads by the same amount so the
 * grid reflows around it: roughly one gallery column on small screens, two on
 * wider ones (a column is 100px min + 32px gap).
 */
export const PANEL_WIDTH_CLASSES = "w-40 md:w-72";
export const PANEL_OFFSET_CLASSES = "pr-40 md:pr-72";

export const PalettePanel: React.FC = () => {
  const { isOpen, setOpen } = usePalettePanel();
  const { keys } = useDoodadPalette();
  // Keep the order the player added them in. Skip keys for doodads that have
  // since been renamed or removed from the list.
  const items = useMemo(
    () =>
      keys
        .map((key) => doodadsByKey.get(key))
        .filter((d): d is GalleryEntry => d !== undefined),
    [keys]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Doodad palette"
      className={`fixed top-0 right-0 bottom-0 z-10 flex flex-col border-l border-white/20 bg-neutral-900 shadow-xl ${PANEL_WIDTH_CLASSES}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
        }
      }}
    >
      <header className="flex items-center justify-between border-b border-white/20 p-3">
        <h2 className="font-semibold">
          Palette{" "}
          <span className="text-sm font-normal text-white/60">
            ({items.length})
          </span>
        </h2>
        <button
          type="button"
          aria-label="Close palette"
          title="Close palette"
          onClick={() => setOpen(false)}
          className="h-7 w-7 rounded leading-none hover:text-orange-400"
        >
          ✕
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="text-sm text-white/70">
            Your palette is empty. Click the ☆ on any doodad to add it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            <Gallery>
              {items.map((doodad) => (
                <Item
                  key={getEntryKey(doodad)}
                  original={`/doodads/${doodad.url}`}
                  thumbnail={`/doodads/${getThumbnailUrl(doodad.url)}`}
                  width={1168}
                  height={915}
                >
                  {({ ref, open }) => (
                    <div
                      ref={ref}
                      onClick={open}
                      className="flex flex-col cursor-pointer hover:text-orange-400 transition-colors"
                    >
                      <div className="relative">
                        <img
                          src={`/doodads/${getThumbnailUrl(doodad.url)}`}
                          alt={doodad.name}
                        />
                        <PaletteToggle
                          entryKey={getEntryKey(doodad)}
                          name={doodad.name}
                        />
                      </div>
                      <div className="text-center text-sm break-words">
                        {doodad.name}
                      </div>
                    </div>
                  )}
                </Item>
              ))}
            </Gallery>
          </div>
        )}
      </div>
    </aside>
  );
};

/** Pads the page content so the grid reflows beside the open panel. */
export const PaletteOffset: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { isOpen } = usePalettePanel();
  return <div className={isOpen ? PANEL_OFFSET_CLASSES : ""}>{children}</div>;
};

export const PalettePanelButton: React.FC = () => {
  const { isOpen, toggleOpen } = usePalettePanel();
  const { keys } = useDoodadPalette();
  const count = keys.filter((key) => doodadsByKey.has(key)).length;
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={toggleOpen}
      className={`hover:text-orange-400 transition-colors ${
        isOpen ? "text-orange-400" : ""
      }`}
    >
      Palette ({count})
    </button>
  );
};
