"use client";

import { useId, useState } from "react";
import { passwordStrength } from "@/lib/admin/password";
import { Icon } from "../shell/Icon";

const STRENGTH_TONE = ["bg-bad", "bg-bad", "bg-warn", "bg-ok", "bg-ok"];
const STRENGTH_TEXT = ["text-bad", "text-bad", "text-warn", "text-ok", "text-ok"];

/** Password input with a show/hide toggle (44 px), autofill hints and an optional strength meter. */
export function PasswordField({
  label,
  name,
  value,
  onChange,
  autoComplete,
  strength,
  email = "",
  error,
  hint,
  autoFocus,
}: {
  label: string;
  name: string;
  value?: string;
  onChange?: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  /** Show the strength meter under the field. */
  strength?: boolean;
  email?: string;
  error?: string | null;
  hint?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const [local, setLocal] = useState("");
  const v = value ?? local;
  const s = strength && v ? passwordStrength(v, email) : null;
  const describedBy = [hint || s ? `${id}-help` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-semibold text-ink">{label}</label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          autoFocus={autoFocus}
          value={v}
          onChange={(e) => (onChange ? onChange(e.target.value) : setLocal(e.target.value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="block min-h-12 w-full rounded-lg border border-edge-strong bg-surface py-2.5 pl-3.5 pr-14 text-base text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-gold-300/50"
        />
        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          aria-controls={id}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg text-text-2 hover:text-ink"
        >
          <Icon name={shown ? "eyeOff" : "eye"} size={20} />
        </button>
      </div>
      {s && (
        <div id={`${id}-help`} className="mt-2" aria-live="polite">
          <div className="grid grid-cols-4 gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 rounded-full ${i <= s.score ? STRENGTH_TONE[s.score] : "bg-surface-2"}`} />)}
          </div>
          <p className="mt-1.5 text-[13px]">
            <span className={`font-semibold ${STRENGTH_TEXT[s.score]}`}>Strength: {s.label}</span>
            {s.tip && <span className="text-text-2"> · {s.tip}</span>}
          </p>
        </div>
      )}
      {!s && hint && <p id={`${id}-help`} className="mt-1.5 text-[13px] text-text-2">{hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1.5 text-[13px] font-semibold text-bad">{error}</p>}
    </div>
  );
}

/** The card the sign-in, forgot and reset screens share. */
export function AuthMessage({ tone, children }: { tone: "ok" | "error" | "info"; children: React.ReactNode }) {
  const cls = tone === "error" ? "border-bad/30 bg-bad-bg text-bad" : tone === "ok" ? "border-ok/30 bg-ok-bg text-ok" : "border-edge bg-surface-2 text-ink";
  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-[14px] leading-[20px] ${cls}`}>{children}</p>;
}
