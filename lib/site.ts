// Static guild content for the About Us view. Achievements come from the
// database; the guild's identity (owners, casters, official links) changes
// rarely and is maintained here, in one place.

export const GUILD = {
  name: "SYNDICATE",
  tag: "SYN",
  game: "Free Fire",
  focus: "Guild vs Guild matches",
  community: "~400 members on Discord",
  discordUrl: "https://discord.gg/VThSqVEUPV",
  instagramUrl: "https://www.instagram.com/syndicate.4ever",
  instagramHandle: "@syndicate.4ever",
};

export interface Owner {
  name: string;
  note: string;
  /** Founders also carry the golden "Syn Founder" badge on the About view. */
  founder?: boolean;
}

export const OWNERS: Owner[] = [
  {
    name: "Krrish SYN",
    note: "Owner of SYNDICATE and of the guild's official Discord community.",
    founder: true,
  },
  {
    name: "Supreme SYN",
    note: "Owner of SYNDICATE and of the guild's official Discord community.",
    founder: true,
  },
  {
    name: "Hack SYN",
    note: "Owner of SYNDICATE and of the guild's official Discord community.",
  },
  {
    name: "Vaughan SYN",
    note: "Owner of SYNDICATE and of the guild's official Discord community.",
  },
  {
    name: "Ehty Is Live",
    note: "Owner of SYNDICATE and of the guild's official Discord community.",
  },
];

export interface Caster {
  name: string;
  handle: string;
  channelUrl: string;
  note: string;
}

export const CASTERS: Caster[] = [
  {
    name: "Ehty is Live",
    handle: "@EhtyisLive",
    channelUrl: "https://www.youtube.com/@EhtyisLive",
    note: "Casts SYNDICATE guild matches live on YouTube, on behalf of the guild.",
  },
  {
    name: "Vaughan Is Live",
    handle: "@Vaughan_FF",
    channelUrl: "https://www.youtube.com/@Vaughan_FF",
    note: "Casts SYNDICATE guild matches live on YouTube, on behalf of the guild.",
  },
  {
    name: "Kayuu Live",
    handle: "@kayuuu_live",
    channelUrl: "https://www.youtube.com/@kayuuu_live",
    note: "Casts SYNDICATE guild matches live on YouTube, on behalf of the guild.",
  },
];

// The standard announcement for every new win. Bracketed parts are replaced
// per match; the guild's own links are pre-filled and never change.
export const ACHIEVEMENT_TEMPLATE = `NEW ACHIEVEMENT FILED — MATCH #[MATCH NO]

SYNDICATE vs [OPPONENT]
Result: [WIN / LOSS] — [FINAL SCORE]
Format: [FORMAT]
Date: [DATE]
Mode: [MODE]
Map: [MAP]
Games: [GAME 1 SCORE] · [GAME 2 SCORE] · [GAME 3 SCORE]
Opponent channel: [OPPONENT CHANNEL LINK]

Filed in the official record — SYNDICATE Achievements
Discord: ${GUILD.discordUrl}
Instagram: ${GUILD.instagramUrl}`;

/** The fixed card-line pattern, shown as a hint in the admin form. */
export const CARD_LINE_PATTERN = "Went the distance — SYNDICATE beat [OPPONENT].";

/**
 * Ready-made card lines for the admin form's style selector, grouped
 * by how the series went. The [OPPONENT] placeholder is replaced with
 * the opponent's name when a style is picked, so the saved line always
 * names the real opponent — the same fill-in the form has always done
 * for the default pattern.
 */
export const CARD_LINE_PRESETS: {
  group: string;
  label: string;
  pattern: string;
}[] = [
  { group: "Clean sweep", label: "Clean sweep", pattern: "Clean sweep — SYNDICATE beat [OPPONENT]." },
  { group: "Clean sweep", label: "Straight sets", pattern: "Straight sets — SYNDICATE beat [OPPONENT]." },
  { group: "Clean sweep", label: "Never in doubt", pattern: "Never in doubt — SYNDICATE beat [OPPONENT]." },
  { group: "Clean sweep", label: "Flawless finish", pattern: "Flawless finish — SYNDICATE beat [OPPONENT]." },
  { group: "Went the distance", label: "Went the distance", pattern: "Went the distance — SYNDICATE beat [OPPONENT]." },
  { group: "Went the distance", label: "Down to the wire", pattern: "Down to the wire — SYNDICATE beat [OPPONENT]." },
  { group: "Went the distance", label: "The hard way", pattern: "The hard way — SYNDICATE beat [OPPONENT]." },
  { group: "Went the distance", label: "Last-game heroes", pattern: "Last-game heroes — SYNDICATE beat [OPPONENT]." },
  { group: "One-game series", label: "One and done", pattern: "One and done — SYNDICATE beat [OPPONENT]." },
  { group: "One-game series", label: "One shot, one win", pattern: "One shot, one win — SYNDICATE beat [OPPONENT]." },
  { group: "One-game series", label: "First and final", pattern: "First and final — SYNDICATE beat [OPPONENT]." },
  { group: "In defeat", label: "A rare stumble", pattern: "A rare stumble — [OPPONENT] edged SYNDICATE." },
  { group: "In defeat", label: "So close", pattern: "So close — [OPPONENT] took it at the wire." },
];

/** Fill a card-line pattern's [OPPONENT] placeholder with a real name. */
export function cardLineFromPattern(pattern: string, opponent: string): string {
  return pattern.split("[OPPONENT]").join(opponent);
}
