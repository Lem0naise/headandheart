import { useEffect, useMemo, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import type { MediaEntry } from "./types";

interface StatsProps {
    entries: MediaEntry[];
    onBack: () => void;
}

export default function StatsView({ entries, onBack }: StatsProps) {
    const stats = useStats(entries);
    const worldComparison = useWorldComparison(entries);

    return (
        <div className="flex flex-col gap-6 pb-12 animate-in">
            <section className="page-sheet">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <h1 className="text-4xl">Taste Stats</h1>
                    <button onClick={onBack} className="btn btn-ghost">← Back</button>
                </div>
                <div className="stats-grid mt-6">
                    <StatCard label="Logged" value={stats.total.toString()} detail="entries" />
                    <StatCard label="Average" value={stats.averageRating.toFixed(1)} detail="out of 5" />
                    <StatCard label="Top type" value={stats.topTypeLabel} detail={`${stats.topTypeCount} logged`} />
                    <StatCard label="Streak" value={`${stats.currentStreak}`} detail="weeks" />
                    
                </div>
            </section>

            {entries.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-line">No stats yet.</p>
                    <p className="empty-sub">Log a finished title first.</p>
                </div>
            ) : (
                <>
                    <Section title="Head & Heart">
                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-6 items-center">
                            <div>
                                <h3 className="stats-section-title">{stats.personality.title}</h3>
                                <div className="mt-5 flex items-center gap-3">
                                    <span className="text-4xl" aria-hidden="true">{stats.personality.icon}</span>
                                    <div>
                                        <p className="font-bold">Head {stats.averageHead.toFixed(1)} · Heart {stats.averageHeart.toFixed(1)}</p>
                                        <p className="margin-note">{stats.headHeartInsight}</p>
                                    </div>
                                </div>
                            </div>
                            <TasteGalaxy entries={entries} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-sm">
                            <p className="margin-note">Most common: {stats.hotZone}</p>
                            <p className="margin-note">Empty corners: {stats.voidZone}</p>
                        </div>
                    </Section>

                    <Section title="Ratings">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <RatingDistribution title="Head" counts={stats.headDistribution} color="var(--color-secondary)" />
                            <RatingDistribution title="Heart" counts={stats.heartDistribution} color="var(--color-primary)" />
                        </div>
                    </Section>

                    <Section title="By Type">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {stats.perType.slice().sort((a, b) => b.count - a.count).map((media) => (
                                <div key={media.type}>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <h3 className="stats-section-title capitalize">{friendlyType(media.type)}</h3>
                                        <span className="text-sm opacity-60">{media.count} logged</span>
                                    </div>
                                    <p className="margin-note">Top: {media.best ?? "—"}</p>
                                    <div className="mt-4 grid grid-cols-[3.5rem_1fr] gap-3 text-sm items-center">
                                        <span>Head {media.avgHead.toFixed(1)}</span>
                                        <div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: `${media.avgHead * 20}%`, background: "var(--color-secondary)" }} /></div>
                                        <span>Heart {media.avgHeart.toFixed(1)}</span>
                                        <div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: `${media.avgHeart * 20}%`, background: "var(--color-primary)" }} /></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Favorites">
                        <div className="favorites-list">
                            {stats.favorites.map((entry, index) => (
                                <div className="favorite-item" key={entry._id}>
                                    <span className="favorite-rank">{index + 1}</span>
                                    {entry.posterUrl && <img src={entry.posterUrl} alt="" className="favorite-poster" />}
                                    <span className="min-w-0 flex-1">
                                        <strong className="block truncate">{entry.title}</strong>
                                        <span className="text-sm opacity-65 capitalize">{friendlyType(entry.type)}</span>
                                    </span>
                                    <span className="diary-score">{((entry.headRating + entry.heartRating) / 2).toFixed(1)}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Monthly Activity">
                        <p className="margin-note mb-4">The months when your library grew the most.</p>
                        <div className="monthly-activity-grid">
                          {stats.monthlyActivity.map((month) => (
                            <div className="chart-bar-row monthly-activity-row" key={month.key}>
                                <span className="text-sm">{month.label}</span>
                                <div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: `${(month.count / stats.maxMonthlyCount) * 100}%` }} /></div>
                                <strong>{month.count}</strong>
                            </div>
                          ))}
                        </div>
                        <p className="margin-note mt-4">Busiest month: {stats.prolificMonth.label} ({stats.prolificMonth.count})</p>
                    </Section>

                    <Section title="Over Time">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="stats-section-title">Head</h3>
                                <TrendLine entries={entries} field="headRating" color="var(--color-secondary)" />
                            </div>
                            <div>
                                <h3 className="stats-section-title">Heart</h3>
                                <TrendLine entries={entries} field="heartRating" color="var(--color-primary)" isPercentage5={true} />
                            </div>
                        </div>
                    </Section>

                    <Section title="vs World">
                        {worldComparison.loading ? (
                            <p className="margin-note">Loading…</p>
                        ) : worldComparison.compared === 0 ? (
                            <p className="margin-note">Comparisons available for movies, shows, and books when ratings exist.</p>
                        ) : (
                            <>
                                <h3 className="stats-section-title">{worldComparison.label}</h3>
                                <p className="opacity-75">{worldComparison.description}</p>
                                <div className="stats-grid mt-5">
                                    <StatCard label="Compared" value={worldComparison.compared.toString()} detail="titles" />
                                    <StatCard label="Avg gap" value={`${worldComparison.averageDifference.toFixed(1)}`} detail="points" />
                                    <StatCard label="Big gaps" value={`${worldComparison.bigDisagreements}%`} detail="≥1 point" />
                                </div>
                            </>
                        )}
                    </Section>

                    <Section title="Scatter">
                        <p className="margin-note mb-4">Each dot is a title. Diagonal = Head equals Heart.</p>
                        <MediaScatterPlot entries={entries} />
                    </Section>
                </>
            )}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="page-sheet almanac-section">
            <h2 className="stats-section-title">{title}</h2>
            {children}
        </section>
    );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
    return (
        <div className="stat-card">
            <p className="stat-label">{label}</p>
            <p className="stat-number">{value}</p>
            <p className="stat-detail">{detail}</p>
        </div>
    );
}

