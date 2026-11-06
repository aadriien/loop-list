import { THEMES } from "../constants/themes";
import type { ThemeId } from "../types/theme";

export const isTheme = (value: unknown): value is ThemeId =>
  THEMES.some((t) => t.id === value);
