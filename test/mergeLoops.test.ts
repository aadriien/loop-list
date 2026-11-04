import { describe, expect, it } from "vitest";
import { mergeLoops, sameLoops } from "../src/lib/mergeLoops";
import type { SavedLoop } from "../src/types/library";

const loop = (id: string, updatedAt: number, title = id): SavedLoop => ({
  id,
  videoId: "dQw4w9WgXcQ",
  title,
  start: 0,
  end: null,
  rate: 1,
  categories: [],
  updatedAt,
});

describe("mergeLoops", () => {
  it("pulls loops only the server has", () => {
    const { merged, toPush } = mergeLoops([], [loop("a", 1)]);
    expect(merged.map((l) => l.id)).toEqual(["a"]);
    expect(toPush).toEqual([]);
  });

  it("pushes loops only this device has", () => {
    const { merged, toPush } = mergeLoops([loop("a", 1)], []);
    expect(merged.map((l) => l.id)).toEqual(["a"]);
    expect(toPush.map((l) => l.id)).toEqual(["a"]);
  });

  it("keeps the newer local edit and pushes it", () => {
    const { merged, toPush } = mergeLoops(
      [loop("a", 5, "new")],
      [loop("a", 1, "old")],
    );
    expect(merged[0].title).toBe("new");
    expect(toPush).toHaveLength(1);
  });

  it("takes the newer server edit without pushing", () => {
    const { merged, toPush } = mergeLoops(
      [loop("a", 1, "old")],
      [loop("a", 5, "new")],
    );
    expect(merged[0].title).toBe("new");
    expect(toPush).toEqual([]);
  });

  it("propagates a newer deletion", () => {
    const tombstone = { ...loop("a", 9), deleted: true };
    const { merged } = mergeLoops([loop("a", 1)], [tombstone]);
    expect(merged[0].deleted).toBe(true);
  });

  it("sorts newest first", () => {
    const { merged } = mergeLoops([loop("a", 1)], [loop("b", 2), loop("c", 3)]);
    expect(merged.map((l) => l.id)).toEqual(["c", "b", "a"]);
  });
});

describe("sameLoops", () => {
  it("compares ids and timestamps", () => {
    expect(sameLoops([loop("a", 1)], [loop("a", 1, "renamed")])).toBe(true);
    expect(sameLoops([loop("a", 1)], [loop("a", 2)])).toBe(false);
    expect(sameLoops([loop("a", 1)], [])).toBe(false);
  });
});
