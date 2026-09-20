import "server-only";
import { randomUUID } from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

// Accepted image content types → file extension used for the object key.
const CONTENT_TYPE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const ACCEPTED_IMAGE_TYPES = Object.keys(CONTENT_TYPE_EXT);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export type UploadCheck = { ok: true } | { ok: false; error: string };

// Pure validation — no I/O, safe to unit test in isolation.
export function validateImageUpload(contentType: string, size: number): UploadCheck {
  if (!CONTENT_TYPE_EXT[contentType]) {
    return { ok: false, error: "Unsupported file type. Use JPEG, PNG, WebP, or GIF." };
  }
  if (size <= 0) return { ok: false, error: "That file is empty." };
  if (size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Image is too large. The maximum size is 5 MB." };
  }
  return { ok: true };
}

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
  /**
   * Bucket for objects that must never be served over the public URL.
   *
   * `bucket` is attached to R2_PUBLIC_URL, so anything in it is readable by
   * anyone who knows the key — the only protection is that the key is random.
   * Set R2_PRIVATE_BUCKET_NAME to a bucket with NO public access and purchased
   * downloads move there, where a leaked key is not enough on its own.
   *
   * Falls back to `bucket` when unset, which keeps the app working but leaves
   * that obscurity-only posture in place.
   */
  privateBucket: string;
  /** Whether a genuinely private bucket is configured. */
  hasPrivateBucket: boolean;
};

function readConfig(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error(
      "R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
        "R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL in .env.",
    );
  }
  const privateBucket = process.env.R2_PRIVATE_BUCKET_NAME?.trim() || "";
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl,
    privateBucket: privateBucket || bucket,
    hasPrivateBucket: privateBucket !== "",
  };
}

// Whether R2 is wired up — lets the upload route fail fast with a friendly
// message (and the admin fall back to pasting a URL) instead of throwing.
export function isR2Configured(): boolean {
  try {
    readConfig();
    return true;
  } catch {
    return false;
  }
}

let cachedClient: S3Client | null = null;

function getClient(config: R2Config): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return cachedClient;
}

// Upload a validated image buffer to R2 and return its public URL. Callers must
// have run validateImageUpload first; contentType is trusted to be accepted.
export async function uploadProductImage(bytes: Buffer, contentType: string): Promise<string> {
  const config = readConfig();
  const ext = CONTENT_TYPE_EXT[contentType] ?? "bin";
  const key = `products/${randomUUID()}.${ext}`;

  await getClient(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      // Object keys are unique per upload, so the file is safe to cache forever.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const base = config.publicUrl.replace(/\/+$/, "");
  return `${base}/${key}`;
}

/**
 * The object key an image URL points at, or null if this bucket does not own it.
 *
 * Pure so it can be unit tested: the caller passes the configured public base.
 * A product's imageUrl may be a URL an admin pasted from anywhere, so anything
 * outside that base — and anything outside the `products/` prefix that uploads
 * write to — is refused rather than turned into a key. Matching loosely would
 * let a product row name any object in the bucket, receipts included, and have
 * a delete carried out on it.
 */
export function productImageKey(publicUrl: string, imageUrl: string): string | null {
  const base = publicUrl.replace(/\/+$/, "") + "/";
  if (!imageUrl.startsWith(base)) return null;
  // A query string or fragment is not part of the key.
  const key = decodeURIComponent(imageUrl.slice(base.length).split(/[?#]/)[0]);
  if (!key.startsWith("products/") || key.includes("..")) return null;
  return key;
}

/**
 * Delete a product's uploaded images from R2. Best effort by design.
 *
 * Called once the product row is already gone, so throwing here would report a
 * finished deletion as a failure and invite a retry of something that cannot
 * happen twice. A stranded object costs a fraction of a cent; failures are
 * logged with their keys so they can be swept up.
 *
 * Returns how many objects were removed, for the audit summary.
 */
export async function deleteProductImages(imageUrls: string[]): Promise<number> {
  if (!isR2Configured()) return 0;
  const config = readConfig();

  const keys = Array.from(
    new Set(
      imageUrls
        .map((url) => productImageKey(config.publicUrl, url))
        .filter((key): key is string => key !== null),
    ),
  );
  if (keys.length === 0) return 0;

  let deleted = 0;
  // DeleteObjects caps at 1000 keys per call. No product has that many images,
  // but chunking costs nothing and removes the cap as a thing to remember.
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    try {
      const out = await getClient(config).send(
        new DeleteObjectsCommand({
          Bucket: config.bucket,
          Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
        }),
      );
      deleted += chunk.length - (out.Errors?.length ?? 0);
      for (const err of out.Errors ?? []) {
        console.error("[r2] image delete failed for", err.Key, err.Code, err.Message);
      }
    } catch (e) {
      console.error("[r2] image delete failed for", chunk, e);
    }
  }
  return deleted;
}

// --- Payment receipts ---------------------------------------------------------
//
// Receipts are customer financial documents, so unlike product images they are
// NEVER handed out as a public URL. The object key is stored on the row and the
// bytes are streamed back through a route that checks the viewer owns the order
// or is an admin (see /api/orders/[orderNumber]/receipt/[receiptId]).
//
// The bucket does have a public base URL, and a receipt written under a
// guessable key would be readable by anyone who guessed it — hence the random
// filename from receiptKey(), and no helper here that builds a public URL.

/** Store a receipt at `key`. Returns nothing: there is no public URL for it. */
export async function uploadPaymentReceipt(
  key: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  const config = readConfig();
  await getClient(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      // Not cacheable by shared caches: the route in front of this enforces who
      // may read it, and a CDN copy would outlive that check.
      CacheControl: "private, no-store",
    }),
  );
}

/** Read a receipt's bytes back for an authorised viewer. */
export async function fetchPaymentReceipt(
  key: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const config = readConfig();
  try {
    const out = await getClient(config).send(
      new GetObjectCommand({ Bucket: config.bucket, Key: key }),
    );
    if (!out.Body) return null;
    const bytes = Buffer.from(await out.Body.transformToByteArray());
    return { bytes, contentType: out.ContentType ?? "application/octet-stream" };
  } catch (e) {
    console.error("[r2] receipt fetch failed for", key, e);
    return null;
  }
}

// --- Digital products ---------------------------------------------------------
//
// A purchased PDF is private for the same reason a receipt is: the bucket has a
// public base URL, so anything written under a guessable key is readable by
// anyone who guesses it. Digital assets therefore get a random key, no public
// URL helper, and are streamed only through the per-request authorized route at
// /api/orders/[orderNumber]/download/[itemId].
//
// Objects under `digital/` are never deleted. A buyer's download is permanent
// and outlives the product row; an orphaned object costs a fraction of a cent.
//
// IMPORTANT: the default bucket is attached to R2_PUBLIC_URL, so an object in
// it is readable by anyone who knows the key — verified, not assumed. For a
// file customers PAY for, a random key is thin protection: one leak (a log, a
// database dump, a screenshot) and it is public forever, with no way to
// revoke. Set R2_PRIVATE_BUCKET_NAME to a bucket with no public access and
// these objects go there instead.

export const MAX_DIGITAL_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Pure validation for a digital-product upload.
 *
 * The cap matches payment receipts (RECEIPT_MAX_BYTES), which already move PDFs
 * through a route handler in this app, rather than the larger limit a bucket
 * would allow: several hosts cap a serverless request body near 4.5 MB. A file
 * that outgrows this wants a direct-to-R2 upload, not a bigger limit here.
 */
export function validateDigitalUpload(contentType: string, size: number): UploadCheck {
  if (contentType !== "application/pdf") {
    return { ok: false, error: "Unsupported file type. Digital products must be a PDF." };
  }
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: "That file is empty." };
  if (size > MAX_DIGITAL_BYTES) {
    return { ok: false, error: "PDF is too large. The maximum size is 5 MB." };
  }
  return { ok: true };
}

