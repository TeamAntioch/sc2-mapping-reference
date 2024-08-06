import { GalleryNav } from "@/app/(gallery)/components/gallery-nav";
import "photoswipe/dist/photoswipe.css";

const GalleryLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <div className="p-8">
    <GalleryNav />
    {children}
  </div>
);

export default GalleryLayout;
