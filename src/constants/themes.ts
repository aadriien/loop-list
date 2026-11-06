import type { ThemeId } from "../types/theme";

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: "tech", label: "Tech" },
  { id: "haunted", label: "Haunted Mansion" },
  { id: "vhs", label: "Retro VHS" },
  { id: "fairytale", label: "Fairy Tale Castle" },
  { id: "cozy", label: "Cozy Night In" },
  { id: "neon", label: "Neon City" },
  { id: "space", label: "Space Opera" },
  { id: "jungle", label: "Jungle Safari" },
  { id: "console", label: "Retro Console" },
  { id: "win95", label: "Early Windows" },
  { id: "ocean", label: "Ocean Deep" },
  { id: "airy", label: "Airy" },
];

export const THEMES_A_Z = [...THEMES].sort((a, b) =>
  a.label.localeCompare(b.label),
);

export const DEFAULT_THEME: ThemeId = "tech";

export const THEME_STORAGE_KEY = "loop-list-theme";
