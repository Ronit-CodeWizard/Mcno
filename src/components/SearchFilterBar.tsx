import React from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'motion/react';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  resultCount: number;
  totalCount: number;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  resultCount,
  totalCount,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 mb-5"
    >
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[24px] p-3 sm:p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-3">
        {/* Search input with icons */}
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-[#8c8c96] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            id="search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects by name, technologies, or keywords..."
            className="w-full bg-[var(--chip-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#f95700] transition-all"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              id="clear-search-btn"
              aria-label="Clear search"
              className="absolute right-3 p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live matching count */}
        <div className="px-3 py-2 rounded-xl bg-[var(--chip-bg)] border border-[var(--chip-border)] text-[11px] sm:text-xs font-semibold text-[#8c8c96] font-mono shrink-0 select-none">
          <span className="text-[var(--text-primary)] font-bold">{resultCount}</span>
          <span className="opacity-60"> / {totalCount}</span>
        </div>
      </div>
    </motion.div>
  );
};

