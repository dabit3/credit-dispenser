// Formats a YYYY-MM-DD event date by its parts — new Date("2026-07-17")
// parses as UTC midnight, which renders as the previous day in some zones.
export function formatEventDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
