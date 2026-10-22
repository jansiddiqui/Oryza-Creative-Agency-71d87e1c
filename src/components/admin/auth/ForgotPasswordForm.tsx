"use client";

import { useActionState } from "react";
import { requestPasswordReset, type LoginState } from "@/app/admin/login/actions";
import { authButton, authInput } from "./AuthLayout";
import { AuthMessage } from "./PasswordField";

/** "Forgot password?": one email field. The answer is the same whether or not the address has access. */
export function ForgotPasswordForm({ expired }: { expired?: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestPasswordReset, {});
  if (state.sent) {
    return (
      <AuthMessage tone="ok">
        If this email has admin access, a link to set a new password is on its way. It works once, in this browser, and expires within an hour. Nothing arrived? Check spam, then try again in a few minutes.
      </AuthMessage>
    );
  }
  return (
    <form action={action} className="space-y-4">
      {expired && <AuthMessage tone="error">This link has expired — request a new one.</AuthMessage>}
      <div>
        <label htmlFor="reset-email" className="block text-[14px] font-semibold text-ink">Email</label>
        <input id="reset-email" name="email" type="email" inputMode="email" required autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus className={authInput} />
      </div>
      {state.error && <AuthMessage tone="error">{state.error}</AuthMessage>}
      <button type="submit" disabled={pending} className={authButton}>{pending ? "Sending…" : "Send reset link"}</button>
    </form>
  );
}
