import { describe, expect, it } from "vitest";
import { generateSchoolPlan } from "@/lib/engine/school-engine";
import { schoolVariants } from "@/lib/engine/school-variants";
import { generateHospitalPlan } from "@/lib/engine/medical-engine";
import { hospitalVariants } from "@/lib/engine/medical-variants";
import { approvalBundle } from "./approval";
import { filterItems, isOverdue, monthGrid, shift, viewRange, weekDays } from "./calendar";
import { answersOfLead, categoryOfLead, clientFromLead, defaultRenewal, generateClientPlan, nextMonthStart, type LeadLike } from "./conversion";
import { DEFAULT_RULES, deriveStage, planTasks, recalcTasks, rulesFor, todayIST, workingDayOnOrBefore } from "./deadlines";
import { addCustomItem, complianceKept, draftFromPlan, mergeDraft, moveItem, removeItem, updateItem } from "./plan-draft";
import { editWarnings } from "./rule-check";
import { groupToday } from "./today";
import type { ClientLite, ItemRow, ShootRow, TaskRow } from "./types";

/* ------------------------------------------------------------------ deadline maths */
describe("deadline maths", () => {
  const ctx = { shootDates: [] as string[], today: "2026-11-01" };

  it("works a reel back from its publish date (Mon–Sat working days)", () => {
    // Publish Thu 12 Nov 2026.
    const t = planTasks({ date: "2026-11-12", format: "reel" }, { ...ctx, shootDates: ["2026-11-07"] });
    const by = Object.fromEntries(t.map((x) => [x.step, x]));
    expect(by.script.due).toBe("2026-11-07"); // D-5
    expect(by.shoot.due).toBe("2026-11-07"); // nearest shoot day on or before D-3 (9 Nov)
    expect(by.shoot.label).toBe("Shoot (shoot day)");
    expect(by.edit.due).toBe("2026-11-10"); // D-2
    expect(by.client_approval.due).toBe("2026-11-11");
    expect(by.schedule.due).toBe("2026-11-11");
    expect(by.publish.due).toBe("2026-11-12");
    expect(by.post_check.due).toBe("2026-11-13");
    expect(t.map((x) => x.step)).toEqual(["script", "shoot", "edit", "client_approval", "schedule", "publish", "post_check"]);
  });

  it("uses “client sends footage” at D-4 when no shoot day is early enough", () => {
    const t = planTasks({ date: "2026-11-12", format: "reel" }, { ...ctx, shootDates: ["2026-11-10"] });
    const shoot = t.find((x) => x.step === "shoot")!;
    expect(shoot.label).toBe("Client sends footage");
    expect(shoot.due).toBe("2026-11-07"); // D-4 = Sun 8 Nov → moved earlier to Sat 7 Nov
  });

  it("moves due dates that fall on a non-working day earlier, but never the publish date", () => {
    expect(workingDayOnOrBefore("2026-11-08")).toBe("2026-11-07"); // Sunday → Saturday
    expect(workingDayOnOrBefore("2026-11-09")).toBe("2026-11-09");
    expect(workingDayOnOrBefore("2026-11-07", [1, 2, 3, 4, 5])).toBe("2026-11-06"); // Mon–Fri: Saturday → Friday
    // Post published Monday 16 Nov: client approval D-1 = Sunday → Saturday; publish stays Monday.
    const t = planTasks({ date: "2026-11-16", format: "post" }, ctx);
    expect(t.find((x) => x.step === "client_approval")!.due).toBe("2026-11-14");
    expect(t.find((x) => x.step === "publish")!.due).toBe("2026-11-16");
    // A Sunday publish date stays on Sunday.
    expect(planTasks({ date: "2026-11-15", format: "story" }, ctx).find((x) => x.step === "publish")!.due).toBe("2026-11-15");
  });

  it("flags tasks already past their due date as late", () => {
    const t = planTasks({ date: "2026-11-04", format: "post" }, { ...ctx, today: "2026-11-02" });
    expect(t.filter((x) => x.late).map((x) => x.step)).toEqual(["copy", "design"]);
    expect(t.filter((x) => !x.late).map((x) => x.step)).toEqual(["client_approval", "schedule", "publish"]);
  });

  it("has steps for every format the engine produces, with a default fallback", () => {
    for (const f of ["reel", "post", "story", "short", "video", "blog", "gpost", "broadcast", "status", "event", "pin"]) expect(rulesFor(f).some((r) => r.step === "publish"), f).toBe(true);
    expect(rulesFor("something-new").map((r) => r.step)).toEqual(["prepare", "publish"]);
    expect(rulesFor("carousel").map((r) => r.step)).toEqual(["copy", "design", "client_approval", "schedule", "publish"]);
    expect(planTasks({ date: "2026-11-12", format: "story" }, ctx).map((x) => x.step)).toEqual(["prepare", "publish"]);
  });

  it("recalculates open tasks when an item moves; finished tasks keep their dates", () => {
    const planned = planTasks({ date: "2026-11-12", format: "post" }, ctx);
    const tasks = planned.map((t, i) => ({ id: `t${i}`, step: t.step, status: i === 0 ? ("done" as const) : ("todo" as const), due: t.due, label: t.label, late: t.late }));
    const changes = recalcTasks(tasks, { date: "2026-11-19", format: "post" }, ctx);
    expect(changes.find((c) => c.id === "t0")).toBeUndefined(); // copy was done
    expect(changes.find((c) => c.id === tasks.find((t) => t.step === "design")!.id)!.due).toBe("2026-11-16");
    expect(changes.find((c) => c.id === tasks.find((t) => t.step === "publish")!.id)!.due).toBe("2026-11-19");
    // Moving earlier past today flags the open tasks late.
    const early = recalcTasks(tasks, { date: "2026-11-02", format: "post" }, ctx);
    expect(early.filter((c) => c.late).length).toBeGreaterThan(0);
  });

  it("derives an item's stage from its tasks", () => {
    const t = (step: string, status: TaskRow["status"]) => ({ step, status });
    expect(deriveStage([])).toBe("planned");
    expect(deriveStage([t("copy", "todo"), t("publish", "todo")])).toBe("planned");
    expect(deriveStage([t("copy", "done"), t("client_approval", "todo"), t("publish", "todo")])).toBe("in_production");
    expect(deriveStage([t("copy", "done"), t("client_approval", "in_progress"), t("publish", "todo")])).toBe("client_review");
    expect(deriveStage([t("copy", "done"), t("client_approval", "done"), t("schedule", "todo"), t("publish", "todo")])).toBe("approved");
    expect(deriveStage([t("client_approval", "done"), t("schedule", "done"), t("publish", "todo")])).toBe("scheduled");
    expect(deriveStage([t("publish", "done"), t("post_check", "todo")])).toBe("published");
    expect(deriveStage([t("publish", "done"), t("post_check", "done")])).toBe("done");
  });

  it("knows today in India", () => {
    expect(todayIST(new Date("2026-11-01T20:00:00Z"))).toBe("2026-11-02"); // 1:30 am IST next day
    expect(todayIST(new Date("2026-11-01T10:00:00Z"))).toBe("2026-11-01");
  });
});

