"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  useRouter,
  useSearchParams,
  usePathname,
  ReadonlyURLSearchParams,
} from "next/navigation";
import { debounce } from "lodash";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const ItemFilterContext = createContext<{
  filter: string;
  setFilter: (filter: string) => void;
}>({
  filter: "",
  setFilter: () => {},
});

const getDecodedUrlFilter = (searchParams: URLSearchParams): string => {
  const urlFilter = searchParams.get("filter") ?? "";
  return decodeURIComponent(urlFilter.replaceAll("+", " "));
};

export const ItemFilterProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlFilter = searchParams.get("filter") ?? "";
  const decoded = decodeURIComponent(urlFilter.replaceAll("+", " "));
  const [filter, setFilter] = useState(decoded);

  const updateFilter = useMemo(
    () =>
      debounce(
        (
          newFilter: string,
          currentParams: ReadonlyURLSearchParams,
          pathname: string,
          router: AppRouterInstance
        ) => {
          const params = new URLSearchParams(currentParams.toString());
          if (newFilter === getDecodedUrlFilter(params)) {
            return;
          }
          if (newFilter) {
            params.set("filter", encodeURIComponent(newFilter));
          } else {
            params.delete("filter");
          }
          router.push(pathname + "?" + params.toString());
        },
        100
      ),
    []
  );

  useEffect(() => {
    updateFilter(filter, searchParams, pathname, router);
  }, [filter, pathname, router, searchParams, updateFilter]);

  return (
    <ItemFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </ItemFilterContext.Provider>
  );
};

export const ItemFilter: React.FC<{}> = () => {
  const { filter, setFilter } = useContext(ItemFilterContext);
  return (
    <section className="my-4">
      <div>
        Filter:{" "}
        <input
          className="text-black p-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />{" "}
        <button
          className="rounded border-white border-solid border-2 p-2"
          onClick={() => setFilter("")}
        >
          clear
        </button>
      </div>
      <div className="mt-2 max-w-xl">
        <em>
          Hint: You can search for multiple terms by separating each term with a
          comma. For example: &quot;zerg, creep&quot; to search anything that
          contains either &quot;zerg&quot; or &quot;creep&quot;.
        </em>
      </div>
    </section>
  );
};
