import { LIBRARY_STORAGE_KEY } from "../constants/library";
import type { SavedLoop } from "../types/library";

export function loadLibrary(): SavedLoop[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(LIBRARY_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
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
