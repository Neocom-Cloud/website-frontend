import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SOCIAL_ASSETS, SOCIAL_KITS } from "./assets";
import { SocialKit } from "./SocialKit";

describe("SocialKit", () => {
  it("renders every catalogued artboard at its native pixel size", () => {
    const { container } = render(<SocialKit />);
    const artboards = Array.from(
      container.querySelectorAll<HTMLElement>("[data-social-artboard]")
    );

    expect(artboards.map((artboard) => artboard.dataset.socialArtboard)).toEqual(
      SOCIAL_ASSETS.map((asset) => asset.id)
    );

    for (const asset of SOCIAL_ASSETS) {
      const artboard = container.querySelector<HTMLElement>(
        `[data-social-artboard="${asset.id}"]`
      )!;

      expect(artboard.style.width).toBe(`${asset.width}px`);
      expect(artboard.style.height).toBe(`${asset.height}px`);
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