/** Object key for a digital asset. `random` should be a UUID. */
export function digitalAssetKey(random: string): string {
  return `digital/${random}.pdf`;
}

/**
 * Whether a string is a key this app is willing to serve as a digital product.
 *
 * The key reaches the products API as a plain string from the admin's browser.
 * Unvalidated, it could be set to a `payments/...` receipt key, and the
 * download route would then stream another customer's bank receipt to whoever
 * bought the product. Same prefix-allowlist defence as productImageKey().
 */
export function isDigitalFileKey(key: string): boolean {
  if (key.includes("..")) return false;
  return /^digital\/[A-Za-z0-9_-]+\.pdf$/.test(key);
}

/** Store a digital asset. Returns the key — there is no public URL for it. */
export async function uploadDigitalAsset(bytes: Buffer, contentType: string): Promise<string> {
  const config = readConfig();
  if (!config.hasPrivateBucket) {
    console.warn(
      "[r2] R2_PRIVATE_BUCKET_NAME is not set, so this purchased download is going " +
        "into the bucket behind R2_PUBLIC_URL. Anyone who learns the key can read it.",
    );
  }
  const key = digitalAssetKey(randomUUID());
  await getClient(config).send(
    new PutObjectCommand({
      Bucket: config.privateBucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      // As with receipts: the route in front of this decides who may read it,
      // and a shared-cache copy would outlive that check.
      CacheControl: "private, no-store",
    }),
  );
  return key;
}

/** Read a digital asset's bytes back for an authorised buyer. */
export async function fetchDigitalAsset(
  key: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  // Belt and braces: never let a key that failed validation on write reach the
  // bucket on read either.
  if (!isDigitalFileKey(key)) return null;
  const config = readConfig();
  try {
    const out = await getClient(config).send(
      new GetObjectCommand({ Bucket: config.privateBucket, Key: key }),
    );
    if (!out.Body) return null;
    const bytes = Buffer.from(await out.Body.transformToByteArray());
    return { bytes, contentType: out.ContentType ?? "application/pdf" };
  } catch (e) {
    // A file uploaded before R2_PRIVATE_BUCKET_NAME was set still lives in the
    // public bucket, so fall back rather than break an existing purchase.
    if (config.hasPrivateBucket) {
      try {
        const out = await getClient(config).send(
          new GetObjectCommand({ Bucket: config.bucket, Key: key }),
        );
        if (out.Body) {
          const bytes = Buffer.from(await out.Body.transformToByteArray());
          return { bytes, contentType: out.ContentType ?? "application/pdf" };
        }
      } catch {
        // fall through to the error below
      }
    }
    console.error("[r2] digital asset fetch failed for", key, e);
    return null;
  }
}
