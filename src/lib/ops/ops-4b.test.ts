import { describe, expect, it, vi } from "vitest";
import { approvalReminderDue, digestFor, isDigestWindow, ist, renewalsDue, DIGEST_CRON_UTC } from "./reminders";
import { decisionTaskChange, latestDecisions, CLIENT_ACTOR } from "./approvals";
import { billingSummary, invoiceState, type Invoice } from "./billing";
import { cleanMetrics, deliveryStats, fmtMetric, growth, monthEnd, NOT_RECORDED } from "./report";
import { consentReminders, itemShotsDone, itemsFedBy, mergedShotList, shootMoveChanges } from "./shoots";
import { DEFAULT_ESTIMATES, opsWarnings, slotsOverlap, tasksToReassign, workload, type Member } from "./team";
import { expiryFrom, ipKey, signLink, tokenId, verifyLink } from "./links";
import { DEFAULT_RULES } from "./deadlines";
import type { ItemRow, ShootRow, TaskRow } from "./types";

const task = (x: Partial<TaskRow>): TaskRow => ({ id: "t", itemId: "i", clientId: "c", step: "design", label: "Design", due: "2026-11-10", time: "6:00 pm", role: "designer", assignee: "a@o.in", status: "todo", late: false, blockedReason: "", note: "", ...x });
const shoot = (x: Partial<ShootRow>): ShootRow => ({ id: "s", clientId: "c", date: "2026-11-10", label: "Shoot day 1", shots: [], location: "", shooter: "s@o.in", status: "planned", startTime: "", endTime: "", props: "", people: "", notes: "", ...x });
const item = (x: Partial<ItemRow>): ItemRow => ({ id: "i", clientId: "c", planId: "p", platform: "instagram", format: "reel", title: "T", hook: "", cta: "", pillar: "", templateId: "X", date: "2026-11-14", time: "7:00 pm", stage: "planned", assignee: null, complianceNote: "", clientApproved: false, ...x });
const MonSat = [1, 2, 3, 4, 5, 6];
const members: Member[] = [
  { email: "a@o.in", name: "Asha", active: true, workingDays: MonSat },
  { email: "s@o.in", name: "Sam", active: true, workingDays: [1, 2, 3, 4, 5] },
  { email: "old@o.in", name: "Old", active: false, workingDays: MonSat },
];

describe("capacity maths", () => {
  it("adds estimated hours per person per day and flags over capacity", () => {
    const tasks = [task({ id: "1", step: "edit" }), task({ id: "2", step: "edit" }), task({ id: "3", step: "design" }), task({ id: "4", step: "copy", status: "done" }), task({ id: "5", step: "mystery" })];
    const [a] = workload(tasks, members.slice(0, 1), ["2026-11-10", "2026-11-11"], DEFAULT_ESTIMATES, { capacity: 7 });
    expect(a.days[0]).toMatchObject({ tasks: 4, hours: 7, capacity: 7, over: false });
    const [b] = workload([...tasks, task({ id: "6", step: "script" })], members.slice(0, 1), ["2026-11-10"], DEFAULT_ESTIMATES, { capacity: 7 });
    expect(b.days[0]).toMatchObject({ tasks: 5, hours: 8, over: true });
    expect(a.days[1]).toMatchObject({ tasks: 0, hours: 0 });
  });

  it("counts one shoot per client per day, however many posts it films", () => {
    const ts = [task({ id: "1", step: "shoot", clientId: "c1" }), task({ id: "2", step: "shoot", clientId: "c1" }), task({ id: "3", step: "shoot", clientId: "c1" }), task({ id: "4", step: "shoot", clientId: "c2" })];
    const [a] = workload(ts, members.slice(0, 1), ["2026-11-10"], DEFAULT_ESTIMATES, { capacity: 7 });
    expect(a.days[0]).toMatchObject({ tasks: 4, hours: 6 });
  });

  it("uses a person's own capacity, and zero capacity on days off and leave", () => {
    const [a] = workload([task({ due: "2026-11-15" })], [{ ...members[0], capacityHours: 4 }], ["2026-11-14", "2026-11-15"], DEFAULT_ESTIMATES, { capacity: 7, leave: [{ email: "a@o.in", start: "2026-11-14", end: "2026-11-14" }] });
    expect(a.days[0]).toMatchObject({ capacity: 0, leave: true, off: true });
    expect(a.days[1]).toMatchObject({ capacity: 0, off: true, over: true }); // Sunday
  });
});

