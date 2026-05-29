"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Light/dark theme toggle. The real value is set on `<html data-theme="…">`
 * by the inline boot script in `app/layout.tsx` BEFORE paint, so there is no
 * flash on navigation. This hook syncs React state with that attribute and
 * persists user choice to localStorage.
 */

// Versioned key, bumped to :v3 when dark became the default theme,
// invalidating everyone's previously-cached :v1/:v2 choice so the new
// default takes hold for both fresh and returning visitors.
const STORAGE_KEY = "4pielabs:theme:v3";

export type Theme = "light" | "dark";

function readCurrent(): Theme {
  if (typeof document === "undefined") return "dark";
  return (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
}

export function useTheme() {
  // SSR-safe default; the effect below reads the real value after mount.
  const [theme, setThemeState] = useState<Theme>("dark");

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
