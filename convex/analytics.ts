import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { adminEmailStatus } from "./admins";

const DAY_MS = 24 * 60 * 60 * 1000;

// Events the caller may see: global admins get everything, event admins only
// the events they administer. Anyone else gets nothing.
async function accessibleEvents(ctx: QueryCtx): Promise<{
  scope: "global" | "event" | "none";
  events: Doc<"events">[];
}> {
  const { email, isAdmin } = await adminEmailStatus(ctx);
  if (isAdmin) {
    const events = await ctx.db.query("events").order("desc").collect();
    return { scope: "global", events };
  }
  if (!email) return { scope: "none", events: [] };
  const memberships = await ctx.db
    .query("eventAdmins")
    .withIndex("by_email", (q) => q.eq("email", email))
    .collect();
  const loaded = await Promise.all(memberships.map((m) => ctx.db.get(m.eventId)));
  const events = loaded
    .filter((event): event is Doc<"events"> => event !== null)
    .sort((a, b) => b._creationTime - a._creationTime);
  return { scope: "event", events };
}

// UTC day key (YYYY-MM-DD) for a timestamp.
function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

// Average daily claim velocity since the first code was dispensed, floored at a
// one-day window so a burst of same-day claims doesn't project an infinite rate.
function dailyRate(claimedAts: number[], now: number): number {
  if (claimedAts.length === 0) return 0;
  const first = Math.min(...claimedAts);
  const days = Math.max(1, (now - first) / DAY_MS);
  return claimedAts.length / days;
}

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const { scope, events } = await accessibleEvents(ctx);
    const now = Date.now();

    const perEvent = await Promise.all(
      events.map(async (event) => {
        const [codes, emails] = await Promise.all([
          ctx.db
            .query("codes")
            .withIndex("by_event", (q) => q.eq("eventId", event._id))
            .collect(),
          ctx.db
            .query("emails")
            .withIndex("by_event", (q) => q.eq("eventId", event._id))
            .collect(),
        ]);

        const claimed = codes.filter(
          (c): c is Doc<"codes"> & { claimedAt: number } =>
            c.claimedBy != null && c.claimedAt != null
        );
        const claimedAts = claimed.map((c) => c.claimedAt);
        const totalCodes = codes.length;
        const claimedCodes = claimed.length;
        const remaining = totalCodes - claimedCodes;
        const eligibleEmails = emails.length;

        // Redemption rate: share of eligible participants who claimed a code.
        const redemptionRate =
          eligibleEmails > 0 ? claimedCodes / eligibleEmails : null;

        // Inventory forecast from average velocity since the first claim.
        const rate = dailyRate(claimedAts, now);
        const daysToDepletion =
          remaining > 0 && rate > 0 ? remaining / rate : null;
        const projectedDepletion =
          daysToDepletion != null ? now + daysToDepletion * DAY_MS : null;

        // Peak hour (UTC) of claim activity for this event.
        const byHour = new Array(24).fill(0) as number[];
        for (const ts of claimedAts) byHour[new Date(ts).getUTCHours()]++;
        let peakHour: number | null = null;
        let peakHourClaims = 0;
        byHour.forEach((count, hour) => {
          if (count > peakHourClaims) {
            peakHourClaims = count;
            peakHour = hour;
          }
        });

        return {
          eventId: event._id,
          name: event.name,
          slug: event.slug,
          eligibleEmails,
          totalCodes,
          claimedCodes,
          remaining,
          redemptionRate,
          codeClaimRate: totalCodes > 0 ? claimedCodes / totalCodes : null,
          dailyRate: rate,
          daysToDepletion,
          projectedDepletion,
          peakHour,
          peakHourClaims,
          claimedAts,
        };
      })
    );

    // Aggregate claim trend (per UTC day) and hourly distribution across every
    // accessible event.
    const trendMap = new Map<string, number>();
    const hourly = new Array(24).fill(0) as number[];
    let totalClaims = 0;
    for (const e of perEvent) {
      for (const ts of e.claimedAts) {
        trendMap.set(dayKey(ts), (trendMap.get(dayKey(ts)) ?? 0) + 1);
        hourly[new Date(ts).getUTCHours()]++;
        totalClaims++;
      }
    }
    let cumulative = 0;
    const claimTrend = [...trendMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, claims]) => {
        cumulative += claims;
        return { date, claims, cumulative };
      });

    const totalCodes = perEvent.reduce((s, e) => s + e.totalCodes, 0);
    const eligibleEmails = perEvent.reduce((s, e) => s + e.eligibleEmails, 0);

    // Strip the per-claim timestamps used only for aggregation before returning.
    const events_ = perEvent.map(({ claimedAts, ...rest }) => {
      void claimedAts;
      return rest;
    });

    return {
      scope,
      totals: {
        events: events.length,
        eligibleEmails,
        totalCodes,
        claimedCodes: totalClaims,
        remaining: totalCodes - totalClaims,
        redemptionRate: eligibleEmails > 0 ? totalClaims / eligibleEmails : null,
        codeClaimRate: totalCodes > 0 ? totalClaims / totalCodes : null,
      },
      claimTrend,
      hourly: hourly.map((claims, hour) => ({ hour, claims })),
      events: events_,
    };
  },
});
