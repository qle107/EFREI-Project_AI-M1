"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { IoSparkles } from "react-icons/io5";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === "/login") return null;

  const navLink = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className="relative flex items-center gap-1.5 text-sm font-medium transition-colors group"
        style={{ color: active ? "#fff" : "#71717a" }}
      >
        <span className="group-hover:text-white transition-colors">{label}</span>
        {active && (
          <motion.span
            layoutId="nav-active"
            className="absolute -bottom-[21px] left-0 right-0 h-px"
            style={{ backgroundColor: "#8b5cf6" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/5 backdrop-blur-md"
      style={{ backgroundColor: "rgba(8,8,16,0.92)" }}>
      <div className="flex h-14 items-center justify-between px-5 sm:px-10 md:px-14">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
          >
            <IoSparkles className="w-3.5 h-3.5 text-white" />
          </motion.div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-white tracking-tight">CineMatch</span>
            <span className="hidden sm:inline text-xs font-mono text-gray-500">Movies</span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-7">
          {navLink("/", "Home")}
          {navLink("/recommend", "Recommend")}
          {user && navLink("/history", "History")}
          {navLink("/how-it-works", "How it works")}
          {user && navLink("/settings", "Settings")}
        </div>

        {/* Right: status + user */}
        <div className="flex items-center gap-4">
          {/* API status pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/8 px-2.5 py-1"
            style={{ backgroundColor: "rgba(16,185,129,0.06)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono text-green-400 tracking-wide">API</span>
          </div>

          {/* Model badge */}
          <div
            className="hidden md:flex items-center gap-1 rounded-full border border-white/8 px-2.5 py-1"
            style={{ backgroundColor: "rgba(139,92,246,0.06)" }}
          >
            <span className="text-[10px] font-mono text-violet-400">MiniLM-L6</span>
          </div>

          {/* User + logout */}
          {user && (
            <div className="flex items-center gap-2.5 pl-3 border-l border-white/8">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-white leading-none">{user.username}</p>
                <p className="text-[10px] text-gray-600 mt-0.5 font-mono">authenticated</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={logout}
                className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm transition"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff" }}
                title="Logout"
              >
                {user.username ? (
                  <span>{user.username.charAt(0).toUpperCase()}</span>
                ) : (
                  <HiOutlineUserCircle className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
