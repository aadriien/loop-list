import type { ThemeId } from "../types/theme";

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: "tech", label: "Tech" },
  { id: "haunted", label: "Haunted Mansion" },
  { id: "vhs", label: "Retro VHS" },
  { id: "airy", label: "Airy" },
];

export const DEFAULT_THEME: ThemeId = "tech";

export const THEME_STORAGE_KEY = "loop-list-theme";
