import type { ReactNode } from "react";
import { CloudMark } from "../components/CloudMark";
import { ptBrSiteCopy } from "../content/locales/pt-br.js";
import {
  DEVRECORD_COPY,
  SOCIAL_ASSETS,
  SOCIAL_COPY,
  SOCIAL_KITS,
  SocialAsset,
  SocialKitId
} from "./assets";

/*
 * "NeoCom Social X" and "DevRecord Social X" models. These artboards are
 * pixel-exact exports, so they deliberately use the fixed brand colours from
 * the designs instead of the theme tokens used by the website.
 */

const MONO_LABEL = "font-mono uppercase";
const ICON_PANEL = "rounded-[24px_24px_24px_8px]";

function findAsset(id: string): SocialAsset {
  const found = SOCIAL_ASSETS.find((candidate) => candidate.id === id);

  if (!found) {
    throw new Error(`Unknown social asset: ${id}`);
  }

  return found;
}

function Artboard({
  id,
  className,
  children
}: {
  id: string;
  className: string;
  children: ReactNode;
}) {
  const asset = findAsset(id);

  return (
    <figure className="m-0 flex flex-col gap-3" data-social-asset={asset.id}>
      <figcaption>
        <h3 className={`${MONO_LABEL} m-0 text-[11px] font-normal tracking-[0.16em] text-ink-2`}>
          {asset.label} · {asset.width} × {asset.height}
        </h3>
      </figcaption>
      <div
        className={`relative overflow-hidden ${className}`}
        data-social-artboard={asset.id}
        style={{ width: asset.width, height: asset.height }}
      >
        {children}
      </div>
    </figure>
  );
}

function TopBar({ colour }: { colour: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-24 h-1 w-[132px]"
      style={{ background: colour }}
    />
  );
}

/* ---------------------------------------------------------------- NeoCom */

function Banner() {
  return (
    <Artboard className="flex items-center bg-[#0e1216] px-24 text-[#f4f1ea]" id="banner">
      <TopBar colour="#06cfe3" />
      <img
        alt=""
        className="pointer-events-none absolute -top-[120px] -right-[110px] w-[620px] opacity-[0.16]"
        src="/assets/NeoCom_Icon_Final_v2.svg"
      />
      <div className="relative flex max-w-[900px] flex-col gap-[26px]">
        <div className="flex items-center gap-4">
          <img alt="" className="block size-[52px] rounded-[14px]" src="/assets/nc-mark.svg" />
          <span className="text-[44px] font-semibold tracking-[-0.02em]">NeoCom</span>
        </div>
        <h2 className="m-0 text-[42px] leading-[1.2] font-normal tracking-[-0.02em]">
          {SOCIAL_COPY.bannerLine}{" "}
          <span className="text-[#06cfe3]">{SOCIAL_COPY.bannerHighlight}</span>.
        </h2>
        <div className={`${MONO_LABEL} text-[15px] tracking-[0.16em] text-[#f4f1ea]/60`}>
          neocom.cloud
        </div>
      </div>
    </Artboard>
  );
}

function AvatarDark() {
  return (
    <Artboard className="flex items-center justify-center rounded-full bg-[#0e1216]" id="avatar-dark">
      <CloudMark className="block w-[236px] text-[#06cfe3]" />
    </Artboard>
  );
}

function AvatarLight() {
  return (
    <Artboard className="flex items-center justify-center rounded-full bg-[#f4f1ea]" id="avatar-light">
      <img alt="" className="block w-[248px]" src="/assets/NeoCom_Icon_Final_v2.svg" />
    </Artboard>
  );
}

function PostManifesto() {
  return (
    <Artboard
      className="flex flex-col justify-between bg-[#f6f3ec] px-24 py-[90px] text-[#101418]"
      id="post-manifesto"
    >
      <TopBar colour="#037494" />
      <CloudMark className="pointer-events-none absolute -bottom-[230px] left-1/2 w-[900px] text-[#037494] opacity-[0.12]" />
      <div className="relative flex items-center gap-3.5">
        <img alt="" className="block size-10 rounded-[11px]" src="/assets/nc-mark.svg" />
        <span className="text-[28px] font-semibold tracking-[-0.01em]">NeoCom</span>
      </div>
      <h2 className="relative m-0 max-w-[20ch] text-[78px] leading-[1.08] font-medium tracking-[-0.035em]">
        {SOCIAL_COPY.manifesto}
      </h2>
      <Pills colour="#037494" items={SOCIAL_COPY.values} />
    </Artboard>
  );
}

