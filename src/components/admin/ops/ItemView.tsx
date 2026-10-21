"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { addAssetAction, removeAssetAction, saveItemTextAction, startAssetUploadAction } from "@/app/admin/(panel)/items/actions";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { Notice } from "../AdminShell";
import { btn, btnGhost, btnSmall, field } from "./ui";

const BUCKET = "client-assets";
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,application/pdf";

/** Caption draft, notes and the files the client will see on the approval page. */
export function ItemEditorPanel({ id, captionDraft, notes, assets }: { id: string; captionDraft: string; notes: string; assets: { ref: string; url: string; kind: string; name: string }[] }) {
  const router = useRouter();
  const [text, setText] = useState({ captionDraft, notes });
  const [msg, setMsg] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [link, setLink] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const dirty = text.captionDraft !== captionDraft || text.notes !== notes;

  async function upload(files: FileList | null) {
    for (const file of Array.from(files ?? [])) {
      if (file.size > 100 * 1024 * 1024) {
        setMsg({ tone: "error", text: `${file.name} is larger than 100 MB.` });
        continue;
      }
      setBusy(`Uploading ${file.name}…`);
      const target = await startAssetUploadAction(id, file.type);
      if (!target.ok) {
        setBusy("");
        return setMsg({ tone: "error", text: target.error });
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
      const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(target.data.path, target.data.token, file, { contentType: file.type });
      if (error) {
        setBusy("");
        return setMsg({ tone: "error", text: `Upload failed: ${error.message}` });
      }
      const added = await addAssetAction(id, target.data.path);
      if (!added.ok) setMsg({ tone: "error", text: added.error });
    }
    setBusy("");
    setMsg({ tone: "ok", text: "Files added." });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <form
        className="space-y-3 rounded-2xl border border-line bg-paper p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await saveItemTextAction(id, text);
          setMsg(res.ok ? { tone: "ok", text: "Saved." } : { tone: "error", text: res.error });
          if (res.ok) router.refresh();
        }}
      >
        <label className="block text-[13px] font-semibold">
          Caption draft <span className="font-normal text-muted">(the client sees this)</span>
          <textarea rows={6} value={text.captionDraft} onChange={(e) => setText({ ...text, captionDraft: e.target.value })} className={`mt-1 w-full ${field}`} />
        </label>
        <label className="block text-[13px] font-semibold">
          Team notes <span className="font-normal text-muted">(not shown to the client)</span>
          <textarea rows={3} value={text.notes} onChange={(e) => setText({ ...text, notes: e.target.value })} className={`mt-1 w-full ${field}`} />
        </label>
        <button disabled={!dirty} className={btn}>Save</button>
      </form>

      <section aria-labelledby="assets-h" className="rounded-2xl border border-line bg-paper p-5">
        <h2 id="assets-h" className="mb-1 font-display text-xl">Designs and videos</h2>
        <p className="mb-3 text-[13px] text-muted">Stored privately. The client sees them on the approval page through links that expire after an hour.</p>
        {assets.length > 0 && (
          <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {assets.map((a) => (
              <li key={a.ref} className="space-y-1">
                {a.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.name} className="aspect-square w-full rounded-xl border border-line object-cover" />
                ) : a.kind === "video" ? (
                  <video src={a.url} controls preload="metadata" className="aspect-square w-full rounded-xl border border-line bg-ink" />
                ) : (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex aspect-square items-center justify-center rounded-xl border border-line p-2 text-center text-[12px] font-semibold underline">{a.name}</a>
                )}
                <button
                  type="button"
                  className={btnSmall}
                  onClick={async () => {
                    if (!window.confirm("Remove this file?")) return;
                    const res = await removeAssetAction(id, a.ref);
                    if (res.ok) router.refresh();
                    else setMsg({ tone: "error", text: res.error });
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input ref={input} type="file" accept={ACCEPT} multiple className="sr-only" onChange={(e) => upload(e.target.files)} aria-label="Choose files to upload" />
          <button type="button" className={btn} disabled={!!busy} onClick={() => input.current?.click()}>{busy || "Upload files"}</button>
          <form
            className="flex flex-1 flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await addAssetAction(id, link.trim());
              if (!res.ok) return setMsg({ tone: "error", text: res.error });
              setLink("");
              router.refresh();
            }}
          >
            <input type="url" placeholder="or paste an https link (Drive, Canva…)" value={link} onChange={(e) => setLink(e.target.value)} className={`min-w-0 flex-1 ${field}`} />
            <button className={btnGhost} disabled={!link.trim()}>Add link</button>
          </form>
        </div>
      </section>
    </div>
  );
}
