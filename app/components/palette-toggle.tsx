"use client";

import { useDoodadPalette } from "@/lib/use-doodad-palette";

export const PaletteToggle: React.FC<{ entryKey: string; name: string }> = ({
  entryKey,
  name,
}) => {
  const { has, toggle } = useDoodadPalette();
  const inPalette = has(entryKey);
  const label = inPalette
    ? `Remove ${name} from palette`
    : `Add ${name} to palette`;
  return (
    <button
      type="button"
      aria-pressed={inPalette}
      aria-label={label}
      title={label}
      onClick={(e) => {
        // The tile itself opens the lightbox; don't trigger that too.
        e.stopPropagation();
        toggle(entryKey);
      }}
      className={`absolute top-1 right-1 h-7 w-7 rounded-full bg-black/70 text-lg leading-none transition-colors hover:text-orange-400 ${
        inPalette ? "text-orange-400" : "text-white"
      }`}
    >
      {inPalette ? "★" : "☆"}
    </button>
  );
};
