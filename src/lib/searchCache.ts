import {
  SEARCH_CACHE_KEY,
  SEARCH_CACHE_MAX,
  SEARCH_CACHE_TTL_MS,
} from "../constants/search";
import type { SearchPage } from "../types/search";

interface Entry {
  key: string;
  savedAt: number;
  page: SearchPage;
}

function read(): Entry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const fresh = (entry: Entry, now: number) =>
  now - entry.savedAt < SEARCH_CACHE_TTL_MS;

export const cacheKey = (q: string, pageToken: string) =>
  `${q.trim().toLowerCase()}|${pageToken}`;

export function getCachedPage(key: string, now = Date.now()) {
  const entry = read().find((e) => e.key === key);
  return entry && fresh(entry, now) ? entry.page : null;
}

// Newest first; expired entries and anything past the cap are dropped
export function cachePage(key: string, page: SearchPage, now = Date.now()) {
  const kept = read().filter((e) => e.key !== key && fresh(e, now));
  const entries = [{ key, savedAt: now, page }, ...kept].slice(
    0,
    SEARCH_CACHE_MAX,
  );
  try {
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(entries));
  } catch {
    // storage full or blocked: results just won't be cached
  }
}

export function clearSearchCache() {
  try {
    localStorage.removeItem(SEARCH_CACHE_KEY);
  } catch {
    // storage blocked: nothing to clear
  }
}
