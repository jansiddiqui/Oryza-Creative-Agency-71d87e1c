import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["/", 1],
    ["/plan-builder", 0.9],
    ["/services", 0.9],
    ["/industries", 0.8],
    ["/industries/schools", 0.8],
    ["/platforms", 0.7],
    ["/how-it-works", 0.6],
    ["/contact", 0.6],
    ["/privacy-policy", 0.2],
    ["/terms", 0.2],
  ];
  return pages.map(([path, priority]) => ({ url: `${site.url}${path}`, changeFrequency: "monthly", priority }));
}
