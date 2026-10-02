import React, { useState, useEffect } from "react";
import { Play, Download, RefreshCw, HardDrive, ShieldCheck, Film, Mic, FileText, Search, ExternalLink, Calendar, CheckCircle2 } from "lucide-react";

interface CallRecordingItem {
  key: string;
  fileName: string;
  sizeBytes: number;
  lastModified: string;
  playbackUrl: string;
}

export default function CallRecordingsDesk() {
  const [recordings, setRecordings] = useState<CallRecordingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlaybackUrl, setActivePlaybackUrl] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>("");
  const [r2Info, setR2Info] = useState<any>(null);

  const fetchRecordings = async () => {
    setLoading(true);
    setError("");
    try {
      const [recRes, statusRes] = await Promise.all([
        fetch("/api/recordings/list"),
        fetch("/api/recordings/r2-status")
      ]);

      const recData = await recRes.json();
      const statusData = await statusRes.json();

      setR2Info(statusData);

      if (recData.success) {
        setRecordings(recData.recordings || []);
      } else {
        setError(recData.error || "Failed to load call recordings");
      }
    } catch (err: any) {
      setError("Network error fetching call recordings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredRecordings = recordings.filter(item =>
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cloudflare R2 Storage Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-white rounded-2xl p-6 shadow-xl border border-amber-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-400/30">
              <HardDrive className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-amber-100">Cloudflare R2 Call Recordings Desk</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active & Connected
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-1">
                Bucket: <span className="font-mono text-amber-300">{r2Info?.bucketName || "shubhamastu-call-recordings"}</span> | 10 GB/month FREE ($0 Egress Fees)
              </p>
            </div>
          </div>

          <button
            onClick={fetchRecordings}
            disabled={loading}
            className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 rounded-xl text-sm font-medium transition flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh Recordings
          </button>
        </div>
      </div>

      {/* Active Audio / Video Player Modal / Overlay */}
      {activePlaybackUrl && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative animate-fade-in">
          <div className="flex items-center justify-between mb-4 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-amber-100 text-sm">Playing: {activeFileName}</h3>
            </div>
            <button
              onClick={() => setActivePlaybackUrl(null)}
              className="text-xs px-3 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded-lg border border-amber-500/30 transition"
            >
              Close Media Player
            </button>
          </div>
          
          <div className="flex justify-center bg-black/80 rounded-xl p-4 border border-amber-500/20">
            {activeFileName.endsWith(".mp4") || activeFileName.endsWith(".webm") ? (
              <video
                src={activePlaybackUrl}
                controls
                autoPlay
                className="max-h-[400px] w-full rounded-lg shadow-lg"
              />
            ) : (
              <audio
                src={activePlaybackUrl}
                controls
                autoPlay
                className="w-full max-w-xl"
              />
            )}
          </div>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur border border-amber-900/10 p-4 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-amber-800/50 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search call recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-amber-50/50 border border-amber-900/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="text-xs text-amber-900/70 font-medium">
          Showing <span className="font-bold text-amber-900">{filteredRecordings.length}</span> recorded call file(s)
        </div>
      </div>

      {/* Recordings Table / List */}
      {loading ? (
        <div className="p-12 text-center bg-white/60 rounded-2xl border border-amber-900/10 shadow-sm">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-3" />
          <p className="text-amber-900/70 font-medium text-sm">Fetching call recordings from Cloudflare R2...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 text-red-800 rounded-2xl border border-red-200">
          <p className="font-semibold text-sm mb-1">{error}</p>
          <p className="text-xs text-red-600">Please verify your Cloudflare R2 bucket credentials.</p>
        </div>
      ) : filteredRecordings.length === 0 ? (
        <div className="p-12 text-center bg-white/80 rounded-2xl border border-amber-900/10 shadow-sm">
          <Mic className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-amber-900 text-base mb-1">No Call Recordings Found Yet</h3>
          <p className="text-xs text-amber-800/70 max-w-md mx-auto">
            When users make audio or video calls on Shubhamastu.in, recorded streams will automatically sync here in your Cloudflare R2 bucket.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-amber-900/10 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-900/5 text-amber-900 font-semibold border-b border-amber-900/10 text-xs">
                <tr>
                  <th className="py-3 px-4">Recording File Key</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Date Recorded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10 text-amber-950">
                {filteredRecordings.map((item, idx) => {
                  const isVideo = item.fileName.endsWith(".mp4") || item.fileName.endsWith(".webm");
                  return (
                    <tr key={idx} className="hover:bg-amber-50/50 transition">
                      <td className="py-3 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          {isVideo ? (
                            <Film className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          ) : (
                            <Mic className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          )}
                          <span className="truncate max-w-xs">{item.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-amber-900/80">
                        {formatFileSize(item.sizeBytes)}
                      </td>
                      <td className="py-3 px-4 text-xs text-amber-900/80">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          {new Date(item.lastModified).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.playbackUrl && (
                            <>
                              <button
                                onClick={() => {
                                  setActivePlaybackUrl(item.playbackUrl);
                                  setActiveFileName(item.fileName);
                                }}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 shadow-sm"
                              >
                                <Play className="w-3.5 h-3.5" /> Stream
                              </button>
                              <a
                                href={item.playbackUrl}
                                download={item.fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition flex items-center gap-1 border border-stone-200"
                              >
                                <Download className="w-3.5 h-3.5" /> Download
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
