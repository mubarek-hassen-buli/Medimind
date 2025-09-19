import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const logDose = mutation({
  args: {
    medicationId: v.id("medications"),
    scheduledDateTime: v.number(),
    status: v.union(v.literal("taken"), v.literal("skipped"), v.literal("snoozed")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Update or create adherence log
    const existingLog = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", userId).eq("scheduledDateTime", args.scheduledDateTime)
      )
      .filter((q) => q.eq(q.field("medicationId"), args.medicationId))
      .first();

    if (existingLog) {
      await ctx.db.patch(existingLog._id, {
        status: args.status,
        actualDateTime: Date.now(),
        notes: args.notes,
      });
    } else {
      await ctx.db.insert("adherenceLogs", {
        userId,
        medicationId: args.medicationId,
        scheduledDateTime: args.scheduledDateTime,
        actualDateTime: Date.now(),
        status: args.status,
        notes: args.notes,
      });
    }

    // Update medication quantity if taken
    if (args.status === "taken") {
      const medication = await ctx.db.get(args.medicationId);
      if (medication && medication.currentQuantity > 0) {
        await ctx.db.patch(args.medicationId, {
          currentQuantity: medication.currentQuantity - 1,
        });
      }
    }

    return true;
  },
});

export const getTodaySchedule = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1;

    const medications = await ctx.db
      .query("medications")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();

    const schedules = await ctx.db
      .query("medicationSchedule")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const logs = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("scheduledDateTime", startOfDay))
      .filter((q) => q.lte(q.field("scheduledDateTime"), endOfDay))
      .collect();

    // Build today's schedule
    const todaySchedule = [];
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    for (const schedule of schedules) {
      if (!schedule.days.includes(dayOfWeek)) continue;

      const medication = medications.find(m => m._id === schedule.medicationId);
      if (!medication) continue;

      const [hours, minutes] = schedule.scheduledTime.split(':');
      const scheduledDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
        parseInt(hours), parseInt(minutes)).getTime();

      const log = logs.find(l => 
        l.medicationId === schedule.medicationId && 
        Math.abs(l.scheduledDateTime - scheduledDateTime) < 60000 // Within 1 minute
      );

      todaySchedule.push({
        medicationId: medication._id,
        medicationName: medication.name,
        dosage: medication.dosage,
        scheduledTime: schedule.scheduledTime,
        scheduledDateTime,
        status: log?.status || "pending",
        notes: log?.notes,
      });
    }

    return todaySchedule.sort((a, b) => a.scheduledDateTime - b.scheduledDateTime);
  },
});

export const getWeeklyAdherence = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    const logs = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("scheduledDateTime", weekAgo))
      .collect();

    const totalDoses = logs.length;
    const takenDoses = logs.filter(log => log.status === "taken").length;
    const adherencePercentage = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

    // Group by day for chart data
    const dailyStats: Record<string, { total: number; taken: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toISOString().split('T')[0];
      dailyStats[dateKey] = { total: 0, taken: 0 };
    }

    logs.forEach(log => {
      const dateKey = new Date(log.scheduledDateTime).toISOString().split('T')[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].total++;
        if (log.status === "taken") {
          dailyStats[dateKey].taken++;
        }
      }
    });

    return {
      overallAdherence: adherencePercentage,
      totalDoses,
      takenDoses,
      dailyStats,
    };
  },
});
