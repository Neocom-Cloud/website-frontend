# Padrão NeoCom v1 — DevOps para projetos no GitHub (20/11/2026)

Estado: **v1, em uso a partir do repositório modelo `Neocom-Cloud/project-template`** (fonte local em `project-template/`). Valores marcados **(decisão tomada)** seguiram a prática que o dono já usa no `website-frontend`; o resto é proposta que ele pode mudar.

## 1. Cadeia de promoção (decisão tomada)

```
feature/*  ->  develop  ->  Q.A  ->  main  ->  Q.A.E2E  ->  deploy (produção)
```

| Degrau | Origem obrigatória | O que prova | Quem faz o merge |
| --- | --- | --- | --- |
| `develop` | `feature/*`, `fix/*` | `CI gate` verde, branch atualizado (`strict`) | Dono. Agente só abre o PR |
| `Q.A` | `develop` | `CI gate` | Dono |
| `main` (staging) | `Q.A` | `CI gate` + staging emulado, quando o projeto tiver | Dono |
| `Q.A.E2E` | `main` | `CI gate` + E2E | Dono |
| `deploy` | `Q.A.E2E` | `CI gate` + **ambiente `production` com o dono como revisor** | Só o dono, e o ambiente trava a publicação |

Regras comuns: PR obrigatório, sem force push, sem apagar a branch, sem bypass, sem exigir aprovação humana nas branches intermediárias (prática do dono; quem barra é o `CI gate`). A validação da origem é feita pelo script `verify-promotion.mjs`, dentro do `CI gate`.

**Quem pode mesclar hoje:** nenhum agente tem a ferramenta de merge no Paperclip (só criar branch, abrir e atualizar PR, comentar). O merge dos degraus intermediários é do dono ou, no futuro, de auto-merge por degrau depois que a identidade distinta existir (ver seção 3). A matriz "departamentos até a Q.A, líderes até a `main`" fica **desenhada, não ligada**: ligar exige (a) a ferramenta de merge liberada por grupo de agentes no Paperclip e (b) o GitHub conseguir distinguir os grupos, o que uma conta de máquina só não faz.

## 2. O que o `CI gate` precisa conter

Um único check obrigatório (`CI gate`) que só passa se todos os jobs do `ci.yml` passarem:

1. **Promoção** (`verify-promotion.mjs`): o PR para `Q.A`, `main`, `Q.A.E2E` ou `deploy` precisa vir da origem certa.
2. **Metadados do agente** (`verify-agent-pr.mjs`): PR aberto por conta de agente (`NeoCom-Agents`) ou com label `agent:*` precisa ter o bloco `Identidade do agente` preenchido, o item `O que não foi verificado` e `Risco e reversão`. Sem isso o PR não passa.
3. **Guardas protegidas**: PR de conta de agente que altere `.github/`, `rulesets/`, `scripts/verify-*`, `AGENTS.md` ou `CODEOWNERS` **falha**. Só o dono altera as guardas.
4. **Testes** do projeto (no modelo: `node --test`; cada projeto troca pelo seu `test`/`build`).

Fora do modelo v1, para cada projeto decidir: E2E em navegador, staging emulado (LocalStack) e o **gate de deploy "mesmo SHA saudável na staging"** do Vintex (v1.1).

## 3. Identidade dos agentes (decisão tomada: uma conta de máquina)

- Conta: **`NeoCom-Agents`** (e-mail `board@neocom.cloud`), uma só, porque os Termos do GitHub permitem uma conta de máquina gratuita por pessoa. `deps@neocom.cloud` fica reservado.
- A camada (líder ou departamento) e o agente **são declarados no PR**, não na conta: o bloco `Identidade do agente` traz agente, camada, assento, modelo e esforço usados, issue `HOM-n` e ID da execução. Os mesmos dados vão no rodapé do commit (`Agent:`) e em labels `agent:<departamento>` e `tier:<camada>`.
- Como a conta é uma só, o GitHub não impede um agente de aprovar PR de outro. Por isso **nenhum agente aprova ou mescla**; aprovação é do dono.
- Evolução possível: GitHub Apps por camada (identidade `app[bot]`, tokens curtos), só se o conector do Paperclip aceitar.

## 4. Guardrails do lado do servidor (já aplicados em 20/11)

| Guardrail | Onde | Estado |
| --- | --- | --- |
| Agentes só abrem branch e PR, sem merge nem escrita direta | `codex-mcp-prep.py` (lista explícita de ferramentas) e perfis do Paperclip | Ativo |
| Teto de modelo e de esforço por agente | `tetos.json` + wrappers do Codex e do Claude; MCP recusa override de agente | Ativo |
| Cota (aviso 70, pausa 85, para 95) e tetos de execução (20 por departamento e 40 pelo Comando por dia; 6 por issue) | `nebula-usage` | **Observação** (só registra); ligar é decisão do dono |
| Linha de consumo em cada execução e ferramenta `paperclip_usage` | Wrappers e MCP | Ativo |

## 5. Template de PR voltado para IA

O arquivo `.github/pull_request_template.md` do modelo tem: `Resumo`, `Identidade do agente` (obrigatório para agentes), `Uso de IA`, `O que foi lido e o que foi executado`, `O que não foi verificado`, `Validação`, `Risco e reversão`. O texto entre `<` e `>` é placeholder e o `CI gate` o rejeita se sobrar.

## 6. O que todo repositório novo precisa ter

`AGENTS.md` (regras para agentes), `.github/pull_request_template.md`, `.github/CODEOWNERS` (dono nas guardas), `.github/workflows/ci.yml` com o `CI gate`, `scripts/verify-promotion.mjs` e `scripts/verify-agent-pr.mjs`, `rulesets/*.json` e `scripts/apply-rulesets.sh` (quem aplica é o dono), ambiente `production` com revisor, `.gitignore` que bloqueia segredos e arquivos locais de ferramentas (`.env`, `*.key`, `.claude/`).

## 7. Limites do plano Free

**Verificado em 20/11:** rulesets e proteção de branch **são recusados em repositório privado da organização no plano Free** (a API devolve 403 "Upgrade to GitHub Pro or make this repository public"); o `website-frontend` é público, por isso funcionam lá. Ambiente com revisor obrigatório em repositório privado: não confirmado. Nos privados o padrão vale por **convenção + `CI gate` + filtro de ferramentas do Paperclip**; as proteções reais chegam com o plano Team ou ao tornar o repositório público. O modelo traz os JSONs prontos para quando isso mudar.

## 8. Como criar um projeto novo

1. No GitHub, **Use this template** em `Neocom-Cloud/project-template` (privado).
2. Criar as branches `develop`, `Q.A`, `main`, `Q.A.E2E`, `deploy` a partir da `main`.
3. Ajustar `package.json` (`test`, `build`) e o `ci.yml` ao projeto, mantendo o job `CI gate`.
4. O dono roda `scripts/apply-rulesets.sh <owner/repo>` e cria o ambiente `production` com ele como revisor.
5. Dar à conta `NeoCom-Agents` o acesso de colaborador e liberar o repositório nas instruções dos agentes.

## 9. Decisões que continuam abertas

- Quem mescla cada degrau quando a identidade distinta existir (auto-merge por degrau, líderes até `main`).
- Gate "mesmo SHA na staging" e E2E: por projeto.
- Plano Team para os 10 repositórios privados.
