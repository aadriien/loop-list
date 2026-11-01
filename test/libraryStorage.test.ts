import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LIBRARY_STORAGE_KEY } from "../src/constants/library";
import { ID_PATTERN } from "../src/lib/ids";
import { loadLibrary, saveLibrary } from "../src/lib/libraryStorage";
import type { SavedLoop } from "../src/types/library";

const loop: SavedLoop = {
  id: "0123456789abcde",
  videoId: "dQw4w9WgXcQ",
  title: "Song",
  start: 12.5,
  end: 48,
  rate: 0.75,
  updatedAt: 1700000000000,
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

  it("upgrades loops saved before sync existed", () => {
    const { updatedAt: _, ...legacy } = loop;
    store.set(
      LIBRARY_STORAGE_KEY,
      JSON.stringify([{ ...legacy, id: crypto.randomUUID() }]),
    );
    const [upgraded] = loadLibrary();
    expect(upgraded.id).toMatch(ID_PATTERN);
    expect(upgraded.updatedAt).toBe(0);
  });
});
