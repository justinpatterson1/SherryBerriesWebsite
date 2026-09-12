// Courier delivery rates by city — the owner's own rate card, grouped the way
// she gave it (region, then price band). This is the single source of truth for
// which cities we deliver to and what each one costs; the checkout city field is
// a dropdown built from this list, and the checkout API prices the order from it
// rather than trusting anything the client sends.
//
// Only courier delivery varies by city. Pickup is always free and TTPost is a
// flat national rate — see SHIPPING in ./shipping.
//
// Adding a city: put it in the right band below. Nothing else needs to change —
// the dropdown, the validation and the fee lookup all derive from this array.

export type DeliveryRegion =
  | "East / North East"
  | "North / West"
  | "Central"
  | "South"
  | "Tobago";

export type DeliveryCity = {
  name: string;
  region: DeliveryRegion;
  fee: number;
};

type Band = { region: DeliveryRegion; fee: number; cities: string[] };

const BANDS: Band[] = [
  {
    region: "East / North East",
    fee: 40,
    cities: [
      "Arima",
      "Arima Old Road",
      "Arouca",
      "Bon Air",
      "Carapo",
      "Caroni",
      "Curepe",
      "D'Abadie",
      "Dinsley",
      "El Dorado",
      "Five Rivers",
      "Kelly Village",
      "La Florissante",
      "La Horquetta",
      "Lopinot",
      "Malabar",
      "Maloney",
      "Maturita",
      "Mausica",
      "O'Meara",
      "Oropune",
      "Piarco",
      "Pinto Road",
      "Red Hill",
      "Samaroo Village",
      "Santa Rosa",
      "Santa Rosa Heights",
      "St Augustine",
      "St Helena",
      "St Joseph",
      "Tacarigua",
      "Trincity",
      "Tunapuna",
      "Valsayn",
      "Wallerfield",
    ],
  },
  {
    region: "East / North East",
    fee: 50,
    cities: [
      "Biche",
      "Brasso Seco",
      "Cumuto",
      "Guaico",
      "Guanapo",
      "Sangre Grande",
      "Valencia",
    ],
  },
  {
    region: "East / North East",
    fee: 60,
    cities: ["Aripo", "Manzanilla"],
  },

  {
    region: "North / West",
    fee: 40,
    cities: [
      "Aranguez",
      "Bamboo",
      "Barataria",
      "Beetham",
      "Belmont",
      "Carenage",
      "Cascade",
      "Chaguaramas",
      "Champs Fleurs",
      "Cocorite",
      "Diego Martin",
      "El Socorro",
      "Four Roads",
      "Glencoe",
      "Goodwood Park",
      "Laventille",
      "Maraval",
      "Morvant",
      "Mt Hope",
      "Mt Lambert",
      "Petit Bourg",
      "Petit Valley",
      "Port of Spain",
      "San Juan",
      "St Ann's",
      "St Clair",
      "St James",
      "Westmoorings",
      "Woodbrook",
    ],
  },
  {
    region: "North / West",
    fee: 50,
    cities: ["Santa Cruz"],
  },

  {
    region: "Central",
    fee: 40,
    cities: [
      "Balmain",
      "California",
      "Carapichaima",
      "Carlsen Field",
      "Chaguanas",
      "Charlieville",
      "Chase Village",
      "Chin Chin",
      "Claxton Bay",
      "Couva",
      "Cunupia",
      "Edinburgh",
      "Endeavour",
      "Enterprise",
      "Felicity",
      "Freeport",
      "Jerningham Junction",
      "Lange Park",
      "Longdenville",
      "Mc Bean",
      "Montrose",
      "Munroe Road",
      "Point Lisas",
      "Preysal",
      "Warrenville",
      "Waterloo",
    ],
  },
  {
    region: "Central",
    fee: 50,
    cities: [
      "Brasso",
      "Gran Couva",
      "Las Lomas",
      "San Raphael",
      "Todds Road",
      "Tortuga",
    ],
  },
  {
    region: "Central",
    fee: 60,
    cities: ["Caparo", "Tabaquite", "Talparo"],
  },

  {
    region: "South",
    fee: 50,
    cities: [
      "Avocat",
      "C3 Mall",
      "Cocoyea",
      "Debe",
      "Dow Village",
      "Duncan Village",
      "Ecclesville",
      "Fifth Company",
      "Friendship Village",
      "Gasparillo",
      "Golconda",
      "Guapo",
      "Guayaguayare",
      "Gulf View",
      "Hermitage",
      "Indian Walk",
      "La Fortune",
      "La Romaine",
      "Lengua",
      "Mafeking",
      "Marabella",
      "Mon Repos",
      "Navet",
      "Oropouche",
      "Palmiste",
      "Penal",
      "Pleasantville",
      "Pointe-a-Pierre",
      "Princes Town",
      "San Fernando",
      "Siparia",
      "South Park",
      "St Julien",
      "St Madeleine",
      "Tarouba",
      "Union Park",
      "Vistabella",
    ],
  },
  {
    region: "South",
    fee: 60,
    cities: [
      "Barrackpore",
      "Fyzabad",
      "La Brea",
      "Mayaro",
      "Moruga (Select Areas)",
      "New Grant",
      "Palo Seco",
      "Point Fortin",
      "Rio Claro",
      "Rousillac",
      "South Oropouche",
      "St Mary's",
      "Tableland",
      "Vessigny",
      "Williamsville",
    ],
  },

  // Tobago is a single island-wide entry rather than a town list, so the street
  // address and landmark carry the detail. Break it into named towns here if
  // the rate ever needs to differ across the island.
  {
    region: "Tobago",
    fee: 40,
    cities: ["Tobago"],
  },
];

