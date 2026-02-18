"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { MovieCard } from "./MovieCard";
import type { MovieListItem } from "@/lib/api";

interface CarouselRowProps {
  title: string;
  movies: MovieListItem[];
  onMovieClick?: (filmId: number) => void;
  direction?: "left" | "right";
}

const AUTOPLAY_INTERVAL = 5000;

export function CarouselRow({
  title,
  movies,
  onMovieClick,
  direction = "left",
}: CarouselRowProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: false,
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });

  const [isHovered, setIsHovered] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi || movies.length < 4 || isHovered) return;

    const scroll = () => {
      if (direction === "left") {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollPrev();
      }
    };

    const id = setInterval(scroll, AUTOPLAY_INTERVAL);
    return () => clearInterval(id);
  }, [emblaApi, direction, movies.length, isHovered]);

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl sm:text-2xl font-bold text-white">{title}</h2>
      <div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div ref={emblaRef} className="overflow-hidden px-2 sm:px-4">
          <div className="flex gap-4 -ml-4 touch-pan-y">
            {movies.map((m) => (
              <div key={m.film_id} className="flex-[0_0_auto] min-w-[140px] sm:min-w-[160px] pl-4">
                <MovieCard
                  filmId={m.film_id}
                  title={m.title}
                  posterUrl={m.poster_url}
                  voteAverage={m.vote_average}
                  onClick={() => onMovieClick?.(m.film_id)}
                />
              </div>
            ))}
          </div>
        </div>
        {movies.length > 3 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-[calc(100%-1rem)] w-12 bg-gradient-to-r from-[#0F0F0F] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center"
              aria-label="Previous"
            >
              <IoChevronBack className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-[calc(100%-1rem)] w-12 bg-gradient-to-l from-[#0F0F0F] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center"
              aria-label="Next"
            >
              <IoChevronForward className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
