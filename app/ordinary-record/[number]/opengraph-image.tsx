import {
  ogAlt,
  ogContentType,
  ogSize,
  renderMatchOgImage,
} from "@/components/MatchOgImage";
import { parseMatchNumber } from "@/components/MatchDetailPage";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const n = parseMatchNumber(number);
  return renderMatchOgImage("ORDINARY", n ?? 0);
}
