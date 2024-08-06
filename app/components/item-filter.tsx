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
        <button onClick={() => setFilter("")}>clear</button>
      </div>
    </section>
  );
};
