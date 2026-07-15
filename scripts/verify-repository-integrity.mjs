import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);
const CONFLICT_START = /^<{7}(?:\s|$)/;
const CONFLICT_SEPARATOR = /^={7}(?:\s|$)/;
const CONFLICT_END = /^>{7}(?:\s|$)/;

/**
 * Returns the 1-based marker lines for complete Git conflict blocks in content.
 *
 * @param {string} content
 * @returns {number[]}
 */
export function findConflictMarkers(content) {
  const lines = content.split(/\r?\n/);
  const markers = [];
  let block;

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;

    if (!block) {
      if (CONFLICT_START.test(line)) {
        block = { start: lineNumber };
      }
      continue;
    }

    if (!block.separator) {
      if (CONFLICT_SEPARATOR.test(line)) {
        block.separator = lineNumber;
      } else if (CONFLICT_START.test(line)) {
        block = { start: lineNumber };
      } else if (CONFLICT_END.test(line)) {
        block = undefined;
      }
      continue;
    }

    if (CONFLICT_END.test(line)) {
      markers.push(block.start, block.separator, lineNumber);
      block = undefined;
    } else if (CONFLICT_START.test(line)) {
      block = { start: lineNumber };
    }
  }

  return markers;
}

/**
 * Scans tracked text files for complete Git conflict blocks.
 *
 * @returns {Promise<string[]>}
 */
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

/**
 * Indicates whether this module was invoked as the process entry point.
 *
 * @returns {boolean}
 */
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
