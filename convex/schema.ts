import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  medications: defineTable({
    userId: v.id("users"),
    name: v.string(),
    dosage: v.string(),
    form: v.string(), // tablet, capsule, liquid, etc.
    frequency: v.string(), // daily, twice daily, etc.
    instructions: v.optional(v.string()),
    prescribedDate: v.number(),
    initialQuantity: v.number(),
    currentQuantity: v.number(),
    refillReminder: v.boolean(),
    isActive: v.boolean(),
    fdaData: v.optional(v.object({
      indications: v.array(v.string()),
      sideEffects: v.array(v.string()),
      summary: v.string(),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  medicationSchedule: defineTable({
    userId: v.id("users"),
    medicationId: v.id("medications"),
    scheduledTime: v.string(), // "08:00", "14:00", etc.
    days: v.array(v.string()), // ["monday", "tuesday", etc.]
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_medication", ["medicationId"]),

  adherenceLogs: defineTable({
    userId: v.id("users"),
    medicationId: v.id("medications"),
    scheduledDateTime: v.number(),
    actualDateTime: v.optional(v.number()),
    status: v.union(v.literal("taken"), v.literal("skipped"), v.literal("snoozed"), v.literal("pending")),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_medication", ["medicationId"])
    .index("by_user_date", ["userId", "scheduledDateTime"]),

  interactions: defineTable({
    userId: v.id("users"),
    medication1Id: v.id("medications"),
    medication2Id: v.id("medications"),
    severity: v.union(v.literal("critical"), v.literal("serious"), v.literal("moderate"), v.literal("minor")),
    description: v.string(),
    source: v.string(),
    dateChecked: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_medications", ["medication1Id", "medication2Id"]),

  symptoms: defineTable({
    userId: v.id("users"),
    date: v.number(),
    symptom: v.string(),
    severity: v.number(), // 1-10 scale
    notes: v.optional(v.string()),
    medicationIds: v.optional(v.array(v.id("medications"))),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  vitals: defineTable({
    userId: v.id("users"),
    date: v.number(),
    type: v.union(
      v.literal("blood_pressure"),
      v.literal("heart_rate"),
      v.literal("weight"),
      v.literal("temperature"),
      v.literal("blood_sugar")
    ),
    value: v.string(),
    unit: v.string(),
    source: v.optional(v.string()), // "manual", "healthkit", "google_fit"
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("premium")),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    isActive: v.boolean(),
    medicationLimit: v.number(),
  })
    .index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
