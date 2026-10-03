import { useEffect, useCallback } from "react";
import { rtdb } from "../lib/firebase";
import { ref, onValue, set, push } from "firebase/database";

export function useCallDiagnostics(callSessionId?: string, userId?: string) {
  // 1. Monitor Firebase RTDB connection state transitions on mount
  useEffect(() => {
    if (!callSessionId) return;

    const connectedRef = ref(rtdb, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snap) => {
      const isConnected = snap.val() === true;
      const diagRef = ref(rtdb, `call-diagnostics/${callSessionId}`);
      const newLogRef = push(diagRef);
      set(newLogRef, {
        eventType: "RTDB_CONNECTION_STATE",
        status: isConnected ? "CONNECTED" : "DISCONNECTED",
        userId: userId || "anonymous",
        timestamp: Date.now()
      }).catch((e) => console.warn("Failed to log RTDB state transition:", e));
    });

    return () => unsubscribe();
  }, [callSessionId, userId]);

  // 2. Helper function to log custom diagnostics (Agora token expiration, payload errors, cleanup failures)
  const logDiagnostic = useCallback(async (eventType: string, message: string, details?: any) => {
    if (!callSessionId) return;
    try {
      const diagRef = ref(rtdb, `call-diagnostics/${callSessionId}`);
      const newLogRef = push(diagRef);
      await set(newLogRef, {
        eventType,
        message,
        details: details ? JSON.stringify(details) : null,
        userId: userId || "anonymous",
        timestamp: Date.now()
      });
      console.log(`[CALL DIAGNOSTICS HOOK] [${eventType}] ${message}`, details || "");
    } catch (err) {
      console.warn("Failed to push diagnostic log to RTDB:", err);
    }
  }, [callSessionId, userId]);

  return { logDiagnostic };
}
