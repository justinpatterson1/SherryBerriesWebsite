import { NextResponse } from "next/server";
import { getSearchIndex } from "@/lib/queries/search";

// Public catalog snapshot for the client-side search overlay (same data already
// exposed on the listing pages). Fetched once, lazily, on first overlay open.
export async function GET() {
  const index = await getSearchIndex();
  return NextResponse.json(index);
}
