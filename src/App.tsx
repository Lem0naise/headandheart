"use client";

import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useMemo, useEffect, JSX } from "react";
import { Id } from "../convex/_generated/dataModel";
import StatsView from "./Stats";

// SVG Icons
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
};

// Media types
type MediaType = "movie" | "book" | "tvshow" | "videogame" | "boardgame";

const MEDIA_TYPES: { value: MediaType; label: string; icon: JSX.Element }[] = [
  { value: "movie", label: "Movie", icon: Icons.movie },
  { value: "book", label: "Book", icon: Icons.book },
  { value: "tvshow", label: "TV", icon: Icons.tv },
  { value: "videogame", label: "Game", icon: Icons.game },
  { value: "boardgame", label: "Board", icon: Icons.dice },
];

const RATING_DESCRIPTIONS = {
  default: {
    head: {
      1: "Broken: Unfinished/Incompetent.",
      2: "Flawed: Had potential, but failed.",
      3: "Solid: Professional and clear.",
      4: "Exceptional: Stands out from the crowd.",
      5: "Masterpiece: Flawless/Revolutionary.",
    },
    heart: {
      1: "Painful: I wanted to quit.",
      2: "Boring: I checked my phone.",
      3: "Liked: Glad I watched it.",
      4: "Captivated: I was fully locked in.",
      5: "Amazing: The most fun I've ever had.",
    }
  },
  book: {
    head: {
      1: "Unreadable: Poor grammar/structure.",
      2: "Weak: Clunky prose or pacing.",
      3: "Readable: Competent writing.",
      4: "Beautiful: Eloquent and clever.",
      5: "Literary: A triumph of language.",
    },
    heart: {
      1: "Dull: I forced myself to finish.",
      2: "Dry: Educational but dry.",
      3: "Engaging: Hard to put down.",
      4: "Gripping: Stayed up all night.",
      5: "Profound: Changed how I think.",
    }
  },
  videogame: {
    head: {
      1: "Broken: Buggy mess.",
      2: "Clunky: Bad controls/UX.",
      3: "Functional: Works as intended.",
      4: "Polished: Tight controls/design.",
      5: "Perfect: Mechanics are genius.",
    },
    heart: {
      1: "Frustrating: Rage quit.",
      2: "Grind: Felt like work.",
      3: "Fun: Good loop.",
      4: "Addictive: 'Just one more turn'.",
      5: "Immersive: I lived in this world.",
    }
  },
  boardgame: {
    head: {
      1: "Broken: Rules makes no sense.",
      2: "Unbalanced: Solved/Exploitable.",
      3: "Balanced: Fair and functional.",
      4: "Elegant: Smart mechanics.",
      5: "Genius: Perfect system design.",
    },
    heart: {
      1: "Boring: Everyone checked phones.",
      2: "Tedious: Too much downtime.",
      3: "Fun: Good social interactions.",
      4: "Exciting: Great tension/moments.",
      5: "Legendary: Talk about it for years.",
    }
  }
} as const;

const RATING_LABELS = {
  tl: "Cold Perfection", // High Head, Low Heart
  tr: "Transcendental", // High Head, High Heart
  bl: "Trash", // Low Head, Low Heart
  br: "Guilty Pleasure", // Low Head, High Heart
};

type SortOption = "dateNewest" | "dateOldest" | "alphaAZ" | "alphaZA" | "rating";

interface MediaEntry {
  _id: Id<"mediaEntries">;
  title: string;
  type: MediaType;
  headRating: number;
  heartRating: number;
  dateWatched: number;
  notes?: string;
}

export default function App() {
  const [view, setView] = useState<"home" | "stats">("home");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <Header currentView={view} onViewChange={setView} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="p-3 md:p-6 max-w-5xl mx-auto">
        <Authenticated>
          {view === "home" ? (
            <Content searchQuery={searchQuery} />
          ) : (
            <StatsLoader onBack={() => setView("home")} />
          )}
        </Authenticated>
        <Unauthenticated>
          <WelcomeSection />
        </Unauthenticated>
      </main>
    </>
  );
}

function StatsLoader({ onBack }: { onBack: () => void }) {
  const entries = useQuery(api.mediaEntries.getMediaEntries, { typeFilter: undefined });
  if (!entries) return <div className="text-center py-12 opacity-50">Loading stats...</div>;

  // Cast entries to ensure types match (Convex types can be loose, but our interface is strict)
  return <StatsView entries={entries as MediaEntry[]} onBack={onBack} />;
}

