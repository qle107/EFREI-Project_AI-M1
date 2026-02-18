"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import { MdStar } from "react-icons/md";
import type { MovieDetail } from "@/lib/api";

const PLACEHOLDER = "https://placehold.co/300x450/1a1a1a/666666?text=No+Poster";

interface MovieModalProps {
  movie: MovieDetail | null;
  onClose: () => void;
  open: boolean;
}

export function MovieModal({ movie, onClose, open }: MovieModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && movie && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 shadow-2xl overflow-hidden border border-white/10"
          >
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition"
              aria-label="Close"
            >
              <IoClose className="w-6 h-6" />
            </motion.button>

            <div className="flex flex-col sm:flex-row">
              {/* Poster - full aspect ratio, no crop */}
              <div className="flex-shrink-0 w-full sm:w-[200px] lg:w-[240px]">
                <div className="relative aspect-[2/3] bg-zinc-800">
                  <Image
                    src={movie.poster_url || PLACEHOLDER}
                    alt={movie.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, 240px"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 p-6 space-y-4 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-white pr-12">
                  {movie.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  {movie.release_date && (
                    <span className="text-sm text-gray-300">{movie.release_date}</span>
                  )}
                  {movie.vote_average != null && (
                    <span className="flex items-center gap-1 text-sm text-amber-400">
                      <MdStar className="w-4 h-4 fill-amber-400" />
                      {movie.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Tag label={movie.mood} />
                  <Tag label={movie.theme} />
                  <Tag label={movie.narrative_style} />
                  <Tag label={movie.emotional_tone} />
                </div>
                {movie.overview && (
                  <p className="text-gray-300 text-sm leading-relaxed">{movie.overview}</p>
                )}
                {movie.description && movie.description !== movie.overview && (
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">
                    {movie.description}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-300">
      {label}
    </span>
  );
}
