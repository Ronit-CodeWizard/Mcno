import React from 'react';
import { ArrowUp, Github } from 'lucide-react';
import { GITHUB_REPO_URL, GITHUB_OWNER, GITHUB_REPO } from '../data/projects';

interface FooterProps {
  projectCount?: number;
}

export const Footer: React.FC<FooterProps> = ({ projectCount }) => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="app-footer"
      className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16 mt-8"
    >
      {/* Subtle Divider Line */}
      <div className="w-full h-px bg-[var(--card-border)] mb-8" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        {/* Left Info Text */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            CodeWizard Projects
            {typeof projectCount === 'number' && projectCount > 0 && (
              <span className="ml-2 inline-block font-normal text-xs px-2 py-0.5 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]">
                {projectCount} projects
              </span>
            )}
          </p>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Curated interactive UI components, animations, and creative web experiments.
          </p>
        </div>

        {/* Right Actions & Repository Text Link */}
        <div className="flex items-center gap-4 sm:gap-5 text-xs text-[var(--text-secondary)]">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            id="footer-github-link"
            className="inline-flex items-center gap-1.5 hover:text-[#f95700] transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>{GITHUB_OWNER}/{GITHUB_REPO}</span>
          </a>

          <button
            onClick={scrollToTop}
            id="footer-back-to-top"
            aria-label="Back to top"
            className="inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <span>Top</span>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Bottom Copyright Text */}
      <div className="mt-6 pt-4 border-t border-[var(--card-border)]/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
        <p>© {currentYear} CodeWizard. All projects open-source under MIT license.</p>
        <p>Built with React, Vite & Tailwind CSS</p>
      </div>
    </footer>
  );
};
