import { describe, expect, it } from "vitest";
import { deliveryFor } from "./delivery";

const notes = (shipping: unknown) => JSON.stringify({ shipping, payment: "card" });

describe("deliveryFor", () => {
  it("reads each shipping method out of the notes snapshot", () => {
    expect(deliveryFor(notes("pickup"))).toEqual({ key: "pickup", label: "Pickup" });
    expect(deliveryFor(notes("ttpost"))).toEqual({ key: "ttpost", label: "TTPost" });
    expect(deliveryFor(notes("courier"))).toEqual({ key: "courier", label: "Courier" });
    expect(deliveryFor(notes("digital"))).toEqual({ key: "digital", label: "Digital" });
  });

  it("reports an order with no usable snapshot as unrecorded", () => {
    expect(deliveryFor(null).key).toBe("unknown");
    expect(deliveryFor("Customer asked for it gift wrapped").key).toBe("unknown");
    expect(deliveryFor(notes("drone")).key).toBe("unknown");
    expect(deliveryFor(JSON.stringify({ payment: "cod" })).key).toBe("unknown");
  });

  it("labels an unrecorded method rather than defaulting to pickup", () => {
    expect(deliveryFor(null).label).toBe("Not recorded");
  });
});
