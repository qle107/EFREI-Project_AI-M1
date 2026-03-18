"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { IoSparkles } from "react-icons/io5";
import { HiOutlineArrowRight, HiOutlineCpuChip, HiOutlineBeaker } from "react-icons/hi2";
import { MdAccountTree } from "react-icons/md";
import { useAuth } from "@/lib/auth-context";
import { HeroBanner } from "@/components/HeroBanner";
import { CarouselRow } from "@/components/CarouselRow";
import { MovieModal } from "@/components/MovieModal";
import { listMovies, getMovie } from "@/lib/api";
import type { MovieListItem, MovieDetail } from "@/lib/api";

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    n: "01",
    icon: "👤",
    title: "Hybrid Questionnaire",
    body: "Free text, mood/genre/style chips, Likert sliders (1–5), plus guided questions: preferred era (e.g. 2010s) and director. All feed into four semantic blocks.",
    tech: "4-axis profile · era · director",
    color: "#8b5cf6",
  },
  {
    n: "02",
    icon: "🔢",
    title: "Sentence Embedding",
    body: "Each block is independently encoded into a 384-dimensional dense vector using sentence-transformers/all-MiniLM-L6-v2.",
    tech: "all-MiniLM-L6-v2 · 384 dims",
    color: "#3b82f6",
  },
  {
    n: "03",
    icon: "📐",
    title: "Cosine Similarity Scoring",
    body: "User embeddings are compared against 9,841 pre-computed movie embeddings via cosine similarity, producing 4 dimension scores.",
    tech: "cosine_similarity(u, M) · 9,841 films",
    color: "#10b981",
  },
  {
    n: "04",
    icon: "⚖️",
    title: "Weighted Coverage Score",
    body: "Dimension scores are aggregated with dynamic weights: Mood/Theme/Style are driven by sliders, Description keeps a strong base, and Recency remains a 5% tiebreaker.",
    tech: "dynamic Σ wᵢ · scoreᵢ + 0.05·recency",
    color: "#f59e0b",
  },
  {
    n: "05",
    icon: "✨",
    title: "GenAI Layer",
    body: "Short descriptions (< 5 words) are enriched by the LLM before encoding. Top 3 results get an explanation plus a 2-sentence cinephile profile. Radar charts visualise per-axis scores.",
    tech: "enrichment · explanation · cinephile profile · radar viz",
    color: "#ec4899",
  },
];

const TECH_STACK = [
  { label: "FastAPI",              sublabel: "Python REST backend",      color: "#10b981" },
  { label: "sentence-transformers",sublabel: "Semantic embeddings",      color: "#3b82f6" },
  { label: "all-MiniLM-L6-v2",    sublabel: "Embedding model",          color: "#8b5cf6" },
  { label: "scikit-learn",         sublabel: "Cosine similarity",         color: "#f59e0b" },
  { label: "LLM (Ollama)",         sublabel: "Enrichment · explanation · cinephile profile", color: "#ec4899" },
  { label: "Next.js 16",           sublabel: "React frontend",           color: "#64748b" },
  { label: "Tailwind CSS v4",      sublabel: "Styling",                  color: "#0ea5e9" },
  { label: "Radar charts",         sublabel: "SVG score visualisation",   color: "#8b5cf6" },
];

// ─── SCORE FORMULA CARD ───────────────────────────────────────────────────────

