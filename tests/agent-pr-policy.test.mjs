import { describe, expect, it } from "vitest";
import { isAgentPr, validateAgentPr } from "../scripts/verify-agent-pr.mjs";

const GOOD = `## Resumo
Corrige o link.

## Identidade do agente
- Agente: Software e Linux — Codex (Sol 6.2)
- Camada: departamento
- Assento: Codex
- Modelo e esforço: gpt-6.2-sol / baixo
- Issue: HOM-130
- Execução: d113f5e8

## Uso de IA
Texto escrito pelo agente e revisado só por testes.

## O que não foi verificado
Nada além dos testes automáticos.

## Risco e reversão
Baixo; reverter o PR.
`;

describe("agent pull request policy", () => {
  it("lets a person's pull request through without the agent block", () => {
    expect(validateAgentPr({ author: "v-Kaefer", body: "" }).valid).toBe(true);
  });

  it("treats the machine account or an agent:* label as an agent pull request", () => {
    expect(isAgentPr({ author: "neocom-agents" })).toBe(true);
    expect(isAgentPr({ author: "someone", labels: ["agent:fiscal"] })).toBe(true);
    expect(isAgentPr({ author: "someone", labels: ["bug"] })).toBe(false);
  });

  it("accepts a complete agent pull request", () => {
    const result = validateAgentPr({ author: "NeoCom-Agents", body: GOOD, changedFiles: ["src/a.js"] });
    expect(result.valid, result.message).toBe(true);
  });

  it("rejects an agent pull request without the identity block", () => {
    const result = validateAgentPr({ author: "NeoCom-Agents", body: "## Resumo\nx", changedFiles: [] });
    expect(result.valid).toBe(false);
    expect(result.problems.some((p) => p.includes("Identidade do agente"))).toBe(true);
  });

  it("rejects a leftover placeholder", () => {
    const body = GOOD.replace("HOM-130", "<HOM-n>");
    expect(validateAgentPr({ author: "NeoCom-Agents", body, changedFiles: [] }).valid).toBe(false);
  });

  it("rejects a blank identity field", () => {
    const body = GOOD.replace("- Execução: d113f5e8", "- Execução:");
    const result = validateAgentPr({ author: "NeoCom-Agents", body, changedFiles: [] });
    expect(result.valid).toBe(false);
    expect(result.problems.some((p) => p.includes("Execução"))).toBe(true);
  });

  it("keeps agents out of the guard files", () => {
    for (const file of [".github/workflows/ci.yml", "scripts/verify-agent-pr.mjs", "AGENTS.md"]) {
      expect(validateAgentPr({ author: "NeoCom-Agents", body: GOOD, changedFiles: [file] }).valid, file).toBe(false);
    }
    expect(validateAgentPr({ author: "v-Kaefer", body: "", changedFiles: [".github/workflows/ci.yml"] }).valid).toBe(true);
  });
});
