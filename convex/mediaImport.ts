import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const mediaTypeValidator = v.union(
  v.literal("movie"),
  v.literal("book"),
  v.literal("tvshow"),
  v.literal("videogame"),
  v.literal("boardgame"),
);

const commonFields = {
  title: v.string(),
  type: mediaTypeValidator,
  date: v.number(),
  notes: v.optional(v.string()),
  posterUrl: v.optional(v.string()),
};

const importedRowValidator = v.union(
  v.object({
    status: v.literal("library"),
    ...commonFields,
    headRating: v.number(),
    heartRating: v.number(),
  }),
  v.object({
    status: v.literal("wishlist"),
    ...commonFields,
  }),
  v.object({
    status: v.literal("currently"),
    ...commonFields,
    progress: v.number(),
    totalPages: v.optional(v.number()),
    totalEpisodes: v.optional(v.number()),
  }),
);

function validRating(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 5;
}

export const importMediaRows = mutation({
  args: {
    mode: v.union(v.literal("add"), v.literal("replace")),
    rows: v.array(importedRowValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.mode === "replace") {
      const [library, wishlist, currently] = await Promise.all([
        ctx.db.query("mediaEntries").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("wishlistItems").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("currentlyItems").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ]);
      for (const item of [...library, ...wishlist, ...currently]) {
        if ("headRating" in item) await ctx.db.delete("mediaEntries", item._id);
        else if ("dateAdded" in item) await ctx.db.delete("wishlistItems", item._id);
        else await ctx.db.delete("currentlyItems", item._id);
      }
    }

    let imported = 0;
    for (const row of args.rows) {
      if (row.status === "library") {
        if (!validRating(row.headRating) || !validRating(row.heartRating)) {
          throw new Error("Library ratings must be integers between 0 and 5");
        }
        await ctx.db.insert("mediaEntries", {
          userId, title: row.title, type: row.type, dateWatched: row.date,
          headRating: row.headRating, heartRating: row.heartRating,
          notes: row.notes, posterUrl: row.posterUrl,
        });
      } else if (row.status === "wishlist") {
        await ctx.db.insert("wishlistItems", {
          userId, title: row.title, type: row.type, dateAdded: row.date,
          notes: row.notes, posterUrl: row.posterUrl,
        });
      } else {
        await ctx.db.insert("currentlyItems", {
          userId, title: row.title, type: row.type, dateStarted: row.date,
          progress: row.progress, totalPages: row.totalPages,
          totalEpisodes: row.totalEpisodes, notes: row.notes, posterUrl: row.posterUrl,
        });
      }
      imported++;
    }
    return imported;
  },
});
