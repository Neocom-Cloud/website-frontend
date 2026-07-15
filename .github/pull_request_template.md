# Summary

- What changed and why?

## Validation

- [ ] `pnpm typecheck`
- [ ] `pnpm test:ci`
- [ ] `pnpm build`
- [ ] `pnpm test:build-output`
- [ ] `pnpm verify:repository`
- [ ] For promotion PRs, record `BASE_REF` and `HEAD_REF` plus the executed `pnpm verify:promotion` command in the summary

## Product Impact

- [ ] No user-facing copy changed (select exactly one copy-impact option)
- [ ] Localized copy changed in both `pt-br` and `en` (select exactly one copy-impact option)
- [ ] Routes, SEO metadata, or sitemap behavior changed
- [ ] Deployment, DNS, or GitHub Actions behavior changed

## Rollback

- State the rollback procedure, or explain why this change is safely reversible.
