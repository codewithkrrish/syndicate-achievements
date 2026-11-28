"use client";

import { useRouter } from "next/navigation";
import type { AchievementDTO } from "@/lib/types";
import SiteHeader from "./SiteHeader";
import SiteFooter, { SiteBackdrop } from "./SiteFooter";
import MatchDetail from "./MatchDetail";

// Chrome for the shareable standalone match page
// (/creators-record/001, /ordinary-record/001): the same header, footer
// and detail view the in-page flow shows, with Back returning to the
// record's own collection page. This route exists so a match link can
// be shared and indexed on its own — the in-page hash flow on the home
// and collection pages is untouched.
export default function StandaloneDetail({
  achievement,
  achievements,
  category,
}: {
  achievement: AchievementDTO;
  achievements: AchievementDTO[];
  category: "CREATOR" | "ORDINARY";
}) {
  const router = useRouter();
  const base = category === "CREATOR" ? "/creators-record" : "/ordinary-record";

  return (
    <div className="relative min-h-dvh touch-pan-y">
      <SiteBackdrop />
      <SiteHeader active={category === "CREATOR" ? "creators" : "ordinary"} />
      <main className="relative z-10 scroll-mt-20">
        <div className="view-enter mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
          <MatchDetail
            achievement={achievement}
            onBack={() => router.push(base)}
          />
        </div>
      </main>
      <SiteFooter achievements={achievements} />
    </div>
  );
}
