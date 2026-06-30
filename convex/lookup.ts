"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const TMDB_BASE = "https://api.themoviedb.org/3";
const OL_BASE = "https://openlibrary.org";
const WIKI_BASE = "https://en.wikipedia.org/w/api.php";

function getTmdbKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY not set in Convex environment. Run: npx convex env set TMDB_API_KEY <key>");
  return key;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status}`);
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

// Search for media by title for autocomplete
export const searchMedia = action({
  args: {
    query: v.string(),
    type: v.union(
      v.literal("movie"),
      v.literal("book"),
      v.literal("tvshow"),
      v.literal("videogame"),
      v.literal("boardgame")
    ),
  },
  handler: async (_ctx, args): Promise<{ title: string; year?: string; poster?: string }[]> => {
    const q = encodeURIComponent(args.query.trim());
    if (!q || q.length < 2) return [];
    const results: { title: string; year?: string; poster?: string }[] = [];

    if (args.type === "movie") {
      try {
        const res = await fetchWithRetry(
          `${TMDB_BASE}/search/movie?api_key=${getTmdbKey()}&query=${q}&language=en-US&page=1`
        );
        if (!res.ok) {
          console.error(`TMDB movie search failed: ${res.status} ${res.statusText}`);
          return [];
        }
        const data = await res.json();
        if (data.results) {
          for (const r of data.results.slice(0, 8)) {
            results.push({
              title: r.title,
              year: r.release_date ? r.release_date.slice(0, 4) : undefined,
              poster: r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : undefined,
            });
          }
        }
      } catch (err) { console.error("TMDB movie search error:", err); }
    } else if (args.type === "tvshow") {
      try {
        const res = await fetchWithRetry(
          `${TMDB_BASE}/search/tv?api_key=${getTmdbKey()}&query=${q}&language=en-US&page=1`
        );
        if (!res.ok) {
          console.error(`TMDB TV search failed: ${res.status} ${res.statusText}`);
          return [];
        }
        const data = await res.json();
        if (data.results) {
          for (const r of data.results.slice(0, 8)) {
            results.push({
              title: r.name,
              year: r.first_air_date ? r.first_air_date.slice(0, 4) : undefined,
              poster: r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : undefined,
            });
          }
        }
      } catch (err) { console.error("TMDB TV search error:", err); }
    } else if (args.type === "book") {
      try {
        const res = await fetchWithRetry(
          `${OL_BASE}/search.json?q=${q}&limit=8&fields=title,first_publish_year,cover_i`
        );
        if (!res.ok) return [];
        const data = await res.json();
        if (data.docs) {
          for (const doc of data.docs) {
            results.push({
              title: doc.title,
              year: doc.first_publish_year?.toString(),
              poster: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg` : undefined,
            });
          }
        }
      } catch (err) { console.error("OpenLibrary search error:", err); }
    } else if (args.type === "videogame" || args.type === "boardgame") {
      try {
        const res = await fetchWithRetry(
          `${WIKI_BASE}?action=query&list=search&srsearch=${q}&format=json&origin=*&srlimit=8`
        );
        if (!res.ok) return [];
        const data = await res.json();
        if (data.query?.search) {
          for (const r of data.query.search) {
            results.push({ title: r.title });
          }
        }
      } catch (err) { console.error("Wikipedia search error:", err); }
    }

    return results;
  },
});

// Fetch global rating data for comparison
export const getGlobalRating = action({
  args: {
    title: v.string(),
    type: v.union(
      v.literal("movie"),
      v.literal("book"),
      v.literal("tvshow"),
      v.literal("videogame"),
      v.literal("boardgame")
    ),
  },
  handler: async (_ctx, args): Promise<{
    globalRating: number | null;
    globalVotes: number | null;
    source: string;
  }> => {
    const q = encodeURIComponent(args.title.trim());
    if (!q) return { globalRating: null, globalVotes: null, source: "none" };

    if (args.type === "movie") {
      try {
        const res = await fetchWithRetry(
          `${TMDB_BASE}/search/movie?api_key=${getTmdbKey()}&query=${q}&language=en-US&page=1`
        );
        if (!res.ok) return { globalRating: null, globalVotes: null, source: "none" };
        const data = await res.json();
        if (data.results?.[0]) {
          const m = data.results[0];
          // TMDB vote_average is 0-10
          const rating = m.vote_average != null ? Math.round((m.vote_average / 2) * 10) / 10 : null;
          return {
            globalRating: rating,
            globalVotes: m.vote_count ?? null,
            source: "TMDB",
          };
        }
      } catch (err) { console.error("getGlobalRating movie:", err); }
    } else if (args.type === "tvshow") {
      try {
        const res = await fetchWithRetry(
          `${TMDB_BASE}/search/tv?api_key=${getTmdbKey()}&query=${q}&language=en-US&page=1`
        );
        if (!res.ok) return { globalRating: null, globalVotes: null, source: "none" };
        const data = await res.json();
        if (data.results?.[0]) {
          const m = data.results[0];
          const rating = m.vote_average != null ? Math.round((m.vote_average / 2) * 10) / 10 : null;
          return {
            globalRating: rating,
            globalVotes: m.vote_count ?? null,
            source: "TMDB",
          };
        }
      } catch (err) { console.error("getGlobalRating tv:", err); }
    } else if (args.type === "book") {
      try {
        const res = await fetchWithRetry(
          `${OL_BASE}/search.json?q=${q}&limit=1&fields=title,ratings_average,ratings_count`
        );
        if (!res.ok) return { globalRating: null, globalVotes: null, source: "none" };
        const data = await res.json();
        if (data.docs?.[0]) {
          const doc = data.docs[0];
          const rating = doc.ratings_average != null ? Math.round(doc.ratings_average * 10) / 10 : null;
          return {
            globalRating: rating,
            globalVotes: doc.ratings_count ?? null,
            source: "OpenLibrary",
          };
        }
      } catch (err) { console.error("getGlobalRating book:", err); }
    }

    return { globalRating: null, globalVotes: null, source: "none" };
  },
});
