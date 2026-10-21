import { beforeEach, describe, expect, it, vi } from "vitest";

/* A tiny in-memory stand-in for the Supabase client: enough of the query builder for the approval flow. */
type Row = Record<string, unknown>;
const mem = vi.hoisted(() => ({ tables: {} as Record<string, Row[]>, audits: [] as Row[], rate: true }));

function query(table: string) {
  let rows = () => mem.tables[table] ?? [];
  const filters: ((r: Row) => boolean)[] = [];
  let patch: Row | null = null;
  let inserted: Row[] | null = null;
  const matching = () => rows().filter((r) => filters.every((f) => f(r)));
  const result = () => {
    if (inserted) return { data: inserted, error: null };
    if (patch) {
      const hit = matching();
      for (const r of hit) Object.assign(r, patch);
      return { data: hit, error: null };
    }
    return { data: matching(), error: null };
  };
  const b = {
    select: () => b,
    eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), b),
    in: (c: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[c])), b),
    lte: (c: string, v: string) => (filters.push((r) => String(r[c]) <= v), b),
    gte: (c: string, v: string) => (filters.push((r) => String(r[c]) >= v), b),
    neq: (c: string, v: unknown) => (filters.push((r) => r[c] !== v), b),
    order: () => b,
    limit: () => b,
    insert: (x: Row | Row[]) => {
      inserted = (Array.isArray(x) ? x : [x]).map((r) => ({ id: crypto.randomUUID(), at: new Date().toISOString(), ...r }));
      mem.tables[table] = [...rows(), ...inserted];
      rows = () => mem.tables[table];
      return b;
    },
    update: (p: Row) => ((patch = p), b),
    maybeSingle: async () => ({ data: result().data[0] ?? null, error: null }),
    single: async () => ({ data: result().data[0], error: null }),
    then: (res: (v: unknown) => unknown) => Promise.resolve(result()).then(res),
  };
  return b;
}

vi.mock("@/lib/supabase/admin", () => ({
  serviceConfigured: () => true,
  serviceClient: () => ({
    from: query,
    rpc: async () => ({ data: mem.rate, error: null }),
    storage: { from: () => ({ createSignedUrls: async (paths: string[]) => ({ data: paths.map((p) => ({ path: p, signedUrl: `https://signed.example/${p}` })) }) }) },
  }),
}));
vi.mock("./audit", () => ({ audit: vi.fn(async (actor: string, action: string, target: string, details: Row) => void mem.audits.push({ actor, action, target, details })) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }) }));

const SECRET = "k".repeat(40);
const CLIENT = "00000000-0000-4000-8000-000000000001";
const LINK = "00000000-0000-4000-b000-000000000001";
const I1 = "00000000-0000-4000-c000-000000000001";
const I2 = "00000000-0000-4000-c000-000000000002";
const OTHER = "00000000-0000-4000-c000-000000000009";
const now = new Date("2026-11-10T06:00:00Z");

beforeEach(() => {
  vi.stubEnv("SHARE_LINK_SECRET", SECRET);
  mem.audits = [];
  mem.rate = true;
  const item = (id: string, title: string): Row => ({ id, client_id: CLIENT, plan_id: "p", platform: "instagram", format: "reel", title, hook: "", cta: "", pillar: "", template_id: "X", publish_date: "2026-11-14", publish_time: "7:00 pm", stage: "client_review", assignee: null, compliance_notes: "Doctor approves.", client_approved_at: null, caption_draft: "Caption", asset_links: [`${CLIENT}/${id}/a.jpg`] });
  const task = (id: string, item_id: string, step: string, status: string): Row => ({ id, item_id, client_id: CLIENT, step, label: step, due_date: "2026-11-12", due_time: "", role: "strategist", assignee: null, status, late: false, blocked_reason: "", note: "", completed_at: null });
  mem.tables = {
    clients: [{ id: CLIENT, name: "Sunrise Clinic", category: "hospitals-clinics", colour: "#2f6b4f", status: "active", contact_person: "", phone: "", email: "", city: "", package: "growth", start_date: "2026-11-02", renewal_date: null, notes: "", lead_id: null, created_at: "" }],
    content_items: [item(I1, "Meet our doctors"), item(I2, "OPD timings"), { ...item(OTHER, "Not on the link") }],
    tasks: [task("t1", I1, "edit", "done"), task("t2", I1, "client_approval", "todo"), task("t3", I1, "publish", "todo"), task("t4", I2, "client_approval", "todo"), task("t5", I2, "publish", "todo")],
    approval_links: [{ id: LINK, client_id: CLIENT, item_ids: [I1, I2], label: "Week of 9 Nov", expires_at: "2026-11-17T06:00:00.000Z", revoked_at: null, created_by: "owner@oryza.test", created_at: "2026-11-10T05:00:00Z", last_reminded_at: null, first_response_at: null }],
    approval_responses: [],
  };
});

