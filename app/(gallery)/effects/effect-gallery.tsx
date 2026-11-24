"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { EffectKind } from "@team-antioch/sc2-asset-catalog/catalog/effect-looks.js";

import { EffectViewer } from "@/app/(gallery)/effects/effect-viewer";
import {
  CARD_FACETS,
  type EffectSummary,
  KIND_WORDS,
} from "@/app/(gallery)/effects/effect-words";
import { useRankedEffects } from "@/app/(gallery)/effects/use-ranked-effects";
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
    Describe the effect you want, such as &quot;a purple psionic blast&quot;,
    &quot;a blue shield around a unit&quot; or &quot;burning ground&quot;, and
    the effects that look most like it come first. Each was filmed in the game
    on a Marine; open one for its clip and key frames. The effects&apos; looks
    are from{" "}
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
  "Exact matches are effects whose name contains what you typed. Semantic matches are effects whose look fits what you meant, even when the name doesn't contain your words. Exact matches are listed first.";

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

const EffectTile: React.FC<{
  effect: EffectSummary;
  level?: number;
  open: () => void;
}> = ({ effect, level, open }) => (
  <button
    type="button"
    onClick={open}
    className="group block text-left transition hover:drop-shadow-glow"
  >
    <div className="clip-corner flex h-full flex-col bg-sky-400/35 p-px transition-colors group-hover:bg-cyan-400">
      <div className="clip-corner flex h-full flex-col bg-slate-900 p-1.5">
        <div className="relative">
          <img
            src={effect.thumbnail}
            alt=""
            width={256}
            height={144}
            loading="lazy"
            className="block aspect-video w-full object-cover"
          />
          {level !== undefined && (
            <span className="absolute left-1 top-1 bg-slate-950/90 px-1.5 py-0.5 font-display text-[10px] font-semibold text-orange-300">
              J{level}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-1 pb-1 pt-2">
          <div className="break-words font-display text-xs font-semibold uppercase leading-tight tracking-wider text-sky-100 transition-colors group-hover:text-cyan-200">
            {effect.name}
          </div>
          <div className="font-display text-[10px] uppercase tracking-wider text-sky-300/70">
            {effect.kind} · {effect.folder}
          </div>
          <p className="line-clamp-3 text-xs leading-snug text-slate-400">
            {effect.look}
          </p>
          <ul className="mt-auto flex flex-wrap gap-1 pt-1">
            {effect.facets.slice(0, CARD_FACETS).map((facet) => (
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
  </button>
);

const KindChips: React.FC<{
  kinds: readonly { kind: EffectKind; count: number }[];
  picked: readonly EffectKind[];
  toggle: (kind: EffectKind) => void;
}> = ({ kinds, picked, toggle }) => (
  <div
    role="group"
    aria-label="Kinds of effect"
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

/** The effect a page address's hash names (`#Protoss/Blink/Blink`), so an opened effect can be linked to. */
const hashMedia = (): string =>
  typeof window === "undefined"
    ? ""
    : decodeURIComponent(window.location.hash.replace(/^#/, ""));

const EffectResults: React.FC<{
  effects: EffectSummary[];
  kinds: readonly { kind: EffectKind; count: number }[];
}> = ({ effects, kinds }) => {
  const { filter } = useContext(ItemFilterContext);
  const { modes } = useSearchModes();
  const showGrades = useJevGrades();
  const { minLevel } = useSearchCertainty();
  const [picked, setPicked] = useState<EffectKind[]>([]);
  const [opened, setOpened] = useState<string>("");
  const toggle = (kind: EffectKind) =>
    setPicked((now) =>
      now.includes(kind) ? now.filter((k) => k !== kind) : [...now, kind],
    );
  const {
    effects: shown,
    status,
    levels,
  } = useRankedEffects(effects, filter, picked, modes, minLevel);
  const note = statusText(status);
  const byMedia = useMemo(
    () => new Map(effects.map((effect) => [effect.media, effect])),
    [effects],
  );

  // Open the effect the address names, and follow the back and forward buttons.
  useEffect(() => {
    const follow = () => setOpened(hashMedia());
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, []);
  const open = useCallback((effect: EffectSummary) => {
    window.history.pushState(null, "", `#${encodeURI(effect.media)}`);
    setOpened(effect.media);
  }, []);
  const close = useCallback(() => {
    if (window.location.hash)
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    setOpened("");
  }, []);

  return (
    <>
      <KindChips kinds={kinds} picked={picked} toggle={toggle} />
      <SearchModeToggles help={HELP} />
      {note && (
        <p className="mb-4 font-display text-xs tracking-wide text-sky-300/70">
          <span className="text-cyan-400/80">{"// "}</span>
          {note}
        </p>
      )}
      {shown.length === 0 && (
        <p className="text-sm text-slate-500">No effects match.</p>
      )}
      <section className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] items-stretch gap-6">
        {shown.map((effect) => (
          <EffectTile
            key={effect.file}
            effect={effect}
            open={() => open(effect)}
            {...(showGrades && levels.has(effect.file)
              ? { level: levels.get(effect.file) }
              : {})}
          />
        ))}
      </section>
      <EffectViewer effect={byMedia.get(opened)} onClose={close} />
    </>
  );
};

export const EffectGallery: React.FC<{
  effects: EffectSummary[];
  kinds: readonly { kind: EffectKind; count: number }[];
}> = ({ effects, kinds }) => (
  <section>
    <ItemFilterProvider>
      <ItemFilter hint={HINT} />
      <EffectResults effects={effects} kinds={kinds} />
    </ItemFilterProvider>
    <SearchWarmup route="/api/effect-search" />
  </section>
);
