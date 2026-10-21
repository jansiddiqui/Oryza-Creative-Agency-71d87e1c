import { AdminTitle, Notice } from "@/components/admin/AdminShell";
import { NewClientForm, type NewClientPrefill } from "@/components/admin/ops/NewClientForm";
import { requireAdmin } from "@/lib/admin/auth";
import { clientForLead, listClients } from "@/lib/admin/ops-data";
import { nextMonday } from "@/lib/engine/dates";
import { getLead } from "@/lib/leads";
import { answersOfLead, clientFromLead } from "@/lib/ops/conversion";
import { CLIENT_COLOURS } from "@/lib/ops/types";
import Link from "next/link";

export const metadata = { title: "New client" };

const blank: NewClientPrefill = { name: "", category: "", contactPerson: "", phone: "", email: "", city: "", notes: "", leadId: null };

export default async function NewClient({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  await requireAdmin();
  const { lead: leadId } = await searchParams;
  const lead = leadId && /^[0-9a-f-]{36}$/i.test(leadId) ? await getLead(leadId) : null;
  const existing = lead ? await clientForLead(lead.id) : null;
  const clients = await listClients();
  const colour = CLIENT_COLOURS[clients.length % CLIENT_COLOURS.length];
  return (
    <>
      <AdminTitle title={lead ? "Convert lead to client" : "Add a client"} intro="Choose the package and start date, check the category answers, and generate the first month's plan with the same planner as the website." />
      {existing ? (
        <Notice>
          This lead is already a client: <Link href={`/admin/clients/${existing.id}`} className="font-semibold underline">{existing.name}</Link>.
        </Notice>
      ) : (
        <NewClientForm
          prefill={lead ? { ...blank, ...clientFromLead(lead), leadName: lead.name } : blank}
          answers={lead ? answersOfLead(lead) : null}
          start={nextMonday()}
          colour={colour}
        />
      )}
    </>
  );
}
