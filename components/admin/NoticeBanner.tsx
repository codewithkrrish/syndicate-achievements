"use client";

import { useRouter, useSearchParams } from "next/navigation";

// Success feedback after admin actions. Actions redirect back to the
// dashboard with ?notice=<key>; this banner renders the matching message
// once and can be dismissed (which cleans the URL).
const MESSAGES: Record<string, string> = {
  created: "Achievement created — it is live on the public site now.",
  updated: "Achievement updated — the public site shows the new version.",
  deleted: "Achievement deleted — it is gone from the public record.",
};

export default function NoticeBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const notice = params.get("notice");
  if (!notice || !MESSAGES[notice]) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-center gap-3 border border-emerald-700/60 bg-emerald-950/50 px-4 py-3"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-emerald-700 font-condensed text-sm font-bold text-white">
        ✓
      </span>
      <p className="flex-1 text-sm font-medium text-emerald-100">
        {MESSAGES[notice]}
      </p>
      <button
        type="button"
        onClick={() => router.replace("/admin")}
        aria-label="Dismiss"
        className="px-2 text-lg leading-none text-emerald-200/70 transition hover:text-emerald-100"
      >
        ×
      </button>
    </div>
  );
}
