"use client";

import { useState } from "react";
import { setPasswordAction } from "@/app/admin/(panel)/account/actions";
import type { Admin } from "@/lib/admin/types";
import { AdminTitle } from "./AdminShell";

export function AccountView({ admin }: { admin: Admin }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <>
      <AdminTitle title="Account" intro={`Signed in as ${admin.email} (${admin.role}).`} />
      <form
        className="max-w-md space-y-4 rounded-2xl border border-line bg-paper p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 12) return setMsg({ ok: false, text: "Use at least 12 characters." });
          if (pw !== pw2) return setMsg({ ok: false, text: "The two passwords do not match." });
          const res = await setPasswordAction(pw);
          setMsg(res.ok ? { ok: true, text: "Password saved. You can now sign in with it." } : { ok: false, text: "Could not save the password. Try a different one." });
          if (res.ok) {
            setPw("");
            setPw2("");
          }
        }}
      >
        <h2 className="font-display text-xl">Set a password</h2>
        <label className="block text-[14px] font-semibold">
          New password <span className="font-normal text-muted">(12+ characters)</span>
          <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        <label className="block text-[14px] font-semibold">
          Repeat it
          <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-xl px-4 py-3 text-[14px] ${msg.ok ? "bg-cream" : "border border-red-800/30 bg-red-50 text-red-900"}`}>{msg.text}</p>}
        <button className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper">Save password</button>
      </form>
    </>
  );
}
