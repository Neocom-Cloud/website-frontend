import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App integration", () => {
  it("renders the pt-BR landing page with localized navigation and project links", () => {
    render(<App locale="pt-br" pageKind="landing" />);

    expect(screen.getByRole("link", { name: "NeoCom" })).toHaveAttribute(
      "href",
      "/pt-br/",
    );
    expect(screen.getByRole("link", { name: "Projetos" })).toHaveAttribute(
      "href",
      "#projects",
    );
    expect(screen.getByText("Conheca nossos projetos")).toBeInTheDocument();
    expect(screen.getByText("NeoRecicla").closest("a")).toHaveAttribute(
      "href",
      "/pt-br/projects/neorecicla/",
    );
    expect(screen.getAllByText("contato@neocom.cloud")).toHaveLength(2);
  });

  it("renders the project page and preserves page context across locale links", () => {
    render(<App locale="en" pageKind="project" projectSlug="devrecord" />);

    expect(
      screen.getByRole("heading", { name: "DevRecord" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "PT" })).toHaveAttribute(
      "href",
      "/pt-br/projects/devrecord/",
    );
    expect(screen.getByRole("link", { name: "Back to projects" })).toHaveAttribute(
      "href",
      "/en/#projects",
    );
  });

  it("toggles the theme and persists it to localStorage", async () => {
    const user = userEvent.setup();

    render(<App locale="pt-br" pageKind="landing" />);

    const toggle = screen.getByRole("button", { name: "Modo escuro" });

    expect(document.documentElement.dataset.theme).toBe("light");

    await user.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("neocom-theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Modo claro" }),
    ).toBeInTheDocument();
  });
});
