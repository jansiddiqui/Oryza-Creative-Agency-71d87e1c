import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { forwardToCallback } from "@/lib/admin/auth-redirect";

/**
 * Runs only for /admin. Refreshes the Supabase session cookie, sends visitors without a session to the login
 * page, and marks every admin response noindex. This is the first gate only: every admin page, server
 * action and route handler checks the admin allow-list again on the server (lib/admin/auth).
 */
export const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/auth/"];

export const isPublicAdminPath = (path: string) => PUBLIC_ADMIN_PATHS.some((p) => (p.endsWith("/") ? path.startsWith(p) : path === p));

export async function proxy(request: NextRequest) {
  // A sign-in code that landed on an admin page instead of the callback: finish the sign-in there.
  const forward = forwardToCallback(request.nextUrl);
  if (forward) {
    const res = NextResponse.redirect(forward);
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let signedIn = false;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
        },
      },
    });
    try {
      const { data } = await supabase.auth.getUser();
      signedIn = Boolean(data.user);
    } catch {
      signedIn = false;
    }
  }

  const path = request.nextUrl.pathname;
  if (!signedIn && !isPublicAdminPath(path)) {
    const login = new URL("/admin/login", request.url);
    if (path !== "/admin") login.searchParams.set("next", path);
    response = NextResponse.redirect(login);
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
