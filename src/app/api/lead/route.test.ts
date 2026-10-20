import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
});
