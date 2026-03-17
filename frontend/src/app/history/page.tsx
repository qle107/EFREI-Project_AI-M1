"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IoRefreshOutline, IoTimeOutline, IoSparkles, IoDocumentTextOutline } from "react-icons/io5";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  getRecommendationHistory,
  getRecommendationHistoryEntry,
  type HistoryEntrySummary,
  type HistoryEntryDetail,
  type MovieRecommendationItem,
} from "@/lib/api";

const POSTER_PLACEHOLDER = "https://placehold.co/92x138/1f2937/9ca3af?text=No+poster";

function toTitle(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "Any";
  return value;
}

export default function HistoryPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<HistoryEntrySummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<HistoryEntryDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!token) return;
    setLoadingList(true);
    setError(null);
    try {
      const data = await getRecommendationHistory(token, 60);
      setEntries(data);
      if (!selectedId && data.length > 0) setSelectedId(data[0].id);
      if (data.length === 0) {
        setSelectedId(null);
        setSelectedDetail(null);
      }
    } catch {
      setError("Could not load recommendation history.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (token) void loadHistory();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedId) return;
    setLoadingDetail(true);
    setError(null);
    getRecommendationHistoryEntry(token, selectedId)
      .then(setSelectedDetail)
      .catch(() => setError("Could not load this history entry."))
      .finally(() => setLoadingDetail(false));
  }, [selectedId, token]);

  const requestSummary = useMemo(() => {
    const req = selectedDetail?.request ?? {};
    return {
      mood: toTitle(req.preferred_mood),
      genre: toTitle(req.preferred_genre),
      style: toTitle(req.preferred_style),
      era: toTitle(req.preferred_era),
      director: toTitle(req.preferred_director),
      description: typeof req.description === "string" ? req.description : "",
    };
  }, [selectedDetail]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] pb-16">
      <div className="mx-auto max-w-7xl px-6 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Recommendation History</h1>
            <p className="text-sm text-gray-500 mt-1">
              Revisit previous generations and inspect what profile produced each result.
            </p>
          </div>
          <motion.button
            type="button"
            onClick={loadHistory}
            disabled={loadingList}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition disabled:opacity-50 flex items-center gap-2"
          >
            <IoRefreshOutline className="w-4 h-4" />
            {loadingList ? "Refreshing..." : "Refresh"}
          </motion.button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <IoTimeOutline className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-semibold text-white">Past generations</p>
            </div>
            {loadingList ? (
              <p className="text-sm text-gray-500 py-8">Loading history...</p>
            ) : entries.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No history yet.</p>
                <p className="text-xs text-gray-600 mt-1">Generate recommendations to populate this page.</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[68vh] overflow-y-auto pr-1">
                {entries.map((entry) => {
                  const active = selectedId === entry.id;
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(entry.id)}
                        className="w-full text-left rounded-xl border px-3.5 py-3 transition"
                        style={{
                          borderColor: active ? "rgba(139,92,246,0.55)" : "rgba(255,255,255,0.08)",
                          backgroundColor: active ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <p className="text-[11px] font-mono text-gray-500">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-200 mt-1 line-clamp-2">{entry.summary}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/5 p-6">
            {!selectedId ? (
              <div className="h-full min-h-[260px] flex items-center justify-center">
                <p className="text-sm text-gray-500">Select a generation to inspect details.</p>
              </div>
            ) : loadingDetail ? (
              <div className="h-full min-h-[260px] flex items-center justify-center">
                <p className="text-sm text-gray-500">Loading details...</p>
              </div>
            ) : selectedDetail ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <IoDocumentTextOutline className="w-4 h-4 text-violet-400" />
                  <h2 className="text-lg font-semibold text-white">Generation detail</h2>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <InfoChip label="Mood" value={requestSummary.mood} />
                  <InfoChip label="Genre" value={requestSummary.genre} />
                  <InfoChip label="Style" value={requestSummary.style} />
                  <InfoChip label="Era" value={requestSummary.era} />
                  <InfoChip label="Director" value={requestSummary.director} />
                  <InfoChip
                    label="Recommendations"
                    value={String(selectedDetail.response.recommendations?.length ?? 0)}
                  />
                </div>

                {requestSummary.description && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Description prompt</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{requestSummary.description}</p>
                  </div>
                )}

                {/* Recommended movies — full list from the saved response */}
                {Array.isArray(selectedDetail.response.recommendations) && selectedDetail.response.recommendations.length > 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Recommended movies</p>
                    <ul className="space-y-3">
                      {selectedDetail.response.recommendations.map((movie: MovieRecommendationItem, i: number) => (
                        <HistoryMovieCard key={movie.film_id} movie={movie} rank={i + 1} />
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Recommended movies</p>
                    <p className="text-sm text-gray-500">No movie data saved for this entry. New recommendations will include the full list.</p>
                  </div>
                )}

                {selectedDetail.response.cinephile_profile && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Cinephile profile</p>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedDetail.response.cinephile_profile}</p>
                  </div>
                )}

                <div className="rounded-xl border border-violet-500/20 bg-violet-950/15 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <IoSparkles className="w-4 h-4 text-violet-400" />
                    <p className="text-sm font-medium text-white">AI explanation</p>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedDetail.response.explanation || "No explanation available for this entry."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[260px] flex items-center justify-center">
                <p className="text-sm text-gray-500">Could not display this history entry.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/5 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-widest text-gray-500">{label}</p>
      <p className="text-sm text-gray-200 mt-1 truncate">{value || "Any"}</p>
    </div>
  );
}

function HistoryMovieCard({ movie, rank }: { movie: MovieRecommendationItem; rank: number }) {
  const coveragePct = Math.min(100, Math.max(0, (movie.coverage_score ?? 0) * 100));
  const matchColor = coveragePct >= 70 ? "#4ade80" : coveragePct >= 50 ? "#fbbf24" : "#f87171";
  return (
    <li className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-3">
      <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black bg-amber-400">
        {rank}
      </span>
      <div className="shrink-0 w-12 h-[72px] rounded overflow-hidden bg-zinc-800">
        <img
          src={movie.poster_url || POSTER_PLACEHOLDER}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">{movie.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">Match: <span style={{ color: matchColor }}>{coveragePct.toFixed(0)}%</span></p>
      </div>
      <Link
        href={`/recommend?film=${movie.film_id}`}
        className="shrink-0 text-xs text-violet-400 hover:text-violet-300 transition"
      >
        View →
      </Link>
    </li>
  );
}
