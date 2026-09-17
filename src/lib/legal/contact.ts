import "server-only";

/**
 * The address published on every legal page — Privacy, Terms, Shipping and
 * Returns.
 *
 * One constant rather than four, for the same reason SITE_URL became one: each
 * document used to declare its own copy, and they drifted. A customer reading
 * two policies should not be given two different places to write to, and a
 * privacy request sent to a dead address is a compliance problem rather than a
 * typo.
 *
 * ⚠ This is still not the address the app SENDS from (`EMAIL_FROM`, currently
 * support@shopsherryberries.com) and not `CONTACT_EMAIL` either — see the
 * open-issues entry. Reconciling those three is an owner decision; this at
 * least makes the published half consistent.
 */
export const LEGAL_CONTACT_EMAIL = "sherryberriesbodyjewelry@gmail.com";
