import { THEME_STORAGE_KEY, Theme } from "./routes";

export function readStoredTheme(): Theme {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage denial.
  }
}

export function getOppositeTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}
