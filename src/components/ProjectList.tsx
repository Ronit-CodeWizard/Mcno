import React, { useEffect } from 'react';
import { Project } from '../types';
import { ProjectCard } from './ProjectCard';
import { EnhancedCodeBundle } from '../utils/compiler';

export function getProjectInitialChar(project: { title?: string; name: string } | string): string {
  const str = typeof project === 'string' ? project : (project.title || project.name);
  const trimmed = str.trim();
  if (!trimmed) return '#';
  const first = trimmed[0].toUpperCase();
  if (/[A-Z]/.test(first)) {
    return first;
  }
  return '#';
}

interface LetterGroup {
  letter: string;
  projects: Project[];
}

interface ProjectListProps {
  projects: Project[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onResetFilters: () => void;
  onVisibleLetterChange?: (letter: string) => void;
  isDark?: boolean;
  onOpenFullscreen?: (project: Project, bundle: EnhancedCodeBundle) => void;
  onToggleCodeInspector?: (project: Project, bundle: EnhancedCodeBundle) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  expandedId,
  onToggleExpand,
  onResetFilters,
  onVisibleLetterChange,
  isDark = false,
  onOpenFullscreen,
  onToggleCodeInspector,
}) => {
  // Group projects by their first character
  const letterGroups: LetterGroup[] = React.useMemo(() => {
    const groupsMap = new Map<string, Project[]>();

    for (const project of projects) {
      const char = getProjectInitialChar(project);
      if (!groupsMap.has(char)) {
        groupsMap.set(char, []);
      }
      groupsMap.get(char)!.push(project);
    }

    // Sort letter groups: '#' first, then A-Z
    const sortedLetters = Array.from(groupsMap.keys()).sort((a, b) => {
      if (a === '#') return -1;
      if (b === '#') return 1;
      return a.localeCompare(b);
    });

    return sortedLetters.map((letter) => ({
      letter,
      projects: groupsMap.get(letter)!,
    }));
  }, [projects]);

  // Cache section offsets to avoid layout thrashing (forced reflow) on scroll events
  const sectionOffsetsRef = React.useRef<{ letter: string; top: number }[]>([]);
  const lastReportedLetterRef = React.useRef<string | null>(null);

  const measureOffsets = React.useCallback(() => {
    const sections = document.querySelectorAll<HTMLElement>('.letter-group-section');
    const offsets: { letter: string; top: number }[] = [];
    sections.forEach((sec) => {
      const letter = sec.getAttribute('data-letter');
      if (letter) {
        offsets.push({ letter, top: sec.offsetTop });
      }
    });
    sectionOffsetsRef.current = offsets;
  }, []);

  // Update cached section offsets whenever letterGroups or expanded state changes
  useEffect(() => {
    measureOffsets();
    const timer = setTimeout(measureOffsets, 150);
    return () => clearTimeout(timer);
  }, [letterGroups, expandedId, measureOffsets]);

  // Track window resize to update cached offsets
  useEffect(() => {
    window.addEventListener('resize', measureOffsets, { passive: true });
    return () => window.removeEventListener('resize', measureOffsets);
  }, [measureOffsets]);

  // Ultra-fast, zero-DOM-query scroll spy
  useEffect(() => {
    if (!onVisibleLetterChange || letterGroups.length === 0) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          ticking = false;
          const offsets = sectionOffsetsRef.current;
          if (offsets.length === 0) return;

          const scrollY = window.scrollY;

          // Scrolled near top: always highlight the first group
          if (scrollY <= 60) {
            const firstLetter = offsets[0].letter;
            if (lastReportedLetterRef.current !== firstLetter) {
              lastReportedLetterRef.current = firstLetter;
              onVisibleLetterChange(firstLetter);
            }
            return;
          }

          // Scrolled to bottom: highlight the last group
          const isAtBottom =
            window.innerHeight + scrollY >= document.documentElement.scrollHeight - 60;
          if (isAtBottom) {
            const lastLetter = offsets[offsets.length - 1].letter;
            if (lastReportedLetterRef.current !== lastLetter) {
              lastReportedLetterRef.current = lastLetter;
              onVisibleLetterChange(lastLetter);
            }
            return;
          }

          const scrollPos = scrollY + 120;
          let foundLetter = offsets[0].letter;

          for (let i = offsets.length - 1; i >= 0; i--) {
            if (offsets[i].top <= scrollPos) {
              foundLetter = offsets[i].letter;
              break;
            }
          }

          if (lastReportedLetterRef.current !== foundLetter) {
            lastReportedLetterRef.current = foundLetter;
            onVisibleLetterChange(foundLetter);
          }
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [letterGroups, onVisibleLetterChange]);

  if (projects.length === 0) {
    return (
      <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[28px] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#ededeb] dark:bg-zinc-800 text-[var(--text-muted)] font-bold text-sm flex items-center justify-center mx-auto">
            0
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            No Projects Found
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            No matching projects found for your query.
          </p>
          <button
            onClick={onResetFilters}
            id="reset-filter-btn"
            className="bg-[#f95700] text-white px-5 py-2 rounded-2xl text-xs font-bold hover:bg-[#e04e00] transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      </div>
    );
  }

  let runningIndex = 0;

  return (
    <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 space-y-6 pb-[65vh]">
      {letterGroups.map((group) => (
        <section
          key={group.letter}
          id={`letter-section-${group.letter}`}
          data-letter={group.letter}
          className="letter-group-section scroll-mt-24 space-y-3"
        >
          {/* Alphabet Section Marker Bar */}
          <div className="flex items-center gap-3 pt-2 pb-1">
            <div className="w-8 h-8 rounded-xl bg-[#f95700]/10 border border-[#f95700]/25 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
              <span className="font-mono font-black text-sm text-[#f95700]">
                {group.letter}
              </span>
            </div>
            <div className="h-px flex-1 bg-[var(--card-border)]/70" />
          </div>

          {/* Project cards inside this letter section */}
          <div className="space-y-4">
            {group.projects.map((project) => {
              const cardIndex = runningIndex++;
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={cardIndex}
                  isExpanded={expandedId === project.id}
                  onToggleExpand={() => onToggleExpand(project.id)}
                  isDark={isDark}
                  onOpenFullscreen={onOpenFullscreen}
                  onToggleCodeInspector={onToggleCodeInspector}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
