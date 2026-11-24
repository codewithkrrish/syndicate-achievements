import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared vocabularies. The DB stores these as plain strings; this module is
// the single source of truth for which values are legal. Every write path
// (server actions today, any future API) must validate through these schemas.
// ---------------------------------------------------------------------------

export const RESULTS = ["WIN", "LOSS"] as const;
export const FORMATS = ["BO1", "BO3", "BO5"] as const;
export const GAME_RESULTS = ["Victory", "Defeat"] as const;

export type Result = (typeof RESULTS)[number];
export type Format = (typeof FORMATS)[number];
export type GameResult = (typeof GAME_RESULTS)[number];

/** Human-readable expansion used on the public detail page. */
export const FORMAT_LABEL: Record<Format, string> = {
  BO1: "Best of 1 game",
  BO3: "Best of 3 games",
  BO5: "Best of 5 games",
};

/** How many games a series of each format can contain at most. */
export const FORMAT_MAX_GAMES: Record<Format, number> = {
  BO1: 1,
  BO3: 3,
  BO5: 5,
};

const scorePart = z
  .number({ invalid_type_error: "Enter a number" })
  .int("Whole numbers only")
  .min(0, "Cannot be negative")
  .max(99, "Unreasonably large");

export const gameInputSchema = z.object({
  scoreFor: scorePart,
  scoreAgainst: scorePart,
  result: z.enum(GAME_RESULTS),
  screenshotUrl: z
    .string()
    .trim()
    .min(1, "Add a screenshot (upload or paste an image URL)")
    .max(2048)
    // Local seed/asset paths and full URLs are both acceptable.
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
      "Screenshot must be an uploaded image or a full http(s) URL",
    ),
});

export const achievementInputSchema = z
  .object({
    matchNumber: z
      .number({ invalid_type_error: "Enter the match number" })
      .int("Whole numbers only")
      .min(1, "Match numbers start at 1")
      .max(100000),
    opponent: z
      .string()
      .trim()
      .min(2, "Opponent guild name is required")
      .max(80, "Keep it under 80 characters"),
    opponentChannelUrl: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .transform((v) => (v ? v : null))
      .refine(
        (v) => v === null || /^https?:\/\//i.test(v),
        "Channel link must be a full http(s) URL",
      ),
    result: z.enum(RESULTS),
    finalScore: z
      .string()
      .trim()
      .min(3, "Enter the final score, e.g. 2 – 1")
      .max(20),
    format: z.enum(FORMATS),
    // Arrives as an ISO date string (yyyy-mm-dd) from the date input.
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
      .transform((v) => new Date(`${v}T00:00:00.000Z`))
      .refine((d) => !Number.isNaN(d.getTime()), "Pick a valid date"),
    mode: z.string().trim().min(2, "Mode is required").max(60),
    map: z.string().trim().min(2, "Map is required").max(60),
    cardLine: z
      .string()
      .trim()
      .min(8, "Write the short card line")
      .max(160, "Card lines stay short — under 160 characters"),
    games: z
      .array(gameInputSchema)
      .min(1, "A series has at least one game")
      .max(5, "A series has at most five games"),
  })
  .superRefine((data, ctx) => {
    // A BO1 cannot have three games on file, etc. Keeps the archive honest.
    const max = FORMAT_MAX_GAMES[data.format];
    if (data.games.length > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["games"],
        message: `${data.format} allows at most ${max} game${max > 1 ? "s" : ""}`,
      });
    }
  });

export type AchievementInput = z.infer<typeof achievementInputSchema>;
export type GameInput = z.infer<typeof gameInputSchema>;

/** Flatten a ZodError into { fieldPath: message } for per-field form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Upload validation (used by /api/admin/upload before anything touches Blob).
// ---------------------------------------------------------------------------

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // ~8 MB
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
