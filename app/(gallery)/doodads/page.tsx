"use client";

import doodads from "@/app/(gallery)/doodads/doodad-list";
import { GalleryPage } from "@/app/components/gallery-page";

const DoodadGallery: React.FC = () => {
  return (
    <GalleryPage items={doodads} slug="doodads" paletteEnabled rankedSearch />
  );
};

export default DoodadGallery;
