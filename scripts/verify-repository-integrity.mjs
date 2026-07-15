import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);
const CONFLICT_START = /^(<{7,})(?:\s|$)/;
const CONFLICT_SEPARATOR = /^(={7,})(?:\s|$)/;
const CONFLICT_END = /^(>{7,})(?:\s|$)/;

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

    const start = line.match(CONFLICT_START);
    const separator = line.match(CONFLICT_SEPARATOR);
    const end = line.match(CONFLICT_END);

    if (!block) {
      if (start) {
        block = { start: lineNumber, width: start[1].length };
      }
      continue;
    }

    if (!block.separator) {
      if (separator?.[1].length === block.width) {
        block.separator = lineNumber;
      } else if (start) {
        block = { start: lineNumber, width: start[1].length };
      } else if (end?.[1].length === block.width) {
        block = undefined;
      }
      continue;
    }

    if (end?.[1].length === block.width) {
      markers.push(block.start, block.separator, lineNumber);
      block = undefined;
    } else if (start) {
      block = { start: lineNumber, width: start[1].length };
    }
  }

  return markers;
}

/**
 * Scans tracked text files for complete Git conflict blocks.
 *
 * @param {{
 *   listTrackedFiles?: () => Promise<string[]>;
 *   readTrackedFile?: (file: string) => Promise<Buffer>;
 * }} [options]
 * @returns {Promise<string[]>}
 */
export async function verifyRepositoryIntegrity({
  listTrackedFiles = getTrackedFiles,
  readTrackedFile = readFile
} = {}) {
  const files = await listTrackedFiles();
  const failures = [];

  for (const file of files) {
    const contents = await readTrackedFile(file);

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
 * Lists repository-tracked files for the default integrity scan.
 *
 * @returns {Promise<string[]>}
 */
async function getTrackedFiles() {
  const { stdout } = await execFileAsync("git", ["ls-files", "-z"]);
  return stdout.split("\0").filter(Boolean);
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
