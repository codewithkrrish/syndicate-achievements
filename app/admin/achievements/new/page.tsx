import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EMPTY_FORM } from "@/lib/types";
import { getNextMatchNumbers } from "@/lib/data";
import AdminShell from "@/components/admin/AdminShell";
import AchievementForm from "@/components/admin/AchievementForm";

export const metadata: Metadata = { title: "Add Achievement" };
export const dynamic = "force-dynamic";

export default async function NewAchievementPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  // Match numbers are scoped per record: the form opens on the next
  // free number in the default record and follows the category picker.
  const nextByCategory = await getNextMatchNumbers();
  const initial = {
    ...EMPTY_FORM,
    matchNumber: nextByCategory[EMPTY_FORM.category as "CREATOR" | "ORDINARY"],
  };

  return (
    <AdminShell active="new">
      <h1 className="font-condensed text-4xl font-bold uppercase leading-none sm:text-5xl">
        Add achievement
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/55">
        File a new series into the record. Every field marked by the layout is
        part of the public page — scores and screenshots are published exactly
        as entered, so check them once before saving.
      </p>
      <div className="mt-6">
        <AchievementForm initial={initial} nextByCategory={nextByCategory} />
      </div>
    </AdminShell>
  );
}
