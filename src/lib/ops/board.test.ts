import { beforeEach, describe, expect, it, vi } from "vitest";
import { deriveStage } from "./deadlines";
import { BOARD_COLUMNS, boardMove, offlineNoteProblem, undoChanges, type TaskChange } from "./board";
import type { TaskStatus } from "./types";

type T = { id: string; step: string; status: TaskStatus; due: string };
const reel = (s: Partial<Record<string, TaskStatus>> = {}): T[] =>
  [
    ["script", "2026-11-01"],
    ["design", "2026-11-03"],
    ["client_approval", "2026-11-05"],
    ["schedule", "2026-11-07"],
    ["publish", "2026-11-08"],
  ].map(([step, due]) => ({ id: step, step, due, status: s[step] ?? "todo" }));
const on = { offlineApproval: true };
const off = { offlineApproval: false };
const apply = (tasks: T[], changes: TaskChange[]) => tasks.map((t) => ({ ...t, status: changes.find((c) => c.id === t.id)?.to ?? t.status }));

describe("board drag rules (same rules as the app)", () => {
  it("has the stage columns in order", () => {
    expect(BOARD_COLUMNS).toEqual(["planned", "in_production", "client_review", "approved", "scheduled", "published", "done"]);
  });

  it("planned → in production starts the earliest open task, nothing else", () => {
    const m = boardMove(reel(), "in_production", on);
    expect(m).toEqual({ kind: "tasks", changes: [{ id: "script", step: "script", from: "todo", to: "in_progress" }], label: "Started script" });
  });

  it("→ client review puts the approval step in progress", () => {
    const tasks = reel({ script: "done", design: "done" });
    const m = boardMove(tasks, "client_review", on);
    expect(m.kind).toBe("tasks");
    if (m.kind === "tasks") expect(deriveStage(apply(tasks, m.changes))).toBe("client_review");
  });

  it("every allowed move lands exactly on the target column", () => {
    const cases: [T[], (typeof BOARD_COLUMNS)[number]][] = [
      [reel(), "in_production"],
      [reel({ script: "done", design: "done" }), "client_review"],
      [reel({ script: "done", design: "done", client_approval: "done" }), "scheduled"],
      [reel({ script: "done", design: "done", client_approval: "done" }), "published"],
    ];
    for (const [tasks, to] of cases) {
      const m = boardMove(tasks, to, on);
      expect(m.kind, to).toBe("tasks");
      if (m.kind === "tasks") {
        const stage = deriveStage(apply(tasks, m.changes));
        expect(to === "published" ? ["published", "done"] : [to]).toContain(stage);
      }
    }
  });

  it("refuses moving backwards, onto the same column, or skipping the client", () => {
    expect(boardMove(reel({ script: "in_progress" }), "planned", on).kind).toBe("refuse");
    expect(boardMove(reel(), "planned", on)).toMatchObject({ kind: "refuse", reason: "It is already here." });
    expect(boardMove(reel({ script: "done", design: "done", client_approval: "in_progress" }), "scheduled", on)).toMatchObject({ kind: "refuse", reason: expect.stringMatching(/not approved/) });
    expect(boardMove(reel({ script: "done", design: "done", client_approval: "in_progress" }), "published", on).kind).toBe("refuse");
  });

  it("'done' only after publishing", () => {
    expect(boardMove(reel({ script: "done" }), "done", on)).toMatchObject({ kind: "refuse", reason: "Publish it first." });
    const published = reel({ script: "done", design: "done", client_approval: "done", schedule: "done", publish: "done" }).concat({ id: "check", step: "post_check", due: "2026-11-09", status: "todo" });
    const m = boardMove(published, "done", on);
    expect(m).toMatchObject({ kind: "tasks", changes: [{ id: "check", to: "done" }] });
  });

  it("refuses a post without the matching step", () => {
    const noApproval = reel().filter((t) => t.step !== "client_approval");
    expect(boardMove(noApproval, "client_review", on)).toMatchObject({ kind: "refuse", reason: expect.stringMatching(/no client approval step/) });
    expect(boardMove(noApproval, "approved", on).kind).toBe("refuse");
  });
});

describe("'Client approved' column: only the client link, or a recorded offline approval", () => {
  const waiting = reel({ script: "done", design: "done", client_approval: "in_progress" });

  it("never changes tasks directly — it asks for the offline-approval dialog when allowed", () => {
    expect(boardMove(waiting, "approved", on)).toEqual({ kind: "offline_approval" });
  });

  it("is refused when the owner has switched offline approval off", () => {
    const m = boardMove(waiting, "approved", off);
    expect(m.kind).toBe("refuse");
    if (m.kind === "refuse") expect(m.reason).toMatch(/Only the client can approve/);
  });

  it("requires a short note (5–300 characters)", () => {
    expect(offlineNoteProblem("")).toMatch(/at least 5/);
    expect(offlineNoteProblem("   ok  ")).toMatch(/at least 5/);
    expect(offlineNoteProblem("Approved on WhatsApp by Dr Verma")).toBeNull();
    expect(offlineNoteProblem("x".repeat(301))).toMatch(/under 300/);
  });
});

describe("undo", () => {
  it("reverses each change", () => {
    const c: TaskChange[] = [{ id: "a", step: "script", from: "todo", to: "in_progress" }];
    expect(undoChanges(c)).toEqual([{ id: "a", step: "script", from: "in_progress", to: "todo" }]);
    expect(undoChanges(undoChanges(c))).toEqual(c);
  });
});

/* ---------- the server action: setting, note, channel, audit ---------- */
const m = vi.hoisted(() => ({ allow: true, approveOffline: vi.fn(async () => ({ clientId: "c", taskId: "t", previous: "in_progress" })) }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class extends Error {},
  assertAdmin: async () => ({ email: "design@oryza.test", role: "editor" }),
}));
vi.mock("@/lib/admin/board-data", () => ({
  loadOfflineApproval: async () => m.allow,
  approveOffline: m.approveOffline,
  applyTaskChanges: vi.fn(),
  planBoardMove: vi.fn(),
}));

describe("approveOfflineAction", () => {
  beforeEach(() => {
    m.allow = true;
    m.approveOffline.mockClear();
  });

  it("records who, the note and the channel", async () => {
    const { approveOfflineAction } = await import("@/app/admin/(panel)/items/actions");
    const res = await approveOfflineAction("item-1", "  Approved on WhatsApp at 9 am  ", "whatsapp");
    expect(res.ok).toBe(true);
    expect(m.approveOffline).toHaveBeenCalledWith("item-1", "Approved on WhatsApp at 9 am", "whatsapp", "design@oryza.test");
  }, 30_000);

  it("does nothing when switched off, without a note, or with an unknown channel", async () => {
    const { approveOfflineAction } = await import("@/app/admin/(panel)/items/actions");
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect((await approveOfflineAction("item-1", "ok", "whatsapp")).ok).toBe(false);
    expect((await approveOfflineAction("item-1", "Approved on the phone", "email")).ok).toBe(false);
    m.allow = false;
    expect((await approveOfflineAction("item-1", "Approved on WhatsApp", "whatsapp")).ok).toBe(false);
    expect(m.approveOffline).not.toHaveBeenCalled();
    err.mockRestore();
  }, 30_000);
});
