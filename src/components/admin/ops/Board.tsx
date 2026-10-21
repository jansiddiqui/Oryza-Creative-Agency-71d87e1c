"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { boardMoveAction, undoTaskChangesAction } from "@/app/admin/(panel)/items/actions";
import { BOARD_COLUMNS } from "@/lib/ops/board";
import type { ClientLite, ItemRow, ItemStage } from "@/lib/ops/types";
import { Drawer } from "../shell/Drawer";
import { useToast } from "../shell/Toasts";
import { OfflineApprovalDialog } from "./ItemPanel";
import { Badge, btnText, ClientDot, fmtDay, formatLabel, PlatformGlyph, stageLabel, STAGE_TONE } from "./ui";

/**
 * Kanban by stage. A drop is checked on the server against the post's tasks (same rules as the rest of the app);
 * "Client approved" only accepts drops through the offline-approval confirmation. On phones (and from the keyboard)
 * each card has "Move to…" instead of dragging.
 */
export function Board({ items, clients, today }: { items: ItemRow[]; clients: ClientLite[]; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const [stage, setStage] = useState<Record<string, ItemStage>>({});
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<ItemStage | null>(null);
  const [moveFor, setMoveFor] = useState<ItemRow | null>(null);
  const [offline, setOffline] = useState<string | null>(null);
  const client = new Map(clients.map((c) => [c.id, c]));
  const at = (x: ItemRow) => stage[x.id] ?? x.stage;

  async function move(x: ItemRow, to: ItemStage) {
    setMoveFor(null);
    const from = at(x);
    if (from === to) return;
    setStage((s) => ({ ...s, [x.id]: to }));
    const res = await boardMoveAction(x.id, to);
    const back = () => setStage((s) => ({ ...s, [x.id]: from }));
    if (!res.ok) {
      back();
      return toast.show({ message: res.error, tone: "error" });
    }
    if (res.data.kind === "refuse") {
      back();
      return toast.show({ message: res.data.reason, tone: "error", duration: 5000 });
    }
    if (res.data.kind === "offline_approval") {
      back();
      return setOffline(x.id);
    }
    const changes = res.data.changes;
    toast.show({
      message: `${res.data.label} · “${x.title}”`,
      undo: async () => {
        back();
        const u = await undoTaskChangesAction(x.id, changes);
        router.refresh();
        return u.ok ? { ok: true } : { ok: false, error: u.error };
      },
    });
    router.refresh();
  }

  return (
    <>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0">
        {BOARD_COLUMNS.map((col) => {
          const list = items.filter((x) => at(x) === col).sort((a, b) => a.date.localeCompare(b.date));
          return (
            <section
              key={col}
              aria-label={stageLabel(col)}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(col);
              }}
              onDragLeave={() => setOver((o) => (o === col ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const x = items.find((i) => i.id === drag);
                setDrag(null);
                if (x) void move(x, col);
              }}
              className={`flex w-[82vw] shrink-0 snap-start flex-col rounded-xl bg-surface-2 p-2 md:w-[248px] ${over === col ? "outline-2 outline-offset-[-2px] outline-dashed outline-gold-500" : ""}`}
            >
              <h3 className="flex items-center gap-2 px-1.5 pb-2 pt-1 text-[13px] font-bold">
                <Badge tone={STAGE_TONE[col]}>{stageLabel(col)}</Badge>
                <span className="text-muted tabular-nums">{list.length}</span>
              </h3>
              <ul className="min-h-24 flex-1 space-y-2">
                {list.map((x) => {
                  const c = client.get(x.clientId);
                  const late = x.date < today && col !== "published" && col !== "done";
                  return (
                    <li
                      key={x.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", x.id);
                        setDrag(x.id);
                      }}
                      onDragEnd={() => setDrag(null)}
                      className={`group rounded-[10px] border bg-surface p-2.5 shadow-[0_1px_0_rgb(19_32_28/0.04)] md:cursor-grab ${drag === x.id ? "opacity-50" : ""} ${late ? "border-bad/40" : "border-edge"}`}
                    >
                      <p className="flex items-center gap-1.5 text-[12px] text-muted">
                        <ClientDot colour={c?.colour ?? "#999"} size={8} />
                        <span className="truncate">{c?.name}</span>
                        <span className="ml-auto flex items-center gap-1"><PlatformGlyph platform={x.platform} size={12} />{formatLabel(x.format)}</span>
                      </p>
                      <Link href={`/admin/items/${x.id}`} scroll={false} className="mt-1 block text-[14px] font-semibold leading-5 hover:underline">{x.title}</Link>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className={`text-[12px] ${late ? "font-semibold text-bad" : "text-muted"}`}>{late ? "Overdue · " : ""}{fmtDay(x.date)}</span>
                        <button type="button" onClick={() => setMoveFor(x)} aria-label={`Move “${x.title}” to another stage`} className={`${btnText} md:opacity-0 md:focus:opacity-100 md:group-hover:opacity-100`}>Move…</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="mt-1 text-[12px] text-muted">Drag a post to the next stage (or use Move…). A move starts or finishes the matching task, and you can undo it. Only the client — or an offline approval with a note — can move a post to Client approved.</p>
      <Drawer open={!!moveFor} onClose={() => setMoveFor(null)} title="Move to…" subtitle={moveFor?.title} width={400}>
        <ul className="grid gap-2">
          {moveFor && BOARD_COLUMNS.map((col) => (
            <li key={col}>
              <button type="button" disabled={at(moveFor) === col} onClick={() => move(moveFor, col)} className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-edge px-3 text-left text-[15px] font-semibold disabled:opacity-40">
                <Badge tone={STAGE_TONE[col]}>{stageLabel(col)}</Badge>{at(moveFor) === col && <span className="text-[13px] font-normal text-muted">current</span>}
              </button>
            </li>
          ))}
        </ul>
      </Drawer>
      {offline && <OfflineApprovalDialog id={offline} open onClose={() => setOffline(null)} onDone={() => setStage((s) => ({ ...s, [offline]: "approved" }))} />}
    </>
  );
}
