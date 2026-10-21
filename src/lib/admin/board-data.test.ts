import { beforeEach, describe, expect, it, vi } from "vitest";

const s = vi.hoisted(() => ({
  tasks: [] as { id: string; step: string; status: string; due: string; blockedReason: string }[],
  allow: true as boolean | null,
  audit: vi.fn(),
  updateTask: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  serviceClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: s.allow === null ? null : { allow_offline_approval: s.allow } }) }) }) }) }),
}));
vi.mock("./audit", () => ({ audit: s.audit }));
vi.mock("./ops-data", () => ({
  getItem: async (id: string) => ({ id, clientId: "client-1", clientApproved: false }),
  listTasks: async () => s.tasks,
  updateTask: s.updateTask,
}));

beforeEach(() => {
  s.audit.mockClear();
  s.updateTask.mockClear();
  s.allow = true;
  s.tasks = [
    { id: "t1", step: "design", status: "done", due: "2026-11-03", blockedReason: "" },
    { id: "t2", step: "client_approval", status: "in_progress", due: "2026-11-05", blockedReason: "" },
  ];
});

describe("offline approval (server)", () => {
  it("is on unless the owner switched it off", async () => {
    const { loadOfflineApproval } = await import("./board-data");
    expect(await loadOfflineApproval()).toBe(true);
    s.allow = null;
    expect(await loadOfflineApproval()).toBe(true);
    s.allow = false;
    expect(await loadOfflineApproval()).toBe(false);
  });

  it("marks the approval task done and writes the audit log: who, when (the log's time), note, channel", async () => {
    const { approveOffline } = await import("./board-data");
    await approveOffline("item-1", "Approved on WhatsApp by Dr Verma", "whatsapp", "design@oryza.test");
    expect(s.updateTask).toHaveBeenCalledWith("t2", { status: "done", note: "Approved offline (whatsapp): Approved on WhatsApp by Dr Verma" }, "design@oryza.test");
    expect(s.audit).toHaveBeenCalledWith("design@oryza.test", "client.approved_offline", "item-1", { clientId: "client-1", note: "Approved on WhatsApp by Dr Verma", channel: "whatsapp", taskId: "t2", previous: "in_progress" });
  });

  it("refuses a post that is already approved or has no approval step", async () => {
    const { approveOffline } = await import("./board-data");
    s.tasks[1].status = "done";
    await expect(approveOffline("item-1", "Approved on a call", "call", "a@oryza.test")).rejects.toThrow(/already approved/);
    s.tasks = s.tasks.slice(0, 1);
    await expect(approveOffline("item-1", "Approved on a call", "call", "a@oryza.test")).rejects.toThrow(/no client approval step/);
    expect(s.audit).not.toHaveBeenCalled();
  });

  it("board moves only touch tasks still in the expected state (so Undo never overwrites newer work)", async () => {
    const { applyTaskChanges } = await import("./board-data");
    const n = await applyTaskChanges("item-1", [{ id: "t2", step: "client_approval", from: "todo", to: "in_progress" }, { id: "t1", step: "design", from: "done", to: "in_progress" }], "a@oryza.test");
    expect(n).toBe(1);
    expect(s.updateTask).toHaveBeenCalledTimes(1);
    expect(s.updateTask.mock.calls[0][0]).toBe("t1");
  });
});
