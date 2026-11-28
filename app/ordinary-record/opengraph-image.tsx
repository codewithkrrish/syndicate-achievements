import { ogContentType, ogSize } from "@/components/MatchOgImage";
import { ordinaryAlt, renderCategoryOgImage } from "@/components/PageOgImage";

// Rendered on demand (like the per-match images) so the numbers on
// the card always match the live archive, not the last build.
export const dynamic = "force-dynamic";

export const alt = ordinaryAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return renderCategoryOgImage("ORDINARY");
}
