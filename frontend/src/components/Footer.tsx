"use client";

import Link from "next/link";
import { IoSparkles } from "react-icons/io5";

const STACK_ITEMS = [
  { label: "FastAPI",               color: "#10b981", note: "REST backend · Python 3.11" },
  { label: "sentence-transformers", color: "#3b82f6", note: "Semantic encoding" },
  { label: "all-MiniLM-L6-v2",     color: "#8b5cf6", note: "384-dim dense embeddings" },
  { label: "scikit-learn",          color: "#f59e0b", note: "cosine_similarity" },
  { label: "Generative AI (LLM)",   color: "#ec4899", note: "Enrichment · explanation · cinephile profile" },
  { label: "Next.js 16 + Tailwind", color: "#64748b", note: "React frontend" },
  { label: "RadarChart",            color: "#8b5cf6", note: "SVG score visualisation" },
];

const SCORE_WEIGHTS = [
  { label: "Mood",        range: "11–27%", visualPct: 27, color: "#8b5cf6" },
  { label: "Theme",       range: "11–27%", visualPct: 27, color: "#3b82f6" },
  { label: "Style",       range: "10–26%", visualPct: 26, color: "#10b981" },
  { label: "Description", range: "34–52%", visualPct: 52, color: "#f59e0b" },
  { label: "Recency",     range: "5% fixed",  visualPct: 5, color: "#6b7280" },
];

export function Footer() {
  return (
    <footer
      className="border-t border-white/5 pt-12 pb-8 px-6 sm:px-10 md:px-14"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Top grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">

          {/* Brand col */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
              >
                <IoSparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">CineMatch</span>
              <span className="text-xs font-mono text-gray-600">Movies</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4 max-w-xs">
              AI-powered semantic movie recommendations: hybrid questionnaire (era, director), SBERT embeddings, dynamic slider-driven scoring, short-text enrichment, cinephile profile, and radar chart visualisation.
            </p>
            {/* Status */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400">API Online</span>
              <span className="text-gray-700">·</span>
              <span className="text-gray-600">v1.0.0-beta</span>
            </div>
          </div>

          {/* Scoring weights */}
          <div>
            <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Scoring weights
            </p>
            <div className="space-y-2.5">
              {SCORE_WEIGHTS.map((w) => (
                <div key={w.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-24 shrink-0">{w.label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${w.visualPct}%`, backgroundColor: w.color }}
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold w-14 text-right" style={{ color: w.color }}>
                    {w.range}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] font-mono text-gray-600 bg-black/30 rounded-lg px-3 py-2">
              score = dynamic Σ wᵢ · cosine_sim(uᵢ, mᵢ) + 0.05 · recency
            </p>
          </div>

          {/* Tech stack */}
          <div>
            <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Technology stack
            </p>
            <div className="space-y-2">
              {STACK_ITEMS.map((t) => (
                <div key={t.label} className="flex items-start gap-2.5">
                  <span
                    className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <div>
                    <span className="text-xs font-mono font-semibold" style={{ color: t.color }}>{t.label}</span>
                    <span className="text-[11px] text-gray-600 ml-1.5">{t.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-6 text-xs text-gray-600">
            <Link href="/" className="hover:text-gray-400 transition">Home</Link>
            <Link href="/recommend" className="hover:text-gray-400 transition">Recommend</Link>
            <Link href="/how-it-works" className="hover:text-gray-400 transition">How it works</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">
              GitHub
            </a>
          </div>
          <p className="text-[11px] font-mono text-gray-700 text-center">
            CineMatch · Semantic Movie Intelligence · EFREI M1 GenAI Project · 2025–2026
          </p>
        </div>
      </div>
    </footer>
  );
}
