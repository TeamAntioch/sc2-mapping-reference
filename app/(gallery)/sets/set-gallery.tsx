"use client";

import { useContext, useState } from "react";

import type { SetKind } from "@team-antioch/sc2-asset-catalog/catalog/set-looks.js";

import { useRankedSets } from "@/app/(gallery)/sets/use-ranked-sets";
import {
  KIND_WORDS,
  type SetSummary,
  sizeText,
} from "@/app/(gallery)/sets/set-words";
import {
  ItemFilter,
  ItemFilterContext,
  ItemFilterProvider,
} from "@/app/components/item-filter";
import { SearchModeToggles } from "@/app/components/search-mode-toggles";
import { SearchWarmup } from "@/app/components/search-warmup";
import type { RankedStatus } from "@/app/components/use-ranked-items";
import { useJevGrades } from "@/lib/use-jev-grades";
import { useSearchCertainty, useSearchModes } from "@/lib/use-search-modes";

const HINT = (
  <>
    Describe the place your scene is in, such as &quot;the bridge of a small
    starship&quot; or &quot;a jungle clearing at night&quot;, and the cutscene
    sets that fit best come first. The sets&apos; looks are from{" "}
    <a
      className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-200"
      href="https://github.com/TeamAntioch/sc2-asset-catalog"
    >
      sc2-asset-catalog
    </a>{" "}
    (CC BY 4.0).
  </>
);

const HELP =
  "Exact matches are sets whose name contains what you typed. Semantic matches are sets whose look fits what you meant, even when the name doesn't contain your words. Exact matches are listed first.";

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

const SetTile: React.FC<{ set: SetSummary; level?: number }> = ({
  set,
  level,
}) => {
  const first = set.picture;
  return (
    <a
      href={`/sets/${set.id}`}
      className="group block transition hover:drop-shadow-glow"
    >
      <div className="clip-corner flex h-full flex-col bg-sky-400/35 p-px transition-colors group-hover:bg-cyan-400">
        <div className="clip-corner flex h-full flex-col bg-slate-900 p-1.5">
          <div className="relative">
            {first && (
              <img
                src={first.thumbnail}
                alt={first.shows}
                width={320}
                height={180}
                loading="lazy"
                className="block aspect-video w-full object-cover"
              />
            )}
            {level !== undefined && (
              <span className="absolute left-1 top-1 bg-slate-950/90 px-1.5 py-0.5 font-display text-[10px] font-semibold text-orange-300">
                J{level}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1.5 px-1 pb-1 pt-2">
            <div className="break-words font-display text-xs font-semibold uppercase leading-tight tracking-wider text-sky-100 transition-colors group-hover:text-cyan-200">
              {set.name}
            </div>
            <div className="font-display text-[10px] uppercase tracking-wider text-sky-300/70">
              {set.kind} · {sizeText(set.size)} · {set.cameras}{" "}
              {set.cameras === 1 ? "camera" : "cameras"}
            </div>
            <p className="line-clamp-3 text-xs leading-snug text-slate-400">
              {set.look}
            </p>
            <ul className="mt-auto flex flex-wrap gap-1 pt-1">
              {set.facets.map((facet) => (
                <li
                  key={facet}
                  className="border border-cyan-400/25 px-1.5 py-px text-[10px] text-sky-200/70"
                >
                  {facet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </a>
  );
};

const KindChips: React.FC<{
  kinds: readonly { kind: SetKind; count: number }[];
  picked: readonly SetKind[];
  toggle: (kind: SetKind) => void;
}> = ({ kinds, picked, toggle }) => (
  <div
    role="group"
    aria-label="Kinds of set"
    className="mb-4 flex flex-wrap items-center gap-2 font-display text-[11px] uppercase tracking-[0.12em]"
  >
    {kinds.map(({ kind, count }) => {
      const on = picked.includes(kind);
      return (
        <button
          key={kind}
          type="button"
          aria-pressed={on}
          title={KIND_WORDS[kind]}
          onClick={() => toggle(kind)}
          className={`clip-tab px-3 py-1 transition-colors ${
            on
              ? "bg-cyan-400/25 text-cyan-50 shadow-[inset_0_-2px_0_#22d3ee]"
              : "bg-slate-900/60 text-sky-300 hover:bg-cyan-400/10 hover:text-cyan-100"
          }`}
        >
          {kind} <span className="text-sky-300/50">[{count}]</span>
        </button>
      );
    })}
    <span className="font-sans text-xs normal-case tracking-normal text-slate-500">
      {picked.length ? "" : "None picked: every kind is shown."}
    </span>
  </div>
);

const SetResults: React.FC<{
  sets: SetSummary[];
  kinds: readonly { kind: SetKind; count: number }[];
}> = ({ sets, kinds }) => {
  const { filter } = useContext(ItemFilterContext);
  const { modes } = useSearchModes();
  const showGrades = useJevGrades();
  const { minLevel } = useSearchCertainty();
  const [picked, setPicked] = useState<SetKind[]>([]);
  const toggle = (kind: SetKind) =>
    setPicked((now) =>
      now.includes(kind) ? now.filter((k) => k !== kind) : [...now, kind],
    );
  const {
    sets: shown,
    status,
    levels,
  } = useRankedSets(sets, filter, picked, modes, minLevel);
  const note = statusText(status);
  return (
    <div className="px-3 pt-3 sm:px-5">
      <KindChips kinds={kinds} picked={picked} toggle={toggle} />
      {note && (
        <p className="mb-4 font-display text-xs tracking-wide text-sky-300/70">
          <span className="text-cyan-400/80">{"// "}</span>
          {note}
        </p>
      )}
      {shown.length === 0 && (
        <p className="text-sm text-slate-500">No sets match.</p>
      )}
      <section className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] items-stretch gap-6">
        {shown.map((set) => (
          <SetTile
            key={set.id}
            set={set}
            {...(showGrades && levels.has(set.id)
              ? { level: levels.get(set.id) }
              : {})}
          />
        ))}
      </section>
    </div>
  );
};

export const SetGallery: React.FC<{
  sets: SetSummary[];
  kinds: readonly { kind: SetKind; count: number }[];
}> = ({ sets, kinds }) => (
  <section>
    <ItemFilterProvider>
      <ItemFilter
        hint={HINT}
        controls={<SearchModeToggles help={HELP} />}
      />
      <SetResults sets={sets} kinds={kinds} />
    </ItemFilterProvider>
    <SearchWarmup route="/api/set-search" />
  </section>
);