const token = async () => (await import("@/lib/ops/links")).signLink("approval", LINK, "2026-11-17T06:00:00.000Z", SECRET);

describe("client approval link", () => {
  it("opens only with a valid, unexpired, unrevoked signed token, with signed asset URLs", async () => {
    const { openApprovalLink } = await import("./approvals-data");
    const ok = await openApprovalLink(await token(), now);
    expect(ok.state).toBe("ok");
    if (ok.state === "ok") {
      expect(ok.items.map((x) => x.title)).toEqual(["Meet our doctors", "OPD timings"]);
      expect(ok.items[0]).toMatchObject({ captionDraft: "Caption", complianceNote: "Doctor approves.", assets: [{ url: `https://signed.example/${CLIENT}/${I1}/a.jpg`, kind: "image" }] });
    }
    expect((await openApprovalLink((await token()).slice(0, -2) + "xx", now)).state).toBe("invalid");
    expect((await openApprovalLink(await token(), new Date("2026-11-18T00:00:00Z"))).state).toBe("expired");
    mem.tables.approval_links[0].revoked_at = "2026-11-10T05:30:00Z";
    expect((await openApprovalLink(await token(), now)).state).toBe("revoked");
  });

  it("approval updates the item's stage and tasks instantly and is audited as the client", async () => {
    const { respond } = await import("./approvals-data");
    const res = await respond(await token(), [I1, OTHER], "approved", "", now);
    expect(res).toEqual({ ok: true, count: 1 }); // the item that is not on the link is ignored
    const t2 = mem.tables.tasks.find((t) => t.id === "t2")!;
    expect([t2.status, t2.completed_by]).toEqual(["done", "client (approval link)"]);
    const i1 = mem.tables.content_items.find((x) => x.id === I1)!;
    expect(i1.client_approved_at).toBe(now.toISOString());
    expect(i1.stage).toBe("approved");
    expect(mem.tables.content_items.find((x) => x.id === OTHER)!.client_approved_at).toBeNull();
    expect(mem.audits).toEqual([{ actor: "client (approval link)", action: "client.approved", target: I1, details: { clientId: CLIENT, linkId: LINK } }]);
    expect(mem.tables.approval_links[0].first_response_at).toBe(now.toISOString());
  });

  it("changes requested need a comment, reopen the approval task with it, and are audited", async () => {
    const { respond } = await import("./approvals-data");
    expect((await respond(await token(), [I2], "changes", "  ", now)).ok).toBe(false);
    expect(await respond(await token(), [I2], "changes", "Use the new logo", now)).toEqual({ ok: true, count: 1 });
    const t4 = mem.tables.tasks.find((t) => t.id === "t4")!;
    expect([t4.status, t4.note]).toEqual(["todo", "Client asked for changes: Use the new logo"]);
    expect(mem.tables.content_items.find((x) => x.id === I2)!.client_approved_at).toBeNull();
    expect(mem.audits[0]).toMatchObject({ action: "client.changes_requested", details: { comment: "Use the new logo" } });
  });

  it("an expired or revoked link accepts no answers", async () => {
    const { respond } = await import("./approvals-data");
    expect(await respond(await token(), [I1], "approved", "", new Date("2026-11-18T00:00:00Z"))).toEqual({ ok: false, state: "expired" });
    mem.tables.approval_links[0].revoked_at = "2026-11-10T05:30:00Z";
    expect(await respond(await token(), [I1], "approved", "", now)).toEqual({ ok: false, state: "revoked" });
    expect(mem.tables.approval_responses).toEqual([]);
  });

  it("the public answer endpoint is rate-limited per visitor and checks its input", async () => {
    const { POST } = await import("@/app/share/approve/[token]/answer/route");
    const t = await token();
    const call = (body: unknown) => POST(new Request(`https://x.in/share/approve/${t}/answer`, { method: "POST", body: JSON.stringify(body) }), { params: Promise.resolve({ token: t }) });
    mem.rate = false;
    const limited = await call({ itemIds: [I1], decision: "approved" });
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ ok: false, error: expect.stringMatching(/Too many answers/) });
    expect(mem.tables.approval_responses).toEqual([]);
    mem.rate = true;
    expect((await call({ itemIds: [I1], decision: "maybe" })).status).toBe(400);
    const ok = await call({ itemIds: [I1], decision: "approved" });
    expect([ok.status, await ok.json()]).toEqual([200, { ok: true, count: 1 }]);
    const bad = await POST(new Request("https://x.in/x", { method: "POST", body: JSON.stringify({ itemIds: [I1], decision: "approved" }) }), { params: Promise.resolve({ token: "nope" }) });
    expect(bad.status).toBe(404);
  });
});
