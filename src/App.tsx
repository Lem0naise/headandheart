"use client";

import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useMutation,
  useQuery,
  useAction,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { Component, useState, useMemo, useEffect, useRef, useCallback, useDeferredValue, lazy, Suspense, type JSX, type ReactNode } from "react";
import type { MediaType, MediaEntry, WishlistItem, CurrentlyItem, LibrarySortOption, WishlistSortOption, CurrentlySortOption, AppMode } from "./types";

const StatsView = lazy(() => import("./Stats"));
const ExportModal = lazy(() => import("./ExportModal"));

const CACHE_KEY = "headandheart_entries_cache_v2";
const WISHLIST_CACHE_KEY = "headandheart_wishlist_cache_v2";
const CURRENTLY_CACHE_KEY = "headandheart_currently_cache_v2";

interface CacheData<T> {
  data: T[];
  timestamp: number;
  filter?: string;
}

function getCached<T>(key: string): { data: T[]; filter?: string } | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed: CacheData<T> = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > 60 * 60 * 1000) return null;
    return { data: parsed.data, filter: parsed.filter };
  } catch { return null; }
}

function setCached<T>(key: string, data: T[], filter?: string) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now(), filter }));
  } catch { /* ignore */ }
}

function invalidateCacheKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch { /* ignore */ }
}

const getCachedEntries = () => getCached<MediaEntry>(CACHE_KEY);
const setCachedEntries = (data: MediaEntry[], filter?: string) => setCached(CACHE_KEY, data, filter);
const invalidateCache = () => invalidateCacheKey(CACHE_KEY);
const getCachedWishlistItems = () => getCached<WishlistItem>(WISHLIST_CACHE_KEY);
const setCachedWishlistItems = (data: WishlistItem[], filter?: string) => setCached(WISHLIST_CACHE_KEY, data, filter);
const invalidateWishlistCache = () => invalidateCacheKey(WISHLIST_CACHE_KEY);
const getCachedCurrentlyItems = () => getCached<CurrentlyItem>(CURRENTLY_CACHE_KEY);
const setCachedCurrentlyItems = (data: CurrentlyItem[], filter?: string) => setCached(CURRENTLY_CACHE_KEY, data, filter);
const invalidateCurrentlyCache = () => invalidateCacheKey(CURRENTLY_CACHE_KEY);

const Icons = {
  logo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.54 3.64 13.64 4.74L12 6.5L10.36 4.74C9.26 3.64 9 3 9.5 3" />
      <circle cx="16" cy="6" r="3" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  signOut: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  movie: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
    </svg>
  ),
  tv: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
    </svg>
  ),
  game: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  ),
  dice: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z" />
    </svg>
  ),
  empty: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  ),
  head: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="5" />
      <path d="M12 14c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5z" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17,8 12,3 7,8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  skip: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="5,4 15,12 5,20" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="1,4 1,10 7,10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
};

const MEDIA_TYPES: { value: MediaType; label: string; icon: JSX.Element }[] = [
  { value: "movie", label: "Movie", icon: Icons.movie },
  { value: "book", label: "Book", icon: Icons.book },
  { value: "tvshow", label: "TV", icon: Icons.tv },
  { value: "videogame", label: "Game", icon: Icons.game },
  { value: "boardgame", label: "Board", icon: Icons.dice },
];

function LoadingSkeleton() {
  return (
    <div className="diary-page animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="diary-row">
          <div className="h-4 bg-current opacity-10 rounded w-10"></div>
          <div className="flex flex-col gap-2">
            <div className="h-6 bg-current opacity-10 rounded w-3/5"></div>
            <div className="h-3 bg-current opacity-10 rounded w-2/5"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-12 animate-pulse">
      <div className="flex items-center gap-4 mb-2">
        <div className="h-10 bg-current opacity-10 rounded w-24"></div>
        <div className="h-8 bg-current opacity-10 rounded w-48"></div>
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="page-sheet">
          <div className="h-6 bg-current opacity-10 rounded w-64 mb-4"></div>
          <div className="h-64 bg-current opacity-10 rounded"></div>
        </div>
      ))}
    </div>
  );
}

const modeOrder: AppMode[] = ["library", "currently", "wishlist"];
type View = "home" | "stats";
type Theme = "light" | "dark";
type UnifiedMedia = (MediaEntry | WishlistItem | CurrentlyItem) & {
  status: AppMode;
  activityDate: number;
};

function modeLabel(m: AppMode): string {
  if (m === "library") return "Library";
  if (m === "currently") return "Currently";
  return "Wishlist";
}

function modeActiveClass(m: AppMode): string {
  if (m === "library") return "active-library";
  if (m === "currently") return "active-currently";
  return "active-wishlist";
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("headandheart_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("headandheart_theme", theme);
  }, [theme]);

  return [theme, () => setTheme((current) => current === "light" ? "dark" : "light")] as const;
}

class ViewErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="empty-state card">
          <p className="text-lg">This view wandered off the page.</p>
          <button className="btn btn-primary mt-3" onClick={() => this.setState({ failed: false })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<AppMode>("library");
  const [theme, toggleTheme] = useTheme();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [cachedData, setCachedData] = useState<{ data: MediaEntry[]; filter?: string } | null>(() => getCachedEntries());
  const shouldLoadAllMedia = Boolean(deferredSearchQuery.trim());
  const allMedia = useQuery(
    // @ts-expect-error - Convex "skip" pattern is not included in the hook type.
    shouldLoadAllMedia ? api.mediaEntries.getAllMedia : "skip",
    shouldLoadAllMedia ? {} : "skip",
  ) as UnifiedMedia[] | undefined;

  const handleEntriesUpdate = useCallback((data: MediaEntry[], filter?: string) => {
    setCachedData({ data, filter });
  }, []);

  return (
    <>
      <Header
        currentView={view}
        onViewChange={setView}
        mode={mode}
        onModeChange={setMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
      <main className="p-3 md:p-6 max-w-5xl mx-auto">
        <Authenticated>
          {view === "home" ? (
            <Content
              mode={mode}
              onModeChange={setMode}
              searchQuery={deferredSearchQuery}
              cachedData={cachedData}
              onEntriesUpdate={handleEntriesUpdate}
              globalResults={allMedia}
            />
          ) : (
            <ViewErrorBoundary>
              <Suspense fallback={<StatsLoadingSkeleton />}>
                <StatsLoader
                  onBack={() => setView("home")}
                  cachedData={cachedData}
                  onEntriesUpdate={handleEntriesUpdate}
                />
              </Suspense>
            </ViewErrorBoundary>
          )}
        </Authenticated>
        <Unauthenticated>
          <WelcomeSection />
        </Unauthenticated>
      </main>
    </>
  );
}

function StatsLoader({
  onBack,
  cachedData,
  onEntriesUpdate
}: {
  onBack: () => void;
  cachedData: { data: MediaEntry[]; filter?: string } | null;
  onEntriesUpdate: (entries: MediaEntry[], filter?: string) => void;
}) {
  const entries = useQuery(api.mediaEntries.getMediaEntries, { typeFilter: undefined });

  useEffect(() => {
    if (entries) {
      const typedEntries = entries as MediaEntry[];
      setCachedEntries(typedEntries);
      onEntriesUpdate(typedEntries, undefined);
    }
  }, [entries, onEntriesUpdate]);

  if (!entries && cachedData && !cachedData.filter) {
    return <StatsView entries={cachedData.data} onBack={onBack} />;
  }

  if (!entries) {
    return <StatsLoadingSkeleton />;
  }

  return <StatsView entries={entries as MediaEntry[]} onBack={onBack} />;
}

function Header({
  currentView,
  onViewChange,
  mode,
  onModeChange,
  searchQuery,
  onSearchChange,
  theme,
  onThemeToggle,
}: {
  currentView?: View;
  onViewChange?: (v: View) => void;
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  theme: Theme;
  onThemeToggle: () => void;
}) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="flex items-center justify-between w-full md:gap-4">
        <div className="logo cursor-pointer shrink-0" onClick={() => onViewChange?.("home")}>
          <span className="logo-icon">{Icons.heart}</span>
          <span className="hidden md:inline">HeadandHeart</span>
        </div>

        {/* Desktop search + mode */}
        {isAuthenticated && currentView === "home" && (
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            <div className="max-w-sm w-full">
              <input
                type="text"
                className="input py-1 px-3 w-full h-9 text-sm"
                placeholder="Search... (f)"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="flex items-center gap-1.5 md:gap-2">
            {currentView === "home" && (
              <div className="hidden md:flex items-center gap-1.5">
                <div className="chapter-tabs">
                  {modeOrder.map((m) => (
                    <button
                      key={m}
                      className={`chapter-tab ${mode === m ? `active ${modeActiveClass(m)}` : ""}`}
                      onClick={() => onModeChange(m)}
                      aria-current={mode === m ? "page" : undefined}
                    >
                      {modeLabel(m)}
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onViewChange?.("stats")}
                  title="Taste Stats"
                >
                  {Icons.chart}
                  <span>Stats</span>
                </button>
              </div>
            )}

            <div className="dropdown">
              <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? Icons.close : Icons.menu}
              </button>

            {menuOpen && (
              <div className="dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={() => { onViewChange?.("home"); setMenuOpen(false); }}
                >
                  {Icons.home}
                  <span>Home</span>
                </button>
                <button
                  className="dropdown-item md:hidden"
                  onClick={() => { onViewChange?.("stats"); setMenuOpen(false); }}
                >
                  {Icons.chart}
                  <span>Stats</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => { onThemeToggle(); setMenuOpen(false); }}
                >
                  <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
                  <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
                </button>
                <a
                  href="https://indigo.spot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dropdown-item"
                  onClick={() => setMenuOpen(false)}
                >
                  {Icons.home}
                  <span>Indigo's Site</span>
                </a>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    window.dispatchEvent(new CustomEvent("openImportModal"));
                  }}
                >
                  {Icons.upload}
                  <span>Import</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    window.dispatchEvent(new CustomEvent("openExportModal"));
                  }}
                >
                  <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>{Icons.upload}</span>
                  <span>Export</span>
                </button>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={() => { void signOut(); setMenuOpen(false); }}
                >
                  {Icons.signOut}
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      </div>

      {/* Mobile Search Bar */}
      {isAuthenticated && currentView === "home" && (
        <div className="flex md:hidden w-full mt-2">
          <input
            type="text"
            className="input w-full py-1 px-3 h-8 text-sm"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
      {isAuthenticated && (
        <nav className="mobile-bottom-nav md:hidden" aria-label="Primary navigation">
          <button className={currentView === "home" && mode === "library" ? "active-library" : ""} onClick={() => { onViewChange?.("home"); onModeChange("library"); }}>Library</button>
          <button className={currentView === "home" && mode === "currently" ? "active-currently" : ""} onClick={() => { onViewChange?.("home"); onModeChange("currently"); }}>Current</button>
          <button className={currentView === "home" && mode === "wishlist" ? "active-wishlist" : ""} onClick={() => { onViewChange?.("home"); onModeChange("wishlist"); }}>Wishlist</button>
          <button className={currentView === "stats" ? "active-stats" : ""} onClick={() => onViewChange?.("stats")}>Stats</button>
        </nav>
      )}
    </header>
  );
}

function WelcomeSection() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-7 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl mb-3">HeadandHeart</h1>
        <p className="margin-note text-lg">
          Rate what you watch, read, and play — Head and Heart.
        </p>
      </div>
      <SignInForm />
    </div>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="page-sheet w-full max-w-sm">
      <h3 className="text-2xl mb-3 text-center">
        {flow === "signIn" ? "Sign in" : "Sign up"}
      </h3>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData)
            .catch((error: Error) => {
              const msg = error.message;
              if (msg === "InvalidAccountId" || msg.includes("Invalid credentials")) {
                setError("No account found with that email.");
              } else if (msg === "InvalidSecret") {
                setError("Incorrect password.");
              } else if (msg === "TooManyFailedAttempts") {
                setError("Too many attempts. Please try again later.");
              } else {
                setError(msg);
              }
            })
            .finally(() => setLoading(false));
        }}
      >
        <input className="input" type="email" name="email" placeholder="Email" required />
        <input className="input" type="password" name="password" placeholder="Password" required />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "..." : flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-sm">
          <span className="opacity-60">
            {flow === "signIn" ? "No account? " : "Have account? "}
          </span>
          <button
            type="button"
            className="underline"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </div>
        {error && (
          <div className="text-sm p-2 rounded" style={{ color: "var(--color-negative)", border: "var(--stitch)", borderColor: "var(--color-negative)" }}>{error}</div>
        )}
      </form>
    </div>
  );
}

