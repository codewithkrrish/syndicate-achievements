import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false, nocache: true },
};

// If the admin is already signed in, the login page bounces straight to the
// dashboard — there is nothing to do here twice.
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div className="bg-glow bg-glow-a" aria-hidden />
      <div className="relative w-full max-w-md border border-line bg-card p-7 shadow-panel sm:p-9">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center bg-brand font-condensed text-2xl font-bold text-white">
            S
          </span>
          <div className="leading-none">
            <p className="font-condensed text-2xl font-bold uppercase tracking-wide">
              SYNDICATE
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-ink/55">
              Achievements · Admin
            </p>
          </div>
        </div>

        <h1 className="mt-8 font-condensed text-3xl font-bold uppercase">
          Admin sign in
        </h1>
        <p className="mt-1.5 text-sm text-ink/55">
          Authorized access only. This panel manages the public record.
        </p>

        <div className="mt-7">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
