import { describe, expect, it } from "vitest";
import {
  findConflictMarkers,
  verifyRepositoryIntegrity
} from "../scripts/verify-repository-integrity.mjs";

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

  it("does not flag ordinary content or isolated conflict marker lines", () => {
    expect(findConflictMarkers("const value = 7;\n=======value\n=======")).toEqual([]);
  });

  it("does not flag incomplete conflict marker sequences", () => {
    const contents = ["<<<<<<< HEAD", "local", "=======", "remote"].join("\n");

    expect(findConflictMarkers(contents)).toEqual([]);
  });

  it("finds complete conflict blocks with a custom marker size", () => {
    const markerSize = 32;
    const contents = [
      "<".repeat(markerSize) + " HEAD",
      "local",
      "=".repeat(markerSize),
      "remote",
      ">".repeat(markerSize) + " branch"
    ].join("\n");

    expect(findConflictMarkers(contents)).toEqual([1, 3, 5]);
  });

  it("ignores conflict blocks with mismatched marker widths", () => {
    const contents = [
      "<<<<<<< HEAD",
      "local",
      "=======",
      "remote",
      ">>>>>>>> branch"
    ].join("\n");

    expect(findConflictMarkers(contents)).toEqual([]);
  });

  it("scans tracked text files and skips binary files", async () => {
    const files = new Map([
      ["clean.txt", Buffer.from("const value = 7;\n")],
      ["binary.dat", Buffer.from([0, 1, 2])],
      [
        "conflict.txt",
        Buffer.from(["<<<<<<< HEAD", "local", "=======", "remote", ">>>>>>> branch"].join("\n"))
      ]
    ]);

    await expect(
      verifyRepositoryIntegrity({
        listTrackedFiles: async () => [...files.keys()],
        readTrackedFile: async (file) => files.get(file)
      })
    ).resolves.toEqual(["conflict.txt:1", "conflict.txt:3", "conflict.txt:5"]);
  });

  it("reports no failures when every tracked text file is clean", async () => {
    await expect(
      verifyRepositoryIntegrity({
        listTrackedFiles: async () => ["clean.txt"],
        readTrackedFile: async () => Buffer.from("export const clean = true;\n")
      })
    ).resolves.toEqual([]);
  });
});
