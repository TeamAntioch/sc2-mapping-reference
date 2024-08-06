"use client";

import cliffs from "@/app/(gallery)/cliffs/cliff-list";
import { GalleryPage } from "@/app/components/gallery-page";

const CliffGallery: React.FC = () => {
  return <GalleryPage items={cliffs} slug="cliffs" />;
};

export default CliffGallery;
