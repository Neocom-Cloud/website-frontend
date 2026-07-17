import { appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { validatePromotion } from "./verify-promotion.mjs";

export const DEPLOYMENT_GATE_OUTPUTS = Object.freeze([
  "deploy-status",
  "browser-e2e",
  "pre-deploy-test"
]);

export function resolveDeploymentGates(eventName, baseRef, headRef) {
  const isPullRequest = eventName === "pull_request";
  const isValidPromotion = isPullRequest && validatePromotion(baseRef, headRef).valid;
  const isEndToEndPromotion = isValidPromotion && baseRef === "Q.A.E2E";

  return {
    "deploy-status": isEndToEndPromotion,
    "browser-e2e": isEndToEndPromotion,
    "pre-deploy-test": isValidPromotion && baseRef === "deploy"
  };
}

export function formatDeploymentGateOutputs(gates) {
  return DEPLOYMENT_GATE_OUTPUTS.map((name) => `${name}=${gates[name]}`).join("\n");
}

export async function runDeploymentGateResolver(environment = process.env) {
  const gates = resolveDeploymentGates(
    environment.EVENT_NAME,
    environment.BASE_REF,
    environment.HEAD_REF
  );
  const output = `${formatDeploymentGateOutputs(gates)}\n`;

  if (environment.GITHUB_OUTPUT) {
    await appendFile(environment.GITHUB_OUTPUT, output);
  } else {
    process.stdout.write(output);
  }

  return gates;
}

function isExecutedDirectly() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isExecutedDirectly()) {
  runDeploymentGateResolver().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
