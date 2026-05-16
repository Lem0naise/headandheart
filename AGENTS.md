# AGENTS.md

Compact rules for AI agents working in this repo.

## Commands

```bash
npm run dev          # starts Vite + Convex dev server (frontend + backend parallel)
npm run predev       # first-time setup: runs Convex auth setup script
npm run build        # tsc -b && vite build
npm run lint         # tsc && eslint . --ext ts,tsx --max-warnings 0
npx convex codegen   # regenerate convex/_generated/ after schema changes
```

The lint command runs `tsc` (all tsconfigs) THEN eslint. Both must pass.

## Architecture

- **Monolithic App.tsx** (~2000 lines): all UI components (Header, Content, modals, cards) live in one file. Do NOT split into separate component files unless asked.
- **Stats.tsx** is lazy-loaded via `React.lazy()`. It code-splits to its own chunk.
- **Shared types** are in `src/types.ts` — both App.tsx and Stats.tsx import from here.
- **Tailwind v4**: uses `@theme` block in `index.css` for design tokens. No `tailwind.config.js`. Force dark mode — no `@media prefers-color-scheme` queries.
- **Three tsconfigs**: root `tsconfig.json` (references), `tsconfig.app.json` (src + convex), `tsconfig.node.json` (vite.config). Convex has its own `convex/tsconfig.json`.

## Convex Backend

- `convex/_generated/` is auto-generated. **Never hand-edit.** Committed to git (not in .gitignore).
- Regenerate with `npx convex codegen` after any schema/convex-file change.
- All `ctx.db.get()`, `ctx.db.patch()`, `ctx.db.delete()` calls MUST include explicit table name as first argument (enforced by `@convex-dev/eslint-plugin`).
- Auth: `@convex-dev/auth` with Password provider. Use `getAuthUserId(ctx)` in all Convex functions for authorization.
- External API calls go through Convex actions (not frontend) to avoid CORS. `convex/lookup.ts` is the API proxy.
- TMDB API key is in `.env.local` as `TMDB_API_KEY` (read by Convex server at runtime, not Vite).

## Three-Item Pipeline

Modes cycle: **Library** → **Currently** → **Wishlist** → Library...

- Wishlist "Start" button → `api.currently.promoteToCurrently` (deletes wishlist item, creates currently entry)
- Currently "Complete" button → opens rating modal → `api.currently.completeCurrently` (deletes currently item, creates library entry)
- Currently "Wishlist" button → `api.currently.demoteCurrently` (moves back to wishlist)
- All pipeline mutations invalidate both source and target caches.

## Styling

- All CSS in `src/index.css`. Font: VT323. Forced dark background.
- Reusable classes: `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-accent`, `.input`, `.select`, `.modal-overlay`, `.modal-content`, `.entry-card`, `.entry-banner`, `.filter-pill`, `.control-bar`, `.entries-grid`, `.progress-bar`, `.mode-cycle-pill`, `.autocomplete-wrapper`, `.card-expanded`, `.card-in`

## Cache System

- Three localStorage caches (entries, wishlist, currently) with 1-hour TTL.
- Cache is invalidated on every mutation via `invalidateCache()`, `invalidateWishlistCache()`, or `invalidateCurrentlyCache()`.
- Pipeline mutations must invalidate both source and target caches.

## Key Files Reference

Extended docs at `guidance.md` — read that for file-by-file breakdown, data model, and API reference.
