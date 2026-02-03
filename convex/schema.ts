import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,

  // Media entries for rating movies, books, TV shows, video games, board games
  mediaEntries: defineTable({
    userId: v.id("users"),
    title: v.string(),
    type: v.union(
      v.literal("movie"),
      v.literal("book"),
      v.literal("tvshow"),
      v.literal("videogame"),
      v.literal("boardgame")
    ),
    headRating: v.number(), // 1-4 intellectual satisfaction
    heartRating: v.number(), // 1-4 emotional satisfaction
    dateWatched: v.number(), // timestamp
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
