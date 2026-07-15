# Testing

This repository uses Vitest for unit tests and jsdom-based integration tests.

Use Node.js 24 or later before running the commands below. The repository includes `.nvmrc`, so `nvm use` selects the Node 24 baseline.

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
pnpm build
pnpm test:build-output
pnpm verify:repository
```

To validate a promotion locally, use `BASE_REF=<target-branch> HEAD_REF=<source-branch> pnpm verify:promotion`, replacing both placeholders with one of the valid promotion pairs:

```bash
BASE_REF=Q.A HEAD_REF=develop pnpm verify:promotion
BASE_REF=main HEAD_REF=Q.A pnpm verify:promotion
BASE_REF=Q.A.E2E HEAD_REF=main pnpm verify:promotion
BASE_REF=deploy HEAD_REF=Q.A.E2E pnpm verify:promotion
```

Run the following separately when interactive test watching is needed:

```bash
pnpm test:watch
```

`pnpm build` also regenerates the localized HTML files through the Vite config before producing the final static output.

To lint GitHub Actions workflows locally when Docker is available:

```bash
docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.12
```

## CI behavior

The CI workflow runs on pull requests and pushes to `develop`, `Q.A`, `main`, `Q.A.E2E`, and `deploy`.

It has four jobs:

- workflow linting with `actionlint`
- promotion-path validation for pull requests into `Q.A`, `main`, `Q.A.E2E`, and `deploy`
- application validation on Node 24 and the current latest Node release:

```bash
pnpm typecheck
pnpm verify:repository
pnpm test:ci
pnpm build
pnpm test:build-output
```

- browser end-to-end validation on Playwright's Chromium, Firefox, WebKit, and Chromium mobile projects for pull requests into `Q.A.E2E` and `deploy`

Every pull request uploads the Node 24-validated `dist` directory as a 14-day GitHub Actions artifact named `neocom-site-<commit-sha>`; push-triggered uploads are limited to `Q.A` and `Q.A.E2E`. Pull requests into `Q.A.E2E` and `deploy` also run Playwright on Chromium, Firefox, WebKit, and Chromium mobile, retaining its report and failure traces for 14 days. Download the artifacts from the workflow run to inspect the exact static site without creating a public QA deployment.

This keeps deployment and test enforcement separate:

- `ci.yml` is the quality gate
- `deploy-pages.yml` reruns repository integrity, typechecking, tests, the production build, and build-output checks before publishing the production artifact

## Current gaps

- No browser visual-regression coverage yet
- No Lighthouse or accessibility CI checks yet