function RatingDistribution({ title, counts, color }: { title: string; counts: number[]; color: string }) {
    const highest = Math.max(...counts, 1);
    return (
        <div>
            <h3 className="stats-section-title">{title}</h3>
            {counts.map((count, index) => (
                <div className="chart-bar-row" key={index}>
                    <span>{index} / 5</span>
                    <div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: `${(count / highest) * 100}%`, background: color }} /></div>
                    <strong>{count}</strong>
                </div>
            ))}
        </div>
    );
}

function friendlyType(type: string) {
    return type === "tvshow" ? "TV shows" : type === "videogame" ? "video games" : type === "boardgame" ? "board games" : `${type}s`;
}

// --- Components ---

function TasteGalaxy({ entries }: { entries: MediaEntry[] }) {
    // Create 6x6 grid counts for integer ratings 0 through 5.
    const grid = Array(6).fill(0).map(() => Array(6).fill(0));
    let maxCount = 0;

    entries.forEach(e => {
        // Head is Y (inverted: 5 is the top row) and Heart is X (0 is left).
        const row = 5 - Math.floor(e.headRating);
        const col = Math.floor(e.heartRating);
        if (row >= 0 && row < 6 && col >= 0 && col < 6) {
            grid[row][col]++;
            maxCount = Math.max(maxCount, grid[row][col]);
        }
    });

    return (
        <div className="relative p-2 rounded inline-block" style={{ border: "var(--stitch)" }}>
            <div className="grid grid-cols-6 gap-1 w-[250px] h-[250px]">
                {grid.map((row, rIndex) => (
                    row.map((count, cIndex) => {
                        const intensity = maxCount > 0 ? count / maxCount : 0;
                        const avgRating = ((5 - rIndex) + cIndex) / 2;
                        const hue = 20 + (avgRating / 5) * 110;
                        const cellStyle =
                            count === 0
                                ? {
                                      backgroundColor: "var(--tape)",
                                      color: "transparent",
                                  }
                                : {
                                      backgroundColor: `hsl(${hue}, ${34 + intensity * 22}%, ${76 - intensity * 22}%)`,
                                      color: "#3a2b3a",
                                  };
                        return (
                            <div
                                key={`${rIndex}-${cIndex}`}
                                className="rounded-sm flex items-center justify-center text-xs font-bold relative group"
                                style={cellStyle}
                            >
                                {count > 0 && count}

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs p-1 rounded whitespace-nowrap z-10 pointer-events-none" style={{ background: "var(--paper-surface)", color: "var(--app-text)", border: "var(--stitch)" }}>
                                    Head: {5 - rIndex}, Heart: {cIndex}
                                </div>
                            </div>
                        );
                    })
                ))}
            </div>
            {/* Labels */}
            <div className="absolute -left-7 top-1/2 -translate-y-1/2 -rotate-90 text-sm opacity-55" style={{ fontFamily: "'IM Fell English', Georgia, serif" }}>Head</div>
            <div className="absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 text-sm opacity-55" style={{ fontFamily: "'IM Fell English', Georgia, serif" }}>Heart</div>
        </div>
    );
}

