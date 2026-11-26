import type { Metadata } from "next";
import MatchDetailPage, {
  matchMetadata,
} from "@/components/MatchDetailPage";

// Shareable standalone match page — see components/MatchDetailPage.tsx.
// Rendered dynamically on purpose: under ISR, a notFound() response for
// an unknown number gets cached and later served with a 200 status (a
// soft 404 — search engines would index the error page). Dynamic
// rendering returns a true 404 every time, and these share targets are
// low-traffic, so the per-visit database read costs nothing that
// matters. The collection pages above stay ISR-cached as before.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  return matchMetadata("ORDINARY", number);
}

export default async function OrdinaryRecordMatchPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  return <MatchDetailPage category="ORDINARY" numberParam={number} />;
}
