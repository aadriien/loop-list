import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SEARCH_CACHE_KEY,
  SEARCH_CACHE_MAX,
  SEARCH_CACHE_TTL_MS,
} from "../src/constants/search";
import {
  cacheKey,
  cachePage,
  clearSearchCache,
  getCachedPage,
} from "../src/lib/searchCache";
import type { SearchPage } from "../src/types/search";

const page = (title: string): SearchPage => ({
  items: [{ videoId: "dQw4w9WgXcQ", title, channel: "Channel" }],
  nextPageToken: "NEXT",
});

describe("searchCache", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("returns a page that was cached", () => {
    cachePage("lofi|", page("A"), 1000);
    expect(getCachedPage("lofi|", 2000)).toEqual(page("A"));
  });

  it("misses for a query that was never cached", () => {
    expect(getCachedPage("lofi|", 1000)).toBeNull();
  });

  it("ignores case and surrounding spaces in the query, but not the page", () => {
    expect(cacheKey("  LoFi ", "")).toBe(cacheKey("lofi", ""));
    expect(cacheKey("lofi", "")).not.toBe(cacheKey("lofi", "NEXT"));
  });

  it("expires after the time limit", () => {
    cachePage("lofi|", page("A"), 0);
    expect(getCachedPage("lofi|", SEARCH_CACHE_TTL_MS - 1)).not.toBeNull();
    expect(getCachedPage("lofi|", SEARCH_CACHE_TTL_MS)).toBeNull();
  });

  it("replaces an existing entry for the same key", () => {
    cachePage("lofi|", page("old"), 1000);
    cachePage("lofi|", page("new"), 2000);
    expect(getCachedPage("lofi|", 3000)?.items[0].title).toBe("new");
    expect(JSON.parse(store.get(SEARCH_CACHE_KEY) ?? "[]")).toHaveLength(1);
  });

  it("keeps only the newest entries", () => {
    for (let i = 0; i <= SEARCH_CACHE_MAX; i++) {
      cachePage(`q${i}|`, page(`${i}`), 1000 + i);
    }
    expect(getCachedPage("q0|", 5000)).toBeNull();
    expect(getCachedPage(`q${SEARCH_CACHE_MAX}|`, 5000)).not.toBeNull();
    expect(JSON.parse(store.get(SEARCH_CACHE_KEY) ?? "[]")).toHaveLength(
      SEARCH_CACHE_MAX,
    );
  });

  it("treats corrupt data as an empty cache", () => {
    store.set(SEARCH_CACHE_KEY, "{not json");
    expect(getCachedPage("lofi|", 1000)).toBeNull();
  });

  it("clears everything", () => {
    cachePage("lofi|", page("A"), 1000);
    clearSearchCache();
    expect(getCachedPage("lofi|", 1000)).toBeNull();
  });
});
