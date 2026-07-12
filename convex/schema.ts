import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  transportEmployees: defineTable({
    name: v.string(),
    phoneNumbers: v.array(
      v.union(
        v.string(),
        v.object({ number: v.string(), accounts: v.array(v.string()) })
      )
    ),
    address: v.union(
      v.string(),
      v.object({
        nid: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.string(),
          street: v.string(),
        }),
        permanent: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.string(),
          street: v.string(),
        }),
        current: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.string(),
          street: v.string(),
        }),
      })
    ),
    dob: v.optional(v.string()),
    age: v.number(),
    vehicleType: v.string(),
    vehicleWheels: v.number(),
    clothCapacityYards: v.number(),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
  }),
});
