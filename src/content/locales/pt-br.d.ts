import type { SiteCopy } from "../types";

interface SocialCopy {
  pageTitle: string;
  sectionTitle: string;
  kits: { neocom: string; devrecord: string };
  assetLabels: Record<string, string>;
  neocom: {
    bannerLine: string;
    bannerHighlight: string;
    manifesto: string;
    values: string[];
    portfolioTitle: string;
    portfolio: {
      name: string;
      summary: string;
      icon: string;
      background: string;
      watermarkOpacity: number;
    }[];
  };
  devrecord: {
    bannerLead: string;
    bannerHighlight: string;
    bannerTail: string;
    bannerFooter: string;
    thesis: string;
    pills: string[];
    whatTitle: string;
    whatBadge: string;
    whatPoints: string[];
    whatFooter: string;
  };
}

export const ptBrSiteCopy: SiteCopy & { social: SocialCopy };
