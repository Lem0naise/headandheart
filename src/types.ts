import { Id } from "../convex/_generated/dataModel";

export type MediaType = "movie" | "book" | "tvshow" | "videogame" | "boardgame";

export interface MediaEntry {
  _id: Id<"mediaEntries">;
  title: string;
  type: MediaType;
  headRating: number;
  heartRating: number;
  dateWatched: number;
  notes?: string;
}

export interface WishlistItem {
  _id: Id<"wishlistItems">;
  title: string;
  type: MediaType;
  dateAdded: number;
  notes?: string;
}

export interface CurrentlyItem {
  _id: Id<"currentlyItems">;
  title: string;
  type: MediaType;
  dateStarted: number;
  progress: number;
  notes?: string;
}

export type LibrarySortOption = "dateNewest" | "dateOldest" | "alphaAZ" | "alphaZA" | "rating";
export type WishlistSortOption = "dateNewest" | "dateOldest" | "alphaAZ" | "alphaZA";
export type CurrentlySortOption = "dateNewest" | "dateOldest" | "alphaAZ" | "alphaZA";

export type AppMode = "library" | "currently" | "wishlist";
