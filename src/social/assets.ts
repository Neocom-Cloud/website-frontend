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
  { id: "banner", kit: "neocom", label: "Banner", width: 1500, height: 500 },
  { id: "avatar-dark", kit: "neocom", label: "Avatar escuro", width: 400, height: 400 },
  { id: "avatar-light", kit: "neocom", label: "Avatar claro", width: 400, height: 400 },
  { id: "post-manifesto", kit: "neocom", label: "Post · manifesto", width: 1600, height: 900 },
  {
    id: "post-portfolio",
    kit: "neocom",
    label: "Post · portfólio de projetos",
    width: 1600,
    height: 900
  },
  { id: "devrecord-banner", kit: "devrecord", label: "Banner", width: 1500, height: 500 },
  { id: "devrecord-avatar", kit: "devrecord", label: "Avatar", width: 400, height: 400 },
  {
    id: "devrecord-avatar-light",
    kit: "devrecord",
    label: "Avatar em campo claro",
    width: 400,
    height: 400
  },
  { id: "devrecord-post-thesis", kit: "devrecord", label: "Post · tese", width: 1600, height: 900 },
  {
    id: "devrecord-post-what",
    kit: "devrecord",
    label: "Post · o que é",
    width: 1600,
    height: 900
  }
];

export const SOCIAL_KITS: readonly { id: SocialKitId; title: string }[] = [
  { id: "neocom", title: "NeoCom · X / Twitter" },
  { id: "devrecord", title: "DevRecord · X / Twitter" }
];

export const SOCIAL_COPY = {
  bannerLine: "Tecnologia que melhora processos cotidianos e deixa rastro",
  bannerHighlight: "verificável",
  manifesto: "Inovação só vale quando dá para comprovar.",
  values: ["Privacidade", "Segurança", "Confiabilidade", "Comprovabilidade", "Comunidade"],
  portfolioTitle: "Três projetos em construção",
  portfolio: [
    {
      name: "NeoRecicla",
      summary: "Coleta verificada em blockchain para campus universitários.",
      icon: "/assets/NeoRecicla_Icon.svg",
      background: "#151a1e",
      watermarkOpacity: 0.18
    },
    {
      name: "DevRecord",
      summary: "Histórico de produção portável e comprovável.",
      icon: "/assets/devrecord-icon.svg",
      background: "#191309",
      watermarkOpacity: 0.35
    },
    {
      name: "NeoHealth",
      summary: "Saúde conectada com dado sob controle da pessoa.",
      icon: "/assets/Icon_NeoHealth_Concept.webp",
      background: "#17140c",
      watermarkOpacity: 0.3
    }
  ]
} as const;

export const DEVRECORD_COPY = {
  bannerLead: "Um ponto de verdade",
  bannerHighlight: "imutável",
  bannerTail: "para o histórico de produção de desenvolvedores.",
  bannerFooter: "Um projeto NeoCom · neocom.cloud",
  thesis: "Seu histórico técnico não deveria pertencer a uma plataforma.",
  pills: ["Portável", "Comprovável", "Sem plataforma central"],
  whatTitle: "Identidade técnica verificável",
  whatBadge: "Conceito",
  whatPoints: [
    "Histórico portável entre plataformas",
    "Registro orientado a comprovabilidade e reputação",
    "Modelo pensado para profissionais e organizações"
  ],
  whatFooter: "neocom.cloud / devrecord"
} as const;
