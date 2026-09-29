import { describe, expect, test } from "vitest";

import { parseIsoDuration } from "./duration";

describe("parseIsoDuration", () => {
  test.each([
    ["PT5M", 300_000],
    ["PT35M", 2_100_000],
    ["PT30S", 30_000],
    ["PT1H", 3_600_000],
    ["PT1H2M3S", 3_723_000],
  ])("%s vaut %i ms", (input, expected) => {
    expect(parseIsoDuration(input)).toBe(expected);
  });

  test.each(["", "PT", "5M", "45M", "P1D", "PT1.5M", "pt5m"])(
    "refuse %j",
    (input) => {
      expect(() => parseIsoDuration(input)).toThrow("Durée ISO 8601 invalide");
    },
  );
});
