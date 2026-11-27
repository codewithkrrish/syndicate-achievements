"use client";

import { CASTERS, GUILD, OWNERS } from "@/lib/site";
import Reveal from "./Reveal";
import { useLoopPause } from "./useLoopPause";

interface Props {
  onBack: () => void;
}

// About Us: guild facts, the five owners, the three official casters with
// their channels, and the official Discord/Instagram. All guild links —
// never any personal links.
export default function AboutView({ onBack }: Props) {
  // Loop pausing for the founder shimmer (owners row) while that block
  // is off-screen.
  const ownersRef = useLoopPause<HTMLDivElement>();

  return (
    <section aria-label="About the guild">
      <button
        type="button"
        onClick={onBack}
        className="anim-fade-rise font-condensed text-sm font-semibold uppercase tracking-wider text-ink/60 transition hover:text-brand sm:text-base"
      >
        ← Back to the record
      </button>

      <div
        className="anim-fade-rise mt-4 flex items-baseline gap-3 sm:mt-6 sm:gap-4"
        style={{ "--anim-delay": "60ms" } as React.CSSProperties}
      >
        <span className="font-mono text-xs text-brand sm:text-sm">03</span>
        <h2 className="font-condensed text-[1.7rem] font-bold uppercase leading-none sm:text-5xl">
          About Us
        </h2>
      </div>
      <p
        className="anim-fade-rise mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/65 sm:mt-4 sm:text-base"
        style={{ "--anim-delay": "120ms" } as React.CSSProperties}
      >
        The guild behind the record — who runs SYNDICATE, who casts its
        matches, and where the community lives.
      </p>

      {/* Guild facts */}
      <dl
        className="anim-fade-rise mt-6 grid grid-cols-2 border border-line bg-raise sm:mt-8 lg:grid-cols-4"
        style={{ "--anim-delay": "170ms" } as React.CSSProperties}
      >
        <Fact label="Guild" value={`${GUILD.name} (${GUILD.tag})`} />
        <Fact label="Game" value={GUILD.game} />
        <Fact label="Focus" value={GUILD.focus} />
        <Fact label="Community" value={GUILD.community} />
      </dl>

      {/* Owners — heading reveals as one block, then the five cards
          stagger in one by one (same single row on sm+, stacked cards
          on phones; the Reveal wrappers are the flex items now). */}
      <Reveal className="mt-9 sm:mt-12">
        <h3 className="font-condensed text-2xl font-bold uppercase sm:text-3xl">
          Guild Owners
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60 sm:text-[15px]">
          SYNDICATE is run by five owners. They lead the guild, pick the squad
          for guild-vs-guild matches, and file every win into this archive.
        </p>
      </Reveal>
      <div
        ref={ownersRef}
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:gap-4"
      >
        {OWNERS.map((o, i) => (
          <Reveal key={o.name} delay={i * 90} className="min-w-0 flex-1">
            <article className="group sheen-host relative h-full overflow-hidden border border-line bg-raise p-4 sm:p-5">
              <span className="flex h-10 w-10 items-center justify-center bg-brand font-condensed text-lg font-bold text-white sm:h-11 sm:w-11 sm:text-xl transition-shadow duration-300 group-hover:shadow-[0_0_18px_rgba(229,50,45,0.5)]">
                {o.name.charAt(0)}
              </span>
              <div className="mt-4 flex flex-col items-start gap-1.5">
                {o.founder && (
                  <span className="founder-shine anim-loop border border-gold/45 bg-gold/10 px-1 py-px text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                    Syn Founder
                  </span>
                )}
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
                  Guild Owner
                </span>
              </div>
              <h4 className="mt-1 break-words font-condensed text-xl font-bold uppercase leading-tight sm:text-2xl">
                {o.name}
              </h4>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/60 sm:text-sm">{o.note}</p>
              <span aria-hidden className="card-sheen" />
            </article>
          </Reveal>
        ))}
      </div>

      {/* Casters — heading as one block, cards stagger in. */}
      <Reveal className="mt-9 sm:mt-12">
        <h3 className="font-condensed text-2xl font-bold uppercase sm:text-3xl">
          Official Casters
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60 sm:text-[15px]">
          Three content creators cast SYNDICATE&rsquo;s matches on behalf of the
          guild — live commentary, match coverage and the guild&rsquo;s matches
          as they happen.
        </p>
      </Reveal>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {CASTERS.map((c, i) => (
          <Reveal key={c.name} delay={i * 90}>
            <article className="flex h-full flex-col border border-line bg-raise p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
                Official Caster · Content Creator
              </p>
              <h4 className="mt-1.5 font-condensed text-xl font-bold uppercase leading-tight sm:text-2xl">
                {c.name}
              </h4>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink/60 sm:text-sm">{c.note}</p>
              <a
                href={c.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-line mt-4 self-start font-condensed text-sm font-semibold uppercase tracking-wider text-ink/75 transition hover:text-brand sm:text-base"
              >
                {c.handle} on YouTube →
              </a>
            </article>
          </Reveal>
        ))}
      </div>

      {/* Join — heading as one block, the two rows slide in from the
          left, staggered. */}
      <Reveal className="mt-9 sm:mt-12">
        <h3 className="font-condensed text-2xl font-bold uppercase sm:text-3xl">
          Join the Guild
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60 sm:text-[15px]">
          Guild matches are organised in the guild&rsquo;s official Discord —
          announcements, match scheduling and every new achievement land there
          first. Follow the guild on Instagram for posters, highlights and
          updates between matches.
        </p>
      </Reveal>
      <div className="mt-6 space-y-3">
        <Reveal direction="left">
          <div className="flex flex-wrap items-center gap-3 border border-line bg-card px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
            <p className="min-w-0 flex-1">
              <span className="block font-condensed text-lg font-semibold uppercase sm:text-xl">
                Official Discord
              </span>
              <span className="block truncate font-mono text-xs text-ink/45">
                discord.gg/VThSqVEUPV
              </span>
            </p>
            <a
              href={GUILD.discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center bg-brand px-4 font-condensed text-sm font-bold uppercase tracking-wider text-white transition hover:bg-branddeep sm:px-5 sm:text-base"
            >
              Join the server →
            </a>
          </div>
        </Reveal>
        <Reveal direction="left" delay={110}>
          <div className="flex flex-wrap items-center gap-3 border border-line bg-card px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
            <p className="min-w-0 flex-1">
              <span className="block font-condensed text-lg font-semibold uppercase sm:text-xl">
                Official Instagram
              </span>
              <span className="block truncate font-mono text-xs text-ink/45">
                {GUILD.instagramHandle}
              </span>
            </p>
            <a
              href={GUILD.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center border border-linestrong px-4 font-condensed text-sm font-bold uppercase tracking-wider text-ink transition hover:border-brand hover:text-brand sm:px-5 sm:text-base"
            >
              Follow on Instagram →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line px-4 py-3.5 [&:not(:last-child)]:border-r sm:px-5 sm:py-4 max-lg:[&:nth-child(2)]:border-r-0 max-lg:[&:nth-child(-n+2)]:border-b">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/40">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-ink/95 sm:text-[15px]">{value}</dd>
    </div>
  );
}
