"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoSparkles,
  IoSadOutline,
  IoArrowBack,
  IoArrowForward,
  IoTimeOutline,
} from "react-icons/io5";
import { HiOutlineLightBulb, HiOutlineUser } from "react-icons/hi2";
import { MdAutoAwesome } from "react-icons/md";
import { useAuth } from "@/lib/auth-context";
import { MovieModal } from "@/components/MovieModal";
import { RadarChart } from "@/components/RadarChart";
import { getCatalogOptions, getRecommendations, getPresets, getPresetRecommendations, getRecommendationHistory, getRecommendationHistoryEntry, getMovie, getLLMSettings, updateLLMSettings } from "@/lib/api";
import type { MovieDetail, MovieRecommendationItem, CatalogOptions, PresetQueryItem, HistoryEntrySummary, HistoryEntryDetail, LLMProvider } from "@/lib/api";

// ─── STATIC CONFIG ────────────────────────────────────────────────────────────

const MOOD_CONFIG: Record<string, { emoji: string; bg: string; accent: string }> = {
  dark:          { emoji: "🌑",  bg: "linear-gradient(135deg,#0f172a,#1e293b)", accent: "#94a3b8" },
  uplifting:     { emoji: "☀️",   bg: "linear-gradient(135deg,#78350f,#92400e)", accent: "#fbbf24" },
  tense:         { emoji: "⚡",   bg: "linear-gradient(135deg,#450a0a,#7f1d1d)", accent: "#f87171" },
  heroic:        { emoji: "⚔️",   bg: "linear-gradient(135deg,#0c1a4d,#1e3a8a)", accent: "#60a5fa" },
  romantic:      { emoji: "🌸",   bg: "linear-gradient(135deg,#4c0519,#881337)", accent: "#fb7185" },
  hopeful:       { emoji: "🌿",   bg: "linear-gradient(135deg,#052e16,#14532d)", accent: "#4ade80" },
  gritty:        { emoji: "🏚️",  bg: "linear-gradient(135deg,#18181b,#27272a)", accent: "#a1a1aa" },
  lighthearted:  { emoji: "🎈",   bg: "linear-gradient(135deg,#713f12,#92400e)", accent: "#facc15" },
  epic:          { emoji: "🏔️",  bg: "linear-gradient(135deg,#1e1b4b,#312e81)", accent: "#818cf8" },
  melancholic:   { emoji: "🌧️",  bg: "linear-gradient(135deg,#1c1917,#292524)", accent: "#78716c" },
  mysterious:    { emoji: "🔮",   bg: "linear-gradient(135deg,#2e1065,#3b0764)", accent: "#c084fc" },
  suspenseful:   { emoji: "😰",   bg: "linear-gradient(135deg,#1a0505,#450a0a)", accent: "#fca5a5" },
  nostalgic:     { emoji: "🎞️",  bg: "linear-gradient(135deg,#431407,#7c2d12)", accent: "#fb923c" },
  intense:       { emoji: "🔥",   bg: "linear-gradient(135deg,#431407,#9a3412)", accent: "#f97316" },
  neutral:       { emoji: "⚖️",   bg: "linear-gradient(135deg,#1c1c1e,#2c2c2e)", accent: "#9ca3af" },
  whimsical:     { emoji: "✨",   bg: "linear-gradient(135deg,#4a044e,#7e22ce)", accent: "#d946ef" },
  dramatic:      { emoji: "🎭",   bg: "linear-gradient(135deg,#1e0a3c,#3b0764)", accent: "#a855f7" },
  adventurous:   { emoji: "🗺️",  bg: "linear-gradient(135deg,#14532d,#166534)", accent: "#22c55e" },
  scary:         { emoji: "💀",   bg: "linear-gradient(135deg,#09090b,#18181b)", accent: "#6b7280" },
  funny:         { emoji: "😂",   bg: "linear-gradient(135deg,#713f12,#92400e)", accent: "#fbbf24" },
  atmospheric:   { emoji: "🌫️",  bg: "linear-gradient(135deg,#0c1445,#1e3260)", accent: "#7dd3fc" },
  bittersweet:   { emoji: "🍂",   bg: "linear-gradient(135deg,#431407,#3b1c32)", accent: "#fda4af" },
  cozy:          { emoji: "🧣",   bg: "linear-gradient(135deg,#431407,#78350f)", accent: "#fdba74" },
  thoughtful:    { emoji: "💭",   bg: "linear-gradient(135deg,#0f2027,#203a43)", accent: "#93c5fd" },
  heartwarming:  { emoji: "💛",   bg: "linear-gradient(135deg,#451a03,#78350f)", accent: "#fde68a" },
  eerie:         { emoji: "👁️",  bg: "linear-gradient(135deg,#0d0d0d,#1a1a2e)", accent: "#818cf8" },
  haunting:      { emoji: "👻",   bg: "linear-gradient(135deg,#09090b,#27272a)", accent: "#9ca3af" },
  surreal:       { emoji: "🌀",   bg: "linear-gradient(135deg,#1e1b4b,#4c1d95)", accent: "#c4b5fd" },
};

const GENRE_CONFIG: Record<string, { emoji: string; accent: string }> = {
  "action":          { emoji: "💥", accent: "#f97316" },
  "adventure":       { emoji: "🗺️", accent: "#84cc16" },
  "animation":       { emoji: "🎨", accent: "#a855f7" },
  "comedy":          { emoji: "😄", accent: "#facc15" },
  "crime":           { emoji: "🔫", accent: "#ef4444" },
  "documentary":     { emoji: "🎬", accent: "#64748b" },
  "drama":           { emoji: "🎭", accent: "#a78bfa" },
  "family":          { emoji: "👨‍👩‍👧", accent: "#34d399" },
  "fantasy":         { emoji: "🧙", accent: "#c084fc" },
  "history":         { emoji: "🏛️", accent: "#d97706" },
  "horror":          { emoji: "💀", accent: "#6b7280" },
  "music":           { emoji: "🎵", accent: "#ec4899" },
  "mystery":         { emoji: "🔍", accent: "#818cf8" },
  "romance":         { emoji: "💕", accent: "#f472b6" },
  "science fiction": { emoji: "🚀", accent: "#22d3ee" },
  "thriller":        { emoji: "🔪", accent: "#dc2626" },
  "tv movie":        { emoji: "📺", accent: "#0ea5e9" },
  "war":             { emoji: "⚔️", accent: "#78716c" },
  "western":         { emoji: "🤠", accent: "#b45309" },
};

const STYLE_CONFIG: Record<string, { emoji: string; desc: string }> = {
  "action":           { emoji: "⚡",  desc: "High-octane" },
  "drama":            { emoji: "🎭",  desc: "Story-driven" },
  "mystery":          { emoji: "🔍",  desc: "Suspenseful" },
  "comedy":           { emoji: "😄",  desc: "Funny & light" },
  "thriller":         { emoji: "😰",  desc: "Edge of seat" },
  "slow-burn":        { emoji: "🕯️", desc: "Slow & deep" },
  "fast-paced":       { emoji: "💨",  desc: "Non-stop" },
  "character-driven": { emoji: "👤",  desc: "Character-first" },
};

const ERA_OPTIONS = [
  { value: "Classic (pre-1980)", label: "Classic", sub: "pre-1980" },
  { value: "80s",                label: "80s",     sub: "1980–1989" },
  { value: "90s",                label: "90s",     sub: "1990–1999" },
  { value: "2000s",              label: "2000s",   sub: "2000–2009" },
  { value: "2010s",              label: "2010s",   sub: "2010–2019" },
  { value: "Recent (2020+)",     label: "Recent",  sub: "2020+" },
];

const INTENSITY_LABELS = ["Low", "Mild", "Medium", "Strong", "Intense"];

