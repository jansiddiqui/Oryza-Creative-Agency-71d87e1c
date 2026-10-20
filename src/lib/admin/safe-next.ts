/** Only same-site admin paths are allowed after sign-in (no open redirects). */
export const safeNext = (next: unknown) => (typeof next === "string" && /^\/admin(\/[a-z0-9/_-]*)?$/i.test(next) ? next : "/admin");
