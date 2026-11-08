import { GalleryNav } from "@/app/(gallery)/components/gallery-nav";
import { PaletteOffset, PalettePanel } from "@/app/components/palette-panel";
import "photoswipe/dist/photoswipe.css";
import { Suspense } from "react";

const GalleryLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <>
    <PaletteOffset>
      <div className="p-8">
        <GalleryNav />
        <Suspense>{children}</Suspense>
      </div>
    </PaletteOffset>
    <PalettePanel />
  </>
);

export default GalleryLayout;