function ScoreFormulaCard() {
  return (
    <div
      className="rounded-2xl border border-violet-500/20 p-6 relative overflow-hidden"
      style={{ backgroundColor: "rgba(139,92,246,0.04)" }}
    >
      {/* bg decoration */}
      <div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 blur-2xl"
        style={{ backgroundColor: "#8b5cf6" }}
      />
      <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
                    <MdAccountTree className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">Scoring Formula</span>
        </div>
        <p
          className="text-sm font-mono text-violet-300 rounded-lg px-4 py-3 border border-violet-500/15 leading-relaxed"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          coverage_score =<br />
          &nbsp;&nbsp;w_mood × <span className="text-purple-300">mood_sim</span> +<br />
          &nbsp;&nbsp;w_theme × <span className="text-blue-300">theme_sim</span> +<br />
          &nbsp;&nbsp;w_style × <span className="text-emerald-300">style_sim</span> +<br />
          &nbsp;&nbsp;w_desc × <span className="text-amber-300">desc_sim</span> +<br />
          &nbsp;&nbsp;0.05 × <span className="text-gray-400">recency_bonus</span>
        </p>
        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
          Where each <code className="text-violet-300 bg-violet-500/10 px-1 rounded">*_sim</code> is cosine similarity between your profile embedding and the movie embedding. Mood/Theme/Style weights are slider-driven, while Description keeps a strong baseline.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN HOME PAGE ───────────────────────────────────────────────────────────

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [featured, setFeatured] = useState<MovieDetail | null>(null);
  const [featuredPair, setFeaturedPair] = useState<MovieDetail[]>([]);
  const [recommended, setRecommended] = useState<MovieListItem[]>([]);
  const [trending, setTrending] = useState<MovieListItem[]>([]);
  const [becauseYouLiked, setBecauseYouLiked] = useState<MovieListItem[]>([]);
  const [modalMovie, setModalMovie] = useState<MovieDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const [all, mood, genre] = await Promise.all([
          listMovies({ limit: 20, skip: 0 }),
          listMovies({ limit: 12, mood: "dark" }),
          listMovies({ limit: 12, genre: "science fiction" }),
        ]);

        const items = all.items;
        setRecommended(items.slice(0, 12));
        setTrending(items.slice(4, 16));
        setBecauseYouLiked(mood.items.length >= 6 ? mood.items : genre.items);

        if (items.length > 0) {
          // Random featured movie for hero banner (different on every refresh)
          const featuredIdx = Math.floor(Math.random() * items.length);
          const detail = await getMovie(items[featuredIdx].film_id);
          setFeatured(detail);

          // Two random movies for the poster pair (distinct from each other and preferably from pool)
          const pool = [...items];
          const shuffle = <T,>(arr: T[]) => {
            const out = [...arr];
            for (let i = out.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [out[i], out[j]] = [out[j], out[i]];
            }
            return out;
          };
          const shuffled = shuffle(pool);
          const pair = shuffled.slice(0, 2);
          const pairDetails = await Promise.all(pair.map((m) => getMovie(m.film_id)));
          setFeaturedPair(pairDetails);
        }
      } catch {
        const mock: MovieListItem = {
          film_id: 0,
          title: "Sample Movie",
          mood: "drama",
          theme: "drama",
          narrative_style: "drama",
          emotional_tone: "drama",
          poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800",
          vote_average: 7.5,
        };
        setFeatured({ ...mock, description: "", overview: "A compelling story awaits.", release_date: "2024" });
        const mock2 = { ...mock, film_id: 1, title: "Another Movie" };
        setFeaturedPair([
          { ...mock, description: "", overview: "Story 1", release_date: "2023" },
          { ...mock2, description: "", overview: "Story 2", release_date: "2024" },
        ]);
        setRecommended(Array(8).fill(mock).map((m, i) => ({ ...m, film_id: i, title: `Movie ${i + 1}` })));
        setTrending(Array(8).fill(mock).map((m, i) => ({ ...m, film_id: i + 10, title: `Trending ${i + 1}` })));
        setBecauseYouLiked(Array(6).fill(mock).map((m, i) => ({ ...m, film_id: i + 20, title: `Sample ${i + 1}` })));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const openModal = async (filmId: number) => {
    try {
      const m = await getMovie(filmId);
      setModalMovie(m);
      setModalOpen(true);
    } catch {
      setModalMovie(null);
    }
  };

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
    <div className="min-h-screen bg-[#080810]">

      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      {!loading && (
        <HeroBanner
          title={featured?.title ?? "Discover Your Next Favorite"}
          overview={featured?.overview}
          posterUrl={featured?.poster_url}
          backdropUrl={featured?.poster_url}
          onInfo={() => featured && openModal(featured.film_id)}
        />
      )}

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border-b border-white/5"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-10 py-3 flex flex-wrap items-center gap-x-8 gap-y-2">
          {[
            { val: "9,841", label: "films indexed" },
            { val: "384D",  label: "embedding dims" },
            { val: "4-axis",label: "semantic scoring" },
            { val: "MiniLM-L6-v2", label: "embedding model" },
            { val: "LLM",   label: "explanation engine" },
          ].map((s) => (
            <div key={s.val} className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono text-violet-400">{s.val}</span>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400">LIVE</span>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent"
          />
        </div>
      ) : (
        <>
          {/* ── AI-powered CTA section ─────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full px-6 py-16 sm:px-10 md:px-14"
          >
            <div className="mx-auto max-w-7xl grid md:grid-cols-[1.1fr_1fr] gap-12 md:gap-16 items-center">
              {/* Left: two movie posters */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex justify-center gap-6 md:gap-8"
              >
                {featuredPair.slice(0, 2).map((movie) => (
                  <button
                    key={movie.film_id}
                    onClick={() => openModal(movie.film_id)}
                    className="flex-1 max-w-[220px] md:max-w-[260px] rounded-2xl overflow-hidden shadow-xl hover:ring-2 ring-violet-500/50 transition"
                  >
                    <div className="relative aspect-2/3 bg-zinc-800">
                      {movie.poster_url ? (
                        <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-700" />
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>

              {/* Right: pitch */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-center md:text-left"
              >
                <p className="text-violet-400 font-mono text-xs tracking-widest uppercase mb-3">
                  Generative AI · Semantic Retrieval
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Not sure what to watch?
                </h2>
                <p className="text-gray-400 text-base leading-relaxed mb-5">
                  Tell us your mood, genre, style, era and director. Our pipeline encodes your preferences into semantic vectors, computes cosine similarity against 9,841 films, and an LLM explains why each result was chosen — plus a short cinephile profile. Results include radar charts per movie.
                </p>

                {/* Mini tech flow */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono mb-7 text-gray-500">
                  <span className="text-violet-400">profile</span>
                  <span>→</span>
                  <span className="text-blue-400">embed</span>
                  <span>→</span>
                  <span className="text-emerald-400">cosine_sim</span>
                  <span>→</span>
                  <span className="text-amber-400">rank</span>
                  <span>→</span>
                  <span className="text-pink-400">llm_explain</span>
                </div>

                <Link href="/recommend">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-semibold text-white shadow-lg transition text-sm"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 30px rgba(124,58,237,0.25)" }}
                  >
                    <IoSparkles className="w-4 h-4" />
                    Get AI Recommendations
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </motion.span>
                </Link>
              </motion.div>
            </div>
          </motion.section>

          {/* ── Carousels ──────────────────────────────────────────────── */}
          <div className="w-full mx-auto max-w-7xl px-6 sm:px-10 md:px-14 mt-2">
            <CarouselRow title="Recommended for you" movies={recommended} onMovieClick={openModal} direction="left" />
            <CarouselRow title="Trending now" movies={trending} onMovieClick={openModal} direction="right" />
            <CarouselRow title="Dark & atmospheric" movies={becauseYouLiked} onMovieClick={openModal} direction="left" />
          </div>

          {/* ── How It Works ───────────────────────────────────────────── */}
          <section className="w-full px-6 sm:px-10 md:px-14 py-20 mt-8 border-t border-white/5"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
            <div className="mx-auto max-w-7xl">

              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-14"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 mb-4">
                  <HiOutlineBeaker className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-mono text-violet-400 uppercase tracking-widest">AI Architecture</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">How the AI works</h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-base leading-relaxed">
                  CineMatch uses a multi-stage semantic retrieval pipeline. Your hybrid questionnaire (free text, chips, sliders, era, director) is embedded into a shared vector space with {">"}9,800 films. Short descriptions are enriched by GenAI. Results show radar charts and a cinephile profile.
                </p>
              </motion.div>

              {/* Pipeline grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-14">
                {PIPELINE_STEPS.map((step, i) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="relative rounded-2xl border border-white/8 p-5 flex flex-col gap-3 overflow-hidden"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                  >
                    {/* Connector arrow */}
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-gray-600 text-lg">›</div>
                    )}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                      style={{ backgroundColor: `${step.color}20`, border: `1px solid ${step.color}30` }}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <div
                        className="text-[10px] font-mono font-bold uppercase tracking-widest mb-1"
                        style={{ color: step.color }}
                      >
                        {step.n}
                      </div>
                      <h3 className="text-sm font-semibold text-white leading-tight mb-2">{step.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{step.body}</p>
                    </div>
                    <div
                      className="mt-auto rounded-lg px-2.5 py-1.5 text-[10px] font-mono"
                      style={{ backgroundColor: `${step.color}10`, color: step.color }}
                    >
                      {step.tech}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom: formula + tech stack */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Score formula */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <ScoreFormulaCard />
                </motion.div>

                {/* Tech stack */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="rounded-2xl border border-white/8 p-6"
                  style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <HiOutlineCpuChip className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-white">Technology Stack</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {TECH_STACK.map((t) => (
                      <div
                        key={t.label}
                        className="rounded-xl border border-white/6 px-3 py-2.5"
                        style={{ backgroundColor: `${t.color}08` }}
                      >
                        <p className="text-xs font-semibold font-mono" style={{ color: t.color }}>{t.label}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{t.sublabel}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        </>
      )}

      <MovieModal movie={modalMovie} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