function PostPortfolio() {
  return (
    <Artboard
      className="flex flex-col gap-[52px] bg-[#0e1216] px-24 py-[84px] text-[#f4f1ea]"
      id="post-portfolio"
    >
      <TopBar colour="#06cfe3" />
      <div className="flex items-end justify-between gap-10">
        <h2 className="m-0 text-[56px] font-medium tracking-[-0.03em]">
          {SOCIAL_COPY.portfolioTitle}
        </h2>
        <div className={`${MONO_LABEL} text-base tracking-[0.16em] text-[#f4f1ea]/55`}>
          neocom.cloud
        </div>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-6">
        {SOCIAL_COPY.portfolio.map((project) => (
          <div
            key={project.name}
            className={`relative flex flex-col justify-between gap-7 overflow-hidden p-9 ${ICON_PANEL}`}
            data-social-project={project.name}
            style={{ background: project.background }}
          >
            <img
              alt=""
              className="pointer-events-none absolute -right-11 -bottom-[54px] w-60"
              src={project.icon}
              style={{ opacity: project.watermarkOpacity }}
            />
            <img alt="" className="relative block w-[62px] rounded-2xl" src={project.icon} />
            <div className="relative flex flex-col gap-3">
              <span className="text-[34px] font-semibold tracking-[-0.02em]">{project.name}</span>
              <span className="text-xl leading-[1.45] text-[#f4f1ea]/70">{project.summary}</span>
            </div>
          </div>
        ))}
      </div>
    </Artboard>
  );
}

