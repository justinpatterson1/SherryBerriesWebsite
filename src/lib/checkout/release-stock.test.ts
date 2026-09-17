import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { promoFromNotes, releaseOrderStock, type ReleasableItems } from "./release-stock";
import type { Prisma } from "@/generated/prisma/client";

// releaseOrderStock takes its transaction client as an argument, so a plain
// recorder stands in for it — no module mocking required.
function recorder() {
  const productIncrements: { id: string; by: number }[] = [];
  const variantIncrements: { id: string; by: number }[] = [];
  const promoDecrements: string[] = [];
  const tx = {
    product: {
      update: async ({ where, data }: never) => {
        const w = where as { id: string };
        const d = data as { inventory: { increment: number } };
        productIncrements.push({ id: w.id, by: d.inventory.increment });
      },
    },
    productVariant: {
      update: async ({ where, data }: never) => {
        const w = where as { id: string };
        const d = data as { inventory: { increment: number } };
        variantIncrements.push({ id: w.id, by: d.inventory.increment });
      },
    },
    discountCode: {
      updateMany: async ({ where }: never) => {
        promoDecrements.push((where as { code: string }).code);
      },
    },
  } as unknown as Prisma.TransactionClient;
  return { tx, productIncrements, variantIncrements, promoDecrements };
}

const physicalLine = {
  productId: "p-ring",
  variantId: null,
  quantity: 2,
  product: { isDigital: false },
};
const digitalLine = {
  productId: "p-manual",
  variantId: null,
  quantity: 1,
  product: { isDigital: true },
};

describe("promoFromNotes", () => {
  it("reads the promo recorded at checkout", () => {
    expect(promoFromNotes(JSON.stringify({ promo: "BERRY10" }))).toBe("BERRY10");
  });

  it("returns null for absent, empty or unparseable notes", () => {
    expect(promoFromNotes(JSON.stringify({ promo: null }))).toBeNull();
    expect(promoFromNotes("{}")).toBeNull();
    expect(promoFromNotes(null)).toBeNull();
    expect(promoFromNotes("not json")).toBeNull();
  });
});

describe("releaseOrderStock", () => {
  it("gives back stock for a physical line", async () => {
    const r = recorder();
    const order: ReleasableItems = { notes: null, orderItems: [physicalLine] };
    await releaseOrderStock(r.tx, order);
    expect(r.productIncrements).toEqual([{ id: "p-ring", by: 2 }]);
  });

  it("gives back variant stock when the line chose one", async () => {
    const r = recorder();
    const order: ReleasableItems = {
      notes: null,
      orderItems: [{ ...physicalLine, variantId: "v-8mm" }],
    };
    await releaseOrderStock(r.tx, order);
    expect(r.variantIncrements).toEqual([{ id: "v-8mm", by: 2 }]);
    expect(r.productIncrements).toEqual([]);
  });

  // Regression guard: inventory inflation. Checkout does not decrement a
  // download, so incrementing one here would add phantom stock to a digital
  // product on every failed payment and every expired bank transfer.
  it("does not give back stock for a download", async () => {
    const r = recorder();
    const order: ReleasableItems = { notes: null, orderItems: [digitalLine] };
    await releaseOrderStock(r.tx, order);
    expect(r.productIncrements).toEqual([]);
    expect(r.variantIncrements).toEqual([]);
  });

  it("restocks only the physical lines of a mixed order", async () => {
    const r = recorder();
    const order: ReleasableItems = { notes: null, orderItems: [physicalLine, digitalLine] };
    await releaseOrderStock(r.tx, order);
    expect(r.productIncrements).toEqual([{ id: "p-ring", by: 2 }]);
  });

  it("releases the promo redemption too", async () => {
    const r = recorder();
    const order: ReleasableItems = {
      notes: JSON.stringify({ promo: "BERRY10" }),
      orderItems: [physicalLine],
    };
    await releaseOrderStock(r.tx, order);
    expect(r.promoDecrements).toEqual(["BERRY10"]);
  });

  it("releases the promo on a digital-only order, which still consumed one", async () => {
    const r = recorder();
    const order: ReleasableItems = {
      notes: JSON.stringify({ promo: "BERRY10" }),
      orderItems: [digitalLine],
    };
    await releaseOrderStock(r.tx, order);
    expect(r.productIncrements).toEqual([]);
    expect(r.promoDecrements).toEqual(["BERRY10"]);
  });
});