function MediaScatterPlot({ entries }: { entries: MediaEntry[] }) {
    // Simple SVG Scatter
    const size = 300;
    const padding = 30;

    // Group identical points to nudge them slightly or size them
  // Hash function for deterministic jitter
  const hashId = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) {
      h = ((h << 5) - h) + id.charCodeAt(i);
      h |= 0;
    }
    return h;
  };

  const points = entries.map(e => {
    const seed = hashId(e._id);
    const jitterX = ((seed % 100) / 100 - 0.5) * 0.4;
    const jitterY = (((seed * 31 + 7) % 100) / 100 - 0.5) * 0.4;
        return {
            ...e,
            x: e.heartRating + jitterX,
            y: e.headRating + jitterY
        };
    });

    // Map 0-5 to coordinate space.
    const scale = (val: number) => padding + (val / 5) * (size - 2 * padding);
    const invertScale = (val: number) => size - (padding + (val / 5) * (size - 2 * padding));

    // Color mapping
    const getColor = (t: string) => {
        if (t === 'movie') return 'var(--color-primary)';
        if (t === 'book') return 'var(--color-lavender)';
        if (t === 'tvshow') return 'var(--color-secondary)';
        if (t === 'videogame') return 'var(--color-accent)';
        return 'var(--color-peach)';
    }

    return (
        <div className="w-full max-w-[400px] mx-auto bg-[var(--color-card-dark)] border border-black/10 rounded-xl p-4 aspect-square relative">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <g key={i}>
                        <line x1={scale(0)} y1={invertScale(i)} x2={scale(5)} y2={invertScale(i)} stroke="#ddd" strokeWidth="1" />
                        <line x1={scale(i)} y1={invertScale(0)} x2={scale(i)} y2={invertScale(5)} stroke="#ddd" strokeWidth="1" />
                        {/* Labels */}
                        <text x={scale(0) - 10} y={invertScale(i)} dy="4" textAnchor="end" fontSize="10" fill="#999">{i}</text>
                        <text x={scale(i)} y={invertScale(0) + 15} textAnchor="middle" fontSize="10" fill="#999">{i}</text>
                    </g>
                ))}

                {/* Axis Titles */}
                <text x={10} y={size / 2} transform={`rotate(-90 10,${size / 2})`} textAnchor="middle" fontSize="12" fill="#666" fontWeight="bold">HEAD</text>
                <text x={size / 2} y={size - 5} textAnchor="middle" fontSize="12" fill="#666" fontWeight="bold">HEART</text>

                {/* Diagonal Line (y=x) */}
                <line x1={scale(0)} y1={invertScale(0)} x2={scale(5)} y2={invertScale(5)} stroke="rgba(0,0,0,0.1)" strokeDasharray="4" strokeWidth="2" />

                {/* Points */}
                {points.map((p) => (
                    <circle
                        key={p._id}
                        cx={scale(p.x)}
                        cy={invertScale(p.y)}
                        r={4}
                        fill={getColor(p.type)}
                        opacity={0.8}
                        className="hover:scale-150 transition-transform cursor-pointer"
                    >
                        <title>{p.title} ({p.type}): Hd {p.headRating.toFixed(1)}, Ht {p.heartRating.toFixed(1)}</title>
                    </circle>
                ))}
            </svg>
        </div>
    );
}

function TrendLine({ entries, field, color, isPercentage5 }: { entries: MediaEntry[], field: 'headRating' | 'heartRating', color: string, isPercentage5?: boolean }) {
    if (entries.length < 2) return <div className="h-32 flex items-center justify-center opacity-40">Need more data</div>;

    // Sort by date (oldest to newest)
    const sorted = [...entries].sort((a, b) => a.dateWatched - b.dateWatched);

    // Moving average window size
    const windowSize = Math.max(2, Math.floor(sorted.length / 5));
    const dataPoints = [];

    for (let i = 0; i <= sorted.length - windowSize; i++) {
        const window = sorted.slice(i, i + windowSize);
        let value = 0;

        if (isPercentage5) {
            const count5 = window.filter(e => e[field] === 5).length;
            value = (count5 / windowSize) * 100;
        } else {
            const sum = window.reduce((acc, e) => acc + e[field], 0);
            value = sum / windowSize;
        }

        // x coordinate is relative position in timeline
        dataPoints.push({ x: i, y: value });
    }

    const width = 300;
    const height = 100;
    const maxY = isPercentage5 ? 100 : 5;
    const minY = 0;

    // Map to SVG coordinates
    const getX = (i: number) => (i / (dataPoints.length - 1 || 1)) * width;
    const getY = (val: number) => height - ((val - minY) / (maxY - minY)) * height;

    const pathD = `M ${dataPoints.map((p, i) => `${getX(i)},${getY(p.y)}`).join(" L ")}`;

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full h-auto">
                {/* Base lines */}
                <line x1="0" y1={height} x2={width} y2={height} stroke="#ddd" strokeWidth="1" />
                <line x1="0" y1={0} x2={width} y2={0} stroke="#eee" strokeWidth="1" strokeDasharray="4" />

                {/* Trend Line */}
                <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Start/End Labels */}
                <text x="0" y={height + 15} fontSize="10" fill="#999">Oldest</text>
                <text x={width} y={height + 15} textAnchor="end" fontSize="10" fill="#999">Newest</text>
            </svg>
        </div>
    );
}

