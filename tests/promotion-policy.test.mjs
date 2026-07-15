import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  REQUIRED_SOURCE_BRANCHES,
  validatePromotion
} from "../scripts/verify-promotion.mjs";

function runPromotionCli(environment) {
  const testFilePath = import.meta.url.startsWith("file:")
    ? fileURLToPath(import.meta.url)
    : import.meta.url;
  const scriptPath = resolve(
    dirname(testFilePath),
    "../scripts/verify-promotion.mjs"
  );

  return spawnSync(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, ...environment }
  });
}

describe("promotion policy", () => {
  it("defines the ordered release path", () => {
    expect(REQUIRED_SOURCE_BRANCHES).toEqual({
      "Q.A": "develop",
      main: "Q.A",
      "Q.A.E2E": "main",
      deploy: "Q.A.E2E"
    });
  });

  it.each([
    ["develop", "Q.A"],
    ["Q.A", "main"],
    ["main", "Q.A.E2E"],
    ["Q.A.E2E", "deploy"]
  ])("allows the expected promotion from %s to %s", (headRef, baseRef) => {
    expect(validatePromotion(baseRef, headRef)).toMatchObject({ valid: true });
  });

  it.each([
    ["feature/new-site", "Q.A"],
    ["develop", "main"],
    ["Q.A", "Q.A.E2E"],
    ["main", "deploy"]
  ])("rejects an out-of-order promotion from %s to %s", (headRef, baseRef) => {
    expect(validatePromotion(baseRef, headRef)).toMatchObject({ valid: false });
  });

  it("allows feature branches to merge into develop", () => {
    expect(validatePromotion("develop", "feature/new-site")).toMatchObject({ valid: true });
  });

  it.each([
    ["", "Q.A"],
    ["main", ""]
  ])("requires both branch names", (baseRef, headRef) => {
    expect(validatePromotion(baseRef, headRef)).toMatchObject({ valid: false });
  });

  it("accepts an ordered promotion through the CLI entry point", () => {
    const result = runPromotionCli({ BASE_REF: "Q.A", HEAD_REF: "develop" });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Promotion path accepted: develop -> Q.A.");
    expect(result.stderr).toBe("");
  });

  it("accepts the Q.A.E2E promotion through the CLI entry point", () => {
    const result = runPromotionCli({ BASE_REF: "Q.A.E2E", HEAD_REF: "main" });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Promotion path accepted: main -> Q.A.E2E.");
    expect(result.stderr).toBe("");
  });

  it.each([
    [
      { BASE_REF: "main", HEAD_REF: "develop" },
      "Pull requests into main must come from Q.A"
    ],
    [
      { BASE_REF: "", HEAD_REF: "develop" },
      "BASE_REF and HEAD_REF are required"
    ],
    [
      { BASE_REF: "main", HEAD_REF: "" },
      "BASE_REF and HEAD_REF are required"
    ]
  ])("rejects invalid CLI branch inputs", (environment, expectedMessage) => {
    const result = runPromotionCli(environment);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(expectedMessage);
  });
});
