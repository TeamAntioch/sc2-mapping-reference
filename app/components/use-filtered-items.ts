import { GalleryEntry } from "@/lib/types";

export const useFilteredItems = (
  items: GalleryEntry[],
  filter: string
): GalleryEntry[] => {
  const allFilters = filter.split(",").map((string) => string.trim());
  if (allFilters.length === 1 && allFilters[0] === "") {
    return items;
  }
  return items.filter((item) => {
    let hasMatch = false;
    for (const f of allFilters) {
      if (item.name.toLowerCase().includes(f.toLowerCase())) {
        hasMatch = true;
        continue;
      }
    }
    return hasMatch;
  });
};
