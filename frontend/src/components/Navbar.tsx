"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { IoHome, IoSparkles } from "react-icons/io5";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === "/login") return null;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0F0F0F]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6 sm:px-12 md:px-16 lg:px-24">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">
            AISCA
          </span>
          <span className="hidden sm:inline text-sm text-gray-400 font-normal">Movies</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`flex items-center gap-2 text-sm font-medium transition ${
              pathname === "/" ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <IoHome className="w-4 h-4" />
            Home
          </Link>
          <Link
            href="/recommend"
            className={`flex items-center gap-2 text-sm font-medium transition ${
              pathname === "/recommend" ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <IoSparkles className="w-4 h-4" />
            Recommend
          </Link>

          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-500">Signed in</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white font-medium hover:bg-violet-500 transition"
              title="Logout"
            >
              {user?.username ? (
                <span>{user.username.charAt(0).toUpperCase()}</span>
              ) : (
                <HiOutlineUserCircle className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}
