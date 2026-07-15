# Generic Development Playbook

Use this document as a repository-independent template for delivering a feature, hardening a release, or operating a staged CI/CD process. Replace the placeholders in the project profile before adopting it.

It deliberately separates principles from implementation details: the project may use any language, framework, cloud, hosting provider, package manager, or review tool.

## Project profile

Complete this table for the repository that adopts the playbook.

| Field | Project value |
| --- | --- |
| Project and owner | `<project-name>`, `<team-or-owner>` |
| Primary runtime and version | `<runtime and supported version>` |
| Package or dependency manager | `<tool and lockfile>` |
| Build command | `<command>` |
| Unit and integration command | `<command>` |
| Browser or system test command | `<command, or not applicable>` |
| Deployment target | `<hosting or cloud target>` |
| Production branch | `<production branch>` |
| Promotion path | `<integration> -> <qa> -> <release> -> <acceptance> -> <production>` |
| Required CI checks | `<named check list>` |
| Automated review tool | `<tool, or none>` |
| Manual acceptance owner | `<role or team>` |

The promotion path is an example, not a mandatory number of stages. Define only the environments the project needs, then enforce the allowed source-to-target edges in CI.

## Operating principles

1. Inspect before changing. Establish the repository, branch, worktree, workflow, test, and deployment baseline before deciding on implementation.
2. Make behavior, not implementation details, the contract. Tests and reviews should describe visible outcomes, API semantics, or operational guarantees.
3. Prefer centralized data and shared models over parallel implementations. Duplicate only where the variation is genuinely independent.
4. Keep changes focused. One concern per branch and pull request makes review, rollback, and blame reliable.
5. Use layered evidence. Local checks provide fast feedback; CI, review, and protected promotion provide release confidence.
6. Treat automation as evidence, not authority. Bots, linters, and generated reports should inform accountable human decisions.
7. Do not advance an environment by assumption. Every promotion is a distinct, verifiable release decision.

## Change lifecycle

### 1. Establish the baseline

Before implementation, identify:

- the current branch and whether the worktree is clean
- relevant source modules, configuration, tests, workflows, and runbooks
- supported runtime and dependency-management commands
- existing conventions for names, commits, PRs, and releases
- expected external behavior and non-functional constraints

Typical commands, adapted to the repository:

```bash
git status --short
git branch --show-current
git log -5 --oneline
<package-manager> run <test-command>
```

Do not overwrite unrelated uncommitted work. Preserve it when it does not conflict; clarify ownership when it does.

### 2. Define the observable outcome

Write the intended result in terms that a user, client, operator, or automated check can observe.

Examples:

- A request returns the documented status and response body for valid and invalid input.
- A localized route loads the selected language, a canonical URL, and the expected navigation state.
- A deployment workflow publishes exactly the build artifact from the approved production branch.
- A background job retries transient failures but does not duplicate a completed action.

State constraints explicitly: backward compatibility, performance budgets, security boundaries, availability expectations, data migration rules, and release deadlines.

### 3. Choose the smallest durable design

Use a short decision record for changes that affect architecture, security, data, or infrastructure:

| Question | Decision |
| --- | --- |
| What problem is being solved? | `<problem>` |
| What behavior must remain unchanged? | `<invariants>` |
| What is the smallest viable change? | `<approach>` |
| Why not the main alternative? | `<trade-off>` |
| How will success and rollback be verified? | `<evidence and rollback>` |

Prefer these patterns where applicable:

- A shared template or service with data-driven variation instead of copied variants.
- A stable interface or contract test instead of assertions on internal names or layout.
- A reversible configuration change before a one-way migration.
- A managed, simple hosting path before introducing operational infrastructure without a measurable requirement.

### 4. Implement in an isolated branch

Branch names should communicate intent:

```text
feat/<capability>
fix/<failure-mode>
test/<coverage-gap>
docs/<topic>
chore/<maintenance-task>
```

Keep commit subjects specific and conventional when the project uses conventional commits:

```text
feat(auth): add session renewal endpoint
fix(worker): avoid duplicate retry scheduling
test(api): cover invalid pagination token
docs(deploy): define rollback verification
```

Avoid unrelated refactors, lockfile churn, generated-file noise, or formatting changes in the same PR unless they are necessary for the requested outcome.

### 5. Validate locally in layers

Start with the fastest relevant checks, then run the complete required suite before a PR.

| Layer | Purpose | Examples |
| --- | --- | --- |
| Static validation | Catch syntax, type, formatting, and configuration errors | formatter, linter, typecheck, workflow lint |
| Unit tests | Verify pure business rules and boundary cases | parser, policy, transformation, validation tests |
| Integration tests | Verify components or services together | database, queue, DOM, HTTP handler, generated output |
| End-to-end tests | Verify critical user or operator flows | browser, CLI, deployment preview, system test |
| Artifact checks | Verify what is actually shipped | container, package, static build, migration artifact |
| Diff checks | Catch accidental merge markers and whitespace issues | `git diff --check` |

