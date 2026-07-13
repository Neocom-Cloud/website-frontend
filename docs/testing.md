# Testing

This repository uses Vitest for unit tests and jsdom-based integration tests.

Use Node.js 24 before running the commands below. The repository includes `.nvmrc`, so `nvm use` selects the required runtime.

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
- permitted and rejected branch promotion paths
- tracked-file conflict-marker detection

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
BASE_REF=deploy HEAD_REF=main pnpm verify:promotion
pnpm verify:repository
```

`pnpm build` also regenerates the localized HTML files through the Vite config before producing the final static output.

To lint GitHub Actions workflows locally when Docker is available:

```bash
docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.12
```

## CI behavior

The CI workflow runs on pull requests and pushes to `develop`, `Q.A`, `main`, and `deploy`.

It has three jobs:

- workflow linting with `actionlint`
- promotion-path validation for pull requests into `Q.A`, `main`, and `deploy`
- application validation:

```bash
pnpm typecheck
pnpm verify:repository
pnpm test:ci
pnpm build
pnpm test:build-output
```

For pull requests and pushes to `Q.A`, CI uploads the validated `dist` directory as a 14-day GitHub Actions artifact named `neocom-site-<commit-sha>`. Download it from the workflow run to inspect the exact static site without creating a public QA deployment.

This keeps deployment and test enforcement separate:

- `ci.yml` is the quality gate
- `deploy-pages.yml` reruns the full validation suite before publishing the production artifact

## Current gaps

- Browser end-to-end coverage is intentionally deferred to the next testing phase
- No visual regression tests yet
- No Lighthouse or accessibility CI checks yet
