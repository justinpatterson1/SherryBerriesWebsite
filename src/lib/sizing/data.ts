// Editable content for the /learn/sizing guide. Copy, sizes, and ordering all
// live here so the page's copy can change without touching layout. Plain static
// data — safe to import from server or client components.

export type Gauge = {
  gauge: string;
  mm: string;
  inch: string;
  uses: string;
  /** Bar thickness in mm — drives the relative width of the visual scale. */
  thickness: number;
};

// Ordered thickest-perception aside, listed thin → thick (high number → low).
export const GAUGES: Gauge[] = [
  { gauge: "20G", mm: "0.8 mm", inch: '0.032"', uses: "Nostril studs, delicate earlobes", thickness: 0.8 },
  { gauge: "18G", mm: "1.0 mm", inch: '0.040"', uses: "Nostrils, earlobes, some helix", thickness: 1.0 },
  { gauge: "16G", mm: "1.2 mm", inch: '0.047"', uses: "Helix, tragus, eyebrow, lip, septum", thickness: 1.2 },
  { gauge: "14G", mm: "1.6 mm", inch: '0.063"', uses: "Navel, nipple, tongue, septum", thickness: 1.6 },
  { gauge: "12G", mm: "2.0 mm", inch: '0.081"', uses: "Industrial, stretched piercings", thickness: 2.0 },
  { gauge: "10G", mm: "2.4 mm", inch: '0.102"', uses: "Stretched lobes and larger gauges", thickness: 2.4 },
];

export const SIZE_CHIPS = ["6 mm", "8 mm", "10 mm", "12 mm"];

export type Placement = {
  name: string;
  gauge: string;
  size: string;
  styles: string;
  note: string;
};

export const PLACEMENTS: Placement[] = [
  {
    name: "Earlobe",
    gauge: "20G – 18G",
    size: "6 – 8 mm",
    styles: "Studs, huggies, hoops",
    note: "The standard starting point. Downsize studs once healed for a flush fit.",
  },
  {
    name: "Helix / Cartilage",
    gauge: "16G",
    size: "6 – 8 mm",
    styles: "Flat-back studs, clickers, hoops",
    note: "Start with a longer labret post to allow swelling, then downsize around 3 months.",
  },
  {
    name: "Conch",
    gauge: "16G – 14G",
    size: "8 – 10 mm",
    styles: "Studs, statement hoops",
    note: "Hoops need a larger 10 – 12 mm diameter to sit correctly around the cartilage.",
  },
  {
    name: "Tragus",
    gauge: "16G",
    size: "6 – 8 mm",
    styles: "Labret studs, small hoops",
    note: "A flat-back labret is the most comfortable and least snag-prone choice.",
  },
  {
    name: "Nostril",
    gauge: "20G – 18G",
    size: "6 – 8 mm",
    styles: "Nose bones, L-bends, screws, seamless rings",
    note: "Rings usually sit best at an 8 mm diameter in 20G.",
  },
  {
    name: "Septum",
    gauge: "16G – 14G",
    size: "8 – 10 mm",
    styles: "Clickers, circular barbells, captive rings",
    note: "8 mm is the most common starting diameter; anatomy shifts this up or down.",
  },
  {
    name: "Navel",
    gauge: "14G",
    size: "10 mm",
    styles: "Curved (banana) barbells, dangles",
    note: "Fresh navels start at 11 – 12 mm for swelling, then downsize to 8 – 10 mm once healed.",
  },
  {
    name: "Eyebrow",
    gauge: "16G",
    size: "8 mm",
    styles: "Curved barbells, rings",
    note: "A curved barbell reduces tension and the chance of migration.",
  },
  {
    name: "Tongue",
    gauge: "14G",
    size: "16 – 19 mm",
    styles: "Straight barbells",
    note: "Fresh tongues use a longer ~19 mm bar for swelling, downsizing to 14 – 16 mm after ~4 weeks.",
  },
  {
    name: "Nipple",
    gauge: "14G",
    size: "12 – 16 mm",
    styles: "Straight or curved barbells, rings",
    note: "Sizing varies most with anatomy here — 14 mm is a common middle ground.",
  },
  {
    name: "Daith",
    gauge: "16G",
    size: "8 mm",
    styles: "Clickers, heart rings, hoops",
    note: "Clickers and curved pieces follow the fold of the ear the most naturally.",
  },
  {
    name: "Industrial",
    gauge: "14G",
    size: "32 – 38 mm",
    styles: "Single straight barbell",
    note: "One straight barbell (usually 35 – 38 mm) spans both the helix and forward-helix holes.",
  },
];

