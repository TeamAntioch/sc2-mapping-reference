import React from "react";

/**
 * A gallery picture in a clipped-corner console frame, used by the gallery
 * grid and the palette panel. The glow sits on the outer element as a
 * drop-shadow because the frame's clip-path would cut off a box-shadow.
 */
export const HudTile = React.forwardRef<
  HTMLDivElement,
  {
    src: string;
    name: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    /** Overlaid on the picture's corner, such as the palette toggle. */
    badge?: React.ReactNode;
  }
>(({ src, name, onClick, badge }, ref) => (
  <div
    ref={ref}
    onClick={onClick}
    className="group cursor-pointer transition hover:drop-shadow-glow"
  >
    <div className="clip-corner flex flex-col bg-sky-400/35 p-px transition-colors group-hover:bg-cyan-400">
      <div className="clip-corner flex flex-col bg-slate-900 p-1">
        <div className="relative">
          <img src={src} alt={name} className="block w-full" />
          {badge}
        </div>
        <div className="break-words px-0.5 pb-0.5 pt-1.5 font-display text-[11px] uppercase leading-tight tracking-wider text-sky-200 transition-colors group-hover:text-cyan-200">
          {name}
        </div>
      </div>
    </div>
  </div>
));
HudTile.displayName = "HudTile";
