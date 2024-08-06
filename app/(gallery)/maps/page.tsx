"use client";

import maps from "@/app/(gallery)/maps/map-list";
import { GalleryPage } from "@/app/components/gallery-page";

const DoodadGallery: React.FC = () => {
  return <GalleryPage items={maps} slug="maps" />;
};

export default DoodadGallery;
