import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/validation";

// Screenshot upload for the admin panel.
// Layers of protection, in order:
// 1. Middleware rejects unauthenticated /api/admin/* calls with 401.
// 2. This handler verifies the session AGAIN server-side (defense in depth).
// 3. Type and size are validated before anything is stored.
// 4. The bytes are stored in the database itself (StoredImage) and served
//    back from /api/images/<id> — no host-side storage, no filenames, so
//    uploads work identically on any host that points at this database.
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

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const row = await prisma.storedImage.create({
      data: { mimeType: file.type, data: bytes },
    });
    return NextResponse.json({ url: `/api/images/${row.id}` });
  } catch (err) {
    console.error("[upload] StoredImage create failed:", err);
    return NextResponse.json(
      { error: "Upload failed on the server. Try again, or paste an image URL." },
      { status: 502 },
    );
  }
}
