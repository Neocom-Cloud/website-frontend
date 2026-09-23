import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SOCIAL_ASSETS, SOCIAL_KITS } from "./assets";
import { SocialKit } from "./SocialKit";

/** The sizes X expects, declared here so the catalogue cannot grade itself. */
const EXPECTED_ARTBOARDS = [
  ["banner", 1500, 500],
  ["avatar-dark", 400, 400],
  ["avatar-light", 400, 400],
  ["post-manifesto", 1600, 900],
  ["post-portfolio", 1600, 900],
  ["devrecord-banner", 1500, 500],
  ["devrecord-avatar", 400, 400],
  ["devrecord-avatar-light", 400, 400],
  ["devrecord-post-thesis", 1600, 900],
  ["devrecord-post-what", 1600, 900]
] as const;

describe("SocialKit", () => {
  it("renders every expected artboard at its native pixel size", () => {
    const { container } = render(<SocialKit />);
    const artboards = Array.from(
      container.querySelectorAll<HTMLElement>("[data-social-artboard]")
    );

    expect(artboards.map((artboard) => artboard.dataset.socialArtboard)).toEqual(
      EXPECTED_ARTBOARDS.map(([id]) => id)
    );

    for (const [id, width, height] of EXPECTED_ARTBOARDS) {
      const artboard = container.querySelector<HTMLElement>(`[data-social-artboard="${id}"]`)!;

      expect(artboard.style.width, id).toBe(`${width}px`);
      expect(artboard.style.height, id).toBe(`${height}px`);

      // The catalogue drives both the render and the captions, so hold it to
      // the same numbers instead of letting it define them.
      const asset = SOCIAL_ASSETS.find((candidate) => candidate.id === id)!;

      expect([asset.width, asset.height], id).toEqual([width, height]);
    }
  });

  it("groups the artboards into the NeoCom and DevRecord kits", () => {
    const { container } = render(<SocialKit />);

    for (const kit of SOCIAL_KITS) {
      const section = container.querySelector(`[data-social-kit="${kit.id}"]`)!;

      expect(section).toHaveTextContent(kit.title);
      expect(section.querySelectorAll("[data-social-artboard]")).toHaveLength(
        SOCIAL_ASSETS.filter((asset) => asset.kit === kit.id).length
      );
    }
  });

  it("carries the approved copy of both kits", () => {
    render(<SocialKit />);

    expect(screen.getByText("Inovação só vale quando dá para comprovar.")).toBeInTheDocument();
    expect(screen.getByText("Três projetos em construção")).toBeInTheDocument();
    expect(
      screen.getByText("Seu histórico técnico não deveria pertencer a uma plataforma.")
    ).toBeInTheDocument();
    expect(screen.getByText("Sem plataforma central")).toBeInTheDocument();
    expect(screen.getByText("neocom.cloud / devrecord")).toBeInTheDocument();
  });

  it("uses decorative empty alt text for every artwork image", () => {
    const { container } = render(<SocialKit />);

    for (const image of container.querySelectorAll("img")) {
      expect(image).toHaveAttribute("alt", "");
    }
  });
});
