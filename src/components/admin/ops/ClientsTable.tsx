"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateClientAction } from "@/app/admin/(panel)/clients/actions";
import { CLIENT_STATUSES, type ClientStatus } from "@/lib/ops/types";
import { useToast } from "../shell/Toasts";
import { DataTable, type Column } from "../ui/DataTable";
import { Badge, btnSmall, catLabel, ClientDot, fmtDay, type Tone } from "./ui";

export interface ClientRowView {
  id: string;
  name: string;
  category: string;
  colour: string;
  status: ClientStatus;
  city: string;
  packageName: string;
  renewalDate: string | null;
  renewIn: number | null;
  overdue: number;
  waiting: number;
  fee: string | null;
}

const TONE: Record<ClientStatus, Tone> = { onboarding: "info", active: "ok", paused: "warn", ended: "neutral" };
const statusText = (s: ClientStatus) => CLIENT_STATUSES.find((x) => x.id === s)?.label ?? s;

/** Clients as a table (cards on phones). `next=approvals` sends the chosen client to its Approvals tab. */
export function ClientsTable({ clients: initial, next }: { clients: ClientRowView[]; next?: "approvals" }) {
  const router = useRouter();
  const toast = useToast();
  const [clients, setClients] = useState(initial);
  const link = (c: ClientRowView) => `/admin/clients/${c.id}${next ? `?tab=${next}` : ""}`;
  const setStatus = (s: ClientStatus) => async (rows: ClientRowView[]) => {
    const prev = rows.map((r) => [r.id, r.status] as const);
    setClients((all) => all.map((c) => (rows.some((r) => r.id === c.id) ? { ...c, status: s } : c)));
    const res = await Promise.all(rows.map((r) => updateClientAction(r.id, { status: s })));
    if (res.some((r) => !r.ok)) return toast.show({ message: "Some clients could not be updated", tone: "error" });
    toast.show({
      message: `${rows.length} client${rows.length > 1 ? "s" : ""} set to ${statusText(s).toLowerCase()}`,
      undo: async () => {
        setClients((all) => all.map((c) => ({ ...c, status: prev.find(([id]) => id === c.id)?.[1] ?? c.status })));
        await Promise.all(prev.map(([id, st]) => updateClientAction(id, { status: st })));
        router.refresh();
      },
    });
    router.refresh();
  };
  const columns: Column<ClientRowView>[] = [
    { key: "name", label: "Client", sort: (c) => c.name, card: "title", render: (c) => <Link href={link(c)} className="flex items-center gap-2 font-semibold hover:underline"><ClientDot colour={c.colour} />{c.name}</Link> },
    { key: "category", label: "Category", sort: (c) => catLabel(c.category), card: "meta", render: (c) => catLabel(c.category) },
    { key: "package", label: "Package", sort: (c) => c.packageName, card: "meta", render: (c) => <>{c.packageName}{c.fee && <span className="text-muted"> · {c.fee}</span>}</> },
    { key: "city", label: "City", sort: (c) => c.city, card: "hide", render: (c) => c.city || "—" },
    { key: "work", label: "Work", sort: (c) => c.overdue * 1000 + c.waiting, card: "badge", render: (c) => <span className="inline-flex flex-wrap gap-1">{c.overdue > 0 && <Badge tone="bad" dot={false}>{c.overdue} overdue</Badge>}{c.waiting > 0 && <Badge tone="warn" dot={false}>{c.waiting} with client</Badge>}{!c.overdue && !c.waiting && <span className="text-muted">—</span>}</span> },
    { key: "renewal", label: "Renewal", sort: (c) => c.renewalDate ?? "9999", card: "meta", className: "whitespace-nowrap", render: (c) => (c.renewalDate ? <span className={c.renewIn !== null && c.renewIn <= 7 && c.renewIn >= 0 ? "font-semibold text-warn" : ""}>{fmtDay(c.renewalDate)}{c.renewIn !== null && c.renewIn >= 0 && c.renewIn <= 30 ? ` · in ${c.renewIn} d` : ""}</span> : "—") },
    { key: "status", label: "Status", sort: (c) => CLIENT_STATUSES.findIndex((s) => s.id === c.status), card: "badge", render: (c) => <Badge tone={TONE[c.status]}>{statusText(c.status)}</Badge> },
  ];
  return (
    <DataTable
      id="clients"
      rows={clients}
      rowKey={(c) => c.id}
      columns={columns}
      initialSort={{ key: "name", dir: "asc" }}
      search={(c) => [c.name, c.city, catLabel(c.category), c.packageName].join(" ")}
      views={[
        { id: "current", label: "Current", test: (c) => c.status === "active" || c.status === "onboarding" },
        { id: "attention", label: "Needs attention", test: (c) => c.overdue > 0 || c.waiting > 0 },
        { id: "renewing", label: "Renewing in 30 days", test: (c) => c.renewIn !== null && c.renewIn >= 0 && c.renewIn <= 30 },
        { id: "paused", label: "Paused", test: (c) => c.status === "paused" },
        { id: "ended", label: "Ended", test: (c) => c.status === "ended" },
        { id: "all", label: "All", test: () => true },
      ]}
      bulk={next ? [] : [{ label: "Pause", run: setStatus("paused") }, { label: "Set active", run: setStatus("active") }]}
      onOpen={(c) => router.push(link(c))}
      actions={(c) => <Link href={link(c)} className={btnSmall}>{next === "approvals" ? "Choose" : "Open"}</Link>}
      empty={<p className="rounded-xl border border-dashed border-edge-strong/60 px-4 py-8 text-center text-[14px] text-muted">No clients here. Convert a lead from the Leads page, or add a client.</p>}
    />
  );
}
