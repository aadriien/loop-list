import { describe, expect, it } from "vitest";
import {
  CATEGORIES_PER_LOOP_MAX,
  CATEGORY_MAX_LENGTH,
} from "../src/constants/categories";
import {
  allCategories,
  categoryCounts,
  hasCategory,
  inCategory,
  normalizeCategory,
  uniqueNames,
  withCategory,
  withoutCategory,
} from "../src/lib/categories";
import type { SavedLoop } from "../src/types/library";

const loop = (categories: string[], deleted = false): SavedLoop => ({
  id: "0123456789abcde",
  videoId: "dQw4w9WgXcQ",
  title: "Song",
  start: 0,
  end: null,
  rate: 1,
  categories,
  updatedAt: 1,
  deleted,
});

describe("normalizeCategory", () => {
  it("trims and collapses inner whitespace", () => {
    expect(normalizeCategory("  Slow   practice \n")).toBe("Slow practice");
  });

  it("limits the length", () => {
    const long = "x".repeat(CATEGORY_MAX_LENGTH + 10);
    expect(normalizeCategory(long)).toHaveLength(CATEGORY_MAX_LENGTH);
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeCategory("   ")).toBe("");
  });
});

describe("uniqueNames", () => {
  it("collapses case-insensitive repeats, first spelling wins, alphabetical", () => {
    expect(uniqueNames(["warmups", "Guitar", "Warmups", "guitar"])).toEqual([
      "Guitar",
      "warmups",
    ]);
  });
});

describe("allCategories", () => {
  it("collects names across loops and ignores deleted loops", () => {
    const loops = [
      loop(["Guitar", "Warmups"]),
      loop(["guitar", "Ear training"]),
      loop(["Only on a deleted loop"], true),
    ];
    expect(allCategories(loops)).toEqual(["Ear training", "Guitar", "Warmups"]);
  });
});

describe("withCategory", () => {
  it("adds a new category after the existing ones", () => {
    expect(withCategory(["Guitar"], "Warmups", [])).toEqual([
      "Guitar",
      "Warmups",
    ]);
  });

  it("reuses the spelling of a category that already exists elsewhere", () => {
    expect(withCategory([], " guitar ", ["Guitar"])).toEqual(["Guitar"]);
  });

  it("ignores repeats (any case) and blank names", () => {
    expect(withCategory(["Guitar"], "GUITAR", [])).toEqual(["Guitar"]);
    expect(withCategory(["Guitar"], "   ", [])).toEqual(["Guitar"]);
  });

  it("stops at the per-loop limit", () => {
    const full = Array.from(
      { length: CATEGORIES_PER_LOOP_MAX },
      (_, i) => `c${i}`,
    );
    expect(withCategory(full, "one more", [])).toEqual(full);
  });
});

describe("inCategory / categoryCounts", () => {
  const loops = [
    loop(["Guitar", "Warmups"]),
    loop(["guitar"]),
    loop([]),
    loop(["Ear training"]),
  ];

  it("keeps only loops in the category, ignoring case", () => {
    expect(inCategory(loops, "GUITAR")).toHaveLength(2);
    expect(inCategory(loops, "Bass")).toEqual([]);
  });

  it("counts loops per category, alphabetically, merging spellings", () => {
    expect(categoryCounts(loops)).toEqual([
      { name: "Ear training", count: 1 },
      { name: "Guitar", count: 2 },
      { name: "Warmups", count: 1 },
    ]);
  });

  it("has no categories when no loop has one", () => {
    expect(categoryCounts([loop([])])).toEqual([]);
  });
});

describe("withoutCategory / hasCategory", () => {
  it("removes ignoring case and leaves others alone", () => {
    expect(withoutCategory(["Guitar", "Warmups"], "guitar")).toEqual([
      "Warmups",
    ]);
  });

  it("reports membership ignoring case", () => {
    expect(hasCategory(["Guitar"], "guitar")).toBe(true);
    expect(hasCategory(["Guitar"], "Bass")).toBe(false);
  });
});