Run the exact command used by CI when a policy, CLI entry point, build process, or deployment gate is changed. Testing only a helper function is insufficient if CI invokes a separate command-line entry point.

Never report a check as passing unless it was run successfully. Record unavailable checks with the environment limitation and the planned follow-up.

### 6. Create a reviewable pull request

Each PR should answer:

```markdown
## What changed
<observable behavior and implementation boundary>

## Why
<user, product, reliability, security, or operational reason>

## Validation
- `<command>`
- `<command>`

## Impact and rollback
<deployment, data, compatibility, performance, or operational impact>
<how to reverse or disable the change>
```

Keep the PR focused enough that a reviewer can reconstruct the logic from the diff, tests, and description without needing chat history.

### 7. Triage automated and human review

Treat each review comment as a claim to verify against the current code and accepted behavior.

| Result | Action |
| --- | --- |
| Valid and in scope | Implement the smallest fix, add regression evidence, then rerun affected checks |
| Valid but out of scope | Create or link a follow-up item and state why it is deferred |
| Invalid or stale | Explain the evidence and resolve the thread only after verification |
| Subjective or disproportionate | Preserve the established design unless the change materially improves maintainability, reliability, or security |

Do not merge while required checks are pending or while actionable review threads are unresolved. If the review tool is advisory, do not let it become an accidental blocker; define the actual merge gates in repository rules and documentation.

### 8. Promote one environment boundary at a time

Define the allowed graph once, for example:

```text
integration -> qa -> release -> acceptance -> production
```

For each transition:

1. Confirm the source and target match an allowed edge.
2. Check that no equivalent promotion PR is already open.
3. Validate the exact policy locally where possible.
4. Create one PR for the boundary.
5. Wait for required CI, security scans, and review completion.
6. Inspect mergeability and unresolved threads.
7. Merge only when the evidence is complete.
8. Fetch the remote state before beginning the next boundary.

Keep the final manual-acceptance environment separate from production. This enables a human decision after the full system checks pass, without publishing automatically.

### 9. Handle mistakes safely

When a change is pushed to the wrong shared branch or has an unexpected effect:

1. Stop advancing the promotion path.
2. Determine the exact commits and environments affected.
3. Prefer a focused corrective commit or corrective PR over rewriting shared history.
4. Rerun the same validation that would have protected the intended boundary.
5. Record what happened, what was corrected, and whether a process guard should be added.

History rewrites, force pushes, destructive resets, and broad reverts require explicit coordination because they can discard work that is not visible in the current task.

## Evidence record template

Attach a concise record to a release note, PR, change ticket, or operations log:

```markdown
## Delivery evidence

- Change: `<commit or PR link>`
- Source -> target: `<branch or environment edge>`
- Behavior verified: `<short outcome>`
- Local validation: `<commands and results>`
- CI validation: `<named checks and results>`
- Review state: `<reviewer/tool, completed status, unresolved-thread count>`
- Artifact or deployment: `<artifact identifier, URL, version, or checksum>`
- Final branch/environment state: `<heads or version identifiers>`
- Deferred work or known limits: `<links or none>`
- Manual decision remaining: `<owner and required action, or none>`
```

This creates a compact audit trail without requiring a verbatim transcript of every command or discussion.

## Release operator checklist

- [ ] Confirm expected behavior, scope, constraints, and affected environment boundary.
- [ ] Inspect the repository baseline and preserve unrelated work.
- [ ] Choose a minimal, reversible, maintainable design.
- [ ] Implement in a focused branch with a specific commit history.
- [ ] Add behavioral coverage at the correct test layer.
- [ ] Run required local checks and verify the final diff.
- [ ] Open a PR with accurate validation and impact information.
- [ ] Resolve valid review findings and explicitly handle deferred or invalid ones.
- [ ] Promote only through an allowed source-to-target edge.
- [ ] Verify CI, review, mergeability, and branch/environment state after every promotion.
- [ ] Stop at the defined manual acceptance gate; do not deploy by assumption.
- [ ] Publish the delivery evidence record and remaining human action.

## How to tailor this template

Keep this document generic; place project-specific material elsewhere:

| Project-specific information | Recommended home |
| --- | --- |
| Runtime, commands, repository layout | `README.md` or contributor guide |
| Branch rules and required checks | deployment or release runbook |
| Infrastructure and DNS | operations runbook or infrastructure repository |
| Secure coding and reviewer configuration | security and code-review guide |
| Service-level objectives and incident response | operations handbook |
| Product-specific acceptance criteria | issue, specification, or test plan |

The best implementation of this playbook is short enough to be followed during normal work, strict enough to protect production, and explicit enough that a new contributor can repeat it without relying on oral history.
