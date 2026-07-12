import type { ReactElement } from "react";
import type { IconName } from "../content/types";

interface IconProps {
  name: IconName;
  className?: string;
}

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    >
      {iconPaths[name]}
    </svg>
  );
}

const iconPaths: Record<IconName, ReactElement> = {
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3Z" />
      <path d="m9.5 12 1.8 1.8 3.7-3.8" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="8.5" r="4.5" />
      <path d="m9.5 13.5-1.5 6 4-2 4 2-1.5-6" />
    </>
  ),
  certificate: (
    <>
      <rect x="4" y="5" width="16" height="10" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 12h5" />
      <path d="m12 15 2 3 2-3" />
    </>
  ),
  users: (
    <>
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="9" r="3" />
      <path d="M6.5 18.5a3.5 3.5 0 0 0-2.5-1" />
      <path d="M20 17.5a3.5 3.5 0 0 0-2.5 1" />
      <path d="M7.5 9.5a2.5 2.5 0 1 1-1-4.8" />
      <path d="M16.5 4.7a2.5 2.5 0 1 1 0 4.8" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h12" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  leaf: (
    <>
      <path d="M18 4c-8 1-12 5-12 12 0 2 1 4 3 4 7 0 11-4 12-12 .1-1.5-.5-4-3-4Z" />
      <path d="M8 14c2-1 4-3 7-6" />
    </>
  ),
  code: (
    <>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m14 4-4 16" />
    </>
  ),
  pulse: (
    <>
      <path d="M3 12h4l2-4 4 8 2-4h6" />
    </>
  ),
  moon: (
    <>
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="m4.9 4.9 2.1 2.1" />
      <path d="m17 17 2.1 2.1" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="m4.9 19.1 2.1-2.1" />
      <path d="M17 7l2.1-2.1" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.7 2.7 4 5.7 4 9s-1.3 6.3-4 9c-2.7-2.7-4-5.7-4-9s1.3-6.3 4-9Z" />
    </>
  ),
  back: (
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  )
};
