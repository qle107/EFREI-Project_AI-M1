"use client";

import { motion } from "framer-motion";
import { IoSparkles } from "react-icons/io5";
import {
  HiOutlineCircleStack,
  HiOutlineCpuChip,
  HiOutlineBeaker,
  HiOutlineChatBubbleLeft,
  HiOutlineArrowPath,
  HiOutlineUserCircle,
} from "react-icons/hi2";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const OFFLINE_STEPS = [
  {
    n: "01",
    icon: HiOutlineCircleStack,
    color: "#f59e0b",
    title: "Data Preprocessing",
    file: "src/preprocessing/block_builder.py",
    body: "The raw movie CSV (9,841 films) is processed using a keyword taxonomy. For each film, the pipeline reads the Overview and Genre fields and extracts four semantic text blocks: Mood, Theme, NarrativeStyle, and Description. These blocks become the indexable units for embedding.",
    detail: [
      { label: "Input", val: "data/raw/Database.csv  (9,848 rows)" },
      { label: "Output", val: "data/processed/movies_referential.csv" },
      { label: "Fields extracted", val: "Mood · Theme · NarrativeStyle · Description" },
      { label: "Taxonomy", val: "MOOD_KEYWORDS · THEME_KEYWORDS · STYLE_KEYWORDS" },
      { label: "Fallback", val: '"neutral" when no keyword matches' },
    ],
    code: `# block_builder.py (simplified)
def extract_block(text, taxonomy):
    for label, keywords in taxonomy.items():
        for word in keywords:
            if re.search(rf"\\b{word}\\b", text):
                detected.append(label)
    return ", ".join(detected) or "neutral"

df["Mood"]  = df["Overview"].apply(lambda x: extract_block(x, MOOD_KEYWORDS))
df["Theme"] = df["Overview"].apply(lambda x: extract_block(x, THEME_KEYWORDS))`,
  },
  {
    n: "02",
    icon: HiOutlineCpuChip,
    color: "#8b5cf6",
    title: "Corpus Embedding",
    file: "src/embedding/embedding_builder.py",
    body: "Each semantic block for every film is encoded with sentence-transformers/all-MiniLM-L6-v2 into a 384-dimensional dense vector. This produces four separate embedding matrices, one per axis, which are persisted to disk as NumPy arrays. This step runs once offline — inference never re-encodes the corpus.",
    detail: [
      { label: "Model", val: "sentence-transformers/all-MiniLM-L6-v2" },
      { label: "Vector size", val: "384 dimensions (dense float32)" },
      { label: "Output files", val: "mood_embeddings.npy · theme_embeddings.npy\nstyle_embeddings.npy · desc_embeddings.npy" },
      { label: "Matrix shape", val: "9,841 × 384 per axis (4 matrices total)" },
      { label: "Stored in", val: "models/embeddings/" },
    ],
    code: `# embedding_builder.py (simplified)
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

for axis in ["Mood", "Theme", "NarrativeStyle", "Description"]:
    vectors = model.encode(df[axis].tolist(), convert_to_numpy=True)
    np.save(EMBEDDINGS_DIR / f"{axis.lower()}_embeddings.npy", vectors)
# Shape: (9841, 384) per axis`,
  },
];

