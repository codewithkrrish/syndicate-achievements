import { ogContentType, ogSize } from "@/components/MatchOgImage";
import { aboutAlt, renderAboutOgImage } from "@/components/PageOgImage";

export const alt = aboutAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return renderAboutOgImage();
}
