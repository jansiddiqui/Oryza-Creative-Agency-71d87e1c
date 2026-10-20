"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addUserAction, updateUserAction } from "@/app/admin/(panel)/users/actions";
import { AdminTitle, fmtWhen } from "./AdminShell";

export type AdminUserRow = { email: string; role: "owner" | "editor"; active: boolean; added_by: string | null; created_at: string };

const cls = "rounded-lg border border-line bg-paper px-3 py-2 text-[14px]";

export function UsersView({ users, me }: { users: AdminUserRow[]; me: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [msg, setMsg] = useState("");

  async function done(res: { ok: boolean; error?: string }, ok: string) {
    setMsg(res.ok ? ok : res.error === "Something went wrong. Please try again." ? "Could not save — check the email and try again. You cannot remove your own owner access." : (res.error ?? ""));
    if (res.ok) router.refresh();
  }

  return (
    <>
      <AdminTitle title="Users" intro="Who can sign in to the admin. Owners manage this list; editors manage images and leads. Each person also needs a login created in Supabase (see docs/supabase-setup.md)." />
      <form
        className="mb-8 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-paper p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          await done(await addUserAction(email, role), `${email} added. Now create their login in Supabase (Authentication → Users → Add user) — see docs/supabase-setup.md.`);
          setEmail("");
        }}
      >
        <label className="min-w-[220px] flex-1 text-[13px] font-semibold">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1 w-full ${cls}`} />
        </label>
        <label className="text-[13px] font-semibold">
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)} className={`mt-1 block ${cls}`}>
            <option value="editor">Editor</option>
            <option value="owner">Owner</option>
          </select>
        </label>
        <button className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper">Add</button>
      </form>
      {msg && <p role="status" className="mb-4 rounded-xl bg-cream px-4 py-3 text-[14px]">{msg}</p>}
      <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">
        {users.map((u) => (
          <li key={u.email} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{u.email}{u.email === me && <span className="font-normal text-muted"> (you)</span>}</p>
              <p className="text-[13px] text-muted">Added {fmtWhen(u.created_at)}{u.added_by ? ` by ${u.added_by}` : ""}{u.active ? "" : " · access off"}</p>
            </div>
            <select
              aria-label={`Role for ${u.email}`}
              value={u.role}
              disabled={u.email === me}
              onChange={async (e) => done(await updateUserAction(u.email, { role: e.target.value }), "Role updated.")}
              className={cls}
            >
              <option value="editor">Editor</option>
              <option value="owner">Owner</option>
            </select>
            <button
              type="button"
              disabled={u.email === me}
              onClick={async () => done(await updateUserAction(u.email, { active: !u.active }), u.active ? "Access switched off." : "Access switched on.")}
              className="rounded-full border border-ink/20 px-4 py-2 text-[13px] font-semibold hover:border-ink disabled:opacity-40"
            >
              {u.active ? "Switch off access" : "Switch on access"}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
