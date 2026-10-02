import React, { useState, useEffect } from "react";
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Trash2, X, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Profile } from "../../types";
import { ref, onValue, remove } from "firebase/database";
import { rtdb } from "../../lib/firebase";

export interface CallLogItem {
  id: string;
  callSessionId: string;
  callerId: string;
  callerName: string;
  callerRegNumber?: string;
  callerPhoto?: string;
  receiverId: string;
  receiverName: string;
  receiverRegNumber?: string;
  receiverPhoto?: string;
  callType: "audio" | "video";
  status: "Accepted" | "Missed" | "Declined";
  timestamp: number;
  durationSeconds?: number;
}

interface CallHistoryProps {
  currentProfile: Profile;
  allProfiles: Profile[];
  onClose?: () => void;
  onCallBack?: (targetProfile: Profile, callType: "audio" | "video") => void;
}

export default function CallHistory({
  currentProfile,
  allProfiles,
  onClose,
  onCallBack,
}: CallHistoryProps) {
  const [logs, setLogs] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "MISSED" | "ACCEPTED">("ALL");

  useEffect(() => {
    if (!currentProfile?.id) return;

    setLoading(true);

    // 1. Listen to RTDB logs under call_history/${currentProfile.id}
    const historyRef = ref(rtdb, `call_history/${currentProfile.id}`);
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      let rtdbList: CallLogItem[] = [];

      if (data) {
        rtdbList = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          callSessionId: val.callSessionId || id,
          callerId: val.callerId || "",
          callerName: val.callerName || "Member",
          callerRegNumber: val.callerRegNumber || "SHUBH",
          callerPhoto: val.callerPhoto,
          receiverId: val.receiverId || "",
          receiverName: val.receiverName || "Member",
          receiverRegNumber: val.receiverRegNumber || "SHUBH",
          receiverPhoto: val.receiverPhoto,
          callType: val.callType || "video",
          status: val.status || "Missed",
          timestamp: val.timestamp || Date.now(),
          durationSeconds: val.durationSeconds || 0,
        }));
      }

      // 2. Merge with localStorage logs for local fallback
      try {
        const localData = JSON.parse(
          localStorage.getItem(`call_history_${currentProfile.id}`) || "[]"
        );
        const merged = [...rtdbList];

        localData.forEach((item: any) => {
          if (!merged.some((m) => m.id === item.id || m.callSessionId === item.callSessionId)) {
            merged.push({
              id: item.id || `local-${Date.now()}-${Math.random()}`,
              callSessionId: item.callSessionId || `session-${Date.now()}`,
              callerId: item.callerId || (item.direction === "outgoing" ? currentProfile.id : "peer"),
              callerName: item.callerName || (item.direction === "outgoing" ? currentProfile.name : "Member"),
              callerRegNumber: item.callerRegNumber || "SHUBH",
              callerPhoto: item.callerPhoto,
              receiverId: item.receiverId || (item.direction === "outgoing" ? "peer" : currentProfile.id),
              receiverName: item.receiverName || "Member",
              receiverRegNumber: item.receiverRegNumber || "SHUBH",
              receiverPhoto: item.receiverPhoto,
              callType: item.callType || "video",
              status: item.status || (item.direction === "outgoing" ? "Accepted" : "Missed"),
              timestamp: item.timestamp || Date.now(),
              durationSeconds: item.durationSeconds || 0,
            });
          }
        });

        // Sort descending by timestamp
        merged.sort((a, b) => b.timestamp - a.timestamp);
        setLogs(merged);
      } catch (e) {
        setLogs(rtdbList);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentProfile.id]);

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your call history log?")) return;
    try {
      localStorage.removeItem(`call_history_${currentProfile.id}`);
      const historyRef = ref(rtdb, `call_history/${currentProfile.id}`);
      await remove(historyRef).catch(() => {});
      setLogs([]);
    } catch (e) {
      console.error("Failed to clear call history:", e);
    }
  };

  const formatDuration = (secs?: number) => {
    if (!secs || secs <= 0) return "00s";
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins > 0) {
      return `${mins}m ${remainingSecs}s`;
    }
    return `${remainingSecs}s`;
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredLogs = logs.filter((item) => {
    if (filter === "MISSED") return item.status === "Missed";
    if (filter === "ACCEPTED") return item.status === "Accepted";
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden max-w-2xl w-full mx-auto">
      {/* Header */}
      <div className="bg-[#362B5A] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-2xl border border-amber-400/40 text-amber-300">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wide text-white">Call Logs & History</h3>
            <p className="text-xs text-amber-200/80 font-mono">
              Real-time Audio & Video Call Records ({logs.length})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="p-2 text-rose-300 hover:text-white hover:bg-rose-600/30 rounded-xl transition cursor-pointer"
              title="Clear Call Log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 bg-stone-50 border-b border-stone-200 flex gap-2">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            filter === "ALL"
              ? "bg-[#362B5A] text-white shadow-xs"
              : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
          }`}
        >
          All Calls ({logs.length})
        </button>
        <button
          onClick={() => setFilter("MISSED")}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
            filter === "MISSED"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-rose-600 border border-stone-200 hover:bg-rose-50"
          }`}
        >
          <PhoneMissed className="w-3.5 h-3.5" />
          <span>Missed ({logs.filter((l) => l.status === "Missed").length})</span>
        </button>
        <button
          onClick={() => setFilter("ACCEPTED")}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
            filter === "ACCEPTED"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-emerald-600 border border-stone-200 hover:bg-emerald-50"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Connected ({logs.filter((l) => l.status === "Accepted").length})</span>
        </button>
      </div>

      {/* Logs List */}
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="text-center py-12 text-stone-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
            <p className="text-xs font-semibold">Loading call history logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-stone-400 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-sm font-extrabold text-stone-600">No Call Records Found</p>
            <p className="text-xs text-stone-400">
              Your audio and video call history will appear here automatically.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isOutgoing = log.callerId === currentProfile.id;
            const peerId = isOutgoing ? log.receiverId : log.callerId;
            const peerName = isOutgoing ? log.receiverName : log.callerName;
            const peerReg = isOutgoing ? log.receiverRegNumber : log.callerRegNumber;
            const peerPhoto = isOutgoing ? log.receiverPhoto : log.callerPhoto;
            const foundPeer = allProfiles.find((p) => p.id === peerId);

            return (
              <div
                key={log.id}
                className="bg-white border border-stone-200 hover:border-amber-400/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={
                        peerPhoto ||
                        foundPeer?.photo_url ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                      }
                      alt={peerName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-stone-200"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 bg-[#362B5A] text-amber-300 rounded-full border border-white">
                      {log.callType === "video" ? (
                        <Video className="w-3 h-3" />
                      ) : (
                        <Phone className="w-3 h-3" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-[#362B5A] truncate">
                        {peerName}
                      </h4>
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md">
                        {peerReg || "SHUBH"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
                      {isOutgoing ? (
                        <span className="text-blue-600 flex items-center gap-1 font-semibold">
                          <PhoneOutgoing className="w-3 h-3" /> Outgoing
                        </span>
                      ) : (
                        <span className="text-purple-600 flex items-center gap-1 font-semibold">
                          <PhoneIncoming className="w-3 h-3" /> Incoming
                        </span>
                      )}
                      <span>•</span>
                      <span>{formatTime(log.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    {log.status === "Accepted" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Connected</span>
                      </span>
                    ) : log.status === "Declined" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-stone-700 bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200">
                        <XCircle className="w-3.5 h-3.5 text-stone-500" />
                        <span>Declined</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                        <PhoneMissed className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                        <span>Missed</span>
                      </span>
                    )}

                    {log.status === "Accepted" && (
                      <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                        Duration: {formatDuration(log.durationSeconds)}
                      </p>
                    )}
                  </div>

                  {onCallBack && foundPeer && (
                    <button
                      onClick={() => onCallBack(foundPeer, log.callType)}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center"
                      title={`Call back ${foundPeer.name}`}
                    >
                      {log.callType === "video" ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
