import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { getProductBySlug } from "@/lib/queries/product";
import {
  describeForModel,
  filterCatalog,
  parseSearchFilters,
  parseSlugs,
  toCard,
  type CatalogProduct,
  type ChatProductCard,
} from "@/lib/chat/catalog";

// The assistant's tools. All read-only: the agent can look things up and show
// product cards, never change a cart, an order or an account.
//
// Order here is fixed on purpose — the tool list is part of the cached prompt
// prefix, so reordering it costs a cache miss on every conversation.

const nullable = (type: "string" | "number") => ({ type: [type, "null"] });

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_products",
    description:
      "Search the SherryBerries catalog. Returns up to 6 matching products with slug, price, material, colours, sizes and stock. Use any combination of filters; pass null for unused ones. Only in-stock items unless include_out_of_stock is true.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: {
          ...nullable("string"),
          description: "Free-text keywords, e.g. 'helix hoop', 'aftercare spray'.",
        },
        category: {
          ...nullable("string"),
          description: "Category name or slug from list_categories, e.g. 'nose-rings'.",
        },
        material: { ...nullable("string"), description: "e.g. 'titanium', 'gold', 'steel'." },
        color: { ...nullable("string"), description: "e.g. 'gold', 'silver', 'pink'." },
        min_price: { ...nullable("number"), description: "Minimum price in TT$." },
        max_price: { ...nullable("number"), description: "Maximum price in TT$." },
        include_out_of_stock: { type: "boolean" },
      },
      required: [
        "query",
        "category",
        "material",
        "color",
        "min_price",
        "max_price",
        "include_out_of_stock",
      ],
    },
  },
  {
    name: "get_product",
    description:
      "Full details of one product by slug: description, care notes, healing stage, and each variant's size, colour, price and stock.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
  },
  {
    name: "list_categories",
    description: "List the shop's product categories with their slugs.",
    strict: true,
    input_schema: { type: "object", additionalProperties: false, properties: {}, required: [] },
  },
  {
    name: "show_products",
    description:
      "Display product cards to the customer for products you are recommending. Pass slugs you got from search_products or get_product. Max 4.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: { slugs: { type: "array", items: { type: "string" } } },
      required: ["slugs"],
    },
  },
];

async function loadCatalog(where: { slug?: { in: string[] } } = {}): Promise<CatalogProduct[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, ...where },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    select: {
      slug: true,
      name: true,
      shortDescription: true,
      material: true,
      price: true,
      compareAtPrice: true,
      inventory: true,
      isPreorder: true,
      isDigital: true,
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 1, select: { imageUrl: true } },
      colors: { orderBy: { position: "asc" }, select: { name: true } },
      variants: { select: { inventory: true, size: true } },
    },
  });

  return rows.map((p) => ({
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    categoryName: p.category.name,
    categorySlug: p.category.slug,
    material: p.material,
    tags: p.tags.map((t) => t.name),
    colors: p.colors.map((c) => c.name),
    sizes: [...new Set(p.variants.map((v) => v.size).filter((s): s is string => !!s))],
    imageUrl: p.images[0]?.imageUrl ?? null,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    inventory: p.inventory,
    variantInventory: p.variants.map((v) => v.inventory),
    isPreorder: p.isPreorder,
    isDigital: p.isDigital,
  }));
}

async function describeProduct(slug: string): Promise<string> {
  const p = await getProductBySlug(slug);
  if (!p || !p.active) return `No product with slug "${slug}".`;

  const colorName = new Map(p.colors.map((c) => [c.id, c.name]));
  const skipStock = p.isDigital || p.isPreorder;
  const variants = p.variants.map((v) => {
    const bits = [v.size ? `size ${v.size}` : v.value];
    if (v.colorId) bits.push(colorName.get(v.colorId) ?? "");
    bits.push(`TT$${(p.price + v.additionalPrice).toFixed(2)}`);
    if (!skipStock) bits.push(v.inventory > 0 ? "in stock" : "sold out");
    return `- ${bits.filter(Boolean).join(", ")}`;
  });

  return [
    `${p.name} (slug: ${p.slug}) — ${p.category.name}`,
    `Price: TT$${p.price.toFixed(2)}${p.compareAtPrice ? ` (was TT$${p.compareAtPrice.toFixed(2)})` : ""}`,
    p.material ? `Material: ${p.material}` : null,
    p.healingStage ? `Suitable stage: ${p.healingStage}` : null,
    p.isPreorder ? "Preorder: pay by card or bank transfer; ships when stock arrives." : null,
    p.isDigital ? "Digital download (PDF)." : null,
    !skipStock && !p.variants.length ? (p.inventory > 0 ? "In stock" : "Sold out") : null,
    `Summary: ${p.shortDescription}`,
    `Description: ${p.description.slice(0, 1500)}`,
    p.careInstructions ? `Care: ${p.careInstructions.slice(0, 800)}` : null,
    variants.length ? `Options:\n${variants.join("\n")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export interface ToolOutcome {
  /** Sent back to the model as the tool_result. */
  content: string;
  /** Cards to show the customer (show_products only). */
  cards?: ChatProductCard[];
  isError?: boolean;
}

export async function runChatTool(name: string, input: unknown): Promise<ToolOutcome> {
  switch (name) {
    case "search_products": {
      const hits = filterCatalog(await loadCatalog(), parseSearchFilters(input));
      if (!hits.length) return { content: "No matching products." };
      return { content: hits.map(describeForModel).join("\n") };
    }
    case "get_product": {
      const slug = parseSlugs({ slugs: [(input as { slug?: unknown })?.slug] })[0];
      if (!slug) return { content: "Invalid slug.", isError: true };
      return { content: await describeProduct(slug) };
    }
    case "list_categories": {
      const cats = await prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { name: true, slug: true },
      });
      return { content: cats.map((c) => `${c.name} (slug: ${c.slug})`).join("\n") };
    }
    case "show_products": {
      const slugs = parseSlugs(input).slice(0, 4);
      const found = await loadCatalog({ slug: { in: slugs } });
      const bySlug = new Map(found.map((p) => [p.slug, p]));
      const cards = slugs.flatMap((s) => {
        const p = bySlug.get(s);
        return p ? [toCard(p)] : [];
      });
      const missing = slugs.filter((s) => !bySlug.has(s));
      return {
        cards,
        content:
          `Shown ${cards.length} card(s).` +
          (missing.length ? ` Not found: ${missing.join(", ")}.` : ""),
      };
    }
    default:
      return { content: `Unknown tool ${name}.`, isError: true };
  }
}
