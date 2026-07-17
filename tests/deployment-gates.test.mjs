import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatDeploymentGateOutputs,
  resolveDeploymentGates,
  runDeploymentGateResolver
} from "../scripts/resolve-deployment-gates.mjs";

describe("deployment gate policy", () => {
  it("runs the Pages and browser gates only for Q.A.E2E promotion pull requests", () => {
    expect(resolveDeploymentGates("pull_request", "Q.A.E2E", "main")).toEqual({
      "deploy-status": true,
      "browser-e2e": true,
      "pre-deploy-test": false
    });
  });

  it("runs the existing-build pre-deploy gate only for deploy promotion pull requests", () => {
    expect(resolveDeploymentGates("pull_request", "deploy", "Q.A.E2E")).toEqual({
      "deploy-status": false,
      "browser-e2e": false,
      "pre-deploy-test": true
    });
  });

  it.each([
    ["push", "Q.A.E2E"],
    ["pull_request", "develop"],
    ["pull_request", "Q.A"],
    ["pull_request", "main"]
  ])("skips deployment gates for %s events targeting %s", (eventName, baseRef) => {
    expect(resolveDeploymentGates(eventName, baseRef, "feature/site")).toEqual({
      "deploy-status": false,
      "browser-e2e": false,
      "pre-deploy-test": false
    });
  });

  it("skips end-to-end gates when the pull request bypasses the promotion path", () => {
    expect(resolveDeploymentGates("pull_request", "Q.A.E2E", "develop")).toEqual({
      "deploy-status": false,
      "browser-e2e": false,
      "pre-deploy-test": false
    });
  });

  it("skips the pre-deploy gate when the pull request bypasses the promotion path", () => {
    expect(resolveDeploymentGates("pull_request", "deploy", "main")).toEqual({
      "deploy-status": false,
      "browser-e2e": false,
      "pre-deploy-test": false
    });
  });

  it("serializes GitHub Actions outputs as booleans", () => {
    expect(
      formatDeploymentGateOutputs(resolveDeploymentGates("pull_request", "Q.A.E2E", "main"))
    ).toBe("deploy-status=true\nbrowser-e2e=true\npre-deploy-test=false");
  });

  it("writes the gate outputs for downstream workflow jobs", async () => {
    const directory = await mkdtemp(join(tmpdir(), "neocom-deployment-gates-"));
    const outputPath = join(directory, "github-output");

    try {
      await runDeploymentGateResolver({
        EVENT_NAME: "pull_request",
        BASE_REF: "deploy",
        HEAD_REF: "Q.A.E2E",
        GITHUB_OUTPUT: outputPath
      });

      await expect(readFile(outputPath, "utf8")).resolves.toBe(
        "deploy-status=false\nbrowser-e2e=false\npre-deploy-test=true\n"
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it.each([
    [{}, "EVENT_NAME is required."],
    [{ EVENT_NAME: "pull_request" }, "BASE_REF and HEAD_REF are required for pull requests."],
    [
      { EVENT_NAME: "pull_request", BASE_REF: "deploy" },
      "BASE_REF and HEAD_REF are required for pull requests."
    ],
    [
      { EVENT_NAME: "pull_request", HEAD_REF: "main" },
      "BASE_REF and HEAD_REF are required for pull requests."
    ],
    [
      { EVENT_NAME: "pull_request", BASE_REF: "", HEAD_REF: "main" },
      "BASE_REF and HEAD_REF are required for pull requests."
    ],
    [
      { EVENT_NAME: "pull_request", BASE_REF: "deploy", HEAD_REF: "" },
      "BASE_REF and HEAD_REF are required for pull requests."
    ]
  ])("rejects incomplete workflow context %#", (environment, errorMessage) => {
    return expect(runDeploymentGateResolver(environment)).rejects.toThrow(errorMessage);
  });

  it("accepts non-pull-request events without branch references", async () => {
    const directory = await mkdtemp(join(tmpdir(), "neocom-deployment-gates-"));
    const outputPath = join(directory, "github-output");

    try {
      await expect(
        runDeploymentGateResolver({ EVENT_NAME: "push", GITHUB_OUTPUT: outputPath })
      ).resolves.toEqual({
        "deploy-status": false,
        "browser-e2e": false,
        "pre-deploy-test": false
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