/* ------------------------------------------------------------------ lead → client → plan */
describe("lead → client → plan", () => {
  const lead: LeadLike = {
    id: "lead-1", name: "Asha Verma", phone: "+919876543210", business: "Sunrise Public School", category: "Schools", city: "Kanpur", message: "Admissions help",
    answers: { category: "schools", ...schoolVariants.base, startDate: undefined } as unknown as Record<string, unknown>,
  };

  it("pre-fills the client from the lead and finds the category", () => {
    expect(clientFromLead(lead)).toEqual({ name: "Sunrise Public School", category: "schools", contactPerson: "Asha Verma", phone: "+919876543210", city: "Kanpur", notes: "Admissions help", leadId: "lead-1" });
    expect(categoryOfLead({ ...lead, answers: null, category: "Real estate" })).toBe("real-estate");
    expect(categoryOfLead({ ...lead, answers: null, category: "Something else" })).toBe("");
    expect(answersOfLead({ ...lead, answers: null })).toBeNull();
    expect(answersOfLead(lead)).not.toHaveProperty("category");
  });

  it("generates exactly the public engine's plan for the same answers", async () => {
    const answers = answersOfLead(lead)!;
    const viaAdmin = await generateClientPlan("schools", answers, "2026-10-26");
    const direct = generateSchoolPlan({ ...schoolVariants.base, events: schoolVariants.base.events.filter((e) => e.date), startDate: "2026-10-26" });
    expect(JSON.stringify(viaAdmin)).toBe(JSON.stringify(direct));
    const hosp = await generateClientPlan("hospitals-clinics", { ...hospitalVariants.base }, hospitalVariants.base.startDate);
    expect(JSON.stringify(hosp)).toBe(JSON.stringify(generateHospitalPlan(hospitalVariants.base)));
  });

  it("the package chosen in admin overrides the lead's", async () => {
    const p = await generateClientPlan("schools", answersOfLead(lead)!, "2026-10-26", "premium");
    expect(p.pkg.id).toBe("premium");
  });

  it("sets sensible dates for renewal and the next month", () => {
    expect(defaultRenewal("2026-11-02")).toBe("2026-12-01");
    expect(nextMonthStart("2026-11-02")).toBe("2026-12-02");
  });
});

