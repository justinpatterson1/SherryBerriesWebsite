import "server-only";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

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
    return { ok: false, error: "Image is too large — the maximum size is 5 MB." };
  }
  return { ok: true };
}

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
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
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
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
