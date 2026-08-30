import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Play, RotateCcw, FileCode, Github, RefreshCw, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { Project } from '../types';
import { GITHUB_OWNER, GITHUB_REPO, GITHUB_REPO_URL, GITHUB_PAGES_URL } from '../data/projects';
import {
  updateProjectCode,
  getProjectCode,
  fetchActualProjectCode,
  EnhancedCodeBundle,
} from '../utils/compiler';

interface CodeInspectorModalProps {
  project: Project | null;
  initialBundle: EnhancedCodeBundle | null;
  isOpen: boolean;
  onClose: () => void;
  onRecompiled?: () => void;
}

type TabType = 'html' | 'css' | 'js';

export const CodeInspectorModal: React.FC<CodeInspectorModalProps> = ({
  project,
  initialBundle,
  isOpen,
  onClose,
  onRecompiled,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('html');
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [cssCode, setCssCode] = useState<string>('');
  const [jsCode, setJsCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [recompiledNotice, setRecompiledNotice] = useState<boolean>(false);
  const [isFetchingGithub, setIsFetchingGithub] = useState<boolean>(false);
  const [isFromGitHub, setIsFromGitHub] = useState<boolean>(false);

  // Sync state when project opens
  useEffect(() => {
    if (project) {
      const bundle = initialBundle || getProjectCode(project);
      setHtmlCode((bundle.html || '').trim());
      setCssCode((bundle.css || '').trim());
      setJsCode((bundle.js || '').trim());
      setIsFromGitHub(!!bundle.isFromGitHub);

      // If not yet from GitHub, attempt fetching real repo code
      if (!bundle.isFromGitHub) {
        setIsFetchingGithub(true);
        fetchActualProjectCode(project)
          .then((ghBundle) => {
            if (ghBundle) {
              setHtmlCode((ghBundle.html || '').trim());
              setCssCode((ghBundle.css || '').trim());
              setJsCode((ghBundle.js || '').trim());
              setIsFromGitHub(!!ghBundle.isFromGitHub);
            }
          })
          .finally(() => setIsFetchingGithub(false));
      }
    }
  }, [project, initialBundle]);

  if (!isOpen || !project) return null;

  const currentCode =
    activeTab === 'html' ? htmlCode : activeTab === 'css' ? cssCode : jsCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecompile = () => {
    const updated: EnhancedCodeBundle = {
      html: htmlCode,
      css: cssCode,
      js: jsCode,
      isFromGitHub: false,
    };
    updateProjectCode(project.name, updated);
    setRecompiledNotice(true);
    setTimeout(() => setRecompiledNotice(false), 2200);
    if (onRecompiled) onRecompiled();
  };

  const handleFetchFreshGitHub = async () => {
    setIsFetchingGithub(true);
    try {
      const ghBundle = await fetchActualProjectCode(project);
      setHtmlCode((ghBundle.html || '').trim());
      setCssCode((ghBundle.css || '').trim());
      setJsCode((ghBundle.js || '').trim());
      setIsFromGitHub(true);
      if (onRecompiled) onRecompiled();
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const handleResetOriginal = () => {
    const original = getProjectCode(project);
    setHtmlCode((original.html || '').trim());
    setCssCode((original.css || '').trim());
    setJsCode((original.js || '').trim());
    updateProjectCode(project.name, original);
    if (onRecompiled) onRecompiled();
  };

  const githubFolderUrl = `${GITHUB_REPO_URL}/tree/main/${encodeURIComponent(project.name)}`;
  const livePagesUrl = `${GITHUB_PAGES_URL}/${encodeURIComponent(project.name)}/`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-[#13141c] border border-[#27293a] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
      >
        {/* Top Header */}
        <div className="bg-[#191a25] border-b border-[#27293a] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#f95700]/15 border border-[#f95700]/30 flex items-center justify-center text-[#f95700]">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-snug">
                {project.title}
              </h3>
              <p className="text-xs text-zinc-400 font-mono truncate max-w-md">
                {GITHUB_OWNER}/{GITHUB_REPO}/{project.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={livePagesUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Live Page"
              className="p-2 rounded-xl text-zinc-400 hover:text-[#f95700] hover:bg-[#252738] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={githubFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open folder on GitHub"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#252738] transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#252738] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="bg-[#151620] border-b border-[#232535] px-5 py-2.5 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('html')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'html'
                  ? 'bg-[#f95700] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#222434]'
              }`}
            >
              index.html
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'css'
                  ? 'bg-[#f95700] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#222434]'
              }`}
            >
              style.css
            </button>
            <button
              onClick={() => setActiveTab('js')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'js'
                  ? 'bg-[#f95700] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#222434]'
              }`}
            >
              script.js
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleFetchFreshGitHub}
              title="Pull latest code directly from GitHub repository"
              disabled={isFetchingGithub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202230] border border-[#2f3246] text-xs font-semibold text-zinc-300 hover:text-[#f95700] hover:bg-[#282a3c] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingGithub ? 'animate-spin text-[#f95700]' : ''}`} />
              <span className="hidden sm:inline">Fetch from GitHub</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202230] border border-[#2f3246] text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#282a3c] transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleResetOriginal}
              title="Reset code"
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#252738] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 p-4 bg-[#0a0a0f] overflow-hidden flex flex-col">
          <textarea
            value={
              activeTab === 'html' ? htmlCode : activeTab === 'css' ? cssCode : jsCode
            }
            onChange={(e) => {
              const val = e.target.value;
              if (activeTab === 'html') setHtmlCode(val);
              else if (activeTab === 'css') setCssCode(val);
              else setJsCode(val);
            }}
            placeholder={`Enter ${activeTab.toUpperCase()} code here...`}
            spellCheck={false}
            className="w-full h-full min-h-[300px] bg-transparent text-zinc-200 font-mono text-xs sm:text-sm p-4 outline-none border border-[#1e202e] rounded-2xl resize-none leading-relaxed focus:border-[#f95700]/50"
          />
        </div>

        {/* Footer Actions */}
        <div className="bg-[#191a25] border-t border-[#27293a] px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            {recompiledNotice && (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Recompiled & Updated Live Screen!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleRecompile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#f95700] hover:bg-[#e04e00] text-white font-bold text-xs shadow-[0_4px_16px_rgba(249,87,0,0.35)] transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Recompile & Run</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
