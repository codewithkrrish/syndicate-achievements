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
