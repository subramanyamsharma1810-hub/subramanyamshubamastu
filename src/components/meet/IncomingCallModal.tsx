import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Profile } from "../../types";
import { ref, onValue, update, remove } from "firebase/database";
import { rtdb } from "../../lib/firebase";

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
    if (!currentProfile?.id) return;

    const myCallsRef = ref(rtdb, `calls/${currentProfile.id}`);
    const unsubscribe = onValue(myCallsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
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
        const found = allProfiles.find(p => p.id === activeRinging.callerId);
        setCallerProfile(found || {
          id: activeRinging.callerId,
          name: activeRinging.callerName || "Member",
          reg_number: activeRinging.callerRegNumber || "SHUBH",
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
    });

    return () => unsubscribe();
  }, [currentProfile, allProfiles]);

  const handleRespond = async (action: "ACCEPT" | "DECLINE") => {
    if (!incomingSession || !currentProfile) return;
    setProcessing(true);
    try {
      const sessionRef = ref(rtdb, `calls/${currentProfile.id}/${incomingSession.callSessionId}`);
      if (action === "ACCEPT") {
        await update(sessionRef, { status: "ACTIVE", connectedPeerId: currentProfile.id });
        onAcceptCall(incomingSession.callSessionId, incomingSession.callType || "video");
      } else {
        await update(sessionRef, { status: "DECLINED" });
        setTimeout(() => remove(sessionRef), 1500);
      }
      setIncomingSession(null);
      setCallerProfile(null);
    } catch (err) {
      console.error("Error responding to call in RTDB:", err);
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
          Namaste! You have an incoming live match call on Shubhamastu.in. Choose whether to accept or decline.
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