function Content({
  mode,
  onModeChange,
  searchQuery,
  cachedData,
  onEntriesUpdate,
  globalResults,
}: {
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  searchQuery?: string;
  cachedData: { data: MediaEntry[]; filter?: string } | null;
  onEntriesUpdate: (entries: MediaEntry[], filter?: string) => void;
  globalResults: UnifiedMedia[] | undefined;
}) {
  const isLibrary = mode === "library";
  const isCurrently = mode === "currently";
  const isWishlist = mode === "wishlist";

  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MediaEntry | null>(null);
  const [editingWishlist, setEditingWishlist] = useState<WishlistItem | null>(null);
  const [editingCurrently, setEditingCurrently] = useState<CurrentlyItem | null>(null);
  const [completingItem, setCompletingItem] = useState<CurrentlyItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [librarySortOption, setLibrarySortOption] = useState<LibrarySortOption>("dateNewest");
  const [wishlistSortOption, setWishlistSortOption] = useState<WishlistSortOption>("dateNewest");
  const [currentlySortOption, setCurrentlySortOption] = useState<CurrentlySortOption>("dateNewest");
  const [headWeight, setHeadWeight] = useState(50);
  const [cachedWishlistData, setCachedWishlistData] = useState<{ data: WishlistItem[]; filter?: string } | null>(() => getCachedWishlistItems());
  const [cachedCurrentlyData, setCachedCurrentlyData] = useState<{ data: CurrentlyItem[]; filter?: string } | null>(() => getCachedCurrentlyItems());

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const tf = typeFilter === "all" ? undefined : typeFilter;

  const entries = useQuery(
    // @ts-expect-error - Convex "skip" pattern not in TS types
    mode === "library" ? api.mediaEntries.getMediaEntries : "skip",
    mode === "library" ? { typeFilter: tf } : "skip"
  );
  const wishlistItems = useQuery(
    // @ts-expect-error - Convex "skip" pattern not in TS types
    mode === "wishlist" ? api.wishlist.getWishlistItems : "skip",
    mode === "wishlist" ? { typeFilter: tf } : "skip"
  );
  const currentlyItemsQuery = useQuery(
    // @ts-expect-error - Convex "skip" pattern not in TS types
    mode === "currently" ? api.currently.getCurrentlyItems : "skip",
    mode === "currently" ? { typeFilter: tf } : "skip"
  );

  useEffect(() => {
    if (entries) {
      const typed = entries as MediaEntry[];
      const filter = typeFilter === "all" ? undefined : typeFilter;
      setCachedEntries(typed, filter);
      onEntriesUpdate(typed, filter);
    }
  }, [entries, onEntriesUpdate, typeFilter]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setShowAddForm(false);
    setShowImport(false);
    setShowExport(false);
    setEditingEntry(null);
    setEditingWishlist(null);
    setEditingCurrently(null);
    setCompletingItem(null);
  }, [mode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const handler = () => {
      setShowImport(true);
    };
    window.addEventListener("openImportModal", handler as EventListener);
    return () => window.removeEventListener("openImportModal", handler as EventListener);
  }, []);

  useEffect(() => {
    const handler = () => setShowExport(true);
    window.addEventListener("openExportModal", handler as EventListener);
    return () => window.removeEventListener("openExportModal", handler as EventListener);
  }, []);

  useEffect(() => {
    if (wishlistItems) {
      const typed = wishlistItems as WishlistItem[];
      const filter = typeFilter === "all" ? undefined : typeFilter;
      setCachedWishlistItems(typed, filter);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing query data to cache state
      setCachedWishlistData({ data: typed, filter });
    }
  }, [wishlistItems, typeFilter]);

  useEffect(() => {
    if (currentlyItemsQuery) {
      const typed = currentlyItemsQuery as CurrentlyItem[];
      const filter = typeFilter === "all" ? undefined : typeFilter;
      setCachedCurrentlyItems(typed, filter);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing query data to cache state
      setCachedCurrentlyData({ data: typed, filter });
    }
  }, [currentlyItemsQuery, typeFilter]);

  const currentFilter = typeFilter === "all" ? undefined : typeFilter;
  const libraryDisplayEntries = entries ?? (cachedData && cachedData.filter === currentFilter ? cachedData.data : null);
  const wishlistDisplayItems = wishlistItems ?? (cachedWishlistData && cachedWishlistData.filter === currentFilter ? cachedWishlistData.data : null);
  const currentlyDisplayItems = currentlyItemsQuery ?? (cachedCurrentlyData && cachedCurrentlyData.filter === currentFilter ? cachedCurrentlyData.data : null);

  const sortedLibraryEntries = useMemo(() => {
    if (!libraryDisplayEntries) return [];
    let processed = [...libraryDisplayEntries];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      processed = processed.filter(e => {
        const typeInfo = MEDIA_TYPES.find(t => t.value === e.type);
        return e.title.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q) || typeInfo?.label.toLowerCase().includes(q);
      });
    }
    switch (librarySortOption) {
      case "dateNewest": processed.sort((a, b) => b.dateWatched - a.dateWatched); break;
      case "dateOldest": processed.sort((a, b) => a.dateWatched - b.dateWatched); break;
      case "alphaAZ": processed.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "alphaZA": processed.sort((a, b) => b.title.localeCompare(a.title)); break;
      case "rating": {
        const hW = headWeight / 100;
        const hrW = 1 - hW;
        processed.sort((a, b) => (b.headRating * hW + b.heartRating * hrW) - (a.headRating * hW + a.heartRating * hrW));
        break;
      }
      case "ratingAscending": {
        const hW = headWeight / 100;
        const hrW = 1 - hW;
        processed.sort((a, b) => (a.headRating * hW + a.heartRating * hrW) - (b.headRating * hW + b.heartRating * hrW));
        break;
      }
    }
    return processed;
  }, [libraryDisplayEntries, librarySortOption, headWeight, searchQuery]);

  const sortedWishlistItems = useMemo(() => {
    const source = wishlistDisplayItems ?? [];
    let processed = [...source];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      processed = processed.filter(e => {
        const typeInfo = MEDIA_TYPES.find(t => t.value === e.type);
        return e.title.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q) || typeInfo?.label.toLowerCase().includes(q);
      });
    }
    switch (wishlistSortOption) {
      case "dateNewest": processed.sort((a, b) => b.dateAdded - a.dateAdded); break;
      case "dateOldest": processed.sort((a, b) => a.dateAdded - b.dateAdded); break;
      case "alphaAZ": processed.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "alphaZA": processed.sort((a, b) => b.title.localeCompare(a.title)); break;
    }
    return processed;
  }, [wishlistDisplayItems, wishlistSortOption, searchQuery]);

  const sortedCurrentlyItems = useMemo(() => {
    const source = currentlyDisplayItems ?? [];
    let processed = [...source];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      processed = processed.filter(e => {
        const typeInfo = MEDIA_TYPES.find(t => t.value === e.type);
        return e.title.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q) || typeInfo?.label.toLowerCase().includes(q);
      });
    }
    switch (currentlySortOption) {
      case "dateNewest": processed.sort((a, b) => b.dateStarted - a.dateStarted); break;
      case "dateOldest": processed.sort((a, b) => a.dateStarted - b.dateStarted); break;
      case "alphaAZ": processed.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "alphaZA": processed.sort((a, b) => b.title.localeCompare(a.title)); break;
    }
    return processed;
  }, [currentlyDisplayItems, currentlySortOption, searchQuery]);

  const crossStatusResults = useMemo(() => {
    const q = searchQuery?.trim().toLowerCase();
    if (!q || !globalResults) return [];
    return globalResults
      .filter((item) => {
        const typeInfo = MEDIA_TYPES.find((type) => type.value === item.type);
        return item.title.toLowerCase().includes(q)
          || item.notes?.toLowerCase().includes(q)
          || typeInfo?.label.toLowerCase().includes(q);
      })
      .filter((item) => typeFilter === "all" || item.type === typeFilter)
      .sort((a, b) => b.activityDate - a.activityDate);
  }, [globalResults, searchQuery, typeFilter]);

  const sortOption = isLibrary ? librarySortOption : isWishlist ? wishlistSortOption : currentlySortOption;

  const isLoading = isLibrary
    ? entries === undefined && !libraryDisplayEntries
    : isWishlist
    ? wishlistItems === undefined && !wishlistDisplayItems
    : currentlyItemsQuery === undefined && !currentlyDisplayItems;

  const isCrossStatusSearch = Boolean(searchQuery?.trim());
  const displayCount = isCrossStatusSearch
    ? crossStatusResults.length
    : isLibrary ? sortedLibraryEntries.length : isWishlist ? sortedWishlistItems.length : sortedCurrentlyItems.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement).tagName;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
      const modalOpen = document.querySelector('.modal-overlay');
      const key = e.key.toLowerCase();

      // 'f' to focus search bar (works even in inputs, but not modals)
      if (key === 'f' && !modalOpen && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const searchInput = document.querySelector<HTMLInputElement>('header input[type="text"]');
        if (searchInput && tag !== 'INPUT') {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      if (modalOpen || isInput) return;

      // 'n' or 't' to add new item
      if (key === 'n' || key === 't') {
        e.preventDefault();
        setShowAddForm(true);
        return;
      }

    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onModeChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="diary-toolbar">
        <button className="btn btn-primary toolbar-add" onClick={() => setShowAddForm(true)} title="Keyboard shortcut: n or t">
          {Icons.plus}
          <span>Add</span>
        </button>

        <div className="filter-scroll" role="tablist" aria-label="Filter by type">
          <button
            className={`filter-pill ${typeFilter === "all" ? "active" : ""}`}
            onClick={() => setTypeFilter("all")}
          >
            All
          </button>
          {MEDIA_TYPES.map((t) => (
            <button
              key={t.value}
              className={`filter-pill type-${t.value} ${typeFilter === t.value ? "active" : ""}`}
              onClick={() => setTypeFilter(t.value)}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <select
          className="select text-xs py-1 diary-sort"
          aria-label="Sort entries"
          value={sortOption}
          onChange={(e) => {
            const val = e.target.value;
            if (isLibrary) setLibrarySortOption(val as LibrarySortOption);
            else if (isWishlist) setWishlistSortOption(val as WishlistSortOption);
            else setCurrentlySortOption(val as CurrentlySortOption);
          }}
        >
          <option value="dateNewest">Newest</option>
          <option value="dateOldest">Oldest</option>
          <option value="alphaAZ">A-Z</option>
          <option value="alphaZA">Z-A</option>
          {isLibrary && <option value="rating">Highest rated</option>}
          {isLibrary && <option value="ratingAscending">Lowest rated</option>}
        </select>

        {isLibrary && (librarySortOption === "rating" || librarySortOption === "ratingAscending") && (
          <div className="weight-slider w-full justify-center">
            <span style={{ color: 'var(--color-secondary)' }}>Head {headWeight}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={headWeight}
              onChange={(e) => setHeadWeight(Number(e.target.value))}
              className="slider"
              aria-label="Head versus heart weighting"
            />
            <span style={{ color: 'var(--color-primary)' }}>{100 - headWeight}% Heart</span>
          </div>
        )}
      </div>

      {showAddForm && isLibrary && <EntryModal initialType={typeFilter === "all" ? undefined : typeFilter} onClose={() => setShowAddForm(false)} onSuccess={setToast} />}
      {showAddForm && isCurrently && <CurrentlyModal initialType={typeFilter === "all" ? undefined : typeFilter} onClose={() => setShowAddForm(false)} onSuccess={setToast} />}
      {showAddForm && isWishlist && <WishlistModal initialType={typeFilter === "all" ? undefined : typeFilter} onClose={() => setShowAddForm(false)} onSuccess={setToast} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {editingEntry && <EntryModal entry={editingEntry} onClose={() => setEditingEntry(null)} onSuccess={setToast} />}
      {editingWishlist && <WishlistModal item={editingWishlist} onClose={() => setEditingWishlist(null)} onSuccess={setToast} />}
      {editingCurrently && <CurrentlyModal item={editingCurrently} onClose={() => setEditingCurrently(null)} onSuccess={setToast} />}
      {completingItem && <CompleteModal item={completingItem} onClose={() => setCompletingItem(null)} onSuccess={setToast} />}
      {showExport && (
        <Suspense fallback={null}>
          <ExportModal onClose={() => setShowExport(false)} />
        </Suspense>
      )}

      {isCrossStatusSearch ? (
        <GlobalSearchResults
          results={crossStatusResults}
          isLoading={globalResults === undefined}
          onEditEntry={setEditingEntry}
          onEditWishlist={setEditingWishlist}
          onEditCurrently={setEditingCurrently}
          onComplete={setCompletingItem}
          onToast={setToast}
        />
      ) : !isLoading && displayCount === 0 ? (
        <div className="empty-state">
          <p className="empty-line">
            {searchQuery
              ? "No matches."
              : isLibrary
              ? "No entries yet."
              : isCurrently
              ? "Nothing in progress."
              : "Wishlist is empty."}
          </p>
          <p className="empty-sub">
            {searchQuery
              ? "Try another title."
              : isLibrary
              ? "Add something you finished."
              : isCurrently
              ? "Start something."
              : "Add something you want."}
          </p>
        </div>
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className={`diary-page ${isWishlist ? "wishlist-page" : isCurrently ? "currently-page" : ""}`}>
          {isLibrary && sortedLibraryEntries.map((entry, i) => (
            <MediaEntryCard
              key={entry._id}
              entry={entry}
              headWeight={librarySortOption === "rating" || librarySortOption === "ratingAscending" ? headWeight : 50}
              onEdit={() => setEditingEntry(entry)}
              index={i}
              onToast={setToast}
            />
          ))}
          {isWishlist && sortedWishlistItems.map((item, i) => (
            <WishlistCard
              key={item._id}
              item={item}
              onEdit={() => setEditingWishlist(item)}
              index={i}
              onToast={setToast}
            />
          ))}
          {isCurrently && sortedCurrentlyItems.map((item, i) => (
            <CurrentlyCard
              key={item._id}
              item={item}
              onEdit={() => setEditingCurrently(item)}
              onComplete={() => setCompletingItem(item)}
              index={i}
              onToast={setToast}
            />
          ))}
        </div>
      )}
      {toast && <div className="toast-region" role="status"><div className="toast">{toast}</div></div>}
    </div>
  );
}

function GlobalSearchResults({
  results,
  isLoading,
  onEditEntry,
  onEditWishlist,
  onEditCurrently,
  onComplete,
  onToast,
}: {
  results: UnifiedMedia[];
  isLoading: boolean;
  onEditEntry: (entry: MediaEntry) => void;
  onEditWishlist: (item: WishlistItem) => void;
  onEditCurrently: (item: CurrentlyItem) => void;
  onComplete: (item: CurrentlyItem) => void;
  onToast: (message: string) => void;
}) {
  if (isLoading) return <LoadingSkeleton />;
  if (results.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-line">No matches.</p>
        <p className="empty-sub">Try another title.</p>
      </div>
    );
  }

  return (
    <section aria-label="Search results" className="diary-page">
      <p className="margin-note mb-2">
        {results.length} match{results.length === 1 ? "" : "es"}
      </p>
      {results.map((item, index) => item.status === "library" ? (
        <MediaEntryCard key={`library-${item._id}`} entry={item as MediaEntry} headWeight={50} onEdit={() => onEditEntry(item as MediaEntry)} index={index} onToast={onToast} />
      ) : item.status === "wishlist" ? (
        <WishlistCard key={`wishlist-${item._id}`} item={item as WishlistItem} onEdit={() => onEditWishlist(item as WishlistItem)} index={index} onToast={onToast} />
      ) : (
        <CurrentlyCard key={`currently-${item._id}`} item={item as CurrentlyItem} onEdit={() => onEditCurrently(item as CurrentlyItem)} onComplete={() => onComplete(item as CurrentlyItem)} index={index} onToast={onToast} />
      ))}
    </section>
  );
}

function MediaSearchAutocomplete({
  value,
  type,
  onChange,
  onPick,
  autoFocus = true,
}: {
  value: string;
  type: MediaType;
  onChange: (title: string) => void;
  onPick?: (result: { title: string; year?: string; poster?: string; type: MediaType }) => void;
  autoFocus?: boolean;
}) {
  const searchMedia = useAction(api.lookup.searchMedia);
  const [results, setResults] = useState<{ title: string; year?: string; poster?: string; type: MediaType }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const previousTypeRef = useRef(type);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const doSearch = useCallback((q: string, searchType = type) => {
    if (q.length < 2) { setResults([]); setOpen(false); setSearched(false); return; }
    setLoading(true);
    setSearched(false);
    searchMedia({ query: q, type: searchType })
      .then((r) => { setResults(r); setSearched(true); setOpen(r.length > 0); })
      .catch(() => { setResults([]); setSearched(true); setOpen(false); })
      .finally(() => setLoading(false));
  }, [searchMedia, type]);

  useEffect(() => {
    if (previousTypeRef.current === type) return;
    previousTypeRef.current = type;
    if (value.length < 2) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value, type), 200);
  }, [type, value, doSearch]);

  const handleInputChange = (q: string) => {
    onChange(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 400);
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <input
        className="input w-full"
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={`Search ${MEDIA_TYPES.find((item) => item.value === type)?.label.toLowerCase() ?? "titles"}…`}
        autoFocus={autoFocus}
      />
      {loading && <div className="text-xs opacity-50 mt-1">Searching...</div>}
      {searched && !loading && results.length === 0 && value.length >= 2 && (
        <div className="text-xs opacity-50 mt-1">No results found</div>
      )}
      {open && results.length > 0 && (
        <div className="autocomplete-dropdown">
          {results.map((r, i) => (
            <div
              key={i}
              className="autocomplete-item"
              onClick={() => {
                onChange(r.title);
                onPick?.(r);
                setOpen(false);
                setSearched(false);
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {r.poster && (
                  <img src={r.poster} alt="" className="w-8 h-12 rounded object-cover shrink-0" style={{ background: "var(--tape)" }} />
                )}
                <div className="min-w-0">
                  <div className="truncate">{r.title}</div>
                  <div className="text-xs opacity-50">{r.year ? `${r.year} · ` : ""}{MEDIA_TYPES.find((mediaType) => mediaType.value === r.type)?.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EntryModal({ entry, initialType, onClose, onSuccess }: { entry?: MediaEntry; initialType?: MediaType; onClose: () => void; onSuccess?: (message: string) => void }) {
  const addEntry = useMutation(api.mediaEntries.addMediaEntry);
  const updateEntry = useMutation(api.mediaEntries.updateMediaEntry);

  const [title, setTitle] = useState(entry?.title ?? "");
  const [type, setType] = useState<MediaType>(() => {
    const remembered = localStorage.getItem("headandheart_last_media_type") as MediaType | null;
    return entry?.type ?? initialType ?? remembered ?? "movie";
  });
  const [headRating, setHeadRating] = useState(entry?.headRating ?? 3);
  const [heartRating, setHeartRating] = useState(entry?.heartRating ?? 3);
  const [dateWatched, setDateWatched] = useState(
    entry ? new Date(entry.dateWatched).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [posterUrl, setPosterUrl] = useState(entry?.posterUrl);
  const [loading, setLoading] = useState(false);

  const isEditing = !!entry;
  const titleRef = useRef(title);
  const typeRef = useRef(type);
  const dateWatchedRef = useRef(dateWatched);
  const notesRef = useRef(notes);
  const headRatingRef = useRef(headRating);
  const heartRatingRef = useRef(heartRating);
  const posterUrlRef = useRef(posterUrl);
  const loadingRef = useRef(loading);
  const isEditingRef = useRef(isEditing);

  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { typeRef.current = type; }, [type]);
  useEffect(() => { dateWatchedRef.current = dateWatched; }, [dateWatched]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { headRatingRef.current = headRating; }, [headRating]);
  useEffect(() => { heartRatingRef.current = heartRating; }, [heartRating]);
  useEffect(() => { posterUrlRef.current = posterUrl; }, [posterUrl]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const t = titleRef.current.trim();
    if (!t || loadingRef.current) return;
    setLoading(true);
    try {
      if (isEditingRef.current && entry) {
        await updateEntry({
          id: entry._id,
          title: t,
          type: typeRef.current,
          headRating: headRatingRef.current,
          heartRating: heartRatingRef.current,
          dateWatched: new Date(dateWatchedRef.current).getTime(),
          notes: notesRef.current.trim() || undefined,
          posterUrl: posterUrlRef.current,
        });
      } else {
        await addEntry({
          title: t,
          type: typeRef.current,
          headRating: headRatingRef.current,
          heartRating: heartRatingRef.current,
          dateWatched: new Date(dateWatchedRef.current).getTime(),
          notes: notesRef.current.trim() || undefined,
          posterUrl: posterUrlRef.current,
        });
      }
      invalidateCache();
      localStorage.setItem("headandheart_last_media_type", typeRef.current);
      onSuccess?.(isEditingRef.current ? "Saved." : "Added.");
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setLoading(false);
    }
  }, [entry, addEntry, updateEntry, onClose, onSuccess]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tagName = (document.activeElement as HTMLElement).tagName;
      if (e.key === 'Enter' && !e.shiftKey && tagName !== 'TEXTAREA' && tagName !== 'BUTTON') {
        e.preventDefault();
        void handleSubmit();
        return;
      }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) return;
      if (e.key === 'ArrowUp') { e.preventDefault(); setHeadRating(h => Math.min(5, h + 1)); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setHeadRating(h => Math.max(0, h - 1)); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setHeartRating(h => Math.max(0, h - 1)); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setHeartRating(h => Math.min(5, h + 1)); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-center">{isEditing ? "Edit Entry" : "Add Entry"}</h2>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <select className="select flex-1" value={type} onChange={(e) => setType(e.target.value as MediaType)}>
              {MEDIA_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              className="input flex-1"
              type="date"
              value={dateWatched}
              onChange={(e) => setDateWatched(e.target.value)}
            />
          </div>
          <MediaSearchAutocomplete
            value={title}
            type={type}
            autoFocus={!isEditing}
            onChange={setTitle}
            onPick={(result) => { setPosterUrl(result.poster); setType(result.type); }}
          />
          <div className="quick-picks" aria-label="Date shortcuts">
            <button type="button" onClick={() => setDateWatched(new Date().toISOString().split("T")[0])}>Today</button>
            <button type="button" onClick={() => setDateWatched(new Date(Date.now() - 86_400_000).toISOString().split("T")[0])}>Yesterday</button>
            <button type="button" onClick={() => setDateWatched(new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0])}>Last week</button>
          </div>
          <RatingGrid
            headRating={headRating}
            heartRating={heartRating}
            onSelect={(head, heart) => { setHeadRating(head); setHeartRating(heart); }}
          />
          <textarea
            className="input w-full resize-none"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Review (optional)"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !title.trim()}>
              {loading ? "..." : isEditing ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WishlistModal({ item, initialType, onClose, onSuccess }: { item?: WishlistItem; initialType?: MediaType; onClose: () => void; onSuccess?: (message: string) => void }) {
  const addItem = useMutation(api.wishlist.addWishlistItem);
  const updateItem = useMutation(api.wishlist.updateWishlistItem);
  const bulkAdd = useMutation(api.wishlist.bulkAddWishlistItems);

  const [title, setTitle] = useState(item?.title ?? "");
  const [type, setType] = useState<MediaType>(item?.type ?? initialType ?? "movie");
  const [dateAdded, setDateAdded] = useState(
    item ? new Date(item.dateAdded).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [posterUrl, setPosterUrl] = useState(item?.posterUrl);
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const isEditing = !!item;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const payload = { title: title.trim(), type, dateAdded: new Date(dateAdded).getTime(), notes: notes.trim() || undefined, posterUrl };
      if (isEditing) {
        await updateItem({ id: item._id, ...payload });
      } else {
        await addItem(payload);
      }
      invalidateWishlistCache();
      localStorage.setItem("headandheart_last_media_type", type);
      onSuccess?.(isEditing ? "Saved." : "Added.");
      onClose();
    } catch (error) {
      console.error("Failed to save wishlist item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;
    setLoading(true);
    try {
      await bulkAdd({
        items: lines.map(title => ({
          title,
          type,
          dateAdded: new Date(dateAdded).getTime(),
          notes: notes.trim() || undefined,
        })),
      });
      invalidateWishlistCache();
      onClose();
    } catch (error) {
      console.error("Failed bulk add:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-center">{isEditing ? "Edit Wishlist" : "Add Wishlist"}</h2>
        {!isEditing && (
          <div className="flex justify-end mb-2">
            <button
              type="button"
              className={`btn btn-ghost btn-sm text-xs ${bulkMode ? 'active' : ''}`}
              onClick={() => { setBulkMode(!bulkMode); setBulkText(""); }}
            >
              {bulkMode ? 'Single' : 'Add Multiple'}
            </button>
          </div>
        )}
        {bulkMode && !isEditing ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select className="select flex-1" value={type} onChange={(e) => setType(e.target.value as MediaType)}>
                {MEDIA_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                className="input flex-1"
                type="date"
                value={dateAdded}
                onChange={(e) => setDateAdded(e.target.value)}
              />
            </div>
            <textarea
              className="input w-full resize-none"
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`One per line...\nDune\nFoundation\nNeuromancer`}
            />
            {bulkText.trim() && (
              <div className="text-xs opacity-50">{bulkText.split('\n').filter(l => l.trim()).length} items</div>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => { void handleBulkAdd(); }} disabled={loading || !bulkText.trim()}>
                {loading ? "..." : `Add ${bulkText.split('\n').filter(l => l.trim()).length || 0}`}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select className="select flex-1" value={type} onChange={(e) => setType(e.target.value as MediaType)}>
                {MEDIA_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                className="input flex-1"
                type="date"
                value={dateAdded}
                onChange={(e) => setDateAdded(e.target.value)}
              />
            </div>
            <MediaSearchAutocomplete value={title} type={type} autoFocus={!isEditing} onChange={setTitle} onPick={(result) => { setPosterUrl(result.poster); setType(result.type); }} />
            <textarea
              className="input w-full resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !title.trim()}>
                {loading ? "..." : isEditing ? "Save" : "Add"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CurrentlyModal({ item, initialType, onClose, onSuccess }: { item?: CurrentlyItem; initialType?: MediaType; onClose: () => void; onSuccess?: (message: string) => void }) {
  const addItem = useMutation(api.currently.addCurrentlyItem);
  const updateItem = useMutation(api.currently.updateCurrentlyItem);
  const bulkAdd = useMutation(api.currently.bulkAddCurrentlyItems);

  const [title, setTitle] = useState(item?.title ?? "");
  const [type, setType] = useState<MediaType>(item?.type ?? initialType ?? "movie");
  const [dateStarted, setDateStarted] = useState(
    item ? new Date(item.dateStarted).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [progress, setProgress] = useState(item?.progress ?? 0);
  const [totalPages, setTotalPages] = useState(item?.totalPages ?? 0);
  const [totalEpisodes, setTotalEpisodes] = useState(item?.totalEpisodes ?? 0);
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [posterUrl, setPosterUrl] = useState(item?.posterUrl);
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const isEditing = !!item;
  const isBook = type === "book" && totalPages > 0;
  const isTV = type === "tvshow" && totalEpisodes > 0;
  const trackedTotal = isBook ? totalPages : isTV ? totalEpisodes : 0;
  const effectiveProgress = (isBook || isTV) ? Math.min(100, Math.round((progress / trackedTotal) * 100)) : progress;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { title: title.trim(), type, dateStarted: new Date(dateStarted).getTime(), progress, notes: notes.trim() || undefined, posterUrl };
      if (type === "book" && totalPages > 0) payload.totalPages = totalPages;
      if (type === "tvshow" && totalEpisodes > 0) payload.totalEpisodes = totalEpisodes;
      if (isEditing) {
        await updateItem({ id: item._id, ...payload } as Parameters<typeof updateItem>[0]);
      } else {
        await addItem(payload as Parameters<typeof addItem>[0]);
      }
      invalidateCurrentlyCache();
      localStorage.setItem("headandheart_last_media_type", type);
      onSuccess?.(isEditing ? "Saved." : "Added.");
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;
    setLoading(true);
    try {
      const itemPayload: Record<string, unknown> = { title: "", type, dateStarted: new Date(dateStarted).getTime(), progress, notes: notes.trim() || undefined };
      if (type === "book" && totalPages > 0) itemPayload.totalPages = totalPages;
      if (type === "tvshow" && totalEpisodes > 0) itemPayload.totalEpisodes = totalEpisodes;
      await bulkAdd({
        items: lines.map(title => ({ ...itemPayload, title })),
      } as Parameters<typeof bulkAdd>[0]);
      invalidateCurrentlyCache();
      onClose();
    } catch (error) {
      console.error("Failed bulk add:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-center">{isEditing ? "Edit Current" : "Add Current"}</h2>
        {!isEditing && (
          <div className="flex justify-end mb-2">
            <button
              type="button"
              className={`btn btn-ghost btn-sm text-xs ${bulkMode ? 'active' : ''}`}
              onClick={() => { setBulkMode(!bulkMode); setBulkText(""); }}
            >
              {bulkMode ? 'Single' : 'Add Multiple'}
            </button>
          </div>
        )}
        {bulkMode && !isEditing ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select className="select flex-1" value={type} onChange={(e) => setType(e.target.value as MediaType)}>
                {MEDIA_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                className="input flex-1"
                type="date"
                value={dateStarted}
                onChange={(e) => setDateStarted(e.target.value)}
              />
            </div>
            {type === "book" || type === "tvshow" ? (
              <div>
                <label className="text-sm opacity-70">
                  {type === "book" ? "Page progress" : "Episode progress"}
                </label>
                <div className="flex gap-2 items-center">
                  <input className="input flex-1" type="number" min="0" value={progress || ""} onChange={(e) => setProgress(Number(e.target.value))} placeholder={type === "book" ? "Page" : "Ep"} />
                  <span className="opacity-40 text-sm">/</span>
                  <input className="input flex-1" type="number" min="1" value={type === "book" ? (totalPages || "") : (totalEpisodes || "")} onChange={(e) => type === "book" ? setTotalPages(Number(e.target.value)) : setTotalEpisodes(Number(e.target.value))} placeholder="Total" />
                </div>
                {trackedTotal > 0 && (
                  <div className="progress-bar mt-2">
                    <div className="progress-fill" style={{ width: `${effectiveProgress}%` }} />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm opacity-70">Progress</label>
                  <span className="text-sm font-bold">{progress}%</span>
                </div>
                <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="slider w-full" />
              </div>
            )}
            <textarea
              className="input w-full resize-none"
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`One per line...\nDune\nFoundation\nNeuromancer`}
            />
            {bulkText.trim() && (
              <div className="text-xs opacity-50">{bulkText.split('\n').filter(l => l.trim()).length} items</div>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => { void handleBulkAdd(); }} disabled={loading || !bulkText.trim()}>
                {loading ? "..." : `Add ${bulkText.split('\n').filter(l => l.trim()).length || 0}`}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select className="select flex-1" value={type} onChange={(e) => setType(e.target.value as MediaType)}>
                {MEDIA_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                className="input flex-1"
                type="date"
                value={dateStarted}
                onChange={(e) => setDateStarted(e.target.value)}
              />
            </div>
            <MediaSearchAutocomplete value={title} type={type} autoFocus={!isEditing} onChange={setTitle} onPick={(result) => { setPosterUrl(result.poster); setType(result.type); }} />
            {type === "book" || type === "tvshow" ? (
              <div>
                <label className="text-sm opacity-70">
                  {type === "book" ? "Page progress" : "Episode progress"}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    className="input flex-1"
                    type="number"
                    min="0"
                    value={progress || ""}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    placeholder={type === "book" ? "Page" : "Ep"}
                  />
                  <span className="opacity-40 text-sm">/</span>
                  <input
                    className="input flex-1"
                    type="number"
                    min="1"
                    value={type === "book" ? (totalPages || "") : (totalEpisodes || "")}
                    onChange={(e) => type === "book" ? setTotalPages(Number(e.target.value)) : setTotalEpisodes(Number(e.target.value))}
                    placeholder="Total"
                  />
                </div>
                {trackedTotal > 0 && (
                  <div className="progress-bar mt-2">
                    <div className="progress-fill" style={{ width: `${effectiveProgress}%` }} />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm opacity-70">Progress</label>
                  <span className="text-sm font-bold">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="slider w-full"
                />
              </div>
            )}
            <textarea
              className="input w-full resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !title.trim()}>
                {loading ? "..." : isEditing ? "Save" : "Add"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CompleteModal({ item, onClose, onSuccess }: { item: CurrentlyItem; onClose: () => void; onSuccess?: (message: string) => void }) {
  const completeCurrently = useMutation(api.currently.completeCurrently);
  const [headRating, setHeadRating] = useState(3);
  const [heartRating, setHeartRating] = useState(3);
  const [dateWatched, setDateWatched] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeCurrently({
        currentlyItemId: item._id,
        headRating,
        heartRating,
        dateWatched: new Date(dateWatched).getTime(),
        notes: notes.trim() || undefined,
      });
      invalidateCache();
      invalidateCurrentlyCache();
      onSuccess?.("Completed.");
      onClose();
    } catch (error) {
      console.error("Failed to complete:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-center">Complete</h2>
        <p className="text-center margin-note mb-3">{item.title}</p>
        <div className="flex flex-col gap-3">
          <RatingGrid
            headRating={headRating}
            heartRating={heartRating}
            onSelect={(head, heart) => { setHeadRating(head); setHeartRating(heart); }}
          />
          <input
            className="input w-full"
            type="date"
            value={dateWatched}
            onChange={(e) => setDateWatched(e.target.value)}
          />
          <div className="quick-picks" aria-label="Date shortcuts">
            <button type="button" onClick={() => setDateWatched(new Date().toISOString().split("T")[0])}>Today</button>
            <button type="button" onClick={() => setDateWatched(new Date(Date.now() - 86_400_000).toISOString().split("T")[0])}>Yesterday</button>
          </div>
          <textarea
            className="input w-full resize-none"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Review (optional)"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-accent btn-sm" onClick={() => { void handleComplete(); }} disabled={loading}>
              {loading ? "..." : "Complete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RatingGrid({
  headRating,
  heartRating,
  onSelect,
}: {
  headRating: number;
  heartRating: number;
  onSelect: (head: number, heart: number) => void;
}) {
  const cells = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const heart = col;
      const head = 5 - row;
      const isSelected = head === headRating && heart === heartRating;
      cells.push(
        <div
          key={`${head}-${heart}`}
          className={`rating-cell ${isSelected ? "selected" : ""}`}
          onClick={() => onSelect(head, heart)}
          title={`Head ${head}, Heart ${heart}`}
          role="button"
          aria-label={`Head ${head}, Heart ${heart}`}
          aria-pressed={isSelected}
        />
      );
    }
  }

  return (
    <div className="rating-grid-wrapper">
      <div className="rating-grid-container">
        <div className="rating-axis left">Head</div>
        <div className="rating-axis bottom">Heart</div>
        <div className="rating-grid">{cells}</div>
      </div>
      <div className="rating-display flex flex-col gap-1 text-center text-md">
        <div className="font-bold opacity-75">Head {headRating}/5 · Heart {heartRating}/5</div>
      </div>
    </div>
  );
}

// Lightness is left to CSS (--score-lit) so the score stays legible on both papers.
function getRatingColorVars(score: number): React.CSSProperties {
  const hue = (score / 5) * 120;
  const sat = 35 + (score / 5) * 25;
  return { "--score-hue": hue, "--score-sat": `${sat}%` } as React.CSSProperties;
}

function formatRelativeDate(timestamp: number) {
  const days = Math.floor((Date.now() - timestamp) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 31) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function WishlistCard({
  item,
  onEdit,
  index,
  onToast,
}: {
  item: WishlistItem;
  onEdit: () => void;
  index: number;
  onToast?: (message: string) => void;
}) {
  const deleteItem = useMutation(api.wishlist.deleteWishlistItem).withOptimisticUpdate((store, args) => {
    for (const query of store.getAllQueries(api.wishlist.getWishlistItems)) {
      if (query.value) {
        store.setQuery(api.wishlist.getWishlistItems, query.args, query.value.filter((item) => item._id !== args.id));
      }
    }
    const allMedia = store.getQuery(api.mediaEntries.getAllMedia, {});
    if (allMedia) {
      store.setQuery(api.mediaEntries.getAllMedia, {}, allMedia.filter((item) => item._id !== args.id));
    }
  });
  const promoteToCurrently = useMutation(api.currently.promoteToCurrently);
  const [showConfirm, setShowConfirm] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const typeInfo = MEDIA_TYPES.find((t) => t.value === item.type);

  const handleStart = async () => {
    setPromoting(true);
    try {
      await promoteToCurrently({ wishlistItemId: item._id });
      invalidateWishlistCache();
      invalidateCurrentlyCache();
      onToast?.("Started.");
    } catch (error) {
      console.error("Failed to start:", error);
    } finally {
      setPromoting(false);
    }
  };

  return (
    <article className={`wish-sticker card-in type-${item.type}`} style={{ animationDelay: `${index * 40}ms` }}>
      {item.posterUrl && <img src={item.posterUrl} alt="" className="diary-poster" style={{ width: "2.6rem", height: "3.7rem" }} />}

      <div className="min-w-0 flex-1">
        <h3 className="diary-title" style={{ fontSize: "1.2rem" }}>{item.title}</h3>
        <div className="diary-marks">
          <span className="mark-type">{typeInfo?.icon} {typeInfo?.label}</span>
          <span>Added {formatRelativeDate(item.dateAdded)}</span>
        </div>
        {item.notes && <p className="diary-notes">"{item.notes}"</p>}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <button className="btn btn-accent btn-sm" onClick={() => { void handleStart(); }} disabled={promoting} aria-label={`Start ${item.title}`}>
          {Icons.play} {promoting ? "..." : "Start"}
        </button>
        <div className="entry-actions">
          <button onClick={onEdit} title="Edit" aria-label={`Edit ${item.title}`}>{Icons.edit}</button>
          <button onClick={() => setShowConfirm(true)} title="Delete" aria-label={`Delete ${item.title}`}>{Icons.trash}</button>
        </div>
      </div>

      {showConfirm && (
        <div className="confirm-overlay">
          <p className="margin-note">Delete?</p>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowConfirm(false)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={() => {
              void deleteItem({ id: item._id });
              invalidateWishlistCache();
              setShowConfirm(false);
              onToast?.("Deleted.");
            }}>Delete</button>
          </div>
        </div>
      )}
    </article>
  );
}

function MediaEntryCard({
  entry,
  headWeight,
  onEdit,
  index,
  onToast,
}: {
  entry: MediaEntry;
  headWeight: number;
  onEdit: () => void;
  index: number;
  onToast?: (message: string) => void;
}) {
  const deleteEntry = useMutation(api.mediaEntries.deleteMediaEntry).withOptimisticUpdate((store, args) => {
    for (const query of store.getAllQueries(api.mediaEntries.getMediaEntries)) {
      if (query.value) {
        store.setQuery(api.mediaEntries.getMediaEntries, query.args, query.value.filter((item) => item._id !== args.id));
      }
    }
    const allMedia = store.getQuery(api.mediaEntries.getAllMedia, {});
    if (allMedia) {
      store.setQuery(api.mediaEntries.getAllMedia, {}, allMedia.filter((item) => item._id !== args.id));
    }
  });
  const getGlobalRating = useAction(api.lookup.getGlobalRating);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [globalRating, setGlobalRating] = useState<{ rating: number | null; votes: number | null; source: string } | null>(null);

  const typeInfo = MEDIA_TYPES.find((t) => t.value === entry.type);
  const formattedDate = new Date(entry.dateWatched).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
  const dayMonth = new Date(entry.dateWatched).toLocaleDateString(undefined, {
    day: "numeric", month: "short",
  });

  const headW = headWeight / 100;
  const heartW = 1 - headW;
  const totalScore = entry.headRating * headW + entry.heartRating * heartW;

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !globalRating && (entry.type === "movie" || entry.type === "tvshow" || entry.type === "book")) {
      getGlobalRating({ title: entry.title, type: entry.type })
        .then((r) => setGlobalRating({ rating: r.globalRating, votes: r.globalVotes, source: r.source }))
        .catch(() => setGlobalRating(null));
    }
  };

  const yourAvg = ((entry.headRating + entry.heartRating) / 2);
  const globalMatched = globalRating?.rating != null;
  const deltaGlobal = globalMatched ? (yourAvg - globalRating.rating!) : null;
  const gr = globalRating;

  return (
    <article
      className={`diary-row card-in type-${entry.type} ${expanded ? "card-expanded" : ""}`}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={handleExpand}
    >
      <div className="diary-date">
        <span>{dayMonth}</span>
        <span className="diary-relative">{formatRelativeDate(entry.dateWatched)}</span>
      </div>

      <div className="diary-body">
        <div className="flex justify-between items-start gap-3">
          <div className="flex gap-3 min-w-0">
            {entry.posterUrl && <img src={entry.posterUrl} alt="" className="diary-poster" />}
            <div className="min-w-0">
              <h3 className="diary-title">{entry.title}</h3>
              <div className="diary-marks">
                <span className="mark-type">{typeInfo?.icon} {typeInfo?.label}</span>
                <span className="mark-rating">Head {entry.headRating}</span>
                <span className="mark-rating">Heart {entry.heartRating}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="diary-score is-rated" style={getRatingColorVars(totalScore)}>{totalScore.toFixed(1)}</span>
            <div className="entry-actions" onClick={(e) => e.stopPropagation()}>
              <button onClick={onEdit} title="Edit" aria-label={`Edit ${entry.title}`}>{Icons.edit}</button>
              <button onClick={() => setShowConfirm(true)} title="Delete" aria-label={`Delete ${entry.title}`}>{Icons.trash}</button>
            </div>
          </div>
        </div>

        {entry.notes && <p className="diary-notes">"{entry.notes}"</p>}

        <div className="expanded-detail">
          <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: "var(--stitch)" }}>
            <div className="flex gap-4 text-sm opacity-70 flex-wrap md:hidden">
              <span>Finished {formattedDate}</span>
              <span>Head {entry.headRating}/5</span>
              <span>Heart {entry.heartRating}/5</span>
            </div>
            {gr && gr.rating != null && (
              <div className="flex items-center gap-2 text-sm px-3 py-2 rounded" style={{ background: "var(--tape)" }}>
                <span className="opacity-60">{gr.source}:</span>
                <span className="font-bold">{gr.rating}/5</span>
                {gr.votes != null && (
                  <span className="opacity-40 text-xs">({gr.votes.toLocaleString()} votes)</span>
                )}
                {deltaGlobal !== null && (
                  <span className="ml-auto margin-note">
                    {deltaGlobal > 0 ? "+" : ""}{deltaGlobal.toFixed(1)} vs world
                  </span>
                )}
              </div>
            )}
            {!globalMatched && expanded && (entry.type === "movie" || entry.type === "tvshow" || entry.type === "book") && (
              <div className="margin-note text-xs">Loading…</div>
            )}
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="confirm-overlay" onClick={(e) => e.stopPropagation()}>
          <p className="margin-note">Delete?</p>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowConfirm(false)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={() => {
              void deleteEntry({ id: entry._id });
              invalidateCache();
              onToast?.("Deleted.");
            }}>Delete</button>
          </div>
        </div>
      )}
    </article>
  );
}

function CurrentlyCard({
  item,
  onEdit,
  onComplete,
  index,
  onToast,
}: {
  item: CurrentlyItem;
  onEdit: () => void;
  onComplete: () => void;
  index: number;
  onToast?: (message: string) => void;
}) {
  const deleteItem = useMutation(api.currently.deleteCurrentlyItem).withOptimisticUpdate((store, args) => {
    for (const query of store.getAllQueries(api.currently.getCurrentlyItems)) {
      if (query.value) {
        store.setQuery(api.currently.getCurrentlyItems, query.args, query.value.filter((item) => item._id !== args.id));
      }
    }
    const allMedia = store.getQuery(api.mediaEntries.getAllMedia, {});
    if (allMedia) {
      store.setQuery(api.mediaEntries.getAllMedia, {}, allMedia.filter((item) => item._id !== args.id));
    }
  });
  const demoteCurrently = useMutation(api.currently.demoteCurrently);
  const [showConfirm, setShowConfirm] = useState(false);
  const [demoting, setDemoting] = useState(false);

  const typeInfo = MEDIA_TYPES.find((t) => t.value === item.type);

  const isBookTracked = item.type === "book" && item.totalPages != null && item.totalPages > 0;
  const isTVTracked = item.type === "tvshow" && item.totalEpisodes != null && item.totalEpisodes > 0;
  const displayProgress = isBookTracked
    ? Math.min(100, Math.round((item.progress / item.totalPages!) * 100))
    : isTVTracked
    ? Math.min(100, Math.round((item.progress / item.totalEpisodes!) * 100))
    : item.progress;
  const progressLabel = isBookTracked
    ? `${item.progress} / ${item.totalPages} pages`
    : isTVTracked
    ? `E${item.progress} / ${item.totalEpisodes} eps`
    : `${item.progress}%`;

  const handleDemote = async () => {
    setDemoting(true);
    try {
      await demoteCurrently({ currentlyItemId: item._id });
      invalidateCurrentlyCache();
      invalidateWishlistCache();
      onToast?.("Moved to wishlist.");
    } catch (error) {
      console.error("Failed to move back:", error);
    } finally {
      setDemoting(false);
    }
  };

  return (
    <article className={`bookmark-slip card-in type-${item.type}`} style={{ animationDelay: `${index * 40}ms` }}>
      <div className="bookmark-ribbon" />

      <div className="flex justify-between items-start gap-3">
        <div className="flex gap-3 min-w-0">
          {item.posterUrl && <img src={item.posterUrl} alt="" className="diary-poster" />}
          <div className="min-w-0">
            <h3 className="diary-title">{item.title}</h3>
            <div className="diary-marks">
              <span className="mark-type">{typeInfo?.icon} {typeInfo?.label}</span>
              <span>Started {formatRelativeDate(item.dateStarted)}</span>
            </div>
          </div>
        </div>
        <div className="entry-actions shrink-0">
          <button onClick={onEdit} title="Edit" aria-label={`Edit ${item.title}`}>{Icons.edit}</button>
          <button onClick={() => setShowConfirm(true)} title="Delete" aria-label={`Delete ${item.title}`}>{Icons.trash}</button>
        </div>
      </div>

      <div className="progress-bar mt-3">
        <div className="progress-fill" style={{ width: `${displayProgress}%` }} />
      </div>
      <div className="progress-label">
        <span>{progressLabel}</span>
        <span>{displayProgress >= 100 ? "Finish" : ""}</span>
      </div>

      {item.notes && <p className="diary-notes">"{item.notes}"</p>}

      <div className="flex gap-2 mt-3">
        <button className="btn btn-ghost btn-sm flex-1" onClick={() => { void handleDemote(); }} disabled={demoting} aria-label={`Move ${item.title} back to wishlist`}>
          {Icons.undo} {demoting ? "..." : "Wishlist"}
        </button>
        <button className="btn btn-accent btn-sm flex-1" onClick={() => { onComplete(); }} aria-label={`Complete ${item.title}`}>
          {Icons.check} Finish
        </button>
      </div>

      {showConfirm && (
        <div className="confirm-overlay" onClick={(e) => e.stopPropagation()}>
          <p className="margin-note">Delete?</p>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowConfirm(false)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={() => {
              void deleteItem({ id: item._id });
              invalidateCurrentlyCache();
              onToast?.("Deleted.");
            }}>Delete</button>
          </div>
        </div>
      )}
    </article>
  );
}

type ImportedRow =
  | { status: "library"; title: string; type: MediaType; date: number; notes?: string; posterUrl?: string; headRating: number; heartRating: number }
  | { status: "wishlist"; title: string; type: MediaType; date: number; notes?: string; posterUrl?: string }
  | { status: "currently"; title: string; type: MediaType; date: number; notes?: string; posterUrl?: string; progress: number; totalPages?: number; totalEpisodes?: number };

const csvHeaders = ["status", "title", "type", "headRating", "heartRating", "date", "notes", "posterUrl", "progress", "totalPages", "totalEpisodes"] as const;

function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { record.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      record.push(field); field = "";
      if (record.some((value) => value.trim())) records.push(record);
      record = [];
    } else field += char;
  }
  record.push(field);
  if (record.some((value) => value.trim())) records.push(record);
  return records;
}

function parseCanonicalCsv(text: string): ImportedRow[] {
  const records = parseCsvRecords(text);
  const header = records.shift()?.map((value) => value.trim());
  if (!header || !csvHeaders.every((key) => header.includes(key))) {
    throw new Error("Use a Head & Heart export CSV with the canonical header.");
  }
  const cell = (row: string[], name: typeof csvHeaders[number]) => row[header.indexOf(name)]?.trim() ?? "";
  return records.flatMap((row): ImportedRow[] => {
    const status = cell(row, "status");
    const title = cell(row, "title");
    const type = cell(row, "type") as MediaType;
    const date = new Date(cell(row, "date")).getTime();
    if (!title || !["library", "wishlist", "currently"].includes(status) || !MEDIA_TYPES.some((item) => item.value === type)) return [];
    const common = { title, type, date: Number.isFinite(date) ? date : Date.now(), notes: cell(row, "notes") || undefined, posterUrl: cell(row, "posterUrl") || undefined };
    if (status === "library") {
      const headRating = Number(cell(row, "headRating"));
      const heartRating = Number(cell(row, "heartRating"));
      if (!Number.isInteger(headRating) || !Number.isInteger(heartRating) || headRating < 0 || headRating > 5 || heartRating < 0 || heartRating > 5) return [];
      return [{ status, ...common, headRating, heartRating }];
    }
    if (status === "currently") {
      const number = (name: "progress" | "totalPages" | "totalEpisodes") => {
        const value = Number(cell(row, name));
        return Number.isFinite(value) ? value : undefined;
      };
      return [{ status, ...common, progress: number("progress") ?? 0, totalPages: number("totalPages"), totalEpisodes: number("totalEpisodes") }];
    }
    return [{ status: "wishlist", ...common }];
  });
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const importRows = useMutation(api.mediaImport.importMediaRows);
  const allMedia = useQuery(api.mediaEntries.getAllMedia) as UnifiedMedia[] | undefined;
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [mode, setMode] = useState<"add" | "replace">("add");
  const [confirmedReplace, setConfirmedReplace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const existing = useMemo(() => new Set((allMedia ?? []).map((item) => `${item.status}|${item.type}|${item.title.trim().toLocaleLowerCase()}`)), [allMedia]);
  const rowsToImport = mode === "replace" ? rows : rows.filter((row) => !existing.has(`${row.status}|${row.type}|${row.title.trim().toLocaleLowerCase()}`));

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCanonicalCsv(typeof reader.result === "string" ? reader.result : "");
        setRows(parsed);
        setMessage(parsed.length ? null : "No valid rows found. Check the file values.");
      } catch (error) {
        setRows([]);
        setMessage(error instanceof Error ? error.message : "Could not read that CSV.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (mode === "replace" && !confirmedReplace) return;
    setLoading(true);
    try {
      const count = await importRows({ mode, rows: rowsToImport });
      invalidateCache();
      invalidateWishlistCache();
      invalidateCurrentlyCache();
      setMessage(`Imported ${count} item${count === 1 ? "" : "s"}.`);
      setRows([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content !max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <h2 className="mb-4 text-center">Import data</h2>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="block mb-1 opacity-70 text-sm">Head & Heart export CSV</span>
            <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="input w-full" />
          </label>
          <code className="text-xs block p-2 rounded" style={{ background: "var(--tape)" }}>{csvHeaders.join(",")}</code>
          {rows.length > 0 && (
            <>
              <div className="flex gap-2">
                <button type="button" className={`btn btn-sm ${mode === "add" ? "btn-primary" : "btn-secondary"}`} onClick={() => setMode("add")}>Add new rows</button>
                <button type="button" className={`btn btn-sm ${mode === "replace" ? "btn-danger" : "btn-secondary"}`} onClick={() => setMode("replace")}>Replace everything</button>
              </div>
              <p className="margin-note">{rows.length} rows found. {mode === "add" ? `${rows.length - rowsToImport.length} duplicates will be skipped.` : "This will erase Library, Wishlist, and Currently before restoring this file."}</p>
              {mode === "replace" && (
                <label className="flex gap-2 items-center text-sm">
                  <input type="checkbox" checked={confirmedReplace} onChange={(event) => setConfirmedReplace(event.target.checked)} />
                  I understand this erases all my existing media.
                </label>
              )}
              <div className="max-h-48 overflow-y-auto rounded text-sm" style={{ border: "var(--stitch)" }}>
                {rows.slice(0, 50).map((row, index) => <div key={`${row.status}-${row.title}-${index}`} className="p-2 flex gap-2" style={{ borderBottom: "var(--stitch)" }}><span className={`status-badge status-${row.status}`}>{row.status}</span><strong>{row.title}</strong><span className="opacity-60 capitalize">{row.type}</span></div>)}
              </div>
              <button className={`btn ${mode === "replace" ? "btn-danger" : "btn-primary"}`} disabled={loading || rowsToImport.length === 0 || (mode === "replace" && !confirmedReplace)} onClick={() => void handleImport()}>
                {loading ? "Importing…" : mode === "replace" ? "Erase and import" : `Import ${rowsToImport.length} new rows`}
              </button>
            </>
          )}
          {message && <p className="margin-note">{message}</p>}
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
