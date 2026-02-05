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

// Add a new wishlist item
export const addWishlistItem = mutation({
  args: {
    title: v.string(),
    type: mediaTypeValidator,
    dateAdded: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("wishlistItems", {
      userId,
      title: args.title,
      type: args.type,
      dateAdded: args.dateAdded,
      notes: args.notes,
    });
  },
});

// Get wishlist items for current user
export const getWishlistItems = query({
  args: {
    typeFilter: v.optional(mediaTypeValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let items = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (args.typeFilter) {
      items = items.filter((item) => item.type === args.typeFilter);
    }

    return items;
  },
});

// Update a wishlist item
export const updateWishlistItem = mutation({
  args: {
    id: v.id("wishlistItems"),
    title: v.optional(v.string()),
    type: v.optional(mediaTypeValidator),
    dateAdded: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error("Item not found");
    }
    if (item.userId !== userId) {
      throw new Error("Not authorized to update this item");
    }

    const updates: Partial<typeof item> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.type !== undefined) updates.type = args.type;
    if (args.dateAdded !== undefined) updates.dateAdded = args.dateAdded;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.id, updates);
  },
});

// Delete a wishlist item
export const deleteWishlistItem = mutation({
  args: { id: v.id("wishlistItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error("Item not found");
    }
    if (item.userId !== userId) {
      throw new Error("Not authorized to delete this item");
    }

    await ctx.db.delete(args.id);
  },
});
