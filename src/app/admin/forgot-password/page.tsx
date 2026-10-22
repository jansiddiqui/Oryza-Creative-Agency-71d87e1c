import { AuthLayout, authLink } from "@/components/admin/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/admin/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot password" };

export default async function ForgotPassword({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { error } = await searchParams;
  return (
    <AuthLayout
      title="Forgot password?"
      intro="Enter the email you sign in with. We'll send a link to set a new password."
      // Plain links on the sign-in screens: next/link here would change a chunk public pages share.
      // eslint-disable-next-line @next/next/no-html-link-for-pages
      footer={<a href="/admin/login" className={`inline-flex min-h-11 items-center ${authLink}`}>Back to sign in</a>}
    >
      <ForgotPasswordForm expired={error === "expired"} />
    </AuthLayout>
  );
}
