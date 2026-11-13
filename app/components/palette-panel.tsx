"use client";

import doodads from "@/app/(gallery)/doodads/doodad-list";
import { HudTile } from "@/app/components/hud-tile";
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

/** Console-style counter: 3 → "03". */
const formatCount = (n: number) => String(n).padStart(2, "0");

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
      className={`fixed top-0 right-0 bottom-0 z-10 flex flex-col border-l border-cyan-400/35 bg-[#08111d]/95 shadow-[-8px_0_24px_rgba(0,0,0,0.5)] backdrop-blur ${PANEL_WIDTH_CLASSES}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
        }
      }}
    >
      <header className="flex items-center justify-between border-b border-cyan-400/35 bg-gradient-to-b from-cyan-900/40 to-transparent px-3 py-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-orange-300">
          Palette{" "}
          <span className="font-normal text-orange-300/70">
            [{formatCount(items.length)}]
          </span>
        </h2>
        <button
          type="button"
          aria-label="Close palette"
          title="Close palette"
          onClick={() => setOpen(false)}
          className="grid h-7 w-7 place-items-center border border-cyan-400/30 leading-none text-sky-200 transition-colors hover:border-orange-400 hover:text-orange-300"
        >
          ✕
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="text-sm leading-relaxed text-slate-400">
            Your palette is empty. Click the{" "}
            <span className="text-sky-100">☆</span> on any doodad to add it
            here.
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
                    <HudTile
                      ref={ref}
                      onClick={open}
                      src={`/doodads/${getThumbnailUrl(doodad.url)}`}
                      name={doodad.name}
                      badge={
                        <PaletteToggle
                          entryKey={getEntryKey(doodad)}
                          name={doodad.name}
                        />
                      }
                    />
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
      className={`border px-3 py-1 font-display text-[11px] uppercase tracking-[0.1em] transition-colors ${
        isOpen
          ? "border-orange-400 bg-orange-400/15 text-orange-200"
          : "border-orange-400/50 text-orange-300 hover:border-orange-400 hover:bg-orange-400/10"
      }`}
    >
      Palette [{formatCount(count)}]
    </button>
  );
};
