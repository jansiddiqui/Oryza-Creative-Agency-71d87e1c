"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ASSET_ACCEPT, uploadAsset } from "../ops/upload";
import { Drawer } from "./Drawer";
import { Icon } from "./Icon";
import { useToast } from "./Toasts";

interface Post {
  id: string;
  label: string;
  hint: string;
}

/** Find a post by title (uses the same search as the command palette). */
function PostPicker({ onPick }: { onPick: (p: Post) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Post[]>([]);
  const searching = q.trim().length >= 2;
  useEffect(() => {
    if (!searching) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/admin/api/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        const json = (await res.json()) as { hits?: { group: string; id: string; label: string; hint: string }[] };
        setHits((json.hits ?? []).filter((h) => h.group === "Posts"));
      } catch {
        /* aborted */
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q, searching]);
  return (
    <div className="space-y-2">
      <label className="block text-[13px] font-semibold text-text-2" htmlFor="qa-post">Which post?</label>
      <input id="qa-post" data-autofocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type part of the title" className="min-h-11 w-full rounded-lg border px-3 text-base" />
      <ul className="space-y-1">
        {hits.map((h) => (
          <li key={h.id}>
            <button type="button" onClick={() => onPick(h)} className="flex min-h-12 w-full flex-col justify-center rounded-lg px-3 text-left hover:bg-surface-2">
              <span className="text-[15px] font-semibold">{h.label}</span>
              <span className="text-[12px] text-muted">{h.hint}</span>
            </button>
          </li>
        ))}
        {q.trim().length >= 2 && !hits.length && <li className="px-3 py-2 text-[14px] text-muted">No posts match yet.</li>}
      </ul>
    </div>
  );
}

/** The floating "+" (phones) and New → Upload (desktop): quick actions using the existing ones. */
export function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<"" | "upload" | "note">("");
  const [post, setPost] = useState<Post | null>(null);
  const [busy, setBusy] = useState("");
  const file = useRef<HTMLInputElement>(null);
  // The shell mounts this only while it is open, so it always starts at the first step.
  const option = "flex min-h-14 w-full items-center gap-3 rounded-xl border border-edge bg-surface px-4 text-left text-[15px] font-semibold hover:bg-surface-2";
  return (
    <Drawer open={open} onClose={onClose} title={mode === "upload" ? "Upload to a post" : mode === "note" ? "Add a note to a post" : "Quick add"} width={460}>
      {!mode && (
        <div className="space-y-2">
          <button type="button" className={option} onClick={() => setMode("upload")}><Icon name="upload" />Photo or video from the camera</button>
          <button type="button" className={option} onClick={() => setMode("note")}><Icon name="note" />A note on a post</button>
          <Link href="/admin/clients/new" onClick={onClose} className={option}><Icon name="clients" />New client</Link>
          <Link href="/admin/team#leave" onClick={onClose} className={option}><Icon name="team" />Leave for someone</Link>
          <p className="pt-2 text-[13px] text-muted">Tasks come from each post&apos;s plan; open a post to work on its tasks.</p>
        </div>
      )}
      {mode && !post && <PostPicker onPick={(p) => (mode === "note" ? (onClose(), router.push(`/admin/items/${p.id}#notes`)) : setPost(p))} />}
      {mode === "upload" && post && (
        <div className="space-y-3">
          <p className="text-[15px]"><span className="font-semibold">{post.label}</span><span className="block text-[13px] text-muted">{post.hint}</span></p>
          <input ref={file} type="file" accept={ASSET_ACCEPT} capture="environment" multiple className="sr-only" aria-label="Take or choose photos and videos"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              let n = 0;
              for (const f of files) {
                setBusy(`Uploading ${f.name}…`);
                const res = await uploadAsset(post.id, f);
                if (!res.ok) {
                  setBusy("");
                  return toast.show({ message: res.error, tone: "error" });
                }
                n++;
              }
              setBusy("");
              toast.show(`${n} file${n === 1 ? "" : "s"} added to “${post.label}”`);
              onClose();
              router.refresh();
            }}
          />
          <button type="button" data-autofocus disabled={!!busy} onClick={() => file.current?.click()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink text-[15px] font-semibold text-paper disabled:opacity-50">
            <Icon name="upload" />{busy || "Take a photo or choose files"}
          </button>
          <button type="button" onClick={() => setPost(null)} className="min-h-11 text-[14px] font-semibold text-muted">Choose another post</button>
        </div>
      )}
    </Drawer>
  );
}
