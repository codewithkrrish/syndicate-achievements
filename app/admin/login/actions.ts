"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isLockedOut, recordFailure, recordSuccess } from "@/lib/rate-limit";

// One generic message for every failure — wrong username, wrong password,
// and lockout all look identical from the outside, so the form can never be
// used to probe which part was wrong.
const GENERIC_ERROR = "Invalid username or password.";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  if (!username || !password) return { error: GENERIC_ERROR };
  if (isLockedOut(username, ip)) return { error: GENERIC_ERROR };

  try {
    await signIn("credentials", { username, password, redirectTo: "/admin" });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      recordFailure(username, ip);
      return { error: GENERIC_ERROR };
    }
    // signIn throws the redirect on success — clear the failure counter,
    // then let the redirect propagate.
    recordSuccess(username, ip);
    throw error;
  }
}