const ONLINE_STEPS = [
  {
    n: "03",
    icon: HiOutlineUserCircle,
    color: "#3b82f6",
    title: "User Profile Encoding",
    file: "src/user_profile/profile_encoder.py",
    body: "At request time, the user's questionnaire is translated into four natural-language text blocks using structured templates. Each block is then encoded independently with the same SBERT model, producing a user-side 384-dim vector per semantic axis.",
    detail: [
      { label: "mood_block", val: '"The user wants a {mood} mood with intensity level {n}"' },
      { label: "theme_block", val: '"The user prefers {genre} themes with interest level {n}"' },
      { label: "style_block", val: '"The user enjoys {style} narrative pacing with interest level {n}"' },
      { label: "desc_block", val: "User description + optional era + optional director" },
      { label: "Output", val: "4 × 384-dim user vectors (one per axis)" },
    ],
    code: `# profile_encoder.py (simplified)
def build_profile_blocks(self, questionnaire):
    return {
        "mood":  f"The user wants a {questionnaire.preferred_mood} mood "
                 f"with intensity level {questionnaire.mood_intensity}",
        "theme": f"The user prefers {questionnaire.preferred_genre} themes "
                 f"with interest level {questionnaire.theme_interest}",
        "style": f"The user enjoys {questionnaire.preferred_style} narrative pacing "
                 f"with interest level {questionnaire.style_interest}",
        "description": questionnaire.description + era_hint + director_hint,
    }`,
  },
  {
    n: "04",
    icon: HiOutlineBeaker,
    color: "#10b981",
    title: "Coverage Scoring",
    file: "src/scoring/coverage_scorer.py",
    body: "The user vectors are compared against the pre-computed corpus matrices using cosine similarity. Each axis produces a similarity array of length 9,841. Scores are min-max normalized, then aggregated with dynamic weights (mood/theme/style from sliders, strong description base, recency tiebreaker). The top 3 films by CoverageScore are returned.",
    detail: [
      { label: "Mood/Theme/Style", val: "Dynamic weights from sliders (1-5)" },
      { label: "Description", val: "Strong base priority to avoid mode domination" },
      { label: "Recency weight", val: "Fixed 0.05  →  exp(−(year_now − release_year) / 10)" },
      { label: "Normalization", val: "(sim − min) / (max − min + 1e-8)" },
      { label: "Output", val: "Top 3 films + per-axis scores" },
    ],
    code: `# coverage_scorer.py — dynamic weighted aggregation
mood_sim  = cosine_similarity([user["mood"]],  self.mood_emb)[0]
theme_sim = cosine_similarity([user["theme"]], self.theme_emb)[0]
style_sim = cosine_similarity([user["style"]], self.style_emb)[0]
desc_sim  = cosine_similarity([user["desc"]],  self.desc_emb)[0]

# min-max normalize each axis
mood_sim, theme_sim, style_sim, desc_sim = [normalize(s) for s in ...]

recency = np.exp(-(year_now - df["release_year"]) / 10)

weights = compute_axis_weights(questionnaire)  # slider-driven + strong description base
score = (
    weights["mood"]*mood_sim +
    weights["theme"]*theme_sim +
    weights["style"]*style_sim +
    weights["description"]*desc_sim +
    weights["recency"]*recency
)`,
  },
  {
    n: "05",
    icon: HiOutlineChatBubbleLeft,
    color: "#ec4899",
    title: "GenAI Layer",
    file: "src/genAi/prompt_builder.py  ·  src/genAi/llm_client.py",
    body: "If the user description has fewer than 5 words, the LLM enriches it before encoding (EF4.1). The top 3 films and per-axis scores are passed to the LLM, which produces an explanation and a 2-sentence cinephile profile. The frontend displays radar charts per movie.",
    detail: [
      { label: "Short-text enrichment", val: "< 5 words → LLM expands before embedding (EF4.1)" },
      { label: "LLM backends", val: "Ollama (local), Claude (Anthropic), Gemini (Google)" },
      { label: "Default", val: "phi3:mini via Ollama" },
      { label: "Output", val: "Explanation + CINEPHILE_PROFILE: 2-sentence profile" },
      { label: "Cache", val: "SHA-256 keyed, TTL=24h, max=200 entries" },
      { label: "Frontend viz", val: "RadarChart.tsx — SVG spider chart per movie (Mood, Theme, Style, Desc)" },
    ],
    code: `# prompt_builder.py — LLM prompt (condensed)
# If description < 5 words: build_enrichment_prompt() expands it first
prompt = (
    f"User: {questionnaire.description}\\n"
    f"Mood: {questionnaire.preferred_mood}  Genre: {questionnaire.preferred_genre}\\n"
    f"Style: {questionnaire.preferred_style}  Era: {questionnaire.preferred_era}\\n"
    f"Director: {questionnaire.preferred_director}\\n\\n"
    f"Top 3 semantic matches:\\n{movies_context}\\n\\n"
    "1. Explain why these match.  2. Highlight best axis.\\n"
    "3. Write CINEPHILE_PROFILE: <2-sentence profile>"
)`,
  },
];

