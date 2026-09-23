import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App integration", () => {
  it("renders the pt-BR landing page with localized navigation and project links", () => {
    render(<App locale="pt-br" pageKind="landing" />);

    expect(screen.getByRole("link", { name: "NeoCom" })).toHaveAttribute("href", "/pt-br/");
    expect(screen.getByRole("link", { name: "Projetos" })).toHaveAttribute("href", "#projects");
    expect(screen.getByRole("link", { name: "Missão" })).toHaveAttribute("href", "#mission");
    expect(screen.getByRole("link", { name: "Contato" })).toHaveAttribute("href", "#contact");
    expect(screen.getByText("Conheça nossos projetos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Falar com a NeoCom" })).toHaveAttribute(
      "href",
      "#contact"
    );
    expect(screen.getByText("NeoRecicla").closest("a")).toHaveAttribute(
      "href",
      "/pt-br/projects/neorecicla/"
    );
    expect(screen.getAllByText("contato@neocom.cloud")).toHaveLength(2);
  });

  it("follows the 3A model section order with numbered eyebrows", () => {
    render(<App locale="pt-br" pageKind="landing" />);

    const headings = screen.getAllByRole("heading").map((heading) => heading.textContent);

    expect(headings[0]).toMatch(/^Inovação em/);
    expect(headings.slice(1)).toEqual([
      "O que nos move",
      "O que estamos construindo",
      "Por que existimos",
      "Fale com a NeoCom"
    ]);
    for (const label of ["01 — Nossos valores", "02 — Projetos", "03 — Missão", "04 — Contato"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders the five value pillars and three project cards", () => {
    render(<App locale="en" pageKind="landing" />);

    expect(screen.getAllByTestId("value-tile").map((tile) => tile.textContent)).toEqual([
      "Privacy",
      "Security",
      "Reliability",
      "Verifiability",
      "Community"
    ]);

    const cards = screen.getAllByTestId("project-card");

    expect(cards.map((card) => card.getAttribute("data-accent"))).toEqual([
      "green",
      "ember",
      "amber"
    ]);
    expect(cards.map((card) => card.getAttribute("href"))).toEqual([
      "/en/projects/neorecicla/",
      "/en/projects/devrecord/",
      "/en/projects/neo-health/"
    ]);
    expect(within(cards[2]).getByText("Concept")).toBeInTheDocument();
    expect(within(cards[0]).getByText("01")).toBeInTheDocument();
  });

  it("shows the finished hero phrase without a cursor when motion is reduced", () => {
    render(<App locale="pt-br" pageKind="landing" />);

    expect(screen.getByTestId("typewriter-text")).toHaveTextContent("comunicações");
    expect(screen.queryByTestId("typewriter-cursor")).not.toBeInTheDocument();
  });

  it("renders the project page and preserves page context across locale links", () => {
    render(<App locale="en" pageKind="project" projectSlug="devrecord" />);

    expect(screen.getByRole("heading", { name: "DevRecord", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "PT" })).toHaveAttribute(
      "href",
      "/pt-br/projects/devrecord/"
    );
    expect(screen.getByRole("link", { name: "Back to projects" })).toHaveAttribute(
      "href",
      "/en/#projects"
    );
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/en/#projects"
    );
  });

  it("applies the per-project accent layer to project pages only", () => {
    const { unmount } = render(<App locale="pt-br" pageKind="project" projectSlug="neorecicla" />);

    expect(screen.getByTestId("page")).toHaveAttribute("data-accent", "green");
    expect(screen.getByTestId("page")).toHaveClass("bg-project-page");
    unmount();

    render(<App locale="pt-br" pageKind="landing" />);

    expect(screen.getByTestId("page")).not.toHaveAttribute("data-accent");
    expect(screen.getByTestId("page")).toHaveClass("bg-page");
  });

  it("renders the project detail blocks from the localized catalog", () => {
    render(<App locale="pt-br" pageKind="project" projectSlug="neo-health" />);

    expect(screen.getByText("Visão geral")).toBeInTheDocument();
    expect(screen.getByText("Pontos-chave")).toBeInTheDocument();
    expect(screen.getByText("Status atual")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByText("Conceito")).toBeInTheDocument();

    for (const link of screen.getAllByRole("link", { name: "Quero conversar sobre o Neo Health" })) {
      expect(link.getAttribute("href")).toContain("mailto:contato@neocom.cloud?subject=");
    }
  });

  it("toggles the theme and persists it to localStorage", async () => {
    const user = userEvent.setup();

    render(<App locale="pt-br" pageKind="landing" />);

    const toggle = screen.getByRole("button", { name: "Modo escuro" });

    expect(toggle).toHaveTextContent("Escuro");
    expect(document.documentElement.dataset.theme).toBe("light");

    await user.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("neocom-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Modo claro" })).toHaveTextContent("Claro");
  });

  it("starts in dark mode when the stored theme is dark", () => {
    window.localStorage.setItem("neocom-theme", "dark");

    render(<App locale="en" pageKind="landing" />);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Light mode" })).toBeInTheDocument();
  });

  it("marks the active locale and stores the choice when switching", async () => {
    const user = userEvent.setup();

    render(<App locale="pt-br" pageKind="landing" />);

    expect(screen.getByRole("link", { name: "PT" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "EN" })).not.toHaveAttribute("aria-current");

    const enLink = screen.getByRole("link", { name: "EN" });

    // jsdom cannot navigate; keep the click from triggering its "not implemented" error.
    enLink.addEventListener("click", (event) => event.preventDefault());
    await user.click(enLink);

    expect(window.localStorage.getItem("neocom-locale")).toBe("en");
  });
});
