import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Media type validator
const mediaTypeValidator = v.union(
    v.literal("movie"),
    v.literal("book"),
    v.literal("tvshow"),
    v.literal("videogame"),
    v.literal("boardgame")
);

// Add a new media entry
export const addMediaEntry = mutation({
    args: {
        title: v.string(),
        type: mediaTypeValidator,
        headRating: v.number(),
        heartRating: v.number(),
        dateWatched: v.number(),
        notes: v.optional(v.string()),
        posterUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Ratings are deliberate whole-number picks on the 0-5 grid.
        if (!Number.isInteger(args.headRating) || args.headRating < 0 || args.headRating > 5) {
            throw new Error("Head rating must be an integer between 0 and 5");
        }
        if (!Number.isInteger(args.heartRating) || args.heartRating < 0 || args.heartRating > 5) {
            throw new Error("Heart rating must be an integer between 0 and 5");
        }

        const id = await ctx.db.insert("mediaEntries", {
            userId,
            title: args.title,
            type: args.type,
            headRating: args.headRating,
            heartRating: args.heartRating,
            dateWatched: args.dateWatched,
            notes: args.notes,
            posterUrl: args.posterUrl,
        });

        return id;
    },
});

// Unified, user-owned data for cross-status search and the activity timeline.
export const getAllMedia = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const [library, currently, wishlist] = await Promise.all([
            ctx.db.query("mediaEntries").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
            ctx.db.query("currentlyItems").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
            ctx.db.query("wishlistItems").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ]);

        return [
            ...library.map((item) => ({ ...item, status: "library" as const, activityDate: item.dateWatched })),
            ...currently.map((item) => ({ ...item, status: "currently" as const, activityDate: item.dateStarted })),
            ...wishlist.map((item) => ({ ...item, status: "wishlist" as const, activityDate: item.dateAdded })),
        ];
    },
});

// Get all media entries for the current user
export const getMediaEntries = query({
    args: {
        typeFilter: v.optional(mediaTypeValidator),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        if (args.typeFilter) {
            const type = args.typeFilter;
            return await ctx.db
                .query("mediaEntries")
                .withIndex("by_user_and_type", (q) =>
                    q.eq("userId", userId).eq("type", type)
                )
                .collect();
        }

        return await ctx.db
            .query("mediaEntries")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
    },
});

// Update a media entry
export const updateMediaEntry = mutation({
    args: {
        id: v.id("mediaEntries"),
        title: v.optional(v.string()),
        type: v.optional(mediaTypeValidator),
        headRating: v.optional(v.number()),
        heartRating: v.optional(v.number()),
        dateWatched: v.optional(v.number()),
        notes: v.optional(v.string()),
        posterUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const entry = await ctx.db.get("mediaEntries", args.id);
        if (!entry) {
            throw new Error("Entry not found");
        }
        if (entry.userId !== userId) {
            throw new Error("Not authorized to update this entry");
        }

        // Validate ratings if provided
        if (args.headRating !== undefined && (!Number.isInteger(args.headRating) || args.headRating < 0 || args.headRating > 5)) {
            throw new Error("Head rating must be an integer between 0 and 5");
        }
        if (args.heartRating !== undefined && (!Number.isInteger(args.heartRating) || args.heartRating < 0 || args.heartRating > 5)) {
            throw new Error("Heart rating must be an integer between 0 and 5");
        }

        const updates: Partial<typeof entry> = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.type !== undefined) updates.type = args.type;
        if (args.headRating !== undefined) updates.headRating = args.headRating;
        if (args.heartRating !== undefined) updates.heartRating = args.heartRating;
        if (args.dateWatched !== undefined) updates.dateWatched = args.dateWatched;
        if (args.notes !== undefined) updates.notes = args.notes;
        if (args.posterUrl !== undefined) updates.posterUrl = args.posterUrl;

        await ctx.db.patch("mediaEntries", args.id, updates);
    },
});

// Delete a media entry
export const deleteMediaEntry = mutation({
    args: {
        id: v.id("mediaEntries"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const entry = await ctx.db.get("mediaEntries", args.id);
        if (!entry) {
            throw new Error("Entry not found");
        }
        if (entry.userId !== userId) {
            throw new Error("Not authorized to delete this entry");
        }

        await ctx.db.delete("mediaEntries", args.id);
    },
});