/** Sample descriptions for Step 1 — click to prefill, then tweak. */
const SAMPLE_DESCRIPTIONS: { label: string; emoji: string; text: string }[] = [
  { label: "Action", emoji: "💥", text: "High-octane action with intense fight scenes, chases, and stunts. I want something adrenaline-pumping with a clear hero and a satisfying payoff. Big set pieces and practical stunts preferred." },
  { label: "Horror", emoji: "💀", text: "A tense horror film that builds dread through atmosphere rather than jump scares. I prefer psychological scares and eerie mood over gore. Something that stays with me after the credits." },
  { label: "Comedy", emoji: "😂", text: "A smart comedy with sharp dialogue and genuine laughs. I like character-driven humour, witty banter, and maybe a bit of heart. Not too slapstick — something that feels fresh and clever." },
  { label: "Drama", emoji: "🎭", text: "A character-driven drama with emotional depth and strong performances. I want a story that feels real and stays with me — nuanced relationships, moral complexity, and beautiful cinematography." },
  { label: "Sci‑Fi", emoji: "🚀", text: "A thought-provoking science fiction film that explores big ideas — AI, identity, time, or space. I want smart world-building, tense atmosphere, and a payoff that makes me think. Minimal cheese." },
  { label: "Romance", emoji: "💕", text: "A romantic story that feels genuine rather than cheesy. I like chemistry between leads, emotional honesty, and a satisfying arc. Bittersweet is fine — just no shallow tropes." },
  { label: "Thriller", emoji: "🔪", text: "A gripping thriller with tension that never lets up. Clever twists, moral grey areas, and a villain or situation that feels real. I want to be on the edge of my seat." },
  { label: "Fantasy", emoji: "🧙", text: "An epic fantasy with rich world-building, a clear quest or conflict, and memorable characters. Magic, creatures, or mythology done with conviction. I want to be transported to another world." },
  { label: "Crime / Noir", emoji: "🔫", text: "A dark crime or noir story with moral ambiguity, double-crosses, and a gritty atmosphere. Complex characters, sharp dialogue, and a twist I didn't see coming." },
];

type ScoreWeights = {
  mood: number;
  theme: number;
  style: number;
  description: number;
  recency: number;
};

const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  mood: 0.35,
  theme: 0.25,
  style: 0.20,
  description: 0.15,
  recency: 0.05,
};

const toPct = (weight: number) => `${Math.round(weight * 100)}%`;

function buildWeightRows(weights: ScoreWeights) {
  return [
    { label: "Mood", pct: Math.round(weights.mood * 100), color: "#8b5cf6" },
    { label: "Theme", pct: Math.round(weights.theme * 100), color: "#3b82f6" },
    { label: "Style", pct: Math.round(weights.style * 100), color: "#10b981" },
    { label: "Description", pct: Math.round(weights.description * 100), color: "#f59e0b" },
    { label: "Recency", pct: Math.round(weights.recency * 100), color: "#6b7280" },
  ];
}

const POSTER_PLACEHOLDER = "https://placehold.co/300x450/1a1a1a/666666?text=No+Poster";

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────

const STEP_LABELS = ["Story", "Mood", "Genre", "Style & Era", "Fine-tune"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center mb-10 px-2">
      {STEP_LABELS.slice(0, total).map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  scale: active ? 1.15 : 1,
                  backgroundColor: done ? "#7c3aed" : active ? "#8b5cf6" : "transparent",
                  borderColor: done || active ? "#8b5cf6" : "#3f3f46",
                }}
                transition={{ duration: 0.3 }}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold"
                style={{ color: done || active ? "#fff" : "#52525b" }}
              >
                {done ? "✓" : idx}
              </motion.div>
              <span
                className="text-[10px] font-medium whitespace-nowrap"
                style={{ color: active ? "#a78bfa" : done ? "#7c3aed" : "#52525b" }}
              >
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className="w-8 sm:w-14 h-px mx-1.5 mb-5 shrink-0"
                style={{ backgroundColor: done ? "#7c3aed" : "#3f3f46" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MOOD CARD ────────────────────────────────────────────────────────────────

function MoodCard({ mood, selected, onClick }: { mood: string; selected: boolean; onClick: () => void }) {
  const cfg = MOOD_CONFIG[mood.toLowerCase()] ?? { emoji: "🎬", bg: "linear-gradient(135deg,#1c1c1e,#2c2c2e)", accent: "#a1a1aa" };
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.96 }}
      className="relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 cursor-pointer overflow-hidden transition-all duration-200"
      style={{
        background: cfg.bg,
        borderColor: selected ? cfg.accent : "rgba(255,255,255,0.08)",
        boxShadow: selected ? `0 0 16px ${cfg.accent}45` : "none",
        minHeight: "54px",
      }}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black"
          style={{ backgroundColor: cfg.accent }}
        >
          ✓
        </motion.div>
      )}
      <span className="text-base leading-none select-none">{cfg.emoji}</span>
      <span className="text-[10px] font-semibold capitalize leading-tight" style={{ color: selected ? cfg.accent : "#d4d4d8" }}>
        {mood}
      </span>
    </motion.button>
  );
}

// ─── GENRE CARD ───────────────────────────────────────────────────────────────

function GenreCard({ genre, selected, onClick }: { genre: string; selected: boolean; onClick: () => void }) {
  const cfg = GENRE_CONFIG[genre.toLowerCase()] ?? { emoji: "🎬", accent: "#8b5cf6" };
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.96 }}
      className="relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: selected ? `${cfg.accent}18` : "rgba(255,255,255,0.03)",
        borderColor: selected ? cfg.accent : "rgba(255,255,255,0.08)",
        boxShadow: selected ? `0 0 14px ${cfg.accent}30` : "none",
        minHeight: "54px",
      }}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-black"
          style={{ backgroundColor: cfg.accent }}
        >
          ✓
        </motion.div>
      )}
      <span className="text-base leading-none select-none">{cfg.emoji}</span>
      <span className="text-[10px] font-medium capitalize text-center leading-tight" style={{ color: selected ? cfg.accent : "#a1a1aa" }}>
        {genre}
      </span>
    </motion.button>
  );
}

// ─── STYLE CARD ───────────────────────────────────────────────────────────────

