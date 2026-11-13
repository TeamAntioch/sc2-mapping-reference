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
          router: AppRouterInstance,
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
        10,
      ),
    [],
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

const COMMA_HINT = (
  <>
    Hint: You can search for multiple terms by separating each term with a
    comma. For example: &quot;zerg, creep&quot; to search anything that contains
    either &quot;zerg&quot; or &quot;creep&quot;.
  </>
);

export const ItemFilter: React.FC<{ hint?: React.ReactNode }> = ({
  hint = COMMA_HINT,
}) => {
  const { filter, setFilter } = useContext(ItemFilterContext);
  const [localFilter, setLocalFilter] = useState(filter);
  const clear = () => {
    setLocalFilter("");
    setFilter("");
  };
  return (
    <section className="mb-6">
      <form
        role="search"
        className="flex max-w-2xl items-stretch gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setFilter(localFilter);
        }}
        onKeyUp={(e) => {
          if (e.key === "Escape") {
            clear();
          }
        }}
      >
        <label className="clip-panel flex flex-1 items-center gap-3 bg-cyan-400/50 p-px transition-colors focus-within:bg-cyan-300">
          <span className="clip-panel flex flex-1 items-center gap-3 bg-[#0a2133] px-4 py-2.5">
            <span aria-hidden className="font-display font-semibold text-cyan-400">
              &gt;
            </span>
            <span className="sr-only">Filter</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-cyan-50 placeholder:text-sky-300/40 focus:outline-none"
              placeholder="Search…"
              value={localFilter}
              onChange={(e) => setLocalFilter(e.target.value)}
            />
            {localFilter && (
              <button
                type="button"
                aria-label="Clear search"
                title="Clear search (Esc)"
                className="text-sky-300/60 transition-colors hover:text-orange-300"
                onClick={clear}
              >
                ✕
              </button>
            )}
          </span>
        </label>
        <button
          type="submit"
          className="clip-tab bg-cyan-400/20 px-5 font-display text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100 shadow-[inset_0_-2px_0_#22d3ee] transition-colors hover:bg-cyan-400/35"
        >
          Search
        </button>
      </form>
      <div className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500">
        {hint}
      </div>
    </section>
  );
};
