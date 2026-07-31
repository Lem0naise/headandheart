import { useState } from "react";
import type { MediaType, MediaEntry, WishlistItem, CurrentlyItem } from "./types";

const TYPE_LABELS: Record<string, string> = {
  movie: "Movies",
  book: "Books",
  tvshow: "TV Shows",
  videogame: "Video Games",
  boardgame: "Board Games",
};

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsv(
  items: readonly (MediaEntry | WishlistItem | CurrentlyItem)[],
  source: "library" | "wishlist" | "currently",
  headWeight: number,
  separateRatings: boolean,
): string {
  const headW = headWeight / 100;
  const heartW = 1 - headW;

  let header: string;
  const rows: string[] = [];

  for (const item of items) {
    const title = escapeCsv(item.title);

    if (source === "library") {
      const e = item as MediaEntry;
      const date = new Date(e.dateWatched).toISOString().split("T")[0];
      const notes = e.notes ? escapeCsv(e.notes) : "";
      if (separateRatings) {
        rows.push(`${title},${e.type},${e.headRating},${e.heartRating},${date},${notes}`);
      } else {
        const score = e.headRating * headW + e.heartRating * heartW;
        const rating = Math.round(score * 10) / 10;
        rows.push(`${title},${e.type},${rating},${date},${notes}`);
      }
    } else if (source === "wishlist") {
      const e = item as WishlistItem;
      const date = new Date(e.dateAdded).toISOString().split("T")[0];
      const notes = e.notes ? escapeCsv(e.notes) : "";
      rows.push(`${title},${e.type},${date},${notes}`);
    } else {
      const e = item as CurrentlyItem;
      const date = new Date(e.dateStarted).toISOString().split("T")[0];
      const notes = e.notes ? escapeCsv(e.notes) : "";
      rows.push(`${title},${e.type},${date},${e.progress},${notes}`);
    }
  }

  if (source === "library") {
    header = separateRatings
      ? "title,type,headRating,heartRating,dateWatched,notes"
      : "title,type,rating,dateWatched,notes";
  } else if (source === "wishlist") {
    header = "title,type,dateAdded,notes";
  } else {
    header = "title,type,dateStarted,progress,notes";
  }

  return [header, ...rows].join("\n");
}

interface ExportModalProps {
  libraryEntries: readonly MediaEntry[] | null | undefined;
  wishlistItems: readonly WishlistItem[] | null | undefined;
  currentlyItems: readonly CurrentlyItem[] | null | undefined;
  onClose: () => void;
}

export default function ExportModal({
  libraryEntries,
  wishlistItems,
  currentlyItems,
  onClose,
}: ExportModalProps) {
  const [source, setSource] = useState<"library" | "wishlist" | "currently">("library");
  const [mediaFilter, setMediaFilter] = useState<MediaType | "all">("all");
  const [headWeight, setHeadWeight] = useState(50);
  const [separateRatings, setSeparateRatings] = useState(false);

  const rawItems =
    source === "library"
      ? (libraryEntries ?? [])
      : source === "wishlist"
        ? (wishlistItems ?? [])
        : (currentlyItems ?? []);

  const filtered =
    mediaFilter === "all"
      ? rawItems
      : rawItems.filter((item) => item.type === mediaFilter);

  const handleExport = () => {
    const csv = buildCsv(filtered, source, headWeight, separateRatings);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `headandheart-${source}-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-center">Export Data</h2>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm opacity-70">Source</label>
            <select
              className="select w-full"
              value={source}
              onChange={(e) =>
                setSource(e.target.value as "library" | "wishlist" | "currently")
              }
            >
              <option value="library">Library (rated)</option>
              <option value="wishlist">Wishlist</option>
              <option value="currently">Currently</option>
            </select>
          </div>

          <div>
            <label className="text-sm opacity-70">Media type</label>
            <select
              className="select w-full"
              value={mediaFilter}
              onChange={(e) =>
                setMediaFilter(e.target.value as MediaType | "all")
              }
            >
              <option value="all">All types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {source === "library" && (
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm opacity-70">Rating weight</label>
                  <span className="text-sm font-bold">
                    Head {headWeight}% / Heart {100 - headWeight}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={headWeight}
                  onChange={(e) => setHeadWeight(Number(e.target.value))}
                  className="slider w-full"
                />
                <div className="flex justify-between text-xs opacity-40 mt-1">
                  <span>Head only</span>
                  <span>Balanced</span>
                  <span>Heart only</span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={separateRatings}
                  onChange={(e) => setSeparateRatings(e.target.checked)}
                  className="w-4 h-4 accent-[var(--color-accent)]"
                />
                <span className="text-sm opacity-70">
                  Export Head and Heart as separate columns
                </span>
              </label>
            </div>
          )}

          <div className="margin-note rounded p-3 text-center" style={{ background: "var(--tape)" }}>
            {filtered.length} item{filtered.length !== 1 ? "s" : ""} ready to export
          </div>

          <div className="flex gap-2 justify-end">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleExport}
              disabled={filtered.length === 0}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