describe("clash rules", () => {
  const days = ["2026-11-10", "2026-11-11", "2026-11-14"];
  it("two shoots at the same time for one shooter clash; separate slots do not", () => {
    expect(slotsOverlap({ startTime: "09:00", endTime: "12:00" }, { startTime: "11:00", endTime: "13:00" })).toBe(true);
    expect(slotsOverlap({ startTime: "09:00", endTime: "12:00" }, { startTime: "12:00", endTime: "13:00" })).toBe(false);
    expect(slotsOverlap({ startTime: "", endTime: "" }, { startTime: "15:00", endTime: "16:00" })).toBe(true);
    const w = opsWarnings({ tasks: [], shoots: [shoot({ id: "x", startTime: "09:00", endTime: "12:00" }), shoot({ id: "y", startTime: "11:00", endTime: "14:00" }), shoot({ id: "z", startTime: "15:00", endTime: "17:00" })], members, days, est: DEFAULT_ESTIMATES });
    expect(w.filter((x) => x.kind === "shoot_clash").map((x) => x.refs)).toEqual([["x", "y"]]);
  });

  it("a shoot on the shooter's day off or leave is flagged", () => {
    const w = opsWarnings({ tasks: [], shoots: [shoot({ id: "sat", date: "2026-11-14" }), shoot({ id: "lv", date: "2026-11-11" })], members, days, est: DEFAULT_ESTIMATES, leave: [{ email: "s@o.in", start: "2026-11-11", end: "2026-11-12" }] });
    expect(w.filter((x) => x.kind === "shoot_off_day").map((x) => x.refs[0]).sort()).toEqual(["lv", "sat"]);
    expect(w.find((x) => x.refs[0] === "lv")?.message).toMatch(/on leave/);
  });

  it("tasks assigned to an inactive person, or on someone's leave, are flagged; cancelled shoots are ignored", () => {
    const w = opsWarnings({ tasks: [task({ id: "1", assignee: "old@o.in" }), task({ id: "2", assignee: "old@o.in", status: "done" }), task({ id: "3", due: "2026-11-11" })], shoots: [shoot({ status: "cancelled", date: "2026-11-14" })], members, days, est: DEFAULT_ESTIMATES, leave: [{ email: "a@o.in", start: "2026-11-11", end: "2026-11-11" }] });
    expect(w.map((x) => [x.kind, x.refs])).toEqual([["leave_assignee", ["3"]], ["inactive_assignee", ["1"]]]); // a leave day is reported once, not also as over capacity
  });
});

describe("leave reassignment", () => {
  it("moves only the person's open tasks inside the leave dates", () => {
    const ts = [task({ id: "1", due: "2026-11-09" }), task({ id: "2", due: "2026-11-10" }), task({ id: "3", due: "2026-11-12", status: "done" }), task({ id: "4", due: "2026-11-12" }), task({ id: "5", due: "2026-11-13" }), task({ id: "6", assignee: "s@o.in", due: "2026-11-10" })];
    expect(tasksToReassign(ts, "a@o.in", { start: "2026-11-10", end: "2026-11-12" }).map((t) => t.id)).toEqual(["2", "4"]);
    expect(tasksToReassign(ts, "a@o.in").map((t) => t.id)).toEqual(["1", "2", "4", "5"]);
  });
});

