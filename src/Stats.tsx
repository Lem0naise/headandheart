import { useMemo } from "react";
import type { MediaEntry } from "./types";

interface StatsProps {
    entries: MediaEntry[];
    onBack: () => void;
}

export default function StatsView({ entries, onBack }: StatsProps) {
    const stats = useStats(entries);

    return (
        <div className="flex flex-col gap-8 pb-12 animate-in">
            <div className="flex items-center gap-4 mb-2">
                <button onClick={onBack} className="btn btn-ghost">
                    ← Back
                </button>
                <h1 className="text-3xl font-bold">Taste Analysis</h1>
            </div>

            {/* 1. Taste Galaxy (Heatmap) */}
            <Section title="1. The Taste Heatmap">
                <p className="opacity-70 mb-4 text-sm max-w-2xl">
                    A visual map of where your ratings land. Lighter squares mean more entries.
                    <br />
                    <span className="text-xs">Top-Left: Academic · Bottom-Right: Guilty Pleasure · Top-Right: Masterpiece</span>
                </p>
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <TasteGalaxy entries={entries} />
                    <div className="text-sm opacity-80 max-w-sm">
                        <h4 className="font-bold mb-1">Analysis</h4>
                        <p className="mb-2"><strong>Hot Zone:</strong> {stats.hotZone}</p>
                        <p><strong>The Void:</strong> {stats.voidZone}</p>
                    </div>
                </div>
            </Section>

            {/* 2. Media-Type Breakdown */}
            <Section title="2. Media-Type Breakdown">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {stats.perType.slice().sort((a, b) => b.count - a.count).map((m) => {
                        const hue = ((m.avgRating - 1) / 4) * 120;
                        const color = `hsl(${hue}, 50%, 38%)`;
                        return (
                            <div key={m.type} className="card p-4 flex flex-col gap-2 hover:scale-[1.02] transition-transform">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold uppercase text-sm tracking-wider opacity-80">{m.type}</h3>
                                    <span className="text-xs opacity-50 tabular-nums">{m.count} entries</span>
                                </div>
                                <div className="text-4xl font-bold tabular-nums" style={{ color }}>
                                    {m.avgRating.toFixed(1)}
                                </div>
                                <div className="flex gap-3 text-xs opacity-60">
                                    <span>Hd {m.avgHead.toFixed(1)}</span>
                                    <span>Ht {m.avgHeart.toFixed(1)}</span>
                                </div>
                                <div className="text-xs mt-1">
                                    <span className="opacity-50">Top: </span>
                                    <span className="font-medium truncate">{m.best || "—"}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <p className="text-center italic opacity-70 text-sm mb-6">{stats.mediaInsight}</p>
                <MediaScatterPlot entries={entries} />
            </Section>

            {/* 3. Taste Evolution */}
            <Section title="5. Taste Evolution">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="card p-2">
                        <h4 className="font-bold mb-2">The "Snobbery" Index</h4>
                        <p className="text-sm opacity-70 mb-4">Average Head rating over time</p>
                        <TrendLine entries={entries} field="headRating" color="var(--color-secondary)" />
                    </div>
                    <div className="card p-2">
                        <h4 className="font-bold mb-2">The "Softening" Index</h4>
                        <p className="text-sm opacity-70 mb-4">Percentage of "Heart: 5" ratings over time</p>
                        <TrendLine entries={entries} field="heartRating" color="var(--color-primary)" isPercentage5={true} />
                    </div>
                </div>
            </Section>


        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border-t border-black/10 pt-8 first:border-0 first:pt-0">
            <h2 className="text-xl font-bold mb-6 text-[var(--color-primary)] font-mono uppercase tracking-wider">{title}</h2>
            {children}
        </div>
    );
}

// --- Components ---

function TasteGalaxy({ entries }: { entries: MediaEntry[] }) {
    // Create 5x5 grid counts
    const grid = Array(5).fill(0).map(() => Array(5).fill(0));
    let maxCount = 0;

    entries.forEach(e => {
        // Indices 0-4. Head is Y (inverted in visual, so 5 is top row 0), Heart is X (1 is left col 0)
        // Visual Grid: Row 0 = Head 5, Row 4 = Head 1.
        const row = 5 - Math.floor(e.headRating);
        const col = Math.floor(e.heartRating) - 1;
        if (row >= 0 && row < 5 && col >= 0 && col < 5) {
            grid[row][col]++;
            maxCount = Math.max(maxCount, grid[row][col]);
        }
    });

    return (
        <div className="relative p-2 bg-black/5 rounded-lg inline-block">
            <div className="grid grid-cols-5 gap-1 w-[250px] h-[250px]">
                {grid.map((row, rIndex) => (
                    row.map((count, cIndex) => {
                        const intensity = maxCount > 0 ? count / maxCount : 0;
                        const avgRating = ((5 - rIndex) + (cIndex + 1)) / 2;
                        const hue = ((avgRating - 1) / 4) * 120;
                        const cellStyle =
                            count === 0
                                ? {
                                      backgroundColor: "rgba(255,255,255,0.03)",
                                      color: "rgba(255,255,255,0.08)",
                                  }
                                : {
                                      backgroundColor: `hsl(${hue}, ${40 + intensity * 20}%, ${20 + intensity * 25}%)`,
                                      color: intensity > 0.4 ? "#fff" : "rgba(255,255,255,0.45)",
                                  };
                        return (
                            <div
                                key={`${rIndex}-${cIndex}`}
                                className="border border-black/5 rounded-sm flex items-center justify-center text-xs font-bold relative group"
                                style={cellStyle}
                            >
                                {count > 0 && count}

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs p-1 rounded whitespace-nowrap z-10 pointer-events-none">
                                    Head: {5 - rIndex}, Heart: {cIndex + 1}
                                </div>
                            </div>
                        );
                    })
                ))}
            </div>
            {/* Labels */}
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold opacity-50">HEAD</div>
            <div className="absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 text-xs font-bold opacity-50">HEART</div>
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

    // Map 1-5 to coordinate space
    const scale = (val: number) => padding + ((val - 1) / 4) * (size - 2 * padding);
    const invertScale = (val: number) => size - (padding + ((val - 1) / 4) * (size - 2 * padding));

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
                {[1, 2, 3, 4, 5].map(i => (
                    <g key={i}>
                        <line x1={scale(1)} y1={invertScale(i)} x2={scale(5)} y2={invertScale(i)} stroke="#ddd" strokeWidth="1" />
                        <line x1={scale(i)} y1={invertScale(1)} x2={scale(i)} y2={invertScale(5)} stroke="#ddd" strokeWidth="1" />
                        {/* Labels */}
                        <text x={scale(1) - 10} y={invertScale(i)} dy="4" textAnchor="end" fontSize="10" fill="#999">{i}</text>
                        <text x={scale(i)} y={invertScale(1) + 15} textAnchor="middle" fontSize="10" fill="#999">{i}</text>
                    </g>
                ))}

                {/* Axis Titles */}
                <text x={10} y={size / 2} transform={`rotate(-90 10,${size / 2})`} textAnchor="middle" fontSize="12" fill="#666" fontWeight="bold">HEAD</text>
                <text x={size / 2} y={size - 5} textAnchor="middle" fontSize="12" fill="#666" fontWeight="bold">HEART</text>

                {/* Diagonal Line (y=x) */}
                <line x1={scale(1)} y1={invertScale(1)} x2={scale(5)} y2={invertScale(5)} stroke="rgba(0,0,0,0.1)" strokeDasharray="4" strokeWidth="2" />

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
    if (entries.length < 2) return <div className="h-32 flex items-center justify-center italic opacity-40">Need more data</div>;

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
    const minY = isPercentage5 ? 0 : 1;

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
            .join(", ") || "None (Well Traveled)";

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
        const sortedByHead = [...perType].sort((a, b) => a.avgHead - b.avgHead);
        const mediaInsight = sortedByHead.length > 0
            ? `You tend to be most critical of ${sortedByHead[0]?.type}s and most forgiving of ${sortedByHead[sortedByHead.length - 1]?.type}s.`
            : "Not enough data yet.";

        return { hotZone, voidZone, perType, mediaInsight };
    }, [entries]);
}

function getEmptyStats() {
    return {
        hotZone: "N/A",
        voidZone: "All",
        perType: [] as { type: string; count: number; avgHead: number; avgHeart: number; avgRating: number; best: string | null }[],
        mediaInsight: "Not enough data yet.",
    };
}
