export const projectSlugs = ["neorecicla", "devrecord", "apollo"];

export const projectRegistry = {
  neorecicla: {
    accent: "green",
    artSrc: "/assets/NeoRecicla_Icon.svg",
    socialImageSrc: "/assets/social-neorecicla.jpg",
    template: "standard"
  },
  devrecord: {
    accent: "ember",
    artSrc: "/assets/devrecord-icon.svg",
    socialImageSrc: "/assets/social-devrecord.jpg",
    template: "standard"
  },
  apollo: {
    accent: "amber",
    // Both variants are final brand artwork, cropped and re-encoded by
    // scripts/crop-icon-frame.mjs. The social image is a JPEG because some
    // link-preview crawlers reject WebP and render transparency as black.
    artSrc: "/assets/Icon_NeoHealth_Concept.webp",
    artLightSrc: "/assets/Icon_NeoHealth_Concept_Light.webp",
    socialImageSrc: "/assets/Icon_NeoHealth_Concept.jpg",
    template: "standard"
  }
};
