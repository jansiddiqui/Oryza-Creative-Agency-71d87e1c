/**
 * Fixed-date national and school days. Lunar festivals (Diwali, Holi, Eid…)
 * change every year — add them here yearly after checking the official
 * government holiday list. Format: MM-DD.
 */
export const fixedDays: { md: string; name: string }[] = [
  { md: "01-01", name: "New Year" },
  { md: "01-26", name: "Republic Day" },
  { md: "08-15", name: "Independence Day" },
  { md: "09-05", name: "Teachers' Day" },
  { md: "10-02", name: "Gandhi Jayanti" },
  { md: "11-14", name: "Children's Day" },
  { md: "12-25", name: "Christmas" },
];

/** Year-specific festival dates (YYYY-MM-DD). Verify each year before publishing. */
export const yearlyFestivals: { date: string; name: string }[] = [];

/** School-year themes by month (1–12), used for “Month 2 and 3 direction”. */
export const schoolMonthThemes: Record<number, string[]> = {
  1: ["Board exam preparation tips", "Republic Day celebration"],
  2: ["Exam season support for parents", "Admissions push for the new session"],
  3: ["Exams and results", "Admissions closing reminders"],
  4: ["New session welcome", "Meet the new class teachers"],
  5: ["Summer camp and activities", "Results and toppers"],
  6: ["Summer break learning ideas", "Preparing for the new term"],
  7: ["Monsoon campus life", "New session settling in"],
  8: ["Independence Day", "Co-curricular clubs"],
  9: ["Teachers' Day", "Half-yearly exam tips"],
  10: ["Gandhi Jayanti", "Festive season activities"],
  11: ["Children's Day", "Annual day preparation"],
  12: ["Annual day and winter events", "Admissions open announcements"],
};
