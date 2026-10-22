import Image from "next/image";
import type { ReactNode } from "react";

/** Sign-in, forgot-password and reset-password screens: centred card, comfortable on phones. */
export function AuthLayout({ title, intro, children, footer }: { title: string; intro?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10 sm:py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/brand/oryza-icon.png" alt="" width={44} height={44} priority />
          <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-2">Oryza admin</p>
        </div>
        <div className="rounded-2xl border border-edge bg-surface p-5 shadow-[0_1px_2px_rgba(20,32,28,0.04)] sm:p-7">
          <h1 className="font-display text-[26px] leading-[32px] text-ink">{title}</h1>
          {intro && <p className="mt-1.5 text-[14px] leading-[21px] text-text-2">{intro}</p>}
          <div className="mt-5">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-[13px] leading-[20px] text-text-2">{footer}</div>}
      </div>
    </main>
  );
}

export const authInput =
  "mt-1.5 block min-h-12 w-full rounded-lg border border-edge-strong bg-surface px-3.5 py-2.5 text-base text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-gold-300/50";
export const authButton =
  "inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-ink px-4 text-[15px] font-semibold text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60";
export const authLink = "font-semibold text-ink underline decoration-edge-strong underline-offset-4 hover:decoration-ink";
