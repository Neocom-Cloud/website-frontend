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

### Deployment smoke tests

Deployment smoke tests inspect the finished `dist` output in a Node environment. They verify:

- every localized landing and project page exists
- GitHub Pages public files and configured project assets are present
- localized HTML points to Vite-built JavaScript and CSS instead of source modules
- canonical metadata remains in the production output

## Run tests locally

```bash
pnpm generate:pages
pnpm test
pnpm test:watch
pnpm build
pnpm test:build-output
```

`pnpm build` also regenerates the localized HTML files through the Vite config before producing the final static output.

To lint GitHub Actions workflows locally when Docker is available:

```bash
docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.12
```

## CI behavior

The CI workflow runs on pull requests and pushes to `develop`, `Q.A`, `main`, and `deploy`.

It has two jobs:

- workflow linting with `actionlint`
- application validation:

```bash
pnpm typecheck
pnpm test:ci
pnpm build
pnpm test:build-output
```

This keeps deployment and test enforcement separate:

- `ci.yml` is the quality gate
- `deploy-pages.yml` is the deployment pipeline

## Current gaps

- Browser end-to-end coverage is intentionally deferred to the next testing phase
- No visual regression tests yet
- No Lighthouse or accessibility CI checks yet
