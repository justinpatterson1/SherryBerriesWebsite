#!/usr/bin/env node
/**
 * Dependency vulnerability gate.
 *
 * `npm audit` on its own is not usable as a CI check here: four advisories in
 * prisma's dependency tree have no fix short of downgrading to Prisma 6, which
 * would break the schema. A check that can never go green is a check people
 * learn to ignore, so this compares the audit against a reviewed allowlist and
 * fails only on something NEW.
 *
 *   node scripts/audit-check.mjs [--level=high] [--omit-dev]
 *
 * Exit codes: 0 clean, 1 action needed, 2 the audit itself could not run.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ALLOWLIST = join(HERE, "audit-allowlist.json");

const RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

const args = process.argv.slice(2);
const levelArg = args.find((a) => a.startsWith("--level="))?.split("=")[1] ?? "high";
const omitDev = args.includes("--omit-dev");

if (!(levelArg in RANK)) {
  console.error(`Unknown --level=${levelArg}. Use: ${Object.keys(RANK).join(", ")}`);
  process.exit(2);
}
const threshold = RANK[levelArg];

/** `npm audit` exits non-zero when it finds anything, so failure is expected. */
function runAudit() {
  const cmd = ["audit", "--json"];
  if (omitDev) cmd.push("--omit=dev");
  try {
    return execFileSync("npm", cmd, { encoding: "utf8", shell: process.platform === "win32" });
  } catch (err) {
    // A findings-exit still carries the JSON we want on stdout.
    if (err.stdout) return err.stdout;
    throw err;
  }
}

let report;
try {
  report = JSON.parse(runAudit());
} catch (err) {
  console.error("Could not run `npm audit`:", err.message);
  console.error("Treating this as a failure: an audit that cannot run is not an audit that passed.");
  process.exit(2);
}

const allowlist = JSON.parse(readFileSync(ALLOWLIST, "utf8"));
const allowed = new Map(allowlist.allow.map((e) => [e.id, e]));
const today = new Date().toISOString().slice(0, 10);

// Flatten to individual advisories: npm groups them per package, and one
// package can carry several.
const found = new Map();
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vuln.via ?? []) {
    if (typeof via !== "object" || typeof via.source !== "number") continue;
    found.set(via.source, {
      id: via.source,
      package: via.name ?? vuln.name,
      title: via.title ?? "(no title)",
      severity: via.severity ?? vuln.severity,
      url: via.url,
    });
  }
}

const blocking = [];
const accepted = [];
const expired = [];

for (const advisory of found.values()) {
  const entry = allowed.get(advisory.id);
  if (!entry) {
    if (RANK[advisory.severity] >= threshold) blocking.push(advisory);
    continue;
  }
  if (entry.expires && entry.expires < today) expired.push({ advisory, entry });
  else accepted.push({ advisory, entry });
}

// An allowlist entry matching nothing means the fix landed upstream. Not a
// failure — but the file should not accumulate fiction.
const stale = allowlist.allow.filter((e) => !found.has(e.id));

const counts = report.metadata?.vulnerabilities ?? {};
console.log(
  `npm audit: ${counts.total ?? 0} total ` +
    `(critical ${counts.critical ?? 0}, high ${counts.high ?? 0}, ` +
    `moderate ${counts.moderate ?? 0}, low ${counts.low ?? 0})`,
);
console.log(`Gate: fail on un-reviewed advisories at "${levelArg}" or above.\n`);

if (accepted.length) {
  console.log(`Accepted (reviewed, see scripts/audit-allowlist.json): ${accepted.length}`);
  for (const { advisory, entry } of accepted) {
    console.log(`  · ${advisory.package} — ${advisory.title} [#${advisory.id}, review by ${entry.expires}]`);
  }
  console.log("");
}

if (stale.length) {
  console.log("Allowlist entries that no longer match anything — please delete them:");
  for (const e of stale) console.log(`  · #${e.id} ${e.package}`);
  console.log("");
}

if (expired.length) {
  console.log("EXPIRED acceptances — these need re-reviewing:");
  for (const { advisory, entry } of expired) {
    console.log(`  ✗ ${advisory.package} — ${advisory.title} [#${advisory.id}, expired ${entry.expires}]`);
  }
  console.log("");
}

if (blocking.length) {
  console.log("NEW vulnerabilities, not reviewed:");
  for (const a of blocking) {
    console.log(`  ✗ [${a.severity}] ${a.package} — ${a.title}`);
    if (a.url) console.log(`      ${a.url}`);
  }
  console.log("");
  console.log("Fix them (`npm audit fix`), or — if genuinely not exploitable here —");
  console.log("add an entry to scripts/audit-allowlist.json with a reason and an expiry.");
}

if (blocking.length || expired.length) process.exit(1);

console.log("✓ No new vulnerabilities above the threshold.");
