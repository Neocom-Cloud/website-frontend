import { describe, expect, it } from "vitest";
import {
  DOMAIN,
  EXPECTED_RECORDS,
  SUGGESTED_RECORDS,
  compareRecord
} from "../scripts/dns-records.mjs";

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
