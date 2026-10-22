import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { REMEMBER_COOKIE, sessionCookieOptions } from "./remember";

/**
 * Session-aware client for the signed-in admin (anon key + auth cookies). When "Remember me" was off at sign-in
 * (or `temporary` is passed), the auth cookies are browser-session cookies that end when the browser closes.
 */
export async function sessionClient(opts: { temporary?: boolean } = {}) {
  const store = await cookies();
  const temporary = opts.temporary ?? store.get(REMEMBER_COOKIE)?.value === "0";
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, sessionCookieOptions(options, temporary));
        } catch {
          // Called from a Server Component: cookies are read-only there; the proxy refreshes them instead.
        }
      },
    },
  });
}
