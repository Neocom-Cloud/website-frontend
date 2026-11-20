// Padrão NeoCom v1: valida PR aberto por agente.
// - PR de conta de agente (AGENT_ACCOUNTS) ou com label `agent:*` precisa do bloco "Identidade do agente"
//   preenchido, de "O que não foi verificado" e de "Risco e reversão".
// - PR de agente não pode alterar as guardas (PROTECTED_PATHS): só o dono altera.
// Variáveis: PR_AUTHOR, PR_LABELS (JSON), PR_BODY, CHANGED_FILES (um caminho por linha), AGENT_ACCOUNTS (vírgulas).
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const DEFAULT_AGENT_ACCOUNTS = ["NeoCom-Agents"];
export const PROTECTED_PATHS = [
  /^\.github\//,
  /^rulesets\//,
  /^scripts\/verify-/,
  /^scripts\/apply-rulesets\.sh$/,
  /^AGENTS\.md$/
];
export const IDENTITY_FIELDS = ["Agente", "Camada", "Assento", "Modelo e esforço", "Issue", "Execução"];
const SECTIONS = ["Identidade do agente", "Uso de IA", "O que não foi verificado", "Risco e reversão"];

export function isAgentPr({ author, labels = [], accounts = DEFAULT_AGENT_ACCOUNTS }) {
  const byAccount = accounts.some((a) => a.toLowerCase() === String(author ?? "").toLowerCase());
  const byLabel = labels.some((l) => String(l).startsWith("agent:"));
  return byAccount || byLabel;
}

function section(body, title) {
  const re = new RegExp(`^##\\s+${title}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, "mi");
  const m = re.exec(body);
  return m ? m[1].trim() : null;
}

export function validateAgentPr({ author, labels = [], body = "", changedFiles = [], accounts = DEFAULT_AGENT_ACCOUNTS }) {
  if (!isAgentPr({ author, labels, accounts })) {
    return { valid: true, problems: [], message: "PR de pessoa: metadados de agente não se aplicam." };
  }
  const problems = [];
  for (const title of SECTIONS) {
    const text = section(body, title);
    if (text === null) problems.push(`Falta a seção "## ${title}".`);
    else if (text === "" || /<[^>\n]+>/.test(text)) problems.push(`A seção "${title}" está vazia ou ainda tem placeholder <...>.`);
  }
  const identity = section(body, "Identidade do agente") ?? "";
  for (const field of IDENTITY_FIELDS) {
    const m = new RegExp(`^[-*]?\\s*\\*{0,2}${field}\\*{0,2}\\s*:\\s*(.+)$`, "mi").exec(identity);
    if (!m || !m[1].trim() || /^<.*>$/.test(m[1].trim())) problems.push(`Identidade do agente: o campo "${field}" não foi preenchido.`);
  }
  const touched = changedFiles.filter((f) => PROTECTED_PATHS.some((re) => re.test(f)));
  if (touched.length) problems.push(`Agente não altera as guardas (só o dono): ${touched.join(", ")}.`);
  return {
    valid: problems.length === 0,
    problems,
    message: problems.length ? problems.join("\n") : "Metadados do agente completos e nenhuma guarda alterada."
  };
}

function executedDirectly() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (executedDirectly()) {
  const env = process.env;
  const result = validateAgentPr({
    author: env.PR_AUTHOR,
    labels: JSON.parse(env.PR_LABELS || "[]"),
    body: env.PR_BODY || "",
    changedFiles: (env.CHANGED_FILES || "").split("\n").map((s) => s.trim()).filter(Boolean),
    accounts: (env.AGENT_ACCOUNTS || DEFAULT_AGENT_ACCOUNTS.join(",")).split(",").map((s) => s.trim()).filter(Boolean)
  });
  if (result.valid) console.log(result.message);
  else {
    console.error(result.message);
    process.exitCode = 1;
  }
}
