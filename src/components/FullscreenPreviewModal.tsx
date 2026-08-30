import React, { useState, useMemo } from 'react';
import { X, RefreshCw, Monitor, Tablet, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { Project } from '../types';
import { compileProjectHtml, EnhancedCodeBundle } from '../utils/compiler';

interface FullscreenPreviewModalProps {
  project: Project | null;
  bundle: EnhancedCodeBundle | null;
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const FullscreenPreviewModal: React.FC<FullscreenPreviewModalProps> = ({
  project,
  bundle,
  isOpen,
  onClose,
  isDark = false,
}) => {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);

  const compiledHtml = useMemo(() => {
    if (!bundle || !project) return '';
    return compileProjectHtml(bundle, {
      isDark,
      title: project.title,
      projectName: project.name,
    });
  }, [bundle, project, isDark, reloadKey]);

  if (!isOpen || !project || !bundle) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#08090f] text-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#12131b] border-b border-[#212330] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Project title */}
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-white truncate max-w-[200px] sm:max-w-md">
            {project.title}
          </h2>
        </div>

        {/* Center: Device Switcher */}
        <div className="flex items-center bg-[#1b1c28] border border-[#2c2f42] rounded-xl p-1 gap-1">
          <button
            onClick={() => setDevice('desktop')}
            title="Desktop Mode (100%)"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              device === 'desktop' ? 'bg-[#f95700] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setDevice('tablet')}
            title="Tablet Mode (768px)"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              device === 'tablet' ? 'bg-[#f95700] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            title="Mobile Mode (375px)"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              device === 'mobile' ? 'bg-[#f95700] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsIframeLoaded(false);
              setReloadKey((k) => k + 1);
            }}
            title="Reload Screen"
            className="p-2 rounded-xl text-zinc-400 hover:text-[#f95700] hover:bg-[#1f2130] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            title="Close Fullscreen"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1f2130] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div className="flex-1 overflow-auto bg-[#07080d] p-3 sm:p-6 flex items-center justify-center">
        <motion.div
          layout
          className={`relative h-full max-h-full rounded-2xl overflow-hidden border border-[#262838] bg-[#0c0d14] shadow-2xl transition-all duration-300 flex items-center justify-center ${
            device === 'desktop'
              ? 'w-full'
              : device === 'tablet'
              ? 'w-[768px] max-w-full'
              : 'w-[375px] max-w-full'
          }`}
        >
          {!isIframeLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0c0d14] text-zinc-500">
              <RefreshCw className="w-7 h-7 animate-spin text-[#f95700]" />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Loading...
              </span>
            </div>
          )}

          <iframe
            key={`fullscreen-iframe-${project.id}-${reloadKey}`}
            srcDoc={compiledHtml}
            title={`${project.title} Fullscreen Sandbox`}
            sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
            onLoad={() => setIsIframeLoaded(true)}
            className={`w-full h-full border-none bg-transparent transition-opacity duration-300 ${
              isIframeLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </motion.div>
      </div>
    </div>
  );
};
