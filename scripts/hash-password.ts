import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

// Generates the ADMIN_PASSWORD_HASH value for .env / Vercel env vars.
//
// Usage:
//   npm run hash-password            (prompts for the password, hidden cost
//                                     is the standard bcrypt cost of 12)
//   npm run hash-password -- "pw"    (one-off; note: shell history may keep
//                                     the argument — the prompt is safer)
//
// The plaintext password is never printed or stored. Only the hash is
// shown — copy it into ADMIN_PASSWORD_HASH. Whoever holds the plaintext is
// the admin; choose a long one and keep it in a password manager.

async function main() {
  const arg = process.argv[2];
  let password = arg ?? "";

  if (!password) {
    const rl = createInterface({ input: stdin, output: stdout });
    password = await rl.question("Admin password (min 10 characters): ");
    rl.close();
  }

  if (password.length < 10) {
    console.error("Password too short — use at least 10 characters.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const escaped = hash.replace(/\$/g, "\\$");
  console.log("\nFor Vercel (Project → Settings → Environment Variables) — paste the RAW hash:");
  console.log("ADMIN_PASSWORD_HASH=" + hash);
  console.log("\nFor a local .env file — use the ESCAPED form (the $ signs in a bcrypt");
  console.log("hash otherwise get eaten by .env variable expansion, and login breaks):");
  console.log('ADMIN_PASSWORD_HASH="' + escaped + '"');
  console.log(
    "\nKeep the plaintext password in a password manager. It is the only admin credential there is.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
