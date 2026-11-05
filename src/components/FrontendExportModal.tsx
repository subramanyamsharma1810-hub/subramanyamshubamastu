import React, { useState } from "react";
import { 
  Download, 
  Share2, 
  Mail, 
  MessageCircle, 
  Copy, 
  Check, 
  FileCode, 
  FolderArchive, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  X, 
  Send,
  Layers,
  Code2
} from "lucide-react";

interface FrontendExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FrontendExportModal({ isOpen, onClose }: FrontendExportModalProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState("");
  const [downloadingZip, setDownloadingZip] = useState(false);

  if (!isOpen) return null;

  // Resolve base URL dynamically or fallback to production URL
  const origin = typeof window !== "undefined" && window.location.origin 
    ? window.location.origin 
    : "https://ais-pre-jr7vjinyphtz42ys53amum-666488258388.asia-east1.run.app";

  const allInOneZipUrl = `${origin}/api/download-frontend`;
  const rawZipUrl = `${origin}/api/download/raw-zip`;
  const rawHtmlUrl = `${origin}/api/download/raw/index.html`;
  const rawCssUrl = `${origin}/api/download/raw/style.css`;
  const rawJsUrl = `${origin}/api/download/raw/script.js`;
  const livePreviewUrl = origin;

  // Pre-formatted messages for WhatsApp and Email
  const shareMessageText = `*Shubhamastu Brahmin Matrimony - Complete Frontend Files Package*\n\n` +
    `Hello! Here is the complete frontend source code and standalone files package for Shubhamastu Vivaha Vedika:\n\n` +
    `📦 *Direct ZIP Download (All 69 Frontend Files):*\n` +
    `${allInOneZipUrl}\n\n` +
    `🌐 *Live Preview:*\n` +
    `${livePreviewUrl}\n\n` +
    `📄 *Package Includes:*\n` +
    `• Standalone Ready-to-Run: index.html, style.css, script.js\n` +
    `• Full React & TypeScript Source: App.tsx, index.css, all 35+ components\n` +
    `• Configuration: package.json, vite.config.ts, tsconfig.json\n\n` +
    `You can extract the ZIP and open index.html directly in your browser or edit in VS Code.`;

  const emailSubject = "Shubhamastu Vivaha Vedika - Complete Frontend Files Package (Download Link)";
  const emailBody = `Hello,\n\nHere are the complete frontend source files for the Shubhamastu Brahmin Matrimony web application:\n\n` +
    `1. DIRECT ZIP DOWNLOAD (All Frontend Files & Source):\n${allInOneZipUrl}\n\n` +
    `2. STANDALONE 3-FILES (HTML + CSS + JS) ZIP:\n${rawZipUrl}\n\n` +
    `3. LIVE WEB PREVIEW:\n${livePreviewUrl}\n\n` +
    `WHAT IS INCLUDED IN THIS PACKAGE:\n` +
    `- Standalone index.html, style.css, script.js (opens instantly in any web browser)\n` +
    `- Full React + TypeScript source code (/src folder with all 35+ components)\n` +
    `- Tailwind CSS styling rules & configurations\n` +
    `- Project configs (package.json, vite.config.ts, tsconfig.json)\n\n` +
    `Best regards,\nSubramanyam Ghadiyaram\nShubhamastu Vivaha Vedika Development Team`;

  const handleCopyLink = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessageText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleSendEmail = (targetRecipient?: string) => {
    const to = targetRecipient || customEmail || "";
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  };

  const triggerDownload = (url: string, filename: string) => {
    setDownloadingZip(true);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadingZip(false), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#13111C] border border-amber-500/40 rounded-3xl max-w-3xl w-full p-5 sm:p-8 shadow-2xl relative text-left text-zinc-100 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full transition-all cursor-pointer z-10"
          title="Close Dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-zinc-800 pb-4 mb-5 shrink-0">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-widest font-black">
            <Sparkles className="w-4 h-4" />
            <span>Developer File Dispatch & Sharing Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2.5">
            <FolderArchive className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
            Download & Send All Frontend Files
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Download the complete frontend source package or directly forward it to collaborators via WhatsApp and Email.
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-sm scrollbar-thin scrollbar-thumb-zinc-700">
          
          {/* TOP PRIMARY ACTIONS: WHATSAPP & EMAIL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* WhatsApp Share Card */}
            <div className="bg-gradient-to-br from-emerald-950/70 to-zinc-900 border border-emerald-500/50 p-4 rounded-2xl relative overflow-hidden group hover:border-emerald-400 transition-all shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm uppercase tracking-wide">
                    <MessageCircle className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                    Share via WhatsApp
                  </div>
                  <p className="text-xs text-zinc-300 mt-1">
                    Send direct download link and full project overview in 1 tap to any WhatsApp contact or group.
                  </p>
                </div>
              </div>
              <button
                onClick={handleShareWhatsApp}
                className="mt-4 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Open WhatsApp & Forward
              </button>
            </div>

            {/* Email Share Card */}
            <div className="bg-gradient-to-br from-blue-950/70 to-zinc-900 border border-blue-500/50 p-4 rounded-2xl relative overflow-hidden group hover:border-blue-400 transition-all shadow-lg">
              <div>
                <div className="flex items-center gap-2 text-blue-400 font-extrabold text-sm uppercase tracking-wide">
                  <Mail className="w-5 h-5 text-blue-400 fill-blue-400/20" />
                  Send via Email
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  Sends formatted email containing download link, file breakdown, and instructions.
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  placeholder="Recipient email (optional)"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={() => handleSendEmail()}
                  className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider shrink-0 shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Mail
                </button>
              </div>
              <button
                onClick={() => handleSendEmail("subramanyamghadiyaram@gmail.com")}
                className="mt-2 text-[11px] text-blue-300 hover:text-blue-200 underline cursor-pointer block text-left"
              >
                Quick Send to: subramanyamghadiyaram@gmail.com
              </button>
            </div>
          </div>

          {/* MAIN DOWNLOAD SECTION */}
          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-amber-300 flex items-center gap-2">
                  <Download className="w-5 h-5 text-amber-400" />
                  Download Complete Frontend Source Package
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Contains all 69 files (1.6 MB): React source code, components, styles, HTML, and standalone bundles.
                </p>
              </div>
              <button
                onClick={() => triggerDownload(allInOneZipUrl, "shubhamastu-all-frontend-files.zip")}
                disabled={downloadingZip}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                {downloadingZip ? "Starting Download..." : "Download All-In-One ZIP (1.6 MB)"}
              </button>
            </div>

            {/* Direct Copy of Link */}
            <div className="flex items-center gap-2 bg-black/60 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 truncate flex-1 select-all">
                {allInOneZipUrl}
              </span>
              <button
                onClick={() => handleCopyLink(allInOneZipUrl, "all-zip")}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                {copiedType === "all-zip" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* STANDALONE 3 RAW FILES OPTION (index.html, style.css, script.js) */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-400" />
                Standalone Ready-to-Run Files (HTML + CSS + JS)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                For developers or reviewers who do not want to run npm: these 3 files run directly when opened in any browser or code editor.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* index.html */}
              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-300 font-mono text-xs font-bold">
                    <FileCode className="w-4 h-4 text-amber-400" />
                    index.html
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-1">Main DOM & entry container</span>
                </div>
                <button
                  onClick={() => triggerDownload(rawHtmlUrl, "index.html")}
                  className="mt-3 py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <Download className="w-3 h-3" />
                  Download HTML
                </button>
              </div>

              {/* style.css */}
              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-blue-300 font-mono text-xs font-bold">
                    <Layers className="w-4 h-4 text-blue-400" />
                    style.css
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-1">Full design & layout rules (197 KB)</span>
                </div>
                <button
                  onClick={() => triggerDownload(rawCssUrl, "style.css")}
                  className="mt-3 py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <Download className="w-3 h-3" />
                  Download CSS
                </button>
              </div>

              {/* script.js */}
              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-yellow-300 font-mono text-xs font-bold">
                    <FileText className="w-4 h-4 text-yellow-400" />
                    script.js
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-1">Compiled app logic & interactions</span>
                </div>
                <button
                  onClick={() => triggerDownload(rawJsUrl, "script.js")}
                  className="mt-3 py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <Download className="w-3 h-3" />
                  Download JS
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => triggerDownload(rawZipUrl, "shubhamastu-raw-html-css-js.zip")}
                className="text-xs text-amber-300 hover:text-amber-200 underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Or download just these 3 files bundled in ZIP (1.2 MB)
              </button>
            </div>
          </div>

          {/* PACKAGE FILE MANIFEST SUMMARY */}
          <div className="bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800/60 text-xs text-zinc-400 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-bold block">
              Package Manifest Summary (69 files total):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-300 font-mono">
              <div className="bg-black/30 p-2 rounded-lg">• index.html (Root)</div>
              <div className="bg-black/30 p-2 rounded-lg">• style.css / index.css</div>
              <div className="bg-black/30 p-2 rounded-lg">• script.js / App.tsx</div>
              <div className="bg-black/30 p-2 rounded-lg">• 35+ React Components</div>
              <div className="bg-black/30 p-2 rounded-lg">• package.json</div>
              <div className="bg-black/30 p-2 rounded-lg">• vite.config.ts</div>
              <div className="bg-black/30 p-2 rounded-lg">• tsconfig.json</div>
              <div className="bg-black/30 p-2 rounded-lg">• types.ts & lib/</div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="border-t border-zinc-800 pt-3 mt-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            onClick={() => handleCopyLink(shareMessageText, "full-msg")}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
          >
            {copiedType === "full-msg" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">WhatsApp/Email text message copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy preformatted share message</span>
              </>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
