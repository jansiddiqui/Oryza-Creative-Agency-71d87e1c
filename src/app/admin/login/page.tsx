import { AuthLayout } from "@/components/admin/auth/AuthLayout";
import { LoginForm } from "@/components/admin/LoginForm";
import { supabaseConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/admin/safe-next";

export const metadata = { title: "Sign in" };

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [notice, tone]: [string | undefined, "error" | "ok" | "info"] = !supabaseConfigured()
    ? ["The admin is not connected to Supabase yet (see docs/supabase-setup.md).", "error"]
    : sp.error === "link"
      ? ["This link has expired or was already used — request a new one below. Open it in the same browser you asked for it from.", "error"]
      : sp.error === "denied"
        ? ["This account does not have access to the admin.", "error"]
        : sp.signedout === "all"
          ? ["You are signed out on all devices.", "ok"]
          : [undefined, "info"];
  return (
    <AuthLayout title="Sign in" intro="For the Oryza team only." footer={<>Trouble signing in? Ask the owner to check you are on the Users list.</>}>
      <LoginForm next={safeNext(sp.next)} notice={notice} noticeTone={tone} initialMode={sp.error === "link" ? "link" : "password"} />
    </AuthLayout>
  );
}
