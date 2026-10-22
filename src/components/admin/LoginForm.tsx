"use client";

import { useActionState, useState } from "react";
import { passwordSignIn, sendSignInLink, type LoginState } from "@/app/admin/login/actions";

const input = "mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-300/40";

export function LoginForm({ next, notice, initialMode = "password" }: { next: string; notice?: string; initialMode?: "password" | "link" }) {
  const [mode, setMode] = useState<"password" | "link">(initialMode);
  const [pwState, pwAction, pwPending] = useActionState<LoginState, FormData>(passwordSignIn, {});
  const [linkState, linkAction, linkPending] = useActionState<LoginState, FormData>(sendSignInLink, {});
  const state = mode === "password" ? pwState : linkState;

  return (
    <div className="w-full max-w-sm">
      <div role="tablist" aria-label="Sign-in method" className="mb-6 grid grid-cols-2 rounded-full border border-line p-1 text-[14px] font-semibold">
        {(["password", "link"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-full py-2 ${mode === m ? "bg-ink text-paper" : "text-ink-soft"}`}>
            {m === "password" ? "Password" : "Email link"}
          </button>
        ))}
      </div>

      {notice && <p role="alert" className="mb-4 rounded-xl bg-gold-100/60 px-4 py-3 text-[14px]">{notice}</p>}

      {mode === "link" && linkState.sent ? (
        <p role="status" className="rounded-xl bg-cream px-4 py-4 text-[15px]">
          If this email has admin access, a sign-in link is on its way. It works once and expires within an hour.
        </p>
      ) : (
        <form action={mode === "password" ? pwAction : linkAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block text-[14px] font-semibold">
            Email
            <input name="email" type="email" required autoComplete="email" className={input} />
          </label>
          {mode === "password" && (
            <label className="block text-[14px] font-semibold">
              Password
              <input name="password" type="password" required autoComplete="current-password" className={input} />
            </label>
          )}
          {state.error && <p role="alert" className="rounded-xl border border-red-800/30 bg-red-50 px-4 py-3 text-[14px] text-red-900">{state.error}</p>}
          <button disabled={pwPending || linkPending} className="w-full rounded-full bg-ink py-3 text-[15px] font-semibold text-paper disabled:opacity-60">
            {mode === "password" ? (pwPending ? "Signing in…" : "Sign in") : linkPending ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-[13px] text-muted">Only Oryza team members can sign in. Forgot your password? Use “Email link”, then set a new one under Account.</p>
    </div>
  );
}
