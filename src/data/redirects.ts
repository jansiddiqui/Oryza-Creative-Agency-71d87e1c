/**
 * 301 redirects from the old static site (www.oryzaonline.in, retired) to the new pages.
 * Source list: docs/old-site-audit.md §2 and §8.3. Used by next.config.ts and checked by redirects.test.ts.
 * When a better page ships (e.g. /blog in Phase 3, /industries/political-leaders in Phase 2), update the target here.
 */
export const oldSiteRedirects: Record<string, string> = {
  // Main pages
  "/index.html": "/",
  "/about.html": "/",
  "/services.html": "/services",
  "/shop.html": "/services",
  "/blog.html": "/",
  "/contact.html": "/contact",
  "/privacy-policy.html": "/privacy-policy",
  "/cookie-policy.html": "/privacy-policy",
  "/terms-of-services.html": "/terms",

  // Blog posts
  "/blog/Mastering-Instagram-Stories-for-Business-Growth.html": "/platforms",
  "/blog/Creating-Scroll-Stopping-Social-Media-Content.html": "/platforms",
  "/blog/How-Oryza-Builds-Personal-Brands-for-Leaders.html": "/industries",
  "/blog/How-Oryza-Helps-You-Establish-Your-Lifestyle-as-a-Brand.html": "/industries",
  "/blog/Grow-Your-Business-Online.html": "/how-it-works",
  "/blog/Building-a-Memorable-Brand-Identity-from-Scratch.html": "/",
  "/blog/Overcoming-Creative-Block-Strategies-That-Work.html": "/",
  "/blog/The-Art-of-Visual-Storytelling-in-Marketing.html": "/",
  "/blog/The-Creative-Workspace-Designing-for-Inspiration.html": "/",
  "/blog/The-Psychology-of-Color-in-Brand-Identity.html": "/",
  "/blog/Typography-Trends-for-Modern-Digital-Design.html": "/",

  // Catalog / shop items
  "/catalog/premium-political-campaign-social-media-kit.html": "/industries",
  "/catalog/instagram-content-pack.html": "/platforms",
  "/catalog/facebook-ad-creatives-package.html": "/platforms",
  "/catalog/premium-social-media-pack.html": "/services",
  "/catalog/logo-design-package.html": "/services",
  "/catalog/brand-style-guide-service.html": "/services",
  "/catalog/business-card-design.html": "/services",
  "/catalog/professional-visiting-card-design.html": "/services",
  "/catalog/customized-bag-designs.html": "/services",
  "/catalog/packaging-design-package.html": "/services",
  "/catalog/web-design-package.html": "/services",

  // Linked from the old site but never existed; there is no portfolio page yet.
  "/portfolio.html": "/",
};

/**
 * Paths we plan to use for real pages (portfolio when real client work exists, blog in Phase 3, about).
 * Never redirect them: browsers cache 301s, so a redirect now would hide the future page from returning visitors.
 * Their bare forms returned 404 on the old site, so nothing is lost.
 */
export const reservedPaths = ["/about", "/blog", "/portfolio"];

export type SiteRedirect = { source: string; destination: string; statusCode: 301 };

/** Every old URL, plus its extensionless form (/shop, /blog/<slug>) unless it is the target itself or a reserved path. */
export function buildRedirects(): SiteRedirect[] {
  const out = new Map<string, string>();
  for (const [source, destination] of Object.entries(oldSiteRedirects)) {
    out.set(source, destination);
    const bare = source.replace(/\.html$/, "");
    if (bare !== destination && !reservedPaths.includes(bare) && !out.has(bare)) out.set(bare, destination);
  }
  return [...out].map(([source, destination]) => ({ source, destination, statusCode: 301 }));
}
