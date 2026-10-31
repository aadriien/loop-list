import { describe, expect, it } from "vitest";
import { DEFAULT_STATE } from "../src/constants/loop";
import { stateFromSearch, stateToSearch } from "../src/lib/urlState";

const ID = "dQw4w9WgXcQ";

describe("urlState", () => {
  it("round-trips a full state", () => {
    const state = {
      videoId: ID,
      start: 12.5,
      end: 48,
      rate: 0.75,
      loop: false,
    };
    expect(stateFromSearch(stateToSearch(state))).toEqual(state);
  });

  it("omits defaults", () => {
    expect(stateToSearch({ ...DEFAULT_STATE, videoId: ID })).toBe(`v=${ID}`);
  });

  it("falls back to defaults for an empty or invalid query", () => {
    expect(stateFromSearch("")).toEqual(DEFAULT_STATE);
    expect(stateFromSearch("?v=nope&s=-5&e=abc&r=0")).toEqual(DEFAULT_STATE);
  });

  it("drops an end that is not after start", () => {
    expect(stateFromSearch(`?v=${ID}&s=30&e=10`).end).toBeNull();
  });
});
