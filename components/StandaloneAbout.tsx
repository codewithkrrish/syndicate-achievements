"use client";

import { useRouter } from "next/navigation";
import type { AchievementDTO } from "@/lib/types";
import SiteHeader from "./SiteHeader";
import SiteFooter, { SiteBackdrop } from "./SiteFooter";
import AboutView from "./AboutView";

// Chrome for the standalone About page (/about): the same header,
// footer and About view the home page used to swap in under a #about
// hash — now a page of its own, so its URL is clean and shareable
// like every other page on the site. Back returns home.
export default function StandaloneAbout({
  achievements,
}: {
  achievements: AchievementDTO[];
}) {
  const router = useRouter();

  return (
    <div className="relative min-h-dvh touch-pan-y">
      <SiteBackdrop />
      <SiteHeader active="about" />
      <main className="relative z-10 scroll-mt-20">
        <div className="view-enter mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
          <AboutView onBack={() => router.push("/")} />
        </div>
      </main>
      <SiteFooter achievements={achievements} />
    </div>
  );
}