/** Every deliverable city, flattened. Ordered by region, then price, then name. */
export const DELIVERY_CITIES: readonly DeliveryCity[] = BANDS.flatMap((band) =>
  band.cities.map((name) => ({ name, region: band.region, fee: band.fee })),
);

/** Region order for the dropdown's <optgroup>s, as the rate card lists them. */
export const DELIVERY_REGIONS: readonly DeliveryRegion[] = [
  "East / North East",
  "North / West",
  "Central",
  "South",
  "Tobago",
];

/** The dropdown's shape: cities grouped under their region heading. */
export const CITIES_BY_REGION: Record<DeliveryRegion, DeliveryCity[]> =
  DELIVERY_REGIONS.reduce(
    (acc, region) => {
      acc[region] = DELIVERY_CITIES.filter((c) => c.region === region);
      return acc;
    },
    {} as Record<DeliveryRegion, DeliveryCity[]>,
  );

/** The cheapest rate on the card — the "from" price shown before a city is picked. */
export const MIN_DELIVERY_FEE = Math.min(...DELIVERY_CITIES.map((c) => c.fee));

/** The dearest rate — with MIN_DELIVERY_FEE, the range the policy page publishes. */
export const MAX_DELIVERY_FEE = Math.max(...DELIVERY_CITIES.map((c) => c.fee));

// Matching is forgiving about case, surrounding space and internal double
// spaces, because a saved address or an autofill can differ from our spelling in
// those ways without meaning a different place. It is deliberately NOT forgiving
// about anything else: an unrecognized city has no price, and the order is
// refused rather than guessed at.
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const BY_NAME = new Map(DELIVERY_CITIES.map((c) => [normalize(c.name), c]));

/** The rate-card entry for a city name, or null when we do not deliver there. */
export function findDeliveryCity(name: string): DeliveryCity | null {
  return BY_NAME.get(normalize(name)) ?? null;
}

/** Courier fee for a city, or null when the city is not on the rate card. */
export function deliveryFeeFor(name: string): number | null {
  return findDeliveryCity(name)?.fee ?? null;
}

/** Whether a free-text city (e.g. an older saved address) is still deliverable. */
export function isDeliverableCity(name: string): boolean {
  return BY_NAME.has(normalize(name));
}
