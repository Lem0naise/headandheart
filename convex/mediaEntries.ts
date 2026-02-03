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
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Validate ratings are 1-4
        if (args.headRating < 1 || args.headRating > 4) {
            throw new Error("Head rating must be between 1 and 4");
        }
        if (args.heartRating < 1 || args.heartRating > 4) {
            throw new Error("Heart rating must be between 1 and 4");
        }

        const id = await ctx.db.insert("mediaEntries", {
            userId,
            title: args.title,
            type: args.type,
            headRating: args.headRating,
            heartRating: args.heartRating,
            dateWatched: args.dateWatched,
            notes: args.notes,
        });

        return id;
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

        let entries = await ctx.db
            .query("mediaEntries")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        // Apply type filter if specified
        if (args.typeFilter) {
            entries = entries.filter((entry) => entry.type === args.typeFilter);
        }

        return entries;
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
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const entry = await ctx.db.get(args.id);
        if (!entry) {
            throw new Error("Entry not found");
        }
        if (entry.userId !== userId) {
            throw new Error("Not authorized to update this entry");
        }

        // Validate ratings if provided
        if (args.headRating !== undefined && (args.headRating < 1 || args.headRating > 4)) {
            throw new Error("Head rating must be between 1 and 4");
        }
        if (args.heartRating !== undefined && (args.heartRating < 1 || args.heartRating > 4)) {
            throw new Error("Heart rating must be between 1 and 4");
        }

        const updates: Partial<typeof entry> = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.type !== undefined) updates.type = args.type;
        if (args.headRating !== undefined) updates.headRating = args.headRating;
        if (args.heartRating !== undefined) updates.heartRating = args.heartRating;
        if (args.dateWatched !== undefined) updates.dateWatched = args.dateWatched;
        if (args.notes !== undefined) updates.notes = args.notes;

        await ctx.db.patch(args.id, updates);
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

        const entry = await ctx.db.get(args.id);
        if (!entry) {
            throw new Error("Entry not found");
        }
        if (entry.userId !== userId) {
            throw new Error("Not authorized to delete this entry");
        }

        await ctx.db.delete(args.id);
    },
});
