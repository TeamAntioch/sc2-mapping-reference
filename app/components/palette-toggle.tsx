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
      className={`absolute top-1 right-1 grid h-6 w-6 place-items-center border bg-slate-950/80 text-sm leading-none transition-colors hover:border-orange-400 hover:text-orange-300 ${
        inPalette
          ? "border-orange-400/70 text-orange-400"
          : "border-cyan-400/30 text-sky-100"
      }`}
    >
      {inPalette ? "★" : "☆"}
    </button>
  );
};
