"use client";

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
      className={`hover:text-orange-400 transition-colors ${
        isActive ? "text-orange-400" : ""
      }`}
    >
      {name}
    </a>
  );
};

export const GalleryNav: React.FC<{}> = () => {
  const segment = useSelectedLayoutSegment();
  return (
    <nav>
      <GalleryLink name="Cliffs" url="cliffs" />
      {" | "}
      <GalleryLink name="Doodads" url="doodads" />
      {" | "}
      <GalleryLink name="Tilesets" url="tilesets" />
      {" | "}
      <GalleryLink name="Terrain Gallery" url="terrain" />
    </nav>
  );
};
