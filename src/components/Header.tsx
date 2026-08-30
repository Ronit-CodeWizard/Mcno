import React from 'react';
import { Sun, Moon, Search } from 'lucide-react';

interface HeaderProps {
  title?: string;
  isDark: boolean;
  onToggleTheme: () => void;
  showSearchToggle?: boolean;
  isSearchOpen?: boolean;
  onToggleSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'CodeWizard Projects',
  isDark,
  onToggleTheme,
  showSearchToggle = true,
  isSearchOpen = false,
  onToggleSearch,
}) => {
  // Golden Ratio calculation: phi = 1.6180339887...
  // The 'Projects' text is sized exactly to (CodeWizard size / 1.618034)
  const parts = title.split(' ');
  const primaryTitle = parts[0] || 'CodeWizard';
  const secondaryTitle = parts.slice(1).join(' ') || 'Projects';

  return (
    <header className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto pt-6 sm:pt-10 pb-4 px-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left Title section with Golden Ratio sizing */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-baseline gap-2.5 sm:gap-3">
            <span>{primaryTitle}</span>
            <span
              style={{ fontSize: 'calc(1em / 1.618034)' }}
              className="font-medium text-[var(--text-secondary)] tracking-normal select-none"
            >
              {secondaryTitle}
            </span>
          </h1>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Search Toggle */}
          {showSearchToggle && onToggleSearch && (
            <button
              onClick={onToggleSearch}
              id="header-search-toggle"
              aria-label="Toggle search input"
              title="Search projects"
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                isSearchOpen
                  ? 'bg-[var(--card-bg)] border-[var(--orange-primary)] text-[var(--orange-primary)] shadow-sm'
                  : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            id="header-theme-toggle"
            aria-label="Toggle light and dark theme"
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            className="p-2.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-sm cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
