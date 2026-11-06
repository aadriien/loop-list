import { useEffect, useState } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "../constants/themes";
import { isTheme } from "../lib/themes";
import type { ThemeId } from "../types/theme";

export function useTheme() {
  // index.html applies the stored theme before first paint to avoid a flash
  const [theme, setTheme] = useState<ThemeId>(() => {
    const applied = document.documentElement.dataset.theme;
    return isTheme(applied) ? applied : DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // storage blocked (e.g. private mode): the choice just isn't remembered
    }
  }, [theme]);

  return [theme, setTheme] as const;
}
