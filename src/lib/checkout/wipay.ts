// WiPay Plugins Payment Request API (v1.0.8) — server-only integration helper.
// Spec: docs/Payments API Documentation v1.0.8.pdf (also summarized in CLAUDE.md).
//
// Flow: we POST the order to WiPay, receive a hosted-page URL, and redirect the
// payor there. WiPay then web-redirects the browser back to our `response_url`
// with the transaction result as a querystring. The API Key is the account's
// secret and must never leave the server.

import crypto from "node:crypto";

export type WipayEnvironment = "live" | "sandbox";
export type WipayFeeStructure = "customer_pay" | "merchant_absorb" | "split";

export type WipayConfig = {
  environment: WipayEnvironment;
  accountNumber: string;
  apiKey: string;
  countryCode: string;
  currency: string;
  feeStructure: WipayFeeStructure;
  origin: string;
  endpoint: string;
};



// WiPay mandates these exact TEST-account credentials for sandbox transactions.
const SANDBOX_ACCOUNT_NUMBER = "1234567890";
const SANDBOX_API_KEY = "123";

const FEE_STRUCTURES: WipayFeeStructure[] = [
  "customer_pay",
  "merchant_absorb",
  "split",
];

/**
 * Resolve the WiPay configuration from environment variables.
 *
 * - `WIPAY_ENVIRONMENT` (`live` | `sandbox`, default `sandbox`) is the prod/test switch.
 * - In **sandbox** the TEST credentials are forced, so the flow works with zero config.
 * - In **live** `WIPAY_ACCOUNT_NUMBER` + `WIPAY_API_KEY` are required (throws otherwise).
 * - `WIPAY_COUNTRY_CODE` (default `TT`), `WIPAY_CURRENCY` (default `TTD`),
 *   `WIPAY_FEE_STRUCTURE` (default `merchant_absorb`), `WIPAY_ORIGIN` (default `SherryBerries`).
 */
export function getWipayConfig(): WipayConfig {
  const environment: WipayEnvironment =
    process.env.WIPAY_ENVIRONMENT === "live" ? "live" : "sandbox";
  const countryCode = (process.env.WIPAY_COUNTRY_CODE || "TT").toUpperCase();
  const currency = (process.env.WIPAY_CURRENCY || "TTD").toUpperCase();
  const feeStructure = FEE_STRUCTURES.includes(
    process.env.WIPAY_FEE_STRUCTURE as WipayFeeStructure,
  )
    ? (process.env.WIPAY_FEE_STRUCTURE as WipayFeeStructure)
    : "merchant_absorb";
  const origin = process.env.WIPAY_ORIGIN || "SherryBerries";

  let accountNumber: string;
  let apiKey: string;
  if (environment === "sandbox") {
    accountNumber = SANDBOX_ACCOUNT_NUMBER;
    apiKey = SANDBOX_API_KEY;
  } else {
    accountNumber = process.env.WIPAY_ACCOUNT_NUMBER ?? "";
    apiKey = process.env.WIPAY_API_KEY ?? "";
    if (!accountNumber || !apiKey) {
      throw new Error(
        "WiPay live mode requires WIPAY_ACCOUNT_NUMBER and WIPAY_API_KEY to be set.",
      );
    }
  }

  // Use the API URL native to the account's country for faster responses.
  const endpoint = `https://${countryCode.toLowerCase()}.wipayfinancial.com/plugins/payments/request`;

  return {
    environment,
    accountNumber,
    apiKey,
    countryCode,
    currency,
    feeStructure,
    origin,
    endpoint,
  };
}



export type HostedPageInput = {
  config: WipayConfig;
  orderId: string; // our orderNumber — echoed back as `order_id` in the response
  total: string; // already formatted to 2 decimal places
  responseUrl: string; // absolute URL WiPay redirects the browser back to
};

export type HostedPageResult =
  | { ok: true; url: string; transactionId: string | null }
  | { ok: false; error: string; status: number };

type WipayJsonResponse = {
  url?: string;
  message?: string;
  transaction_id?: string;
};

/**
 * Request a Secure Hosted Page URL from WiPay (JSON response mode).
 * Returns the URL to redirect the payor to, or a friendly error.
 */
export async function requestHostedPage(
  input: HostedPageInput,
): Promise<HostedPageResult> {
  const { config, orderId, total, responseUrl } = input;

  const params = new URLSearchParams();
  params.set("account_number", config.accountNumber);
  params.set("country_code", config.countryCode);
  params.set("currency", config.currency);
  params.set("environment", config.environment);
  params.set("fee_structure", config.feeStructure);
  params.set("method", "credit_card");
  params.set("order_id", orderId);
  params.set("origin", config.origin);
  params.set("response_url", responseUrl);
  params.set("data", '{"a":"b"}');
  params.set("total", total);
  // Card details are entered on WiPay's hosted page; no AVS pre-fill from us.
  params.set("avs", "0");

  let res: Response;
  try {
    res = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
  } catch {
    return { ok: false, error: "Could not reach the payment gateway.", status: 502 };
  }

  let data: WipayJsonResponse | null = null;
  try {
    data = (await res.json()) as WipayJsonResponse;
  } catch {
    data = null;
  }

  if (!res.ok || !data?.url) {
    return {
      ok: false,
      error: data?.message || "The payment gateway rejected the request.",
      status: res.status >= 400 ? res.status : 502,
    };
  }

  return { ok: true, url: data.url, transactionId: data.transaction_id ?? null };
}

/**
 * Verify a successful transaction's `hash` response parameter.
 *
 * WiPay computes it as md5(transaction_id + original_total + apiKey) with no
 * separators, where `original_total` is the `total` we sent in the request.
 * A mismatch means the response can't be trusted — never mark such an order paid.
 */
export function verifyWipayHash(args: {
  config: WipayConfig;
  transactionId: string;
  total: string; // the exact `total` string sent in the original request
  hash: string;
}): boolean {
  const { config, transactionId, total, hash } = args;
  if (!transactionId || !hash) return false;
  const computed = crypto
    .createHash("md5")
    .update(`${transactionId}${total}${config.apiKey}`)
    .digest("hex");
  return computed.toLowerCase() === hash.toLowerCase();
}
