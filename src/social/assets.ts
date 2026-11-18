import { ptBrSiteCopy } from "../content/locales/pt-br.js";

const socialCopy = ptBrSiteCopy.social;

export type SocialKitId = "neocom" | "devrecord";

export interface SocialAsset {
  id: string;
  kit: SocialKitId;
  label: string;
  width: number;
  height: number;
}

/** Every exportable X / Twitter asset, with its native pixel size. */
export const SOCIAL_ASSETS: readonly SocialAsset[] = [
  { id: "banner", kit: "neocom", label: socialCopy.assetLabels["banner"], width: 1500, height: 500 },
  { id: "avatar-dark", kit: "neocom", label: socialCopy.assetLabels["avatar-dark"], width: 400, height: 400 },
  { id: "avatar-light", kit: "neocom", label: socialCopy.assetLabels["avatar-light"], width: 400, height: 400 },
  { id: "post-manifesto", kit: "neocom", label: socialCopy.assetLabels["post-manifesto"], width: 1600, height: 900 },
  {
    id: "post-portfolio",
    kit: "neocom",
    label: socialCopy.assetLabels["post-portfolio"],
    width: 1600,
    height: 900
  },
  { id: "devrecord-banner", kit: "devrecord", label: socialCopy.assetLabels["devrecord-banner"], width: 1500, height: 500 },
  { id: "devrecord-avatar", kit: "devrecord", label: socialCopy.assetLabels["devrecord-avatar"], width: 400, height: 400 },
  {
    id: "devrecord-avatar-light",
    kit: "devrecord",
    label: socialCopy.assetLabels["devrecord-avatar-light"],
    width: 400,
    height: 400
  },
  { id: "devrecord-post-thesis", kit: "devrecord", label: socialCopy.assetLabels["devrecord-post-thesis"], width: 1600, height: 900 },
  {
    id: "devrecord-post-what",
    kit: "devrecord",
    label: socialCopy.assetLabels["devrecord-post-what"],
    width: 1600,
    height: 900
  }
];

export const SOCIAL_KITS: readonly { id: SocialKitId; title: string }[] = [
  { id: "neocom", title: socialCopy.kits.neocom },
  { id: "devrecord", title: socialCopy.kits.devrecord }
];

export const SOCIAL_COPY = socialCopy.neocom;

export const DEVRECORD_COPY = socialCopy.devrecord;
