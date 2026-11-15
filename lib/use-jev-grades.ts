"use client";

import { useEffect } from "react";
import { createLocalStorageStore } from "@/lib/local-storage-store";

const gradesStore = createLocalStorageStore<boolean>(
  "sc2-mapping-reference:show-jev-grades",
  false,
  (v): v is boolean => typeof v === "boolean",
);

declare global {
  interface Window {
    /** Console command: show (true), hide (false) or flip (no argument) Jev's grade on each tile. */
    showJevGrades?: (on?: boolean) => boolean;
  }
}

/**
 * Whether tiles show Jev's grade, for tuning the semantic certainty. Off by default and switched
 * from the browser console with showJevGrades(); the choice is kept in localStorage.
 */
export const useJevGrades = (): boolean => {
  const shown = gradesStore.useValue();
  useEffect(() => {
    window.showJevGrades = (on) => {
      const next = on ?? !gradesStore.read();
      gradesStore.write(next);
      return next;
    };
    return () => {
      delete window.showJevGrades;
    };
  }, []);
  return shown;
};
