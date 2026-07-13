import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);
const CONFLICT_MARKER = /^(?:<{7}|={7}|>{7})(?:\s|$)/;

export function findConflictMarkers(content) {
  return content
    .split(/\r?\n/)
    .flatMap((line, index) => (CONFLICT_MARKER.test(line) ? [index + 1] : []));
}

export async function verifyRepositoryIntegrity() {
  const { stdout } = await execFileAsync("git", ["ls-files", "-z"]);
  const files = stdout.split("\0").filter(Boolean);
  const failures = [];

  for (const file of files) {
    const contents = await readFile(file);

    if (contents.includes(0)) {
      continue;
    }

    for (const line of findConflictMarkers(contents.toString("utf8"))) {
      failures.push(`${file}:${line}`);
    }
  }

  return failures;
}

function isExecutedDirectly() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isExecutedDirectly()) {
  const failures = await verifyRepositoryIntegrity();

  if (failures.length > 0) {
    console.error(`Conflict markers found in tracked files:\n${failures.join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log("Repository integrity check passed.");
  }
}