/* ------------------------------------------------------------------ plan editor */
describe("plan editor", () => {
  const plan = generateHospitalPlan(hospitalVariants.base);
  const draft = draftFromPlan(plan);
  const noted = draft.items.find((x) => x.complianceNote)!;

  it("turns every plan item into an editable draft item with its compliance note", () => {
    expect(draft.items.length).toBe(plan.days.reduce((n, d) => n + d.items.length, 0));
    expect(draft.compliance).toEqual(plan.compliance);
    expect(noted.complianceNote.length).toBeGreaterThan(0);
  });

  it("edits wording, time, date and assignee — never the compliance note", () => {
    const d = updateItem(draft, noted.id, { title: "New title", hook: "New hook", cta: "New CTA", time: "7:00 pm", date: "2026-11-20", assignee: "a@oryza.test", complianceNote: "" } as never);
    const x = d.items.find((i) => i.id === noted.id)!;
    expect([x.title, x.hook, x.cta, x.time, x.date, x.assignee]).toEqual(["New title", "New hook", "New CTA", "7:00 pm", "2026-11-20", "a@oryza.test"]);
    expect(x.complianceNote).toBe(noted.complianceNote);
    expect(moveItem(draft, noted.id, "bad-date").items.find((i) => i.id === noted.id)!.date).toBe(noted.date);
  });

  it("removes items and adds custom ones", () => {
    const d = addCustomItem(removeItem(draft, noted.id), { date: "2026-11-10", platform: "instagram", format: "post", title: "Custom post" });
    expect(d.items.some((i) => i.id === noted.id)).toBe(false);
    const c = d.items.find((i) => i.custom)!;
    expect(c).toMatchObject({ id: "c1", title: "Custom post", complianceNote: "", templateId: "CUSTOM" });
  });

  it("compliance notes cannot be removed or rewritten through a saved draft", () => {
    const tampered = {
      ...draft,
      compliance: [],
      items: draft.items.map((i) => (i.id === noted.id ? { ...i, complianceNote: "", title: "Edited" } : i)),
    };
    expect(complianceKept(draft, tampered)).toBe(false);
    const merged = mergeDraft(draft, tampered);
    expect(complianceKept(draft, merged)).toBe(true);
    expect(merged.compliance).toEqual(draft.compliance);
    expect(merged.items.find((i) => i.id === noted.id)).toMatchObject({ title: "Edited", complianceNote: noted.complianceNote });
    // Items that don't exist in the stored draft (and aren't custom) are dropped; custom ones are kept, without a note.
    const sneaky = mergeDraft(draft, { ...draft, items: [...draft.items, { ...noted, id: "i99-9", custom: false }, { ...noted, id: "c7", custom: true, complianceNote: "fake" }] });
    expect(sneaky.items.some((i) => i.id === "i99-9")).toBe(false);
    expect(sneaky.items.find((i) => i.id === "c7")!.complianceNote).toBe("");
  });

  it("warns when an edit breaks the category's rules (same word checks as the engine)", () => {
    expect(editWarnings("hospitals-clinics", "The best cure in town")[0]).toMatch(/“best”|“cure”/);
    expect(editWarnings("hospitals-clinics", "The best heart care — guaranteed results.")).toEqual([expect.stringMatching(/^“best”, “guaranteed” break this category/)]);
    expect(editWarnings("hospitals-clinics", "Meet our cardiology team")).toEqual([]);
    expect(editWarnings("real-estate", "Assured returns of 12%").length).toBeGreaterThan(0);
    expect(editWarnings("retail-showrooms", "Was ₹40,000, now ₹32,000").join(" ")).toMatch(/earlier price/);
    expect(editWarnings("professionals", "Book a consultation today", { profession: "lawyer" }).join(" ")).toMatch(/solicitation/);
    expect(editWarnings("professionals", "Book a consultation today", { profession: "consultant" })).toEqual([]);
    expect(editWarnings("creators", "Guaranteed stock tips").length).toBeGreaterThan(0);
    expect(editWarnings("schools", "Admissions open")).toEqual([]);
  });
});

