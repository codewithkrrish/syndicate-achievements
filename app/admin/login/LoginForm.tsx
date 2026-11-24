"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

// Sign-in form. Deliberately bare: no hints, no defaults, no "forgot
// password" (there is one admin; the password is reset via env vars — see
// README). Errors are a single generic line from the server action.
export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-ink/55"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="h-12 w-full border border-linestrong bg-raise px-3.5 text-base text-ink outline-none transition placeholder:text-ink/30 focus:border-brand"
          placeholder="Admin username"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-ink/55"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 w-full border border-linestrong bg-raise px-3.5 text-base text-ink outline-none transition placeholder:text-ink/30 focus:border-brand"
          placeholder="Admin password"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="border border-brand/50 bg-brand/10 px-4 py-3 text-sm font-medium text-[#ffb3b0]"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-12 w-full items-center justify-center bg-brand font-condensed text-lg font-bold uppercase tracking-wider text-white transition hover:bg-branddeep disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
