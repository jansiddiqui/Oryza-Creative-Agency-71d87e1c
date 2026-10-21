import { notFound } from "next/navigation";
import { AdminTitle } from "@/components/admin/AdminShell";
import { PlanEditor } from "@/components/admin/ops/PlanEditor";
import { requireAdmin } from "@/lib/admin/auth";
import { getClient, getPlan, listTeam } from "@/lib/admin/ops-data";
import { editWarnings } from "@/lib/ops/rule-check";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Plan" };

export default async function PlanPage({ params, searchParams }: { params: Promise<{ id: string; planId: string }>; searchParams: Promise<{ new?: string }> }) {
  await requireAdmin();
  const { id, planId } = await params;
  if (![id, planId].every((x) => UUID.test(x))) notFound();
  const [plan, client, team] = await Promise.all([getPlan(planId), getClient(id), listTeam()]);
  if (!plan || !client || plan.clientId !== client.id) notFound();
  // The category's wording checks (server-side; the editor re-checks here as you type).
  const warnings: Record<string, string[]> = {};
  for (const x of plan.draft.items) {
    const w = editWarnings(client.category, [x.title, x.hook, x.cta].join(" \n "), plan.answers);
    if (w.length) warnings[x.id] = w;
  }
  return (
    <>
      <AdminTitle title={plan.status === "draft" ? "Plan editor" : "Approved plan"} intro={plan.status === "draft" ? "Edit wording, times and dates, remove or add items and assign people. Compliance notes are locked. Approving creates the content items, tasks and shoot days." : "This plan is approved. Its items now live on the calendar."} />
      <PlanEditor key={plan.id} plan={plan} client={client} team={team} created={(await searchParams).new === "1"} initialWarnings={warnings} />
    </>
  );
}
