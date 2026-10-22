import { AuthLayout } from "@/components/admin/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/admin/auth/ResetPasswordForm";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Set a new password" };

/** Reached from the reset email (through /admin/auth/callback, which signs you in first). */
export default async function ResetPassword() {
  const admin = await requireAdmin();
  return (
    <AuthLayout title="Set a new password" intro={<>For {admin.email}. Use at least 10 characters — a few unrelated words work well.</>}>
      <ResetPasswordForm email={admin.email} />
    </AuthLayout>
  );
}
