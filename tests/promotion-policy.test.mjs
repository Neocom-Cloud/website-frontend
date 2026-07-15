import { describe, expect, it } from "vitest";
import {
  REQUIRED_SOURCE_BRANCHES,
  validatePromotion
} from "../scripts/verify-promotion.mjs";

describe("promotion policy", () => {
  it("defines the ordered release path", () => {
    expect(REQUIRED_SOURCE_BRANCHES).toEqual({
      "Q.A": "develop",
      main: "Q.A",
      deploy: "main"
    });
  });

  it.each([
    ["develop", "Q.A"],
    ["Q.A", "main"],
    ["main", "deploy"]
  ])("allows the expected promotion from %s to %s", (headRef, baseRef) => {
    expect(validatePromotion(baseRef, headRef)).toMatchObject({ valid: true });
  });

  it.each([
    ["feature/new-site", "Q.A"],
    ["develop", "main"],
    ["Q.A", "deploy"]
  ])("rejects an out-of-order promotion from %s to %s", (headRef, baseRef) => {
    expect(validatePromotion(baseRef, headRef)).toMatchObject({ valid: false });
  });

  it("allows feature branches to merge into develop", () => {
    expect(validatePromotion("develop", "feature/new-site")).toMatchObject({ valid: true });
  });

  it("requires both branch names", () => {
    expect(validatePromotion("deploy", "")).toMatchObject({ valid: false });
  });
});
