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
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatusText("Call timed out. User was unavailable.");
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
        onCallConnected();
      } else if (data.status === "DECLINED") {
        setStatusText("Call was declined.");
        setTimeout(() => {
          remove(sessionRef).catch(() => {});
          onCancelCall();
        }, 1500);
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
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
          <button
            onClick={() => {
              onCallConnected();
            }}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40 animate-pulse"
          >
            <span>⚡ Connect Instantly (Test / Open Call Room)</span>
          </button>

          <button
            onClick={async () => {
              const sessionRef = ref(rtdb, `calls/${targetProfile.id}/${callSessionId}`);
              await remove(sessionRef).catch(() => {});
              onCancelCall();
            }}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Cancel Call</span>
          </button>
        </div>

      </div>
    </div>
  );
}