/* ------------------------------------------------------------------ approval */
describe("approving a plan", () => {
  it("creates one content item per calendar item, their tasks and the shoot days", () => {
    const plan = generateSchoolPlan(schoolVariants.base);
    const draft = draftFromPlan(plan);
    const b = approvalBundle(draft, { today: "2026-10-26" });
    const expectedTasks = draft.items.reduce((n, i) => n + DEFAULT_RULES.filter((r) => r.format === (DEFAULT_RULES.some((x) => x.format === i.format) ? i.format : "default")).length, 0);
    expect(b.counts.items).toBe(draft.items.length);
    expect(b.counts.shoots).toBe(plan.shootDays.length);
    expect(b.counts.tasks).toBe(expectedTasks);
    // Early items in the plan have production steps before "today", so some are late at approval.
    expect(b.counts.late).toBeGreaterThan(0);
    const reel = b.items.find((x) => x.item.format === "reel")!;
    expect(reel.tasks.find((t) => t.step === "shoot")).toBeDefined();
  });

  it("removed items are not created; custom items are", () => {
    const draft = draftFromPlan(generateSchoolPlan(schoolVariants.base));
    const edited = addCustomItem(removeItem(draft, draft.items[0].id), { date: "2026-11-10", platform: "instagram", format: "post", title: "Custom" });
    const b = approvalBundle(edited, { today: "2026-10-26" });
    expect(b.counts.items).toBe(draft.items.length);
    expect(b.items.some((x) => x.item.id === draft.items[0].id)).toBe(false);
    expect(b.items.some((x) => x.item.custom)).toBe(true);
  });
});

/* ------------------------------------------------------------------ calendar + today */
const item = (over: Partial<ItemRow>): ItemRow => ({
  id: "x", clientId: "c1", planId: "p1", platform: "instagram", format: "post", title: "T", hook: "", cta: "", pillar: "", templateId: "P01", date: "2026-11-10", time: "1:30 pm",
  stage: "planned", assignee: null, complianceNote: "", clientApproved: false, ...over,
});
const task = (over: Partial<TaskRow>): TaskRow => ({
  id: "t", itemId: "x", clientId: "c1", step: "copy", label: "Copy", due: "2026-11-05", time: "6:00 pm", role: "strategist", assignee: null, status: "todo", late: false, blockedReason: "", note: "", ...over,
});