describe("shoot-day planner", () => {
  const items = [item({ id: "r1", title: "Meet our doctors", hook: "Who treats you?", complianceNote: "Doctor approves." }), item({ id: "r2", title: "OPD walkthrough", date: "2026-11-20" }), item({ id: "p1", format: "post", title: "Timings" }), item({ id: "o", clientId: "other" })];
  const tasks = [task({ itemId: "r1", step: "shoot", due: "2026-11-10" }), task({ itemId: "r2", step: "shoot", due: "2026-11-10" }), task({ itemId: "o", step: "shoot", due: "2026-11-10" }), task({ itemId: "p1", step: "design", due: "2026-11-10" })];

  it("finds the items a shoot feeds and merges one shot list", () => {
    const fed = itemsFedBy(shoot({}), items, tasks);
    expect(fed.map((x) => x.id)).toEqual(["r1", "r2"]);
    const list = mergedShotList(shoot({ shots: ["Reception wide shot", "Reception wide shot", "Doctor at desk"] }), fed);
    expect(list.map((s) => [s.itemId, s.label])).toEqual([
      [null, "Reception wide shot"],
      [null, "Doctor at desk"],
      ["r1", "Reel: Meet our doctors — hook: Who treats you?"],
      ["r2", "Reel: OPD walkthrough"],
    ]);
  });

  it("collects consent reminders from the plan and the items", () => {
    expect(consentReminders(["No patient faces without written consent.", "Awareness days are verified first."], [{ complianceNote: "Doctor approves." }])).toEqual(["No patient faces without written consent.", "Doctor approves."]);
  });

  it("an item's shots are done only when all of them are", () => {
    const shots = [{ itemId: "r1", done: true }, { itemId: "r1", done: false }, { itemId: "r2", done: true }, { itemId: null, done: false }];
    expect(itemShotsDone(shots, "r1")).toBe(false);
    expect(itemShotsDone(shots, "r2")).toBe(true);
    expect(itemShotsDone(shots, "x")).toBe(false);
  });

  it("moving a shoot recalculates the fed items' open tasks", () => {
    const t = [task({ id: "sh", itemId: "r1", step: "shoot", label: "Shoot (shoot day)", due: "2026-11-10" }), task({ id: "ed", itemId: "r1", step: "edit", label: "Edit", due: "2026-11-12" })];
    const changes = shootMoveChanges({ newDate: "2026-11-09", fed: [items[0]], tasks: t, otherShootDates: [], rules: DEFAULT_RULES, today: "2026-11-01" });
    expect(changes).toEqual([{ id: "sh", due: "2026-11-09", label: "Shoot (shoot day)", late: false, itemId: "r1", itemTitle: "Meet our doctors", from: "2026-11-10" }]);
    const late = shootMoveChanges({ newDate: "2026-11-12", fed: [items[0]], tasks: t, otherShootDates: [], rules: DEFAULT_RULES, today: "2026-11-01" });
    expect(late[0]).toMatchObject({ id: "sh", label: "Client sends footage", due: "2026-11-10" });
  });
});

describe("approval links", () => {
  const secret = "s".repeat(40);
  const row = { id: "0b7d8a0e-1c3e-4c55-9f1a-2a3b4c5d6e7f", expiresAt: "2026-11-17T04:30:00.000Z", revokedAt: null };
  const now = new Date("2026-11-10T04:30:00Z");

  it("signs and verifies; tampering, another kind or another secret fail", () => {
    const t = signLink("approval", row.id, row.expiresAt, secret);
    expect(tokenId(t)).toBe(row.id);
    expect(verifyLink("approval", t, row, secret, now)).toBe("ok");
    expect(verifyLink("report", t, row, secret, now)).toBe("invalid");
    expect(verifyLink("approval", t, row, "t".repeat(40), now)).toBe("invalid");
    expect(verifyLink("approval", t.slice(0, -1) + (t.endsWith("A") ? "B" : "A"), row, secret, now)).toBe("invalid");
    expect(verifyLink("approval", t, { ...row, expiresAt: "2026-11-30T04:30:00.000Z" }, secret, now)).toBe("invalid"); // extended in the DB
    expect(verifyLink("approval", "garbage", row, secret, now)).toBe("invalid");
    expect(verifyLink("approval", t, null, secret, now)).toBe("invalid");
  });

  it("expires after 7 days and can be revoked", () => {
    const exp = expiryFrom(now);
    expect(exp).toBe("2026-11-17T04:30:00.000Z");
    const t = signLink("approval", row.id, exp, secret);
    expect(verifyLink("approval", t, { ...row, expiresAt: exp }, secret, new Date("2026-11-17T04:29:59Z"))).toBe("ok");
    expect(verifyLink("approval", t, { ...row, expiresAt: exp }, secret, new Date("2026-11-17T04:30:00Z"))).toBe("expired");
    expect(verifyLink("approval", t, { ...row, expiresAt: exp, revokedAt: "2026-11-11T00:00:00Z" }, secret, now)).toBe("revoked");
  });

  it("works with the database's timestamp format", () => {
    const t = signLink("approval", row.id, "2026-11-17 04:30:00+00", secret);
    expect(verifyLink("approval", t, { ...row, expiresAt: "2026-11-17T04:30:00+00:00" }, secret, now)).toBe("ok");
  });

  it("never stores the IP: only a salted hash", () => {
    expect(ipKey("203.0.113.9", secret)).toMatch(/^[0-9a-f]{32}$/);
    expect(ipKey("203.0.113.9", secret)).not.toContain("203");
  });

  it("approval completes the client-approval task; changes reopen it with the comment", () => {
    const ts = [task({ id: "ca", step: "client_approval", status: "todo" }), task({ id: "ed", step: "edit" })];
    expect(decisionTaskChange(ts, "approved")).toEqual({ id: "ca", status: "done", note: "", completedBy: CLIENT_ACTOR });
    expect(decisionTaskChange(ts, "changes", "Use the new logo")).toEqual({ id: "ca", status: "todo", note: "Client asked for changes: Use the new logo", completedBy: null });
    expect(decisionTaskChange([task({ step: "prepare" })], "approved")).toBeNull();
    const latest = latestDecisions([{ itemId: "a", decision: "changes" as const, at: "2026-11-10T10:00:00Z" }, { itemId: "a", decision: "approved" as const, at: "2026-11-10T11:00:00Z" }]);
    expect(latest.get("a")?.decision).toBe("approved");
  });
});

