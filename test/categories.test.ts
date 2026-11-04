import { describe, expect, it } from "vitest";
import {
  CATEGORIES_PER_LOOP_MAX,
  CATEGORY_MAX_LENGTH,
} from "../src/constants/categories";
import {
  allCategories,
  applyCategoryFilter,
  categoryCounts,
  hasCategory,
  inCategory,
  isCategoryFilter,
  normalizeCategory,
  renamedCategories,
  resolveFilter,
  resolveRename,
  uncategorizedLoops,
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

describe("category filter", () => {
  const loops = [loop(["Guitar"]), loop(["guitar", "Warmups"]), loop([])];

  it("narrows to nothing, a category, or the uncategorized", () => {
    expect(applyCategoryFilter(loops, null)).toBe(loops);
    expect(
      applyCategoryFilter(loops, { type: "category", name: "GUITAR" }),
    ).toHaveLength(2);
    expect(applyCategoryFilter(loops, { type: "uncategorized" })).toHaveLength(
      1,
    );
    expect(uncategorizedLoops(loops)).toHaveLength(1);
  });

  it("drops a category that no longer exists and fixes the spelling of one that does", () => {
    expect(resolveFilter({ type: "category", name: "bass" }, loops)).toBeNull();
    expect(resolveFilter({ type: "category", name: "warmups" }, loops)).toEqual(
      { type: "category", name: "Warmups" },
    );
  });

  it("keeps uncategorized only while some loop has no category", () => {
    expect(resolveFilter({ type: "uncategorized" }, loops)).toEqual({
      type: "uncategorized",
    });
    expect(resolveFilter({ type: "uncategorized" }, [loop(["A"])])).toBeNull();
    expect(resolveFilter(null, loops)).toBeNull();
  });

  it("says whether a category is the active filter", () => {
    expect(
      isCategoryFilter({ type: "category", name: "Guitar" }, "Guitar"),
    ).toBe(true);
    expect(isCategoryFilter({ type: "uncategorized" }, "Guitar")).toBe(false);
    expect(isCategoryFilter(null, "Guitar")).toBe(false);
  });
});

describe("renamedCategories", () => {
  it("replaces the name in place, ignoring case", () => {
    expect(renamedCategories(["A", "Guitar", "B"], "guitar", "Bass")).toEqual([
      "A",
      "Bass",
      "B",
    ]);
  });

  it("merges when the loop already has the new name", () => {
    expect(renamedCategories(["Guitar", "Bass"], "Guitar", "bass")).toEqual([
      "Bass",
    ]);
  });

  it("returns the same list when the loop does not have the category", () => {
    const list = ["Bass"];
    expect(renamedCategories(list, "Guitar", "Strings")).toBe(list);
  });
});

describe("resolveRename", () => {
  const known = ["Bass", "Guitar"];

  it("cleans the new name", () => {
    expect(resolveRename("Guitar", "  Slow   practice ", known)).toBe(
      "Slow practice",
    );
  });

  it("does nothing for a blank or unchanged name", () => {
    expect(resolveRename("Guitar", "   ", known)).toBeNull();
    expect(resolveRename("Guitar", "Guitar", known)).toBeNull();
  });

  it("allows changing only the capitalization", () => {
    expect(resolveRename("guitar", "Guitar", ["guitar"])).toBe("Guitar");
  });

  it("reuses the spelling of another existing category, so the two merge", () => {
    expect(resolveRename("Guitar", "bass", known)).toBe("Bass");
  });
});

describe("withoutCategory / hasCategory", () => {
  it("removes ignoring case and leaves others alone", () => {
    expect(withoutCategory(["Guitar", "Warmups"], "guitar")).toEqual([
      "Warmups",
    ]);
  });

  it("returns the same list when the category is not in it", () => {
    const list = ["Guitar"];
    expect(withoutCategory(list, "Bass")).toBe(list);
  });

  it("reports membership ignoring case", () => {
    expect(hasCategory(["Guitar"], "guitar")).toBe(true);
    expect(hasCategory(["Guitar"], "Bass")).toBe(false);
  });
});
