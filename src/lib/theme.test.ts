import { describe, expect, it } from "vitest";
import { applyTheme, getOppositeTheme, readStoredTheme } from "./theme";

describe("theme helpers", () => {
  it("defaults to light when nothing is stored", () => {
    expect(readStoredTheme()).toBe("light");
  });

  it("reads a stored dark theme and ignores unknown values", () => {
    window.localStorage.setItem("neocom-theme", "dark");
    expect(readStoredTheme()).toBe("dark");

    window.localStorage.setItem("neocom-theme", "sepia");
    expect(readStoredTheme()).toBe("light");
  });

  it("applies the theme to the document and persists it", () => {
    applyTheme("dark");

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("neocom-theme")).toBe("dark");
  });

  it("does not throw when storage is denied", () => {
    const original = window.localStorage;

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem() {
          throw new Error("denied");
        },
        setItem() {
          throw new Error("denied");
        }
      }
    });

    try {
      expect(readStoredTheme()).toBe("light");
      expect(() => applyTheme("dark")).not.toThrow();
    } finally {
      Object.defineProperty(window, "localStorage", { configurable: true, value: original });
    }
  });

  it("flips between themes", () => {
    expect(getOppositeTheme("light")).toBe("dark");
    expect(getOppositeTheme("dark")).toBe("light");
  });
});
