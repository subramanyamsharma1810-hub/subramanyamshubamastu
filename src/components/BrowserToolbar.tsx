import React, { useState } from "react";
import { Lock, RotateCw, ChevronLeft, ChevronRight, Copy, Check, ExternalLink } from "lucide-react";

interface BrowserToolbarProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
}

export function BrowserToolbar({ currentPath }: BrowserToolbarProps) {
  const [copied, setCopied] = useState(false);
  const hostname = typeof window !== "undefined" ? window.location.hostname : "www.shubhamastu.in";
  const displayDomain = hostname.includes("shubhamastu.in") ? hostname : "www.shubhamastu.in";
  const fullUrl = `https://${displayDomain}${currentPath.startsWith("/") ? currentPath : `/${currentPath}`}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1e1e24] text-zinc-300 px-3 py-2 border-b border-zinc-800 flex items-center justify-between gap-3 text-xs font-mono select-none z-[100] sticky top-0 shadow-md">
      {/* Mac-style Window Dots */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
        <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
      </div>

      {/* Navigation Arrows */}
      <div className="hidden sm:flex items-center gap-1 text-zinc-500">
        <button className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer" title="Back">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer" title="Forward">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => window.location.reload()} className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer" title="Reload">
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Realistic Address Bar */}
      <div className="flex-1 max-w-2xl bg-[#121215] border border-zinc-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2 text-zinc-200 shadow-inner group focus-within:border-amber-400/80 transition-all">
        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-zinc-500 shrink-0 select-none">https://</span>
        <span className="font-bold text-white tracking-wide shrink-0">{displayDomain}</span>
        <span className="text-amber-400/90 font-bold truncate">
          {currentPath === "/" ? "" : (currentPath.startsWith("/") ? currentPath : `/${currentPath}`)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleCopy}
          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-bold text-[11px] border border-zinc-700"
          title="Copy Domain URL"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 hidden md:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Copy URL</span>
            </>
          )}
        </button>
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-all cursor-pointer border border-zinc-700 flex items-center gap-1 text-[11px]"
          title="Open in New Tab"
        >
          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
        </a>
      </div>
    </div>
  );
}
