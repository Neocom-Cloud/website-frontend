import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DOMAIN,
  EXPECTED_RECORDS,
  SUGGESTED_RECORDS,
  compareRecord
} from "../scripts/dns-records.mjs";
import { buildTerraformRecords } from "../scripts/generate-dns-json.mjs";

describe("DNS record contract", () => {
  it("covers every record the mailbox depends on", () => {
    const mail = EXPECTED_RECORDS.filter((record) => record.purpose === "mail");
    const kinds = mail.map((record) => `${record.type} ${record.name}`);

    // MX carries incoming mail; SPF and DKIM carry outgoing deliverability.
    // Losing any one of the three breaks contato@neocom.cloud.
    expect(kinds).toContain(`MX ${DOMAIN}`);
    expect(mail.some((record) => record.values.some((v) => v.startsWith("v=spf1")))).toBe(true);
    expect(mail.some((record) => record.name.includes("_domainkey"))).toBe(true);
  });

  it("pins the MX set exactly, so a stray host cannot be added unnoticed", () => {
    const mx = EXPECTED_RECORDS.find((record) => record.type === "MX");

    expect(mx.exact).toBe(true);
    expect(mx.values).toEqual(["10 mx.zoho.com", "20 mx2.zoho.com", "50 mx3.zoho.com"]);
  });

  it("explains the consequence of every record going missing", () => {
    for (const record of [...EXPECTED_RECORDS, ...SUGGESTED_RECORDS]) {
      expect(record.why, `${record.type} ${record.name}`).toBeTruthy();
      expect(record.why.length, `${record.type} ${record.name}`).toBeGreaterThan(20);
    }
  });

  it("keeps DMARC a suggestion rather than a requirement", () => {
    // None exists today, so asserting it would fail against the live zone.
    // p=none also cannot reject mail, so adding it is safe but not urgent.
    expect(EXPECTED_RECORDS.some((record) => record.name.startsWith("_dmarc"))).toBe(false);
    expect(SUGGESTED_RECORDS.some((record) => record.values[0].includes("p=none"))).toBe(true);
  });
});

describe("reconciliation with the registrar's export", () => {
  // The zone as Hostinger exported it. Probing could never have found the
  // GitHub organisation verification record: its name is not guessable.
  const zoneFile = readFileSync(
    resolve(process.cwd(), "docs/dns/hostinger-zone-2026-11-17.txt"),
    "utf8"
  );

  it("accounts for every record in the export", () => {
    // Record lines carry a TTL, a class and a type; everything else is a
    // comment or a directive.
    const types = [...zoneFile.matchAll(/^\S*\s+\d+\s+IN\s+(\w+)/gm)].map(([, type]) => type);
    const covered = new Set(EXPECTED_RECORDS.map((record) => record.type));

    for (const type of new Set(types)) {
      // SOA and NS belong to whoever hosts the zone and are replaced by the
      // move rather than carried across.
      if (type === "SOA" || type === "NS") continue;

      // The export's A records are GitHub Pages' four addresses. They are
      // retired on purpose: the apex now points at CloudFront through a CNAME
      // that Cloudflare flattens, which a literal comparison cannot express.
      if (type === "A") continue;

      expect(covered.has(type), `${type} appears in the export`).toBe(true);
    }
  });

  it("keeps the GitHub organisation verification record and drops the Pages one", () => {
    const org = "_gh-neocom-cloud-o";

    expect(zoneFile).toContain(org);
    expect(EXPECTED_RECORDS.some((record) => record.name.startsWith(`${org}.`))).toBe(true);

    // The Pages challenge belongs to hosting the site on GitHub, which is over.
    expect(zoneFile).toContain("_github-pages-challenge-neocom-cloud");
    expect(
      EXPECTED_RECORDS.some((record) => record.name.includes("_github-pages-challenge"))
    ).toBe(false);
  });

  it("uses the same DKIM key the export holds", () => {
    const dkim = EXPECTED_RECORDS.find((record) => record.name.includes("_domainkey"));
    const key = dkim.values[0].match(/p=([A-Za-z0-9+/=]+)/)[1];

    expect(zoneFile).toContain(key);
  });
});

describe("the Terraform export", () => {
  const onDisk = JSON.parse(
    readFileSync(resolve(process.cwd(), "infra/terraform-dns/records.json"), "utf8")
  );

  it("matches what the record module produces", () => {
    // Two sources would be the costly kind of drift: the verifier passing
    // while the zone Terraform applies is missing a record.
    expect(onDisk).toEqual(buildTerraformRecords());
  });

  it("carries every mail and verification record, and no web record", () => {
    const expected = EXPECTED_RECORDS.filter((record) => record.purpose !== "web");
    const valueCount = expected.reduce((total, record) => total + record.values.length, 0);

    expect(onDisk).toHaveLength(valueCount);
    expect(onDisk.some((record) => record.type === "A")).toBe(false);
    expect(onDisk.filter((record) => record.type === "MX")).toHaveLength(3);
  });

  it("splits MX priority out of the value, which Cloudflare takes separately", () => {
    for (const record of onDisk.filter((entry) => entry.type === "MX")) {
      expect(record.priority).toBeTypeOf("number");
      expect(record.content).not.toMatch(/^\d/);
    }
  });

  it("gives every record a unique key, so for_each cannot collide", () => {
    const keys = onDisk.map((record) => record.key);

    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("compareRecord", () => {
  const record = { values: ["10 mx.zoho.com", "20 mx2.zoho.com"], exact: true };

  it("accepts the expected values in any order", () => {
    expect(compareRecord(record, ["20 mx2.zoho.com", "10 mx.zoho.com"]).ok).toBe(true);
  });

  it("ignores the trailing dot a nameserver may return", () => {
    expect(compareRecord(record, ["10 mx.zoho.com.", "20 mx2.zoho.com."]).ok).toBe(true);
  });

  it("reports what is missing", () => {
    const result = compareRecord(record, ["10 mx.zoho.com"]);

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(["20 mx2.zoho.com"]);
  });

  it("reports an extra value only where the set is exact", () => {
    const extra = ["10 mx.zoho.com", "20 mx2.zoho.com", "30 evil.example"];

    expect(compareRecord(record, extra).unexpected).toEqual(["30 evil.example"]);
    expect(compareRecord({ ...record, exact: false }, extra).ok).toBe(true);
  });

  it("treats a long TXT value as one string once its chunks are joined", () => {
    const dkim = EXPECTED_RECORDS.find((entry) => entry.name.includes("_domainkey"));
    const chunks = [dkim.values[0].slice(0, 255), dkim.values[0].slice(255)];

    expect(compareRecord(dkim, [chunks.join("")]).ok).toBe(true);
  });
});