describe("reminders: who gets what, and when (IST)", () => {
  it("the digest cron is 8:45 am IST", () => {
    expect(DIGEST_CRON_UTC).toBe("15 3 * * *");
    expect(ist(new Date("2026-11-10T03:15:00Z"))).toEqual({ date: "2026-11-10", minutes: 8 * 60 + 45 });
    expect(isDigestWindow(new Date("2026-11-10T03:15:00Z"))).toBe(true);
    expect(isDigestWindow(new Date("2026-11-10T12:00:00Z"))).toBe(false);
    expect(ist(new Date("2026-11-09T19:00:00Z")).date).toBe("2026-11-10"); // 00:30 IST next day
  });

  it("each person gets only their overdue, due-today and shoots; opted-out or inactive people get nothing", () => {
    const tasks = [task({ id: "o", due: "2026-11-08" }), task({ id: "d", due: "2026-11-10" }), task({ id: "f", due: "2026-11-11" }), task({ id: "x", due: "2026-11-08", status: "done" }), task({ id: "s", assignee: "s@o.in" })];
    const d = digestFor({ email: "a@o.in", name: "Asha", active: true, optOut: false }, tasks, [shoot({ shooter: "a@o.in" })], "2026-11-10");
    expect([d?.overdue.map((t) => t.id), d?.dueToday.map((t) => t.id), d?.shoots.length]).toEqual([["o"], ["d"], 1]);
    expect(digestFor({ email: "a@o.in", name: "Asha", active: true, optOut: true }, tasks, [], "2026-11-10")).toBeNull();
    expect(digestFor({ email: "a@o.in", name: "Asha", active: false, optOut: false }, tasks, [], "2026-11-10")).toBeNull();
    expect(digestFor({ email: "z@o.in", name: "Zed", active: true, optOut: false }, tasks, [], "2026-11-10")).toBeNull();
  });

  it("an approval reminder goes once, 24 h after sending, only without a response", () => {
    const l = { id: "l", createdAt: "2026-11-09T04:00:00Z", expiresAt: "2026-11-16T04:00:00Z", revokedAt: null, firstResponseAt: null, lastRemindedAt: null };
    expect(approvalReminderDue(l, new Date("2026-11-10T03:59:00Z"))).toBe(false);
    expect(approvalReminderDue(l, new Date("2026-11-10T04:00:00Z"))).toBe(true);
    expect(approvalReminderDue({ ...l, firstResponseAt: "2026-11-09T09:00:00Z" }, new Date("2026-11-11T00:00:00Z"))).toBe(false);
    expect(approvalReminderDue({ ...l, lastRemindedAt: "2026-11-10T04:00:00Z" }, new Date("2026-11-11T00:00:00Z"))).toBe(false);
    expect(approvalReminderDue({ ...l, revokedAt: "2026-11-09T05:00:00Z" }, new Date("2026-11-11T00:00:00Z"))).toBe(false);
    expect(approvalReminderDue(l, new Date("2026-11-16T04:00:00Z"))).toBe(false);
  });

  it("renewal reminders 15, 7 and 1 day before; never for ended clients", () => {
    const cs = [
      { id: "a", renewalDate: "2026-11-25", status: "active" as const },
      { id: "b", renewalDate: "2026-11-17", status: "active" as const },
      { id: "c", renewalDate: "2026-11-11", status: "paused" as const },
      { id: "d", renewalDate: "2026-11-12", status: "active" as const },
      { id: "e", renewalDate: "2026-11-11", status: "ended" as const },
      { id: "f", renewalDate: null, status: "active" as const },
    ];
    expect(renewalsDue(cs, "2026-11-10").map((r) => [r.client.id, r.days])).toEqual([["a", 15], ["b", 7], ["c", 1]]);
  });
});

