"use client";

import { useSyncExternalStore } from "react";

/**
 * A JSON value persisted in localStorage, readable from React via a hook and
 * kept in sync across components in this tab and across other tabs.
 */
export const createLocalStorageStore = <T>(
  storageKey: string,
  fallback: T,
  isValid: (value: unknown) => value is T
) => {
  // The browser's "storage" event only fires in *other* tabs, so writes from
  // this tab notify listeners directly.
  const listeners = new Set<() => void>();
  let cachedRaw: string | null = null;
  let cachedValue: T = fallback;

  const read = (): T => {
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(storageKey);
    } catch {
      return fallback;
    }
    // useSyncExternalStore needs a stable reference while data is unchanged.
    if (raw === cachedRaw) {
      return cachedValue;
    }
    cachedRaw = raw;
    try {
      const parsed: unknown = raw === null ? fallback : JSON.parse(raw);
      cachedValue = isValid(parsed) ? parsed : fallback;
    } catch {
      cachedValue = fallback;
    }
    return cachedValue;
  };

  const write = (value: T) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Storage full or blocked (e.g. private mode); nothing useful to do.
    }
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey || e.key === null) {
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  const useValue = (): T =>
    useSyncExternalStore(subscribe, read, () => fallback);

  return { read, write, useValue };
};
