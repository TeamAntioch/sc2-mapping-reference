"use client";

import tilesets from "@/app/(gallery)/tilesets/tileset-list";
import { GalleryPage } from "@/app/components/gallery-page";

const DoodadGallery: React.FC<React.PropsWithChildren<{}>> = () => {
  return <GalleryPage items={tilesets} slug="tilesets" />;
};

export default DoodadGallery;
