"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { IoSparkles, IoLockClosed } from "react-icons/io5";

// ─── PIPELINE STEPS ──────────────────────────────────────────────────────────
const PIPELINE = [
  {
    step: "01",
    label: "Profile Encoding",
    detail: "mood · genre · style → semantic vector",
    color: "#8b5cf6",
  },
  {
    step: "02",
    label: "Embedding",
    detail: "sentence-transformers/all-MiniLM-L6-v2",
    color: "#3b82f6",
  },
  {
    step: "03",
    label: "Cosine Similarity",
    detail: "rank against 9,841 film embeddings",
    color: "#10b981",
  },
  {
    step: "04",
    label: "LLM Enrichment",
    detail: "cinephile profile + match explanation",
    color: "#f59e0b",
  },
];

const SPECS = [
  { key: "MODEL",     val: "all-MiniLM-L6-v2" },
  { key: "DIMS",      val: "384-dimensional" },
  { key: "CORPUS",    val: "9,841 films" },
  { key: "SCORING",   val: "4-axis weighted cosine" },
  { key: "BACKEND",   val: "FastAPI + Python 3.11" },
  { key: "STACK",     val: "Next.js 16 · Tailwind CSS" },
];

// ─── ANIMATED METRIC ─────────────────────────────────────────────────────────
function AnimatedMetric({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 40;
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 30);
    return () => clearInterval(id);
  }, [target]);
  return <span>{val.toLocaleString()}{suffix}</span>;
}

// ─── BLINKING CURSOR ─────────────────────────────────────────────────────────
function Cursor() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);
  return <span style={{ opacity: on ? 1 : 0 }} className="inline-block w-2 h-4 bg-violet-400 ml-0.5 align-middle" />;
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Try admin / admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-[#080810] flex">

      {/* ── LEFT PANEL: Technical identity ───────────────────────────── */}
      <motion.aside
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 relative overflow-hidden border-r border-white/5"
        style={{
          background: "linear-gradient(160deg, #0d0d1a 0%, #080810 60%, #0a0f0a 100%)",
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139,92,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-20 left-10 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: "#8b5cf6" }} />
        <div className="absolute bottom-32 right-8 w-32 h-32 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: "#3b82f6" }} />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Brand + status */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
              >
                <IoSparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">CineMatch</span>
            </div>
            <p className="text-xs font-mono text-violet-400 tracking-widest uppercase">
              Semantic Movie Intelligence System
            </p>

            {/* Status row */}
            <div className="flex items-center gap-4 mt-4">
              <span className="flex items-center gap-1.5 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400">API ONLINE</span>
              </span>
              <span className="text-xs font-mono text-gray-600">|</span>
              <span className="text-xs font-mono text-gray-500">v1.0.0-beta</span>
            </div>
          </div>

          {/* Live metrics */}
          <div className="mt-10 grid grid-cols-2 gap-3">
            {[
              { label: "Films indexed", value: 9841, suffix: "" },
              { label: "Embed dims",    value: 384,  suffix: "D" },
              { label: "Score axes",    value: 4,    suffix: "" },
              { label: "Avg latency",   value: 820,  suffix: "ms" },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-white/8 p-3"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-2xl font-bold text-white font-mono">
                  <AnimatedMetric target={m.value} suffix={m.suffix} />
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div className="mt-10">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">
              Inference pipeline
            </p>
            <div className="space-y-0">
              {PIPELINE.map((p, i) => (
                <motion.div
                  key={p.step}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.12 }}
                  className="flex items-stretch gap-3"
                >
                  {/* connector */}
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono text-black"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.step}
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div className="w-px flex-1 my-1" style={{ backgroundColor: `${p.color}40` }} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-white">{p.label}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: p.color }}>
                      {p.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Spec table */}
          <div className="mt-8">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
              System specs
            </p>
            <div className="space-y-1.5">
              {SPECS.map((s) => (
                <div key={s.key} className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-gray-600 w-20 shrink-0">{s.key}</span>
                  <span className="text-violet-300">{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal footer */}
          <div
            className="mt-auto rounded-xl border border-white/8 p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <p className="text-xs font-mono text-green-400">
              <span className="text-gray-600">$</span> cinematch --mode semantic-search --top-k 3
            </p>
            <p className="text-xs font-mono text-gray-500 mt-1">
              Waiting for user profile<Cursor />
            </p>
          </div>
        </div>
      </motion.aside>

      {/* ── RIGHT PANEL: Login form ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative">
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 40%, rgba(139,92,246,0.08) 0%, transparent 60%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative w-full max-w-sm"
        >
          {/* Mobile-only header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
              >
                <IoSparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CineMatch</span>
            </div>
            <p className="text-xs font-mono text-violet-400 tracking-widest">SEMANTIC MOVIE INTELLIGENCE</p>
          </div>

          <div
            className="rounded-2xl border border-white/10 p-8 shadow-2xl"
            style={{ backgroundColor: "rgba(20,20,32,0.9)", backdropFilter: "blur(20px)" }}
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <IoLockClosed className="w-4 h-4 text-violet-400" />
                <h1 className="text-lg font-semibold text-white">Authenticate</h1>
              </div>
              <p className="text-sm text-gray-500">
                Access the semantic recommendation engine
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label htmlFor="username" className="block text-xs font-mono font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-mono"
                  placeholder="admin"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-mono font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-mono"
                  placeholder="••••••••"
                />
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-xl py-3.5 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
              >
                {isSubmitting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 rounded-full border-2 border-white border-t-transparent"
                    />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <IoSparkles className="w-4 h-4" />
                    Sign in
                  </>
                )}
              </motion.button>
            </form>

            {/* Hint */}
            <div
              className="mt-5 rounded-lg border border-violet-500/15 px-4 py-3"
              style={{ backgroundColor: "rgba(139,92,246,0.06)" }}
            >
              <p className="text-xs text-gray-500 font-mono">
                Demo credentials:{" "}
                <code className="text-violet-300">admin</code> / <code className="text-violet-300">admin</code>
              </p>
            </div>
          </div>

          {/* Bottom tech note */}
          <p className="mt-6 text-center text-[11px] font-mono text-gray-600">
            Secured · Session-based JWT · FastAPI backend
          </p>
        </motion.div>
      </div>
    </div>
  );
}
