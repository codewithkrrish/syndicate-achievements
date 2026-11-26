import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Serves screenshots stored in the database (StoredImage) — the public
// counterpart to the admin upload route. Intentionally public: the public
// site displays these screenshots, and nothing sensitive lives in an image
// row. Ids are unique per upload and the bytes behind an id never change,
// so responses are cached as immutable for a year, and the ETag (id + byte
// length — a complete fingerprint here, since the bytes never change) lets
// repeat requests revalidate with a body-less 304.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let row: { mimeType: string; data: Uint8Array } | null = null;
  try {
    row = await prisma.storedImage.findUnique({ where: { id } });
  } catch (err) {
    console.error("[images] lookup failed:", err);
    return NextResponse.json({ error: "Image lookup failed" }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const etag = `"${id}-${row.data.length}"`;
  const cacheHeaders = {
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
  };

  const ifNoneMatch = req.headers.get("if-none-match");
  if (
    ifNoneMatch &&
    ifNoneMatch
      .split(",")
      .map((t) => t.trim().replace(/^W\//, ""))
      .includes(etag)
  ) {
    return new NextResponse(null, { status: 304, headers: cacheHeaders });
  }

  return new NextResponse(Buffer.from(row.data), {
    headers: {
      ...cacheHeaders,
      "Content-Type": row.mimeType,
    },
  });
}
