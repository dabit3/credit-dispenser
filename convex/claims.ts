import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const claim = mutation({
  args: { slug: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return { ok: false as const, error: "Please enter a valid email address." };
    }

    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!event) {
      return { ok: false as const, error: "Event not found." };
    }

    const allowed = await ctx.db
      .query("emails")
      .withIndex("by_event_email", (q) =>
        q.eq("eventId", event._id).eq("email", email)
      )
      .unique();
    if (!allowed) {
      return {
        ok: false as const,
        error:
          "This email is not on the participant list for this event. Please check that you used the email you registered with.",
      };
    }

    const alreadyClaimed = await ctx.db
      .query("codes")
      .withIndex("by_event_claimedBy", (q) =>
        q.eq("eventId", event._id).eq("claimedBy", email)
      )
      .unique();
    if (alreadyClaimed) {
      return { ok: true as const, code: alreadyClaimed.code, alreadyClaimed: true };
    }

    const available = await ctx.db
      .query("codes")
      .withIndex("by_event_claimedBy", (q) =>
        q.eq("eventId", event._id).eq("claimedBy", undefined)
      )
      .first();
    if (!available) {
      return {
        ok: false as const,
        error: "All codes for this event have been claimed.",
      };
    }

    await ctx.db.patch(available._id, {
      claimedBy: email,
      claimedAt: Date.now(),
    });
    return { ok: true as const, code: available.code, alreadyClaimed: false };
  },
});
