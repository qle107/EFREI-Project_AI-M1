"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IoSparkles, IoSadOutline } from "react-icons/io5";
import { MdMovie, MdAutoAwesome } from "react-icons/md";
import { HiOutlineLightBulb } from "react-icons/hi2";
import { useAuth } from "@/lib/auth-context";
import { MovieCard } from "@/components/MovieCard";
import { ChipSelector } from "@/components/ChipSelector";
import { MovieModal } from "@/components/MovieModal";
import { getCatalogOptions, getRecommendations, getMovie, listMovies } from "@/lib/api";
import type { MovieDetail, MovieListItem, MovieRecommendationItem, CatalogOptions } from "@/lib/api";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function RecommendPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [options, setOptions] = useState<CatalogOptions | null>(null);
  const [description, setDescription] = useState("");
  const [preferredMood, setPreferredMood] = useState("");
  const [preferredGenre, setPreferredGenre] = useState("");
  const [preferredStyle, setPreferredStyle] = useState("");
  const [moodIntensity, setMoodIntensity] = useState(3);
  const [themeInterest, setThemeInterest] = useState(3);
  const [styleInterest, setStyleInterest] = useState(3);
  const [recommendations, setRecommendations] = useState<MovieRecommendationItem[]>([]);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [modalMovie, setModalMovie] = useState<MovieDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterKey, setFilterKey] = useState(0);
  const [browseMovies, setBrowseMovies] = useState<MovieListItem[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }
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
  }, []);

  useEffect(() => {
    listMovies({ limit: 16, mood: preferredMood || undefined, genre: preferredGenre || undefined })
      .then((res) => setBrowseMovies(res.items))
      .catch(() => setBrowseMovies([]));
  }, [preferredMood, preferredGenre]);

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setFilterKey((k) => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !options) return;
    setLoading(true);
    setSubmitted(false);
    setRecommendations([]);
    setExplanation("");
    try {
      const data = await getRecommendations(token, {
        description: description || "I enjoy compelling stories with strong characters.",
        preferred_mood: preferredMood || options.moods[0] || "drama",
        preferred_genre: preferredGenre || options.genres[0] || "drama",
        preferred_style: preferredStyle || options.styles[0] || "drama",
        mood_intensity: moodIntensity,
        theme_interest: themeInterest,
        style_interest: styleInterest,
      });
      setRecommendations(data.recommendations);
      setExplanation(data.explanation);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setRecommendations([]);
      setExplanation("Could not get recommendations. Check API and try again.");
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
      setModalOpen(false);
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
    <div className="min-h-screen bg-[#0F0F0F] pb-24">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent" />
        <div className="relative px-6 pt-12 pb-16 sm:px-12 md:px-16 lg:px-24 text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600/20 px-4 py-2 text-violet-400 text-sm font-medium mb-6"
          >
            <IoSparkles className="w-4 h-4" />
            AI-powered
          </motion.div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
            Get your perfect picks
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Describe what you&apos;re in the mood for. We&apos;ll match you with 3 movies tailored to your taste.
          </p>
        </div>
      </motion.div>

      {/* Two-column: Form left, Movie slider right */}
      <div className="mx-auto max-w-7xl px-6 sm:px-8 md:px-12 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">
        {/* Left: Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-8 lg:sticky lg:top-24"
        >
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <MdMovie className="w-4 h-4 text-violet-400" />
            What kind of movie are you in the mood for?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Something dark and atmospheric, with a twist. I like sci-fi and mystery."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none transition"
          />
        </div>

        {options && (
          <motion.div
            key={filterKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <ChipSelector
              label="Mood"
              value={preferredMood || options.moods[0] || ""}
              options={options.moods}
              onChange={(v) => handleFilterChange(setPreferredMood, v)}
              icon={<IoSparkles className="w-4 h-4" />}
              maxVisible={12}
            />
            <ChipSelector
              label="Genre"
              value={preferredGenre || options.genres[0] || ""}
              options={options.genres}
              onChange={(v) => handleFilterChange(setPreferredGenre, v)}
              icon={<MdMovie className="w-4 h-4" />}
              maxVisible={12}
            />
            <ChipSelector
              label="Style"
              value={preferredStyle || options.styles[0] || ""}
              options={options.styles}
              onChange={(v) => handleFilterChange(setPreferredStyle, v)}
              icon={<MdAutoAwesome className="w-4 h-4" />}
              maxVisible={10}
            />
          </motion.div>
        )}

        <div className="space-y-6">
          <SliderLabel
            value={moodIntensity}
            setValue={setMoodIntensity}
            label="Mood intensity"
          />
          <SliderLabel value={themeInterest} setValue={setThemeInterest} label="Theme interest" />
          <SliderLabel value={styleInterest} setValue={setStyleInterest} label="Style interest" />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full rounded-xl bg-violet-600 py-4 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
              />
              Finding your movies...
            </>
          ) : (
            <>
              <IoSparkles className="w-5 h-5" />
              Get recommendations
            </>
          )}
        </motion.button>
        </motion.form>

        {/* Right: Genre browse OR AI recommendations */}
        <section className="mt-12 lg:mt-0">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="genre-browse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="mb-2 text-xl sm:text-2xl font-bold text-white">
                  {preferredMood || preferredGenre ? "Movies by your picks" : "Explore movies"}
                </h2>
                <p className="mb-4 text-sm text-gray-500">
                  Genre & mood filter only — not AI
                </p>
                <div className="flex flex-wrap gap-4">
                  {browseMovies.map((m) => (
                    <MovieCard
                      key={m.film_id}
                      filmId={m.film_id}
                      title={m.title}
                      posterUrl={m.poster_url}
                      voteAverage={m.vote_average}
                      onClick={() => openModal(m.film_id)}
                    />
                  ))}
                </div>
              </motion.div>
            ) : recommendations.length > 0 ? (
              <motion.div
                key="ai-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", damping: 15 }}
                  className="mb-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", damping: 12 }}
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-400 mb-3"
                  >
                    <MdAutoAwesome className="w-6 h-6" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white">We found your movies!</h2>
                  <p className="mt-1 text-gray-400 text-sm">Here are 3 picks tailored just for you</p>
                </motion.div>

                {explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6 rounded-2xl border border-violet-500/20 bg-violet-950/20 p-5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <HiOutlineLightBulb className="w-4 h-4 text-violet-400" />
                      <h3 className="text-base font-semibold text-white">Why these movies?</h3>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{explanation}</p>
                  </motion.div>
                )}

                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="flex flex-wrap gap-6"
                >
                  {recommendations.map((m) => {
                    const pct = (s: number) => Math.min(100, Math.max(0, (s ?? 0) * 100));
                    return (
                      <motion.div key={m.film_id} variants={item} className="flex flex-col items-start">
                        <MovieCard
                          filmId={m.film_id}
                          title={m.title}
                          posterUrl={m.poster_url}
                          voteAverage={null}
                          onClick={() => openModal(m.film_id)}
                        />
                        <div className="mt-2 w-full max-w-[180px] space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Cosine similarity</span>
                            <span className="font-semibold text-violet-400">
                              {pct(m.coverage_score).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct(m.coverage_score)}%` }}
                              transition={{ duration: 0.6, delay: 0.2 }}
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                            />
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400">
                            <span>Mood {pct(m.mood_score)}%</span>
                            <span>Theme {pct(m.theme_score)}%</span>
                            <span>Style {pct(m.style_score)}%</span>
                            <span>Desc {pct(m.desc_score)}%</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="ai-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 rounded-2xl border border-white/10 bg-zinc-900/50 text-center"
              >
                <IoSadOutline className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-white">Couldn&apos;t find recommendations</h2>
                <p className="mt-2 text-sm text-gray-400">{explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <MovieModal movie={modalMovie} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function SliderLabel({
  value,
  setValue,
  label,
}: {
  value: number;
  setValue: (v: number) => void;
  label: string;
}) {
  return (
    <motion.div layout className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <motion.span
          key={value}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-violet-400 font-medium"
        >
          {value}
        </motion.span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-white/10 accent-violet-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </motion.div>
  );
}
