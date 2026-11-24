"use client";

import effects from "@/app/(gallery)/effects/effect-list";
import { GalleryPage } from "@/app/components/gallery-page";

/** The game's effect models (Assets/Effects), each at the moment most is on screen, filmed in the game by sc2-adjutant's effect tour. */
const EffectGallery: React.FC = () => {
  return (
    <GalleryPage
      items={effects}
      slug="effects"
      pictureWidth={960}
      pictureHeight={540}
    />
  );
};

export default EffectGallery;