function Header({
  currentView,
  onViewChange,
  searchQuery,
  onSearchChange
}: {
  currentView?: "home" | "stats";
  onViewChange?: (v: "home" | "stats") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="header relative">
      <div className="flex items-center gap-4 flex-1">
        <div className="logo cursor-pointer shrink-0" onClick={() => onViewChange?.("home")}>
          <span className="logo-icon">{Icons.heart}</span>
          <span className="inline">HeadandHeart</span>

        </div>

        {/* Desktop Search */}
        {isAuthenticated && currentView === "home" && (
          <div className="hidden md:block flex-1 max-w-sm">
            <div className="relative">
              <input
                type="text"
                className="input py-1 px-3 w-full pl-9 h-9 text-sm"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>


      {isAuthenticated && (
        <div className="flex items-center gap-2">
          {currentView === "home" && (
            <>
              {/* Mobile Search Toggle */}
              <button
                className="btn btn-secondary btn-sm md:!hidden px-2"
                onClick={() => {
                  setMobileSearchOpen(!mobileSearchOpen);
                }}
              >
                {Icons.search}
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onViewChange?.("stats")}
                title="Taste Stats"
              >
                {Icons.chart}
                <span className="hidden md:inline">Stats</span>
              </button>
            </>
          )}

          <div className="dropdown">
            <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? Icons.close : Icons.menu}
            </button>

            {menuOpen && (
              <div className="dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    onViewChange?.("home");
                    setMenuOpen(false);
                  }}
                >
                  {Icons.home}
                  <span>Home</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    onViewChange?.("stats");
                    setMenuOpen(false);
                  }}
                >
                  {Icons.chart}
                  <span>Taste Stats</span>
                </button>
                <a
                  href="https://indigo.spot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dropdown-item"
                  onClick={() => setMenuOpen(false)}
                >
                  {Icons.home}
                  <span>Indigo's Home</span>
                </a>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={() => {
                    void signOut();
                    setMenuOpen(false);
                  }}
                >
                  {Icons.signOut}
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Search Bar (Overlay/Expansion) */}
      {mobileSearchOpen && currentView === "home" && (
        <div className="absolute top-full left-0 right-0 p-2 bg-[var(--color-card)] border-b border-black/5 shadow-md md:hidden z-10 animate-in slide-in-from-top-2">
          <div className="relative">
            <input
              autoFocus
              type="text"
              className="input w-full pl-9"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </header>
  );
}

function WelcomeSection() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center">
        <div className="float" style={{ width: 64, height: 64, margin: '0 auto 1rem' }}>
          {Icons.heart}
        </div>
        <h2 className="text-3xl font-bold mb-2">HeadandHeart</h2>
        <p className="text-lg opacity-70 mb-6">
          Rate media on two axes: Head & Heart
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
    <div className="card w-full max-w-sm">
      <h3 className="text-xl mb-3 text-center">
        {flow === "signIn" ? "Welcome back" : "Create account"}
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
            .catch((error) => setError(error.message))
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
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
        )}
      </form>
    </div>
  );
}

