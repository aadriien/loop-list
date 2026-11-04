import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RECENT_SEARCHES_KEY } from "../src/constants/search";
import {
  addRecent,
  clearRecent,
  loadRecent,
  saveRecent,
} from "../src/lib/recentSearches";

describe("addRecent", () => {
  it("puts the newest search first", () => {
    expect(addRecent(["a", "b"], "c")).toEqual(["c", "a", "b"]);
  });

  it("trims, and moves a repeat to the front ignoring case", () => {
    expect(addRecent(["lofi", "jazz"], "  JAZZ ")).toEqual(["JAZZ", "lofi"]);
  });

  it("keeps only the newest few", () => {
    expect(addRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
  });
});

describe("recent searches storage", () => {
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

  it("round-trips and clears", () => {
    saveRecent(["lofi", "jazz"]);
    expect(loadRecent()).toEqual(["lofi", "jazz"]);
    clearRecent();
    expect(loadRecent()).toEqual([]);
  });

  it("is empty when nothing is stored", () => {
    expect(loadRecent()).toEqual([]);
  });

  it.each(["not json", '{"a":1}'])("ignores corrupt data %j", (raw) => {
    store.set(RECENT_SEARCHES_KEY, raw);
    expect(loadRecent()).toEqual([]);
  });

  it("drops entries that are not strings", () => {
    store.set(RECENT_SEARCHES_KEY, JSON.stringify(["lofi", 3, null, "jazz"]));
    expect(loadRecent()).toEqual(["lofi", "jazz"]);
  });
});
