// Helpers for the claim window: converting between epoch milliseconds and the
// `<input type="datetime-local">` value, plus deriving countdown state.

export type ClaimWindowStatus = "before" | "open" | "closed";

// Epoch ms -> "YYYY-MM-DDTHH:mm" in the browser's local time (the format a
// datetime-local input expects). Returns "" when the bound is unset.
export function toDateTimeLocalValue(ms?: number): string {
  if (ms === undefined) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// datetime-local value (local time, no zone) -> epoch ms. Empty/invalid -> undefined.
export function fromDateTimeLocalValue(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const ms = new Date(trimmed).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

export function getWindowStatus(
  now: number,
  startTime?: number,
  endTime?: number
): ClaimWindowStatus {
  if (startTime !== undefined && now < startTime) return "before";
  if (endTime !== undefined && now > endTime) return "closed";
  return "open";
}

// Milliseconds remaining -> "1d 02:03:04" (days dropped when zero, never negative).
export function formatCountdown(msRemaining: number): string {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

// Full local date + time for showing when a window opens/closes.
export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
