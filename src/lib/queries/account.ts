import "server-only";
import { prisma } from "@/lib/db";
import type { FulfillmentStatus, PaymentStatus } from "@/generated/prisma/client";

// Display status shown on order badges / dashboard stats. Derived from the
// real FulfillmentStatus enum (which has no "Packed"/"Pending" members).
export type OrderDisplayStatus =
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type AccountProfile = {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  memberSince: string; // e.g. "March 2024"
  tier: string; // presentational — no backing field
};

export type AccountAddress = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  isDefault: boolean;
};

export type AccountOrderItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  variant: string | null;
  qty: number;
  price: number;
  lineTotal: number;
  img: string | null;
};

export type AccountOrder = {
  id: string;
  orderNumber: string;
  dateLabel: string; // "Mar 12, 2024"
  status: OrderDisplayStatus;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  trackingNumber: string | null;
  /** Index into [Pending, Processing, Packed, Shipped, Delivered]; -1 if cancelled. */
  stageIndex: number;
  returnEligible: boolean;
  items: AccountOrderItem[];
};

export type AccountData = {
  profile: AccountProfile;
  addresses: AccountAddress[];
  orders: AccountOrder[];
};

function displayStatus(f: FulfillmentStatus): OrderDisplayStatus {
  switch (f) {
    case "CANCELLED":
      return "Cancelled";
    case "DELIVERED":
      return "Delivered";
    case "SHIPPED":
      return "Shipped";
    default:
      return "Processing"; // UNFULFILLED | PROCESSING
  }
}

// Map the real enum onto the 5-stage presentational timeline. "Packed" (index 2)
// has no enum member, so it only reads as done once an order has shipped.
function stageIndexFor(f: FulfillmentStatus): number {
  switch (f) {
    case "CANCELLED":
      return -1;
    case "UNFULFILLED":
      return 0;
    case "PROCESSING":
      return 1;
    case "SHIPPED":
      return 3;
    case "DELIVERED":
      return 4;
    default:
      return 0;
  }
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() ?? "";
  return { firstName, lastName: parts.join(" ") };
}

const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function toAccountAddress(a: {
  id: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}): AccountAddress {
  const { firstName, lastName } = splitName(a.fullName);
  return {
    id: a.id,
    firstName,
    lastName,
    fullName: a.fullName,
    phone: a.phoneNumber,
    line1: a.addressLine1,
    line2: a.addressLine2 ?? "",
    city: a.city,
    region: a.region,
    postal: a.postalCode ?? "",
    country: a.country,
    isDefault: a.isDefault,
  };
}

export async function getAccountData(userId: string): Promise<AccountData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      name: true,
      email: true,
      phoneNumber: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const [addressRows, orderRows] = await Promise.all([
    prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: {
                  orderBy: { position: "asc" },
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
            variant: { select: { value: true } },
          },
        },
      },
    }),
  ]);

  const firstName = user.firstName ?? user.name?.split(" ")[0] ?? "there";
  const lastName =
    user.lastName ?? user.name?.split(" ").slice(1).join(" ") ?? "";

  const profile: AccountProfile = {
    firstName,
    lastName,
    name: user.name ?? [firstName, lastName].filter(Boolean).join(" "),
    email: user.email,
    phone: user.phoneNumber ?? "",
    memberSince: monthYear.format(user.createdAt),
    tier: "Sweet Berry",
  };

  const orders: AccountOrder[] = orderRows.map((o) => {
    const subtotal = Number(o.subtotal);
    const shippingFee = Number(o.shippingCost);
    const total = Number(o.total);
    // Orders carry no discount column — recover it from the totals so the
    // detail view can surface any applied savings.
    const discount = Math.max(0, Number((subtotal + shippingFee - total).toFixed(2)));

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      dateLabel: shortDate.format(o.createdAt),
      status: displayStatus(o.fulfillmentStatus),
      paymentMethod: o.paymentMethod ?? "Card",
      subtotal,
      shippingFee,
      discount,
      total,
      trackingNumber: o.trackingNumber,
      stageIndex: stageIndexFor(o.fulfillmentStatus),
      returnEligible: o.fulfillmentStatus === "DELIVERED",
      items: o.orderItems.map((it) => {
        const price = Number(it.price);
        return {
          id: it.id,
          productId: it.productId,
          name: it.product.name,
          slug: it.product.slug,
          variant: it.variant?.value ?? null,
          qty: it.quantity,
          price,
          lineTotal: Number((price * it.quantity).toFixed(2)),
          img: it.product.images[0]?.imageUrl ?? null,
        };
      }),
    };
  });

  return {
    profile,
    addresses: addressRows.map(toAccountAddress),
    orders,
  };
}

export type { FulfillmentStatus, PaymentStatus };
