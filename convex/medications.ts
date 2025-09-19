import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("medications")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    dosage: v.string(),
    form: v.string(),
    frequency: v.string(),
    instructions: v.optional(v.string()),
    initialQuantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check subscription limits
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    const currentMedCount = await ctx.db
      .query("medications")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();

    if (!subscription || subscription.plan === "free") {
      if (currentMedCount.length >= 3) {
        throw new Error("Free plan limited to 3 medications. Upgrade to premium for unlimited access.");
      }
    }

    const medicationId = await ctx.db.insert("medications", {
      userId,
      name: args.name,
      dosage: args.dosage,
      form: args.form,
      frequency: args.frequency,
      instructions: args.instructions,
      prescribedDate: Date.now(),
      initialQuantity: args.initialQuantity,
      currentQuantity: args.initialQuantity,
      refillReminder: true,
      isActive: true,
    });

    // Schedule interaction check and FDA data fetch
    await ctx.scheduler.runAfter(0, internal.medications.checkInteractions, { medicationId });
    await ctx.scheduler.runAfter(0, internal.medications.fetchFDAData, { medicationId });

    return medicationId;
  },
});

export const updateQuantity = mutation({
  args: {
    medicationId: v.id("medications"),
    quantityChange: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const medication = await ctx.db.get(args.medicationId);
    if (!medication || medication.userId !== userId) {
      throw new Error("Medication not found");
    }

    const newQuantity = Math.max(0, medication.currentQuantity + args.quantityChange);
    
    await ctx.db.patch(args.medicationId, {
      currentQuantity: newQuantity,
    });

    return newQuantity;
  },
});

export const getAdherenceStats = query({
  args: {
    medicationId: v.id("medications"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const days = args.days || 7;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    const logs = await ctx.db
      .query("adherenceLogs")
      .withIndex("by_medication", (q) => q.eq("medicationId", args.medicationId))
      .filter((q) => q.gte(q.field("scheduledDateTime"), startDate))
      .collect();

    const totalDoses = logs.length;
    const takenDoses = logs.filter(log => log.status === "taken").length;
    const adherencePercentage = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

    return {
      totalDoses,
      takenDoses,
      adherencePercentage,
      logs: logs.slice(-10), // Last 10 logs
    };
  },
});

export const checkInteractions = internalAction({
  args: { medicationId: v.id("medications") },
  handler: async (ctx, args) => {
    const medication = await ctx.runQuery(internal.medications.getMedication, {
      medicationId: args.medicationId,
    });

    if (!medication) return;

    const userMedications = await ctx.runQuery(internal.medications.getUserMedications, {
      userId: medication.userId,
    });

    // Check interactions with existing medications
    for (const existingMed of userMedications) {
      if (existingMed._id === args.medicationId) continue;

      try {
        // Simulate OpenFDA API call (replace with actual API)
        const interaction = await checkDrugInteraction(medication.name, existingMed.name);
        
        if (interaction.severity !== "none") {
          await ctx.runMutation(internal.medications.saveInteraction, {
            userId: medication.userId,
            medication1Id: args.medicationId,
            medication2Id: existingMed._id,
            severity: interaction.severity,
            description: interaction.description,
            source: "OpenFDA",
          });
        }
      } catch (error) {
        console.error("Error checking interaction:", error);
      }
    }
  },
});

export const fetchFDAData = internalAction({
  args: { medicationId: v.id("medications") },
  handler: async (ctx, args) => {
    const medication = await ctx.runQuery(internal.medications.getMedication, {
      medicationId: args.medicationId,
    });

    if (!medication) return;

    try {
      // Simulate FDA API call for drug information
      const fdaData = await fetchDrugInfo(medication.name);
      
      // Generate AI summary
      const summary = await generateDrugSummary(fdaData);

      await ctx.runMutation(internal.medications.updateFDAData, {
        medicationId: args.medicationId,
        fdaData: {
          indications: fdaData.indications,
          sideEffects: fdaData.sideEffects,
          summary,
        },
      });
    } catch (error) {
      console.error("Error fetching FDA data:", error);
    }
  },
});

// Internal functions
export const getMedication = internalQuery({
  args: { medicationId: v.id("medications") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.medicationId);
  },
});

export const getUserMedications = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("medications")
      .withIndex("by_user_active", (q) => q.eq("userId", args.userId).eq("isActive", true))
      .collect();
  },
});

export const saveInteraction = internalMutation({
  args: {
    userId: v.id("users"),
    medication1Id: v.id("medications"),
    medication2Id: v.id("medications"),
    severity: v.union(v.literal("critical"), v.literal("serious"), v.literal("moderate"), v.literal("minor")),
    description: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("interactions", {
      ...args,
      dateChecked: Date.now(),
    });
  },
});

export const updateFDAData = internalMutation({
  args: {
    medicationId: v.id("medications"),
    fdaData: v.object({
      indications: v.array(v.string()),
      sideEffects: v.array(v.string()),
      summary: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.medicationId, {
      fdaData: args.fdaData,
    });
  },
});

// Helper functions (would be replaced with actual API calls)
async function checkDrugInteraction(drug1: string, drug2: string) {
  // Simulate API response - randomly return no interaction sometimes
  const hasInteraction = Math.random() > 0.5;
  if (!hasInteraction) {
    return {
      severity: "none" as const,
      description: "",
    };
  }
  return {
    severity: "moderate" as const,
    description: `Potential interaction between ${drug1} and ${drug2}. Monitor for increased side effects.`,
  };
}

async function fetchDrugInfo(drugName: string) {
  // Simulate FDA API response
  return {
    indications: [`Treatment of conditions related to ${drugName}`],
    sideEffects: ["Nausea", "Dizziness", "Headache"],
  };
}

async function generateDrugSummary(fdaData: any): Promise<string> {
  // Simulate AI-generated summary
  return `This medication is used to treat specific medical conditions. Common side effects may include mild symptoms that usually improve with time. Always follow your doctor's instructions and report any concerning symptoms.`;
}
