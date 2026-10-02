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

    // Check Firebase RTDB
    const myCallsRef = ref(rtdb, `calls/${currentProfile.id}`);
    const unsubscribe = onValue(myCallsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        // Fallback check localStorage for cross-device/tab testing
        const localCall = localStorage.getItem(`incoming_call_${currentProfile.id}`);
        if (localCall) {
          try {
            const parsed = JSON.parse(localCall);
            if (parsed.status === "RINGING") {
              setIncomingSession(parsed);
              const found = allProfiles.find(p => p.id === parsed.callerId);
              setCallerProfile(found || {
                id: parsed.callerId,
                name: parsed.callerName || "Member",
                reg_number: parsed.callerRegNumber || "SHUBH",
                gender: "Male",
                dob: "1995-01-01",
                height_feet: 5.8,
                sub_caste: "Brahmin",
                profession: "Professional",
                salary_lpa: 10,
                contact_number: "",
                status: "Verified"
              });
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

    // Also listen to storage events for instant local ringing
    const handleStorage = () => {
      const localCall = localStorage.getItem(`incoming_call_${currentProfile.id}`);
      if (localCall) {
        try {
          const parsed = JSON.parse(localCall);
          if (parsed.status === "RINGING") {
            setIncomingSession(parsed);
            const found = allProfiles.find(p => p.id === parsed.callerId);
            setCallerProfile(found || {
              id: parsed.callerId,
              name: parsed.callerName || "Member",
              reg_number: parsed.callerRegNumber || "SHUBH",
              gender: "Male",
              dob: "1995-01-01",
              height_feet: 5.8,
              sub_caste: "Brahmin",
              profession: "Professional",
              salary_lpa: 10,
              contact_number: "",
              status: "Verified"
            });
          }
        } catch (e) {}
      }
    };
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(handleStorage, 2000);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [currentProfile, allProfiles]);

  const handleRespond = async (action: "ACCEPT" | "DECLINE") => {
    if (!incomingSession || !currentProfile) return;
    setProcessing(true);
    try {
      localStorage.removeItem(`incoming_call_${currentProfile.id}`);
      const sessionRef = ref(rtdb, `calls/${currentProfile.id}/${incomingSession.callSessionId}`);
      if (action === "ACCEPT") {
        await update(sessionRef, { status: "ACTIVE", connectedPeerId: currentProfile.id }).catch(() => {});
        onAcceptCall(incomingSession.callSessionId, incomingSession.callType || "video");
      } else {
        await update(sessionRef, { status: "DECLINED" }).catch(() => {});
        setTimeout(() => remove(sessionRef).catch(() => {}), 1500);
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
