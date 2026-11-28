"use client";

import Link from "next/link";
import type { AchievementDTO } from "@/lib/types";
import { GUILD } from "@/lib/site";
import { recordLabel } from "@/lib/format";
import { useLoopPause } from "./useLoopPause";
import EmberCanvas from "./EmberCanvas";

/** The animated backdrop shared by every public page: two drifting red
 *  glows plus the rising-ember canvas, all inside one fixed,
 *  overflow-hidden wrapper clipped to the viewport — so no part of
 *  the decoration can ever widen the page or show past the screen
 *  edges, on any page. */
export function SiteBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <div className="bg-glow bg-glow-a anim-loop" />
        <div className="bg-glow bg-glow-b anim-loop" />
        <EmberCanvas />
      </div>
    </>
  );
}

/** The site footer — guild links only, never personal links. About is
 *  its own page (/about), linked from every footer like any other
 *  page on the site. */
export default function SiteFooter({
  achievements,
}: {
  achievements: AchievementDTO[];
}) {
  const footerRef = useLoopPause<HTMLElement>();
  const latest = achievements[0];

  const linkCls =
    "link-line font-condensed text-sm font-semibold uppercase tracking-wider text-ink/70 transition hover:text-brand sm:text-base";

  return (
    <footer
      ref={footerRef}
      className="footer-flow relative z-10 border-t border-line bg-[#08080a]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10 md:flex-row md:items-center">
        <div>
          <p className="font-condensed text-xl font-bold uppercase leading-none sm:text-2xl">
            SYNDICATE{" "}
            <span className="title-shine title-shine-red anim-loop">
              Achievements
            </span>
          </p>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink/50 sm:text-sm">
            The squad&rsquo;s official match archive.
            {latest
              ? ` ${recordLabel(latest)} on file — ${achievements.length} ${
                  achievements.length === 1 ? "record" : "records"
                } filed.`
              : " The first filed win is pending."}
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-x-7 gap-y-3 md:ml-auto"
          aria-label="Guild links"
        >
          <a
            href={GUILD.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            {GUILD.instagramHandle}
          </a>
          <a
            href={GUILD.discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            Discord
          </a>
          <Link href="/about" className={linkCls}>
            About Us
          </Link>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={linkCls}
          >
            Back to top
          </button>
        </nav>
      </div>
    </footer>
  );
}