function Pills({ colour, items }: { colour: string; items: readonly string[] }) {
  return (
    <ul className="relative m-0 flex list-none flex-wrap gap-3.5 p-0">
      {items.map((item) => (
        <li
          key={item}
          className={`${MONO_LABEL} rounded-full bg-white px-5 py-3 text-[17px] tracking-[0.1em]`}
          style={{ color: colour }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------- DevRecord */

const DEVRECORD_ICON = "/assets/devrecord-icon.svg";

function DevRecordBanner() {
  return (
    <Artboard
      className="flex items-center bg-[#120d05] px-24 text-[#f7efe2]"
      id="devrecord-banner"
    >
      <TopBar colour="#f4a71a" />
      <img
        alt=""
        className="pointer-events-none absolute -top-24 -right-20 w-[560px] opacity-40"
        src={DEVRECORD_ICON}
      />
      <div className="relative flex max-w-[880px] flex-col gap-[26px]">
        <div className="flex items-center gap-4">
          <img alt="" className="block size-14 rounded-[15px]" src={DEVRECORD_ICON} />
          <span className="text-[44px] font-semibold tracking-[-0.02em]">DevRecord</span>
        </div>
        <h2 className="m-0 text-[40px] leading-[1.2] font-normal tracking-[-0.02em]">
          {DEVRECORD_COPY.bannerLead}{" "}
          <span className="text-[#f4a71a]">{DEVRECORD_COPY.bannerHighlight}</span>{" "}
          {DEVRECORD_COPY.bannerTail}
        </h2>
        <div className={`${MONO_LABEL} text-[15px] tracking-[0.16em] text-[#f7efe2]/55`}>
          {DEVRECORD_COPY.bannerFooter}
        </div>
      </div>
    </Artboard>
  );
}

function DevRecordAvatar() {
  return (
    <Artboard
      className="flex items-center justify-center rounded-full bg-[#120d05]"
      id="devrecord-avatar"
    >
      <img alt="" className="block size-[400px]" src={DEVRECORD_ICON} />
    </Artboard>
  );
}

function DevRecordAvatarLight() {
  return (
    <Artboard
      className="flex items-center justify-center rounded-full bg-[#fbf4ea]"
      id="devrecord-avatar-light"
    >
      <img alt="" className="block size-72 rounded-[66px]" src={DEVRECORD_ICON} />
    </Artboard>
  );
}

function DevRecordPostThesis() {
  return (
    <Artboard
      className="flex flex-col justify-between bg-[#fbf4ea] px-24 py-[90px] text-[#1a1207]"
      id="devrecord-post-thesis"
    >
      <TopBar colour="#a8620c" />
      <img
        alt=""
        className="pointer-events-none absolute -bottom-60 left-1/2 w-[820px] opacity-[0.12]"
        src={DEVRECORD_ICON}
      />
      <div className="relative flex items-center gap-3.5">
        <img alt="" className="block size-[42px] rounded-xl" src={DEVRECORD_ICON} />
        <span className="text-[28px] font-semibold tracking-[-0.01em]">DevRecord</span>
      </div>
      <h2 className="relative m-0 max-w-[19ch] text-[76px] leading-[1.08] font-medium tracking-[-0.035em]">
        {DEVRECORD_COPY.thesis}
      </h2>
      <Pills colour="#a8620c" items={DEVRECORD_COPY.pills} />
    </Artboard>
  );
}

function DevRecordPostWhat() {
  return (
    <Artboard
      className="flex flex-col gap-12 bg-[#120d05] px-24 py-[84px] text-[#f7efe2]"
      id="devrecord-post-what"
    >
      <TopBar colour="#f4a71a" />
      <div className="flex items-end justify-between gap-10">
        <h2 className="m-0 text-[54px] font-medium tracking-[-0.03em]">{DEVRECORD_COPY.whatTitle}</h2>
        <div className={`${MONO_LABEL} text-base tracking-[0.16em] text-[#f7efe2]/50`}>
          {DEVRECORD_COPY.whatBadge}
        </div>
      </div>
      <ol className="m-0 grid flex-1 list-none grid-cols-3 gap-6 p-0">
        {DEVRECORD_COPY.whatPoints.map((point, index) => (
          <li
            key={point}
            className={`flex flex-col justify-end gap-[18px] bg-[#1b1309] p-10 ${ICON_PANEL}`}
          >
            <span className="font-mono text-[15px] tracking-[0.16em] text-[#f4a71a]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[26px] leading-[1.35]">{point}</span>
          </li>
        ))}
      </ol>
      <div className={`${MONO_LABEL} text-[17px] tracking-[0.14em] text-[#f7efe2]/50`}>
        {DEVRECORD_COPY.whatFooter}
      </div>
    </Artboard>
  );
}

/* ------------------------------------------------------------------ Page */

function KitSection({ id, title, children }: { id: SocialKitId; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-10" data-social-kit={id}>
      <header className="flex flex-col gap-2">
        <div className={`${MONO_LABEL} text-[11px] tracking-[0.2em] text-ink-3`}>{title}</div>
        <h2 className="m-0 text-[26px] font-medium">{ptBrSiteCopy.social.sectionTitle}</h2>
      </header>
      {children}
    </section>
  );
}

export function SocialKit() {
  const [neocom, devrecord] = SOCIAL_KITS;

  return (
    <main className="flex min-w-max flex-col gap-24 bg-page p-12 text-ink">
      <h1 className="sr-only">{ptBrSiteCopy.social.pageTitle}</h1>
      <KitSection id={neocom.id} title={neocom.title}>
        <Banner />
        <div className="flex flex-wrap items-start gap-10">
          <AvatarDark />
          <AvatarLight />
        </div>
        <PostManifesto />
        <PostPortfolio />
      </KitSection>

      <KitSection id={devrecord.id} title={devrecord.title}>
        <DevRecordBanner />
        <div className="flex flex-wrap items-start gap-10">
          <DevRecordAvatar />
          <DevRecordAvatarLight />
        </div>
        <DevRecordPostThesis />
        <DevRecordPostWhat />
      </KitSection>
    </main>
  );
}
