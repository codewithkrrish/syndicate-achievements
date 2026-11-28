import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAchievementByCategoryNumber,
  getAchievements,
} from "@/lib/data";
import { detailPath, formatDate, recordLabel } from "@/lib/format";
import { OG_IMAGE_ORIGIN } from "@/lib/site";
import StandaloneDetail from "./StandaloneDetail";

// Shared server logic for the two shareable match routes
// (/creators-record/[number], /ordinary-record/[number]). The route
// files themselves are thin wrappers that only fix the category.

type Category = "CREATOR" | "ORDINARY";

/** "001" -> 1; anything else (letters, 0, negatives) -> null -> 404. */
export function parseMatchNumber(param: string): number | null {
  if (!/^\d+$/.test(param)) return null;
  const n = Number.parseInt(param, 10);
  return n >= 1 ? n : null;
}

export async function matchMetadata(
  category: Category,
  numberParam: string,
): Promise<Metadata> {
  const n = parseMatchNumber(numberParam);
  const a = n ? await getAchievementByCategoryNumber(category, n) : null;
  if (!a) {
    // 404 from HERE, not only from the page body: metadata resolves
    // before the response stream starts, so the status stays a real
    // 404. The same check in the page component below renders the
    // not-found UI but — with the root loading.tsx streaming a shell
    // first — its status degrades to a soft-404 200.
    notFound();
  }
  const label = recordLabel(a);
  const title = `SYNDICATE vs ${a.opponent} — ${label}`;
  const description = `${label}: SYNDICATE ${a.result === "WIN" ? "beat" : "lost to"} ${a.opponent} ${a.finalScore} — ${a.format}, ${a.mode} on ${a.map}, ${formatDate(a.date, "long")}. ${a.cardLine}`;
  const path = detailPath(a);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "SYNDICATE Achievements",
      title: `${title} · SYNDICATE Achievements`,
      description,
      url: path,
      // Absolute image URL on the serving origin — see OG_IMAGE_ORIGIN.
      images: [
        {
          url: `${OG_IMAGE_ORIGIN}${path}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · SYNDICATE Achievements`,
      description,
      images: [`${OG_IMAGE_ORIGIN}${path}/twitter-image`],
    },
  };
}

export default async function MatchDetailPage({
  category,
  numberParam,
}: {
  category: Category;
  numberParam: string;
}) {
  const n = parseMatchNumber(numberParam);
  if (n === null) notFound();
  const [a, achievements] = await Promise.all([
    getAchievementByCategoryNumber(category, n),
    getAchievements(),
  ]);
  if (!a) notFound();

  // Structured data: the match as a completed sports event, so search
  // engines can present it as a result with teams and date attached.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `SYNDICATE vs ${a.opponent}`,
    startDate: a.date,
    sport: "Free Fire (Esports)",
    eventStatus: "https://schema.org/EventCompleted",
    description: a.cardLine,
    url: `https://syndicate.run.place${detailPath(a)}`,
    homeTeam: { "@type": "SportsTeam", name: "SYNDICATE" },
    awayTeam: { "@type": "SportsTeam", name: a.opponent },
    competitor: [
      { "@type": "SportsTeam", name: "SYNDICATE" },
      { "@type": "SportsTeam", name: a.opponent },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StandaloneDetail
        achievement={a}
        achievements={achievements}
        category={category}
      />
    </>
  );
}
