# Code Review And CodeRabbit

## Branches

Use the production promotion path:

```text
develop -> Q.A -> main -> deploy
```

`Q.A` is the valid Git branch name for the QA stage. `Q.A.` is not valid because Git branch names cannot end with a period.

Only `deploy` publishes GitHub Pages. CodeRabbit is advisory: CI and GitHub rulesets remain the merge gate.

## Pull Requests

Use the pull request template and keep changes focused. Include commands actually run, localized-copy impact, and any deployment or DNS effect.

CodeRabbit reviews non-draft pull requests to `develop`, `Q.A`, `main`, and `deploy`, then performs incremental reviews after new commits. Request a fresh review with:

```text
@coderabbitai full review
```

Use `@coderabbitai review` for an incremental review. Treat findings as hypotheses: verify the behavior, resolve valid findings in code and tests, and explain false positives in the review thread.

## Repository Configuration

`.coderabbit.yaml` is the version-controlled source of truth for this repository. It uses Portuguese review output, an assertive profile, and instructions for i18n, static generation, tests, workflows, and deployment documentation.

Generated output, dependencies, and `pnpm-lock.yaml` are excluded from review to keep feedback focused. GitHub Checks context is enabled with a ten-minute timeout so CodeRabbit can account for CI outcomes.

Do not enable automatic approval or make CodeRabbit a required GitHub check until it has completed at least ten representative pull requests without false blocks. At that point, use the exact check name shown in GitHub branch rules.

## Organization Settings

In the CodeRabbit organization dashboard:

1. Grant the GitHub App access to this repository only unless organization-wide access is intentional and approved.
2. Keep repository-specific behavior in `.coderabbit.yaml`; do not place branch names, Pages rules, or DNS instructions in Organization Settings.
3. Enable configuration inheritance only if the organization adopts a shared baseline. Without a shared baseline, leave it disabled to avoid unexpected inherited settings.
4. Do not use Global Overrides for this repository's review profile or path instructions. Reserve overrides for non-negotiable organization-wide security or compliance policy.
5. Keep automatic reviewer assignment and automatic approval disabled. CodeRabbit should review and report, not replace accountable human ownership.
6. Review the app's GitHub permissions periodically. CodeRabbit needs repository read/write access to post reviews and statuses; remove access when the integration is no longer needed.

CodeRabbit configuration precedence and available settings are documented at:

- https://docs.coderabbit.ai/guides/configuration-overview
- https://docs.coderabbit.ai/reference/configuration
- https://docs.coderabbit.ai/configuration/path-instructions
