"use client";

import type { AchievementDTO } from "@/lib/types";
import { GUILD } from "@/lib/site";
import { recordLabel } from "@/lib/format";
import { useLoopPause } from "./useLoopPause";

/** The animated backdrop shared by every public page: two drifting red
 *  glows, clipped to the viewport by their fixed, overflow-hidden
 *  wrapper. The ember canvas is NOT part of the backdrop — it lives
 *  inside the home hero only, so its particles never drift over the
 *  record pages or the match detail. */
export function SiteBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <div className="bg-glow bg-glow-a anim-loop" />
        <div className="bg-glow bg-glow-b anim-loop" />
      </div>
    </>
  );
}

/** The site footer — guild links only, never personal links. About is
 *  an in-page view on the home page (onAbout) and a link back to it
 *  from the record pages. */
export default function SiteFooter({
  achievements,
  onAbout,
}: {
  achievements: AchievementDTO[];
  onAbout?: () => void;
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
          {onAbout ? (
            <button type="button" onClick={onAbout} className={linkCls}>
              About Us
            </button>
          ) : (
            <a href="/#about" className={linkCls}>
              About Us
            </a>
          )}
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