const TECH_STACK = [
  { label: "Data source", val: "CSV  (9,841 films · TMDB-derived)", color: "#f59e0b" },
  { label: "Embedding model", val: "sentence-transformers/all-MiniLM-L6-v2", color: "#8b5cf6" },
  { label: "Vector dimensions", val: "384-dim dense float32 vectors", color: "#8b5cf6" },
  { label: "Similarity", val: "sklearn cosine_similarity (4 axes)", color: "#3b82f6" },
  { label: "Scoring", val: "Dynamic: sliders set mood/theme/style; description has strong base; recency fixed at 5%", color: "#10b981" },
  { label: "LLM", val: "Ollama / Claude / Gemini · short-text enrichment · cinephile profile", color: "#ec4899" },
  { label: "LLM cache", val: "SHA-256 in-memory  ·  TTL 24h  ·  200 entries", color: "#ec4899" },
  { label: "Backend API", val: "FastAPI  (Python)", color: "#22d3ee" },
  { label: "Auth", val: "JWT HS-256  ·  no database  ·  env-var credentials", color: "#64748b" },
  { label: "Frontend", val: "Next.js 16  ·  React  ·  Tailwind CSS v4  ·  RadarChart SVG", color: "#a78bfa" },
  { label: "Animations", val: "Framer Motion", color: "#a78bfa" },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function PhaseLabel({ phase, label, color }: { phase: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div
        className="text-[10px] font-mono px-2.5 py-1 rounded-full border"
        style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}
      >
        {phase}
      </div>
      <div className="h-px flex-1" style={{ backgroundColor: `${color}20` }} />
      <span className="text-xs font-mono text-gray-600">{label}</span>
    </div>
  );
}

