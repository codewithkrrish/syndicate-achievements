import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

// Frame for every signed-in admin page: brand bar, section nav, view-site
// link and logout. Rendered by the pages themselves (not the layout) so the
// login page never shows it.
export default function AdminShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "dashboard" | "new";
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center bg-brand font-condensed text-xl font-bold text-white">
              S
            </span>
            <span className="leading-none">
              <span className="block font-condensed text-xl font-bold uppercase tracking-wide">
                SYNDICATE
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.32em] text-ink/55">
                Admin Panel
              </span>
            </span>
          </Link>

          <nav className="ml-2 flex items-center gap-1 sm:ml-6" aria-label="Admin">
            <ShellLink href="/admin" active={active === "dashboard"}>
              Dashboard
            </ShellLink>
            <ShellLink href="/admin/achievements/new" active={active === "new"}>
              Add achievement
            </ShellLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex min-h-10 items-center border border-linestrong px-3.5 font-condensed text-sm font-semibold uppercase tracking-wider text-ink/75 transition hover:border-brand hover:text-brand"
            >
              View site
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center bg-brand px-3.5 font-condensed text-sm font-bold uppercase tracking-wider text-white transition hover:bg-branddeep"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}

function ShellLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-10 items-center px-3 font-condensed text-[15px] font-semibold uppercase tracking-wider transition ${
        active ? "text-brand" : "text-ink/60 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