describe("monthly report", () => {
  it("keeps only recorded numbers; blanks are 'Not recorded', never zero", () => {
    const m = cleanMetrics({ instagram: { followers_start: "1,200", followers_end: 1350, reach: "", engagement: "abc", calls: 5 }, gbp: { calls: "0", directions: null }, made_up: { x: 1 } });
    expect(m).toEqual({ instagram: { followers_start: 1200, followers_end: 1350 }, gbp: { calls: 0 } });
    expect(fmtMetric(m.instagram?.reach)).toBe(NOT_RECORDED);
    expect(fmtMetric(m.gbp?.calls)).toBe("0");
    expect(fmtMetric(m.gbp?.directions)).toBe(NOT_RECORDED);
    expect(growth(m, "instagram")).toBe(150);
    expect(growth(m, "facebook")).toBeUndefined();
  });

  it("delivery stats: planned vs published and on-time %", () => {
    const items = [item({ id: "a", date: "2026-11-05", stage: "published" }), item({ id: "b", date: "2026-11-06", stage: "done" }), item({ id: "c", date: "2026-11-07", stage: "scheduled" }), item({ id: "d", date: "2026-12-01", stage: "published" })];
    const tasks = [
      { itemId: "a", step: "publish", status: "done" as const, completedAt: "2026-11-05T13:00:00Z" },
      { itemId: "b", step: "publish", status: "done" as const, completedAt: "2026-11-06T19:00:00Z" }, // 00:30 IST on the 7th = late
    ];
    expect(deliveryStats(items, tasks, "2026-11-01")).toEqual({ planned: 3, published: 2, onTime: 1, onTimePct: 50 });
    expect(deliveryStats([], [], "2026-11-01").onTimePct).toBeUndefined();
    expect(monthEnd("2026-02-01")).toBe("2026-02-28");
  });
});

describe("billing", () => {
  const inv = (x: Partial<Invoice>): Invoice => ({ id: "i", clientId: "c", number: "ORY-1", issuedOn: "2026-11-01", dueOn: "2026-11-15", amount: 10000, status: "due", paidOn: null, mode: "", notes: "", ...x });
  it("unpaid past the due date is overdue; paid stays paid", () => {
    expect(invoiceState(inv({}), "2026-11-15")).toBe("due");
    expect(invoiceState(inv({}), "2026-11-16")).toBe("overdue");
    expect(invoiceState(inv({ status: "paid", paidOn: "2026-11-20" }), "2026-12-01")).toBe("paid");
  });
  it("dues this month, overdue and upcoming renewals", () => {
    const s = billingSummary(
      [inv({ id: "1", dueOn: "2026-11-20" }), inv({ id: "2", dueOn: "2026-11-05", amount: 5000 }), inv({ id: "3", dueOn: "2026-12-05" }), inv({ id: "4", status: "paid", paidOn: "2026-11-03", amount: 7000 })],
      [{ id: "a", renewalDate: "2026-11-30", status: "active" }, { id: "b", renewalDate: "2027-01-30", status: "active" }, { id: "c", renewalDate: "2026-11-20", status: "ended" }],
      "2026-11-10",
    );
    expect([s.dueThisMonth.map((i) => i.id), s.overdue.map((i) => i.id), s.renewals.map((c) => c.id), s.totals]).toEqual([["1"], ["2"], ["a"], { overdue: 5000, dueThisMonth: 10000, paidThisMonth: 7000 }]);
  });
});

vi.unstubAllEnvs();
