/**
 * SherryBerries — full Prisma seed.
 *
 * Single-file seed covering all 16 models in dependency order:
 *   Users → Addresses → Categories → ProductTags → Products → ProductImages →
 *   ProductVariants → Blogs → DiscountCodes → Carts → CartItems → Wishlists →
 *   Reviews → Orders → OrderItems → NewsletterSubscribers
 *
 * Idempotent: upserts on natural keys (email, slug, code, sku). For child rows
 * without a natural key, we skip creation if any rows already exist for the
 * parent — so re-running this script doesn't pile up duplicates.
 *
 * Faker is seeded so output is deterministic across runs.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import {
  PrismaClient,
  type JewelryType,
  type HealingStage,
  type FulfillmentStatus,
} from "../src/generated/prisma/client";

faker.seed(20260521);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to run the seed.");

// Make the SSL mode explicit; `require` is a deprecated alias for `verify-full`
// in pg and warns at startup. Neon serves publicly-trusted certs.
const adapterConnectionString = connectionString.replace(
  /([?&]sslmode=)(prefer|require|verify-ca)\b/i,
  "$1verify-full",
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: adapterConnectionString }),
});

// ---- tunables ----------------------------------------------------------------

const COUNTS = {
  customers: 39, // + 1 admin = 40 users
  products: 60,
  orders: 100,
  blogs: 8,
  newsletter: 200,
  imagesPerProduct: { min: 1, max: 4 },
  variantsPerJewelry: { min: 2, max: 4 },
  addressesPerUser: { min: 1, max: 2 },
  wishlistPerUser: { min: 0, max: 3 },
  reviewsPerUser: { min: 0, max: 2 },
  cartItemsPerUser: { min: 0, max: 3 },
  itemsPerOrder: { min: 1, max: 5 },
};

const DEV_PASSWORD = "password123";

// ---- T&T flavor --------------------------------------------------------------

const TT_REGIONS = [
  "Port of Spain",
  "San Fernando",
  "Chaguanas",
  "Arima",
  "Point Fortin",
  "Couva",
  "Sangre Grande",
  "Diego Martin",
  "Tunapuna",
  "Scarborough",
];

function ttPhone(): string {
  // +1 868 NXX-NNNN
  return `+1 868 ${faker.number.int({ min: 200, max: 799 })}-${faker.number
    .int({ min: 1000, max: 9999 })
    .toString()}`;
}

function ttAddress() {
  return {
    addressLine1: `${faker.number.int({ min: 1, max: 250 })} ${faker.location.street()}`,
    addressLine2: faker.helpers.maybe(() => `Apt ${faker.number.int({ min: 1, max: 40 })}`, {
      probability: 0.3,
    }),
    city: faker.helpers.arrayElement(TT_REGIONS),
    region: "Trinidad",
    postalCode: faker.helpers.maybe(() => faker.number.int({ min: 100000, max: 699999 }).toString(), {
      probability: 0.6,
    }),
    country: "Trinidad and Tobago",
  };
}

// ---- catalog config ----------------------------------------------------------

const CATEGORY_BLUEPRINTS: Array<{
  slug: string;
  name: string;
  description: string;
  jewelryType: JewelryType;
  priceMin: number;
  priceMax: number;
  productPool: string[]; // base name fragments
  imageTags: string; // LoremFlickr comma-separated tags for product images
  categoryImageUrl: string; // served from public/ — used to populate Category.imageUrl
}> = [
  {
    slug: "belly-rings",
    name: "Belly Rings",
    description: "Curved barbells, dangles & opal centerpieces.",
    jewelryType: "BELLY_RING",
    priceMin: 25,
    priceMax: 180,
    productPool: ["Berry Glow Curve", "Opal Tide Dangle", "Sunset Drop", "Pearl Veil", "Crescent Halo", "Petal Curl", "Moonstone Arc"],
    imageTags: "belly-piercing,navel,jewelry",
    categoryImageUrl: "/images/categories/bellyring.jpg",
  },
  {
    slug: "nose-rings",
    name: "Nose Rings",
    description: "Studs, hoops & feather-light captives.",
    jewelryType: "NOSE_RING",
    priceMin: 25,
    priceMax: 180,
    productPool: ["Midnight Rose Stud", "Bloom Captive", "Whisper Hoop", "Petite Lotus", "Twinkle Pin", "Soft Coil"],
    imageTags: "nose-piercing,nose-ring,jewelry",
    categoryImageUrl: "/images/categories/nosering.jpg",
  },
  {
    slug: "septum-jewelry",
    name: "Septum Jewelry",
    description: "Clickers, horseshoes & statement rings.",
    jewelryType: "SEPTUM",
    priceMin: 25,
    priceMax: 180,
    productPool: ["Sherry Heart Clicker", "Storm Horseshoe", "Lace Edge Ring", "Drop Veil Clicker", "Sunrise Halo"],
    imageTags: "septum,piercing,jewelry",
    categoryImageUrl: "/images/categories/septum.jpg",
  },
  {
    slug: "cartilage-jewelry",
    name: "Cartilage Jewelry",
    description: "Helix, tragus, daith — delicate cartilage staples.",
    jewelryType: "CARTILAGE",
    priceMin: 25,
    priceMax: 180,
    productPool: ["Halo Hoop", "Petal Press Stud", "Honey Drip Ring", "Constellation Helix", "Sherbet Cuff", "Moonbeam Daith"],
    imageTags: "ear-piercing,helix,cartilage,jewelry",
    categoryImageUrl: "/images/categories/tragus.jpg",
  },
  {
    slug: "aftercare",
    name: "Aftercare",
    description: "Saline mists, oils & healing essentials.",
    jewelryType: "AFTERCARE",
    priceMin: 40,
    priceMax: 120,
    productPool: ["Soothing Saline Mist", "Healing Oil", "Salt Soak", "Calm Compress", "Aftercare Travel Kit"],
    imageTags: "skincare,beauty,wellness",
    categoryImageUrl: "/images/categories/aftercare.jpg",
  },
  {
    slug: "elixirs",
    name: "Elixirs",
    description: "Premium serums for sensitive, healing skin.",
    jewelryType: "ELIXIR",
    priceMin: 80,
    priceMax: 180,
    productPool: ["Rose Quartz Elixir", "Velvet Rebuild Serum", "Berry Glow Drops", "Midnight Repair Elixir"],
    imageTags: "serum,beauty,skincare,oil",
    // No dedicated elixir image yet — reusing the aftercare photo until a real one exists.
    categoryImageUrl: "/images/categories/aftercare.jpg",
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Cases, cleaning kits & pouches.",
    jewelryType: "AFTERCARE", // catch-all: enum doesn't have ACCESSORY yet
    priceMin: 25,
    priceMax: 120,
    productPool: ["Velvet Travel Case", "Mini Cleaning Brush", "Storage Pouch", "Soft Wipes Tin"],
    imageTags: "pouch,leather,velvet,case",
    categoryImageUrl: "/images/categories/accessories.jpg",
  },
  {
    slug: "merch",
    name: "Merch",
    description: "Apparel from the SherryBerries world.",
    jewelryType: "AFTERCARE", // catch-all: enum doesn't have MERCHANDISE yet
    priceMin: 80,
    priceMax: 180,
    productPool: ["Sweet Berry Tee", "Studio Hoodie", "Tote Bag", "Sherry Cap"],
    imageTags: "tshirt,apparel,fashion,clothing",
    categoryImageUrl: "/images/categories/merchandise.jpg",
  },
];

const IMAGE_TAGS_BY_CATEGORY_SLUG: Record<string, string> = Object.fromEntries(
  CATEGORY_BLUEPRINTS.map((b) => [b.slug, b.imageTags]),
);

const MATERIALS = [
  "Implant-grade titanium",
  "14k solid gold",
  "Niobium",
  "Surgical steel (nickel-free)",
  "Rose gold fill",
];

const TAG_NAMES = [
  "Bestseller",
  "New",
  "Limited",
  "Studio Pick",
  "Hypoallergenic",
  "Titanium Safe",
  "Implant Grade",
  "14k Gold",
  "Gift Idea",
  "Sensitive Skin",
];

const HEALING_STAGES: HealingStage[] = ["FRESH_PIERCING", "HEALING", "HEALED"];

// ---- helpers -----------------------------------------------------------------

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function range(min: number, max: number) {
  return faker.number.int({ min, max });
}

// Stable per-row seed derived from a cuid so per-user/per-product Faker rolls
// are deterministic across re-runs. Without this, a user who randomly drew 0
// cart items on run 1 would get re-rolled on every subsequent run.
function seedFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  faker.seed(Math.abs(hash) || 1);
}

// ---- seed steps --------------------------------------------------------------

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sherryberries.test" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@sherryberries.test",
      firstName: "Sherry",
      lastName: "Antoine",
      name: "Sherry Antoine",
      password: passwordHash,
      phoneNumber: ttPhone(),
      role: "ADMIN",
      emailVerified: new Date("2025-01-01"),
    },
  });

  const customers = [];
  for (let i = 0; i < COUNTS.customers; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet
      .email({ firstName, lastName, provider: "sherryberries.test" })
      .toLowerCase();

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        password: passwordHash,
        phoneNumber: ttPhone(),
        role: "CUSTOMER",
        emailVerified: faker.helpers.maybe(() => faker.date.past({ years: 1 }), { probability: 0.7 }) ?? null,
      },
    });
    customers.push(user);
  }

  return { admin, customers, all: [admin, ...customers] };
}

async function seedAddresses(users: Array<{ id: string }>) {
  for (const user of users) {
    const existing = await prisma.address.count({ where: { userId: user.id } });
    if (existing > 0) continue;
    const n = range(COUNTS.addressesPerUser.min, COUNTS.addressesPerUser.max);
    for (let i = 0; i < n; i++) {
      await prisma.address.create({
        data: {
          userId: user.id,
          fullName: faker.person.fullName(),
          phoneNumber: ttPhone(),
          isDefault: i === 0,
          ...ttAddress(),
        },
      });
    }
  }
}

async function seedCategories() {
  const out: Record<string, { id: string; slug: string }> = {};
  for (const cat of CATEGORY_BLUEPRINTS) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.categoryImageUrl,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        imageUrl: cat.categoryImageUrl,
        seoTitle: `${cat.name} | SherryBerries`,
        seoDescription: cat.description,
      },
    });
    out[cat.slug] = row;
  }
  return out;
}

async function seedTags() {
  const out: Record<string, { id: string }> = {};
  for (const name of TAG_NAMES) {
    const row = await prisma.productTag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    out[name] = row;
  }
  return out;
}

async function seedProducts(
  categoriesBySlug: Record<string, { id: string; slug: string }>,
  tagsByName: Record<string, { id: string }>,
) {
  const created: Array<{
    id: string;
    slug: string;
    price: number;
    categoryId: string;
    categorySlug: string;
    jewelryType: JewelryType;
  }> = [];

  let n = 0;
  while (n < COUNTS.products) {
    const blueprint = faker.helpers.arrayElement(CATEGORY_BLUEPRINTS);
    const basename = faker.helpers.arrayElement(blueprint.productPool);
    const accent = faker.helpers.arrayElement([
      "Berry",
      "Honey",
      "Velvet",
      "Petal",
      "Sunset",
      "Pearl",
      "Opal",
      "Sherry",
      "Mauve",
      "Twilight",
    ]);
    const name = `${accent} ${basename}`;
    const slug = `${slugify(name)}-${n + 1}`; // stable suffix avoids collisions across re-runs at different counts
    // Derive SKU directly from slug so SKU and slug are perfectly correlated.
    // Upsert keys on slug; if slug matches → SKU also matches → safe update.
    // If slug differs → SKU also differs → no independent collision path.
    const sku = `SB-${slug.toUpperCase().replace(/-/g, "").slice(0, 28)}`;

    const price = Number(
      faker.number.float({ min: blueprint.priceMin, max: blueprint.priceMax, fractionDigits: 2 }),
    );
    const hasCompare = faker.datatype.boolean({ probability: 0.45 });
    const compareAtPrice = hasCompare ? Number((price * faker.number.float({ min: 1.15, max: 1.5 })).toFixed(2)) : null;

    const tagPool = faker.helpers.arrayElements(Object.keys(tagsByName), { min: 1, max: 3 });

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name,
        price,
        compareAtPrice,
        inventory: range(0, 80),
      },
      create: {
        name,
        slug,
        shortDescription: faker.commerce.productDescription().slice(0, 140),
        description: `${faker.commerce.productDescription()} ${faker.lorem.sentences(2)}`,
        sku,
        price,
        compareAtPrice,
        inventory: range(0, 80),
        lowStockThreshold: 5,
        featured: faker.datatype.boolean({ probability: 0.25 }),
        active: faker.datatype.boolean({ probability: 0.95 }),
        material: faker.helpers.arrayElement(MATERIALS),
        jewelryType: blueprint.jewelryType,
        healingStage: faker.helpers.maybe(() => faker.helpers.arrayElement(HEALING_STAGES), {
          probability: 0.7,
        }) ?? null,
        seoTitle: `${name} | SherryBerries`,
        seoDescription: `${name} — ${blueprint.description}`,
        categoryId: categoriesBySlug[blueprint.slug].id,
        tags: { connect: tagPool.map((t) => ({ id: tagsByName[t].id })) },
      },
    });

    created.push({
      id: product.id,
      slug: product.slug,
      price: Number(product.price),
      categoryId: product.categoryId,
      categorySlug: blueprint.slug,
      jewelryType: product.jewelryType,
    });
    n++;
  }

  return created;
}

async function seedProductImages(
  products: Array<{ id: string; categorySlug: string }>,
) {
  // One-time migration: drop any old picsum-based image rows so they get
  // replaced with the new LoremFlickr URLs. Safe no-op once the cleanup is done.
  const stale = await prisma.productImage.deleteMany({
    where: { imageUrl: { contains: "picsum.photos" } },
  });
  if (stale.count > 0) {
    console.log(`  cleared ${stale.count} stale picsum image rows`);
  }

  for (const p of products) {
    const existing = await prisma.productImage.count({ where: { productId: p.id } });
    if (existing > 0) continue;
    const tags = IMAGE_TAGS_BY_CATEGORY_SLUG[p.categorySlug] ?? "jewelry";
    const n = range(COUNTS.imagesPerProduct.min, COUNTS.imagesPerProduct.max);
    for (let i = 0; i < n; i++) {
      // `lock` makes LoremFlickr return a stable image per (product, position).
      // Hash p.id + i into a positive integer for the lock value.
      let lock = 0;
      const seedStr = `${p.id}-${i}`;
      for (let c = 0; c < seedStr.length; c++) {
        lock = ((lock << 5) - lock + seedStr.charCodeAt(c)) | 0;
      }
      const url = `https://loremflickr.com/800/800/${tags}?lock=${Math.abs(lock)}`;
      await prisma.productImage.create({
        data: {
          productId: p.id,
          imageUrl: url,
          altText: faker.commerce.productAdjective(),
          position: i,
        },
      });
    }
  }
}

async function seedProductVariants(
  products: Array<{ id: string; jewelryType: JewelryType; slug: string }>,
) {
  // Only physical-jewelry types get variants (gauge sizes). Aftercare/elixirs/etc don't.
  const jewelryTypes: JewelryType[] = ["BELLY_RING", "NOSE_RING", "SEPTUM", "CARTILAGE", "NIPPLE", "EAR_LOBE", "INDUSTRIAL", "LABRET"];
  const gauges = ["20G", "18G", "16G", "14G", "12G"];

  for (const p of products) {
    if (!jewelryTypes.includes(p.jewelryType)) continue;
    const existing = await prisma.productVariant.count({ where: { productId: p.id } });
    if (existing > 0) continue;

    const n = range(COUNTS.variantsPerJewelry.min, COUNTS.variantsPerJewelry.max);
    const picked = faker.helpers.arrayElements(gauges, n);
    for (let i = 0; i < picked.length; i++) {
      await prisma.productVariant.create({
        data: {
          productId: p.id,
          name: "Gauge",
          value: picked[i],
          // include full product id to guarantee uniqueness — truncated slugs collide
          sku: `V-${p.id}-${picked[i]}-${i}`,
          inventory: range(0, 30),
          additionalPrice: faker.helpers.maybe(
            () => Number(faker.number.float({ min: 0, max: 8, fractionDigits: 2 })),
            { probability: 0.3 },
          ) ?? null,
        },
      });
    }
  }
}

async function seedBlogs() {
  const topics = [
    "How to clean a fresh piercing",
    "The truth about implant-grade titanium",
    "Daith piercings and migraines: what we know",
    "Downsizing 101: when and why",
    "Choosing your first septum clicker",
    "Aftercare myths to leave behind",
    "Caring for a piercing in the Caribbean climate",
    "Healing timelines, honestly",
    "Stacking studs: a guide",
    "Materials glossary: titanium vs niobium vs gold",
  ];
  let i = 0;
  for (const title of topics.slice(0, COUNTS.blogs)) {
    const slug = slugify(title);
    await prisma.blog.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        excerpt: faker.lorem.sentence({ min: 12, max: 22 }),
        content: faker.lorem.paragraphs({ min: 6, max: 10 }, "\n\n"),
        featuredImage: `https://picsum.photos/seed/blog-${i}/1200/675`,
        published: i < COUNTS.blogs - 1, // last one stays as a draft
        seoTitle: `${title} | SherryBerries Journal`,
        seoDescription: faker.lorem.sentence({ min: 15, max: 25 }),
      },
    });
    i++;
  }
}

async function seedDiscountCodes() {
  const codes: Array<{
    code: string;
    percentageOff?: number;
    amountOff?: number;
    usageLimit?: number;
  }> = [
    { code: "BERRY10", percentageOff: 10, usageLimit: 1000 },
    { code: "AFTERCARE15", percentageOff: 15, usageLimit: 500 },
    { code: "WELCOME20", percentageOff: 20, usageLimit: 2000 },
    { code: "GLOWUP25", percentageOff: 25, usageLimit: 200 },
    { code: "STUDIO50", amountOff: 50, usageLimit: 100 },
  ];
  for (const c of codes) {
    await prisma.discountCode.upsert({
      where: { code: c.code },
      update: {
        percentageOff: c.percentageOff ?? null,
        amountOff: c.amountOff ?? null,
        usageLimit: c.usageLimit ?? null,
      },
      create: {
        code: c.code,
        percentageOff: c.percentageOff ?? null,
        amountOff: c.amountOff ?? null,
        usageLimit: c.usageLimit ?? null,
        timesUsed: range(0, 10),
        active: true,
        expiresAt: faker.date.future({ years: 1 }),
      },
    });
  }
}

async function seedCartsAndItems(
  users: Array<{ id: string }>,
  products: Array<{ id: string; price: number }>,
) {
  for (const u of users) {
    const cart = await prisma.cart.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id },
    });

    const existing = await prisma.cartItem.count({ where: { cartId: cart.id } });
    if (existing > 0) continue;

    // Stable per-user seed → re-runs never grow this user's cart, even if their roll was 0.
    seedFromId(u.id);
    const n = range(COUNTS.cartItemsPerUser.min, COUNTS.cartItemsPerUser.max);
    if (n === 0) continue;
    const picks = faker.helpers.arrayElements(products, n);
    for (const product of picks) {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: range(1, 3),
        },
      });
    }
  }
}

async function seedWishlists(
  users: Array<{ id: string }>,
  products: Array<{ id: string }>,
) {
  for (const u of users) {
    const existing = await prisma.wishlist.count({ where: { userId: u.id } });
    if (existing > 0) continue;
    seedFromId(u.id + "wish");
    const n = range(COUNTS.wishlistPerUser.min, COUNTS.wishlistPerUser.max);
    if (n === 0) continue;
    const picks = faker.helpers.arrayElements(products, n);
    for (const product of picks) {
      // @@unique([userId, productId]) — protects against duplicates within this run
      await prisma.wishlist.upsert({
        where: { userId_productId: { userId: u.id, productId: product.id } },
        update: {},
        create: { userId: u.id, productId: product.id },
      });
    }
  }
}

async function seedReviews(
  users: Array<{ id: string }>,
  products: Array<{ id: string }>,
) {
  for (const u of users) {
    const existing = await prisma.review.count({ where: { userId: u.id } });
    if (existing > 0) continue;
    seedFromId(u.id + "review");
    const n = range(COUNTS.reviewsPerUser.min, COUNTS.reviewsPerUser.max);
    if (n === 0) continue;
    const picks = faker.helpers.arrayElements(products, n);
    for (const product of picks) {
      await prisma.review.create({
        data: {
          userId: u.id,
          productId: product.id,
          rating: range(3, 5),
          title: faker.helpers.maybe(() => faker.lorem.words({ min: 2, max: 6 }), { probability: 0.7 }) ?? null,
          comment: faker.lorem.sentences({ min: 1, max: 4 }),
          approved: faker.datatype.boolean({ probability: 0.7 }),
          createdAt: faker.date.past({ years: 1 }),
        },
      });
    }
  }
}

async function seedOrdersAndItems(
  users: Array<{ id: string }>,
  products: Array<{ id: string; price: number }>,
) {
  // Skip if we already have any orders (idempotent)
  const existing = await prisma.order.count();
  if (existing > 0) return;

  for (let i = 0; i < COUNTS.orders; i++) {
    const user = faker.helpers.arrayElement(users);
    const orderNumber = `SB-${faker.string.numeric(8)}`;
    const createdAt = faker.date.past({ years: 1 });
    const paymentStatus = faker.helpers.weightedArrayElement([
      { value: "PAID" as const, weight: 7 },
      { value: "PENDING" as const, weight: 2 },
      { value: "FAILED" as const, weight: 0.5 },
      { value: "REFUNDED" as const, weight: 0.5 },
    ]);
    // fulfillment correlates with payment
    const fulfillmentStatus: FulfillmentStatus =
      paymentStatus === "PAID"
        ? faker.helpers.weightedArrayElement([
            { value: "DELIVERED", weight: 5 },
            { value: "SHIPPED", weight: 3 },
            { value: "PROCESSING", weight: 2 },
          ])
        : paymentStatus === "REFUNDED"
        ? "CANCELLED"
        : "UNFULFILLED";

    const itemCount = range(COUNTS.itemsPerOrder.min, COUNTS.itemsPerOrder.max);
    const picks = faker.helpers.arrayElements(products, itemCount);

    let subtotal = 0;
    const orderItemsData = picks.map((p) => {
      const quantity = range(1, 2);
      const price = p.price; // snapshot at order time
      subtotal += price * quantity;
      return { productId: p.id, quantity, price };
    });

    const shippingCost = subtotal >= 80 ? 0 : 25;
    const total = Number((subtotal + shippingCost).toFixed(2));

    await prisma.order.create({
      data: {
        userId: user.id,
        orderNumber,
        subtotal: Number(subtotal.toFixed(2)),
        shippingCost,
        total,
        paymentStatus,
        fulfillmentStatus,
        paymentMethod: faker.helpers.arrayElement(["WiPay", "Bank transfer", "Cash on delivery"]),
        trackingNumber:
          fulfillmentStatus === "SHIPPED" || fulfillmentStatus === "DELIVERED"
            ? `TT${faker.string.numeric(10)}`
            : null,
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.15 }) ?? null,
        createdAt,
        updatedAt: createdAt,
        orderItems: {
          create: orderItemsData,
        },
      },
    });
  }
}

async function seedNewsletter() {
  const existing = await prisma.newsletterSubscriber.count();
  const needed = Math.max(0, COUNTS.newsletter - existing);
  for (let i = 0; i < needed; i++) {
    const email = faker.internet.email({ provider: "berrymail.test" }).toLowerCase();
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: {
        email,
        subscribedAt: faker.date.past({ years: 2 }),
      },
    });
  }
}

// ---- runner ------------------------------------------------------------------

async function main() {
  console.log("Seeding users…");
  const { admin, customers, all: users } = await seedUsers();

  console.log("Seeding addresses…");
  await seedAddresses(users);

  console.log("Seeding categories…");
  const categories = await seedCategories();

  console.log("Seeding product tags…");
  const tags = await seedTags();

  console.log("Seeding products…");
  // Reset Faker's deterministic seed right before product generation so slugs
  // and SKUs are stable across re-runs, regardless of how many upstream Faker
  // calls were skipped by idempotent guards.
  faker.seed(20260521);
  const products = await seedProducts(categories, tags);

  console.log("Seeding product images…");
  await seedProductImages(products);

  console.log("Seeding product variants…");
  await seedProductVariants(products);

  console.log("Seeding blogs…");
  await seedBlogs();

  console.log("Seeding discount codes…");
  await seedDiscountCodes();

  console.log("Seeding carts + items…");
  await seedCartsAndItems(customers, products);

  console.log("Seeding wishlists…");
  await seedWishlists(customers, products);

  console.log("Seeding reviews…");
  await seedReviews(customers, products);

  console.log("Seeding orders + items…");
  await seedOrdersAndItems(customers, products);

  console.log("Seeding newsletter subscribers…");
  await seedNewsletter();

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.address.count(),
    prisma.category.count(),
    prisma.productTag.count(),
    prisma.product.count(),
    prisma.productImage.count(),
    prisma.productVariant.count(),
    prisma.blog.count(),
    prisma.discountCode.count(),
    prisma.cart.count(),
    prisma.cartItem.count(),
    prisma.wishlist.count(),
    prisma.review.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.newsletterSubscriber.count(),
  ]);
  const labels = [
    "users",
    "addresses",
    "categories",
    "tags",
    "products",
    "productImages",
    "productVariants",
    "blogs",
    "discountCodes",
    "carts",
    "cartItems",
    "wishlists",
    "reviews",
    "orders",
    "orderItems",
    "newsletterSubscribers",
  ];
  console.log("\nFinal row counts:");
  for (let i = 0; i < labels.length; i++) {
    console.log(`  ${labels[i].padEnd(22)} ${counts[i]}`);
  }
  console.log(`\nDev login: ${admin.email} / ${DEV_PASSWORD}`);
  console.log(`Sample customer: ${customers[0]?.email} / ${DEV_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
