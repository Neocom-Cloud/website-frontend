# Summary

- What changed and why?

## Validation

- [ ] `pnpm typecheck`
- [ ] `pnpm test:ci`
- [ ] `pnpm build`
- [ ] `pnpm test:build-output`
- [ ] `pnpm verify:repository`
- [ ] Promotion PR: run and record `BASE_REF=<target> HEAD_REF=<source> pnpm verify:promotion`

## Product Impact

- [ ] No user-facing copy changed (select exactly one copy-impact option)
- [ ] Localized copy changed only in `pt-br` (select exactly one copy-impact option)
- [ ] Localized copy changed only in `en` (select exactly one copy-impact option)
- [ ] Localized copy changed in both `pt-br` and `en` (select exactly one copy-impact option)
- [ ] Routes, SEO metadata, or sitemap behavior changed
- [ ] Deployment, DNS, or GitHub Actions behavior changed

## Rollback

- State the rollback procedure, or explain why this change is safely reversible.

## Identidade do agente

<!-- Obrigatório para PR de agente (conta NeoCom-Agents ou label agent:*). Pessoa: apague as quatro seções abaixo. -->

- Agente: <nome do agente no Paperclip>
- Camada: <departamento ou líder>
- Assento: <Codex ou Claude>
- Modelo e esforço: <modelo / esforço usados>
- Issue: <HOM-n>
- Execução: <ID da execução>

## Uso de IA

- Que parte foi escrita pela IA e que parte foi revisada por pessoa ou por teste?

## O que não foi verificado

- Diga o que não foi testado ou confirmado. "Nada" só vale se for verdade.

## Risco e reversão

- Qual o risco e como reverter (normalmente: reverter este PR).
