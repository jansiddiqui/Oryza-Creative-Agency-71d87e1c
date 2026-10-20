import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ configured: false, saveLead: vi.fn(), markLeadEmail: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ serviceConfigured: () => db.configured }));
vi.mock("@/lib/leads", () => ({ saveLead: db.saveLead, markLeadEmail: db.markLeadEmail }));

import { POST } from "./route";

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/lead", { method: "POST", body: JSON.stringify(body) }));

const valid = { name: "Asha", phone: "+91 98765 43210", business: "Test School", city: "Kanpur", message: "Hello" };

describe("POST /api/lead", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("LEAD_TO_EMAIL", "");
    vi.stubEnv("LEAD_FROM_EMAIL", "");
    fetchMock.mockReset().mockResolvedValue(new Response("{}", { status: 200 }));
    db.configured = false;
    db.saveLead.mockReset().mockResolvedValue("lead-1");
    db.markLeadEmail.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("emails the lead to contact@oryzaonline.in through Resend", async () => {
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    const sent = JSON.parse(init.body);
    expect(sent.to).toBe("contact@oryzaonline.in");
    expect(sent.from).toMatch(/@oryzaonline\.in>$/);
    expect(sent.subject).toContain("Test School");
    expect(sent.text).toContain("Phone/WhatsApp: +919876543210");
  });

  it("uses LEAD_TO_EMAIL and LEAD_FROM_EMAIL when set", async () => {
    vi.stubEnv("LEAD_TO_EMAIL", "sales@oryzaonline.in");
    vi.stubEnv("LEAD_FROM_EMAIL", "Leads <leads@oryzaonline.in>");
    await post(valid);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.to).toBe("sales@oryzaonline.in");
    expect(sent.from).toBe("Leads <leads@oryzaonline.in>");
  });

  it("rejects a lead without a name or a valid phone", async () => {
    expect((await post({ ...valid, name: "" })).status).toBe(422);
    expect((await post({ ...valid, phone: "12345" })).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("silently drops honeypot submissions", async () => {
    const res = await post({ ...valid, website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports not_configured when the Resend key is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "not_configured" });
  });

  it("reports send_failed when Resend rejects or is unreachable", async () => {
    fetchMock.mockResolvedValueOnce(new Response("domain not verified", { status: 403 }));
    expect((await post(valid)).status).toBe(502);
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    expect((await post(valid)).status).toBe(502);
  });

  it("rejects invalid JSON", async () => {
    const res = await POST(new Request("http://localhost/api/lead", { method: "POST", body: "{" }));
    expect(res.status).toBe(400);
  });

  describe("with the database", () => {
    beforeEach(() => {
      db.configured = true;
    });

    it("saves the lead FIRST, with plan answers and summary, then emails and records it", async () => {
      const order: string[] = [];
      db.saveLead.mockImplementation(async () => (order.push("save"), "lead-1"));
      fetchMock.mockImplementation(async () => (order.push("email"), new Response("{}", { status: 200 })));
      const answers = JSON.stringify({ board: "cbse", goals: ["admissions"] });
      const res = await post({ ...valid, source: "plan-builder", plan: "Package: Growth", answers });
      expect(res.status).toBe(200);
      expect(order).toEqual(["save", "email"]);
      expect(db.saveLead.mock.calls[0][0]).toMatchObject({ source: "plan-builder", planSummary: "Package: Growth", answers: { board: "cbse", goals: ["admissions"] } });
      expect(db.markLeadEmail).toHaveBeenCalledWith("lead-1", true, "");
    });

    it("keeps the lead when the email fails (and tells the visitor it worked)", async () => {
      fetchMock.mockRejectedValueOnce(new Error("network down"));
      const res = await post(valid);
      expect(res.status).toBe(200);
      expect(db.saveLead).toHaveBeenCalledOnce();
      expect(db.markLeadEmail).toHaveBeenCalledWith("lead-1", false, "network down");
    });

    it("keeps the lead when Resend is not configured at all", async () => {
      vi.stubEnv("RESEND_API_KEY", "");
      expect((await post(valid)).status).toBe(200);
      expect(db.markLeadEmail).toHaveBeenCalledWith("lead-1", false, "RESEND_API_KEY is not set");
    });

    it("still emails when the database is down", async () => {
      db.saveLead.mockRejectedValueOnce(new Error("db down"));
      expect((await post(valid)).status).toBe(200);
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it("fails only when both saving and emailing fail", async () => {
      db.saveLead.mockRejectedValueOnce(new Error("db down"));
      fetchMock.mockResolvedValueOnce(new Response("nope", { status: 500 }));
      expect((await post(valid)).status).toBe(502);
    });

    it("ignores answers that are not a small JSON object", async () => {
      await post({ ...valid, answers: "not json" });
      expect(db.saveLead.mock.calls[0][0].answers).toBeNull();
    });
  });
});
