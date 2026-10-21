const TEXT = {
  invalid: { title: "This link is not valid", body: "Please check that you opened the whole link Oryza sent you, or ask us for a new one." },
  expired: { title: "This link has expired", body: "Links stay open for 7 days. Ask Oryza for a fresh link." },
  revoked: { title: "This link has been switched off", body: "Oryza has replaced or closed this link. Ask us for the latest one." },
  busy: { title: "Please wait a moment", body: "This link was opened many times in a short while. Please try again in a few minutes." },
} as const;

/** What a client sees for a bad, expired, revoked or rate-limited link (never any client data). */
export function LinkProblem({ state }: { state: keyof typeof TEXT }) {
  const t = TEXT[state];
  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-line bg-paper p-6 text-center">
      <h1 className="font-display text-2xl">{t.title}</h1>
      <p className="mt-2 text-[15px] text-muted">{t.body}</p>
    </section>
  );
}
