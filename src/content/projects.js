export const projectSlugs = ["neorecicla", "devrecord", "neo-health"];

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
  "neo-health": {
    accent: "amber",
    // Both derived from the archived PNG by scripts/crop-icon-frame.mjs: WebP
    // on the page, JPEG as the social image because some link-preview crawlers
    // reject WebP and render transparency as black.
    artSrc: "/assets/Icon_NeoHealth_Concept.webp",
    socialImageSrc: "/assets/Icon_NeoHealth_Concept.jpg",
    template: "standard"
  }
};
