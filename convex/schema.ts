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
        headRating: v.number(), // 1-5 intellectual satisfaction
        heartRating: v.number(), // 1-5 emotional satisfaction
        dateWatched: v.number(), // timestamp
        notes: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_type", ["userId", "type"]),

    // Wishlist items (no ratings yet)
    wishlistItems: defineTable({
        userId: v.id("users"),
        title: v.string(),
        type: v.union(
            v.literal("movie"),
            v.literal("book"),
            v.literal("tvshow"),
            v.literal("videogame"),
            v.literal("boardgame")
        ),
        dateAdded: v.number(), // timestamp
        notes: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_type", ["userId", "type"]),

    // Currently reading/watching/playing items
    currentlyItems: defineTable({
        userId: v.id("users"),
        title: v.string(),
        type: v.union(
            v.literal("movie"),
            v.literal("book"),
            v.literal("tvshow"),
            v.literal("videogame"),
            v.literal("boardgame")
        ),
        dateStarted: v.number(), // timestamp
        progress: v.number(), // 0-100 percentage, or current page/episode when tracked
        notes: v.optional(v.string()),
        totalPages: v.optional(v.number()), // for books: total page count
        totalEpisodes: v.optional(v.number()), // for TV shows: total episode count
    })
        .index("by_user", ["userId"])
        .index("by_user_and_type", ["userId", "type"]),
});
