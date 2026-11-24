// Minimal in-memory brute-force protection for the login form.
//
// Policy: after MAX_FAILURES failed attempts for the same username+IP pair
// inside WINDOW_MS, further attempts are refused (with the same generic
// error as a wrong password, so the lockout itself leaks nothing) until the
// window slides past.
//
// Honest limits: this map lives in one server process. On Vercel each
// instance keeps its own map, so this is a speed bump, not a vault — the
// real protections are the single account, the bcrypt hash, and a long
// password. It still stops naive scripted guessing cold on a single
// instance and costs nothing.

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

interface Attempt {
  count: number;
  firstAt: number;
}

const attempts = new Map<string, Attempt>();

function keyFor(username: string, ip: string): string {
  return `${username.toLowerCase()}|${ip}`;
}

export function isLockedOut(username: string, ip: string): boolean {
  const key = keyFor(username, ip);
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(username: string, ip: string): void {
  const key = keyFor(username, ip);
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
  } else {
    entry.count += 1;
  }
}

export function recordSuccess(username: string, ip: string): void {
  attempts.delete(keyFor(username, ip));
}
