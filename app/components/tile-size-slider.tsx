"use client";

import { TILE_SIZE_STEPS, useTileSize } from "@/lib/use-tile-size";

/** The gallery's thumbnail size, styled like the semantic certainty slider. */
export const TileSizeSlider: React.FC = () => {
  const { step, setStep } = useTileSize();
  const last = TILE_SIZE_STEPS.length - 1;
  return (
    <div className="mb-4 max-w-md font-display text-xs tracking-wide">
      <label className="flex items-center justify-between text-sky-200/80">
        <span>Thumbnail size</span>
        <span className="text-cyan-300">{TILE_SIZE_STEPS[step].label}</span>
      </label>
      <input
        type="range"
        aria-label="Thumbnail size"
        aria-valuetext={TILE_SIZE_STEPS[step].label}
        min={0}
        max={last}
        step={1}
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
        className="mt-1 w-full accent-cyan-400"
      />
      <div aria-hidden className="flex justify-between px-[7px]">
        {TILE_SIZE_STEPS.map((s) => (
          <span key={s.label} className="h-1.5 w-px bg-cyan-400/50" />
        ))}
      </div>
      <div
        aria-hidden
        className="mt-1 flex justify-between text-[10px] uppercase text-sky-300/60"
      >
        <span>{TILE_SIZE_STEPS[0].label}</span>
        <span>{TILE_SIZE_STEPS[last].label}</span>
      </div>
    </div>
  );
};
