import React, { useState, useEffect, useCallback } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Profile } from "../../types";
import { ref, onValue, update, remove } from "firebase/database";
import { rtdb } from "../../lib/firebase";
import { updateCallHistoryRecord } from "../../lib/callHistory";

interface IncomingCallModalProps {
  currentProfile: Profile | null;
  onAcceptCall: (callSessionId: string, callType: "audio" | "video") => void;
  allProfiles: Profile[];
  isInActiveCall?: boolean;
}

export default function IncomingCallModal({ 
  currentProfile, 
  onAcceptCall, 
  allProfiles,
  isInActiveCall = false
}: IncomingCallModalProps) {
  const [incomingSession, setIncomingSession] = useState<any | null>(null);
  const [callerProfile, setCallerProfile] = useState<Profile | null>(null);
  const [processing, setProcessing] = useState(false);

  // Helper to map caller details
  const resolveCaller = useCallback((callerId: string, fallbackName?: string, fallbackReg?: string) => {
    const found = allProfiles.find(p => p.id === callerId);
    return found || {
      id: callerId,
      name: fallbackName || "Member",
      reg_number: fallbackReg || "SHUBH",
      gender: "Male" as const,
      dob: "1995-01-01",
      height_feet: 5.8,
      sub_caste: "Brahmin",
      profession: "Professional",
      salary_lpa: 10,
      contact_number: "",
      status: "Verified" as const
    };
  }, [allProfiles]);

  useEffect(() => {
    // Stop if user is not authenticated, has no valid dynamic ID, or is already inside an active call
    if (!currentProfile?.id || isInActiveCall) {
      setIncomingSession(null);
      setCallerProfile(null);
      return;
    }

    const userId = currentProfile.id;

    // 1. WebSocket / Realtime Database Listener (Real-time push, zero HTTP polling)
    const myCallsRef = ref(rtdb, `calls/${userId}`);
    const unsubscribeRtdb = onValue(myCallsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        // Fallback check localStorage for cross-tab signals
        const localCall = localStorage.getItem(`incoming_call_${userId}`);
        if (localCall) {
          try {
            const parsed = JSON.parse(localCall);
            if (parsed.status === "RINGING") {
              setIncomingSession(parsed);
              setCallerProfile(resolveCaller(parsed.callerId, parsed.callerName, parsed.callerRegNumber));
              return;
            }
          } catch (e) {}
        }
        setIncomingSession(null);
        setCallerProfile(null);
        return;
      }

      const sessions = Object.entries(data).map(([id, val]: [string, any]) => ({
        callSessionId: id,
        ...val
      }));

      const activeRinging = sessions.find((s: any) => s.status === "RINGING");
      if (activeRinging) {
        setIncomingSession(activeRinging);
        setCallerProfile(resolveCaller(activeRinging.callerId, activeRinging.callerName, activeRinging.callerRegNumber));
      } else {
        setIncomingSession(null);
        setCallerProfile(null);
      }
    });

    // 2. Cross-tab & local signal listener (event-driven, zero polling)
    const handleStorageEvent = () => {
      const localCall = localStorage.getItem(`incoming_call_${userId}`);
      if (!localCall) {
        setIncomingSession(null);
        setCallerProfile(null);
        return;
      }
      try {
        const parsed = JSON.parse(localCall);
        if (parsed.callSessionId && localStorage.getItem(`call_cancelled_${parsed.callSessionId}`)) {
          setIncomingSession(null);
          setCallerProfile(null);
          return;
        }
        if (parsed.status === "RINGING") {
          setIncomingSession(parsed);
          setCallerProfile(resolveCaller(parsed.callerId, parsed.callerName, parsed.callerRegNumber));
        }
      } catch (e) {}
    };

    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener("incoming_call_signal", handleStorageEvent);

    // 3. Sensible HTTP check: Only runs ONCE on mount or when window gains focus
    const checkActiveCallsOnce = async () => {
      if (!userId || isInActiveCall) return;
      try {
        const res = await fetch(`/api/calls/active/${encodeURIComponent(userId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.sessions && data.sessions.length > 0) {
          const activeRinging = data.sessions.find((s: any) => s.status === "RINGING");
          if (activeRinging) {
            setIncomingSession(activeRinging);
            setCallerProfile(resolveCaller(activeRinging.callerId, activeRinging.callerName, activeRinging.callerRegNumber));
          }
        }
      } catch (err) {
        // Non-blocking network error
      }
    };

    // Check once on mount
    checkActiveCallsOnce();

    // Check once when tab gains focus
    window.addEventListener("focus", checkActiveCallsOnce);

    // Sensible low-frequency background check (every 60 seconds, NOT a runaway 1.5s loop)
    const sensibleInterval = setInterval(checkActiveCallsOnce, 60000);

    // Clean up all listeners and intervals
    return () => {
      unsubscribeRtdb();
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("incoming_call_signal", handleStorageEvent);
      window.removeEventListener("focus", checkActiveCallsOnce);
      clearInterval(sensibleInterval);
    };
  }, [currentProfile?.id, isInActiveCall, resolveCaller]);

  // Ringtone synthesizer
  useEffect(() => {
    if (!incomingSession) return;
    let audioCtx: AudioContext | null = null;
    let ringInterval: any = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playRingtone = () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      };

      playRingtone();
      ringInterval = setInterval(playRingtone, 2000);
    } catch (e) {}

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (audioCtx) audioCtx.close().catch(() => {});
    };
  }, [incomingSession]);

  // Browser Push Notification trigger for incoming calls
  useEffect(() => {
    if (!incomingSession || !callerProfile) return;

    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          const callType = (incomingSession.callType || "video").toUpperCase();
          const notif = new Notification(`📞 Incoming ${callType} Call from ${callerProfile.name}`, {
            body: `Sri ${callerProfile.name} (${callerProfile.reg_number || 'SHUBH'}) is calling you! Click here to answer now on Shubhamastu.in`,
            icon: callerProfile.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
            tag: `call-${incomingSession.callSessionId}`,
            requireInteraction: true
          });
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        } catch (e) {}
      } else if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [incomingSession, callerProfile]);

  const handleRespond = async (action: "ACCEPT" | "DECLINE") => {
    if (!incomingSession || !currentProfile?.id) return;
    setProcessing(true);
    try {
      localStorage.removeItem(`incoming_call_${currentProfile.id}`);
      
      // Notify backend callSessionEngine
      fetch("/api/calls/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callSessionId: incomingSession.callSessionId,
          userId: currentProfile.id,
          action
        })
      }).catch(() => {});

      const sessionRef = ref(rtdb, `calls/${currentProfile.id}/${incomingSession.callSessionId}`);
      if (action === "ACCEPT") {
        await update(sessionRef, { status: "ACTIVE", connectedPeerId: currentProfile.id }).catch(() => {});
        updateCallHistoryRecord(incomingSession.callerId, currentProfile.id, incomingSession.callSessionId, "Accepted", "Accepted");
        onAcceptCall(incomingSession.callSessionId, incomingSession.callType || "video");
      } else {
        updateCallHistoryRecord(incomingSession.callerId, currentProfile.id, incomingSession.callSessionId, "Declined", "Declined");
        await update(sessionRef, { status: "DECLINED", declinedAt: Date.now() }).catch(() => {});
        setTimeout(() => remove(sessionRef).catch(() => {}), 2000);
      }
      setIncomingSession(null);
      setCallerProfile(null);
    } catch (err) {
      console.error("Error responding to call:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (!incomingSession || !callerProfile) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#362B5A] text-white border-2 border-amber-400 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center space-y-6">
        
        {/* Pulsing Ringing Animation Ring */}
        <div className="relative w-28 h-28 mx-auto">
          <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-25"></div>
          <div className="absolute inset-2 bg-amber-500 rounded-full animate-pulse opacity-40"></div>
          <img
            src={callerProfile.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"}
            alt={callerProfile.name}
            className="absolute inset-4 w-20 h-20 rounded-full object-cover border-4 border-amber-400 shadow-lg relative z-10"
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest font-black bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30">
            Incoming {incomingSession.callType?.toUpperCase() || "VIDEO"} Call Request
          </span>
          <h2 className="text-2xl font-black">{callerProfile.name}</h2>
          <p className="text-amber-200 font-mono text-sm">#{callerProfile.reg_number || "SHUBH"} • {callerProfile.current_city || "Hyderabad"}</p>
        </div>

        <div className="bg-white/10 rounded-2xl p-3 text-xs text-amber-100 font-medium">
          🔔 Ringing securely via Agora WebRTC & Firebase RTDB signaling...
        </div>

        <div className="flex items-center justify-center space-x-6 pt-2">
          <button
            onClick={() => handleRespond("DECLINE")}
            disabled={processing}
            className="flex flex-col items-center space-y-1 group cursor-pointer"
            title="Decline Call"
          >
            <div className="w-16 h-16 rounded-full bg-rose-600 group-hover:bg-rose-700 flex items-center justify-center shadow-xl transition-all active:scale-95">
              <PhoneOff className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-bold text-rose-300">Decline</span>
          </button>

          <button
            onClick={() => handleRespond("ACCEPT")}
            disabled={processing}
            className="flex flex-col items-center space-y-1 group cursor-pointer"
            title="Accept Call"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-600 group-hover:bg-emerald-700 flex items-center justify-center shadow-xl transition-all active:scale-95 animate-bounce">
              {incomingSession.callType === "video" ? <Video className="w-7 h-7 text-white" /> : <Phone className="w-7 h-7 text-white" />}
            </div>
            <span className="text-xs font-bold text-emerald-300">Accept Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