export type Step = { title: string; body: string };

export const STEPS: Step[] = [
  {
    title: "Remove a piece that fits",
    body: "Take out a comfortable, well-fitting piece from the same piercing to measure against.",
  },
  {
    title: "Lay it on a mm ruler",
    body: "Place it flat on a hard surface next to a millimeter scale, in good light.",
  },
  {
    title: "Measure the right span",
    body: "For rings, measure the inner diameter. For barbells and studs, measure the wearable bar between the ends — not the balls or decorative tops.",
  },
  {
    title: "Note the gauge",
    body: "Measure the bar thickness (or check your last order). Match both the gauge and the size when you shop.",
  },
];

export type MaterialTier = "fresh" | "healed" | "avoid";

export type Material = {
  name: string;
  tier: MaterialTier;
  note: string;
};

export const TIER_LABEL: Record<MaterialTier, string> = {
  fresh: "Fresh-safe",
  healed: "Healed only",
  avoid: "Avoid in fresh",
};

export const MATERIALS: Material[] = [
  {
    name: "Implant-grade titanium",
    tier: "fresh",
    note: "ASTM F-136. Nickel-free, lightweight, and the gold standard for fresh piercings.",
  },
  {
    name: "Solid gold (14k+)",
    tier: "fresh",
    note: "Nickel-free solid gold — never plated. Safe for fresh wear and long-term.",
  },
  {
    name: "Niobium",
    tier: "fresh",
    note: "Inert and hypoallergenic, a budget-friendly alternative to titanium.",
  },
  {
    name: "Surgical steel (316L)",
    tier: "healed",
    note: "Fine for most healed piercings, but its nickel content isn't ideal for fresh or sensitive skin.",
  },
  {
    name: "Gold-plated / gold-filled",
    tier: "avoid",
    note: "The plating wears through to base metal that can irritate and prolong healing.",
  },
  {
    name: "Sterling silver",
    tier: "avoid",
    note: "Tarnishes, can leave marks, and should never go in a fresh or mucosal piercing.",
  },
];

export type SizingFaqItem = { q: string; a: string };

export const SIZING_FAQS: SizingFaqItem[] = [
  {
    q: "I'm between two sizes — which do I pick?",
    a: "While a piercing is fresh, size up to leave room for swelling. Once it's fully healed you can size to the smaller, flusher fit. When in doubt, message us your current piece's measurements.",
  },
  {
    q: "Why do fresh piercings need a longer bar?",
    a: "Fresh piercings swell. A longer post or bar keeps the jewelry from pressing into the tissue while that happens. Downsize once the swelling settles — usually 4 to 12 weeks depending on the placement.",
  },
  {
    q: "Can I change my own gauge (stretch up)?",
    a: "Not on a fresh piercing, and never force a thicker gauge into an existing hole. Stretch gradually with a professional — forcing it tears tissue and causes scarring.",
  },
  {
    q: "How do I convert gauge to millimeters?",
    a: "Use the conversion table above: 20G ≈ 0.8 mm, 18G ≈ 1.0 mm, 16G ≈ 1.2 mm, 14G ≈ 1.6 mm. Remember the counter-intuitive rule — a higher gauge number means a thinner bar.",
  },
  {
    q: "Still not sure of my size?",
    a: "Send us a message with a photo of your current piece next to a ruler, plus its measurements, and we'll recommend the right gauge and size before you buy.",
  },
];
