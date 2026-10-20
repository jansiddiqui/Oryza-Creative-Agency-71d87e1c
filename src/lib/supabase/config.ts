/** Supabase settings from env. The anon key is public; the service-role key never leaves the server. */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const BUCKETS = { public: "site-images", originals: "image-originals" } as const;

/** Public URL of a processed file in the site-images bucket. */
export const publicImageUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKETS.public}/${path.replace(/^\//, "")}`;