function StyleCard({ style, selected, onClick }: { style: string; selected: boolean; onClick: () => void }) {
  const cfg = STYLE_CONFIG[style.toLowerCase()] ?? { emoji: "🎬", desc: "" };
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="relative flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: selected ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
        borderColor: selected ? "#8b5cf6" : "rgba(255,255,255,0.08)",
        boxShadow: selected ? "0 0 14px rgba(139,92,246,0.28)" : "none",
      }}
    >
      <span className="text-base leading-none select-none shrink-0">{cfg.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold capitalize leading-tight" style={{ color: selected ? "#c4b5fd" : "#d4d4d8" }}>
          {style}
        </div>
        {cfg.desc && (
          <div className="text-[9px] leading-tight mt-0.5" style={{ color: selected ? "#a78bfa" : "#52525b" }}>
            {cfg.desc}
          </div>
        )}
      </div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0"
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── INTENSITY SELECTOR ───────────────────────────────────────────────────────

function IntensitySelector({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-xs font-semibold text-gray-200">{label}</p>
        {description && <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex gap-1.5">
        {INTENSITY_LABELS.map((lbl, i) => {
          const v = i + 1;
          const active = value === v;
          const filled = value > v;
          return (
            <motion.button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 flex flex-col items-center gap-0.5 rounded-lg border-2 py-1.5 transition-all duration-150"
              style={{
                borderColor: active ? "#8b5cf6" : filled ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.08)",
                backgroundColor: active ? "rgba(139,92,246,0.22)" : filled ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.02)",
              }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: active ? "#c4b5fd" : filled ? "#7c3aed" : "#52525b" }}
              >
                {v}
              </span>
              <span
                className="text-[9px] hidden sm:block"
                style={{ color: active ? "#a78bfa" : "#52525b" }}
              >
                {lbl}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCORE BAR ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300 font-medium">{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.65, ease: "easeOut", delay }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── STRUCTURED EXPLANATION PARSER ────────────────────────────────────────────

interface ParsedExplanation {
  overview: string;
  films: { title: string; text: string }[];
  refine: string;
}

function parseExplanation(raw: string): ParsedExplanation {
  const result: ParsedExplanation = { overview: "", films: [], refine: "" };
  if (!raw) return result;

  const overviewMatch = raw.match(/OVERVIEW:\s*([\s\S]*?)(?=FILM_\d:|REFINE:|CINEPHILE_PROFILE:|$)/i);
  if (overviewMatch) result.overview = overviewMatch[1].trim();

  const filmMatches = [...raw.matchAll(/FILM_\d:\s*([^\n]+)\n([\s\S]*?)(?=FILM_\d:|REFINE:|CINEPHILE_PROFILE:|$)/gi)];
  for (const match of filmMatches) {
    result.films.push({ title: match[1].trim(), text: match[2].trim() });
  }

  const refineMatch = raw.match(/REFINE:\s*([\s\S]*?)(?=CINEPHILE_PROFILE:|$)/i);
  if (refineMatch) result.refine = refineMatch[1].trim();

  return result;
}

function normalizeMovieTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildFallbackFilmInsight(movie: MovieRecommendationItem): string {
  const axes = [
    { key: "mood_score", label: "mood", value: movie.mood_score },
    { key: "theme_score", label: "theme", value: movie.theme_score },
    { key: "style_score", label: "style", value: movie.style_score },
    { key: "desc_score", label: "description", value: movie.desc_score },
  ] as const;
  const sorted = [...axes].sort((a, b) => b.value - a.value);
  const strongest = sorted[0];
  const second = sorted[1];
  const weakest = sorted[sorted.length - 1];
  return `${movie.title} is recommended mainly because its ${strongest.label} match is strong (${Math.round(strongest.value * 100)}%), reinforced by ${second.label} (${Math.round(second.value * 100)}%). The weaker area is ${weakest.label} (${Math.round(weakest.value * 100)}%), so refining that preference may improve precision.`;
}

function resolveFilmInsight(
  movie: MovieRecommendationItem,
  index: number,
  parsed: ParsedExplanation,
): string {
  const normalizedTitle = normalizeMovieTitle(movie.title);
  const byTitle = parsed.films.find(
    (item) => normalizeMovieTitle(item.title) === normalizedTitle && item.text.trim().length > 0,
  );
  if (byTitle) return byTitle.text.trim();

  const byIndex = parsed.films[index]?.text?.trim();
  if (byIndex) return byIndex;

  return buildFallbackFilmInsight(movie);
}

// ─── RECOMMENDATION CARD ──────────────────────────────────────────────────────

const RANK_COLORS = ["#fbbf24", "#94a3b8", "#cd7c2f"];

function RecommendationCard({
  movie,
  rank,
  onDetails,
  filmInsight,
}: {
  movie: MovieRecommendationItem;
  rank: number;
  onDetails: () => void;
  filmInsight?: string;
}) {
  const coveragePct = Math.min(100, Math.max(0, movie.coverage_score * 100));
  const matchColor = coveragePct >= 70 ? "#4ade80" : coveragePct >= 50 ? "#fbbf24" : "#f87171";
  const rawPairs = [
    { label: "Mood", value: movie.raw_mood_similarity },
    { label: "Theme", value: movie.raw_theme_similarity },
    { label: "Style", value: movie.raw_style_similarity },
    { label: "Desc", value: movie.raw_desc_similarity },
  ].filter((item) => typeof item.value === "number");

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rank - 1) * 0.18, duration: 0.5, ease: "easeOut" }}
      className="w-full rounded-2xl border border-white/10 overflow-hidden"
      style={{ backgroundColor: "rgba(24,24,27,0.9)" }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/5"
        style={{ backgroundColor: "rgba(255,255,255,0.025)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
            style={{ backgroundColor: RANK_COLORS[rank - 1] ?? "#6b7280" }}
          >
            {rank}
          </span>
          <span className="text-base font-semibold text-white truncate">{movie.title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-gray-500">Match</span>
          <span className="text-2xl font-bold tabular-nums" style={{ color: matchColor }}>
            {coveragePct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Body — full-width row: poster, score (flex-1), radar */}
      <div className="flex w-full flex-col sm:flex-row sm:flex-nowrap gap-6 sm:gap-8 px-6 sm:px-8 py-6 sm:py-8">
        {/* Poster */}
        <button
          type="button"
          onClick={onDetails}
          className="shrink-0 w-[100px] sm:w-[clamp(100px,18%,160px)] rounded-xl overflow-hidden bg-zinc-800 transition-all hover:ring-2 ring-violet-500/60 group"
        >
          <div className="relative aspect-2/3 w-full">
            <img
              src={movie.poster_url || POSTER_PLACEHOLDER}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:brightness-85 transition"
            />
          </div>
        </button>

        {/* Score bars — takes remaining width */}
        <div className="min-w-0 flex-1 flex flex-col justify-between gap-3 w-full">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Score breakdown</p>
            <div className="space-y-3.5">
              <ScoreBar label="Mood" value={movie.mood_score} color="#8b5cf6" delay={0.1} />
              <ScoreBar label="Theme" value={movie.theme_score} color="#3b82f6" delay={0.2} />
              <ScoreBar label="Style" value={movie.style_score} color="#10b981" delay={0.3} />
              <ScoreBar label="Description" value={movie.desc_score} color="#f59e0b" delay={0.4} />
            </div>
          </div>

          {/* Overall bar */}
          <div className="pt-4 mt-2 border-t border-white/8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300 font-medium">Overall coverage</span>
              <span className="text-sm font-bold text-white">{coveragePct.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${coveragePct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: (rank - 1) * 0.18 + 0.2 }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#7c3aed,#8b5cf6,#a78bfa)" }}
              />
            </div>
          </div>

          {rawPairs.length > 0 && (
            <div className="pt-3 border-t border-white/8">
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">
                Raw cosine preview
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-gray-500">
                {rawPairs.map((item) => (
                  <span key={item.label}>
                    {item.label}: {item.value!.toFixed(3)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onDetails}
            className="mt-3 w-fit text-sm text-violet-400 hover:text-violet-300 transition font-medium"
          >
            View movie details →
          </button>
        </div>

        {/* Radar chart */}
        <div className="shrink-0 sm:w-[clamp(180px,24%,240px)] flex flex-col items-center gap-3 px-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Radar</p>
          <RadarChart
            size={168}
            scores={[
              { label: "Mood",  value: movie.mood_score },
              { label: "Theme", value: movie.theme_score },
              { label: "Style", value: movie.style_score },
              { label: "Desc",  value: movie.desc_score },
            ]}
          />
        </div>
      </div>

      {/* AI film-specific insight */}
      {filmInsight && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (rank - 1) * 0.18 + 0.4 }}
          className="mx-6 sm:mx-8 mb-6 sm:mb-8 rounded-xl border border-violet-500/15 bg-violet-950/15 px-6 sm:px-8 py-4 flex items-start gap-3"
        >
          <HiOutlineLightBulb className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 leading-relaxed">{filmInsight}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── COMPARATIVE ANALYSIS PANEL ───────────────────────────────────────────────

const FILM_COLORS = ["#fbbf24", "#94a3b8", "#cd7c2f"];
function buildDimMeta(weights: ScoreWeights) {
  return [
    { key: "mood_score", label: "Mood", short: "Mood", color: "#8b5cf6", weight: toPct(weights.mood) },
    { key: "theme_score", label: "Theme", short: "Theme", color: "#3b82f6", weight: toPct(weights.theme) },
    { key: "style_score", label: "Style", short: "Style", color: "#10b981", weight: toPct(weights.style) },
    { key: "desc_score", label: "Desc", short: "Desc", color: "#f59e0b", weight: toPct(weights.description) },
  ] as const;
}

function heatCell(value: number) {
  const pct = Math.round(Math.min(100, Math.max(0, value * 100)));
  const bg =
    pct >= 80 ? "rgba(74,222,128,0.18)"  :
    pct >= 65 ? "rgba(132,204,22,0.15)"  :
    pct >= 50 ? "rgba(250,204,21,0.14)"  :
    pct >= 35 ? "rgba(251,146,60,0.13)"  :
                "rgba(248,113,113,0.12)";
  const color =
    pct >= 80 ? "#4ade80" :
    pct >= 65 ? "#84cc16" :
    pct >= 50 ? "#facc15" :
    pct >= 35 ? "#fb923c" :
                "#f87171";
  return { pct, bg, color };
}

function ScoreHeatmap({ movies, scoreWeights }: { movies: MovieRecommendationItem[]; scoreWeights: ScoreWeights }) {
  const dims = [...buildDimMeta(scoreWeights), { key: "coverage_score", label: "Overall", short: "Overall", color: "#a78bfa", weight: "Σ" } as const];
  return (
    <div className="overflow-x-auto">
      <p className="text-xs text-gray-500 mb-4 font-mono">
        Score matrix — color scale: <span style={{ color: "#f87171" }}>▇</span> &lt;50% &nbsp;
        <span style={{ color: "#facc15" }}>▇</span> 50–75% &nbsp;
        <span style={{ color: "#4ade80" }}>▇</span> &gt;75%
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left text-gray-500 font-mono text-xs py-3 pr-4 pl-2">Film</th>
            {dims.map((d) => (
              <th key={d.key} className="text-center font-mono py-3 px-3 min-w-[72px]" style={{ color: d.color }}>
                <div className="text-sm font-semibold">{d.short}</div>
                <div className="text-[10px] text-gray-600 font-normal mt-0.5">{d.weight}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {movies.map((m, i) => {
            const scores: Record<string, number> = {
              mood_score: m.mood_score, theme_score: m.theme_score,
              style_score: m.style_score, desc_score: m.desc_score,
              coverage_score: m.coverage_score,
            };
            return (
              <motion.tr
                key={m.film_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="border-b border-white/5"
              >
                <td className="py-3 pr-4 pl-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0"
                      style={{ backgroundColor: FILM_COLORS[i] ?? "#6b7280" }}
                    >{i + 1}</span>
                    <span className="text-gray-200 text-xs font-medium leading-snug">{m.title}</span>
                  </div>
                </td>
                {dims.map((d) => {
                  const { pct, bg, color } = heatCell(scores[d.key]);
                  return (
                    <td key={d.key} className="text-center py-2 px-2">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 + 0.1 }}
                        className="rounded-lg px-2 py-2 font-mono font-bold text-sm mx-auto"
                        style={{ backgroundColor: bg, color, minWidth: 52 }}
                      >
                        {pct}%
                      </motion.div>
                    </td>
                  );
                })}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GroupedBarChart({ movies, scoreWeights }: { movies: MovieRecommendationItem[]; scoreWeights: ScoreWeights }) {
  const dimMeta = buildDimMeta(scoreWeights);
  const barW = 24;
  const gap = 7;
  const groupGap = 36;
  const marginL = 44;
  const marginT = 26;
  const marginB = 40;
  const chartH = 200;
  const svgH = marginT + chartH + marginB;
  const n = movies.length;
  const groupW = n * barW + (n - 1) * gap;
  const totalChartW = dimMeta.length * groupW + (dimMeta.length - 1) * groupGap;
  const viewW = marginL + totalChartW + 16;
  const gridVals = [0, 25, 50, 75, 100];

  return (
    <div className="overflow-x-auto">
      <p className="text-xs text-gray-500 mb-3 font-mono">
        Semantic dimension scores by film — grouped by axis
      </p>
      <svg
        viewBox={`0 0 ${viewW} ${svgH}`}
        width="100%"
        style={{ minWidth: 320 }}
        aria-label="Grouped bar chart: per-dimension scores for all films"
      >
        {/* Chart background */}
        <rect
          x={marginL} y={marginT}
          width={totalChartW + 16} height={chartH}
          fill="rgba(255,255,255,0.015)" rx={6}
        />

        {/* Y-axis gridlines + labels */}
        {gridVals.map((v) => {
          const y = marginT + chartH * (1 - v / 100);
          return (
            <g key={v}>
              <line
                x1={marginL} y1={y}
                x2={marginL + totalChartW + 16} y2={y}
                stroke={v === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}
                strokeWidth={v === 0 ? 1.2 : 0.8}
                strokeDasharray={v > 0 ? "4 4" : undefined}
              />
              <text
                x={marginL - 7} y={y + 4}
                textAnchor="end"
                fontSize={10} fill="rgba(255,255,255,0.35)" fontFamily="monospace"
              >{v}%</text>
            </g>
          );
        })}

        {/* Bars + labels */}
        {dimMeta.map((dim, di) => {
          const groupX = marginL + 8 + di * (groupW + groupGap);
          const dimScores = movies.map((m) => Number(m[dim.key] ?? 0));
          return (
            <g key={dim.key}>
              {dimScores.map((val, fi) => {
                const safeVal = Number.isFinite(val) ? val : 0;
                const pct = Math.min(100, Math.max(0, safeVal * 100));
                const barH = Math.max(2, (pct / 100) * chartH);
                const x = groupX + fi * (barW + gap);
                const y = marginT + chartH - barH;
                const opacity = fi === 0 ? 0.92 : fi === 1 ? 0.78 : 0.65;
                return (
                  <g key={fi}>
                    <rect
                      x={x} y={y} width={barW} height={barH}
                      rx={4} ry={4}
                      fill={FILM_COLORS[fi] ?? "#6b7280"}
                      fillOpacity={opacity}
                    />
                    <text
                      x={x + barW / 2} y={y - 5}
                      textAnchor="middle"
                      fontSize={10} fill={FILM_COLORS[fi] ?? "#6b7280"}
                      fontFamily="monospace" fontWeight="700"
                    >
                      {Math.round(pct)}
                    </text>
                  </g>
                );
              })}

              {/* Dimension label */}
              <text
                x={groupX + groupW / 2}
                y={svgH - 18}
                textAnchor="middle"
                fontSize={12} fill={dim.color}
                fontFamily="monospace" fontWeight="700"
              >
                {dim.short}
              </text>
              {/* Weight sub-label */}
              <text
                x={groupX + groupW / 2}
                y={svgH - 5}
                textAnchor="middle"
                fontSize={9} fill="rgba(255,255,255,0.22)"
                fontFamily="monospace"
              >
                {dim.weight}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Film legend */}
      <div className="flex flex-wrap items-center gap-5 mt-4 pl-11">
        {movies.map((m, i) => (
          <div key={m.film_id} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: FILM_COLORS[i] ?? "#6b7280", opacity: i === 0 ? 0.92 : i === 1 ? 0.78 : 0.65 }}
            />
            <span className="text-gray-300">
              <span className="font-semibold text-white">#{i + 1}</span>{" "}{m.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonPanel({ movies, scoreWeights }: { movies: MovieRecommendationItem[]; scoreWeights: ScoreWeights }) {
  const [view, setView] = useState<"heatmap" | "bars" | "radars">("heatmap");
  const VIEW_LABELS = { heatmap: "Heatmap", bars: "Bar chart", radars: "Radar" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-white/10 overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.025)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-white/8"
        style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
      >
        <div>
          <p className="text-sm font-semibold text-white">Comparative analysis</p>
          <p className="text-xs font-mono text-gray-500 mt-0.5">
            {movies.length} films × 4 semantic dimensions
          </p>
        </div>
        <div className="flex gap-1.5">
          {(["heatmap", "bars", "radars"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all"
              style={{
                borderColor: view === v ? "#8b5cf6" : "rgba(255,255,255,0.08)",
                backgroundColor: view === v ? "rgba(139,92,246,0.18)" : "transparent",
                color: view === v ? "#c4b5fd" : "#6b7280",
              }}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">
        <AnimatePresence mode="wait">
          {view === "bars" && (
            <motion.div key="bars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GroupedBarChart movies={movies} scoreWeights={scoreWeights} />
            </motion.div>
          )}
          {view === "heatmap" && (
            <motion.div key="heatmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScoreHeatmap movies={movies} scoreWeights={scoreWeights} />
            </motion.div>
          )}
          {view === "radars" && (
            <motion.div key="radars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs text-gray-500 mb-5 font-mono">Radar profiles — same scale for direct comparison</p>
              <p className="text-[11px] text-gray-600 mb-4">
                Overall values are rounded for display; ranking order uses full precision scores.
              </p>
              <div className="flex items-start justify-around gap-6 flex-wrap">
                {movies.map((m, i) => (
                  <div key={m.film_id} className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0"
                        style={{ backgroundColor: FILM_COLORS[i] ?? "#6b7280" }}
                      >{i + 1}</span>
                      <span className="text-sm text-gray-200 font-medium leading-snug">{m.title}</span>
                    </div>
                    <RadarChart
                      size={190}
                      color={FILM_COLORS[i] ?? "#8b5cf6"}
                      scores={[
                        { label: "Mood",  value: m.mood_score },
                        { label: "Theme", value: m.theme_score },
                        { label: "Style", value: m.style_score },
                        { label: "Desc",  value: m.desc_score },
                      ]}
                    />
                    <span className="text-sm font-mono font-semibold" style={{ color: FILM_COLORS[i] ?? "#6b7280" }}>
                      {(m.coverage_score * 100).toFixed(1)}% overall
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── SCORING FORMULA ──────────────────────────────────────────────────────────

function ScoringFormula({ scoreWeights }: { scoreWeights: ScoreWeights }) {
  const [open, setOpen] = useState(false);
  const weightRows = buildWeightRows(scoreWeights);
  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition"
      >
        <span className="border border-white/10 rounded px-1.5 py-0.5 font-mono text-[10px]">?</span>
        {open ? "Hide scoring formula" : "How does scoring work?"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                Each movie is scored by cosine similarity across 4 dimensions. Mood, Theme, and Style weights are dynamically adjusted by your sliders, Description keeps a strong base priority, and Recency stays a light tiebreaker.
              </p>
              <div className="space-y-2.5">
                {weightRows.map((w) => (
                  <div key={w.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-24 shrink-0">{w.label}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${w.pct}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: w.color }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-300 w-8 text-right">{w.pct}%</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-600 font-mono bg-black/40 rounded-lg px-3 py-2">
                Score = wMood×Mood + wTheme×Theme + wStyle×Style + wDesc×Desc + wRecency×Recency
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function RecommendPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [options, setOptions] = useState<CatalogOptions | null>(null);
  const [presets, setPresets] = useState<PresetQueryItem[]>([]);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntrySummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [preferredEra, setPreferredEra] = useState("");
  const [preferredDirector, setPreferredDirector] = useState("");
  const [preferredMood, setPreferredMood] = useState("");
  const [preferredGenre, setPreferredGenre] = useState("");
  const [preferredStyle, setPreferredStyle] = useState("");
  const [moodIntensity, setMoodIntensity] = useState(3);
  const [themeInterest, setThemeInterest] = useState(3);
  const [styleInterest, setStyleInterest] = useState(3);

  const [recommendations, setRecommendations] = useState<MovieRecommendationItem[]>([]);
  const [explanation, setExplanation] = useState("");
  const [cinephileProfile, setCinephileProfile] = useState("");
  const [descriptionEnriched, setDescriptionEnriched] = useState(false);
  const [scoreWeights, setScoreWeights] = useState<ScoreWeights>(DEFAULT_SCORE_WEIGHTS);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [modalMovie, setModalMovie] = useState<MovieDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [lastPresetLabel, setLastPresetLabel] = useState<string | null>(null);
  const [llmProvider, setLlmProvider] = useState<LLMProvider>("ollama");
  const [llmProviderFromResponse, setLlmProviderFromResponse] = useState<LLMProvider | undefined>(undefined);
  const [llmProviderSwitching, setLlmProviderSwitching] = useState(false);
  const [anthropicConfigured, setAnthropicConfigured] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    getCatalogOptions()
      .then((opts) => {
        setOptions(opts);
        if (opts.moods[0]) setPreferredMood(opts.moods[0]);
        if (opts.genres[0]) setPreferredGenre(opts.genres[0]);
        if (opts.styles[0]) setPreferredStyle(opts.styles[0]);
      })
      .catch(() =>
        setOptions({
          moods: ["dark", "uplifting", "tense", "heroic", "romantic", "hopeful", "gritty", "lighthearted"],
          genres: ["action", "comedy", "crime", "drama", "fantasy", "horror", "mystery", "romance", "science fiction", "thriller"],
          styles: ["action", "drama", "mystery", "comedy", "thriller", "slow-burn", "fast-paced", "character-driven"],
        })
      );
    getPresets().then(setPresets).catch(() => setPresets([]));
  }, []);

  useEffect(() => {
    if (!token) return;
    getLLMSettings(token)
      .then((s) => {
        setLlmProvider(s.provider);
        setAnthropicConfigured(s.anthropic_configured);
        setGeminiConfigured(s.gemini_configured);
      })
      .catch(() => {});
  }, [token]);

  const loadHistory = () => {
    if (!token) return;
    setHistoryLoading(true);
    getRecommendationHistory(token)
      .then(setHistoryEntries)
      .catch(() => setHistoryEntries([]))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    if (token) loadHistory();
  }, [token]);

  const handleSubmit = async () => {
    if (!token || !options) return;
    setLoading(true);
    setLastPresetLabel(null);
    setSubmitted(false);
    setRecommendations([]);
    setExplanation("");
    setCinephileProfile("");
    setDescriptionEnriched(false);
    setScoreWeights(DEFAULT_SCORE_WEIGHTS);
    try {
      const data = await getRecommendations(token, {
        description: description || "I enjoy compelling stories with strong characters.",
        preferred_mood: preferredMood || options.moods[0] || "drama",
        preferred_genre: preferredGenre || options.genres[0] || "drama",
        preferred_style: preferredStyle || options.styles[0] || "drama",
        preferred_era: preferredEra || undefined,
        preferred_director: preferredDirector || undefined,
        mood_intensity: moodIntensity,
        theme_interest: themeInterest,
        style_interest: styleInterest,
      });
      setRecommendations(data.recommendations);
      setExplanation(data.explanation);
      setCinephileProfile(data.cinephile_profile || "");
      setDescriptionEnriched(data.description_enriched || false);
      setScoreWeights(data.score_weights || DEFAULT_SCORE_WEIGHTS);
      if (data.llm_provider) setLlmProviderFromResponse(data.llm_provider);
      setSubmitted(true);
      setViewingHistoryId(null);
      loadHistory();
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    } catch {
      setExplanation("Could not get recommendations. Please check the API and try again.");
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = async (preset: PresetQueryItem) => {
    if (!token) return;
      setViewingHistoryId(null);
      setLastPresetLabel(preset.label);
      setDescription(preset.description);
    setPreferredMood(preset.preferred_mood);
    setPreferredGenre(preset.preferred_genre);
    setPreferredStyle(preset.preferred_style);
    setMoodIntensity(preset.mood_intensity);
    setThemeInterest(preset.theme_interest);
    setStyleInterest(preset.style_interest);
    setLoading(true);
    setSubmitted(false);
    setRecommendations([]);
    setExplanation("");
    setCinephileProfile("");
    setDescriptionEnriched(false);
    setScoreWeights(DEFAULT_SCORE_WEIGHTS);
    try {
      const data = await getPresetRecommendations(token, preset.id);
      setRecommendations(data.recommendations);
      setExplanation(data.explanation);
      setCinephileProfile(data.cinephile_profile || "");
      setDescriptionEnriched(data.description_enriched || false);
      setScoreWeights(data.score_weights || DEFAULT_SCORE_WEIGHTS);
      if (data.llm_provider) setLlmProviderFromResponse(data.llm_provider);
      setSubmitted(true);
      loadHistory();
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    } catch {
      setExplanation("Could not get recommendations for this preset. Please try again.");
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (filmId: number) => {
    try {
      const m = await getMovie(filmId);
      setModalMovie(m);
      setModalOpen(true);
    } catch {
      setModalMovie(null);
    }
  };

  const handleViewHistoryEntry = async (entry: HistoryEntrySummary) => {
    if (!token) return;
    setLoading(true);
    try {
      const detail = await getRecommendationHistoryEntry(token, entry.id);
      const req = detail.request as Record<string, unknown>;
      const res = detail.response;
      setDescription((req.description as string) ?? "");
      setPreferredMood((req.preferred_mood as string) ?? "");
      setPreferredGenre((req.preferred_genre as string) ?? "");
      setPreferredStyle((req.preferred_style as string) ?? "");
      setPreferredEra((req.preferred_era as string) ?? "");
      setPreferredDirector((req.preferred_director as string) ?? "");
      setMoodIntensity((req.mood_intensity as number) ?? 3);
      setThemeInterest((req.theme_interest as number) ?? 3);
      setStyleInterest((req.style_interest as number) ?? 3);
      setRecommendations(res.recommendations ?? []);
      setExplanation(res.explanation ?? "");
      setCinephileProfile(res.cinephile_profile ?? "");
      setDescriptionEnriched(res.description_enriched ?? false);
      setScoreWeights((res.score_weights as ScoreWeights | undefined) ?? DEFAULT_SCORE_WEIGHTS);
      setLastPresetLabel(res.preset_id ? `Preset: ${res.preset_id}` : null);
      if (res.llm_provider) setLlmProviderFromResponse(res.llm_provider);
      setViewingHistoryId(entry.id);
      setSubmitted(true);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    } catch {
      setExplanation("Could not load this past generation.");
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setLastPresetLabel(null);
    setViewingHistoryId(null);
    setStep(1);
    setRecommendations([]);
    setExplanation("");
    setCinephileProfile("");
    setScoreWeights(DEFAULT_SCORE_WEIGHTS);
    setLlmProviderFromResponse(undefined);
  };

  const handleLlmProviderChange = async (provider: LLMProvider) => {
    if (!token || provider === llmProvider) return;
    if (provider === "anthropic" && !anthropicConfigured) return;
    if (provider === "gemini" && !geminiConfigured) return;
    setLlmProviderSwitching(true);
    try {
      await updateLLMSettings(token, { provider });
      setLlmProvider(provider);
    } finally {
      setLlmProviderSwitching(false);
    }
  };

  const canContinue = (s: number) => {
    if (s === 2) return !!preferredMood;
    if (s === 3) return !!preferredGenre;
    if (s === 4) return !!preferredStyle;
    return true;
  };
  const canSubmit = true;

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
    <div className="min-h-screen bg-[#0F0F0F] pb-24">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-b from-violet-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="relative px-6 pt-14 pb-10 text-center">
          <motion.div
            initial={{ scale: 0.88 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 14 }}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600/20 px-4 py-1.5 text-violet-400 text-sm font-medium mb-5"
          >
            <IoSparkles className="w-4 h-4" />
            AI-powered · Semantic matching
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white">Find your perfect movie</h1>
          <p className="mt-3 text-gray-400 max-w-xl mx-auto text-base">
            5 focused steps — our AI semantically matches your profile across {">"}9,000 films.
          </p>
          {/* LLM provider choice: Ollama, Claude, or Gemini */}
          <div className="mt-5 flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500">Explanations by</span>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
              <motion.button
                type="button"
                onClick={() => handleLlmProviderChange("ollama")}
                disabled={llmProviderSwitching}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  llmProvider === "ollama"
                    ? "bg-violet-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Ollama (local)
              </motion.button>
              <motion.button
                type="button"
                onClick={() => handleLlmProviderChange("anthropic")}
                disabled={llmProviderSwitching || !anthropicConfigured}
                whileHover={anthropicConfigured ? { scale: 1.02 } : {}}
                whileTap={anthropicConfigured ? { scale: 0.98 } : {}}
                title={!anthropicConfigured ? "Set ANTHROPIC_API_KEY in backend .env and restart" : undefined}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  llmProvider === "anthropic"
                    ? "bg-violet-600 text-white"
                    : !anthropicConfigured
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Claude
              </motion.button>
              <motion.button
                type="button"
                onClick={() => handleLlmProviderChange("gemini")}
                disabled={llmProviderSwitching || !geminiConfigured}
                whileHover={geminiConfigured ? { scale: 1.02 } : {}}
                whileTap={geminiConfigured ? { scale: 0.98 } : {}}
                title={!geminiConfigured ? "Set GEMINI_API_KEY in backend .env or in Settings" : undefined}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  llmProvider === "gemini"
                    ? "bg-violet-600 text-white"
                    : !geminiConfigured
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Gemini
              </motion.button>
            </div>
            {(!anthropicConfigured || !geminiConfigured) && (
              <p className="text-[10px] text-gray-600 max-w-sm">
                To use Claude or Gemini: set API keys in backend .env or in Settings, then you can switch between all three (Ollama, Claude, Gemini) here.
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── History: past generations ────────────────────────────────────── */}
      {!submitted && (
        <div className="w-full px-6 lg:px-12 xl:px-20 max-w-screen-2xl mx-auto mb-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IoTimeOutline className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Past generations</span>
              </div>
              <button
                type="button"
                onClick={loadHistory}
                disabled={historyLoading}
                className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50"
              >
                {historyLoading ? "Loading…" : "Refresh"}
              </button>
            </div>
            {historyEntries.length === 0 ? (
              <p className="text-xs text-gray-500">No past generations yet. Your recommendations will appear here.</p>
            ) : (
              <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                {historyEntries.map((entry) => (
                  <li key={entry.id}>
                    <motion.button
                      type="button"
                      whileHover={{ x: 4 }}
                      onClick={() => handleViewHistoryEntry(entry)}
                      className="w-full text-left rounded-lg border border-white/5 hover:border-violet-500/30 px-3 py-2 text-xs transition bg-white/5 hover:bg-violet-500/5"
                    >
                      <span className="text-gray-500 font-mono">{new Date(entry.created_at).toLocaleString()}</span>
                      <span className="block truncate text-gray-300 mt-0.5">{entry.summary}</span>
                    </motion.button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── Wizard (hidden when submitted) ───────────────────────────────── */}
      {!submitted && (
        <div className="w-full px-6 lg:px-12 xl:px-20 max-w-screen-2xl mx-auto">
          <StepIndicator current={step} total={5} />

          <AnimatePresence mode="wait">

            {/* ── STEP 1 · Your Story ─────────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }} className="space-y-6">
                <div>
                  <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-1">Step 1 of 5</p>
                  <h2 className="text-xl font-bold text-white mb-1">Your story</h2>
                  <p className="text-sm text-gray-500">Describe in your own words what you want to watch. This becomes your <code className="text-violet-300 bg-violet-500/10 px-1 rounded text-xs">desc_embedding</code> — one of four semantic axes.</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">Sample descriptions — click to prefill, then tweak</p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_DESCRIPTIONS.map((sample) => (
                      <motion.button
                        key={sample.label}
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setDescription(sample.text)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left text-sm text-gray-300 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      >
                        <span className="text-base leading-none">{sample.emoji}</span>
                        <span>{sample.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Free-text description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="e.g. Something dark and atmospheric with a psychological twist. I enjoy slow burns that leave me thinking for days..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 text-sm leading-relaxed focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none transition"
                  />
                  <div className="flex justify-between mt-1.5">
                    <p className="text-xs text-gray-600">
                      {description.length < 20
                        ? "Short? The AI will automatically enrich your description via LLM before embedding."
                        : description.length < 80
                        ? "Good — adding more context improves semantic precision."
                        : "Excellent — rich descriptions produce the most accurate matches."}
                    </p>
                    <span className="text-xs text-gray-600 font-mono shrink-0 ml-4">{description.length} chars</span>
                  </div>
                </div>

                {/* One-click presets: compact, below description */}
                {presets.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mr-1 shrink-0">One-click:</span>
                    {presets.map((preset) => {
                      const moodCfg = MOOD_CONFIG[preset.preferred_mood?.toLowerCase()] ?? { emoji: "🎬", accent: "#8b5cf6" };
                      return (
                        <motion.button
                          key={preset.id}
                          type="button"
                          disabled={loading}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handlePresetClick(preset)}
                          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white transition focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50 disabled:pointer-events-none"
                          title={preset.description}
                        >
                          <span className="leading-none">{moodCfg.emoji}</span>
                          <span className="truncate max-w-[100px]">{preset.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* AI enrichment note */}
                <div className="rounded-xl border border-violet-500/15 p-4" style={{ backgroundColor: "rgba(139,92,246,0.06)" }}>
                  <p className="text-xs font-mono text-violet-400 mb-1">How this is used</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Your text is passed through <span className="text-violet-300">sentence-transformers/all-MiniLM-L6-v2</span> to produce a 384-dim dense vector. This vector is compared against each film&apos;s pre-computed <code className="text-violet-300 bg-violet-500/10 px-1 rounded">desc_block</code> embedding via cosine similarity — with a strong base contribution in the final coverage score.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2 · Mood ────────────────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }} className="space-y-3">
                <div>
                  <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-1">Step 2 of 5</p>
                  <h2 className="text-xl font-bold text-white mb-0.5">The mood</h2>
                  <p className="text-xs text-gray-500">How do you want to <em>feel</em> while watching? Scored independently from genre — a thriller can be <span className="text-amber-400">dark</span> or <span className="text-green-400">hopeful</span>.</p>
                </div>

                {!options ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent" />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-400">Select one mood</span>
                      {!preferredMood
                        ? <span className="text-xs text-red-400 font-mono">required to continue</span>
                        : <span className="text-xs text-green-400 font-mono">✓ {preferredMood}</span>
                      }
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {options.moods.map((mood) => (
                        <MoodCard key={mood} mood={mood} selected={preferredMood.toLowerCase() === mood.toLowerCase()} onClick={() => setPreferredMood(mood)} />
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] font-mono text-gray-600">
                      mood_embedding → cosine_sim → <span className="text-violet-400">dynamic weight from Mood intensity slider</span>
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 3 · Genre ───────────────────────────────────────────── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }} className="space-y-3">
                <div>
                  <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-1">Step 3 of 5</p>
                  <h2 className="text-xl font-bold text-white mb-0.5">The genre</h2>
                  <p className="text-xs text-gray-500">Narrative category — forms the <code className="text-blue-300 bg-blue-500/10 px-1 rounded">theme_block</code> embedding (dynamic weight from slider), distinct from your <span className="text-amber-300">{preferredMood || "mood"}</span> axis.</p>
                </div>

                {!options ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent" />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-400">Select one genre</span>
                      {!preferredGenre
                        ? <span className="text-xs text-red-400 font-mono">required to continue</span>
                        : <span className="text-xs text-green-400 font-mono">✓ {preferredGenre}</span>
                      }
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {options.genres.map((genre) => (
                        <GenreCard key={genre} genre={genre} selected={preferredGenre.toLowerCase() === genre.toLowerCase()} onClick={() => setPreferredGenre(genre)} />
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] font-mono text-gray-600">
                      theme_embedding → cosine_sim → <span className="text-blue-400">dynamic weight from Theme interest slider</span>
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 4 · Style & Era ─────────────────────────────────────── */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }} className="space-y-3">
                <div>
                  <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-1">Step 4 of 5</p>
                  <h2 className="text-xl font-bold text-white mb-0.5">Style &amp; Era</h2>
                  <p className="text-xs text-gray-500">How is the story told — forms <code className="text-emerald-300 bg-emerald-500/10 px-1 rounded">style_block</code> embedding (dynamic weight from slider). Era &amp; director refine the profile.</p>
                </div>

                {!options ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent" />
                  </div>
                ) : (
                  <>
                    {/* Style cards */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">Narrative style</span>
                        {!preferredStyle
                          ? <span className="text-xs text-red-400 font-mono">required</span>
                          : <span className="text-xs text-green-400 font-mono">✓ {preferredStyle}</span>
                        }
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {options.styles.map((style) => (
                          <StyleCard key={style} style={style} selected={preferredStyle.toLowerCase() === style.toLowerCase()} onClick={() => setPreferredStyle(style)} />
                        ))}
                      </div>
                    </div>

                    {/* Era */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">
                        Time era <span className="text-gray-600 font-normal">(optional)</span>
                      </label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {ERA_OPTIONS.map((era) => (
                          <motion.button
                            key={era.value}
                            type="button"
                            onClick={() => setPreferredEra(preferredEra === era.value ? "" : era.value)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex flex-col items-center gap-0.5 rounded-xl border-2 py-2 px-2 transition-all"
                            style={{
                              borderColor: preferredEra === era.value ? "#8b5cf6" : "rgba(255,255,255,0.08)",
                              backgroundColor: preferredEra === era.value ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.02)",
                            }}
                          >
                            <span className="text-xs font-bold" style={{ color: preferredEra === era.value ? "#c4b5fd" : "#d4d4d8" }}>{era.label}</span>
                            <span className="text-[9px]" style={{ color: preferredEra === era.value ? "#a78bfa" : "#52525b" }}>{era.sub}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Director */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Preferred director <span className="text-gray-600 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={preferredDirector}
                        onChange={(e) => setPreferredDirector(e.target.value)}
                        placeholder="e.g. Christopher Nolan, Denis Villeneuve, David Fincher"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-600 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ── STEP 5 · Fine-tune ────────────────────────────────────────── */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }} className="space-y-4">
                <div>
                  <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-1">Step 5 of 5</p>
                  <h2 className="text-xl font-bold text-white mb-1">Fine-tune the weights</h2>
                  <p className="text-xs text-gray-500">Adjust how strongly each semantic dimension influences your results.</p>
                </div>

                {/* Intensity selectors */}
                <div className="rounded-2xl border border-white/10 p-4 space-y-3" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-200">Dimension intensity</p>
                    <span className="text-[10px] font-mono text-gray-600">modulates cosine_sim per axis</span>
                  </div>
                  <IntensitySelector
                    label="Mood intensity"
                    value={moodIntensity}
                    onChange={setMoodIntensity}
                  />
                  <IntensitySelector
                    label="Theme interest"
                    value={themeInterest}
                    onChange={setThemeInterest}
                  />
                  <IntensitySelector
                    label="Style interest"
                    value={styleInterest}
                    onChange={setStyleInterest}
                  />
                </div>

                {/* Full selection summary */}
                <div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Full profile summary</p>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    {[
                      { label: "Mood",     val: preferredMood,   dim: toPct(scoreWeights.mood), color: "#8b5cf6" },
                      { label: "Genre",    val: preferredGenre,  dim: toPct(scoreWeights.theme), color: "#3b82f6" },
                      { label: "Style",    val: preferredStyle,  dim: toPct(scoreWeights.style), color: "#10b981" },
                      { label: "Desc",     val: description ? `"${description.slice(0,30)}${description.length>30?"…":""}"` : "— (will be enriched)", dim: toPct(scoreWeights.description), color: "#f59e0b" },
                      { label: "Era",      val: preferredEra || "any",    dim: "",    color: "#6b7280" },
                      { label: "Director", val: preferredDirector || "any", dim: "",  color: "#6b7280" },
                      { label: "Recency",  val: "time-based tiebreaker", dim: toPct(scoreWeights.recency), color: "#6b7280" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 border border-white/5" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                        <span className="font-mono text-[9px] mt-0.5 shrink-0 w-11" style={{ color: r.color }}>{r.label}{r.dim && <span className="text-gray-600 ml-1">{r.dim}</span>}</span>
                        <span className="text-gray-300 truncate">{r.val || <span className="text-gray-600 italic">not set</span>}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-gray-600 bg-black/30 rounded-lg px-3 py-1.5">
                    score = wMood×mood_sim + wTheme×theme_sim + wStyle×style_sim + wDesc×desc_sim + wRecency×recency
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className={`flex gap-3 ${step === 5 ? "mt-5" : "mt-8"}`}>
            {step > 1 && (
              <motion.button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition"
              >
                <IoArrowBack className="w-4 h-4" />
                Back
              </motion.button>
            )}
            {step < 5 ? (
              <motion.button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue(step)}
                whileHover={{ scale: !canContinue(step) ? 1 : 1.02 }}
                whileTap={{ scale: !canContinue(step) ? 1 : 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white hover:bg-violet-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <IoArrowForward className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white hover:bg-violet-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                    />
                    Matching movies...
                  </>
                ) : (
                  <>
                    <IoSparkles className="w-4 h-4" />
                    Get my recommendations
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* ── Submitted: compact preference summary bar ─────────────────────── */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-7xl px-4 sm:px-6 mb-8"
        >
          <div
            className="rounded-2xl border border-white/10 p-4 flex flex-wrap items-center gap-3"
            style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            {viewingHistoryId && (
              <span className="rounded-full bg-sky-500/15 text-sky-300 px-3 py-1 text-xs font-medium">
                Viewing past generation
              </span>
            )}
            {lastPresetLabel && !viewingHistoryId && (
              <span className="rounded-full bg-amber-500/15 text-amber-300 px-3 py-1 text-xs font-medium">
                Quick pick: {lastPresetLabel}
              </span>
            )}
            <div className="flex flex-wrap gap-2 flex-1 min-w-0 text-xs">
              {preferredMood && (
                <span className="rounded-full bg-violet-500/15 text-violet-300 px-3 py-1">{preferredMood}</span>
              )}
              {preferredGenre && (
                <span className="rounded-full bg-blue-500/15 text-blue-300 px-3 py-1">{preferredGenre}</span>
              )}
              {preferredStyle && (
                <span className="rounded-full bg-emerald-500/15 text-emerald-300 px-3 py-1">{preferredStyle}</span>
              )}
              {preferredEra && (
                <span className="rounded-full bg-white/10 text-gray-300 px-3 py-1">{preferredEra}</span>
              )}
              {description && (
                <span className="text-gray-500 italic truncate max-w-[200px]">
                  &ldquo;{description.length > 50 ? description.slice(0, 50) + "…" : description}&rdquo;
                </span>
              )}
            </div>
            <motion.button
              type="button"
              onClick={() => router.push("/history")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="shrink-0 flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-200 border border-sky-500/30 rounded-lg px-3 py-1.5 transition"
            >
              <IoTimeOutline className="w-3.5 h-3.5" />
              View history
            </motion.button>
            <motion.button
              type="button"
              onClick={resetForm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="shrink-0 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 rounded-lg px-3 py-1.5 transition"
            >
              <MdAutoAwesome className="w-3.5 h-3.5" />
              Refine search
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            ref={resultsRef}
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12"
          >
            {recommendations.length > 0 ? (
              (() => {
                const parsed = parseExplanation(explanation ?? "");
                const hasStructured = parsed.overview.length > 0 || parsed.films.length > 0;
                const providerLabel =
                  (llmProviderFromResponse ?? llmProvider) === "anthropic" ? "Claude" :
                  (llmProviderFromResponse ?? llmProvider) === "gemini" ? "Gemini" : "Ollama";

                return (
                  <div className="space-y-8">
                    {/* ── AI-enriched description banner ─────────────────────────── */}
                    {descriptionEnriched && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-2xl border border-amber-500/20 bg-amber-950/20 px-5 py-4 flex items-start gap-2.5"
                      >
                        <IoSparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-300">
                          Your description was short, so our AI enriched it automatically for better semantic matching.
                        </p>
                      </motion.div>
                    )}

                    {/* ── SECTION 1: Full-width AI context ───────────────────────── */}
                    {(cinephileProfile || explanation) && (
                      <div className="grid grid-cols-1 gap-5">
                        {cinephileProfile && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 px-8 pt-6 pb-8"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <HiOutlineUser className="w-4 h-4 text-emerald-400 shrink-0" />
                              <h3 className="text-sm font-semibold text-white">Your cinephile profile</h3>
                            </div>
                            <div className="h-px w-full bg-emerald-500/15 my-4" />
                            <p className="text-gray-300 text-base leading-relaxed">{cinephileProfile}</p>
                          </motion.div>
                        )}

                        {explanation && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 }}
                            className="rounded-2xl border border-violet-500/20 bg-violet-950/20 px-8 pt-6 pb-8"
                          >
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <HiOutlineLightBulb className="w-4 h-4 text-violet-400 shrink-0" />
                              <h3 className="text-sm font-semibold text-white">Why these movies?</h3>
                              {(llmProviderFromResponse ?? llmProvider) && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                                  Powered by {providerLabel}
                                </span>
                              )}
                            </div>
                            <div className="h-px w-full bg-violet-500/15 my-4" />
                            {hasStructured ? (
                              <p className="text-gray-300 text-base leading-relaxed">{parsed.overview}</p>
                            ) : (
                              <p className="text-gray-300 text-base leading-relaxed">{explanation}</p>
                            )}
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Refine suggestion — full width */}
                    {hasStructured && parsed.refine && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-2xl border border-sky-500/20 bg-sky-950/15 px-6 py-4 flex items-start gap-3"
                      >
                        <IoSparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest mr-2">Refine tip</span>
                          <span className="text-sm text-gray-300">{parsed.refine}</span>
                        </div>
                      </motion.div>
                    )}

                    {/* ── SECTION 2: Full-width comparative analysis ──────────────── */}
                    {recommendations.length > 1 && (
                      <div className="space-y-3">
                        <div className="px-1">
                          <h2 className="text-lg font-semibold text-white">Comparative analysis</h2>
                          <p className="text-xs text-gray-500">Inspect score differences before reading each recommendation card.</p>
                        </div>
                        <ComparisonPanel movies={recommendations} scoreWeights={scoreWeights} />
                      </div>
                    )}

                    {/* ── SECTION 3: Full-width movie cards ──────────────────────── */}
                    <div className="w-full space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                          <MdAutoAwesome className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">Your picks</h2>
                          <p className="text-xs text-gray-500">
                            {recommendations.length} movie{recommendations.length !== 1 ? "s" : ""} matched semantically to your profile
                          </p>
                        </div>
                      </div>

                      <div className="w-full space-y-7">
                        {recommendations.map((m, i) => (
                          <RecommendationCard
                            key={m.film_id}
                            movie={m}
                            rank={i + 1}
                            onDetails={() => openModal(m.film_id)}
                            filmInsight={resolveFilmInsight(m, i, parsed)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Scoring formula — full width footer */}
                    <div className="pt-1">
                      <ScoringFormula scoreWeights={scoreWeights} />
                    </div>
                  </div>
                );
              })()
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full py-16 px-6 sm:px-8 rounded-2xl border border-white/10 bg-zinc-900/50 text-center"
              >
                <IoSadOutline className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-white">Couldn&apos;t find recommendations</h2>
                <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">{explanation}</p>
                <motion.button
                  type="button"
                  onClick={resetForm}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-6 text-sm text-violet-400 hover:text-violet-300 transition underline-offset-2 hover:underline"
                >
                  Try again with different preferences
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <MovieModal movie={modalMovie} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
