import { LIBRARY_STORAGE_KEY } from "../constants/library";
import type { SavedLoop } from "../types/library";
import { ID_PATTERN, newId } from "./ids";
import { isTheme } from "./themes";

// Loops saved before sync existed have uuid ids and no updatedAt; older ones also lack categories
const normalize = (loop: SavedLoop): SavedLoop => ({
  ...loop,
  id: ID_PATTERN.test(loop.id) ? loop.id : newId(),
  updatedAt: loop.updatedAt ?? 0,
  categories: loop.categories ?? [],
  theme: isTheme(loop.theme) ? loop.theme : undefined,
});

export function loadLibrary(): SavedLoop[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(LIBRARY_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(parsed) ? parsed.map(normalize) : [];
  } catch {
    return [];
  }
}

export function saveLibrary(loops: SavedLoop[]) {
  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(loops));
  } catch {
    // storage full or blocked: the library just won't persist
  }
}
