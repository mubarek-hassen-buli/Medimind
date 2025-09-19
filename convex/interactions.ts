import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get medication names for each interaction
    const enrichedInteractions = [];
    for (const interaction of interactions) {
      const med1 = await ctx.db.get(interaction.medication1Id);
      const med2 = await ctx.db.get(interaction.medication2Id);
      
      if (med1 && med2) {
        enrichedInteractions.push({
          ...interaction,
          medication1Name: med1.name,
          medication2Name: med2.name,
        });
      }
    }

    return enrichedInteractions.sort((a, b) => {
      const severityOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  },
});

export const getCriticalAlerts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const criticalInteractions = await ctx.db
      .query("interactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("severity"), "critical"))
      .collect();

    const alerts = [];
    for (const interaction of criticalInteractions) {
      const med1 = await ctx.db.get(interaction.medication1Id);
      const med2 = await ctx.db.get(interaction.medication2Id);
      
      if (med1 && med2) {
        alerts.push({
          id: interaction._id,
          title: `Critical Interaction Alert`,
          message: `${med1.name} and ${med2.name}: ${interaction.description}`,
          severity: interaction.severity,
          timestamp: interaction.dateChecked,
        });
      }
    }

    return alerts;
  },
});
