"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-[#0F0F0F] py-12 px-6 sm:px-12 md:px-16 lg:px-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <Link href="/" className="text-xl font-bold text-white">
            AISCA Movies
          </Link>
          <div className="flex gap-8 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/recommend" className="hover:text-white transition">Recommend</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              GitHub
            </a>
          </div>
        </div>
        <p className="mt-8 text-center sm:text-left text-sm text-gray-500">
          Semantic movie recommendations powered by AISCA. Built with Next.js & Tailwind.
        </p>
      </div>
    </footer>
  );
}
