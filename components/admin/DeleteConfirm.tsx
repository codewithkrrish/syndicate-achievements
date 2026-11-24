"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteAchievement } from "@/app/admin/actions";

// The destructive half of the delete flow. The server page has already
// shown the admin exactly which record this is; this component requires
// one more deliberate step — typing nothing, but pressing a clearly
// labelled confirm after seeing the summary — and reports failures inline
// instead of failing silently.
export default function DeleteConfirm({ id }: { id: number }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteAchievement(id);
      if (result.ok) {
        router.push("/admin?notice=deleted");
        router.refresh();
        return;
      }
      setError(result.formError || "The achievement was not deleted. Try again.");
    } catch {
      setError("Could not reach the server. Nothing was deleted — try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (!armed) {
    return (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="inline-flex min-h-12 items-center border border-brand/70 px-6 font-condensed text-lg font-bold uppercase tracking-wider text-[#ff8a86] transition hover:bg-brand hover:text-white"
        >
          Delete this achievement
        </button>
        <Link
          href="/admin"
          className="inline-flex min-h-12 items-center border border-linestrong px-6 font-condensed text-lg font-semibold uppercase tracking-wider text-ink/75 transition hover:border-brand hover:text-brand"
        >
          Keep it — back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-brand/60 bg-brand/10 p-5">
      <p className="font-condensed text-xl font-bold uppercase text-[#ffb3b0]">
        Final confirmation
      </p>
      <p className="mt-1 text-sm leading-relaxed text-ink/75">
        This removes the achievement and all of its game screenshots from the
        public record. There is no undo.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-[#ff8a86]">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex min-h-12 items-center bg-brand px-6 font-condensed text-lg font-bold uppercase tracking-wider text-white transition hover:bg-branddeep disabled:cursor-wait disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Yes, delete it permanently"}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          disabled={deleting}
          className="inline-flex min-h-12 items-center border border-linestrong px-6 font-condensed text-lg font-semibold uppercase tracking-wider text-ink/80 transition hover:border-brand hover:text-brand"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
