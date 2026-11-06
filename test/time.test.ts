import { describe, expect, it } from "vitest";
import {
  formatClock,
  formatTime,
  parseTime,
  roundTime,
  tenthsDigit,
} from "../src/lib/time";

describe("parseTime", () => {
  it.each([
    ["65.3", 65.3],
    ["1:05.3", 65.3],
    ["1:02:03", 3723],
    ["1h2m3s", 3723],
    ["90s", 90],
    [" 12 ", 12],
  ])("parses %s", (text, seconds) => {
    expect(parseTime(text)).toBeCloseTo(seconds);
  });

  it.each(["", "abc", "1:", "-5"])("rejects %j", (text) => {
    expect(parseTime(text)).toBeNull();
  });
});

describe("formatTime", () => {
  it.each([
    [0, "0:00.0"],
    [65.3, "1:05.3"],
    [3723, "1:02:03.0"],
    [59.96, "1:00.0"],
  ])("formats %d", (seconds, text) => {
    expect(formatTime(seconds)).toBe(text);
  });
});

describe("formatClock", () => {
  it.each([
    [0, "0:00"],
    [12.9, "0:12"],
    [65.3, "1:05"],
    [3723, "1:02:03"],
    [59.96, "0:59"],
  ])("formats %d", (seconds, text) => {
    expect(formatClock(seconds)).toBe(text);
  });
});

it("tenthsDigit is the digit after the decimal point", () => {
  expect(tenthsDigit(12.34)).toBe(3);
  expect(tenthsDigit(12.99)).toBe(9);
  expect(tenthsDigit(60)).toBe(0);
});

it("roundTime snaps to tenths", () => {
  expect(roundTime(12.2999999)).toBe(12.3);
});
