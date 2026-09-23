import type { ReactNode } from "react";
import type { IconName } from "../content/types";
import { Icon } from "./icons";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="eyebrow mb-[18px] flex items-center gap-3 text-ink-3">
      <span aria-hidden="true" className="h-0.5 w-[34px] bg-accent" />
      <span>{children}</span>
    </div>
  );
}

interface SectionHeaderProps {
  index: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ index, eyebrow, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-[34px] grid items-end gap-4 md:grid-cols-2 md:gap-8">
      <div>
        <SectionLabel>
          {index} — {eyebrow}
        </SectionLabel>
        <h2 className="m-0 text-[32px] leading-[1.02] font-medium tracking-[-0.03em] text-ink md:text-[42px]">
          {title}
        </h2>
      </div>
      {subtitle ? (
        <p className="m-0 text-[17px] leading-[1.6] text-ink-2 md:text-right">{subtitle}</p>
      ) : null}
    </div>
  );
}

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  icon?: IconName;
  /** `solid` is the ink pill (icon trails); `soft` borrows the project field colour (icon leads). */
  tone?: "solid" | "soft";
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "gap-2.5 px-5 py-[13px] text-sm",
  md: "gap-3 px-6 py-[15px] text-[15px]",
  lg: "gap-3 px-[26px] py-4 text-[15px]"
} as const;

export function ButtonLink({
  href,
  children,
  icon = "arrow",
  tone = "solid",
  size = "md"
}: ButtonLinkProps) {
  const toneClass = tone === "solid" ? "bg-ink text-page" : "bg-project-field text-ink";
  const iconElement = (
    <Icon className={tone === "solid" ? "size-4" : "size-[15px]"} name={icon} />
  );

  return (
    <a
      className={`inline-flex items-center rounded-full font-medium no-underline ${SIZE_CLASSES[size]} ${toneClass}`}
      href={href}
    >
      {tone === "soft" ? iconElement : null}
      <span>{children}</span>
      {tone === "solid" ? iconElement : null}
    </a>
  );
}
