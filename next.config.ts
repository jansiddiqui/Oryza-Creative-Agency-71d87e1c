import type { NextConfig } from "next";
import { buildRedirects } from "./src/data/redirects";

const nextConfig: NextConfig = {
  async redirects() {
    return buildRedirects();
  },
  async headers() {
    // The admin is private: never indexed or cached by shared caches (the proxy sets the same headers).
    return [
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] },
      // Client approval and report links: private, never indexed, cached or leaked through the referrer.
      {
        source: "/share/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
