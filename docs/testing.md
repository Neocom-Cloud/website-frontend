# Testing

This repository uses Vitest for unit tests and jsdom-based integration tests.

## Test categories

### Unit tests

Unit tests cover pure helpers and content-generation logic:

- locale normalization
- route generation
- root locale precedence
- page bootstrap decisions
- localized mailto generation
- static page manifest generation
- generated SEO metadata and sitemap output

### Integration tests

Integration tests render React components with Testing Library and cover:

- localized landing page rendering
- localized project page rendering
- locale-switch links preserving page context
- theme toggle behavior and persistence
- shared template behavior across locales and project routes

These are DOM-level tests, not browser end-to-end tests.

## Run tests locally

```bash
pnpm generate:pages
pnpm test
pnpm test:watch
```

`pnpm build` also regenerates the localized HTML files through the Vite config before producing the final static output.

## CI behavior

The CI workflow runs:

```bash
pnpm typecheck
pnpm test:ci
pnpm build
```

This keeps deployment and test enforcement separate:

- `ci.yml` is the quality gate
- `deploy-pages.yml` is the deployment pipeline

## Current gaps

- No browser end-to-end coverage yet
- No visual regression tests yet
- No Lighthouse or accessibility CI checks yet
