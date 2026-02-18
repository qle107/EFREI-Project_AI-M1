"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { HiMagnifyingGlass } from "react-icons/hi2";

interface ChipSelectorProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  maxVisible?: number;
}

export function ChipSelector({
  label,
  value,
  options,
  onChange,
  icon,
  maxVisible = 12,
}: ChipSelectorProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const showMore = options.length > maxVisible;
  const displayOptions = expanded ? filtered : filtered.slice(0, maxVisible);
  const hasMore = filtered.length > maxVisible && !expanded;

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
        {icon && <span className="text-violet-400">{icon}</span>}
        {label}
      </label>

      {/* Search when many options */}
      {options.length > 8 && (
        <div className="relative mb-3">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      )}

      {/* Chip grid */}
      <div className="flex flex-wrap gap-2">
        {displayOptions.map((opt) => {
          const isSelected = value.toLowerCase() === opt.toLowerCase();
          return (
            <motion.button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isSelected
                  ? "bg-violet-600 text-white ring-1 ring-violet-400/50"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-sm text-violet-400 hover:text-violet-300"
        >
          + Show {filtered.length - maxVisible} more
        </button>
      )}
    </div>
  );
}
