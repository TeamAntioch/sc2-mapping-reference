import { GalleryNav } from "@/app/(gallery)/components/gallery-nav";
import { PaletteOffset, PalettePanel } from "@/app/components/palette-panel";
import "photoswipe/dist/photoswipe.css";
import { Suspense } from "react";

const GalleryLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <>
    <PaletteOffset>
      <GalleryNav />
      <main className="px-4 py-6 sm:px-6">
        <Suspense>{children}</Suspense>
      </main>
    </PaletteOffset>
    <PalettePanel />
  </>
);

export default GalleryLayout;
