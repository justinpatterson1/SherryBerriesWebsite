import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { isR2Configured, uploadDigitalAsset, validateDigitalUpload } from "@/lib/storage/r2";

// Accepts a multipart form with a single `file` field (a PDF), stores it
// privately in R2, and returns { key } — the object key the product form saves
// as digitalFileKey.
//
// Unlike /api/admin/upload this returns a KEY, never a URL: the file is sold,
// so the only way to read it is the authorised per-request download route. It
// also has no "paste a URL instead" fallback, for the same reason.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "File storage isn't configured, so digital products can't be uploaded." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart file upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was provided." }, { status: 400 });
  }

  const check = validateDigitalUpload(file.type, file.size);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const key = await uploadDigitalAsset(bytes, file.type);
    return NextResponse.json({ ok: true, key, fileName: file.name, size: file.size });
  } catch (e) {
    console.error("[admin/upload/digital] R2 upload failed:", e);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
