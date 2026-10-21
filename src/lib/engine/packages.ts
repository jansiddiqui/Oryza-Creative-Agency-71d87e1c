/** Monthly packages: volumes every plan is built to. Kept apart from the engine so the planner UI can show them without loading it. */
export type PackageId = "starter" | "growth" | "premium";

export const packages: Record<
  PackageId,
  { name: string; reels: number; posts: number; storyDaysPerWeek: number; storiesPerDay: number; shoots: number }
> = {
  starter: { name: "Starter", reels: 8, posts: 8, storyDaysPerWeek: 4, storiesPerDay: 1, shoots: 1 },
  growth: { name: "Growth", reels: 12, posts: 15, storyDaysPerWeek: 7, storiesPerDay: 2, shoots: 2 },
  premium: { name: "Premium", reels: 16, posts: 18, storyDaysPerWeek: 7, storiesPerDay: 3, shoots: 3 },
};
