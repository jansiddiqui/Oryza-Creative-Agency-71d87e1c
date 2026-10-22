import Image from "next/image";
import { LoginForm } from "@/components/admin/LoginForm";
import { supabaseConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/admin/safe-next";

export const metadata = { title: "Sign in" };

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const notice = !supabaseConfigured()
    ? "The admin is not connected to Supabase yet (see docs/supabase-setup.md)."
    : sp.error === "link"
      ? "This link has expired or was already used — request a new one below. Open it in the same browser you asked for it from."
      : sp.error === "denied"
        ? "This account does not have access to the admin."
        : undefined;
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image src="/brand/oryza-icon.png" alt="" width={48} height={48} priority />
        <h1 className="mt-4 font-display text-3xl">Oryza admin</h1>
      </div>
      <LoginForm next={safeNext(sp.next)} notice={notice} initialMode={sp.error === "link" ? "link" : "password"} />
    </div>
  );
}
