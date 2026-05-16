# HeadandHeart — AI Agent Guidance

A quick-reference document for understanding the app's structure, conventions, and data flow without reading every file.

---

## What the App Does

**HeadandHeart** is a personal media tracking app. Users log movies, books, TV shows, video games, and board games with two separate 1–5 ratings:

- **Head** — Intellectual/craft quality (how *good* is it?)
- **Heart** — Emotional enjoyment (how much did you *enjoy* it?)

Three item states: **Library** (rated), **Currently** (in progress), and **Wishlist** (planned). Pipeline flow: Wishlist → Currently → Library. Stats view analyses rating patterns.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript (Vite 7) |
| Styling | Tailwind CSS v4 (`@theme` in `index.css`), custom CSS classes, VT323 monospace font, forced dark mode |
| Backend / DB | [Convex](https://convex.dev) (real-time BaaS) |
| Auth | `@convex-dev/auth` (email/password) |
| External APIs | TMDB (movies/TV), OpenLibrary (books), RAWG (games) |
| Types | Shared via `src/types.ts` + Convex-generated `convex/_generated/` |

---

## File Map

```
src/
  types.ts       — Shared types (MediaType, MediaEntry, WishlistItem, CurrentlyItem, AppMode, sort options)
  App.tsx         — Entire frontend UI (single large file, ~2000 lines)
  Stats.tsx       — Stats view component (lazy-loaded, uses shared types)
  index.css       — All CSS custom properties, component classes, Tailwind config (forced dark mode)
  main.tsx        — React root mount, Convex provider setup

convex/
  schema.ts       — Database schema: mediaEntries, wishlistItems, currentlyItems tables
  mediaEntries.ts — Queries/mutations for the library
  wishlist.ts     — Queries/mutations for the wishlist
  currently.ts    — Queries/mutations for in-progress items + pipeline mutations (promoteToCurrently, completeCurrently, demoteCurrently)
  lookup.ts       — Action for external API search (TMDB, OpenLibrary, RAWG)
  auth.ts         — Auth configuration (Convex Auth)
  auth.config.ts  — Auth provider config
  http.ts         — HTTP action endpoints (auth callbacks)
```

---

## Data Model

### `mediaEntries` table
```ts
{ userId, title, type (MediaType), headRating (1-5), heartRating (1-5), dateWatched (ms), notes? }
// Index: by_user → [userId]
```

### `wishlistItems` table
```ts
{ userId, title, type, dateAdded (ms), notes? }
// Index: by_user → [userId]
```

### `currentlyItems` table
```ts
{ userId, title, type, dateStarted (ms), progress (0-100), notes? }
// Index: by_user → [userId]
```

---

## App.tsx Structure (top to bottom)

1. **Imports** — react-dom, convex hooks, shared types, lazy Stats
2. **Cache helpers** — generic `getCached`/`setCached`/`invalidateCacheKey` for entries, wishlist, and currently. 1-hour TTL.
3. **Icons** — inline SVG icons (keyed JSX object)
4. **Constants** — MEDIA_TYPES, RATING_DESCRIPTIONS, RATING_LABELS
5. **LoadingSkeleton** + **StatsLoadingSkeleton**
6. **App** — root: mode cycles library→currently→wishlist; Stats lazy-loaded via Suspense
7. **StatsLoader** — fetches all entries for stats; falls back to cache
8. **Header** — sticky header, mode cycle pill, stats button (always enabled), dropdown menu
9. **WelcomeSection** + **SignInForm** — unauthenticated landing page
10. **Content** — main view: manages modals, filters, sorting for all three modes
11. **MediaSearchAutocomplete** — debounced API search dropdown in modals
12. **EntryModal** — add/edit library items with rating grid + API search; keyboard shortcuts stabilized with refs
13. **WishlistModal** — add/edit wishlist items with API search
14. **CurrentlyModal** — add/edit in-progress items with progress slider
15. **CompleteModal** — rate & finish a currently item (moves to library)
16. **RatingGrid** — 5×5 grid (Head Y, Heart X) with type-specific tooltips
17. **WishlistCard** — card with "Start" button to promote to currently
18. **MediaEntryCard** — card with expand-on-click for full details
19. **CurrentlyCard** — card with progress bar, "Complete" button, "Wishlist" demote button
20. **ImportModal** — CSV importer for favourites.me format

---

## Key Patterns & Conventions

- **Cache invalidation**: Always call `invalidateCache()`, `invalidateWishlistCache()`, or `invalidateCurrentlyCache()` after mutations. Pipeline mutations invalidate both source and target caches.
- **Type narrowing**: Convex query results are cast with `as MediaEntry[]` since generated types differ slightly.
- **Shared types**: All interfaces and type unions are in `src/types.ts`. Both App.tsx and Stats.tsx import from there.
- **Forced dark mode**: No `@media` queries for color scheme — dark is the default in `index.css`.
- **Lazy stats**: `Stats.tsx` is lazy-loaded via `React.lazy()` + `Suspense`. It code-splits to its own chunk.
- **Convex `_generated/`**: Never hand-edit. Committed to git. Regenerated via `npx convex dev` or `npx convex codegen`.
- **Three tsconfigs**: `tsconfig.json` references `tsconfig.app.json` (src + convex) and `tsconfig.node.json` (vite.config). Convex has its own `convex/tsconfig.json`.
- **ESLint**: Runs `@convex-dev/eslint-plugin` with explicit table IDs rule — all `ctx.db.get`/`patch`/`delete` calls require explicit table name as first argument.
- **Prettier**: Empty `.prettierrc` (default settings).
- **Pipeline flow**: Wishlist "Start" → Currently "Complete" → Library (rated). Currently "Wishlist" button demotes back to wishlist.
- **API search**: `MediaSearchAutocomplete` component in modals queries TMDB (movies/TV), OpenLibrary (books), RAWG (games). TMDB key in `.env.local` as `TMDB_API_KEY`.

---

## Convex API Surface

| API | Type | Description |
|---|---|---|
| `api.mediaEntries.getMediaEntries` | query | Get user's entries, optional `typeFilter` |
| `api.mediaEntries.addMediaEntry` | mutation | Add a new entry |
| `api.mediaEntries.updateMediaEntry` | mutation | Update fields of an existing entry |
| `api.mediaEntries.deleteMediaEntry` | mutation | Delete entry |
| `api.wishlist.getWishlistItems` | query | Get user's wishlist, optional `typeFilter` |
| `api.wishlist.addWishlistItem` | mutation | Add wishlist item |
| `api.wishlist.updateWishlistItem` | mutation | Update wishlist item |
| `api.wishlist.deleteWishlistItem` | mutation | Delete wishlist item |
| `api.currently.getCurrentlyItems` | query | Get user's in-progress items |
| `api.currently.addCurrentlyItem` | mutation | Add directly to currently |
| `api.currently.updateCurrentlyItem` | mutation | Update currently item |
| `api.currently.deleteCurrentlyItem` | mutation | Delete currently item |
| `api.currently.promoteToCurrently` | mutation | Wishlist → Currently |
| `api.currently.completeCurrently` | mutation | Currently → Library (with ratings) |
| `api.currently.demoteCurrently` | mutation | Currently → Wishlist |
| `api.lookup.searchMedia` | action | Search TMDB/OpenLibrary/RAWG |

All mutations are user-scoped via `getAuthUserId(ctx)`.
