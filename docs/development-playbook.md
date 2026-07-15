# Development Execution Playbook

This is the reusable delivery pattern established while taking the NeoCom website from a visual prototype to a reviewable alpha release. It records the operating logic, not a substitute for the Git history, pull requests, or the focused runbooks in this repository.

Use it for a feature, maintenance change, release hardening, or infrastructure adjustment. Apply stricter rules when a change affects production publishing, DNS, routing, or localized content.

## Delivery principles

1. Understand the current repository before proposing a change. Inspect the working tree, branch, workflows, tests, relevant documentation, and existing implementation first.
2. Prefer one maintainable model over duplicated variants. Shared templates receive data and translations; locale, project, route, and SEO metadata come from centralized catalogs.
3. Keep infrastructure intentionally simple until there is a concrete need to add complexity. GitHub Pages is the current static hosting target; Hostinger remains the registrar, and Cloudflare is optional DNS or edge infrastructure.
4. Treat every automated review finding as a hypothesis. Verify it against the current code and user-facing behavior before changing anything.
5. Make every stage independently verifiable. Local checks establish fast feedback; CI, code review, and protected promotion PRs establish delivery evidence.
6. Never use a deployment branch as a development shortcut. The branch order is part of the release contract.

## Architecture pattern

### One-page model, many static pages

The site uses a single React landing-page model and a shared project-page model. Static generation emits each localized route and its SEO metadata from that shared code.

| Concern | Pattern | Source of truth |
| --- | --- | --- |
| Rendered page structure | Shared React templates | `src/App.tsx` |
| Translatable copy | Locale dictionaries | `src/content/locales/` |
| Project-specific facts | Project registry | `src/content/projects.js` |
| Locale and route matrix | Static-page catalog | `scripts/static-site.mjs` |
| HTML pages and sitemap | Generated output | `scripts/generate-pages.mjs` |
| Brand and UI artwork | SVG-first assets | `public/` |

This separation avoids parallel `pt-br` and `en` page implementations. A future custom project page should first use the standard project data model. Add a project-specific renderer only when the visual or behavioral difference cannot be represented as data without making the shared model unclear.

### Static hosting and locale limits

GitHub Pages serves static files and cannot decide a language from request headers before it responds. The root redirect uses this client-side precedence:

1. `?lang=` query override
2. stored locale
3. browser locale
4. `pt-br` fallback

Localized routes remain direct, indexable static URLs. Move request-header, geo, or edge locale behavior to Cloudflare or AWS only when that requirement is real and measurable.

## Change lifecycle

### 1. Establish the baseline

Before implementation:

```bash
git status --short
git branch --show-current
rg --files
pnpm --version
node --version
```

Then read the files that govern the task: package scripts, source model, tests, workflows, and related documentation. Do not overwrite uncommitted changes. If unrelated work is present, leave it untouched; if it conflicts with the task, stop and clarify ownership.

Record the expected behavior in observable terms. For example, a locale change should identify expected routes, visible copy, canonical URL, sitemap entry, and persistence behavior rather than merely naming a component to edit.

### 2. Design the smallest durable change

Choose the narrowest change that preserves the architecture:

- Extend a content catalog before adding a locale-specific component.
- Add a shared primitive before duplicating a markup block.
- Use a standard project template before creating a one-off page.
- Prefer SVG when a vector source exists; keep a raster asset only when no viable SVG is available.
- Keep the Node baseline and package manager consistent locally and in Actions: Node 24 or later and `pnpm`.

Update documentation in the same change when the public contract, developer workflow, release process, DNS, or review behavior changes.

### 3. Implement in an isolated branch

Create a focused branch from the correct integration point. Name it for its intent, for example:

```text
feat/i18n-static-pages
fix/e2e-preview-server
docs/release-playbook
test/promotion-cli-coverage
```

Keep the diff limited to the concern. Use conventional commit subjects that state what changes and why, for example:

```text
feat(i18n): generate localized project routes
fix(e2e): serve built output during browser checks
test(ci): cover Q.A.E2E promotion CLI
docs(deploy): document Hostinger DNS records
```

