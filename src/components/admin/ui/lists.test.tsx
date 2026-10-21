import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { groupByItem, groupToday, tasksForFilter } from "@/lib/ops/today";
import type { TaskRow } from "@/lib/ops/types";
import { DataTable, sortRows, type Column } from "./DataTable";

type Row = { id: string; name: string; amount: number };
const rows: Row[] = [
  { id: "1", name: "item 10", amount: 300 },
  { id: "2", name: "Item 2", amount: 25 },
  { id: "3", name: "apple", amount: 1000 },
];
const cols: Column<Row>[] = [
  { key: "name", label: "Name", sort: (r) => r.name, card: "title", render: (r) => r.name },
  { key: "amount", label: "Amount", sort: (r) => r.amount, card: "meta", render: (r) => `₹${r.amount}` },
  { key: "plain", label: "Plain", render: () => "x", card: "hide" },
];

describe("tables", () => {
  it("sort text naturally (case-insensitive, numbers in order) and numbers numerically", () => {
    expect(sortRows(rows, cols[0], "asc").map((r) => r.id)).toEqual(["3", "2", "1"]);
    expect(sortRows(rows, cols[1], "desc").map((r) => r.id)).toEqual(["3", "1", "2"]);
    expect(sortRows(rows, cols[2], "asc")).toBe(rows);
  });

  it("render a sortable table with a sticky header on desktop and cards on phones", () => {
    const html = renderToStaticMarkup(<DataTable id="t" rows={rows} rowKey={(r) => r.id} columns={cols} views={[{ id: "all", label: "All", test: () => true }]} search={(r) => r.name} />);
    expect(html).toMatch(/<th scope="col"[^>]*class="sticky top-0/);
    expect(html).toContain("aria-sort");
    expect(html).toContain("apple");
    expect(html).toMatch(/md:hidden/);
  });
});

const t = (x: Partial<TaskRow>): TaskRow => ({ id: "t", itemId: "i1", clientId: "c1", step: "script", label: "Script", due: "2026-11-10", time: "6:00 pm", role: "strategist", assignee: null, status: "todo", late: false, blockedReason: "", note: "", ...x });

describe("Today grouping and filter cards", () => {
  const tasks = [
    t({ id: "a", itemId: "i2", due: "2026-11-11" }),
    t({ id: "b", itemId: "i1", due: "2026-11-09" }),
    t({ id: "c", itemId: "i2", due: "2026-11-10", step: "client_approval", status: "in_progress" }),
    t({ id: "d", itemId: "i1", due: "2026-11-10", status: "done" }),
  ];
  const g = groupToday(tasks, [], [], { today: "2026-11-10" });

  it("groups tasks by post, most urgent post first", () => {
    const groups = groupByItem([...g.overdue, ...g.dueToday, ...g.next3], [{ id: "i1", date: "2026-11-12" }, { id: "i2", date: "2026-11-11" }]);
    expect(groups.map((x) => [x.itemId, x.tasks.map((y) => y.id)])).toEqual([["i1", ["b"]], ["i2", ["c", "a"]]]);
  });

  it("each summary card shows exactly the tasks it counts", () => {
    expect(tasksForFilter(g, "overdue").map((x) => x.id)).toEqual(["b"]);
    expect(tasksForFilter(g, "today").map((x) => x.id)).toEqual(["c"]);
    expect(tasksForFilter(g, "next").map((x) => x.id)).toEqual(["a"]);
    expect(tasksForFilter(g, "client").map((x) => x.id)).toEqual(["c"]);
    expect(tasksForFilter(g, "leads")).toEqual([]);
  });
});
