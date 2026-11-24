"use client";

import { useEffect, useRef, useState } from "react";

import {
  AFTER_DESTROY_WORDS,
  type EffectMedia,
  type EffectSummary,
  MOVING_WORDS,
} from "@/app/(gallery)/effects/effect-words";

/** public/effects/media.json, fetched once, the first time an effect is opened. */
let mediaLoad: Promise<EffectMedia> | undefined;
const loadMedia = (): Promise<EffectMedia> =>
  (mediaLoad ??= fetch("/effects/media.json")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<EffectMedia>;
    })
    .catch((error: unknown) => {
      mediaLoad = undefined;
      throw error;
    }));

/** One key frame, cut from the effect's strip of them (all frames are 16:9, side by side). */
const StripFrame: React.FC<{
  strip: string;
  index: number;
  count: number;
  label: string;
  className?: string;
}> = ({ strip, index, count, label, className = "" }) => (
  <div
    role="img"
    aria-label={label}
    className={`aspect-video w-full bg-slate-950 bg-no-repeat ${className}`}
    style={{
      backgroundImage: `url("${strip}")`,
      backgroundSize: `${count * 100}% 100%`,
      backgroundPosition: `${count > 1 ? (index / (count - 1)) * 100 : 0}% 0`,
    }}
  />
);

const Fact: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <dt className="font-display text-[10px] uppercase tracking-[0.14em] text-cyan-400/80">
      {label}
    </dt>
    <dd className="text-sm text-slate-300">{children}</dd>
  </div>
);

/**
 * An effect opened from the gallery: its clip filmed in the game, looping, and its key frames (the
 * recording's frames where most changed, and the stills of its birth, stand, moving host, destroy
 * and death); a frame picked shows large in the clip's place. Beside them, what the catalog says
 * it looks like, and its model path to copy into the Editor.
 */
