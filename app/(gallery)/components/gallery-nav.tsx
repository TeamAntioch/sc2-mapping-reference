"use client";

import { PalettePanelButton } from "@/app/components/palette-panel";
import { useSelectedLayoutSegment } from "next/navigation";
import React from "react";

const GalleryLink: React.FC<{
  name: string;
  url: string;
}> = ({ name, url }) => {
  const segment = useSelectedLayoutSegment();
  const isActive = segment === url;
  return (
    <a
      href={`/${url}`}
      aria-current={isActive ? "page" : undefined}
      className={`clip-tab px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.12em] transition-colors sm:px-4 ${
        isActive
          ? "bg-cyan-400/20 text-cyan-50 shadow-[inset_0_-2px_0_#22d3ee]"
          : "text-sky-300 hover:bg-cyan-400/10 hover:text-cyan-100"
      }`}
    >
      {name}
    </a>
  );
};

const REPO_URL = "https://github.com/TeamAntioch/sc2-mapping-reference";

const GitHubLink: React.FC = () => (
  <a
    href={REPO_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Mapping Reference on GitHub (opens in a new tab)"
    title="View on GitHub"
    className="grid h-8 w-8 place-items-center text-sky-300 transition-colors hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
  >
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 16 16"
      className="h-5 w-5 fill-current"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  </a>
);

export const GalleryNav: React.FC<{}> = () => (
  <header className="sticky top-0 z-[5] border-b border-cyan-400/35 bg-gradient-to-b from-cyan-900/40 to-[#070d16]/90 backdrop-blur">
    <nav className="flex flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3 sm:px-6">
      <a
        href="/"
        className="mr-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-cyan-300 transition-colors hover:text-cyan-100"
      >
        <span aria-hidden className="mr-1.5">
          ◆
        </span>
        Mapping Ref
      </a>
      <GalleryLink name="Cliffs" url="cliffs" />
      <GalleryLink name="Doodads" url="doodads" />
      <GalleryLink name="Tilesets" url="tilesets" />
      <GalleryLink name="Terrain" url="terrain" />
      <GalleryLink name="Sets" url="sets" />
      <div className="ml-auto flex items-center gap-3">
        <PalettePanelButton />
        <GitHubLink />
      </div>
    </nav>
  </header>
);
