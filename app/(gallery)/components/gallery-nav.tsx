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
      <div className="ml-auto">
        <PalettePanelButton />
      </div>
    </nav>
  </header>
);
