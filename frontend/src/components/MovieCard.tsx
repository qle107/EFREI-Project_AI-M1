"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MdStar } from "react-icons/md";
import { HiOutlineEye } from "react-icons/hi2";

export interface MovieCardProps {
  filmId: number;
  title: string;
  posterUrl: string | null;
  voteAverage?: number | null;
  onClick?: () => void;
}

const PLACEHOLDER = "https://placehold.co/300x450/1a1a1a/666666?text=No+Poster";

export function MovieCard({ filmId, title, posterUrl, voteAverage, onClick }: MovieCardProps) {
  return (
    <motion.article
      layout
      onClick={onClick}
      className="group relative flex-shrink-0 w-[160px] sm:w-[180px] cursor-pointer overflow-hidden rounded-xl shadow-md"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-800">
        <Image
          src={posterUrl || PLACEHOLDER}
          alt={title}
          fill
          sizes="(max-width: 640px) 160px, 180px"
          className="object-cover transition duration-200 group-hover:brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="rounded-full bg-violet-600/80 p-2.5 text-white">
            <HiOutlineEye className="w-5 h-5" />
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-gradient-to-t from-black/90 to-transparent">
          <h3 className="text-xs font-medium text-white line-clamp-2">{title}</h3>
          {voteAverage != null && (
            <p className="flex items-center gap-0.5 text-xs text-amber-400 mt-0.5">
              <MdStar className="w-3 h-3 fill-amber-400" />
              {voteAverage.toFixed(1)}
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
}
