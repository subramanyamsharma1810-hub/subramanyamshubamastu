import React, { useState, useEffect } from "react";
import { PhoneOff, Clock } from "lucide-react";
import { Profile } from "../../types";
import { ref, onValue, remove } from "firebase/database";
import { rtdb } from "../../lib/firebase";

interface OutgoingCallModalProps {
  callSessionId: string;
  targetProfile: Profile;
  callType: "audio" | "video";
  onCancelCall: () => void;
  onCallConnected: () => void;
}

export default function OutgoingCallModal({
  callSessionId,
  targetProfile,
  callType,
  onCancelCall,
  onCallConnected,
}: OutgoingCallModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [statusText, setStatusText] = useState("Ringing target user...");

  useEffect(() => {
    // Play subtle Web Audio ringer tone while ringing
    let audioCtx: AudioContext | null = null;
    let ringInterval: any = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playRingtone = () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 tone
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      };

      playRingtone();
      ringInterval = setInterval(playRingtone, 2500);
    } catch (e) {}

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (ringInterval) clearInterval(ringInterval);
          setStatusText("Call timed out. Member was unavailable.");
          setTimeout(() => onCancelCall(), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Listen to Firebase RTDB for session updates
    const sessionRef = ref(rtdb, `calls/${targetProfile.id}/${callSessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      if (data.status === "ACTIVE") {
        if (ringInterval) clearInterval(ringInterval);
        if (audioCtx) audioCtx.close().catch(() => {});
        onCallConnected();
      } else if (data.status === "DECLINED") {
        if (ringInterval) clearInterval(ringInterval);
        if (audioCtx) audioCtx.close().catch(() => {});
        setStatusText("Call was declined.");
        setTimeout(() => {
          remove(sessionRef).catch(() => {});
          onCancelCall();
        }, 1500);
      }
    });

    // Also listen to window signals for instant local/cross-tab status updates
    const handleCallStatusSignal = (e: any) => {
      const detail = e.detail;
      if (detail && detail.callSessionId === callSessionId) {
        if (detail.status === "ACTIVE") {
          if (ringInterval) clearInterval(ringInterval);
          if (audioCtx) audioCtx.close().catch(() => {});
          onCallConnected();
        } else if (detail.status === "DECLINED") {
          if (ringInterval) clearInterval(ringInterval);
          if (audioCtx) audioCtx.close().catch(() => {});
          setStatusText("Call was declined.");
          setTimeout(() => onCancelCall(), 1500);
        }
      }
    };

    const handleStorageChange = () => {
      const activeData = localStorage.getItem(`call_active_${callSessionId}`);
      if (activeData) {
        try {
          const parsed = JSON.parse(activeData);
          if (parsed.status === "ACTIVE") {
            if (ringInterval) clearInterval(ringInterval);
            if (audioCtx) audioCtx.close().catch(() => {});
            onCallConnected();
          }
        } catch (err) {}
      }
    };

    window.addEventListener("call_status_signal", handleCallStatusSignal);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (audioCtx) audioCtx.close().catch(() => {});
      clearInterval(timer);
      unsubscribe();
      window.removeEventListener("call_status_signal", handleCallStatusSignal);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [targetProfile.id, callSessionId, onCancelCall, onCallConnected]);

  const progressPercent = (secondsLeft / 60) * 100;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#362B5A] text-white border-2 border-amber-400 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center space-y-6">
        
        <div className="relative w-28 h-28 mx-auto">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25"></div>
          <img
            src={targetProfile.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"}
            alt={targetProfile.name}
            className="absolute inset-2 w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-lg relative z-10"
          />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest font-black bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30">
            Fast-Ring {callType.toUpperCase()} Call ⏳
          </span>
          <h3 className="text-xl font-extrabold text-white">{targetProfile.name}</h3>
          <p className="text-xs text-blue-200">{statusText}</p>
        </div>

        {/* 60s Countdown Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-stone-300 font-mono">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" /> Fast-Ring Timeout</span>
            <span>{secondsLeft}s remaining</span>
          </div>
          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-emerald-900/40 border border-emerald-400/40 rounded-2xl text-[11px] text-emerald-200 font-medium space-y-1 text-left">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300 uppercase tracking-wider text-[10px]">
              <span>🛡️ Zero Credit Waste Protection</span>
            </div>
            <p>Agora RTC channel joins ONLY after {targetProfile.name} answers. No credits are consumed while ringing!</p>
          </div>

          <button
            onClick={async () => {
              const sessionRef = ref(rtdb, `calls/${targetProfile.id}/${callSessionId}`);
              await remove(sessionRef).catch(() => {});
              localStorage.removeItem(`incoming_call_${targetProfile.id}`);
              window.dispatchEvent(new Event("storage"));
              window.dispatchEvent(new CustomEvent("call_status_signal", {
                detail: { callSessionId, status: "CANCELLED" }
              }));
              onCancelCall();
            }}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Cancel Call</span>
          </button>
        </div>

      </div>
    </div>
  );
}
