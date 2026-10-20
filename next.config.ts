import type { NextConfig } from "next";
import { buildRedirects } from "./src/data/redirects";

const nextConfig: NextConfig = {
  async redirects() {
    return buildRedirects();
  },
};

export default nextConfig;
