"use client";

import { createContext, useContext, useState } from "react";

export const ItemFilterContext = createContext<{
  filter: string;
  setFilter: (filter: string) => void;
}>({
  filter: "",
  setFilter: () => {},
});

export const ItemFilterProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [filter, setFilter] = useState("");
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
      <div className="mt-2 w-6/12">
        <em>
          Hint: You can search for multiple terms by separating each term with a
          comma. For example: &quot;zerg, creep&quot; to search anything that
          contains either &quot;zerg&quot; or &quot;creep&quot;.
        </em>
      </div>
    </section>
  );
};
