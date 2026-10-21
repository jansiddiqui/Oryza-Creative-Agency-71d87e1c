"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "../ui/DataTable";
import { Badge, btnSmall, ClientDot, fmtDay } from "./ui";

export interface ShootListRow {
  id: string;
  date: string;
  time: string;
  client: string;
  colour: string;
  label: string;
  location: string;
  shooter: string;
  shots: number;
  status: "planned" | "done" | "cancelled";
  clash: boolean;
}

/** Shoots across all clients (upcoming first). */
export function ShootsTable({ rows, today }: { rows: ShootListRow[]; today: string }) {
  const router = useRouter();
  const columns: Column<ShootListRow>[] = [
    { key: "date", label: "Date", sort: (r) => `${r.date} ${r.time}`, card: "title", className: "whitespace-nowrap", render: (r) => <Link href={`/admin/shoots/${r.id}`} className="font-semibold hover:underline">{fmtDay(r.date)}{r.time && ` · ${r.time}`}</Link> },
    { key: "client", label: "Client", sort: (r) => r.client, card: "meta", render: (r) => <span className="inline-flex items-center gap-2"><ClientDot colour={r.colour} />{r.client}</span> },
    { key: "label", label: "Shoot", sort: (r) => r.label, card: "hide", render: (r) => r.label },
    { key: "location", label: "Location", sort: (r) => r.location, card: "meta", render: (r) => r.location || <span className="text-muted">To confirm</span> },
    { key: "shooter", label: "Shooter", sort: (r) => r.shooter, card: "meta", render: (r) => r.shooter || <span className="text-muted">Not assigned</span> },
    { key: "shots", label: "Shots", sort: (r) => r.shots, card: "hide", className: "tabular-nums", render: (r) => r.shots },
    { key: "status", label: "Status", sort: (r) => r.status, card: "badge", render: (r) => <span className="inline-flex gap-1">{r.clash && <Badge tone="bad">Clash</Badge>}<Badge tone={r.status === "done" ? "ok" : r.status === "cancelled" ? "neutral" : "info"}>{r.status === "done" ? "Done" : r.status === "cancelled" ? "Cancelled" : "Planned"}</Badge></span> },
  ];
  return (
    <DataTable
      id="shoots"
      rows={rows}
      rowKey={(r) => r.id}
      columns={columns}
      initialSort={{ key: "date", dir: "asc" }}
      search={(r) => `${r.client} ${r.label} ${r.location} ${r.shooter}`}
      views={[
        { id: "upcoming", label: "Upcoming", test: (r) => r.date >= today && r.status !== "cancelled" },
        { id: "week", label: "Next 7 days", test: (r) => r.date >= today && r.date <= new Date(Date.parse(today) + 6 * 86_400_000).toISOString().slice(0, 10) },
        { id: "unassigned", label: "No shooter", test: (r) => r.date >= today && !r.shooter && r.status === "planned" },
        { id: "past", label: "Past", test: (r) => r.date < today },
        { id: "all", label: "All", test: () => true },
      ]}
      onOpen={(r) => router.push(`/admin/shoots/${r.id}`)}
      actions={(r) => <Link href={`/admin/shoots/${r.id}`} className={btnSmall}>Open</Link>}
      empty={<p className="rounded-xl border border-dashed border-edge-strong/60 px-4 py-8 text-center text-[14px] text-muted">No shoots here. Shoot days are created when a client&apos;s plan is approved.</p>}
    />
  );
}

export interface ReportListRow {
  clientId: string;
  client: string;
  colour: string;
  status: string;
  recorded: number;
  updated: string;
  href: string;
}

/** Every client's report for one month: recorded or not yet. */
export function ReportsTable({ rows }: { rows: ReportListRow[] }) {
  const router = useRouter();
  const columns: Column<ReportListRow>[] = [
    { key: "client", label: "Client", sort: (r) => r.client, card: "title", render: (r) => <Link href={r.href} className="inline-flex items-center gap-2 font-semibold hover:underline"><ClientDot colour={r.colour} />{r.client}</Link> },
    { key: "state", label: "Report", sort: (r) => r.recorded, card: "badge", render: (r) => (r.recorded ? <Badge tone="ok">{r.recorded} numbers recorded</Badge> : <Badge>Not started</Badge>) },
    { key: "updated", label: "Last updated", sort: (r) => r.updated, card: "meta", render: (r) => r.updated || "—" },
    { key: "status", label: "Client status", sort: (r) => r.status, card: "hide", render: (r) => r.status },
  ];
  return (
    <DataTable
      id="reports"
      rows={rows}
      rowKey={(r) => r.clientId}
      columns={columns}
      initialSort={{ key: "client", dir: "asc" }}
      search={(r) => r.client}
      views={[
        { id: "todo", label: "Not started", test: (r) => !r.recorded },
        { id: "done", label: "Recorded", test: (r) => r.recorded > 0 },
        { id: "all", label: "All", test: () => true },
      ]}
      onOpen={(r) => router.push(r.href)}
      actions={(r) => <Link href={r.href} className={btnSmall}>{r.recorded ? "Open" : "Start"}</Link>}
    />
  );
}
