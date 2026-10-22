"use client";

import { useActionState, useState } from "react";
import { passwordSignIn, sendSignInLink, type LoginState } from "@/app/admin/login/actions";
import { authButton, authInput, authLink } from "./auth/AuthLayout";
import { AuthMessage, PasswordField } from "./auth/PasswordField";

type Mode = "password" | "link";

/** Password or email-link sign-in. Enter submits; autofill-friendly; 16 px inputs and 48 px buttons on phones. */
export function LoginForm({ next, notice, noticeTone = "error", initialMode = "password" }: { next: string; notice?: string; noticeTone?: "error" | "ok" | "info"; initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [pwState, pwAction, pwPending] = useActionState<LoginState, FormData>(passwordSignIn, {});
  const [linkState, linkAction, linkPending] = useActionState<LoginState, FormData>(sendSignInLink, {});
  const state = mode === "password" ? pwState : linkState;
  const pending = pwPending || linkPending;

  return (
    <div>
      <div role="tablist" aria-label="Sign-in method" className="mb-5 grid grid-cols-2 rounded-[10px] bg-surface-2 p-1 text-[14px] font-semibold">
        {(["password", "link"] as const).map((m) => (
          <button key={m} id={`tab-${m}`} type="button" role="tab" aria-selected={mode === m} aria-controls="signin-panel" onClick={() => setMode(m)} className={`min-h-11 rounded-lg ${mode === m ? "bg-surface text-ink shadow-sm" : "text-text-2 hover:text-ink"}`}>
            {m === "password" ? "Password" : "Email link"}
          </button>
        ))}
      </div>

      <div id="signin-panel" role="tabpanel" aria-labelledby={`tab-${mode}`} className="space-y-4">
        {notice && <AuthMessage tone={noticeTone}>{notice}</AuthMessage>}

        {mode === "link" && linkState.sent ? (
          <AuthMessage tone="ok">If this email has admin access, a sign-in link is on its way. It works once, in this browser, and expires within an hour.</AuthMessage>
        ) : (
          <form action={mode === "password" ? pwAction : linkAction} className="space-y-4" noValidate={false}>
            <input type="hidden" name="next" value={next} />
            <div>
              <label htmlFor="signin-email" className="block text-[14px] font-semibold text-ink">Email</label>
              <input id="signin-email" name="email" type="email" inputMode="email" required autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={authInput} />
            </div>
            {mode === "password" && (
              <>
                <PasswordField label="Password" name="password" autoComplete="current-password" />
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[14px] text-ink">
                    <input type="checkbox" name="remember" defaultChecked className="size-5 accent-ink" />
                    Remember me
                  </label>
                  {/* A plain link on purpose: next/link here would pull router code into a chunk public pages share (they must stay byte-identical). */}
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                  <a href="/admin/forgot-password" className={`flex min-h-11 items-center text-[14px] ${authLink}`}>Forgot password?</a>
                </div>
              </>
            )}
            {state.error && <AuthMessage tone="error">{state.error}</AuthMessage>}
            <button type="submit" disabled={pending} className={authButton}>
              {mode === "password" ? (pwPending ? "Signing in…" : "Sign in") : linkPending ? "Sending…" : "Email me a sign-in link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
