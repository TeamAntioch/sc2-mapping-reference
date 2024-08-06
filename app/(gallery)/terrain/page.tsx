"use client";

import terrain from "@/app/(gallery)/terrain/terrain-list";
import { GalleryPage } from "@/app/components/gallery-page";

const DoodadGallery: React.FC<React.PropsWithChildren<{}>> = () => {
  return <GalleryPage items={terrain} slug="terrain" />;
};

export default DoodadGallery;