function Content({ searchQuery }: { searchQuery?: string }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MediaEntry | null>(null);
  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [sortOption, setSortOption] = useState<SortOption>("dateNewest");
  const [headWeight, setHeadWeight] = useState(50);

  const entries = useQuery(api.mediaEntries.getMediaEntries, {
    typeFilter: typeFilter === "all" ? undefined : typeFilter,
  });

  const sortedEntries = useMemo(() => {
    if (!entries) return [];
    let processed = [...entries];

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      processed = processed.filter(e => {
        const typeInfo = MEDIA_TYPES.find(t => t.value === e.type);
        return (
          e.title.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q) ||
          typeInfo?.label.toLowerCase().includes(q)
        );
      });
    }

    switch (sortOption) {
      case "dateNewest": processed.sort((a, b) => b.dateWatched - a.dateWatched); break;
      case "dateOldest": processed.sort((a, b) => a.dateWatched - b.dateWatched); break;
      case "alphaAZ": processed.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "alphaZA": processed.sort((a, b) => b.title.localeCompare(a.title)); break;
      case "rating":
        processed.sort((a, b) => {
          const hW = headWeight / 100;
          const hrW = 1 - hW;
          return (b.headRating * hW + b.heartRating * hrW) - (a.headRating * hW + a.heartRating * hrW);
        });
        break;
    }
    return processed;
  }, [entries, sortOption, headWeight, searchQuery]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-2">
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          {Icons.plus}
          <span>Add</span>
        </button>
        <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
          {Icons.upload}
          <span>Import</span>
        </button>
      </div>

      {showAddForm && <EntryModal onClose={() => setShowAddForm(false)} />}
      {showImport && <ImportModal existingEntries={entries || []} onClose={() => setShowImport(false)} />}
      {editingEntry && <EntryModal entry={editingEntry} onClose={() => setEditingEntry(null)} />}

      <div className="filter-bar">
        <button
          className={`filter-pill ${typeFilter === "all" ? "active" : ""}`}
          onClick={() => setTypeFilter("all")}
        >
          All
        </button>
        {MEDIA_TYPES.map((t) => (
          <button
            key={t.value}
            className={`filter-pill ${typeFilter === t.value ? "active" : ""}`}
            onClick={() => setTypeFilter(t.value)}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="sort-bar">
        <select
          className="select"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
        >
          <option value="dateNewest">Newest</option>
          <option value="dateOldest">Oldest</option>
          <option value="alphaAZ">A-Z</option>
          <option value="alphaZA">Z-A</option>
          <option value="rating">Rating</option>
        </select>

        {sortOption === "rating" && (
          <div className="weight-slider">
            <span style={{ color: 'var(--color-secondary)' }}>Head {headWeight}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={headWeight}
              onChange={(e) => setHeadWeight(Number(e.target.value))}
              className="slider"
            />
            <span style={{ color: 'var(--color-primary)' }}>{100 - headWeight}% Heart</span>
          </div>
        )}
      </div>

      {entries === undefined ? (
        <div className="text-center py-8 opacity-60">Loading...</div>
      ) : sortedEntries.length === 0 ? (
        <div className="empty-state">
          {searchQuery ? (
            <>
              {Icons.search}
              <p>No matches found</p>
              <p className="text-sm opacity-60">Try a different search term</p>
            </>
          ) : (
            <>
              {Icons.empty}
              <p>No entries yet</p>
              <p className="text-sm opacity-60">Add your first one</p>
            </>
          )}
        </div>
      ) : (
        <div className="entries-grid">
          {sortedEntries.map((entry) => (
            <MediaEntryCard
              key={entry._id}
              entry={entry}
              headWeight={sortOption === "rating" ? headWeight : 50}
              onEdit={() => setEditingEntry(entry)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EntryModal({ entry, onClose }: { entry?: MediaEntry; onClose: () => void }) {
  const addEntry = useMutation(api.mediaEntries.addMediaEntry);
  const updateEntry = useMutation(api.mediaEntries.updateMediaEntry);

  const [title, setTitle] = useState(entry?.title ?? "");
  const [type, setType] = useState<MediaType>(entry?.type ?? "movie");
  const [headRating, setHeadRating] = useState(entry?.headRating ?? 3);
  const [heartRating, setHeartRating] = useState(entry?.heartRating ?? 3);
  const [dateWatched, setDateWatched] = useState(
    entry ? new Date(entry.dateWatched).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [loading, setLoading] = useState(false);



  const isEditing = !!entry;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      if (isEditing) {
        await updateEntry({
          id: entry._id,
          title: title.trim(),
          type,
          headRating,
          heartRating,
          dateWatched: new Date(dateWatched).getTime(),
          notes: notes.trim() || undefined,
        });
      } else {
        await addEntry({
          title: title.trim(),
          type,
          headRating,
          heartRating,
          dateWatched: new Date(dateWatched).getTime(),
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tagName = (document.activeElement as HTMLElement).tagName;

      // Enter key for submit (unless in notes textarea)
      if (e.key === 'Enter' && !e.shiftKey) {
        if (tagName === 'TEXTAREA') return; // Allow newlines in notes
        // If in Title input, native form submit handles it.
        // If focusing nothing (on grid), we want to submit.
        // We only trigger if NOT on a button (buttons handle themselves)
        if (tagName !== 'BUTTON') {
          e.preventDefault();
          // We pass a dummy event because handleSubmit expects one
          handleSubmit({ preventDefault: () => { } } as React.FormEvent);
        }
        return;
      }

      // Arrow keys (only if no input focused)
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHeadRating(h => Math.min(5, h + 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHeadRating(h => Math.max(1, h - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setHeartRating(h => Math.max(1, h - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setHeartRating(h => Math.min(5, h + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [headRating, heartRating, title, type, dateWatched, notes, isEditing, loading]);
  // Added deps because handleSubmit uses them. 
  // Since handleSubmit is re-created every render, this effect re-runs every render.
  // This is acceptable for a modal.

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl mb-4 text-center">{isEditing ? "Edit Entry" : "Add Entry"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="input w-full"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
          />
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

          <RatingGrid
            headRating={headRating}
            heartRating={heartRating}
            type={type}
            onSelect={(head, heart) => { setHeadRating(head); setHeartRating(heart); }}
          />

          <input
            className="input w-full mt-2"
            type="date"
            value={dateWatched}
            onChange={(e) => setDateWatched(e.target.value)}
          />

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
      </div>
    </div>
  );
}

function RatingGrid({
  headRating,
  heartRating,
  type,
  onSelect,
}: {
  headRating: number;
  heartRating: number;
  type?: MediaType;
  onSelect: (head: number, heart: number) => void;
}) {
  const descriptions = (type && type in RATING_DESCRIPTIONS && type !== 'movie' && type !== 'tvshow')
    ? RATING_DESCRIPTIONS[type as keyof typeof RATING_DESCRIPTIONS]
    : RATING_DESCRIPTIONS.default;

  const cells = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const heart = col + 1;
      const head = 5 - row;
      const isSelected = head === headRating && heart === heartRating;

      cells.push(
        <div
          key={`${head}-${heart}`}
          className={`rating-cell ${isSelected ? "selected" : ""}`}
          onClick={() => onSelect(head, heart)}
          title={`Head: ${head} - ${descriptions.head[head as keyof typeof descriptions.head]}\nHeart: ${heart} - ${descriptions.heart[heart as keyof typeof descriptions.heart]}`}
        />
      );
    }
  }

  return (
    <div className="rating-grid-wrapper">
      <div className="rating-grid-container">
        <div className="rating-axis left">Head</div>
        <div className="rating-axis bottom">Heart</div>
        <div className="rating-corner tl">{RATING_LABELS.tl}</div>
        <div className="rating-corner tr">{RATING_LABELS.tr}</div>
        <div className="rating-corner bl">{RATING_LABELS.bl}</div>
        <div className="rating-corner br">{RATING_LABELS.br}</div>
        <div className="rating-grid">{cells}</div>
      </div>

      <div className="rating-display flex flex-col gap-1 text-center text-md ">
        <div className="font-bold opacity-75">Head {headRating}/5 · Heart {heartRating}/5</div>
        <div className="text-md">
          {descriptions.head[headRating as keyof typeof descriptions.head]}
          <br />
          {descriptions.heart[heartRating as keyof typeof descriptions.heart]}
        </div>
      </div>
    </div >
  );
}

function MediaEntryCard({
  entry,
  headWeight,
  onEdit,
}: {
  entry: MediaEntry;
  headWeight: number;
  onEdit: () => void;
}) {
  const deleteEntry = useMutation(api.mediaEntries.deleteMediaEntry);
  const [showConfirm, setShowConfirm] = useState(false);

  const typeInfo = MEDIA_TYPES.find((t) => t.value === entry.type);
  const formattedDate = new Date(entry.dateWatched).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  // Calculate weighted bar widths
  const headW = headWeight / 100;
  const heartW = 1 - headW;
  const totalScore = entry.headRating * headW + entry.heartRating * heartW;
  const maxScore = 5;
  const headPortion = (entry.headRating / maxScore) * headW * 100;
  const heartPortion = (entry.heartRating / maxScore) * heartW * 100;

  return (
    <div className="card entry-card relative group p-0 overflow-hidden flex flex-col">
      {/* Banner / Header */}
      <div className={`entry-banner type-${entry.type}`}>
        <div className="flex items-center gap-2">
          {typeInfo?.icon}
          <span className="font-bold uppercase tracking-wider text-sm">{typeInfo?.label}</span>

        </div>
        <span className="text-xs opacity-50 whitespace-nowrap">{formattedDate}</span>
        <div className="rating-score-large text-white">
          {totalScore.toFixed(1)}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <div className="flex justify-between items-start gap-2">
          <div className="entry-title mb-0">{entry.title}</div>
          <div className="entry-actions shrink-0">
            <button onClick={onEdit} title="Edit">{Icons.edit}</button>
            <button onClick={() => setShowConfirm(true)} title="Delete">{Icons.trash}</button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs opacity-50">

        </div>

        <div className="rating-details mt-auto">
          <div className="rating-bar">
            <div className="rating-bar-head h-full" style={{ width: `${headPortion}%` }} />
            <div className="rating-bar-heart h-full" style={{ width: `${heartPortion}%` }} />
          </div>
          <div className="rating-subtext mt-1">
            <span>Hd {entry.headRating}</span>
            <span>Ht {entry.heartRating}</span>
          </div>
        </div>

        {entry.notes && <p className="entry-notes mt-0 mb-0">"{entry.notes}"</p>}
      </div>

      {showConfirm && (
        <div className="confirm-overlay z-10">
          <p className="text-sm">Delete?</p>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowConfirm(false)}>No</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteEntry({ id: entry._id })}>Yes</button>
          </div>
        </div>
      )}
    </div>
  );
}

// CSV parsing for favourites.me format
interface ImportedEntry {
  title: string;
  type: MediaType;
  originalRating: number;
  dateWatched: number;
  notes: string;
}

function parseCSV(text: string): ImportedEntry[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Skip header
  const entries: ImportedEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV with quoted fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current);

    // Map fields: title,type,rating,dateWatched,notes,status
    const [title, rawType, rating, dateWatched, notes] = fields;

    if (!title?.trim()) continue;

    // Map type from favourites.me format to our format
    const typeMap: Record<string, MediaType> = {
      'movie': 'movie',
      'film': 'movie',
      'book': 'book',
      'tv': 'tvshow',
      'tvshow': 'tvshow',
      'show': 'tvshow',
      'game': 'videogame',
      'videogame': 'videogame',
      'boardgame': 'boardgame',
      'board': 'boardgame',
    };

    const type = typeMap[rawType?.toLowerCase().trim()] ?? 'movie';
    const originalRating = parseInt(rating) || 50;
    const date = dateWatched ? new Date(dateWatched).getTime() : Date.now();

    entries.push({
      title: title.trim(),
      type,
      originalRating,
      dateWatched: date,
      notes: notes?.trim() ?? '',
    });
  }

  return entries;
}

function ImportModal({ existingEntries, onClose }: { existingEntries: MediaEntry[]; onClose: () => void }) {
  const addEntry = useMutation(api.mediaEntries.addMediaEntry);

  const [importType, setImportType] = useState<'favourites.me'>('favourites.me');
  const [entries, setEntries] = useState<ImportedEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [headRating, setHeadRating] = useState(3);
  const [heartRating, setHeartRating] = useState(3);
  const [dateWatched, setDateWatched] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  const currentEntry = entries[currentIndex];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setEntries(parsed);

      // Auto-recommend start index based on existing
      let recIndex = 0;
      const existingTitles = new Set(existingEntries.map(e => e.title.toLowerCase().trim()));

      for (let i = 0; i < parsed.length; i++) {
        if (!existingTitles.has(parsed[i].title.toLowerCase().trim())) {
          recIndex = i;
          break;
        }
      }

      setCurrentIndex(recIndex);
      setSelectionMode(true);
    };
    reader.readAsText(file);
  };

  const startImport = () => {
    setSelectionMode(false);
    setHeadRating(3);
    setHeartRating(3);
    if (entries[currentIndex]) {
      setDateWatched(new Date(entries[currentIndex].dateWatched).toISOString().split('T')[0]);
    }
  };

  const handleImport = async () => {
    if (!currentEntry) return;
    setLoading(true);

    try {

      await addEntry({
        title: currentEntry.title,
        type: currentEntry.type,
        headRating,
        heartRating,
        dateWatched: dateWatched ? new Date(dateWatched).getTime() : Date.now(),
        notes: currentEntry.notes || undefined,
      });
      setImportedCount(c => c + 1);
      moveToNext();
    } catch (error) {
      console.error('Failed to import:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setSkippedCount(c => c + 1);
    moveToNext();
  };



  // Enter key mapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        // Don't trigger if user is typing in a textarea (e.g. notes)
        if (document.activeElement instanceof HTMLTextAreaElement) return;

        // Only trigger if we are in the main import flow (not selection mode, not done)
        if (!selectionMode && entries.length > 0 && currentEntry && !loading) {
          e.preventDefault();
          handleImport();
        }
      }

      // Rating Navigation
      if (!selectionMode && entries.length > 0 && currentEntry && !['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement).tagName)) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHeadRating(h => Math.min(5, h + 1));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHeadRating(h => Math.max(1, h - 1));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setHeartRating(h => Math.max(1, h - 1));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setHeartRating(h => Math.min(5, h + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionMode, entries, currentEntry, headRating, heartRating, dateWatched, loading, /* deps for handleImport closure */]);

  const moveToNext = () => {
    if (currentIndex < entries.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setHeadRating(3);
      setHeartRating(3);
      const nextEnt = entries[currentIndex + 1];
      if (nextEnt) {
        setDateWatched(new Date(nextEnt.dateWatched).toISOString().split('T')[0]);
      }
    } else {
      // Done - ensure we update index to trigger completion view
      setCurrentIndex(entries.length);
      setEntries([]);
    }
  };

  // Selection Mode UI
  if (selectionMode && entries.length > 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content !max-w-2xl" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl mb-2 text-center">Select Start Row</h2>
          <p className="text-center text-sm opacity-70 mb-4">
            Found {entries.length} rows. We recommend starting at row {currentIndex + 1}.
          </p>

          <div className="max-h-[50vh] overflow-y-auto border border-black/10 rounded mb-4">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-black/5 sticky top-0">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Title</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((ent, idx) => {
                  const exists = existingEntries.some(e => e.title.toLowerCase().trim() === ent.title.toLowerCase().trim());
                  const isSelected = idx === currentIndex;
                  return (
                    <tr
                      key={idx}
                      className={`cursor-pointer border-b border-black/5 hover:bg-black/5 ${isSelected ? 'bg-[var(--color-secondary)]/20' : ''}`}
                      onClick={() => setCurrentIndex(idx)}
                    >
                      <td className="p-2 opacity-50">{idx + 1}</td>
                      <td className="p-2 font-medium">{ent.title}</td>
                      <td className="p-2 opacity-70">{new Date(ent.dateWatched).toLocaleDateString()}</td>
                      <td className="p-2">
                        {exists ? (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Exists</span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded">New</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 justify-end">
            <button className="btn btn-ghost" onClick={() => setEntries([])}>Cancel</button>
            <button className="btn btn-primary" onClick={startImport}>
              Start from Row {currentIndex + 1}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Import Complete UI
  if (entries.length > 0 && !selectionMode && (currentIndex >= entries.length || !currentEntry)) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl mb-4 text-center">Import Complete</h2>
          <div className="text-center py-4">
            <p className="text-lg">Imported: <strong>{importedCount}</strong></p>
            <p className="opacity-70">Skipped: {skippedCount}</p>
          </div>
          <button className="btn btn-primary w-full" onClick={onClose}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl mb-4 text-center">Import</h2>

        {entries.length === 0 ? (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block mb-1 opacity-70 text-sm">Import Type</label>
              <select
                className="select w-full"
                value={importType}
                onChange={e => setImportType(e.target.value as 'favourites.me')}
              >
                <option value="favourites.me">favourites.me</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 opacity-70 text-sm">CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="input w-full"
              />
            </div>

            <div className="text-sm opacity-60 mt-2">
              <p>Expected format:</p>
              <code className="text-xs block bg-black/10 p-2 rounded mt-1">
                title,type,rating,dateWatched,notes,status
              </code>
            </div>

            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {/* Progress */}
            <div className="text-center text-sm opacity-70">
              Entry {currentIndex + 1} of {entries.length}
            </div>

            {/* Current Entry Details */}
            {currentEntry && (
              <>
                <div className="card bg-[var(--color-lavender)]/20 p-3">
                  <h3 className="font-bold text-2xl">{currentEntry.title}</h3>
                  <div className="flex gap-2 mt-2 text-md opacity-80 flex-wrap">
                    <span className={`type-badge type-${currentEntry.type}`}>
                      {MEDIA_TYPES.find(t => t.value === currentEntry.type)?.icon}
                    </span>
                    <span>Original: {currentEntry.originalRating}/100</span>
                  </div>
                  {currentEntry.notes && (
                    <p className="text-sm opacity-70 mt-2 italic">"{currentEntry.notes}"</p>
                  )}
                </div>

                {/* Rating Selection */}
                <div>
                  <RatingGrid
                    headRating={headRating}
                    heartRating={heartRating}
                    type={currentEntry.type}
                    onSelect={(head, heart) => {
                      setHeadRating(head);
                      setHeartRating(heart);
                    }}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="btn btn-ghost flex-1"
                    onClick={handleSkip}
                  >
                    {Icons.skip}
                    <span>Skip</span>
                  </button>
                  <button
                    className="btn btn-primary flex-1"
                    onClick={handleImport}
                    disabled={loading}
                  >
                    {Icons.plus}
                    <span>{loading ? '...' : 'Import'}</span>
                  </button>
                </div>

                <button className="btn btn-ghost btn-sm text-sm" onClick={onClose}>
                  Cancel Import
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
