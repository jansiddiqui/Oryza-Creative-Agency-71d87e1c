/** Password rules and a rule-based strength meter for the admin (no network, no AI). Pure. */

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 72; // bcrypt's limit, which Supabase uses

const COMMON = new Set([
  "password", "password1", "password12", "password123", "1234567890", "12345678910", "qwertyuiop", "qwerty1234",
  "iloveyou12", "letmein123", "welcome123", "admin12345", "abc1234567", "1q2w3e4r5t", "oryza12345", "oryzaonline",
  "passw0rd123", "changeme123", "trustno1234",
]);

export interface Strength {
  /** 0 = too weak … 4 = strong */
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too short" | "Weak" | "Fair" | "Good" | "Strong";
  /** One short, actionable tip (or empty when strong). */
  tip: string;
}

const classes = (pw: string) => [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;

export function passwordStrength(pw: string, email = ""): Strength {
  if (pw.length < PASSWORD_MIN) return { score: 0, label: "Too short", tip: `Use at least ${PASSWORD_MIN} characters.` };
  const lower = pw.toLowerCase();
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (COMMON.has(lower) || (local.length >= 4 && lower.includes(local)) || /^(.)\1+$/.test(pw) || /^(0123456789|1234567890|abcdefghij)/i.test(pw)) {
    return { score: 1, label: "Weak", tip: "Avoid common passwords, your name or email, and simple sequences." };
  }
  let points = 0;
  if (pw.length >= 12) points++;
  if (pw.length >= 16) points++;
  points += Math.max(0, classes(pw) - 1);
  if (/(.)\1\1/.test(pw)) points--;
  const score = Math.max(1, Math.min(4, points)) as Strength["score"];
  const label = (["Too short", "Weak", "Fair", "Good", "Strong"] as const)[score];
  const tip = score >= 4 ? "" : pw.length < 16 ? "Longer is stronger — a few unrelated words work well." : "Mix in capitals, numbers or symbols.";
  return { score, label, tip };
}

/** The first problem with a new password, or null when it can be saved. */
export function newPasswordProblem(pw: string, confirm: string, email = ""): string | null {
  if (pw.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (pw.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  if (passwordStrength(pw, email).score < 2) return "That password is too easy to guess. Avoid common words, your email and simple sequences.";
  if (pw !== confirm) return "The two passwords do not match.";
  return null;
}

/**
 * Setting a new password without the current one is allowed only right after an email sign-in (a reset or magic
 * link): the session's verified `amr` claim must show a non-password sign-in in the last `maxAgeSeconds`.
 */
export function recentEmailSignIn(amr: unknown, nowSeconds: number, maxAgeSeconds = 15 * 60): boolean {
  if (!Array.isArray(amr)) return false;
  return amr.some((a) => {
    const m = a as { method?: unknown; timestamp?: unknown };
    return typeof m.method === "string" && ["recovery", "magiclink", "otp", "email/signup", "invite"].includes(m.method) && typeof m.timestamp === "number" && nowSeconds - m.timestamp <= maxAgeSeconds && m.timestamp <= nowSeconds + 60;
  });
}

/** Plain-language messages for Supabase sign-in errors (never echoes the raw error). */
export function signInErrorMessage(err: { status?: number; code?: string; message?: string } | null): string {
  if (!err) return "";
  if (err.status === 429 || /rate|too many/i.test(`${err.code} ${err.message}`)) return "Too many attempts — try again in a minute.";
  return "Wrong email or password.";
}
