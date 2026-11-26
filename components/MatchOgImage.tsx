import { ImageResponse } from "next/og";
import { getAchievementByCategoryNumber } from "@/lib/data";
import { formatDate, recordLabel } from "@/lib/format";

// Per-match share image (Open Graph / Twitter), rendered from the record
// itself: red/black brand, SYNDICATE vs the opponent, the final score,
// the record label and the match facts. Every string comes from the
// database row, so the card can never drift from the record it shares.
// Used by the opengraph-image / twitter-image routes under both
// /creators-record/[number] and /ordinary-record/[number].

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogAlt = "SYNDICATE match record — final score and details";

const BG = "#0b0b0d";
const INK = "#f2f1ec";
const BRAND = "#e5322d";
const BRAND_SOFT = "#ff8a86";
const MUTED = "rgba(242,241,236,0.62)";

export async function renderMatchOgImage(
  category: "CREATOR" | "ORDINARY",
  matchNumber: number,
): Promise<ImageResponse> {
  const a = await getAchievementByCategoryNumber(category, matchNumber);

  if (!a) {
    // Unknown match: a plain brand card. (The page itself 404s; this
    // only answers crawlers that fetch the image URL directly.)
    return new ImageResponse(
      (
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
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 92,
                fontWeight: 700,
                color: INK,
                letterSpacing: 2,
                display: "flex",
              }}
            >
              SYNDICATE
            </div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 700,
                color: BRAND,
                letterSpacing: 10,
                marginTop: 10,
                display: "flex",
              }}
            >
              ACHIEVEMENTS
            </div>
            <div style={{ fontSize: 26, color: MUTED, marginTop: 26, display: "flex" }}>
              The official match archive
            </div>
          </div>
        </div>
      ),
      ogSize,
    );
  }

  const isWin = a.result === "WIN";
  const opponent = a.opponent.toUpperCase();
  const opponentSize = opponent.length > 16 ? 58 : opponent.length > 10 ? 72 : 84;

  return new ImageResponse(
    (
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
          {/* Eyebrow: which record, which match */}
          <div
            style={{
              display: "flex",
              fontSize: 25,
              letterSpacing: 4,
              color: BRAND_SOFT,
              fontWeight: 600,
            }}
          >
            {`${recordLabel(a).toUpperCase()} · SYNDICATE ACHIEVEMENTS`}
          </div>

          {/* Teams + score */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 84,
                fontWeight: 700,
                color: INK,
                lineHeight: 1,
                display: "flex",
              }}
            >
              SYNDICATE
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: 14,
              }}
            >
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  color: BRAND,
                  letterSpacing: 3,
                  marginRight: 22,
                  display: "flex",
                }}
              >
                VS
              </div>
              <div
                style={{
                  fontSize: opponentSize,
                  fontWeight: 700,
                  color: INK,
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                {opponent}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: 34,
              }}
            >
              <div
                style={{
                  fontSize: 118,
                  fontWeight: 700,
                  color: isWin ? BRAND : INK,
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                {a.finalScore}
              </div>
              <div
                style={{
                  marginLeft: 30,
                  background: isWin ? BRAND : "#52525b",
                  color: "#ffffff",
                  fontSize: 30,
                  fontWeight: 700,
                  letterSpacing: 3,
                  padding: "10px 20px",
                  display: "flex",
                }}
              >
                {a.result}
              </div>
            </div>
          </div>

          {/* Facts row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div style={{ fontSize: 26, color: MUTED, display: "flex" }}>
              {`${formatDate(a.date, "long")} · ${a.mode} · ${a.map} · ${a.format}`}
            </div>
            <div style={{ fontSize: 26, color: MUTED, display: "flex" }}>
              syndicate.run.place
            </div>
          </div>
        </div>
      </div>
    ),
    ogSize,
  );
}
