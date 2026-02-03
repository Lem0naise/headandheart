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
import { useState, useMemo } from "react";
import { Id } from "../convex/_generated/dataModel";

// Media types
type MediaType = "movie" | "book" | "tvshow" | "videogame" | "boardgame";

const MEDIA_TYPES: { value: MediaType; label: string; emoji: string }[] = [
  { value: "movie", label: "Movie", emoji: "🎬" },
  { value: "book", label: "Book", emoji: "📚" },
  { value: "tvshow", label: "TV Show", emoji: "📺" },
  { value: "videogame", label: "Video Game", emoji: "🎮" },
  { value: "boardgame", label: "Board Game", emoji: "🎲" },
];

// Rating labels for 2D grid corners
const RATING_LABELS = {
  topLeft: "Forgettable",
  topRight: "✨ Masterpiece",
  bottomLeft: "Meh...",
  bottomRight: "Guilty Pleasure",
};

type SortOption = "dateNewest" | "dateOldest" | "alphaAZ" | "alphaZA" | "rating";

export default function App() {
  return (
    <>
      <Header />
      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        <Authenticated>
          <Content />
        </Authenticated>
        <Unauthenticated>
          <WelcomeSection />
        </Unauthenticated>
      </main>
    </>
  );
}

function Header() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  return (
    <header className="header">
      <div className="logo float">
        💭 HeadandHeart 💖
      </div>
      {isAuthenticated && (
        <button
          className="btn btn-ghost"
          onClick={() => void signOut()}
        >
          Sign out ✨
        </button>
      )}
    </header>
  );
}

function WelcomeSection() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-5xl mb-4 float">💭💖</h1>
        <h2 className="text-4xl font-bold mb-2">HeadandHeart</h2>
        <p className="text-xl opacity-80 mb-8">
          Rate your favorite media on two axes:<br />
          <span className="text-[var(--color-secondary)]">🧠 Head</span> (intellectual) &
          <span className="text-[var(--color-primary)]"> 💖 Heart</span> (emotional)
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
    <div className="card pixel-border w-full max-w-md">
      <h3 className="text-2xl mb-4 text-center">
        {flow === "signIn" ? "Welcome back! ✨" : "Join us! 🌟"}
      </h3>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData)
            .catch((error) => {
              setError(error.message);
            })
            .finally(() => setLoading(false));
        }}
      >
        <input
          className="input"
          type="email"
          name="email"
          placeholder="✉️ Email"
          required
        />
        <input
          className="input"
          type="password"
          name="password"
          placeholder="🔑 Password"
          required
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Loading..." : flow === "signIn" ? "Sign in 🚀" : "Sign up 🎉"}
        </button>
        <div className="text-center">
          <span className="opacity-70">
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="underline hover:no-underline"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up!" : "Sign in!"}
          </button>
        </div>
        {error && (
          <div className="bg-red-100 border-2 border-red-300 rounded p-3 text-red-700">
            ⚠️ {error}
          </div>
        )}
      </form>
    </div>
  );
}

