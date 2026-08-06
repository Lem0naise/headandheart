import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
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

type ExportSource = "all" | "library" | "wishlist" | "currently";
type UnifiedMedia = (MediaEntry | WishlistItem | CurrentlyItem) & {
  status: Exclude<ExportSource, "all">;
  activityDate: number;
};

function buildCsv(items: readonly UnifiedMedia[]): string {
  const header = "status,title,type,headRating,heartRating,date,notes,posterUrl,progress,totalPages,totalEpisodes";
  const rows = items.map((item) => {
    const library = item.status === "library" ? item as MediaEntry : null;
    const current = item.status === "currently" ? item as CurrentlyItem : null;
    const date = new Date(item.activityDate).toISOString().split("T")[0];
    return [
      item.status,
      escapeCsv(item.title),
      item.type,
      library?.headRating ?? "",
      library?.heartRating ?? "",
      date,
      item.notes ? escapeCsv(item.notes) : "",
      item.posterUrl ? escapeCsv(item.posterUrl) : "",
      current?.progress ?? "",
      current?.totalPages ?? "",
      current?.totalEpisodes ?? "",
    ].join(",");
  });
  return [header, ...rows].join("\n");
}

export default function ExportModal({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState<ExportSource>("all");
  const [mediaFilter, setMediaFilter] = useState<MediaType | "all">("all");
  const allMedia = useQuery(api.mediaEntries.getAllMedia) as UnifiedMedia[] | undefined;
  const filtered = (allMedia ?? []).filter((item) =>
    (source === "all" || item.status === source) &&
    (mediaFilter === "all" || item.type === mediaFilter)
  );

  const handleExport = () => {
    const csv = buildCsv(filtered);
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
                setSource(e.target.value as ExportSource)
              }
            >
              <option value="all">All statuses</option>
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

          <div className="margin-note rounded p-3 text-center" style={{ background: "var(--tape)" }}>
            {allMedia === undefined ? "Loading your media…" : `${filtered.length} item${filtered.length !== 1 ? "s" : ""} ready to export`}
          </div>

          <div className="flex gap-2 justify-end">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleExport}
              disabled={allMedia === undefined || filtered.length === 0}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
