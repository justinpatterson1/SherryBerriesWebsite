// Shared content shapes for the long-form legal pages (/privacy, /terms).
// The copy for each page lives in its own module (privacy.ts, terms.ts) and is
// rendered by <LegalPage>, so a legal page is data plus a title — never layout.
//
// Plain types only — safe to import from server or client components.

/**
 * An inline run of copy. A plain string is the common case; the array form is
 * only used where the source copy emphasises a word or links out, so the pages
 * need no markdown parser.
 */
export type Run =
  | string
  /** Emphasised — rendered as <strong>. */
  | { b: string }
  /** A real anchor. Absolute http(s) URLs open in a new tab; mailto: does not. */
  | { href: string; text: string };

export type Rich = string | Run[];

export type Block =
  | { kind: "p"; text: Rich }
  | { kind: "list"; items: Rich[] }
  /** A labelled sub-block, e.g. "Personal Information" under "Information We Collect". */
  | { kind: "sub"; title: string };

export type Section = {
  /** Anchor target + jump-chip key. */
  id: string;
  /** Section heading — rendered as the section's <h2>. */
  title: string;
  /** Short label for the jump chip (the full title is often too long). */
  chip: string;
  /** Short kicker shown in the pink eyebrow above the heading. */
  kicker: string;
  blocks: Block[];
};

/**
 * The closing "Contact Us" section. Kept separate from the section list because
 * it gets the pink card treatment rather than a plain long-form section.
 */
export type LegalContact = {
  id: string;
  title: string;
  chip: string;
  kicker: string;
  intro: string;
  email: string;
  website: string;
};

/** Everything <LegalPage> needs to render one long-form legal document. */
export type LegalDocument = {
  /** Trailing breadcrumb label, e.g. "Privacy Policy". */
  breadcrumb: string;
  /** Pink eyebrow above the headline. */
  eyebrow: string;
  /** Headline, split so the last word can render in serif italic. */
  title: string;
  titleAccent: string;
  /** Rendered under the headline as "Last Updated: …". */
  lastUpdated: string;
  /** Opening blocks, shown in the hero without their own heading. */
  intro: Block[];
  sections: Section[];
  contact: LegalContact;
};
