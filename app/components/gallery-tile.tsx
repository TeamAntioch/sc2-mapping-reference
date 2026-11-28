import React from "react";

/**
 * A gallery grid picture: a flat, edge-to-edge image with its name in a dark strip below,
 * so the grid packs tightly. The palette panel keeps the framed HudTile.
 */
export const GalleryTile = React.forwardRef<
  HTMLDivElement,
  {
    src: string;
    name: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    /** Overlaid on the picture's corner, such as the palette toggle. */
    badge?: React.ReactNode;
    /** A smaller name, for narrow columns. */
    compact?: boolean;
  }
>(({ src, name, onClick, badge, compact = false }, ref) => (
  <div
    ref={ref}
    onClick={onClick}
    className="group flex cursor-pointer flex-col bg-[#0f1a2e] outline outline-1 outline-transparent transition-[outline-color] hover:outline-cyan-400"
  >
    <div className="relative">
      <img
        src={src}
        alt={name}
        loading="lazy"
        className="block aspect-[1168/915] w-full object-cover"
      />
      {badge}
    </div>
    <div
      className={`break-words px-2 py-2 font-display ${compact ? "text-[11px]" : "text-[13px]"} font-medium uppercase leading-tight tracking-wider text-sky-100 transition-colors group-hover:text-cyan-200`}
    >
      {name}
    </div>
  </div>
));
GalleryTile.displayName = "GalleryTile";
