import { siteContent } from "../content/site.js";
import { CONTACT_EMAIL, Locale } from "../lib/routes";

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = siteContent[locale];

  return (
    <footer className="flex flex-wrap items-start justify-between gap-10 border-t border-rule px-5 py-[34px] text-[13px] text-ink-3 md:px-16">
      <div className="flex flex-col gap-[9px]">
        <p className="m-0 text-[15px] font-medium text-ink-2">
          <span>NeoCom</span> / neocom.cloud / {new Date().getFullYear()}
        </p>
        <p className="m-0 max-w-[68ch] leading-[1.8]">{copy.footer}</p>
      </div>
      <a className="text-ink-2 no-underline" href={`mailto:${CONTACT_EMAIL}`}>
        {CONTACT_EMAIL}
      </a>
    </footer>
  );
}
