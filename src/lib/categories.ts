import {
  CATEGORIES_PER_LOOP_MAX,
  CATEGORY_MAX_LENGTH,
} from "../constants/categories";
import type { SavedLoop } from "../types/library";

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export const normalizeCategory = (name: string) =>
  name.trim().replace(/\s+/g, " ").slice(0, CATEGORY_MAX_LENGTH).trim();

export const hasCategory = (list: string[], name: string) =>
  list.some((item) => same(item, name));

// Case-insensitive duplicates collapse (first spelling wins); result is alphabetical
export function uniqueNames(names: string[]) {
  const seen = new Map<string, string>();
  for (const name of names) {
    if (!seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
  }
  return [...seen.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

// Categories only exist while some loop has them
export const allCategories = (loops: SavedLoop[]) =>
  uniqueNames(loops.filter((l) => !l.deleted).flatMap((l) => l.categories));

// Reuses the spelling of an existing category (typing "guitar" gives "Guitar")
export function withCategory(list: string[], name: string, known: string[]) {
  const clean = normalizeCategory(name);
  if (!clean || hasCategory(list, clean)) return list;
  if (list.length >= CATEGORIES_PER_LOOP_MAX) return list;
  return [...list, known.find((k) => same(k, clean)) ?? clean];
}

export const withoutCategory = (list: string[], name: string) =>
  list.filter((item) => !same(item, name));

// Both take the loops being shown (deleted ones already left out)
export const inCategory = (loops: SavedLoop[], name: string) =>
  loops.filter((loop) => hasCategory(loop.categories, name));

export const categoryCounts = (loops: SavedLoop[]) =>
  allCategories(loops).map((name) => ({
    name,
    count: inCategory(loops, name).length,
  }));
