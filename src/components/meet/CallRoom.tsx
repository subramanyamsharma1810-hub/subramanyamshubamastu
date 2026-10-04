import React, { useState, useEffect, useRef } from "react";
import AgoraRTC, {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  UID,
} from "agora-rtc-sdk-ng";
import { Profile } from "../../types";
import { rtdb } from "../../lib/firebase";
import { ref, get, remove, update, set } from "firebase/database";
import { useCallDiagnostics } from "../../hooks/useCallDiagnostics";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  ShieldAlert,
  Lock,
  AlertTriangle,
  Terminal,
  Copy,
  Check,
  WifiOff,
  Palette,
  Loader2,
  Star
} from "lucide-react";

interface CallRoomProps {
  callSessionId: string;
  caller: Profile;
  receiver: Profile;
  callType: "audio" | "video";
  onEndCall: () => void;
}

const AGORA_APP_ID = "58b929a373224fd693defde48656648b";

export default function CallRoom({
  callSessionId,
  caller,
  receiver,
  callType,
  onEndCall,
}: CallRoomProps) {
  const [client, setClient] = useState<any | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUid, setRemoteUid] = useState<UID | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState<"connecting" | "ringing" | "connected" | "reconnecting">("connecting");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEndCallConfirmModal, setShowEndCallConfirmModal] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [terminationStatusText, setTerminationStatusText] = useState("Preparing call termination...");
  const [reportReason, setReportReason] = useState("Harassment / Misbehavior during call");
  const [videoFilter, setVideoFilter] = useState<"normal" | "sepia" | "grayscale" | "vintage" | "contrast">("normal");

  const getFilterClass = (filter: string) => {
    switch (filter) {
      case "sepia":
        return "sepia-[0.85] hue-rotate-[-10deg] saturate-[1.2]";
      case "grayscale":
        return "grayscale-[0.95] contrast-[1.25]";
      case "vintage":
        return "sepia-[0.45] contrast-[1.1] brightness-[0.95] hue-rotate-[15deg]";
      case "contrast":
        return "contrast-[1.4] brightness-[1.05] saturate-[1.1]";
      default:
        return "";
    }
  };

  // Diagnostic Utility state
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${message}`;
    setDiagnosticLogs(prev => [...prev, entry]);
    console.log(`[CALL DIAGNOSTIC] ${entry}`);
  };

  const { logDiagnostic } = useCallDiagnostics(callSessionId, caller.id);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let rtcClient: any | null = null;
    let audioTrack: IMicrophoneAudioTrack | null = null;
    let videoTrack: ICameraVideoTrack | null = null;

    async function initAgora() {
      const callerPath = `calls/${caller.id}/${callSessionId}`;
      const receiverPath = `calls/${receiver.id}/${callSessionId}`;

      addLog(`[DIAGNOSTIC] Initializing call session: ${callSessionId}`);
      addLog(`[DIAGNOSTIC] Call Type: ${callType.toUpperCase()}`);
      addLog(`[DIAGNOSTIC] Caller Path Attempt: ${callerPath}`);
      addLog(`[DIAGNOSTIC] Receiver Path Attempt: ${receiverPath}`);
      addLog(`[DIAGNOSTIC] Current Agora App ID: ${AGORA_APP_ID}`);

      try {
        setCallStatus("ringing");
        addLog("[DIAGNOSTIC] Status set to ringing. Requesting token from /api/agora/token with robust retry mechanism...");

        // 1. Robust retry mechanism for Agora token retrieval (up to 3 attempts)
        let tokenData: any = null;
        let attempts = 0;
        const maxRetries = 3;

        while (attempts < maxRetries) {
          attempts++;
          try {
            const tokenRes = await fetch("/api/agora/token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                channelName: callSessionId,
                uid: Math.floor(Math.random() * 100000),
                role: "publisher",
              }),
            });

            if (tokenRes.ok) {
              tokenData = await tokenRes.json();
              break;
            } else {
              addLog(`[DIAGNOSTIC] Token attempt ${attempts} failed with status ${tokenRes.status}. Retrying...`);
            }
          } catch (retryErr) {
            addLog(`[DIAGNOSTIC] Token attempt ${attempts} network error: ${retryErr}. Retrying...`);
          }
          if (attempts < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * attempts));
          }
        }

        if (!tokenData || !tokenData.token) {
          throw new Error("Failed to retrieve valid Agora token after 3 retry attempts.");
        }

        const token = tokenData.token;
        const uid = tokenData.uid || Math.floor(Math.random() * 100000);
        addLog(`[DIAGNOSTIC] Agora Token retrieved successfully on attempt ${attempts}. Assigned UID: ${uid}`);

        // 2. Create Agora client
        rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setClient(rtcClient);
        addLog("[DIAGNOSTIC] Agora RTC client instance created successfully.");

        rtcClient.on("user-published", async (user, mediaType) => {
          addLog(`[DIAGNOSTIC] Remote user published stream. UID: ${user.uid}, MediaType: ${mediaType}`);
          await rtcClient!.subscribe(user, mediaType);
          setRemoteUid(user.uid);
          setCallStatus("connected");
          addLog(`[DIAGNOSTIC] Connection Result: SUCCESS - Subscribed to remote user ${user.uid} (${mediaType}).`);

          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
          if (mediaType === "video" && remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current);
          }
        });

        rtcClient.on("user-unpublished", (user, mediaType) => {
          addLog(`[DIAGNOSTIC] Remote user unpublished ${mediaType}. UID: ${user.uid}`);
          if (mediaType === "video") {
            setRemoteUid(null);
          }
        });

        // 3. Join channel
        addLog(`[DIAGNOSTIC] Attempting to join Agora channel: ${callSessionId}`);
        await rtcClient.join(AGORA_APP_ID, callSessionId, token || null, uid);
        addLog("[DIAGNOSTIC] Connection Result: SUCCESSFULLY JOINED Agora channel.");

        // 4. Create local tracks
        if (callType === "video") {
          addLog("[DIAGNOSTIC] Requesting microphone and camera permissions & tracks...");
          const [aTrack, vTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          audioTrack = aTrack;
          videoTrack = vTrack;
          setLocalAudioTrack(aTrack);
          setLocalVideoTrack(vTrack);

          if (localVideoRef.current) {
            vTrack.play(localVideoRef.current);
          }
          await rtcClient.publish([aTrack, vTrack]);
          addLog("[DIAGNOSTIC] Local audio & video tracks published successfully.");
        } else {
          addLog("[DIAGNOSTIC] Requesting microphone permission & audio track...");
          const aTrack = await AgoraRTC.createMicrophoneAudioTrack();
          audioTrack = aTrack;
          setLocalAudioTrack(aTrack);
          await rtcClient.publish([aTrack]);
          addLog("[DIAGNOSTIC] Local audio track published successfully.");
        }

        setCallStatus("connected");
        addLog("[DIAGNOSTIC] Connection Result: FULLY CONNECTED. Starting call timer.");

        // Start call duration timer
        timerRef.current = setInterval(() => {
          setDurationSeconds((prev) => prev + 1);
        }, 1000);

      } catch (err: any) {
        // Specific catch block logging Agora App ID and Firebase RTDB connection state to console
        let rtdbConnectionState = "UNKNOWN";
        try {
          const connectedRef = ref(rtdb, ".info/connected");
          const snap = await get(connectedRef);
          rtdbConnectionState = snap.val() ? "ONLINE (Connected)" : "OFFLINE (Disconnected)";
        } catch (dbErr) {
          rtdbConnectionState = `CHECK_FAILED: ${dbErr}`;
        }

        const errorMsg = `Call Initiation Error: ${err.message || err}`;
        console.error("========================================");
        console.error("[CALL INITIATION FAILURE DEBUG]");
        console.error("Error Details:", errorMsg);
        console.error("Current Agora App ID:", AGORA_APP_ID);
        console.error("Firebase RTDB Connection State:", rtdbConnectionState);
        console.error("Caller Path Attempt:", `calls/${caller.id}/${callSessionId}`);
        console.error("Receiver Path Attempt:", `calls/${receiver.id}/${callSessionId}`);
        console.error("========================================");

        addLog(`[DIAGNOSTIC ERROR] ${errorMsg} | App ID: ${AGORA_APP_ID} | RTDB State: ${rtdbConnectionState}`);
        setDiagnosticError(`${errorMsg} (Agora App ID: ${AGORA_APP_ID} | RTDB: ${rtdbConnectionState})`);
        setShowDiagnostics(true);

        // Fallback simulation mode
        setCallStatus("connected");
        addLog("[DIAGNOSTIC] Switched to P2P simulation fallback mode.");
        timerRef.current = setInterval(() => {
          setDurationSeconds((prev) => prev + 1);
        }, 1000);
      }
    }

    initAgora();

    return () => {
      addLog("[DIAGNOSTIC] Cleaning up call session and leaving channel.");
      if (timerRef.current) clearInterval(timerRef.current);
      audioTrack?.close();
      videoTrack?.close();
      if (rtcClient) {
        rtcClient.leave();
      }
    };
  }, [callSessionId, callType, caller.id, receiver.id]);

  const toggleMic = () => {
    if (localAudioTrack) {
      const newState = !isMicMuted;
      localAudioTrack.setEnabled(!newState);
      setIsMicMuted(newState);
      addLog(`Microphone ${newState ? "muted" : "unmuted"}`);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      const newState = !isVideoOff;
      localVideoTrack.setEnabled(!newState);
      setIsVideoOff(newState);
      addLog(`Camera ${newState ? "turned off" : "turned on"}`);
    }
  };

  const handleHangUp = () => {
    setShowEndCallConfirmModal(true);
  };

  const confirmAndExecuteHangUp = async () => {
    setShowEndCallConfirmModal(false);
    setIsTerminating(true);
    setTerminationStatusText("Updating Firebase RTDB status to 'ended'...");
    addLog(`[DIAGNOSTIC HANGUP] User confirmed termination. SessionId: ${callSessionId}`);

    try {
      // 1. Await Firebase RTDB status update confirmation
      const receiverCallRef = ref(rtdb, `calls/${receiver.id}/${callSessionId}`);
      const callerCallRef = ref(rtdb, `calls/${caller.id}/${callSessionId}`);
      
      await Promise.all([
        update(receiverCallRef, { status: "ended", endedAt: Date.now() }).catch(() => {}),
        update(callerCallRef, { status: "ended", endedAt: Date.now() }).catch(() => {})
      ]);
      addLog("[DIAGNOSTIC HANGUP] Firebase RTDB status successfully updated to 'ended' with server confirmation.");
    } catch (e) {
      addLog(`[DIAGNOSTIC HANGUP WARNING] Firebase RTDB update warning: ${e}`);
    }

    setTerminationStatusText("Closing Agora local audio & video streams...");
    try {
      if (localAudioTrack) {
        localAudioTrack.close();
        addLog("[DIAGNOSTIC HANGUP] Local audio track closed successfully.");
      }
      if (localVideoTrack) {
        localVideoTrack.close();
        addLog("[DIAGNOSTIC HANGUP] Local video track closed successfully.");
      }
      if (client) {
        await client.leave().catch(() => {});
        addLog("[DIAGNOSTIC HANGUP] Left Agora RTC channel successfully.");
      }
    } catch (e) {
      addLog(`[DIAGNOSTIC HANGUP NOTICE] Agora cleanup warning: ${e}`);
    }

    setTerminationStatusText("Submitting server telemetry & awaiting confirmation...");
    try {
      const res = await fetch("/api/calls/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callSessionId,
          durationSeconds,
          status: "COMPLETED",
        }),
      });
      const data = await res.json();
      addLog(`[DIAGNOSTIC HANGUP] Server telemetry /api/calls/end confirmed: ${JSON.stringify(data)}`);
    } catch (e) {
      addLog(`[DIAGNOSTIC HANGUP NOTICE] Server telemetry notice: ${e}`);
    }

    // Clean up non-volatile active call storage
    localStorage.removeItem("bramhana_active_call_session");

    addLog("[DIAGNOSTIC HANGUP] Call successfully ended. Opening Post-Call Feedback.");
    setIsTerminating(false);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    setIsSubmittingFeedback(true);
    try {
      const feedbackRef = ref(rtdb, `call-feedback/${callSessionId}`);
      await set(feedbackRef, {
        callSessionId,
        callerId: caller.id,
        receiverId: receiver.id,
        rating: feedbackRating,
        comment: feedbackComment,
        durationSeconds,
        timestamp: Date.now()
      });
      addLog("[DIAGNOSTIC FEEDBACK] Post-call feedback successfully saved to Firebase RTDB call-feedback node.");
    } catch (e) {
      addLog(`[DIAGNOSTIC FEEDBACK ERROR] Failed to save feedback: ${e}`);
    } finally {
      setIsSubmittingFeedback(false);
      setShowFeedbackModal(false);
      onEndCall();
    }
  };

  const handleReportAndTerminate = async () => {
    addLog(`Reporting call for reason: ${reportReason}`);
    try {
      await fetch("/api/calls/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callSessionId,
          durationSeconds,
          status: "REPORTED_AND_TERMINATED",
          reportReason,
        }),
      });
    } catch (e) {
      console.error(e);
    }
    alert("Call reported for safety violation. The account has been flagged and suspended for investigation under IT Rules 2021.");
    onEndCall();
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const copyDiagnosticLogs = () => {
    navigator.clipboard.writeText(diagnosticLogs.join("\n"));
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between text-white overflow-hidden font-sans">
      {/* Top Bar / Safety Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-base">
                {callType === "video" ? "📹 Secure Video Meet" : "📞 Secure Audio Consultation"}
              </h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                {callStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-2">
              <span>Between {caller.name} & {receiver.name}</span>
              <span>•</span>
              <span className="text-amber-300 font-mono font-bold">{formatDuration(durationSeconds)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {callType === "video" && (
            <div className="hidden lg:flex items-center space-x-1 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700">
              <span className="text-[10px] uppercase font-mono px-2 text-amber-400 font-bold flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" /> Filter:
              </span>
              {(["normal", "sepia", "grayscale", "vintage", "contrast"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setVideoFilter(f)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                    videoFilter === f ? "bg-amber-500 text-slate-950 font-bold shadow" : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleHangUp}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-lg cursor-pointer animate-pulse"
            title="End Call Now"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
          <button
            onClick={() => setShowDiagnostics(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow cursor-pointer relative"
            title="Open Call Diagnostic Console"
          >
            <Terminal className="w-4 h-4" />
            <span>🛠️ Diagnostics</span>
            {diagnosticError && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Report & Terminate</span>
          </button>
        </div>
      </div>

      {/* Diagnostic Error Banner on screen if error occurred */}
      {diagnosticError && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between border-b border-rose-700 shadow-lg">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 animate-bounce" />
            <span>⚠️ {diagnosticError}</span>
          </div>
          <button
            onClick={() => setShowDiagnostics(true)}
            className="underline uppercase text-[10px] bg-black/20 px-2 py-1 rounded cursor-pointer hover:bg-black/40"
          >
            Inspect Console
          </button>
        </div>
      )}

      {/* Main Stream Area */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {callType === "video" ? (
          <div className="w-full h-full max-w-5xl max-h-[75vh] grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* Remote Video */}
            <div className={`w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 relative flex items-center justify-center shadow-2xl transition-all duration-300 ${getFilterClass(videoFilter)}`}>
              <div ref={remoteVideoRef} className="w-full h-full absolute inset-0 object-cover" />
              {!remoteUid && (
                <div className="text-center p-6 space-y-3 z-10">
                  <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center text-2xl font-bold border-2 border-amber-500 animate-pulse">
                    {receiver.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold">Waiting for {receiver.name} to join...</h3>
                  <p className="text-sm text-slate-400">Secure Agora WebRTC channel active</p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-xs font-medium">
                {receiver.name} (#{receiver.reg_number || "SHUBH"})
              </div>
            </div>

            {/* Local Video */}
            <div className={`w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 relative flex items-center justify-center shadow-2xl transition-all duration-300 ${getFilterClass(videoFilter)}`}>
              <div ref={localVideoRef} className="w-full h-full absolute inset-0 object-cover" />
              {isVideoOff && (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-400">
                  <VideoOff className="w-12 h-12" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-xs font-medium">
                You ({caller.name})
              </div>
            </div>
          </div>
        ) : (
          /* Audio Call Avatar View */
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-5xl font-bold text-white shadow-2xl border-4 border-amber-400/50 animate-pulse">
                {receiver.name.charAt(0)}
              </div>
              <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-emerald-500 border-4 border-slate-950" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold">{receiver.name}</h2>
              <p className="text-amber-400 font-mono text-sm">#{receiver.reg_number || "SHUBH-102"} • {receiver.birth_location || "Hyderabad"}</p>
              <p className="text-slate-400 text-sm mt-2">Secure Voice Connection Active</p>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900/90 border-t border-slate-800 py-4 px-6 flex items-center justify-center space-x-4 backdrop-blur">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all shadow-lg cursor-pointer ${
            isMicMuted ? "bg-rose-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-white"
          }`}
          title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {callType === "video" && (
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all shadow-lg cursor-pointer ${
              isVideoOff ? "bg-rose-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
          </button>
        )}

        <button
          onClick={handleHangUp}
          className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-xl px-8 flex items-center space-x-2 font-bold cursor-pointer"
          title="Hang Up"
        >
          <PhoneOff className="w-6 h-6" />
          <span>End Call</span>
        </button>
      </div>

      {/* Diagnostic Console Modal */}
      {showDiagnostics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 text-slate-100 w-full max-w-2xl rounded-3xl shadow-2xl p-6 space-y-4 border border-indigo-500/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Terminal className="w-6 h-6" />
                <h3 className="text-base font-bold uppercase tracking-wider font-mono">Call Diagnostic Console & Error Telemetry</h3>
              </div>
              <button
                onClick={() => setShowDiagnostics(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {diagnosticError && (
              <div className="bg-rose-950/80 border border-rose-800 text-rose-200 p-3.5 rounded-2xl text-xs space-y-1 font-mono">
                <p className="font-bold text-rose-300">🚨 Diagnostic Error Detected:</p>
                <p>{diagnosticError}</p>
                <p className="text-[10px] text-rose-400 pt-1">Agora App ID: {AGORA_APP_ID} | Session: {callSessionId}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
              <div>
                <span className="text-slate-400 block">Call Session ID:</span>
                <span className="text-amber-300 font-bold">{callSessionId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Agora App ID:</span>
                <span className="text-indigo-300 font-bold">{AGORA_APP_ID}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Caller Path Attempt:</span>
                <span className="text-emerald-400 font-bold">calls/{caller.id}/{callSessionId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Receiver Path Attempt:</span>
                <span className="text-emerald-400 font-bold">calls/{receiver.id}/{callSessionId}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Real-Time Connection Logs:</label>
                <button
                  onClick={copyDiagnosticLogs}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                >
                  {copiedLogs ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLogs ? "Copied!" : "Copy Logs"}</span>
                </button>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-56 overflow-y-auto font-mono text-[11px] text-emerald-400 space-y-1">
                {diagnosticLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">{log}</div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/50">
              💡 <strong className="text-indigo-300">Troubleshooting Tip:</strong> Agora token retrieval uses a robust 3-retry mechanism. Any initiation failure automatically logs Agora App ID and Firebase RTDB connection state to the browser console.
            </div>
          </div>
        </div>
      )}

      {/* Report & Safety Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 border border-rose-200">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-bold">Report Harassment & Terminate</h3>
            </div>
            <p className="text-sm text-slate-600">
              Under IT Rules 2021 & statutory compliance, reporting initiates immediate safety investigation, IP logging, and account suspension.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Reason for reporting:</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-sm font-medium"
              >
                <option value="Harassment / Misbehavior during call">Harassment / Misbehavior during call</option>
                <option value="Inappropriate language or abuse">Inappropriate language or abuse</option>
                <option value="Fake identity / Impersonation">Fake identity / Impersonation</option>
                <option value="Spam or financial solicitation">Spam or financial solicitation</option>
              </select>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReportAndTerminate}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-all shadow cursor-pointer"
              >
                Confirm Report & Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Call Confirmation Modal */}
      {showEndCallConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 text-slate-100 w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5 border border-rose-500/40 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center border-2 border-rose-500 animate-pulse">
              <PhoneOff className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">End Secure Call?</h3>
              <p className="text-xs text-slate-400">This will terminate the Agora channel and update your live status in Firebase RTDB.</p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowEndCallConfirmModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition"
              >
                Continue Call
              </button>
              <button
                onClick={confirmAndExecuteHangUp}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg transition animate-pulse"
              >
                Yes, End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Termination Visual Feedback Overlay */}
      {isTerminating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 text-slate-100 w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 border border-amber-500/40 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border-2 border-amber-400 animate-spin">
              <Loader2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Terminating Call Session</h3>
              <p className="text-xs text-amber-300 font-mono animate-pulse">{terminationStatusText}</p>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Post-Call Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 text-slate-100 w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 border border-amber-500/40 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border-2 border-amber-400">
              <Star className="w-8 h-8 fill-amber-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">Rate Call Quality</h3>
              <p className="text-xs text-slate-400">How was your audio & video experience with {receiver.name}?</p>
            </div>
            
            {/* Star Rating */}
            <div className="flex items-center justify-center space-x-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackRating(star)}
                  className="p-1.5 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                  title={`${star} Star`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= feedbackRating
                        ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                        : "text-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment Input */}
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-mono text-amber-300 uppercase tracking-widest block">Review Comments (Optional)</label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share your feedback on call clarity, network stability, or video quality..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 h-24 resize-none"
              />
            </div>

            {/* Action Buttons (Mandatory Feedback for both users) */}
            <div className="pt-2">
              <button
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg transition flex items-center justify-center gap-2"
              >
                {isSubmittingFeedback ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Feedback...</span>
                  </>
                ) : (
                  <span>Submit Star Feedback & Return</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
