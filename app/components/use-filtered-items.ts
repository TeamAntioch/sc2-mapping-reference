/** The items whose name contains any of the filter's comma-separated terms; all of them for none. */
export const useFilteredItems = <T extends { readonly name: string }>(
  items: T[],
  filter: string,
): T[] => {
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
