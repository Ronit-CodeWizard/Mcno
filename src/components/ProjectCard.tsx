import React from 'react';
import { ChevronDown, Folder, Code2, Maximize2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';
import { GITHUB_REPO_URL, getProjectCodeFiles } from '../data/projects';
import { ProjectScreen } from './ProjectScreen';
import { EnhancedCodeBundle } from '../utils/compiler';

interface ProjectCardProps {
  project: Project;
  index?: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isDark?: boolean;
  onOpenFullscreen?: (project: Project, bundle: EnhancedCodeBundle) => void;
  onToggleCodeInspector?: (project: Project, bundle: EnhancedCodeBundle) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index = 0,
  isExpanded,
  onToggleExpand,
  isDark = false,
  onOpenFullscreen,
  onToggleCodeInspector,
}) => {
  const sourceFolderUrl = project.sourceUrl || `${GITHUB_REPO_URL}/tree/main/${project.name}`;

  // Code files only without folder name
  const codeFiles = project.files && project.files.length > 0
    ? project.files
    : getProjectCodeFiles(project.name);

  return (
    <motion.div
      id={`project-card-${project.id}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{
        duration: 0.42,
        delay: Math.min((index % 8) * 0.045, 0.28),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`w-full bg-[var(--card-bg)] border ${
        isExpanded
          ? 'border-[#f95700]/50 shadow-[0_8px_32px_rgba(249,87,0,0.12),0_2px_8px_rgba(0,0,0,0.04)]'
          : 'border-[var(--card-border)] hover:border-[#f95700]/40 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
      } rounded-[24px] sm:rounded-[28px] p-4.5 sm:p-5.5 transition-all duration-300 overflow-hidden flex flex-col gap-3.5`}
    >
      {/* Header Row with Project Title and Expand Toggle */}
      <div className="flex items-center justify-between gap-3">
        {/* Project Title */}
        <div
          onClick={onToggleExpand}
          className="cursor-pointer select-none flex-1"
        >
          <h3
            className={`text-lg sm:text-xl font-bold leading-tight tracking-tight transition-colors ${
              isExpanded ? 'text-[#f95700]' : 'text-[var(--text-primary)] hover:text-[#f95700]'
            }`}
          >
            {project.title}
          </h3>
        </div>

        {/* Accordion Toggle Chevron Button: Solid Orange with Smooth Rotating Icon */}
        <button
          onClick={onToggleExpand}
          id={`toggle-card-${project.id}`}
          aria-label={isExpanded ? 'Collapse project card' : 'Expand project card'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-[#f95700] hover:bg-[#e04e00] active:scale-90 text-white shadow-[0_4px_14px_rgba(249,87,0,0.35)] hover:shadow-[0_6px_20px_rgba(249,87,0,0.45)] transition-all duration-200 cursor-pointer shrink-0"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center"
          >
            <ChevronDown className="w-5 h-5 stroke-[2.5]" />
          </motion.div>
        </button>
      </div>

      {/* Embedded Live Screen on the Card: Shows Self-Compiled Code Running Live */}
      <ProjectScreen
        project={project}
        isDark={isDark}
        onOpenFullscreen={onOpenFullscreen}
        onToggleCodeInspector={onToggleCodeInspector}
      />

      {/* Expanded Accordion Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key={`expanded-content-${project.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: 'auto',
              transition: {
                height: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.25, delay: 0.05 },
              },
            }}
            exit={{
              opacity: 0,
              height: 0,
              transition: {
                height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.15 },
              },
            }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-[#ededeb] dark:border-zinc-800/80 space-y-4">
              {/* Description */}
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {project.description}
              </p>

              {/* Code Files tags for this project without folder names */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.08 }}
                className="flex flex-wrap gap-2"
              >
                {codeFiles.map((file, idx) => (
                  <span
                    key={idx}
                    className="bg-[var(--chip-bg)] border border-[var(--chip-border)] rounded-xl px-3 py-1 text-xs font-mono font-medium text-[var(--text-primary)] shadow-2xs select-none flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f95700]" />
                    {file}
                  </span>
                ))}
              </motion.div>

              {/* Action Buttons: Inspect & Edit Code, Fullscreen Sandbox, Source Repo */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.08 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1"
              >
                {/* 1. Inspect & Edit Code */}
                <button
                  onClick={() => onToggleCodeInspector?.(project, null as any)}
                  id={`inspect-code-${project.id}`}
                  className="w-full bg-[#1e202c] hover:bg-[#282a3c] border border-[#313448] text-white font-bold text-xs py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Code2 className="w-4 h-4 text-[#f95700]" />
                  <span>Inspect Code</span>
                </button>

                {/* 2. Fullscreen Theater Sandbox */}
                <button
                  onClick={() => onOpenFullscreen?.(project, null as any)}
                  id={`fullscreen-theater-${project.id}`}
                  className="w-full bg-[#f95700] hover:bg-[#e04e00] text-white font-bold text-xs py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(249,87,0,0.3)] transition-all cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Fullscreen Mode</span>
                </button>

                {/* 3. GitHub Source Repo */}
                <a
                  href={sourceFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  id={`source-repo-${project.id}`}
                  className="w-full border border-[var(--card-border)] hover:border-[#f95700]/50 text-[var(--text-secondary)] hover:text-[#f95700] bg-[var(--chip-bg)] font-bold text-xs py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer no-underline"
                >
                  <Folder className="w-4 h-4" />
                  <span>Source Repo</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
