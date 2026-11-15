"use client";

import {
  CERTAINTY_STEPS,
  useSearchCertainty,
  useSearchModes,
} from "@/lib/use-search-modes";

const HELP =
  "Exact matches are doodads whose name contains what you typed. Semantic matches are doodads whose description fits what you meant, even when the name doesn't contain your words. Exact matches are listed first.";

export const SearchModeToggles: React.FC = () => {
  const { modes, setMode } = useSearchModes();
  const { certainty, setCertainty } = useSearchCertainty();
  const box = (mode: "exact" | "semantic", label: string) => (
    <label className="flex cursor-pointer items-center gap-2 text-sky-200/80">
      <input
        type="checkbox"
        className="accent-cyan-400"
        checked={modes[mode]}
        onChange={(e) => setMode(mode, e.target.checked)}
      />
      {label}
    </label>
  );
  const last = CERTAINTY_STEPS.length - 1;
  return (
    <div className="mb-4 font-display text-xs tracking-wide">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {box("exact", "Show exact matches")}
        {box("semantic", "Show semantic matches")}
        <span className="group relative">
          <button
            type="button"
            aria-label="What are exact and semantic matches?"
            aria-describedby="search-mode-help"
            className="grid h-5 w-5 place-items-center rounded-full border border-cyan-400/50 text-[11px] leading-none text-cyan-300 transition-colors hover:border-cyan-300 hover:text-cyan-100 focus-visible:border-cyan-300 focus-visible:outline-none"
          >
            ?
          </button>
          <span
            id="search-mode-help"
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 border border-cyan-400/40 bg-slate-950 p-3 font-sans text-xs normal-case leading-relaxed tracking-normal text-sky-100 shadow-lg group-focus-within:block group-hover:block"
          >
            {HELP}
          </span>
        </span>
      </div>
      <div className={`mt-3 max-w-md ${modes.semantic ? "" : "opacity-40"}`}>
        <label className="flex items-center justify-between text-sky-200/80">
          <span>Semantic certainty</span>
          <span className="text-cyan-300">
            {CERTAINTY_STEPS[certainty].label}
          </span>
        </label>
        <input
          type="range"
          aria-label="Semantic certainty"
          aria-valuetext={CERTAINTY_STEPS[certainty].label}
          min={0}
          max={last}
          step={1}
          disabled={!modes.semantic}
          value={certainty}
          onChange={(e) => setCertainty(Number(e.target.value))}
          className="mt-1 w-full accent-cyan-400"
        />
        <div aria-hidden className="flex justify-between px-[7px]">
          {CERTAINTY_STEPS.map((step) => (
            <span key={step.label} className="h-1.5 w-px bg-cyan-400/50" />
          ))}
        </div>
        <div
          aria-hidden
          className="mt-1 flex justify-between text-[10px] uppercase text-sky-300/60"
        >
          <span>{CERTAINTY_STEPS[0].label}</span>
          <span>{CERTAINTY_STEPS[last].label}</span>
        </div>
      </div>
    </div>
  );
};
