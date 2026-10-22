"use client";

import { useState } from "react";
import { setNewPasswordAction } from "@/app/admin/reset-password/actions";
import { newPasswordProblem } from "@/lib/admin/password";
import { authButton } from "./AuthLayout";
import { AuthMessage, PasswordField } from "./PasswordField";

/** New password + confirm (10+ characters, strength shown), then Today with a "Password updated" toast. */
export function ResetPasswordForm({ email }: { email: string }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const problem = newPasswordProblem(pw, pw2, email);
  const mismatch = tried && pw2 !== "" && pw !== pw2 ? "The two passwords do not match." : null;
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setTried(true);
        if (problem) return setError(problem);
        setBusy(true);
        setError(null);
        const res = await setNewPasswordAction(pw, pw2);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        if ("problem" in res.data) return setError(res.data.problem);
        // A full page load (not next/navigation, which would change a chunk public pages share).
        window.location.replace(new URL("/admin/today?flash=password-updated", window.location.origin).href);
      }}
    >
      {/* Lets password managers save the new password against the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <PasswordField label="New password" name="new-password" autoComplete="new-password" value={pw} onChange={setPw} strength email={email} autoFocus />
      <PasswordField label="Confirm new password" name="confirm-password" autoComplete="new-password" value={pw2} onChange={setPw2} error={mismatch} />
      {error && <AuthMessage tone="error">{error}</AuthMessage>}
      <button type="submit" disabled={busy} className={authButton}>{busy ? "Saving…" : "Save new password"}</button>
    </form>
  );
}
