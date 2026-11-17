/**
 * Checks that a nameserver serves every record neocom.cloud depends on.
 *
 * The point is to run it *before* the registrar's nameservers change. A new
 * provider can be queried directly as soon as its zone exists, so the whole
 * record set can be proved correct while the old provider is still
 * authoritative and nothing is at risk. Switching then becomes reversible
 * bookkeeping rather than a leap.
 *
 * Usage:
 *   node scripts/verify-dns.mjs                        # public resolvers
 *   node scripts/verify-dns.mjs --server ns1.cloudflare.com
 *   node scripts/verify-dns.mjs --only mail
 */

import { Resolver, lookup } from "node:dns/promises";
import { fileURLToPath } from "node:url";
import { resolve as resolvePath } from "node:path";
import { DOMAIN, EXPECTED_RECORDS, SUGGESTED_RECORDS, compareRecord } from "./dns-records.mjs";

const QUERY_TIMEOUT_MS = 10_000;

/**
 * @param {string} server Hostname or IP of the nameserver to ask.
 * @returns {Promise<Resolver>}
 */
async function createResolver(server) {
  const resolver = new Resolver({ timeout: QUERY_TIMEOUT_MS, tries: 2 });

  if (server) {
    // setServers only accepts addresses, so a hostname is resolved first
    // through the system resolver.
    const { address } = await lookup(server);
    resolver.setServers([address]);
  }

  return resolver;
}

/**
 * Reads one record type and flattens it to comparable strings.
 *
 * @param {Resolver} resolver
 * @param {{name: string, type: string}} record
 * @returns {Promise<string[]>}
 */
async function readValues(resolver, record) {
  switch (record.type) {
    case "A":
      return resolver.resolve4(record.name);
    case "CNAME":
      return resolver.resolveCname(record.name);
    case "MX": {
      const rows = await resolver.resolveMx(record.name);
      return rows.map((row) => `${row.priority} ${row.exchange}`);
    }
    case "TXT": {
      // Long TXT values arrive split into 255-byte chunks.
      const rows = await resolver.resolveTxt(record.name);
      return rows.map((chunks) => chunks.join(""));
    }
    default:
      throw new Error(`Unsupported record type: ${record.type}`);
  }
}

/**
 * @param {object} options
 * @param {string} [options.server]
 * @param {string} [options.only] Restrict to one purpose.
 * @param {boolean} [options.includeSuggested]
 * @returns {Promise<{ passed: number, failures: object[] }>}
 */
export async function verifyDns({ server = "", only = "", includeSuggested = false } = {}) {
  const resolver = await createResolver(server);
  const records = [...EXPECTED_RECORDS, ...(includeSuggested ? SUGGESTED_RECORDS : [])].filter(
    (record) => !only || record.purpose === only
  );

  let passed = 0;
  const failures = [];

  for (const record of records) {
    let actual = [];
    let error = null;

    try {
      actual = await readValues(resolver, record);
    } catch (cause) {
      error = cause.code ?? cause.message;
    }

    const result = error
      ? { ok: false, missing: record.values, unexpected: [] }
      : compareRecord(record, actual);

    if (result.ok) {
      passed += 1;
      console.log(`  ok    ${record.type.padEnd(5)} ${record.name}`);
      continue;
    }

    failures.push({ record, ...result, error });
    console.error(`  FAIL  ${record.type.padEnd(5)} ${record.name}`);
    if (error) console.error(`          query failed: ${error}`);
    for (const value of result.missing) console.error(`          missing: ${value.slice(0, 90)}`);
    for (const value of result.unexpected) console.error(`          unexpected: ${value.slice(0, 90)}`);
    console.error(`          breaks: ${record.why}`);
  }

  return { passed, failures };
}

function parseArgs(argv) {
  const options = { server: "", only: "", includeSuggested: false };

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--server") options.server = argv[index + 1] ?? "";
    if (argv[index] === "--only") options.only = argv[index + 1] ?? "";
    if (argv[index] === "--include-suggested") options.includeSuggested = true;
  }

  return options;
}

function isExecutedDirectly() {
  return process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isExecutedDirectly()) {
  const options = parseArgs(process.argv.slice(2));

  console.log(`Checking ${DOMAIN} against ${options.server || "the system resolvers"}\n`);

  const { passed, failures } = await verifyDns(options);

  console.log(`\n${passed} passed, ${failures.length} failed`);

  if (failures.length > 0) {
    const mail = failures.filter((failure) => failure.record.purpose === "mail");

    if (mail.length > 0) {
      console.error(
        `\n${mail.length} mail record(s) are wrong. Do not change nameservers: ` +
          `outgoing mail degrades silently.`
      );
    }

    process.exitCode = 1;
  }
}
