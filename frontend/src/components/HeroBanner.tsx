"use client";

import { motion } from "framer-motion";
import { IoPlay } from "react-icons/io5";
import { HiOutlineInformationCircle } from "react-icons/hi2";

interface HeroBannerProps {
  title: string;
  overview?: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  onPlay?: () => void;
  onInfo?: () => void;
}

const DEFAULT_BACKDROP =
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&q=90";

export function HeroBanner({
  title,
  overview,
  posterUrl,
  backdropUrl,
  onPlay,
  onInfo,
}: HeroBannerProps) {
  const imgSrc = backdropUrl || posterUrl || DEFAULT_BACKDROP;

  return (
    <section className="relative h-[55vh] min-h-[380px] w-full overflow-hidden">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/80 to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex h-full items-end pb-12 pl-6 sm:pl-12 md:pl-16 lg:pl-24">
        <motion.div
          className="max-w-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
            {title}
          </h1>
          {overview && (
            <p className="mt-4 text-base sm:text-lg text-gray-300 line-clamp-3 drop-shadow">
              {overview}
            </p>
          )}
          <div className="mt-6 flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              onClick={onPlay}
              className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-black font-semibold shadow-lg transition hover:bg-gray-200"
            >
              <IoPlay className="w-5 h-5" />
              Play
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              onClick={onInfo}
              className="flex items-center gap-2 rounded-lg bg-white/20 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/30"
            >
              <HiOutlineInformationCircle className="w-5 h-5" />
              More Info
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
