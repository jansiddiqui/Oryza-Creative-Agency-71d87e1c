import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { plannerLoaders } from "@/components/planner/configs";
import type { Answers } from "@/components/planner/questions";
import type { ClientLite, ItemRow, ShootRow, TaskRow } from "@/lib/ops/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/admin" }));

const { QuestionField } = await import("./QuestionFields");
const { CalendarBoard } = await import("./CalendarBoard");
const { TodayBoard } = await import("./TodayBoard");

describe("admin question fields (copy of the planner's renderer)", () => {
  it("handles every question kind the planner defines", () => {
    const planner = readFileSync(join(process.cwd(), "src/components/planner/PlanBuilder.tsx"), "utf8");
    const admin = readFileSync(join(process.cwd(), "src/components/admin/ops/QuestionFields.tsx"), "utf8");
    const kinds = (s: string) => [...s.matchAll(/case "(\w+)":/g)].map((m) => m[1]).sort();
    expect(kinds(admin)).toEqual(kinds(planner));
  });

  it("renders every category's questions with its starting answers", async () => {
    for (const [slug, load] of Object.entries(plannerLoaders)) {
      const config = await load();
      const a: Answers = { ...config.initial, [config.nameKey]: "Test" };
      for (const q of config.steps.flatMap((s) => s.questions)) {
        expect(renderToStaticMarkup(<QuestionField q={q} a={a} set={() => undefined} />).length, `${slug}:${q.key}`).toBeGreaterThan(20);
      }
    }
  });
});

const clients: ClientLite[] = [
  { id: "c1", name: "Sunrise Clinic", category: "hospitals-clinics", colour: "#2f6b4f", status: "active" },
  { id: "c2", name: "Green Valley School", category: "schools", colour: "#8f5e0a", status: "active" },
];
const item = (x: Partial<ItemRow>): ItemRow => ({ id: "i", clientId: "c1", planId: "p", platform: "instagram", format: "reel", title: "T", hook: "", cta: "", pillar: "", templateId: "X", date: "2026-11-10", time: "7:00 pm", stage: "planned", assignee: null, complianceNote: "", clientApproved: false, ...x });
const task = (x: Partial<TaskRow>): TaskRow => ({ id: "t", itemId: "i1", clientId: "c1", step: "script", label: "Script", due: "2026-11-10", time: "6:00 pm", role: "strategist", assignee: null, status: "todo", late: false, blockedReason: "", note: "", ...x });
const shoot: ShootRow = { id: "s1", clientId: "c2", date: "2026-11-12", label: "Shoot day 1", shots: ["Classroom"], location: "", shooter: null, status: "planned" };

describe("master calendar", () => {
  const items = [item({ id: "i1", title: "Meet our doctors", date: "2026-11-08" }), item({ id: "i2", clientId: "c2", title: "Sports day", date: "2026-11-12", format: "post" }), item({ id: "i3", title: "OPD timings", date: "2026-11-11", stage: "published" })];
  const props = { anchor: "2026-11-10", today: "2026-11-10", items, tasks: [task({ itemId: "i1", due: "2026-11-03" })], shoots: [shoot], clients, team: [] };

  it("month view: overdue in red, today highlighted, shoot markers, client colours", () => {
    const html = renderToStaticMarkup(<CalendarBoard view="month" filters={{}} {...props} />);
    expect(html).toContain("November 2026");
    expect(html).toMatch(/Sunrise Clinic: Meet our doctors, Reel, overdue/);
    expect(html).not.toMatch(/OPD timings, Reel, overdue/);
    expect(html).toContain("10 · Today");
    expect(html).toContain("Shoot · Green Valley School");
    expect(html).toContain("border-left-color:#2f6b4f");
    expect(html).toContain(`title="Instagram"`);
  });

  it("filters by client and format", () => {
    const html = renderToStaticMarkup(<CalendarBoard view="week" filters={{ client: "c2" }} {...props} />);
    expect(html).toContain("Sports day");
    expect(html).not.toContain("Meet our doctors");
    const posts = renderToStaticMarkup(<CalendarBoard {...props} view="day" anchor="2026-11-12" filters={{ format: "reel" }} />);
    expect(posts).not.toContain("Sports day");
  });
});

describe("Today view", () => {
  it("groups tasks and shows counts per client", () => {
    const tasks = [task({ id: "a", due: "2026-11-09", label: "Edit" }), task({ id: "b", due: "2026-11-10", label: "Design", clientId: "c2", itemId: "i2" }), task({ id: "c", due: "2026-11-12", label: "Copy" })];
    const html = renderToStaticMarkup(
      <TodayBoard tasks={tasks} items={[item({ id: "i1", date: "2026-11-10", title: "Meet our doctors" })]} shoots={[{ ...shoot, date: "2026-11-10" }]} clients={clients} team={[]} me="me@oryza.test" today="2026-11-10" initialMine={false} />,
    );
    for (const s of ["Overdue", "Due today", "Next 3 days", "Publishing today", "Shoots today"]) expect(html).toContain(s);
    expect(html).toContain("1 overdue");
    expect(html).toMatch(/Counts per client/);
    expect(html).toContain("Meet our doctors");
    expect(html).toContain("Shoot day 1");
  });
});

describe("admin category list mirrors the public planner list", () => {
  it("has the same categories and labels", async () => {
    const { plannerLabels } = await import("@/components/planner/configs");
    const { CATEGORY_LABELS, opsPlannerLoaders } = await import("@/lib/ops/categories");
    expect(CATEGORY_LABELS).toEqual(plannerLabels);
    expect(Object.keys(opsPlannerLoaders).sort()).toEqual(Object.keys(plannerLoaders).sort());
    for (const [slug, load] of Object.entries(opsPlannerLoaders)) expect((await load()).slug).toBe(slug);
  });
});
