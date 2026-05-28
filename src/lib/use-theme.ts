"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Light/dark theme toggle. The real value is set on `<html data-theme="…">`
 * by the inline boot script in `app/layout.tsx` BEFORE paint, so there is no
 * flash on navigation. This hook syncs React state with that attribute and
 * persists user choice to localStorage.
 */

// Versioned key — bumped to :v2 when the brand pivoted to black + amber,
// invalidating everyone's previously-cached "dark" choice so the new
// default takes hold for both fresh and returning visitors.
const STORAGE_KEY = "4pielabs:theme:v2";

export type Theme = "light" | "dark";

function readCurrent(): Theme {
  if (typeof document === "undefined") return "light";
  return (document.documentElement.getAttribute("data-theme") as Theme) || "light";
}

export function useTheme() {
  // SSR-safe default; the effect below reads the real value after mount.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setThemeState(readCurrent());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage can throw in private mode / blocked storage; ignore.
    }
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(readCurrent() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggle };
}
