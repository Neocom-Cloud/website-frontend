import { CONTACT_EMAIL } from "../site/constants.js";
import { locales } from "./locales/index.js";
import { enSiteCopy } from "./locales/en.js";
import { ptBrSiteCopy } from "./locales/pt-br.js";
import { projectRegistry, projectSlugs } from "./projects.js";

export { locales, projectRegistry, projectSlugs };

export const siteContent = {
  "pt-br": ptBrSiteCopy,
  en: enSiteCopy
};

const mailCopy = {
  "pt-br": {
    intro: "Olá NeoCom,\n\nQuero conversar sobre"
  },
  en: {
    intro: "Hello NeoCom,\n\nI want to discuss"
  }
};

export function getProjectMailto(locale, projectName) {
  const subject = encodeURIComponent(`${projectName} - NeoCom`);
  const body = encodeURIComponent(`${mailCopy[locale].intro} ${projectName}.`);
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
