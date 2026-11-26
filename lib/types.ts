// Serializable shapes passed from server components to the client UI.
// Dates are ISO strings (yyyy-mm-dd) so nothing non-serializable crosses
// the server/client boundary.

export interface GameDTO {
  id: number;
  gameNumber: number;
  scoreFor: number;
  scoreAgainst: number;
  result: string; // "Victory" | "Defeat"
  screenshotUrl: string;
}

export interface AchievementDTO {
  id: number;
  matchNumber: number;
  opponent: string;
  opponentChannelUrl: string | null;
  result: string; // "WIN" | "LOSS"
  category: string; // "CREATOR" | "ORDINARY"
  finalScore: string;
  format: string; // "BO1" | "BO3" | "BO5"
  date: string; // yyyy-mm-dd
  mode: string;
  map: string;
  cardLine: string;
  thumbnailUrl: string | null;
  games: GameDTO[];
}

/** The editable subset the admin form works with (no ids except the record's). */
export interface AchievementFormValues {
  matchNumber: number | "";
  opponent: string;
  opponentChannelUrl: string;
  result: string;
  category: string;
  finalScore: string;
  format: string;
  date: string; // yyyy-mm-dd
  mode: string;
  map: string;
  cardLine: string;
  thumbnailUrl: string;
  games: {
    scoreFor: number | "";
    scoreAgainst: number | "";
    result: string;
    screenshotUrl: string;
  }[];
}

export const EMPTY_FORM: AchievementFormValues = {
  matchNumber: "",
  opponent: "",
  opponentChannelUrl: "",
  result: "WIN",
  category: "ORDINARY",
  finalScore: "",
  format: "BO3",
  date: new Date().toISOString().slice(0, 10),
  mode: "Clash Squad",
  map: "",
  cardLine: "",
  thumbnailUrl: "",
  games: [{ scoreFor: "", scoreAgainst: "", result: "Victory", screenshotUrl: "" }],
};
