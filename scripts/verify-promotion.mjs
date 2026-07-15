import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const REQUIRED_SOURCE_BRANCHES = Object.freeze({
  "Q.A": "develop",
  main: "Q.A",
  deploy: "main"
});

export function validatePromotion(baseRef, headRef) {
  if (!baseRef || !headRef) {
    return {
      valid: false,
      message: "BASE_REF and HEAD_REF are required to validate a promotion pull request."
    };
  }

  const requiredSource = REQUIRED_SOURCE_BRANCHES[baseRef];

  if (!requiredSource) {
    return {
      valid: true,
      message: `No source branch restriction applies to ${baseRef}.`
    };
  }

  if (headRef !== requiredSource) {
    return {
      valid: false,
      message: `Pull requests into ${baseRef} must come from ${requiredSource}, received ${headRef}.`
    };
  }

  return {
    valid: true,
    message: `Promotion path accepted: ${headRef} -> ${baseRef}.`
  };
}

function isExecutedDirectly() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isExecutedDirectly()) {
  const result = validatePromotion(process.env.BASE_REF, process.env.HEAD_REF);

  if (!result.valid) {
    console.error(result.message);
    process.exitCode = 1;
  } else {
    console.log(result.message);
  }
}
