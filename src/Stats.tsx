import { useMemo } from "react";
import { Id } from "../convex/_generated/dataModel";

// Types derived from App.tsx (would be better shared, but redefining for simplicity in this file)
type MediaType = "movie" | "book" | "tvshow" | "videogame" | "boardgame";
interface MediaEntry {
    _id: Id<"mediaEntries">;
    title: string;
    type: MediaType;
    headRating: number;
    heartRating: number;
    dateWatched: number;
    notes?: string;
}

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
            <Section title="1. The Taste Galaxy (Heatmap)">
                <p className="opacity-70 mb-4 text-sm max-w-2xl">
                    A visual map of where your ratings land. Darker squares mean more entries.
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

            {/* 2. Divergence Score */}
            <Section title="2. The Divergence Score">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Cold Masterpieces" subtitle="(High Head, Low Heart)" entries={stats.coldMasterpieces} />
                    <StatCard title="Shameless Loves" subtitle="(Low Head, High Heart)" entries={stats.shamelessLoves} />
                    <StatCard title="Perfect Harmony" subtitle="(Head = Heart)" entries={stats.perfectHarmony.slice(0, 5)} moreCount={stats.perfectHarmony.length - 5} />
                </div>
            </Section>

            {/* 3. Personality Archetypes */}
            <Section title="3. Reviewer Archetype">
                <div className="bg-gradient-to-br from-[var(--color-card)] to-[var(--color-card-dark)] p-6 rounded-xl border border-[var(--color-primary)] text-center max-w-2xl mx-auto shadow-lg">
                    <div className="text-6xl mb-4">{stats.archetype.emoji}</div>
                    <h3 className="text-2xl font-bold mb-2">{stats.archetype.name}</h3>
                    <p className="opacity-80 text-lg">{stats.archetype.description}</p>
                </div>
            </Section>

            {/* 4. Media-Type Battle */}
            <Section title="4. Media-Type Battle">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap gap-4 justify-center">
                        {stats.mediaAverages.map((m) => (
                            <div key={m.type} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-black/10 type-${m.type} text-[var(--color-dark)]`}>
                                <span className="uppercase">{m.type}</span>
                                <span>(Hd {m.avgHead} / Ht {m.avgHeart})</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-center italic opacity-70 text-sm">{stats.mediaInsight}</p>
                    {/* Scatter Plot Visualizer */}
                    <MediaScatterPlot entries={entries} />
                </div>
            </Section>

            {/* 5. Taste Evolution */}
            <Section title="5. Taste Evolution">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="card">
                        <h4 className="font-bold mb-2">The "Snobbery" Index</h4>
                        <p className="text-sm opacity-70 mb-4">Average Head rating over time</p>
                        <TrendLine entries={entries} field="headRating" color="var(--color-secondary)" />
                    </div>
                    <div className="card">
                        <h4 className="font-bold mb-2">The "Softening" Index</h4>
                        <p className="text-sm opacity-70 mb-4">Percentage of "Heart: 5" ratings over time</p>
                        <TrendLine entries={entries} field="heartRating" color="var(--color-primary)" isPercentage5={true} />
                    </div>
                </div>
            </Section>

            {/* 6. Recommendation Engine */}
            <Section title="6. What to Watch Next">
                <div className="bg-[var(--color-light)] p-4 rounded-lg border-l-4 border-[var(--color-accent)]">
                    <h4 className="font-bold text-lg mb-1 text-black">Your Sweet Spot: {stats.sweetSpot.label}</h4>
                    <p className="opacity-80 text-black">{stats.sweetSpot.description}</p>
                </div>
            </Section>

            {/* 7. The Nerd Feature (y=x) */}
            <Section title="7. The Nerd Feature: Δ Delta">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1">
                        <div className="text-4xl font-bold mb-2">{stats.delta.toFixed(2)}</div>
                        <p className="font-bold mb-1">Average Delta Score</p>
                        <p className="opacity-70 text-sm mb-4">
                            (Distance from the "Head = Heart" diagonal)
                        </p>
                        <p className="italic text-sm">
                            {stats.delta < 0.7 ? "You are a very consistent rater." : stats.delta > 1.5 ? "Your head and heart are seemingly at war." : "You have a balanced perspective."}
                        </p>
                    </div>
                    <div className="flex-1">
                        <p className="mb-2"><strong>Above Line:</strong> {stats.aboveLine} items (Respect {">"} Enjoy)</p>
                        <p className="mb-2"><strong>Below Line:</strong> {stats.belowLine} items (Enjoy {">"} Respect)</p>
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

function StatCard({ title, subtitle, entries, moreCount = 0 }: { title: string; subtitle: string; entries: MediaEntry[]; moreCount?: number }) {
    return (
        <div className="card h-full">
            <h4 className="font-bold text-lg leading-tight">{title}</h4>
            <p className="text-xs opacity-60 mb-3">{subtitle}</p>
            {entries.length === 0 ? (
                <p className="opacity-40 text-sm italic">None found yet.</p>
            ) : (
                <ul className="space-y-2">
                    {entries.map(e => (
                        <li key={e._id} className="text-sm flex justify-between items-start gap-2">
                            <span className="font-medium truncate">{e.title}</span>
                            <span className="text-xs whitespace-nowrap opacity-60 font-mono">
                                {e.headRating}/{e.heartRating}
                            </span>
                        </li>
                    ))}
                    {moreCount > 0 && (
                        <li className="text-xs opacity-50 italic">...and {moreCount} more</li>
                    )}
                </ul>
            )}
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
                        // Generate color from transparent to heavy primary
                        // Using HSLA for easy opacity
                        return (
                            <div
                                key={`${rIndex}-${cIndex}`}
                                className="border border-black/5 rounded-sm flex items-center justify-center text-xs font-bold relative group"
                                style={{
                                    backgroundColor: `rgba(232, 164, 201, ${intensity})`, // color-primary base
                                    color: intensity > 0.5 ? '#2d2a32' : 'rgba(0,0,0,0.3)'
                                }}
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
    const points = entries.map(e => {
        // Jitter slightly to avoid perfect overlap
        const jitterX = (Math.random() - 0.5) * 0.4;
        const jitterY = (Math.random() - 0.5) * 0.4;
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
        <div className="w-full max-w-[400px] mx-auto bg-white/50 border border-black/10 rounded-xl p-4 aspect-square relative">
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
            // Bucket: Low (1-2), Mid (3), High (4-5) for general zone
            const hRound = Math.floor(e.headRating);
            const htRound = Math.floor(e.heartRating);
            const key = `${hRound}-${htRound}`; // Exact cell tracking
            counts[key] = (counts[key] || 0) + 1;
        });
        // Find mode cell
        let maxCell = "";
        let maxCount = 0;
        Object.entries(counts).forEach(([k, v]) => {
            if (v > maxCount) { maxCount = v; maxCell = k; }
        });
        const hotZone = maxCell ? `Head ${maxCell.split('-')[0]} / Heart ${maxCell.split('-')[1]}` : "N/A";

        // Void Zone (quadrants logic simplified)
        // Check which corner is empty
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

        // 2. Divergence
        const coldMasterpieces = entries
            .filter(e => e.headRating >= 4 && e.heartRating <= 2)
            .sort((a, b) => b.headRating - a.headRating);

        const shamelessLoves = entries
            .filter(e => e.headRating <= 2 && e.heartRating >= 4)
            .sort((a, b) => b.heartRating - a.heartRating);

        const perfectHarmony = entries
            .filter(e => Math.abs(e.headRating - e.heartRating) < 0.5)
            .sort((a, b) => b.headRating - a.headRating); // Top favorities

        // 3. Archetype
        // Centroid (Center of Mass)
        const avgHead = entries.reduce((s, e) => s + e.headRating, 0) / entries.length;
        const avgHeart = entries.reduce((s, e) => s + e.heartRating, 0) / entries.length;

        let archetype = { name: "Chaotic Neutral", emoji: "🎲", description: "Your taste is unpredictable and spans every corner of the grid." };
        if (avgHead > 3.5 && avgHeart < 3) archetype = { name: "The Academic", emoji: "🧐", description: "You value craft over everything. If the lighting is bad, you're out." };
        else if (avgHead < 3 && avgHeart > 3.5) archetype = { name: "The Golden Retriever", emoji: "🦮", description: "You just want to be happy. Plot holes? Who cares!" };
        else if (avgHead > 3.8 && avgHeart > 3.8) archetype = { name: "The Unicorn", emoji: "🦄", description: "You have incredibly high standards and only log things that are perfect in both ways." };

        // 4. Media Battle
        const types = Array.from(new Set(entries.map(e => e.type)));
        const mediaAverages = types.map(t => {
            const subset = entries.filter(e => e.type === t);
            return {
                type: t,
                avgHead: (subset.reduce((s, e) => s + e.headRating, 0) / subset.length).toFixed(1),
                avgHeart: (subset.reduce((s, e) => s + e.heartRating, 0) / subset.length).toFixed(1),
            };
        });
        // Simple insight
        const sortedByHead = [...mediaAverages].sort((a, b) => parseFloat(b.avgHead) - parseFloat(a.avgHead));
        const mediaInsight = `You tend to be most critical of ${sortedByHead[0]?.type}s and most forgiving of ${sortedByHead[sortedByHead.length - 1]?.type}s.`;

        // 6. Recommendation ("Sweet Spot" is the centroid)
        const roundedHead = Math.round(avgHead);
        const roundedHeart = Math.round(avgHeart);
        // Logic for strings
        let recDesc = "You generally like things balanced.";
        if (roundedHead >= 4 && roundedHeart >= 4) recDesc = "You only really love the best of the best. Stick to award winners.";
        else if (roundedHeart > roundedHead + 1) recDesc = "You prefer fun over form. Look for cult classics and crowd pleasers.";
        else if (roundedHead > roundedHeart + 1) recDesc = "You prefer intellectual stimulation. Look for documentaries or complex dramas.";

        const sweetSpot = {
            label: `Head ${roundedHead} / Heart ${roundedHeart}`,
            description: `You tend to be happiest with items around this score. ${recDesc}`
        };

        // 7. Y=X (Delta)
        let sumDelta = 0;
        let above = 0;
        let below = 0;
        entries.forEach(e => {
            const diff = Math.abs(e.headRating - e.heartRating);
            sumDelta += diff;
            if (e.headRating > e.heartRating) above++;
            if (e.heartRating > e.headRating) below++;
        });
        const delta = sumDelta / entries.length;

        return {
            hotZone,
            voidZone,
            coldMasterpieces,
            shamelessLoves,
            perfectHarmony,
            archetype,
            mediaAverages,
            mediaInsight,
            sweetSpot,
            delta,
            aboveLine: above,
            belowLine: below,
        };

    }, [entries]);
}

function getEmptyStats() {
    return {
        hotZone: "N/A",
        voidZone: "All",
        coldMasterpieces: [],
        shamelessLoves: [],
        perfectHarmony: [],
        archetype: { name: "The Blank Slate", emoji: "📄", description: "Start rating things to see your archetype!" },
        mediaAverages: [],
        mediaInsight: "Not enough data yet.",
        sweetSpot: { label: "Unknown", description: "Rate more items to find out." },
        delta: 0,
        aboveLine: 0,
        belowLine: 0
    };
}
