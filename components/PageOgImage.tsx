import { ImageResponse } from "next/og";
import { getAchievements } from "@/lib/data";
import { ogSize } from "@/components/MatchOgImage";

// Per-page share images (Open Graph / Twitter) for the archive's main
// pages — home and the two record indexes. Same design system as the
// per-match cards (components/MatchOgImage): near-black ground, red top
// bar, the same ink/brand colours, and every number read live from the
// records so a preview can never drift from the archive it shares.

export const homeAlt = "SYNDICATE Achievements — the official match archive";
export const creatorsAlt = "Creators Record — SYNDICATE Achievements";
export const ordinaryAlt = "Ordinary Record — SYNDICATE Achievements";

const BG = "#0b0b0d";
const INK = "#f2f1ec";
const BRAND = "#e5322d";
const BRAND_SOFT = "#ff8a86";
const MUTED = "rgba(242,241,236,0.62)";
const FAINT = "rgba(242,241,236,0.45)";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: BG,
      }}
    >
      <div style={{ height: 12, background: BRAND, display: "flex" }} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "46px 64px 50px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Eyebrow({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 25,
        letterSpacing: 4,
        color: BRAND_SOFT,
        fontWeight: 600,
      }}
    >
      {text}
    </div>
  );
}

function Footer({ left }: { left: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
      }}
    >
      <div style={{ fontSize: 24, color: MUTED, display: "flex" }}>{left}</div>
      <div style={{ fontSize: 24, color: FAINT, display: "flex" }}>
        syndicate.run.place
      </div>
    </div>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          fontSize: 68,
          fontWeight: 700,
          lineHeight: 1,
          color: accent ? BRAND : INK,
          display: "flex",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 21,
          letterSpacing: 3,
          color: MUTED,
          marginTop: 10,
          display: "flex",
        }}
      >
        {label}
      </div>
    </div>
  );
}

interface RecordStats {
  total: number;
  wins: number;
  winRate: number;
  latestLine: string | null;
}

function statsFor(
  all: Awaited<ReturnType<typeof getAchievements>>,
  category?: "CREATOR" | "ORDINARY",
): RecordStats {
  const rows = category ? all.filter((a) => a.category === category) : all;
  const total = rows.length;
  const wins = rows.filter((a) => a.result === "WIN").length;
  const latest = [...rows].sort((x, y) => y.date.localeCompare(x.date))[0];
  return {
    total,
    wins,
    winRate: total ? Math.round((wins / total) * 100) : 0,
    latestLine: latest
      ? `Latest — SYNDICATE ${latest.result === "WIN" ? "beat" : "lost to"} ${latest.opponent} ${latest.finalScore}`
      : null,
  };
}

/** Home: the wordmark over the archive's live headline numbers. */
export async function renderHomeOgImage(): Promise<ImageResponse> {
  const stats = statsFor(await getAchievements());
  return new ImageResponse(
    (
      <Frame>
        <Eyebrow text="OFFICIAL MATCH ARCHIVE · FREE FIRE GUILD" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 118,
              fontWeight: 700,
              color: INK,
              lineHeight: 1,
              letterSpacing: 2,
              display: "flex",
            }}
          >
            SYNDICATE
          </div>
          <div
            style={{
              fontSize: 62,
              fontWeight: 700,
              color: BRAND,
              letterSpacing: 12,
              marginTop: 14,
              display: "flex",
            }}
          >
            ACHIEVEMENTS
          </div>
        </div>
        {stats.total > 0 ? (
          <div style={{ display: "flex", gap: 72 }}>
            <Stat value={String(stats.total)} label="MATCHES PLAYED" />
            <Stat value={String(stats.wins)} label="WINS" accent />
            <Stat value={`${stats.winRate}%`} label="WIN RATE" />
          </div>
        ) : (
          <div style={{ fontSize: 26, color: MUTED, display: "flex" }}>
            Every guild-vs-guild match on record
          </div>
        )}
        <Footer left="Every match on record — scores and screenshots for every game" />
      </Frame>
    ),
    ogSize,
  );
}

/** One record index (Creators / Ordinary): its name, its scope, its numbers. */
export async function renderCategoryOgImage(
  category: "CREATOR" | "ORDINARY",
): Promise<ImageResponse> {
  const stats = statsFor(await getAchievements(), category);
  const isCreator = category === "CREATOR";
  const scope = isCreator
    ? "Filed against creator-led teams — YouTube and Instagram creators"
    : "Filed against regular in-game guilds";
  return new ImageResponse(
    (
      <Frame>
        <Eyebrow text="SYNDICATE ACHIEVEMENTS" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 104,
              fontWeight: 700,
              color: INK,
              lineHeight: 1,
              display: "flex",
            }}
          >
            {isCreator ? "CREATORS" : "ORDINARY"}
          </div>
          <div
            style={{
              fontSize: 104,
              fontWeight: 700,
              color: BRAND,
              lineHeight: 1,
              marginTop: 6,
              display: "flex",
            }}
          >
            RECORD
          </div>
          <div style={{ fontSize: 27, color: MUTED, marginTop: 24, display: "flex" }}>
            {scope}
          </div>
        </div>
        <Footer
          left={
            stats.total > 0
              ? `${stats.total} ${stats.total === 1 ? "match" : "matches"} · ${stats.wins} ${stats.wins === 1 ? "win" : "wins"}${stats.latestLine ? ` · ${stats.latestLine}` : ""}`
              : "No matches filed yet"
          }
        />
      </Frame>
    ),
    ogSize,
  );
}
