# Architecture and content guide

This guide describes the current implementation on `develop`. The planning brief in `CONTEXT.md` is historical context; use the source files below to determine current behavior.

## Request to page

1. `index.html` loads `src/root-entry.ts`. It resolves a valid `?lang=` override, then a stored language, then the browser's languages, and finally `pt-br`. It replaces the root URL with the selected localized landing route.
2. Each localized route has its own generated `index.html`. `scripts/static-site.mjs` creates these files from the locale and project catalogs and writes canonical, alternate-language, Open Graph, and Twitter metadata.
3. `src/page-entry.tsx` reads the route's page data and renders the shared React page in `src/App.tsx`.
4. Vite builds the root and localized entries into static files in `dist/`. `public/` supplies the CNAME, robots file, manifest, favicon, sitemap, and project artwork.

The route matrix contains two landing pages and three project pages per language. The project slugs are `neorecicla`, `devrecord`, and `neo-health`. The root redirect is included in the sitemap, along with the localized pages.

## Sources of truth

| Concern | Edit here | Generated or consumed by |
| --- | --- | --- |
| Localized copy and SEO text | `src/content/locales/pt-br.js`, `src/content/locales/en.js` | `src/content/site.js`, static generator, React |
| Project slugs, theme accents, images | `src/content/projects.js` | Static generator, React, build checks |
| Shared landing and project markup | `src/App.tsx` | All localized pages |
| Root locale resolution | `src/lib/locale.ts`, `src/lib/routes.ts` | `src/root-entry.ts` |
| Canonical origin and contact address | `src/site/constants.js` | Pages and contact links |
| HTML metadata, sitemap, Vite input map | `scripts/static-site.mjs` | `scripts/generate-pages.mjs`, `vite.config.ts` |
| Global styling | `src/styles/global.css` | All pages |

The HTML files under `pt-br/` and `en/` and `public/sitemap.xml` are generated outputs. Do not hand-edit them. Run `pnpm generate:pages` after catalog or route changes and include the resulting diff in the PR. `pnpm build` regenerates them too; check for unexpected changes afterward.

## Editing copy or a project

For a copy change, update the appropriate locale dictionary, check the corresponding SEO fields, regenerate pages, and review both languages. If the same meaning changes in both languages, update both dictionaries together. Check the page title, description, alternate links, canonical URL, and sitemap where relevant.

For a new project, add one slug and registry entry in `src/content/projects.js`, add the required copy and SEO fields to both locale dictionaries, add its public artwork, and regenerate the pages. Then check that both project routes and their assets appear in `dist/`. Prefer the shared project template; introduce a separate renderer only if the content model cannot express the required behavior clearly.

For an asset replacement, update the registry references and verify the built file exists. The NeoCom and NeoRecicla assets are SVG. DevRecord currently uses `NeoCom_Icon_App.svg`; Neo Health currently uses a PNG because no source SVG is in this repository. Do not describe these as final brand assets without design approval.

## Local checks

```bash
pnpm generate:pages
pnpm typecheck
pnpm test:ci
pnpm build
pnpm test:build-output
pnpm verify:repository
pnpm test:e2e
git diff --check
```

The build-output suite checks generated routes, assets, and metadata in `dist/`. Browser tests exercise navigation, language and theme behavior against a built preview. See [testing](testing.md) for CI behavior and narrower commands.
