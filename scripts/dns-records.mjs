/**
 * The authoritative record set for neocom.cloud.
 *
 * Captured from Hostinger's nameservers (ns1.dns-parking.com, SOA serial
 * 2026111201) on 2026-11-17. This is the contract the zone has to satisfy
 * wherever it is hosted: if a record here stops resolving, something is
 * broken.
 *
 * The mail records matter most. Changing nameservers makes the new provider
 * the only source of truth, and anything missing there simply stops existing
 * — silently. Lost MX bounces visibly, but lost SPF and DKIM only degrade
 * deliverability, so the failure shows up weeks later as unanswered mail.
 *
 * Public DNS cannot enumerate a zone: these are the records we know to ask
 * for. Reconcile against an export from the registrar's own editor before
 * trusting this as complete — a second DKIM selector, for instance, would be
 * invisible here.
 */

export const DOMAIN = "neocom.cloud";

/** Hostinger today; replace once Cloudflare is authoritative. */
export const CURRENT_NAMESERVERS = ["ns1.dns-parking.com", "ns2.dns-parking.com"];

/**
 * @typedef {object} ExpectedRecord
 * @property {string} name        Fully qualified name.
 * @property {"A"|"MX"|"TXT"|"CNAME"} type
 * @property {string[]} values    Every value that must be present.
 * @property {boolean} [exact]    When true, no extra values may exist.
 * @property {"mail"|"web"|"verification"} purpose
 * @property {string} why         What breaks when this record disappears.
 */

/** @type {ExpectedRecord[]} */
export const EXPECTED_RECORDS = [
  {
    name: DOMAIN,
    type: "MX",
    values: ["10 mx.zoho.com", "20 mx2.zoho.com", "50 mx3.zoho.com"],
    exact: true,
    purpose: "mail",
    why: "Incoming mail to contato@neocom.cloud. Senders get a hard bounce."
  },
  {
    name: DOMAIN,
    type: "TXT",
    values: ["v=spf1 include:zohomail.com ~all"],
    purpose: "mail",
    why: "Authorises Zoho to send as the domain. Without it outgoing mail is marked spam."
  },
  {
    name: `zmail._domainkey.${DOMAIN}`,
    type: "TXT",
    values: [
      "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCoOOX3/aLrJHYgV1HZscFZZneDsi9k8OYo/VWO3cL0xWycV2E3VB3DANUstHDRg+peZyl7Wjo17bduBWQmi7NIN7rinlEYBH+LuIEH44bMHCrMP7BP+1ilDT91+jrK/C8RBlBjKIqnCSvXUnT7+FMomONEulQ4M22zRAGRnUbvmQIDAQAB"
    ],
    purpose: "mail",
    why: "Signs outgoing mail. Without it receivers cannot verify the signature."
  },
  {
    name: DOMAIN,
    type: "TXT",
    values: ["zoho-verification=zb49767071.zmverify.zoho.com"],
    purpose: "verification",
    why: "Proves domain ownership to Zoho, which rechecks periodically."
  },
  {
    name: DOMAIN,
    type: "A",
    values: [
      "185.199.108.153",
      "185.199.109.153",
      "185.199.110.153",
      "185.199.111.153"
    ],
    purpose: "web",
    why: "Points the apex at GitHub Pages. Replaced when the site moves to CloudFront."
  },
  {
    name: `www.${DOMAIN}`,
    type: "CNAME",
    values: ["neocom-cloud.github.io"],
    purpose: "web",
    why: "Alternate host. Replaced when the site moves to CloudFront."
  }
];

/** No DMARC exists. Not a migration risk, but worth adding as p=none. */
export const SUGGESTED_RECORDS = [
  {
    name: `_dmarc.${DOMAIN}`,
    type: "TXT",
    values: ["v=DMARC1; p=none; rua=mailto:contato@neocom.cloud"],
    purpose: "mail",
    why: "Monitoring only. p=none cannot reject mail, and the reports show what sends as the domain."
  }
];

/**
 * Compares what a nameserver answered against what a record requires.
 *
 * @param {ExpectedRecord} expected
 * @param {string[]} actual
 * @returns {{ ok: boolean, missing: string[], unexpected: string[] }}
 */
export function compareRecord(expected, actual) {
  const normalise = (value) => value.trim().replace(/\s+/g, " ").replace(/\.$/, "");
  const seen = actual.map(normalise);
  const wanted = expected.values.map(normalise);

  const missing = wanted.filter((value) => !seen.includes(value));
  const unexpected = expected.exact ? seen.filter((value) => !wanted.includes(value)) : [];

  return { ok: missing.length === 0 && unexpected.length === 0, missing, unexpected };
}
