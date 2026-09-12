import { describe, it, expect } from "vitest";
import { customerName } from "./customer-name";

const base = { name: null, firstName: null, lastName: null, email: null };

describe("customerName", () => {
  it("prefers the full name", () => {
    expect(customerName({ ...base, name: "Sherry Nichols" })).toBe("Sherry Nichols");
  });

  it("falls back to first + last", () => {
    expect(customerName({ ...base, firstName: "Sherry", lastName: "Nichols" })).toBe(
      "Sherry Nichols",
    );
  });

  it("copes with only one of the two parts", () => {
    expect(customerName({ ...base, firstName: "Sherry" })).toBe("Sherry");
    expect(customerName({ ...base, lastName: "Nichols" })).toBe("Nichols");
  });

  it("falls back to the email when no name exists", () => {
    expect(customerName({ ...base, email: "berry@example.com" })).toBe(
      "berry@example.com",
    );
  });

  // The case the old chain got wrong: `[].join(" ")` is "", which is not
  // nullish, so `??` stopped there and the row rendered blank.
  it("never returns an empty string when every name field is null", () => {
    expect(customerName(base)).not.toBe("");
    expect(customerName(base)).toBe("Deleted account");
  });

  it("treats whitespace-only names as missing", () => {
    expect(customerName({ ...base, name: "   ", email: "berry@example.com" })).toBe(
      "berry@example.com",
    );
    expect(customerName({ ...base, firstName: " ", lastName: "  " })).toBe(
      "Deleted account",
    );
  });

  it("labels an anonymized user instead of showing its placeholder address", () => {
    expect(
      customerName({ ...base, email: "deleted-abc123@deleted.invalid" }),
    ).toBe("Deleted account");
  });

  it("still uses a real name on a deleted account that somehow kept one", () => {
    expect(
      customerName({
        ...base,
        name: "Sherry Nichols",
        email: "deleted-abc123@deleted.invalid",
      }),
    ).toBe("Sherry Nichols");
  });
});
