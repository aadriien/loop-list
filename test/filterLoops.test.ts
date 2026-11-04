import { describe, expect, it } from "vitest";
import { filterLoops } from "../src/lib/filterLoops";
import type { SavedLoop } from "../src/types/library";

const loop = (id: string, title: string): SavedLoop => ({
  id,
  videoId: "dQw4w9WgXcQ",
  title,
  start: 0,
  end: null,
  rate: 1,
  categories: [],
  updatedAt: 1,
});

const loops = [
  loop("a", "Blackbird (Live)"),
  loop("b", "Slow Warmup in E"),
  loop("c", "blackbird solo"),
];

const ids = (found: SavedLoop[]) => found.map((l) => l.id);

describe("filterLoops", () => {
  it("returns everything, in order, for a blank query", () => {
    expect(ids(filterLoops(loops, ""))).toEqual(["a", "b", "c"]);
    expect(ids(filterLoops(loops, "   "))).toEqual(["a", "b", "c"]);
  });

  it("matches a substring anywhere in the name, ignoring case", () => {
    expect(ids(filterLoops(loops, "BIRD"))).toEqual(["a", "c"]);
    expect(ids(filterLoops(loops, "warm"))).toEqual(["b"]);
  });

  it("trims the query", () => {
    expect(ids(filterLoops(loops, "  solo "))).toEqual(["c"]);
  });

  it("treats punctuation literally, not as a pattern", () => {
    expect(ids(filterLoops(loops, "(live)"))).toEqual(["a"]);
    expect(ids(filterLoops(loops, ".*"))).toEqual([]);
  });

  it("matches only the name, not other fields", () => {
    expect(filterLoops(loops, "dQw4w9WgXcQ")).toEqual([]);
  });

  it("returns nothing when no name matches", () => {
    expect(filterLoops(loops, "zzz")).toEqual([]);
  });
});