function Content() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [sortOption, setSortOption] = useState<SortOption>("dateNewest");
  const [headWeight, setHeadWeight] = useState(50);

  const entries = useQuery(api.mediaEntries.getMediaEntries, {
    typeFilter: typeFilter === "all" ? undefined : typeFilter,
  });

  const sortedEntries = useMemo(() => {
    if (!entries) return [];

    const sorted = [...entries];

    switch (sortOption) {
      case "dateNewest":
        sorted.sort((a, b) => b.dateWatched - a.dateWatched);
        break;
      case "dateOldest":
        sorted.sort((a, b) => a.dateWatched - b.dateWatched);
        break;
      case "alphaAZ":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "alphaZA":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "rating":
        sorted.sort((a, b) => {
          const headW = headWeight / 100;
          const heartW = 1 - headW;
          const scoreA = a.headRating * headW + a.heartRating * heartW;
          const scoreB = b.headRating * headW + b.heartRating * heartW;
          return scoreB - scoreA;
        });
        break;
    }

    return sorted;
  }, [entries, sortOption, headWeight]);

  return (
    <div className="flex flex-col gap-6">
      {/* Add Entry Button */}
      <div className="flex justify-center">
        <button
          className="btn btn-primary text-xl px-8"
          onClick={() => setShowAddForm(true)}
        >
          ➕ Add New Entry
        </button>
      </div>

      {/* Add Entry Modal */}
      {showAddForm && (
        <AddEntryModal onClose={() => setShowAddForm(false)} />
      )}

      {/* Filter Bar */}
      <FilterBar typeFilter={typeFilter} setTypeFilter={setTypeFilter} />

      {/* Sort Controls */}
      <SortControls
        sortOption={sortOption}
        setSortOption={setSortOption}
        headWeight={headWeight}
        setHeadWeight={setHeadWeight}
      />

      {/* Entries List */}
      {entries === undefined ? (
        <div className="text-center py-8 pulse">Loading your entries... ✨</div>
      ) : sortedEntries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p className="text-xl">No entries yet!</p>
          <p className="opacity-70">Add your first movie, book, or game 🎬📚🎮</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedEntries.map((entry) => (
            <MediaEntryCard key={entry._id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterBar({
  typeFilter,
  setTypeFilter,
}: {
  typeFilter: MediaType | "all";
  setTypeFilter: (filter: MediaType | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        className={`btn btn-ghost ${typeFilter === "all" ? "active" : ""}`}
        onClick={() => setTypeFilter("all")}
      >
        All 🌈
      </button>
      {MEDIA_TYPES.map((type) => (
        <button
          key={type.value}
          className={`btn btn-ghost ${typeFilter === type.value ? "active" : ""}`}
          onClick={() => setTypeFilter(type.value)}
        >
          {type.emoji} {type.label}
        </button>
      ))}
    </div>
  );
}

function SortControls({
  sortOption,
  setSortOption,
  headWeight,
  setHeadWeight,
}: {
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  headWeight: number;
  setHeadWeight: (weight: number) => void;
}) {
  return (
    <div className="card pixel-border">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="opacity-70">Sort by:</label>
          <select
            className="select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value="dateNewest">📅 Newest First</option>
            <option value="dateOldest">📅 Oldest First</option>
            <option value="alphaAZ">🔤 A → Z</option>
            <option value="alphaZA">🔤 Z → A</option>
            <option value="rating">⭐ Rating</option>
          </select>
        </div>

        {sortOption === "rating" && (
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <span className="text-[var(--color-secondary)]">🧠 {headWeight}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={headWeight}
              onChange={(e) => setHeadWeight(Number(e.target.value))}
              className="slider flex-1"
            />
            <span className="text-[var(--color-primary)]">{100 - headWeight}% 💖</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AddEntryModal({ onClose }: { onClose: () => void }) {
  const addEntry = useMutation(api.mediaEntries.addMediaEntry);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MediaType>("movie");
  const [headRating, setHeadRating] = useState(2);
  const [heartRating, setHeartRating] = useState(2);
  const [dateWatched, setDateWatched] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await addEntry({
        title: title.trim(),
        type,
        headRating,
        heartRating,
        dateWatched: new Date(dateWatched).getTime(),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to add entry:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content pixel-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl mb-4 text-center">Add New Entry ✨</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 opacity-70">Title</label>
            <input
              className="input w-full"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What did you experience?"
              required
            />
          </div>

          <div>
            <label className="block mb-1 opacity-70">Type</label>
            <select
              className="select w-full"
              value={type}
              onChange={(e) => setType(e.target.value as MediaType)}
            >
              {MEDIA_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 opacity-70">Date</label>
            <input
              className="input w-full"
              type="date"
              value={dateWatched}
              onChange={(e) => setDateWatched(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 opacity-70">Rating</label>
            <RatingGrid
              headRating={headRating}
              heartRating={heartRating}
              onSelect={(head, heart) => {
                setHeadRating(head);
                setHeartRating(heart);
              }}
            />
          </div>

          <div>
            <label className="block mb-1 opacity-70">Notes (optional)</label>
            <textarea
              className="input w-full resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any thoughts?"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !title.trim()}
            >
              {loading ? "Adding..." : "Add Entry 🎉"}
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
  onSelect,
}: {
  headRating: number;
  heartRating: number;
  onSelect: (head: number, heart: number) => void;
}) {
  // Grid is 3x3, x-axis is head (1-3 left to right), y-axis is heart (1-3 bottom to top)
  const cells = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const head = col + 1; // 1, 2, 3 from left to right
      const heart = 3 - row; // 3, 2, 1 from top to bottom
      const isSelected = head === headRating && heart === heartRating;

      cells.push(
        <div
          key={`${head}-${heart}`}
          className={`rating-cell ${isSelected ? "selected" : ""}`}
          onClick={() => onSelect(head, heart)}
          title={`Head: ${head}, Heart: ${heart}`}
        />
      );
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Axis labels */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm opacity-70">
          💖 Heart
        </div>
        <div className="absolute top-1/2 -left-16 -translate-y-1/2 -rotate-90 text-sm opacity-70">
          🧠 Head
        </div>

        {/* Corner labels */}
        <div className="rating-label top-left text-xs">{RATING_LABELS.topLeft}</div>
        <div className="rating-label top-right text-xs">{RATING_LABELS.topRight}</div>
        <div className="rating-label bottom-left text-xs">{RATING_LABELS.bottomLeft}</div>
        <div className="rating-label bottom-right text-xs">{RATING_LABELS.bottomRight}</div>

        <div className="rating-grid">
          {cells}
        </div>
      </div>
      <div className="mt-6 text-center text-sm opacity-70">
        Selected: 🧠 {headRating} / 💖 {heartRating}
      </div>
    </div>
  );
}

function MediaEntryCard({
  entry,
}: {
  entry: {
    _id: Id<"mediaEntries">;
    title: string;
    type: MediaType;
    headRating: number;
    heartRating: number;
    dateWatched: number;
    notes?: string;
  };
}) {
  const deleteEntry = useMutation(api.mediaEntries.deleteMediaEntry);
  const [showConfirm, setShowConfirm] = useState(false);

  const typeInfo = MEDIA_TYPES.find((t) => t.value === entry.type);
  const formattedDate = new Date(entry.dateWatched).toLocaleDateString();

  const handleDelete = async () => {
    await deleteEntry({ id: entry._id });
    setShowConfirm(false);
  };

  return (
    <div className="card pixel-border relative group">
      {/* Delete button */}
      <button
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity text-lg"
        onClick={() => setShowConfirm(true)}
        title="Delete entry"
      >
        🗑️
      </button>

      {/* Type badge */}
      <span className={`type-badge type-${entry.type}`}>
        {typeInfo?.emoji} {typeInfo?.label}
      </span>

      {/* Title */}
      <h3 className="text-xl mt-2 mb-1 font-bold">{entry.title}</h3>

      {/* Date */}
      <p className="text-sm opacity-70 mb-3">📅 {formattedDate}</p>

      {/* Ratings */}
      <div className="rating-display mb-2">
        <span className="rating-icon rating-head">
          🧠 {"★".repeat(entry.headRating)}{"☆".repeat(3 - entry.headRating)}
        </span>
        <span className="rating-icon rating-heart">
          💖 {"★".repeat(entry.heartRating)}{"☆".repeat(3 - entry.heartRating)}
        </span>
      </div>

      {/* Notes */}
      {entry.notes && (
        <p className="text-sm opacity-80 mt-2 italic">"{entry.notes}"</p>
      )}

      {/* Delete confirmation */}
      {showConfirm && (
        <div className="absolute inset-0 bg-white/90 dark:bg-black/90 flex flex-col items-center justify-center rounded gap-2">
          <p>Delete this entry?</p>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
