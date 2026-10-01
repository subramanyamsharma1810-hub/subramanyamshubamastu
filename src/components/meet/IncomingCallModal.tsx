import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Video, User, Sparkles } from "lucide-react";
import { Profile } from "../../types";

interface IncomingCallModalProps {
  currentProfile: Profile | null;
  onAcceptCall: (callSessionId: string, callType: "audio" | "video") => void;
  allProfiles: Profile[];
}

export default function IncomingCallModal({ currentProfile, onAcceptCall, allProfiles }: IncomingCallModalProps) {
  const [incomingSession, setIncomingSession] = useState<any | null>(null);
  const [callerProfile, setCallerProfile] = useState<Profile | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!currentProfile) return;

    const checkIncoming = async () => {
      try {
        const res = await fetch(`/api/calls/incoming/${currentProfile.id}`);
        const data = await res.json();
        if (data.success && data.sessions && data.sessions.length > 0) {
          const session = data.sessions[0];
          setIncomingSession(session);
          const found = allProfiles.find(p => p.id === session.callerId);
          setCallerProfile(found || {
            id: session.callerId,
            name: session.callerName,
            reg_number: session.callerRegNumber,
            gender: "Male",
            dob: "1995-01-01",
            height_feet: 5.8,
            sub_caste: "Brahmin",
            profession: "Professional",
            salary_lpa: 10,
            contact_number: "",
            status: "Verified"
          });
        } else {
          setIncomingSession(null);
          setCallerProfile(null);
        }
      } catch (err) {
        console.error("Failed to poll incoming calls:", err);
      }
    };

    checkIncoming();
    const interval = setInterval(checkIncoming, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [currentProfile, allProfiles]);

  const handleRespond = async (action: "ACCEPT" | "DECLINE") => {
    if (!incomingSession || !currentProfile) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/calls/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callSessionId: incomingSession.callSessionId,
          userId: currentProfile.id,
          action
        })
      });
      const data = await res.json();
      if (data.success) {
        if (action === "ACCEPT") {
          onAcceptCall(incomingSession.callSessionId, incomingSession.callType || "video");
        }
        setIncomingSession(null);
        setCallerProfile(null);
      }
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
            Incoming {incomingSession.callType?.toUpperCase() || "VIDEO"} Call 📿
          </span>
          <h3 className="text-xl font-extrabold text-white">{callerProfile.name}</h3>
          <p className="text-xs text-blue-200">
            {callerProfile.profession || "Professional"} • <code className="font-mono text-amber-300">{callerProfile.reg_number || "SHUBH"}</code>
          </p>
        </div>

        <p className="text-xs text-stone-300 bg-white/5 p-3 rounded-xl border border-white/10">
          Namaste! You are receiving a private live match call on Shubhamastu.in. Approve to connect securely.
        </p>

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() => handleRespond("DECLINE")}
            disabled={processing}
            className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Decline</span>
          </button>
          
          <button
            onClick={() => handleRespond("ACCEPT")}
            disabled={processing}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer animate-pulse"
          >
            {incomingSession.callType === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            <span>Accept Call</span>
          </button>
        </div>

      </div>
    </div>
  );
}
