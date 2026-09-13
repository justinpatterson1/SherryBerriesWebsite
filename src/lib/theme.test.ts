import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_THEME,
  THEME_KEY,
  isTheme,
  otherTheme,
  readStoredTheme,
  storeTheme,
} from "./theme";

/** Minimal localStorage stand-in; tests run in node, with no DOM. */
function stubStorage(impl: Partial<Storage>) {
  vi.stubGlobal("window", { localStorage: impl as Storage });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isTheme", () => {
  it("accepts only the two real themes", () => {
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("light")).toBe(true);
    expect(isTheme("Dark")).toBe(false);
    expect(isTheme("")).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });
});

describe("otherTheme", () => {
  it("flips, and round-trips to itself", () => {
    expect(otherTheme("dark")).toBe("light");
    expect(otherTheme("light")).toBe("dark");
    expect(otherTheme(otherTheme("dark"))).toBe("dark");
  });
});

describe("readStoredTheme", () => {
  it("returns a stored preference", () => {
    stubStorage({ getItem: () => "light" });
    expect(readStoredTheme()).toBe("light");
  });

  it("returns null when nothing is stored", () => {
    stubStorage({ getItem: () => null });
    expect(readStoredTheme()).toBeNull();
  });

  // Guards against a stale or hand-edited value putting a junk string on
  // <html data-theme>, which would silently match no CSS at all.
  it("rejects a value that is not a theme", () => {
    stubStorage({ getItem: () => "sepia" });
    expect(readStoredTheme()).toBeNull();
  });

  // The case that matters: reading localStorage *throws* in a browser set to
  // block site data. A theme preference must never take the page down.
  it("returns null instead of throwing when storage is blocked", () => {
    stubStorage({
      getItem: () => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      },
    });
    expect(() => readStoredTheme()).not.toThrow();
    expect(readStoredTheme()).toBeNull();
  });
});

describe("storeTheme", () => {
  it("writes under the key the pre-paint script reads", () => {
    const setItem = vi.fn();
    stubStorage({ setItem });
    storeTheme("light");
    expect(setItem).toHaveBeenCalledWith(THEME_KEY, "light");
  });

  it("swallows a storage failure — the toggle still works for this page view", () => {
    stubStorage({
      setItem: () => {
        throw new DOMException("Quota exceeded.", "QuotaExceededError");
      },
    });
    expect(() => storeTheme("dark")).not.toThrow();
  });
});

describe("the contract with ThemeScript", () => {
  // The inline script in components/providers/theme-script.tsx is built from
  // these two constants. If either drifts, the script and the app would read
  // and write different things and the preference would appear not to persist.
  it("pins the storage key and the default", () => {
    expect(THEME_KEY).toBe("sb-theme");
    expect(DEFAULT_THEME).toBe("dark");
  });
});
