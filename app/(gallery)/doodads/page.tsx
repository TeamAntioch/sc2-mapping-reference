"use client";

import doodads from "@/app/(gallery)/doodads/doodad-list";
import { GalleryPage } from "@/app/components/gallery-page";

const DoodadGallery: React.FC<React.PropsWithChildren<{}>> = () => {
  return <GalleryPage items={doodads} slug="doodads" />;
};

export default DoodadGallery;
