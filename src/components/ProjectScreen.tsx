import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Project } from '../types';
import {
  compileProjectHtml,
  getProjectCode,
  fetchActualProjectCode,
  EnhancedCodeBundle,
} from '../utils/compiler';

interface ProjectScreenProps {
  project: Project;
  isDark?: boolean;
  onOpenFullscreen?: (project: Project, bundle: EnhancedCodeBundle) => void;
  onToggleCodeInspector?: (project: Project, bundle: EnhancedCodeBundle) => void;
  className?: string;
}

export const ProjectScreen: React.FC<ProjectScreenProps> = ({
  project,
  isDark = false,
  className = '',
}) => {
  const [reloadKey] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);
  const [codeBundle, setCodeBundle] = useState<EnhancedCodeBundle>(() => getProjectCode(project));
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy viewport activation via IntersectionObserver for silky smooth performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin: '350px 0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fetch actual code directly from GitHub repository folder
  useEffect(() => {
    let isCurrent = true;
    if (isVisible) {
      fetchActualProjectCode(project)
        .then((fetchedBundle) => {
          if (isCurrent && fetchedBundle) {
            setCodeBundle(fetchedBundle);
          }
        })
        .catch(() => {});
    }

    return () => {
      isCurrent = false;
    };
  }, [project, isVisible]);

  const compiledSrcDoc = useMemo(() => {
    return compileProjectHtml(codeBundle, {
      isDark,
      title: project.title,
      projectName: project.name,
    });
  }, [codeBundle, isDark, project.title, project.name, reloadKey]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-[var(--card-border)] bg-[#0c0d12] transition-all duration-200 flex flex-col ${className}`}
    >
      {/* Screen Frame Viewport */}
      <div className="relative w-full h-[240px] sm:h-[280px] bg-[#0c0d12] overflow-hidden flex items-center justify-center">
        {/* Animated Loader while loading */}
        {(!isVisible || !isIframeLoaded) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0c0d12] text-zinc-500">
            <div className="relative flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-[#f95700]" />
            </div>
            <span className="text-[11px] font-mono text-zinc-500 tracking-wide uppercase">
              Loading...
            </span>
          </div>
        )}

        {isVisible && (
          <iframe
            key={`iframe-${project.id}-${reloadKey}-${codeBundle.isFromGitHub ? 'gh' : 'local'}`}
            srcDoc={compiledSrcDoc}
            title={project.title}
            sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
            onLoad={() => setIsIframeLoaded(true)}
            className={`w-full h-full border-none select-none bg-transparent transition-opacity duration-300 ${
              isIframeLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
};
