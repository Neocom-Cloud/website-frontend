# Instructions for AI agents (Paperclip, Claude Code, others)

Read [docs/paperclip-agent-rules.md](./docs/paperclip-agent-rules.md) before changing anything.

The short version:

- Work on a branch and open a pull request into `develop`. Never push to `develop`, `Q.A`, `main`, `Q.A.E2E` or `deploy`.
- Never apply infrastructure (no `terraform apply`), and never change DNS, IAM or GitHub settings.
- Never widen permissions, session lengths or trust. Narrowing is welcome.
- Never commit secrets, keys, `.env` files or local tool settings such as `.claude/settings.local.json`. Check `git status` before each commit.
- One concern per pull request. Report what you verified, and what you did not.
