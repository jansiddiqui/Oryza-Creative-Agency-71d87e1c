"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction, signOutEverywhereAction } from "@/app/admin/(panel)/account/actions";
import { newPasswordProblem } from "@/lib/admin/password";
import type { Admin } from "@/lib/admin/types";
import { AdminTitle } from "./AdminShell";
import { AuthMessage, PasswordField } from "./auth/PasswordField";
import { btn, card } from "./ops/ui";
import { useConfirm } from "./shell/Confirm";
import { useToast } from "./shell/Toasts";

function ChangePassword({ email }: { email: string }) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const problem = !current ? "Enter your current password." : newPasswordProblem(pw, pw2, email);
  const mismatch = tried && pw2 !== "" && pw !== pw2 ? "The two passwords do not match." : null;
  return (
    <form
      aria-labelledby="h-change"
      className={`space-y-4 p-5 ${card}`}
      onSubmit={async (e) => {
        e.preventDefault();
        setTried(true);
        if (problem) return setError(problem);
        setBusy(true);
        setError(null);
        const res = await changePasswordAction(current, pw, pw2);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        if ("problem" in res.data) return setError(res.data.problem);
        setCurrent("");
        setPw("");
        setPw2("");
        setTried(false);
        toast.show({ message: "Password updated" });
      }}
    >
      <div>
        <h2 id="h-change" className="font-display text-[20px]">Change password</h2>
        <p className="mt-1 text-[14px] text-text-2">Other signed-in devices stay signed in. To end those too, use “Sign out of all devices” below.</p>
      </div>
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <PasswordField label="Current password" name="current-password" autoComplete="current-password" value={current} onChange={setCurrent} hint="Forgot it? Sign out, then use “Forgot password?” on the sign-in page." />
      <PasswordField label="New password" name="new-password" autoComplete="new-password" value={pw} onChange={setPw} strength email={email} />
      <PasswordField label="Confirm new password" name="confirm-password" autoComplete="new-password" value={pw2} onChange={setPw2} error={mismatch} />
      {error && <AuthMessage tone="error">{error}</AuthMessage>}
      <button type="submit" disabled={busy} className={`${btn} w-full sm:w-auto`}>{busy ? "Saving…" : "Change password"}</button>
    </form>
  );
}

function SignOutEverywhere() {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <section aria-labelledby="h-devices" className={`space-y-3 p-5 ${card}`}>
      <h2 id="h-devices" className="font-display text-[20px]">Signed-in devices</h2>
      <p className="text-[14px] text-text-2">Lost a phone, or signed in on a shared computer? This signs you out everywhere — including here — and you sign in again.</p>
      {error && <AuthMessage tone="error">{error}</AuthMessage>}
      <button
        type="button"
        disabled={busy}
        className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-bad/50 bg-surface px-3.5 text-[14px] font-semibold text-bad transition-colors hover:bg-bad-bg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto md:min-h-10"
        onClick={async () => {
          if (!(await confirm({ title: "Sign out of all devices?", body: "Every browser and phone signed in to the admin with your account is signed out, including this one.", action: "Sign out everywhere", danger: true }))) return;
          setBusy(true);
          const res = await signOutEverywhereAction();
          if (!res.ok) {
            setBusy(false);
            return setError(res.error);
          }
          router.replace("/admin/login?signedout=all");
        }}
      >
        {busy ? "Signing out…" : "Sign out of all devices"}
      </button>
    </section>
  );
}

export function AccountView({ admin }: { admin: Admin }) {
  return (
    <>
      <AdminTitle title="Account" intro={`Signed in as ${admin.email} (${admin.role}).`} />
      <div className="grid max-w-xl gap-5">
        <ChangePassword email={admin.email} />
        <SignOutEverywhere />
      </div>
    </>
  );
}
