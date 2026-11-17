/**
 * Exports the mail and verification records for Terraform to consume.
 *
 * Terraform cannot import an ES module, so the record set is written out as
 * JSON. Keeping one source avoids the drift that would be most costly here:
 * the verifier passing while the zone Terraform applies is missing a record.
 * tests/dns-records.test.mjs fails if this file falls out of step.
 *
 * Usage: node scripts/generate-dns-json.mjs
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { EXPECTED_RECORDS } from "./dns-records.mjs";

const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../infra/terraform-dns/records.json"
);

/**
 * Web records are excluded: they point at whichever host currently serves the
 * site and change with it, so the Terraform stack declares them explicitly
 * instead. What is exported here is the set that must survive untouched.
 *
 * @returns {object[]}
 */
export function buildTerraformRecords() {
  return EXPECTED_RECORDS.filter((record) => record.purpose !== "web").flatMap((record) =>
    record.values.map((value) => {
      if (record.type === "MX") {
        const [priority, exchange] = value.split(" ");
        return {
          key: `mx-${exchange}`,
          name: record.name,
          type: "MX",
          content: exchange,
          priority: Number(priority),
          comment: record.why
        };
      }

      return {
        key: `${record.type.toLowerCase()}-${record.name}-${value.slice(0, 24)}`
          .replace(/[^a-zA-Z0-9-]/g, "-")
          .toLowerCase(),
        name: record.name,
        type: record.type,
        content: value,
        priority: null,
        comment: record.why
      };
    })
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const records = buildTerraformRecords();
  await writeFile(OUTPUT, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  console.log(`${OUTPUT} — ${records.length} records`);
}
