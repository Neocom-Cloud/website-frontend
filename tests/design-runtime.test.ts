import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const runtime = readFileSync(resolve("New_Claude_Designs/support.js"), "utf8").replace(/\r\n/g, "\n");
const start = runtime.indexOf("  function compileAttr(raw) {");
const end = runtime.indexOf("\n\n  // src/compile.ts", start);

if (start < 0 || end < 0) throw new Error("Could not find compileAttr in design runtime");

const compileAttr = new Function(
  "resolve",
  `${runtime.slice(start, end)}; return compileAttr;`
)((values: Record<string, unknown>, expression: string) => {
  const key = expression.trim();
  return key.startsWith('"') || key.startsWith("'")
    ? key.slice(1, -1)
    : values[key];
}) as (raw: string) => (values: Record<string, unknown>) => unknown;

describe("design runtime attribute interpolation", () => {
  it("keeps a whole interpolation's value type", () => {
    const value = { id: 1 };
    expect(compileAttr(" {{value}} ")({ value })).toBe(value);
  });

  it("handles multiple interpolations and delimiters inside quoted literals", () => {
    expect(compileAttr("{{first}} {{last}}")({ first: "Neo", last: "Com" })).toBe(
      "Neo Com"
    );
    expect(compileAttr("{{'a}}b'}}")({})).toBe("a}}b");
    expect(compileAttr("{{'a{{b'}}")({})).toBe("a{{b");
    expect(compileAttr("prefix {{'a}}b'}} / {{value}}")({ value: "end" })).toBe(
      "prefix a}}b / end"
    );
  });
});
