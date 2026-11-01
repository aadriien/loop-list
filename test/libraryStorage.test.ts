import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LIBRARY_STORAGE_KEY } from "../src/constants/library";
import { loadLibrary, saveLibrary } from "../src/lib/libraryStorage";
import type { SavedLoop } from "../src/types/library";

const loop: SavedLoop = {
  id: "a",
  videoId: "dQw4w9WgXcQ",
  title: "Song",
  start: 12.5,
  end: 48,
  rate: 0.75,
};

describe("libraryStorage", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("round-trips saved loops", () => {
    saveLibrary([loop]);
    expect(loadLibrary()).toEqual([loop]);
  });

  it("is empty when nothing is stored", () => {
    expect(loadLibrary()).toEqual([]);
  });

  it.each(["not json", '{"a":1}'])("ignores corrupt data %j", (raw) => {
    store.set(LIBRARY_STORAGE_KEY, raw);
    expect(loadLibrary()).toEqual([]);
  });
});
