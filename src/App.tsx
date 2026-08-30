import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { SearchFilterBar } from './components/SearchFilterBar';
import { ProjectList, getProjectInitialChar } from './components/ProjectList';
import { AlphabetScrollRail } from './components/AlphabetScrollRail';
import { Footer } from './components/Footer';
import { CodeInspectorModal } from './components/CodeInspectorModal';
import { FullscreenPreviewModal } from './components/FullscreenPreviewModal';
import { Project } from './types';
import { getProjectCode, EnhancedCodeBundle } from './utils/compiler';
import {
  INITIAL_PROJECTS,
  fetchGitHubLiveProjects,
} from './data/projects';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cw_theme');
      if (saved) {
        return saved === 'dark';
      }
    }
    // Always default strictly to light theme on fresh start
    return false;
  });

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string>('#');

  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state for Fullscreen and Code Inspector
  const [fullscreenProject, setFullscreenProject] = useState<Project | null>(null);
  const [fullscreenBundle, setFullscreenBundle] = useState<EnhancedCodeBundle | null>(null);

  const [inspectorProject, setInspectorProject] = useState<Project | null>(null);
  const [inspectorBundle, setInspectorBundle] = useState<EnhancedCodeBundle | null>(null);

  // Sync theme with HTML root class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cw_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cw_theme', 'light');
    }
  }, [isDark]);

  // Initial background sync with GitHub repository
  useEffect(() => {
    let isMounted = true;
    fetchGitHubLiveProjects()
      .then((result) => {
        if (isMounted && Array.isArray(result) && result.length > 0) {
          setProjects(result);
        }
      })
      .catch((err) => console.warn('Background sync fallback:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered and Alphabetically Sorted Projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.files && p.files.some((f) => f.toLowerCase().includes(q))) ||
          p.technologies.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Natural sort: '#' (numbers/symbols) first, then A to Z
    return result.sort((a, b) => {
      const charA = getProjectInitialChar(a);
      const charB = getProjectInitialChar(b);

      if (charA === '#' && charB !== '#') return -1;
      if (charA !== '#' && charB === '#') return 1;

      return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [projects, searchQuery]);

  // Calculate available letters and count per letter
  const { availableLetters, letterCounts } = useMemo(() => {
    const letters = new Set<string>();
    const counts: Record<string, number> = {};

    for (const project of filteredProjects) {
      const char = getProjectInitialChar(project);
      letters.add(char);
      counts[char] = (counts[char] || 0) + 1;
    }

    return { availableLetters: letters, letterCounts: counts };
  }, [filteredProjects]);

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
  };

  const handleOpenFullscreen = (project: Project, bundle?: EnhancedCodeBundle) => {
    const code = bundle || getProjectCode(project);
    setFullscreenProject(project);
    setFullscreenBundle(code);
  };

  const handleOpenCodeInspector = (project: Project, bundle?: EnhancedCodeBundle) => {
    const code = bundle || getProjectCode(project);
    setInspectorProject(project);
    setInspectorBundle(code);
  };

  // Jump to character section with optimized smooth or instant scroll
  const handleSelectLetter = useCallback(
    (letter: string, isInstant: boolean = false) => {
      setActiveLetter(letter);

      const sectionEl = document.getElementById(`letter-section-${letter}`);

      if (sectionEl) {
        const headerOffset = 80;
        const rect = sectionEl.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetTop = Math.max(0, rect.top + scrollTop - headerOffset);

        window.scrollTo({
          top: targetTop,
          behavior: isInstant ? 'auto' : 'smooth',
        });
      }
    },
    []
  );

  return (
    <div className="min-h-screen transition-colors duration-200 relative">
      {/* Header */}
      <Header
        title="CodeWizard Projects"
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        showSearchToggle={true}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
      />

      {/* Main View Area */}
      <main className="w-full">
        <AnimatePresence>
          {isSearchOpen && (
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              resultCount={filteredProjects.length}
              totalCount={projects.length}
            />
          )}
        </AnimatePresence>

        <ProjectList
          projects={filteredProjects}
          expandedId={expandedId}
          onToggleExpand={handleToggleExpand}
          onResetFilters={handleResetFilters}
          onVisibleLetterChange={setActiveLetter}
          isDark={isDark}
          onOpenFullscreen={handleOpenFullscreen}
          onToggleCodeInspector={handleOpenCodeInspector}
        />
      </main>

      {/* Text Footer */}
      <Footer projectCount={projects.length} />

      {/* Alphabetical Quick Jump Scroll Bar */}
      {filteredProjects.length > 0 && (
        <AlphabetScrollRail
          availableLetters={availableLetters}
          activeLetter={activeLetter}
          onSelectLetter={handleSelectLetter}
          letterCounts={letterCounts}
        />
      )}

      {/* Code Inspector & Live Editor Modal */}
      <CodeInspectorModal
        project={inspectorProject}
        initialBundle={inspectorBundle}
        isOpen={!!inspectorProject}
        onClose={() => setInspectorProject(null)}
      />

      {/* Fullscreen Sandbox Theater Modal */}
      <FullscreenPreviewModal
        project={fullscreenProject}
        bundle={fullscreenBundle}
        isOpen={!!fullscreenProject}
        onClose={() => setFullscreenProject(null)}
        isDark={isDark}
      />
    </div>
  );
}
