import type { Metadata } from "next";
import { getRecordIndex } from "@/lib/data";
import { matchNumberPadded } from "@/lib/format";
import MatchDetailPage, {
  matchMetadata,
} from "@/components/MatchDetailPage";

// Shareable standalone match page — see components/MatchDetailPage.tsx.
// Same ISR rhythm as the collection pages; admin edits revalidate it.
export const revalidate = 60;

export async function generateStaticParams() {
  const index = await getRecordIndex();
  return index
    .filter((r) => r.category === "ORDINARY")
    .map((r) => ({ number: matchNumberPadded(r.matchNumber) }));
}

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
