import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const mediaTypeValidator = v.union(
  v.literal("movie"),
  v.literal("book"),
  v.literal("tvshow"),
  v.literal("videogame"),
  v.literal("boardgame")
);

export const addCurrentlyItem = mutation({
  args: {
    title: v.string(),
    type: mediaTypeValidator,
    dateStarted: v.number(),
    progress: v.number(),
    notes: v.optional(v.string()),
    totalPages: v.optional(v.number()),
    totalEpisodes: v.optional(v.number()),
    posterUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("currentlyItems", {
      userId,
      title: args.title,
      type: args.type,
      dateStarted: args.dateStarted,
      progress: args.progress,
      notes: args.notes,
      totalPages: args.totalPages,
      totalEpisodes: args.totalEpisodes,
      posterUrl: args.posterUrl,
    });
  },
});

export const getCurrentlyItems = query({
  args: {
    typeFilter: v.optional(mediaTypeValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    if (args.typeFilter) {
      const type = args.typeFilter;
      return await ctx.db
        .query("currentlyItems")
        .withIndex("by_user_and_type", (q) =>
          q.eq("userId", userId).eq("type", type)
        )
        .collect();
    }
    return await ctx.db
      .query("currentlyItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const updateCurrentlyItem = mutation({
  args: {
    id: v.id("currentlyItems"),
    title: v.optional(v.string()),
    type: v.optional(mediaTypeValidator),
    dateStarted: v.optional(v.number()),
    progress: v.optional(v.number()),
    notes: v.optional(v.string()),
    totalPages: v.optional(v.number()),
    totalEpisodes: v.optional(v.number()),
    posterUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get("currentlyItems", args.id);
    if (!item) throw new Error("Item not found");
    if (item.userId !== userId) throw new Error("Not authorized");
    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.type !== undefined) updates.type = args.type;
    if (args.dateStarted !== undefined) updates.dateStarted = args.dateStarted;
    if (args.progress !== undefined) updates.progress = args.progress;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.totalPages !== undefined) updates.totalPages = args.totalPages;
    if (args.totalEpisodes !== undefined) updates.totalEpisodes = args.totalEpisodes;
    if (args.posterUrl !== undefined) updates.posterUrl = args.posterUrl;
    await ctx.db.patch("currentlyItems", args.id, updates);
  },
});

export const deleteCurrentlyItem = mutation({
  args: { id: v.id("currentlyItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get("currentlyItems", args.id);
    if (!item) throw new Error("Item not found");
    if (item.userId !== userId) throw new Error("Not authorized");
    await ctx.db.delete("currentlyItems", args.id);
  },
});

export const promoteToCurrently = mutation({
  args: { wishlistItemId: v.id("wishlistItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const wishlistItem = await ctx.db.get("wishlistItems", args.wishlistItemId);
    if (!wishlistItem) throw new Error("Wishlist item not found");
    if (wishlistItem.userId !== userId) throw new Error("Not authorized");
    await ctx.db.insert("currentlyItems", {
      userId,
      title: wishlistItem.title,
      type: wishlistItem.type,
      dateStarted: Date.now(),
      progress: 0,
      notes: wishlistItem.notes,
      posterUrl: wishlistItem.posterUrl,
    });
    await ctx.db.delete("wishlistItems", args.wishlistItemId);
  },
});

export const completeCurrently = mutation({
  args: {
    currentlyItemId: v.id("currentlyItems"),
    headRating: v.number(),
    heartRating: v.number(),
    dateWatched: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const currentlyItem = await ctx.db.get("currentlyItems", args.currentlyItemId);
    if (!currentlyItem) throw new Error("Item not found");
    if (currentlyItem.userId !== userId) throw new Error("Not authorized");
    if (args.headRating < 1 || args.headRating > 5) throw new Error("Head rating must be 1-5");
    if (args.heartRating < 1 || args.heartRating > 5) throw new Error("Heart rating must be 1-5");
    await ctx.db.insert("mediaEntries", {
      userId,
      title: currentlyItem.title,
      type: currentlyItem.type,
      headRating: args.headRating,
      heartRating: args.heartRating,
      dateWatched: args.dateWatched,
      notes: args.notes ?? currentlyItem.notes,
      posterUrl: currentlyItem.posterUrl,
    });
    await ctx.db.delete("currentlyItems", args.currentlyItemId);
  },
});

export const demoteCurrently = mutation({
  args: { currentlyItemId: v.id("currentlyItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const currentlyItem = await ctx.db.get("currentlyItems", args.currentlyItemId);
    if (!currentlyItem) throw new Error("Item not found");
    if (currentlyItem.userId !== userId) throw new Error("Not authorized");
    await ctx.db.insert("wishlistItems", {
      userId,
      title: currentlyItem.title,
      type: currentlyItem.type,
      dateAdded: Date.now(),
      notes: currentlyItem.notes,
      posterUrl: currentlyItem.posterUrl,
    });
    await ctx.db.delete("currentlyItems", args.currentlyItemId);
  },
});

export const bulkAddCurrentlyItems = mutation({
  args: {
    items: v.array(v.object({
      title: v.string(),
      type: mediaTypeValidator,
      dateStarted: v.number(),
      progress: v.number(),
      notes: v.optional(v.string()),
      totalPages: v.optional(v.number()),
      totalEpisodes: v.optional(v.number()),
      posterUrl: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const ids = [];
    for (const item of args.items) {
      const id = await ctx.db.insert("currentlyItems", {
        userId,
        title: item.title,
        type: item.type,
        dateStarted: item.dateStarted,
        progress: item.progress,
        notes: item.notes,
        totalPages: item.totalPages,
        totalEpisodes: item.totalEpisodes,
        posterUrl: item.posterUrl,
      });
      ids.push(id);
    }
    return ids;
  },
});