function StepCard({
  step,
  index,
}: {
  step: typeof OFFLINE_STEPS[0] | typeof ONLINE_STEPS[0];
  index: number;
}) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="rounded-2xl border border-white/8 overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
    >
      {/* Header */}
      <div
        className="flex items-start gap-4 p-5 border-b border-white/5"
        style={{ backgroundColor: `${step.color}08` }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${step.color}15`, border: `1px solid ${step.color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: step.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono" style={{ color: step.color }}>STEP {step.n}</span>
            <span className="text-[10px] font-mono text-gray-600 truncate">{step.file}</span>
          </div>
          <h3 className="text-base font-bold text-white">{step.title}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        <p className="text-sm text-gray-400 leading-relaxed">{step.body}</p>

        {/* Detail grid */}
        <div className="grid grid-cols-1 gap-1.5">
          {step.detail.map((d) => (
            <div key={d.label} className="flex gap-3 text-xs">
              <span className="font-mono shrink-0 w-28 text-gray-600 pt-0.5">{d.label}</span>
              <span className="text-gray-300 font-mono whitespace-pre-line">{d.val}</span>
            </div>
          ))}
        </div>

        {/* Code block */}
        <div className="rounded-xl overflow-hidden border border-white/5">
          <div
            className="flex items-center gap-2 px-4 py-2 border-b border-white/5"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-[10px] font-mono text-gray-600 flex-1 text-center">
              {step.file.split("·")[0].trim()}
            </span>
          </div>
          <pre
            className="px-4 py-3 text-[11px] leading-relaxed overflow-x-auto"
            style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "#a5b4fc", tabSize: 4 }}
          >
            <code>{step.code}</code>
          </pre>
        </div>
      </div>
    </motion.div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] pb-24">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-b from-violet-950/25 via-transparent to-transparent pointer-events-none" />
        <div className="relative px-6 pt-14 pb-10 text-center max-w-7xl mx-auto">
          <motion.div
            initial={{ scale: 0.88 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 14 }}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600/20 px-4 py-1.5 text-violet-400 text-sm font-medium mb-5"
          >
            <IoSparkles className="w-4 h-4" />
            Architecture deep-dive
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            How CineMatch works
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-xl mx-auto">
            A semantic retrieval + generative AI pipeline. Two offline phases build a
            searchable movie corpus; one online inference phase matches your hybrid profile
            (free text, chips, sliders, era, director), scores films, enriches short inputs,
            and generates an explanation plus cinephile profile. Results include radar charts.
          </p>

          {/* Architecture summary badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              { label: "9,841 films", color: "#f59e0b" },
              { label: "4-axis embedding", color: "#8b5cf6" },
              { label: "hybrid questionnaire", color: "#8b5cf6" },
              { label: "cosine similarity", color: "#3b82f6" },
              { label: "dynamic slider-driven weights", color: "#10b981" },
              { label: "short-text enrichment", color: "#ec4899" },
              { label: "cinephile profile", color: "#ec4899" },
              { label: "radar charts", color: "#a78bfa" },
            ].map((b) => (
              <span
                key={b.label}
                className="text-xs font-mono px-3 py-1 rounded-full border"
                style={{ color: b.color, borderColor: `${b.color}35`, backgroundColor: `${b.color}10` }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Pipeline Overview ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/8 p-6"
          style={{ backgroundColor: "rgba(255,255,255,0.015)" }}
        >
          <p className="text-xs font-mono text-gray-500 mb-5 uppercase tracking-widest">Full pipeline overview</p>

          {/* Offline flow */}
          <div className="mb-6">
            <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-3">Offline — run once</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: "Database.csv", sub: "raw data", color: "#f59e0b" },
                { label: "→", sub: "", color: "#3f3f46" },
                { label: "block_builder", sub: "keyword → blocks", color: "#f59e0b" },
                { label: "→", sub: "", color: "#3f3f46" },
                { label: "movies_referential.csv", sub: "4 text cols", color: "#f59e0b" },
                { label: "→", sub: "", color: "#3f3f46" },
                { label: "MiniLM-L6-v2", sub: "encode 9,841 × 4", color: "#8b5cf6" },
                { label: "→", sub: "", color: "#3f3f46" },
                { label: "*.npy matrices", sub: "(9841 × 384)", color: "#8b5cf6" },
              ].map((n, i) =>
                n.label === "→" ? (
                  <span key={i} className="text-gray-700 font-mono">→</span>
                ) : (
                  <div
                    key={i}
                    className="flex flex-col items-center px-3 py-1.5 rounded-lg border text-center"
                    style={{
                      borderColor: `${n.color}30`,
                      backgroundColor: `${n.color}08`,
                    }}
                  >
                    <span className="text-xs font-mono font-medium" style={{ color: n.color }}>{n.label}</span>
                    {n.sub && <span className="text-[9px] text-gray-600 mt-0.5">{n.sub}</span>}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Online flow */}
          <div>
            <p className="text-[10px] font-mono text-violet-400 uppercase tracking-widest mb-3">Online — per request</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: "questionnaire", sub: "5-step UI", color: "#3b82f6" },
                { label: "→", sub: "", color: "#3f3f46" },
                { label: "ProfileEncoder", sub: "4 text blocks", color: "#3b82f6" },
                { label: "→", sub: "", color: "#3f3f46" },
                { label: "MiniLM-L6-v2", sub: "4 × 384-dim", color: "#8b5cf6" },
                { label: "→", sub: "", color: "#3f3f46" },
                { label: "CoverageScorer", sub: "cosine_sim × 4", color: "#10b981" },
                { label: "→", sub: "", color: "#3f3f46" },
                { label: "Top 3 films", sub: "weighted rank", color: "#10b981" },
                { label: "→", sub: "", color: "#3f3f46" },
                { label: "LLM", sub: "Ollama / Claude / Gemini", color: "#ec4899" },
                { label: "→", sub: "", color: "#3f3f46" },
                { label: "explanation", sub: "+ cinephile profile + radar charts", color: "#ec4899" },
              ].map((n, i) =>
                n.label === "→" ? (
                  <span key={i} className="text-gray-700 font-mono">→</span>
                ) : (
                  <div
                    key={i}
                    className="flex flex-col items-center px-3 py-1.5 rounded-lg border text-center"
                    style={{
                      borderColor: `${n.color}30`,
                      backgroundColor: `${n.color}08`,
                    }}
                  >
                    <span className="text-xs font-mono font-medium" style={{ color: n.color }}>{n.label}</span>
                    {n.sub && <span className="text-[9px] text-gray-600 mt-0.5">{n.sub}</span>}
                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Offline Steps ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <PhaseLabel phase="PHASE 1 · OFFLINE" label="run once to build the corpus index" color="#f59e0b" />
        <div className="grid md:grid-cols-2 gap-5">
          {OFFLINE_STEPS.map((s, i) => <StepCard key={s.n} step={s} index={i} />)}
        </div>
      </div>

      {/* ── Online Steps ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <PhaseLabel phase="PHASE 2 · ONLINE" label="per-request inference pipeline" color="#8b5cf6" />
        <div className="grid md:grid-cols-2 gap-5">
          {ONLINE_STEPS.map((s, i) => <StepCard key={s.n} step={s} index={i} />)}
        </div>
      </div>

      {/* ── Results visualization ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-violet-500/15 overflow-hidden"
          style={{ backgroundColor: "rgba(139,92,246,0.04)" }}
        >
          <div className="px-6 pt-5 pb-4 border-b border-violet-500/10">
            <p className="text-[10px] font-mono text-violet-400 uppercase tracking-widest mb-1">frontend/src/components/RadarChart.tsx</p>
            <h2 className="text-lg font-bold text-white">Results visualization</h2>
            <p className="text-sm text-gray-400 mt-1">
              Each recommended movie displays an SVG radar chart with four axes: Mood, Theme, Style, Description. Values come from the per-axis cosine similarity scores. A collapsible &quot;How we score&quot; section explains dynamic slider-driven weights and shows the effective per-request breakdown.
            </p>
          </div>
          <div className="p-6">
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-white/5 p-4" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                <p className="font-semibold text-violet-300 mb-2">Radar chart axes</p>
                <ul className="space-y-1 text-gray-400 font-mono">
                  <li>Mood — emotional atmosphere match</li>
                  <li>Theme — genre/thematic match</li>
                  <li>Style — narrative pacing match</li>
                  <li>Description — free-text semantic match</li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/5 p-4" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                <p className="font-semibold text-violet-300 mb-2">Additional UI elements</p>
                <ul className="space-y-1 text-gray-400">
                  <li>Cinephile profile card (emerald)</li>
                  <li>Short-description enrichment notice (amber)</li>
                  <li>Coverage score progress bar per movie</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Scoring Formula deep-dive ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-emerald-500/15 overflow-hidden"
          style={{ backgroundColor: "rgba(16,185,129,0.04)" }}
        >
          <div className="px-6 pt-5 pb-4 border-b border-emerald-500/10">
            <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1">coverage_scorer.py</p>
            <h2 className="text-lg font-bold text-white">The Scoring Formula</h2>
            <p className="text-sm text-gray-400 mt-1">
              How cosine similarities from 4 independent axes are aggregated into a single CoverageScore.
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Formula display */}
            <div
              className="rounded-xl p-4 border border-emerald-500/10 font-mono text-sm text-center leading-loose"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
              <span className="text-gray-400">CoverageScore  =  </span>
              <span style={{ color: "#8b5cf6" }}>w_mood × mood_sim</span>
              <span className="text-gray-600">  +  </span>
              <span style={{ color: "#3b82f6" }}>w_theme × theme_sim</span>
              <span className="text-gray-600">  +  </span>
              <span style={{ color: "#10b981" }}>w_style × style_sim</span>
              <span className="text-gray-600">  +  </span>
              <span style={{ color: "#f59e0b" }}>w_desc × desc_sim</span>
              <span className="text-gray-600">  +  </span>
              <span style={{ color: "#6b7280" }}>0.05 × recency</span>
            </div>

            {/* Weight bars */}
            <div className="space-y-3">
              {[
                { axis: "mood_sim", weight: 27, pct: "11–27%", color: "#8b5cf6", note: "Slider-driven range (Mood intensity)" },
                { axis: "theme_sim", weight: 27, pct: "11–27%", color: "#3b82f6", note: "Slider-driven range (Theme interest)" },
                { axis: "style_sim", weight: 26, pct: "10–26%", color: "#10b981", note: "Slider-driven range (Style interest)" },
                { axis: "desc_sim", weight: 52, pct: "34–52%", color: "#f59e0b", note: "Strong base priority for free-text nuance" },
                { axis: "recency", weight: 5, pct: "5%", color: "#6b7280", note: "Fixed exp(−Δyear/10) tiebreaker" },
              ].map((r) => (
                <div key={r.axis} className="flex items-center gap-4">
                  <span className="font-mono text-xs w-20 shrink-0" style={{ color: r.color }}>{r.axis}</span>
                  <div className="flex-1 rounded-full h-1.5 bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${r.weight}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                  </div>
                  <span className="font-mono text-xs w-8 shrink-0 text-right" style={{ color: r.color }}>{r.pct}</span>
                  <span className="text-xs text-gray-500 hidden sm:block w-48 shrink-0">{r.note}</span>
                </div>
              ))}
            </div>

            {/* Normalization note */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/5 p-4 space-y-1.5" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                <p className="text-xs font-mono text-gray-400 font-semibold">Min-max normalisation (per axis)</p>
                <code className="text-[11px] font-mono text-emerald-300">
                  sim_norm = (sim − min) / (max − min + 1e-8)
                </code>
                <p className="text-xs text-gray-500">Applied independently to each axis before aggregation, ensuring all scores are in [0, 1].</p>
              </div>
              <div className="rounded-xl border border-white/5 p-4 space-y-1.5" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                <p className="text-xs font-mono text-gray-400 font-semibold">Recency decay</p>
                <code className="text-[11px] font-mono text-gray-300">
                  recency = exp(−(year_now − release_year) / 10)
                </code>
                <p className="text-xs text-gray-500">Smooth exponential decay: a 10-year-old film scores ~0.37; a 30-year-old film scores ~0.05. Used only as a tiebreaker (5%).</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── LLM Layer ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-pink-500/15 overflow-hidden"
          style={{ backgroundColor: "rgba(236,72,153,0.03)" }}
        >
          <div className="px-6 pt-5 pb-4 border-b border-pink-500/10">
            <p className="text-[10px] font-mono text-pink-400 uppercase tracking-widest mb-1">llm_client.py</p>
            <h2 className="text-lg font-bold text-white">The LLM Layer</h2>
            <p className="text-sm text-gray-400 mt-1">
              Triple-backend generative layer (Ollama, Claude, Gemini) with in-memory cache. Switch in Settings or on the Recommend page.
            </p>
          </div>
          <div className="p-6">
            <div className="grid sm:grid-cols-3 gap-5">
              {/* Ollama */}
              <div className="rounded-xl border border-white/5 p-4 space-y-3" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-xs font-semibold text-white">Ollama (default · local)</p>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Model</span><span className="text-gray-300">phi3:mini</span></div>
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Endpoint</span><span className="text-gray-300 font-mono text-[10px]">localhost:11434</span></div>
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Max tokens</span><span className="text-gray-300">256</span></div>
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Internet</span><span className="text-green-400">None</span></div>
                </div>
              </div>
              {/* Claude */}
              <div className="rounded-xl border border-white/5 p-4 space-y-3" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  <p className="text-xs font-semibold text-white">Anthropic Claude</p>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Model</span><span className="text-gray-300">claude-3-5-haiku</span></div>
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Endpoint</span><span className="text-gray-300 font-mono text-[10px]">api.anthropic.com</span></div>
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Max tokens</span><span className="text-gray-300">512</span></div>
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Key</span><span className="text-pink-300">.env or Settings</span></div>
                </div>
              </div>
              {/* Gemini */}
              <div className="rounded-xl border border-white/5 p-4 space-y-3" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <p className="text-xs font-semibold text-white">Google Gemini</p>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Model</span><span className="text-gray-300">gemini-1.5-flash</span></div>
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Endpoint</span><span className="text-gray-300 font-mono text-[10px]">generativelanguage.googleapis.com</span></div>
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Max tokens</span><span className="text-gray-300">512</span></div>
                  <div className="flex gap-2"><span className="font-mono text-gray-600 w-20 shrink-0">Key</span><span className="text-amber-300">.env or Settings</span></div>
                </div>
              </div>
            </div>

            {/* Cache */}
            <div className="mt-4 rounded-xl border border-white/5 p-4" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineArrowPath className="w-4 h-4 text-pink-400" />
                <p className="text-xs font-semibold text-white">Response cache</p>
                <span className="text-[10px] font-mono text-gray-600">(responsible cost-aware usage — satisfies Annexe I req 1.5.3)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: "Key", val: "SHA-256(prompt)" },
                  { label: "TTL", val: "24 hours" },
                  { label: "Max entries", val: "200" },
                  { label: "Thread safety", val: "threading.Lock" },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg p-2 border border-white/5 text-center" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                    <p className="font-mono text-[10px] text-gray-600 mb-1">{c.label}</p>
                    <p className="font-mono text-pink-300 text-[11px]">{c.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Tech Stack ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/8 overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.015)" }}
        >
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Full technology stack</h2>
            <p className="text-xs text-gray-500 mt-0.5">Accurate as of codebase — no PostgreSQL, no cloud database</p>
          </div>
          <div className="divide-y divide-white/4">
            {TECH_STACK.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-6 py-3 hover:bg-white/2 transition-colors"
              >
                <span className="text-xs font-mono text-gray-500 w-36 shrink-0">{t.label}</span>
                <span
                  className="text-xs font-mono"
                  style={{ color: t.color }}
                >
                  {t.val}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
