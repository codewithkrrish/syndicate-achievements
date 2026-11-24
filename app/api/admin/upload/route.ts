import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/validation";

// Screenshot upload for the admin panel.
// Layers of protection, in order:
// 1. Middleware rejects unauthenticated /api/admin/* calls with 401.
// 2. This handler verifies the session AGAIN server-side (defense in depth).
// 3. Type and size are validated before anything is stored.
// 4. Files land in Vercel Blob under a namespaced path with a random
//    suffix — the original filename is never trusted as a path.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let file: FormDataEntryValue | null = null;
  try {
    const form = await req.formData();
    file = form.get("file");
  } catch {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received" }, { status: 400 });
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Only JPG, PNG or WebP images are allowed" },
      { status: 415 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The file is empty" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Image is too large — maximum size is 8 MB" },
      { status: 413 },
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Uploads are not configured on this deployment (missing BLOB_READ_WRITE_TOKEN). Paste an image URL instead.",
      },
      { status: 501 },
    );
  }

  const safeBase = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .slice(0, 40) || "screenshot";

  try {
    const blob = await put(`achievements/${safeBase}.${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[upload] Blob put failed:", err);
    return NextResponse.json(
      { error: "Upload failed on the server. Try again, or paste an image URL." },
      { status: 502 },
    );
  }
}