Avoid force pushes, history rewrites, or broad formatting churn on shared and protected branches. If a wrong change reaches a shared branch, restore the intended state through an explicit corrective branch, commit, and PR unless a coordinated history rewrite is explicitly approved.

### 4. Validate locally in layers

Run the smallest relevant checks while changing code, then run the complete repository suite before creating a PR:

```bash
pnpm typecheck
pnpm test:ci
pnpm build
pnpm test:build-output
pnpm verify:repository
git diff --check
```

For a staged promotion, validate the exact edge locally before opening the PR:

```bash
BASE_REF=Q.A HEAD_REF=develop pnpm verify:promotion
BASE_REF=main HEAD_REF=Q.A pnpm verify:promotion
BASE_REF=Q.A.E2E HEAD_REF=main pnpm verify:promotion
BASE_REF=deploy HEAD_REF=Q.A.E2E pnpm verify:promotion
```

Testing expectations by change type:

| Change | Minimum evidence |
| --- | --- |
| Content, locale, route, or template | Unit/integration coverage plus built-output checks |
| Static generator or SEO | Generated pages, canonicals, and sitemap checks |
| Workflow or branch policy | Workflow lint and CLI-level promotion-policy coverage |
| E2E configuration or navigation | Playwright run against the production build |
| Deployment or DNS documentation | Command/runbook verification and no unsupported hosting claims |

Do not claim an unrun command passed. If an environment prevents a check, state exactly what was not run and why.

### 5. Create the PR and perform the review loop

PR bodies should state:

- the user-facing or operational behavior changed
- tests and commands actually run
- deployment, DNS, locale, or generated-output impact
- known limits or deliberate exclusions

Wait for the repository's mandatory CI checks. When CodeRabbit is available and completes a review, inspect its thread-level state rather than only its check badge. An actionable finding must be handled by one of these paths:

| Finding result | Required action |
| --- | --- |
| Correct and within scope | Fix it, add or adjust regression coverage, rerun relevant checks, and request/review the new result |
| Correct but out of scope | Record it as follow-up work; do not silently ignore it |
| Incorrect or no longer applicable | Explain why in the thread and resolve only after verifying the current code |
| Stylistic or over-engineering | Preserve the accepted behavior unless there is a clear maintenance or reliability gain |

CodeRabbit must not replace human accountability. Its role is advisory review evidence; required GitHub checks and human branch ownership remain the merge gates. Its unavailability must not block a promotion, but any findings it returns must be triaged before merging. See [Code Review And CodeRabbit](./code-review.md) for the repository configuration.

### 6. Promote with one PR per boundary

The only valid release sequence is:

```text
develop -> Q.A -> main -> Q.A.E2E -> deploy
```

For each boundary:

1. Fetch and prune the remote branches with `git fetch --prune origin`, then designate one promotion owner for the source-to-target edge. Coordinate concurrent release operators through the team's release record or change ticket; an API lookup alone cannot provide a lock.
2. Set `BASE_REF` to the target branch and `HEAD_REF` to the source branch. Inspect the freshly fetched remote-tracking heads before continuing:

   ```bash
   git show -s --format='%H %D' "origin/$BASE_REF"
   git show -s --format='%H %D' "origin/$HEAD_REF"
   ```

   These commands verify the current `origin/$BASE_REF` and `origin/$HEAD_REF` refs after the fetch. Then check for a duplicate open promotion PR with a fail-closed command:

   ```bash
   set -euo pipefail
   open_promotions="$(gh pr list --state open --base "$BASE_REF" --head "$HEAD_REF" --json number --jq 'length')"
   test "$open_promotions" -eq 0
   ```

   Continue only when the command succeeds and returns zero. A `gh` error or a nonzero count aborts the promotion.
