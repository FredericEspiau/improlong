import { describe, expect, test } from "vitest";

import { formatClock, formatDrift } from "./format";

describe("formatClock", () => {
  test.each([
    [0, "0:00"],
    [999, "0:00"],
    [270_000, "4:30"],
    [2_100_000, "35:00"],
    [3_723_000, "1:02:03"],
    [-72_000, "-1:12"],
    [-500, "0:00"],
  ])("%i ms s'affiche %s", (ms, expected) => {
    expect(formatClock(ms)).toBe(expected);
  });
});

describe("formatDrift", () => {
  test.each([
    [30_000, "+30 s"],
    [-72_000, "-1 min 12 s"],
    [120_000, "+2 min"],
    [0, null],
    [400, null],
  ])("%i ms s'affiche %j", (ms, expected) => {
    expect(formatDrift(ms)).toBe(expected);
  });
});
