import { describe, it, expect, vi } from "vitest";

// resend.ts is a server module; the marker package throws outside an RSC
// graph, and the SDK is never constructed because no send happens here.
vi.mock("server-only", () => ({}));

import { orderConfirmationHtml, type OrderEmailData } from "./resend";

const baseOrder: OrderEmailData = {
  orderNumber: "SB-1042",
  items: [
    {
      name: "Unicorn Belly Ring",
      variant: "Surgical Steel",
      qty: 2,
      price: 60,
      imageUrl: "https://cdn.example.com/products/unicorn.jpg",
    },
  ],
  subtotal: 120,
  discount: 0,
  shipLabel: "Courier Delivery",
  shipFee: 40,
  total: 160,
  paymentLabel: "Cash on Delivery",
  eta: "Arrives in 1–2 business days",
  shipTo: "Sherry Antoine, 182 Sanford Falls, Arima",
};

describe("the item thumbnail", () => {
  it("renders the product photo with sizing attributes email clients honour", () => {
    const html = orderConfirmationHtml({ greeting: "Hi Sherry,", order: baseOrder });
    expect(html).toContain('src="https://cdn.example.com/products/unicorn.jpg"');
    // Outlook ignores CSS width on <img>, so the attributes must be present.
    expect(html).toContain('width="56"');
    expect(html).toContain('height="56"');
    // Images are blocked by default in many clients — alt text has to carry it.
    expect(html).toContain('alt="Unicorn Belly Ring"');
  });

  it("falls back to an initial tile when the product has no photo", () => {
    const html = orderConfirmationHtml({
      greeting: "Hi Sherry,",
      order: { ...baseOrder, items: [{ ...baseOrder.items[0], imageUrl: null }] },
    });
    expect(html).not.toContain("<img");
    expect(html).toContain(">U</div>");
  });

  it("still renders when imageUrl is absent entirely", () => {
    const noImageField = { ...baseOrder.items[0] };
    delete noImageField.imageUrl;
    const html = orderConfirmationHtml({
      greeting: "Hi Sherry,",
      order: { ...baseOrder, items: [noImageField] },
    });
    expect(html).toContain("Unicorn Belly Ring");
    expect(html).not.toContain("<img");
  });

  it("keeps the line's other information alongside the image", () => {
    const html = orderConfirmationHtml({ greeting: "Hi Sherry,", order: baseOrder });
    expect(html).toContain("2× Unicorn Belly Ring");
    expect(html).toContain("Surgical Steel");
    expect(html).toContain("$120.00"); // 2 × $60 line total
    expect(html).toContain("$160.00"); // order total
  });
});

describe("escaping of free text", () => {
  it("escapes a product name that contains markup", () => {
    const html = orderConfirmationHtml({
      greeting: "Hi Sherry,",
      order: {
        ...baseOrder,
        items: [{ ...baseOrder.items[0], name: "<script>alert(1)</script>" }],
      },
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes the customer-supplied shipping address", () => {
    const html = orderConfirmationHtml({
      greeting: "Hi Sherry,",
      order: { ...baseOrder, shipTo: "Sherry, 1 Main St, Arima <img src=x onerror=alert(1)>" },
    });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
  });

  it("escapes a double quote in an image URL so it cannot break out of the attribute", () => {
    const html = orderConfirmationHtml({
      greeting: "Hi Sherry,",
      order: {
        ...baseOrder,
        items: [{ ...baseOrder.items[0], imageUrl: 'https://x.test/a.jpg" onload="alert(1)' }],
      },
    });
    expect(html).not.toContain('onload="alert(1)"');
    expect(html).toContain("&quot;");
  });
});
