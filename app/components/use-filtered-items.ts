import { GalleryEntry } from "@/lib/types";

export const useFilteredItems = (
  items: GalleryEntry[],
  filter: string
): GalleryEntry[] => {
  return items.filter((item) =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );
};