describe("master calendar", () => {
  const clients: ClientLite[] = [
    { id: "c1", name: "School", category: "schools", colour: "#8f5e0a", status: "active" },
    { id: "c2", name: "Clinic", category: "hospitals-clinics", colour: "#2f6b4f", status: "active" },
  ];
  const items = [
    item({ id: "a", clientId: "c1", platform: "instagram", format: "reel", stage: "planned", assignee: "x@o.test" }),
    item({ id: "b", clientId: "c2", platform: "facebook", format: "post", stage: "scheduled" }),
    item({ id: "c", clientId: "c2", platform: "instagram", format: "story", stage: "published", date: "2026-11-01" }),
  ];

  it("filters by client, platform, format, stage, assignee and category", () => {
    expect(filterItems(items, clients, { client: "c2" }).map((x) => x.id)).toEqual(["b", "c"]);
    expect(filterItems(items, clients, { platform: "instagram" }).map((x) => x.id)).toEqual(["a", "c"]);
    expect(filterItems(items, clients, { format: "reel" }).map((x) => x.id)).toEqual(["a"]);
    expect(filterItems(items, clients, { stage: "scheduled" }).map((x) => x.id)).toEqual(["b"]);
    expect(filterItems(items, clients, { assignee: "x@o.test" }).map((x) => x.id)).toEqual(["a"]);
    expect(filterItems(items, clients, { category: "hospitals-clinics" }).map((x) => x.id)).toEqual(["b", "c"]);
    expect(filterItems(items, clients, { category: "hospitals-clinics", platform: "facebook" }).map((x) => x.id)).toEqual(["b"]);
  });

  it("marks overdue items: past publish date and not published, or an open task past due", () => {
    expect(isOverdue(item({ date: "2026-11-01" }), [], "2026-11-05")).toBe(true);
    expect(isOverdue(item({ date: "2026-11-01", stage: "published" }), [], "2026-11-05")).toBe(false);
    expect(isOverdue(item({ date: "2026-11-10" }), [task({ due: "2026-11-04" })], "2026-11-05")).toBe(true);
    expect(isOverdue(item({ date: "2026-11-10" }), [task({ due: "2026-11-04", status: "done" })], "2026-11-05")).toBe(false);
  });

  it("builds Monday-first month and week grids", () => {
    const g = monthGrid("2026-11-18");
    expect(g[0][0]).toBe("2026-10-26");
    expect(g[g.length - 1][6]).toBe("2026-12-06");
    expect(g.every((w) => w.length === 7)).toBe(true);
    expect(weekDays("2026-11-18")).toEqual(["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"]);
    expect(shift("month", "2026-11-18", 1)).toBe("2026-12-01");
    expect(shift("week", "2026-11-18", -1)).toBe("2026-11-11");
    expect(viewRange("week", "2026-11-18")).toEqual({ from: "2026-11-16", to: "2026-11-22" });
  });
});

describe("Today view", () => {
  const today = "2026-11-10";
  const tasks = [
    task({ id: "o1", due: "2026-11-08", clientId: "c1", assignee: "me@o.test" }),
    task({ id: "o2", due: "2026-11-09", clientId: "c2" }),
    task({ id: "d1", due: today, clientId: "c2", assignee: "me@o.test" }),
    task({ id: "n1", due: "2026-11-12", clientId: "c1" }),
    task({ id: "n2", due: "2026-11-13", clientId: "c1", assignee: "me@o.test" }),
    task({ id: "later", due: "2026-11-20", clientId: "c1" }),
    task({ id: "done", due: "2026-11-08", clientId: "c1", status: "done" }),
  ];
  const items = [item({ id: "p1", date: today, clientId: "c1" }), item({ id: "p2", date: "2026-11-11" })];
  const shoots: ShootRow[] = [{ id: "s1", clientId: "c1", date: today, label: "Shoot day", shots: [], location: "", shooter: null, status: "planned", startTime: "", endTime: "", props: "", people: "", notes: "" }];

  it("groups into overdue, due today, next 3 days, publishing today and shoots today", () => {
    const g = groupToday(tasks, items, shoots, { today });
    expect(g.overdue.map((t) => t.id)).toEqual(["o1", "o2"]);
    expect(g.dueToday.map((t) => t.id)).toEqual(["d1"]);
    expect(g.next3.map((t) => t.id)).toEqual(["n1", "n2"]);
    expect(g.publishing.map((x) => x.id)).toEqual(["p1"]);
    expect(g.shoots.map((s) => s.id)).toEqual(["s1"]);
  });

  it("counts per client so the admin sees who needs attention", () => {
    const g = groupToday(tasks, items, shoots, { today });
    expect(g.perClient).toEqual([
      { clientId: "c1", overdue: 1, today: 0 },
      { clientId: "c2", overdue: 1, today: 1 },
    ].sort((a, b) => b.overdue - a.overdue || b.today - a.today || a.clientId.localeCompare(b.clientId)));
  });

  it("“My tasks” shows only the signed-in person's work", () => {
    const g = groupToday(tasks, items, shoots, { today, me: "me@o.test", mine: true });
    expect(g.overdue.map((t) => t.id)).toEqual(["o1"]);
    expect(g.dueToday.map((t) => t.id)).toEqual(["d1"]);
    expect(g.next3.map((t) => t.id)).toEqual(["n2"]);
    expect(g.publishing).toEqual([]);
    expect(g.shoots).toEqual([]);
  });
});
