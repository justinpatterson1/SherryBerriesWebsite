// Homepage testimonials — a small, hand-curated set of real customer reviews.
// This is the single editable source for the homepage Reviews slider (the copy
// can change here without touching the slider layout). Keep it to a handful of
// genuine quotes; `img` is optional and falls back to the reviewer's initials.
//
// NOTE: replace the placeholder copy below with the actual customer quotes.

export type Testimonial = {
  name: string;
  loc: string; // city / region, shown under the name
  rating: number; // 1–5
  date: string; // recency label, e.g. "May 2026"
  img?: string; // avatar URL; falls back to initials on error or when absent
  quote: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Aaliyah Mohammed",
    loc: "Port of Spain",
    rating: 5,
    date: "May 2026",
    quote:
      "My titanium studs healed cleaner than any piercing I've had. Three weeks in, zero irritation — the aftercare spray made all the difference.",
  },
  {
    name: "Renee Charles",
    loc: "San Fernando",
    rating: 5,
    date: "April 2026",
    quote:
      "The quality is unreal for the price. My gold huggies still look brand new after months of daily wear, and they've never once irritated my lobes.",
  },
  {
    name: "Kerry-Ann Boodram",
    loc: "Chaguanas",
    rating: 5,
    date: "April 2026",
    quote:
      "Ordered on a Monday, had it by Wednesday in Chaguanas. The packaging felt like a gift and the opal ends are even prettier in person.",
  },
  {
    name: "Shenelle Joseph",
    loc: "Arima",
    rating: 4,
    date: "March 2026",
    quote:
      "Finally implant-grade jewelry I can trust for a fresh helix. The sizing guide was spot on — no guessing, no swelling drama.",
  },
  {
    name: "Maria Lakhan",
    loc: "Diego Martin",
    rating: 5,
    date: "March 2026",
    quote:
      "I message them with the most random questions and they always reply with real advice, not a sales pitch. That's why I keep coming back.",
  },
  {
    name: "Tamara Phillip",
    loc: "Tunapuna",
    rating: 5,
    date: "February 2026",
    quote:
      "Switched my whole curation to SherryBerries. Comfortable enough to sleep in, and the gold hasn't tarnished one bit. Obsessed.",
  },
];
