import { GalleryNav } from "@/app/(gallery)/components/gallery-nav";
import "photoswipe/dist/photoswipe.css";
import { Suspense } from "react";

const GalleryLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <div className="p-8">
    <GalleryNav />
    <Suspense>{children}</Suspense>
  </div>
);

export default GalleryLayout;
