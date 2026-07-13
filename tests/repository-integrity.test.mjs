import { describe, expect, it } from "vitest";
import { findConflictMarkers } from "../scripts/verify-repository-integrity.mjs";

describe("repository integrity", () => {
  it("finds Git conflict marker lines", () => {
    const contents = [
      "before",
      "<<<<<<< HEAD",
      "local",
      "=======",
      "remote",
      ">>>>>>> branch",
      "after"
    ].join("\n");

    expect(findConflictMarkers(contents)).toEqual([2, 4, 6]);
  });

  it("does not flag ordinary content", () => {
    expect(findConflictMarkers("const value = 7;\n=======value")).toEqual([]);
  });
});
