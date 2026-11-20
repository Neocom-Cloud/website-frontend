# Instructions for AI agents (Paperclip, Claude Code, others)

Read [docs/paperclip-agent-rules.md](./docs/paperclip-agent-rules.md) before changing anything.

The short version:

- Work on a branch and open a pull request into `develop`. Never push to `develop`, `Q.A`, `main`, `Q.A.E2E` or `deploy`.
- Never apply infrastructure (no `terraform apply`), and never change DNS, IAM or GitHub settings.
- Never widen permissions, session lengths or trust. Narrowing is welcome.
- Never commit secrets, keys, `.env` files or local tool settings such as `.claude/settings.local.json`. Check `git status` before each commit.
- One concern per pull request. Report what you verified, and what you did not.
- Declare who you are in the pull request: fill the `Identidade do agente`, `Uso de IA`, `O que não foi verificado` and `Risco e reversão` sections of the template. The `Agent PR policy` job rejects an agent pull request without them. Add `Agent: <name>` as a commit footer.
- Do not change the guard files: `.github/`, `scripts/verify-*` and this file belong to the owner. An agent pull request that touches them fails.
- The model of your seat is a ceiling, not a target. Use the smallest level that solves the task, and check `paperclip_usage` before large work.

The full standard is in [docs/padrao-neocom.md](./docs/padrao-neocom.md).
