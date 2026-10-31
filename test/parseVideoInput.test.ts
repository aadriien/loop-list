import { describe, expect, it } from "vitest";
import { parseVideoInput } from "../src/lib/parseVideoInput";

const ID = "dQw4w9WgXcQ";

describe("parseVideoInput", () => {
  it.each([
    ID,
    `https://www.youtube.com/watch?v=${ID}`,
    `youtube.com/watch?v=${ID}&list=abc`,
    `https://youtu.be/${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}`,
  ])("extracts the id from %s", (input) => {
    expect(parseVideoInput(input)?.id).toBe(ID);
  });

  it("reads the start time", () => {
    expect(parseVideoInput(`https://youtu.be/${ID}?t=1m30s`)).toEqual({
      id: ID,
      start: 90,
    });
    expect(parseVideoInput(`https://youtu.be/${ID}?t=42`)).toEqual({
      id: ID,
      start: 42,
    });
  });

  it.each([
    "",
    "hello",
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/short",
  ])("rejects %j", (input) => {
    expect(parseVideoInput(input)).toBeNull();
  });
});