export const EffectViewer: React.FC<{
  effect: EffectSummary | undefined;
  onClose: () => void;
}> = ({ effect, onClose }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const [media, setMedia] = useState<EffectMedia | undefined>();
  const [mediaError, setMediaError] = useState<string | undefined>();
  /** The frame shown large; none shows the clip. */
  const [picked, setPicked] = useState<number | undefined>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (effect && !element.open) element.showModal();
    if (!effect && element.open) element.close();
    setPicked(undefined);
    setCopied(false);
    if (effect)
      loadMedia().then(setMedia, (error: unknown) =>
        setMediaError((error as Error).message),
      );
  }, [effect]);

  const own = effect ? media?.[effect.media] : undefined;
  const base = effect ? `/effects/${effect.media}` : "";
  const frames = own?.frames ?? [];
  const strip = `${base}-frames.jpg`;
  const facts = effect
    ? [MOVING_WORDS[effect.moving], AFTER_DESTROY_WORDS[effect.afterDestroy]].filter(Boolean)
    : [];

  const copy = async () => {
    if (!effect) return;
    try {
      await navigator.clipboard.writeText(effect.file);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog itself.
        if (event.target === dialog.current) dialog.current.close();
      }}
      aria-labelledby="effect-viewer-title"
      className="w-[min(1200px,96vw)] max-w-none border border-cyan-400/40 bg-[#070d16] p-0 text-slate-200 backdrop:bg-black/75"
    >
      {effect && (
        <div className="p-4 sm:p-5">
          <header className="mb-3 flex flex-wrap items-start gap-x-4 gap-y-1">
            <div className="min-w-0 flex-1">
              <h2
                id="effect-viewer-title"
                className="break-words font-display text-lg font-bold uppercase tracking-[0.08em] text-cyan-50"
              >
                {effect.name}
              </h2>
              <p className="font-display text-[11px] uppercase tracking-wider text-sky-300/70">
                {effect.kind} · {effect.folder}
                {effect.size ? ` · ${effect.size} next to a Marine` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="clip-tab bg-slate-900/80 px-3 py-1 font-display text-[11px] uppercase tracking-[0.12em] text-sky-300 hover:bg-cyan-400/10 hover:text-cyan-100"
            >
              Close
            </button>
          </header>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div className="clip-corner bg-sky-400/35 p-px">
                <div className="clip-corner bg-slate-950">
                  {picked === undefined && own?.clip !== false ? (
                    <video
                      key={effect.file}
                      src={`${base}.mp4`}
                      poster={`${base}.jpg`}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      className="block aspect-video w-full"
                    />
                  ) : picked !== undefined ? (
                    <StripFrame
                      strip={strip}
                      index={picked}
                      count={frames.length}
                      label={frames[picked] ?? ""}
                    />
                  ) : (
                    <img
                      src={`${base}.jpg`}
                      alt={effect.name}
                      className="block aspect-video w-full object-contain"
                    />
                  )}
                </div>
              </div>

              <div className="mt-3">
                <p className="mb-1.5 font-display text-[10px] uppercase tracking-[0.14em] text-cyan-400/80">
                  Key frames{" "}
                  <span className="normal-case tracking-normal text-slate-500">
                    · picked frames and the birth, stand and death stills show
                    the middle of the frame
                  </span>
                </p>
                {mediaError && (
                  <p className="text-xs text-orange-300">
                    The key frames couldn&apos;t load ({mediaError}).
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {own?.clip !== false && (
                    <button
                      type="button"
                      aria-pressed={picked === undefined}
                      onClick={() => setPicked(undefined)}
                      className={`group text-left ${picked === undefined ? "" : "opacity-80 hover:opacity-100"}`}
                    >
                      <div
                        className={`grid aspect-video place-items-center border bg-slate-900 font-display text-xs uppercase tracking-wider ${
                          picked === undefined
                            ? "border-cyan-300 text-cyan-100"
                            : "border-sky-400/30 text-sky-300"
                        }`}
                      >
                        ▶ Clip
                      </div>
                      <span className="mt-1 block font-display text-[10px] uppercase tracking-wider text-sky-300/70">
                        filmed in game
                      </span>
                    </button>
                  )}
                  {frames.map((label, index) => (
                    <button
                      key={`${label}-${index}`}
                      type="button"
                      aria-pressed={picked === index}
                      onClick={() => setPicked(index)}
                      className={`text-left ${picked === index ? "" : "opacity-80 hover:opacity-100"}`}
                    >
                      <div
                        className={`border ${picked === index ? "border-cyan-300" : "border-sky-400/30"}`}
                      >
                        <StripFrame
                          strip={strip}
                          index={index}
                          count={frames.length}
                          label={label}
                        />
                      </div>
                      <span className="mt-1 block font-display text-[10px] uppercase tracking-wider text-sky-300/70">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <aside className="min-w-0 space-y-3">
              <p className="text-sm leading-relaxed text-slate-300">
                {effect.look}
              </p>
              <dl className="space-y-2">
                {effect.colors.length > 0 && (
                  <Fact label="Colours">{effect.colors.join(", ")}</Fact>
                )}
                {facts.length > 0 && (
                  <Fact label="On its host">{facts.join(". ")}.</Fact>
                )}
                {effect.suits.length > 0 && (
                  <Fact label="Suits">{effect.suits.join("; ")}</Fact>
                )}
                {effect.problems.length > 0 && (
                  <Fact label="Caveats">{effect.problems.join("; ")}</Fact>
                )}
                <Fact label="Described with">
                  {effect.confidence} confidence
                </Fact>
              </dl>
              <ul className="flex flex-wrap gap-1">
                {effect.facets.map((facet) => (
                  <li
                    key={facet}
                    className="border border-cyan-400/25 px-1.5 py-px text-[10px] text-sky-200/70"
                  >
                    {facet}
                  </li>
                ))}
              </ul>
              <div>
                <p className="font-display text-[10px] uppercase tracking-[0.14em] text-cyan-400/80">
                  Model
                </p>
                <div className="mt-1 flex items-start gap-2">
                  <code className="min-w-0 flex-1 break-all bg-slate-900/80 px-2 py-1 text-[11px] text-sky-100">
                    {effect.file}
                  </code>
                  <button
                    type="button"
                    onClick={copy}
                    className="clip-tab shrink-0 bg-cyan-400/15 px-2.5 py-1 font-display text-[10px] uppercase tracking-[0.12em] text-cyan-100 hover:bg-cyan-400/25"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </dialog>
  );
};
