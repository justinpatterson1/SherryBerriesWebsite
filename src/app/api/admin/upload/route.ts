import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { isR2Configured, uploadProductImage, validateImageUpload } from "@/lib/storage/r2";

// Accepts a multipart form with a single `file` field, stores it in R2, and
// returns { url } — the public image URL the product form saves as usual.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Image uploads aren't configured. Paste an image URL instead." },
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

  const check = validateImageUpload(file.type, file.size);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadProductImage(bytes, file.type);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("[admin/upload] R2 upload failed:", e);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