function useWorldComparison(entries: MediaEntry[]) {
    const getGlobalRating = useAction(api.lookup.getGlobalRating);
    const [comparisons, setComparisons] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const candidates = [...entries]
            .filter((entry) => entry.type === "movie" || entry.type === "tvshow" || entry.type === "book")
            .sort((a, b) => b.dateWatched - a.dateWatched)
            .slice(0, 12);
        let cancelled = false;
        if (candidates.length === 0) {
            void Promise.resolve().then(() => {
                if (!cancelled) {
                    setComparisons([]);
                    setLoading(false);
                }
            });
            return () => { cancelled = true; };
        }

        void Promise.resolve().then(() => {
            if (!cancelled) setLoading(true);
        });
        void Promise.all(candidates.map(async (entry) => {
            try {
                const result = await getGlobalRating({ title: entry.title, type: entry.type });
                if (result.globalRating === null) return null;
                return ((entry.headRating + entry.heartRating) / 2) - result.globalRating;
            } catch {
                return null;
            }
        })).then((results) => {
            if (!cancelled) {
                setComparisons(results.filter((result): result is number => result !== null));
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [entries, getGlobalRating]);

    const averageDifference = comparisons.length
        ? comparisons.reduce((sum, difference) => sum + Math.abs(difference), 0) / comparisons.length
        : 0;
    const signedDifference = comparisons.length
        ? comparisons.reduce((sum, difference) => sum + difference, 0) / comparisons.length
        : 0;
    const bigDisagreements = comparisons.length
        ? Math.round((comparisons.filter((difference) => Math.abs(difference) >= 1).length / comparisons.length) * 100)
        : 0;
    const label = signedDifference > 0.25 ? "Higher than average" : signedDifference < -0.25 ? "Lower than average" : "Near average";
    const description = signedDifference > 0.25
        ? "Your recent ratings run above the wider crowd."
        : signedDifference < -0.25
            ? "Your recent ratings run below the wider crowd."
            : "Your recent ratings land close to the wider crowd.";

    return { loading, compared: comparisons.length, averageDifference, bigDisagreements, label, description };
}


// --- Logic Hook ---

function useStats(entries: MediaEntry[]) {
    return useMemo(() => {
        if (entries.length === 0) return getEmptyStats();

        // 1. Hot Zone
        const counts: Record<string, number> = {};
        entries.forEach(e => {
            const hRound = Math.floor(e.headRating);
            const htRound = Math.floor(e.heartRating);
            const key = `${hRound}-${htRound}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        let maxCell = "";
        let maxCount = 0;
        Object.entries(counts).forEach(([k, v]) => {
            if (v > maxCount) { maxCount = v; maxCell = k; }
        });
        const hotZone = maxCell ? `Head ${maxCell.split('-')[0]} / Heart ${maxCell.split('-')[1]}` : "N/A";

        // Void Zone
        const corners = { tl: 0, tr: 0, bl: 0, br: 0 };
        entries.forEach(e => {
            if (e.headRating >= 3 && e.heartRating <= 2) corners.tl++;
            if (e.headRating >= 3 && e.heartRating >= 3) corners.tr++;
            if (e.headRating <= 2 && e.heartRating <= 2) corners.bl++;
            if (e.headRating <= 2 && e.heartRating >= 3) corners.br++;
        });
        const voidZone = Object.entries(corners)
            .filter(([_, count]) => count === 0)
            .map(([k]) => k === 'tl' ? 'Academic' : k === 'tr' ? 'Masterpiece' : k === 'bl' ? 'Trash' : 'Guilty Pleasure')
            .join(", ") || "None";

        // 2. Media Breakdown
        const types = Array.from(new Set(entries.map(e => e.type)));
        const perType = types.map(t => {
            const subset = entries.filter(e => e.type === t);
            if (subset.length === 0) return { type: t, count: 0, avgHead: 0, avgHeart: 0, avgRating: 0, best: null as string | null };
            const sumHd = subset.reduce((s, e) => s + e.headRating, 0);
            const sumHt = subset.reduce((s, e) => s + e.heartRating, 0);
            const avgH = sumHd / subset.length;
            const avgHt = sumHt / subset.length;
            const best = subset.reduce((a, b) =>
                (a.headRating + a.heartRating) >= (b.headRating + b.heartRating) ? a : b
            );
            return { type: t, count: subset.length, avgHead: avgH, avgHeart: avgHt, avgRating: (avgH + avgHt) / 2, best: best.title };
        });
        const averageHead = entries.reduce((sum, entry) => sum + entry.headRating, 0) / entries.length;
        const averageHeart = entries.reduce((sum, entry) => sum + entry.heartRating, 0) / entries.length;
        const averageRating = (averageHead + averageHeart) / 2;
        const headDistribution = Array.from({ length: 6 }, (_, index) =>
            entries.filter((entry) => Math.round(entry.headRating) === index).length
        );
        const heartDistribution = Array.from({ length: 6 }, (_, index) =>
            entries.filter((entry) => Math.round(entry.heartRating) === index).length
        );
        const topType = [...perType].sort((a, b) => b.count - a.count)[0];
        const monthlyCounts = new Map<string, { label: string; count: number }>();
        entries.forEach((entry) => {
            const date = new Date(entry.dateWatched);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const current = monthlyCounts.get(key);
            monthlyCounts.set(key, {
                label: date.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
                count: (current?.count ?? 0) + 1,
            });
        });
        const monthlyActivity = [...monthlyCounts.entries()]
            .map(([key, value]) => ({ key, ...value }))
            .sort((a, b) => a.key.localeCompare(b.key));
        const prolificMonth = [...monthlyActivity].sort((a, b) => b.count - a.count)[0] ?? { label: "—", count: 0 };
        const favorites = [...entries]
            .sort((a, b) => (b.headRating + b.heartRating) - (a.headRating + a.heartRating))
            .slice(0, 5);
        const weekKey = (date: Date) => {
            const monday = new Date(date);
            monday.setHours(0, 0, 0, 0);
            monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
            return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
        };
        const loggedWeeks = new Set(entries.map((entry) => weekKey(new Date(entry.dateWatched))));
        let currentStreak = 0;
        const week = new Date();
        while (loggedWeeks.has(weekKey(week))) {
            currentStreak++;
            week.setDate(week.getDate() - 7);
        }
        const difference = averageHeart - averageHead;
        const personality = difference > 0.35
            ? { title: "Heart-leaning", icon: "♡" }
            : difference < -0.35
                ? { title: "Head-leaning", icon: "✦" }
                : { title: "Balanced", icon: "❀" };
        const headHeartInsight = difference === 0
            ? "Head and Heart averages match."
            : `${Math.abs(difference).toFixed(1)} point${Math.abs(difference) >= 1 ? "s" : ""} toward ${difference > 0 ? "Heart" : "Head"}.`;

        return {
            hotZone,
            voidZone,
            perType,
            total: entries.length,
            averageHead,
            averageHeart,
            averageRating,
            headDistribution,
            heartDistribution,
            topTypeLabel: topType ? friendlyType(topType.type) : "—",
            topTypeCount: topType?.count ?? 0,
            typeCount: types.length,
            currentStreak,
            personality,
            headHeartInsight,
            favorites,
            monthlyActivity,
            maxMonthlyCount: Math.max(...monthlyActivity.map((month) => month.count), 1),
            prolificMonth,
        };
    }, [entries]);
}

function getEmptyStats() {
    return {
        hotZone: "N/A",
        voidZone: "All",
        perType: [] as { type: string; count: number; avgHead: number; avgHeart: number; avgRating: number; best: string | null }[],
        total: 0,
        averageHead: 0,
        averageHeart: 0,
        averageRating: 0,
        headDistribution: [0, 0, 0, 0, 0],
        heartDistribution: [0, 0, 0, 0, 0],
        topTypeLabel: "—",
        topTypeCount: 0,
        typeCount: 0,
        currentStreak: 0,
        personality: { title: "Balanced", icon: "❀" },
        headHeartInsight: "Log a rating to begin.",
        favorites: [] as MediaEntry[],
        monthlyActivity: [] as { key: string; label: string; count: number }[],
        maxMonthlyCount: 1,
        prolificMonth: { label: "—", count: 0 },
    };
}
