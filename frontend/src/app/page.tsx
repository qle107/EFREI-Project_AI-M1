"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { IoSparkles } from "react-icons/io5";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { useAuth } from "@/lib/auth-context";
import { HeroBanner } from "@/components/HeroBanner";
import { CarouselRow } from "@/components/CarouselRow";
import { MovieModal } from "@/components/MovieModal";
import { listMovies, getMovie } from "@/lib/api";
import type { MovieListItem, MovieDetail } from "@/lib/api";

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
          const first = items[0];
          const detail = await getMovie(first.film_id);
          setFeatured(detail);
          // Two movies for 2-col (indices 1,2 or 0,1 to vary from banner)
          const pairIndices = items.length >= 3 ? [1, 2] : [0, 1];
          const pair = pairIndices
            .filter((i) => i < items.length)
            .map((i) => items[i]);
          const pairDetails = await Promise.all(
            pair.map((m) => getMovie(m.film_id))
          );
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
        setFeatured({
          ...mock,
          description: "Sample description",
          overview: "A compelling story awaits.",
          release_date: "2024",
        });
        const mock2 = { ...mock, film_id: 1, title: "Another Movie" };
        setFeaturedPair([
          { ...mock, description: "", overview: "Story 1", release_date: "2023" },
          { ...mock2, description: "", overview: "Story 2", release_date: "2024" },
        ]);
        setRecommended(Array(8).fill(mock).map((m, i) => ({ ...m, film_id: i, title: `Movie ${i + 1}` })));
        setTrending(Array(8).fill(mock).map((m, i) => ({ ...m, film_id: i + 10, title: `Trending ${i + 1}` })));
        setBecauseYouLiked(Array(6).fill(mock).map((m, i) => ({ ...m, film_id: i + 20, title: `Because ${i + 1}` })));
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
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* 1. Banner first */}
      {!loading && (
        <HeroBanner
          title={featured?.title ?? "Discover Your Next Favorite"}
          overview={featured?.overview}
          posterUrl={featured?.poster_url}
          backdropUrl={featured?.poster_url}
          onInfo={() => featured && openModal(featured.film_id)}
        />
      )}

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
          {/* 2. Two-column: 2 movies left, recommendation CTA right */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full px-6 py-16 sm:px-8 md:px-12"
          >
            <div className="mx-auto max-w-7xl grid md:grid-cols-[1.1fr_1fr] gap-12 md:gap-16 items-center">
              {/* Left: two movie posters, bigger */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex justify-center gap-6 md:gap-8"
              >
                {featuredPair.slice(0, 2).map((movie, i) => (
                  <button
                    key={movie.film_id}
                    onClick={() => openModal(movie.film_id)}
                    className="flex-1 max-w-[220px] md:max-w-[260px] rounded-2xl overflow-hidden shadow-xl hover:ring-2 ring-violet-500/50 transition"
                  >
                    <div className="relative aspect-[2/3] bg-zinc-800">
                      {movie.poster_url ? (
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-700" />
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>

              {/* Right: recommendation copy + CTA */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-center md:text-left"
              >
                <p className="text-violet-400 font-medium text-sm tracking-wide uppercase mb-3">
                  AI-powered picks
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Not sure what to watch?
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-8">
                  Tell us your mood, genre and style. Our AI picks 3 movies tailored just for you —
                  with a short explanation of why they match.
                </p>
                <Link href="/recommend">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition"
                  >
                    Get recommendations
                    <HiOutlineArrowRight className="w-5 h-5" />
                  </motion.span>
                </Link>
              </motion.div>
            </div>
          </motion.section>

          {/* 3. Carousels */}
          <div className="w-full mx-auto max-w-7xl px-6 sm:px-8 md:px-12 mt-4 pb-24">
            <CarouselRow
              title="Recommended for you"
              movies={recommended}
              onMovieClick={openModal}
              direction="left"
            />
            <CarouselRow
              title="Trending now"
              movies={trending}
              onMovieClick={openModal}
              direction="right"
            />
            <CarouselRow
              title="Because you liked dark films"
              movies={becauseYouLiked}
              onMovieClick={openModal}
              direction="left"
            />
          </div>
        </>
      )}

      <MovieModal
        movie={modalMovie}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