3. Run the exact local promotion-policy command. It validates only that `BASE_REF` and `HEAD_REF` are an allowed pair; it does not validate the remote heads inspected above.
4. Open a PR with the source and target matching one allowed edge. Retain its GitHub number as `created_pr_number`; with the GitHub CLI, capture it from the created PR URL:

   ```bash
   created_pr_url="$(gh pr create \
     --base "$BASE_REF" \
     --head "$HEAD_REF" \
     --title "<promotion title>" \
     --body "<promotion summary>")"
   created_pr_number="${created_pr_url##*/}"
   test "$created_pr_number" -gt 0
   ```

5. Immediately confirm the newly created PR is the only matching promotion and has the expected identity:

   ```bash
   set -euo pipefail
   matching_pr_number="$(gh pr list \
     --state open \
     --base "$BASE_REF" \
     --head "$HEAD_REF" \
     --json number \
     --jq 'if length == 1 then .[0].number else "" end')"
   test "$matching_pr_number" = "$created_pr_number"
   ```

   Continue only if the command succeeds, exactly one matching PR exists, and its number matches the newly created PR. Otherwise, stop and coordinate with the other operator.
6. Wait for every required CI check. When CodeRabbit completes, triage any findings; its unavailability alone is not a merge gate.
7. Inspect all unresolved review threads and mergeability state.
8. Merge only if the PR is clean and all valid review work is complete.
9. At the start of the next boundary, run `git fetch --prune origin` again, inspect its refreshed `origin/$BASE_REF` and `origin/$HEAD_REF` heads, then run its separate promotion-policy validation.

The browser E2E gate is intentionally required for `main -> Q.A.E2E` and `Q.A.E2E -> deploy`. `Q.A.E2E` is the manual acceptance boundary; leave the PR open there until a human explicitly accepts it. Only `deploy` can publish GitHub Pages.

### 7. Produce a final evidence record

Before declaring a milestone stable, verify:

- the intended PR base, head, and open/merged state
- `MERGEABLE` and `CLEAN` status when manual review remains
- completed required CI checks, including the relevant browser suite
- completed CodeRabbit review, when available, and no unresolved actionable threads
- branch heads, confirming that later stages were not changed early
- clean local worktree

The alpha stabilization that established this pattern used this sequence:

| Pull request | Purpose | Result |
| --- | --- | --- |
| [#20](https://github.com/Neocom-Cloud/website-frontend/pull/20) | Add CLI coverage for the real `main -> Q.A.E2E` gate | Merged into `develop` |
| [#21](https://github.com/Neocom-Cloud/website-frontend/pull/21) | Promote `develop -> Q.A` | Merged |
| [#22](https://github.com/Neocom-Cloud/website-frontend/pull/22) | Promote `Q.A -> main` | Merged |
| [#13](https://github.com/Neocom-Cloud/website-frontend/pull/13) | Validate `main -> Q.A.E2E` | Left open and clean for manual Q.A |

At that point, the CLI test proved the same environment values used by the PR gate:

```text
BASE_REF=Q.A.E2E
HEAD_REF=main
Promotion path accepted: main -> Q.A.E2E.
```

`Q.A.E2E` and `deploy` were explicitly checked and left unchanged. This is the model for stopping at a manual quality gate without accidentally publishing production.

## Release operator checklist

Use this checklist when repeating the pattern:

- [ ] Confirm the task's expected behavior and affected delivery boundary.
- [ ] Inspect branch, worktree, existing implementation, tests, workflows, and docs.
- [ ] Implement one focused change with centralized data and shared templates where applicable.
- [ ] Add behavioral tests at the correct level.
- [ ] Run complete local validation and `git diff --check`.
- [ ] Commit with a specific conventional subject and push only the intended branch.
- [ ] Create a focused PR with accurate validation evidence.
- [ ] Wait for required CI; inspect all review threads, and triage CodeRabbit findings when its review completes.
- [ ] Apply valid fixes without expanding scope; revalidate after each change.
- [ ] Promote only through the approved branch edge, one PR at a time.
- [ ] Stop at `Q.A.E2E` for human acceptance; do not merge or deploy by assumption.
- [ ] Record final PR state, checks, branch heads, and remaining manual action.

## References

- [Testing guide](./testing.md)
- [Deployment and DNS runbook](./deployment.md)
- [Code review and CodeRabbit guide](./code-review.md)
