// Pure rules for digital (downloadable) products.
//
// No I/O and no server-only imports, so both the checkout API and the checkout
// UI can apply exactly the same rule — the same reason shipping.ts exists.

export type DigitalFlagged = { isDigital: boolean };

/** True for a non-empty cart whose every line is a download. */
export function isDigitalOnly(lines: readonly DigitalFlagged[]): boolean {
  return lines.length > 0 && lines.every((l) => l.isDigital);
}

/**
 * Whether an order needs a delivery address and a shipping method.
 *
 * Fail-closed on an empty list: a cart that has not loaded, or failed to load,
 * must never be treated as "digital, so skip the address check". Only a cart
 * we can see, every line of which is a download, skips shipping.
 */
export function cartNeedsShipping(lines: readonly DigitalFlagged[]): boolean {
  return !isDigitalOnly(lines);
}

const FILENAME_SAFE = /[^A-Za-z0-9 ._-]+/g;
const MAX_FILENAME_STEM = 60;

/**
 * A filename safe to put in a Content-Disposition header.
 *
 * Product names are admin-authored free text going into a response header, so
 * quotes and CRLF are header injection. Strip to a known-safe set rather than
 * escaping, and always land on exactly one `.pdf`.
 */
export function downloadFilename(productName: string): string {
  const stem = productName
    .replace(/\.pdf$/i, "")
    .replace(FILENAME_SAFE, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_FILENAME_STEM)
    // Dots survive the safe-set filter, so a name like "../../etc/passwd"
    // reduces to ".. .. etc passwd". Trim them off both ends: a leading dot is
    // a hidden file on unix, a trailing one is awkward on Windows.
    .replace(/^[. ]+/, "")
    .replace(/[. ]+$/, "");
  return stem ? `${stem}.pdf` : "download.pdf";
}
