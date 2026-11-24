"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AchievementFormValues } from "@/lib/types";
import {
  FORMATS,
  FORMAT_MAX_GAMES,
  GAME_RESULTS,
  RESULTS,
  type Format,
} from "@/lib/validation";
import { CARD_LINE_PATTERN } from "@/lib/site";
import {
  createAchievement,
  updateAchievement,
  type ActionResult,
} from "@/app/admin/actions";

interface Props {
  initial: AchievementFormValues;
  /** Present in edit mode; absent when creating. */
  achievementId?: number;
}

type GameRow = AchievementFormValues["games"][number];

const inputCls =
  "h-11 w-full border border-linestrong bg-raise px-3 text-[15px] text-ink outline-none transition placeholder:text-ink/30 focus:border-brand";
const labelCls =
  "mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-ink/55";

// The add/edit form for one achievement. Grouped into the four sections the
// record itself is made of: Match info / Series result / Card line / Games
// & screenshots. Validation is server-side (Zod, in the server action) and
// errors come back per field; this component renders them under the exact
// field they belong to and never fails silently.
export default function AchievementForm({ initial, achievementId }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<AchievementFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingRow, setUploadingRow] = useState<number | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});
  const topRef = useRef<HTMLDivElement>(null);

  const isEdit = achievementId !== undefined;
  const maxGames = FORMAT_MAX_GAMES[values.format as Format] ?? 5;

  const err = (key: string) => errors[key];

  const set = <K extends keyof AchievementFormValues>(
    key: K,
    v: AchievementFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: v }));

  const setGame = (i: number, patch: Partial<GameRow>) =>
    setValues((prev) => {
      const games = prev.games.map((g, idx) => {
        if (idx !== i) return g;
        const next = { ...g, ...patch };
        // Convenience, not a rule: when both scores are in, pre-pick the
        // result from them. The admin can still override the select.
        if (
          ("scoreFor" in patch || "scoreAgainst" in patch) &&
          next.scoreFor !== "" &&
          next.scoreAgainst !== "" &&
          Number(next.scoreFor) !== Number(next.scoreAgainst)
        ) {
          next.result =
            Number(next.scoreFor) > Number(next.scoreAgainst)
              ? "Victory"
              : "Defeat";
        }
        return next;
      });
      return { ...prev, games };
    });

  const addGame = () =>
    setValues((prev) =>
      prev.games.length >= maxGames
        ? prev
        : {
            ...prev,
            games: [
              ...prev.games,
              { scoreFor: "", scoreAgainst: "", result: "Victory", screenshotUrl: "" },
            ],
          },
    );

  const removeGame = (i: number) =>
    setValues((prev) => ({
      ...prev,
      games: prev.games.filter((_, idx) => idx !== i),
    }));

  // ---- Screenshot upload (Vercel Blob via /api/admin/upload) -------------
  const handleUpload = async (i: number, file: File | undefined) => {
    if (!file) return;
    setUploadingRow(i);
    setUploadErrors((p) => ({ ...p, [i]: "" }));
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed. Paste an image URL instead.");
      }
      setGame(i, { screenshotUrl: data.url });
    } catch (e) {
      setUploadErrors((p) => ({
        ...p,
        [i]: e instanceof Error ? e.message : "Upload failed.",
      }));
    } finally {
      setUploadingRow(null);
    }
  };

  // ---- Submit -------------------------------------------------------------
  const payload = useMemo(() => {
    const num = (v: number | "") => (v === "" ? Number.NaN : Number(v));
    return {
      matchNumber: num(values.matchNumber),
      opponent: values.opponent,
      opponentChannelUrl: values.opponentChannelUrl,
      result: values.result,
      finalScore: values.finalScore,
      format: values.format,
      date: values.date,
      mode: values.mode,
      map: values.map,
      cardLine: values.cardLine,
      games: values.games.map((g) => ({
        scoreFor: num(g.scoreFor),
        scoreAgainst: num(g.scoreAgainst),
        result: g.result,
        screenshotUrl: g.screenshotUrl,
      })),
    };
  }, [values]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setErrors({});
    try {
      const result: ActionResult = isEdit
        ? await updateAchievement(achievementId, payload)
        : await createAchievement(payload);
      if (result.ok) {
        router.push(`/admin?notice=${isEdit ? "updated" : "created"}`);
        router.refresh();
        return;
      }
      if (result.errors) setErrors(result.errors);
      if (result.formError) setFormError(result.formError);
      if (!result.errors && !result.formError) {
        setFormError("The record was not saved. Check the fields and try again.");
      }
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setFormError("Could not reach the server. Nothing was saved — try again.");
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSubmitting(false);
    }
  };

  const cardLinePreview = values.opponent.trim()
    ? `Went the distance — SYNDICATE beat ${values.opponent.trim()}.`
    : CARD_LINE_PATTERN;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div ref={topRef} className="scroll-mt-24" />
      {formError && (
        <p
          role="alert"
          className="mb-6 border border-brand/50 bg-brand/10 px-4 py-3 text-sm font-medium text-[#ffb3b0]"
        >
          {formError}
        </p>
      )}
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="mb-6 border border-gold/50 bg-gold/10 px-4 py-3 text-sm font-medium text-gold">
          Some fields need attention — the messages under each field say what
          to fix. Nothing has been saved yet.
        </p>
      )}

      {/* ------------------------- Match info ------------------------- */}
      <Section
        title="Match info"
        note="Who the series was against, when it was played, and the game setup."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Match number" error={err("matchNumber")}>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={values.matchNumber}
              onChange={(e) =>
                set("matchNumber", e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="3"
              className={inputCls}
            />
            <Hint>The next free number in the record. Must be unique.</Hint>
          </Field>
          <Field label="Date" error={err("date")}>
            <input
              type="date"
              value={values.date}
              onChange={(e) => set("date", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Opponent guild / creator" error={err("opponent")}>
            <input
              type="text"
              value={values.opponent}
              onChange={(e) => set("opponent", e.target.value)}
              placeholder="NG Gamer"
              className={inputCls}
            />
          </Field>
          <Field
            label="Opponent YouTube channel URL (optional)"
            error={err("opponentChannelUrl")}
          >
            <input
              type="url"
              value={values.opponentChannelUrl}
              onChange={(e) => set("opponentChannelUrl", e.target.value)}
              placeholder="https://www.youtube.com/@channel"
              className={inputCls}
            />
            <Hint>
              Only paste a channel link you have verified. Leave empty and no
              channel bar appears on the match page.
            </Hint>
          </Field>
          <Field label="Mode" error={err("mode")}>
            <input
              type="text"
              value={values.mode}
              onChange={(e) => set("mode", e.target.value)}
              placeholder="Clash Squad"
              className={inputCls}
            />
          </Field>
          <Field label="Map" error={err("map")}>
            <input
              type="text"
              value={values.map}
              onChange={(e) => set("map", e.target.value)}
              placeholder="Bermuda"
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* ------------------------- Series result ------------------------- */}
      <Section
        title="Series result"
        note="How the series ended, in the format the record displays it."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Result" error={err("result")}>
            <select
              value={values.result}
              onChange={(e) => set("result", e.target.value)}
              className={inputCls}
            >
              {RESULTS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Format" error={err("format")}>
            <select
              value={values.format}
              onChange={(e) => set("format", e.target.value)}
              className={inputCls}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <Hint>
              {values.format} allows up to {maxGames}{" "}
              {maxGames === 1 ? "game" : "games"} below.
            </Hint>
          </Field>
          <Field label="Final score" error={err("finalScore")}>
            <input
              type="text"
              value={values.finalScore}
              onChange={(e) => set("finalScore", e.target.value)}
              placeholder="2 – 1"
              className={inputCls}
            />
            <Hint>Series score, SYNDICATE first — e.g. 2 – 1.</Hint>
          </Field>
        </div>
      </Section>

      {/* ------------------------- Card line ------------------------- */}
      <Section
        title="Card line"
        note="The one short line under the title on the record card. Keep it to the fixed pattern so every card in the record reads the same way."
      >
        <Field label="Card line" error={err("cardLine")}>
          <input
            type="text"
            value={values.cardLine}
            onChange={(e) => set("cardLine", e.target.value)}
            placeholder={cardLinePreview}
            maxLength={160}
            className={inputCls}
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="font-mono text-xs text-ink/45">
              Pattern: <span className="text-ink/70">{CARD_LINE_PATTERN}</span>
            </p>
            <button
              type="button"
              onClick={() => set("cardLine", cardLinePreview)}
              className="font-condensed text-sm font-semibold uppercase tracking-wider text-brand hover:text-[#ff6b66]"
            >
              Use pattern with this opponent
            </button>
            <span className="ml-auto font-mono text-xs text-ink/40">
              {values.cardLine.length}/160
            </span>
          </div>
        </Field>
      </Section>

      {/* ------------------------- Games & screenshots ------------------------- */}
      <Section
        title="Games & screenshots"
        note="One row per game, in order. Game numbers are assigned automatically. Every game needs its result screenshot — upload it, or paste an image URL."
      >
        {err("games") && (
          <p role="alert" className="mb-4 text-sm font-medium text-[#ff8a86]">
            {err("games")}
          </p>
        )}
        <div className="space-y-4">
          {values.games.map((g, i) => (
            <fieldset key={i} className="border border-line bg-raise p-4 sm:p-5">
              <legend className="sr-only">Game {i + 1}</legend>
              <div className="flex items-center gap-3">
                <h4 className="font-condensed text-xl font-bold uppercase">
                  Game {i + 1}
                </h4>
                <span
                  className={`px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-white ${
                    g.result === "Victory" ? "bg-brand" : "bg-zinc-600"
                  }`}
                >
                  {g.result || "—"}
                </span>
                {values.games.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGame(i)}
                    className="ml-auto font-condensed text-sm font-semibold uppercase tracking-wider text-ink/50 transition hover:text-brand"
                  >
                    Remove game
                  </button>
                )}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Score — SYNDICATE" error={err(`games.${i}.scoreFor`)}>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    inputMode="numeric"
                    value={g.scoreFor}
                    onChange={(e) =>
                      setGame(i, {
                        scoreFor: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="7"
                    className={inputCls}
                  />
                </Field>
                <Field label="Score — Opponent" error={err(`games.${i}.scoreAgainst`)}>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    inputMode="numeric"
                    value={g.scoreAgainst}
                    onChange={(e) =>
                      setGame(i, {
                        scoreAgainst: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="6"
                    className={inputCls}
                  />
                </Field>
                <Field label="Result" error={err(`games.${i}.result`)}>
                  <select
                    value={g.result}
                    onChange={(e) => setGame(i, { result: e.target.value })}
                    className={inputCls}
                  >
                    {GAME_RESULTS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Screenshot */}
              <div className="mt-4">
                <span className={labelCls}>Result screenshot</span>
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="w-full shrink-0 md:w-64">
                    {g.screenshotUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.screenshotUrl}
                        alt={`Game ${i + 1} screenshot preview`}
                        className="aspect-video w-full border border-line object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center border border-dashed border-linestrong bg-card px-3 text-center font-mono text-[10px] uppercase tracking-widest text-ink/35">
                        No screenshot yet
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={uploadingRow === i}
                        onClick={() => fileInputs.current[i]?.click()}
                        className="inline-flex min-h-10 items-center bg-brand px-4 font-condensed text-sm font-bold uppercase tracking-wider text-white transition hover:bg-branddeep disabled:cursor-wait disabled:opacity-60"
                      >
                        {uploadingRow === i
                          ? "Uploading…"
                          : g.screenshotUrl
                            ? "Replace image"
                            : "Upload image"}
                      </button>
                      {g.screenshotUrl && (
                        <button
                          type="button"
                          onClick={() => setGame(i, { screenshotUrl: "" })}
                          className="inline-flex min-h-10 items-center border border-linestrong px-4 font-condensed text-sm font-semibold uppercase tracking-wider text-ink/70 transition hover:border-brand hover:text-brand"
                        >
                          Remove
                        </button>
                      )}
                      <input
                        ref={(el) => {
                          fileInputs.current[i] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          void handleUpload(i, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-ink/45">
                      JPG, PNG or WebP, up to 8 MB. Stored on Vercel Blob.
                    </p>
                    <label className="mt-3 block">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
                        …or paste an image URL
                      </span>
                      <input
                        type="url"
                        value={g.screenshotUrl}
                        onChange={(e) => setGame(i, { screenshotUrl: e.target.value })}
                        placeholder="https://…/screenshot.jpg"
                        className={inputCls}
                      />
                    </label>
                    {(uploadErrors[i] || err(`games.${i}.screenshotUrl`)) && (
                      <p role="alert" className="mt-2 text-sm font-medium text-[#ff8a86]">
                        {uploadErrors[i] || err(`games.${i}.screenshotUrl`)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </fieldset>
          ))}
        </div>

        <button
          type="button"
          onClick={addGame}
          disabled={values.games.length >= maxGames}
          className="mt-4 inline-flex min-h-11 items-center border border-linestrong px-5 font-condensed text-base font-semibold uppercase tracking-wider transition enabled:hover:border-brand enabled:hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add game
        </button>
        {values.games.length >= maxGames && (
          <p className="mt-2 text-xs text-ink/45">
            {values.format} series are capped at {maxGames}{" "}
            {maxGames === 1 ? "game" : "games"}.
          </p>
        )}
      </Section>

      {/* ------------------------- Actions ------------------------- */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting || uploadingRow !== null}
          className="inline-flex min-h-12 items-center bg-brand px-7 font-condensed text-lg font-bold uppercase tracking-wider text-white transition hover:bg-branddeep disabled:cursor-wait disabled:opacity-60"
        >
          {submitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Add achievement"}
        </button>
        <a
          href="/admin"
          className="inline-flex min-h-12 items-center border border-linestrong px-6 font-condensed text-lg font-semibold uppercase tracking-wider text-ink/75 transition hover:border-brand hover:text-brand"
        >
          Cancel
        </a>
        <p className="text-sm text-ink/45">
          Saving publishes to the public site immediately.
        </p>
      </div>
    </form>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 border border-line bg-card p-5 first:mt-0 sm:p-6">
      <h3 className="font-condensed text-2xl font-bold uppercase">{title}</h3>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/55">{note}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-medium text-[#ff8a86]">
          {error}
        </p>
      )}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-ink/45">{children}</p>;
}
