import { useEffect, useState } from "react";
import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";
import { rtdb } from "./firebase";

export function useUserPresence(userId?: string) {
  useEffect(() => {
    if (!userId) return;

    const myStatusRef = ref(rtdb, `status/${userId}`);
    const connectedRef = ref(rtdb, ".info/connected");

    const unsubscribe = onValue(connectedRef, async (snap) => {
      if (snap.val() === true) {
        try {
          // When user disconnects unexpectedly, set status to offline with 5-minute grace buffer
          await onDisconnect(myStatusRef).set({
            state: "offline",
            lastSeen: serverTimestamp(),
            offlineGraceUntil: Date.now() + 5 * 60 * 1000
          });

          // Set online status
          await set(myStatusRef, {
            state: "online",
            lastChanged: serverTimestamp(),
            offlineGraceUntil: null
          });
        } catch (err) {
          console.error("Failed to set presence onDisconnect/set:", err);
        }
      }
    });

    const handleUnload = () => {
      set(myStatusRef, {
        state: "offline",
        lastSeen: serverTimestamp(),
        offlineGraceUntil: Date.now() + 5 * 60 * 1000
      }).catch(() => {});
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleUnload);
      set(myStatusRef, {
        state: "offline",
        lastSeen: serverTimestamp(),
        offlineGraceUntil: Date.now() + 5 * 60 * 1000
      }).catch(() => {});
    };
  }, [userId]);
}

export function usePresenceStatus(targetUserId?: string): { isOnline: boolean; lastSeen?: number | string; graceActive?: boolean } {
  const [presence, setPresence] = useState<{ isOnline: boolean; lastSeen?: number | string; graceActive?: boolean }>({ isOnline: true });

  useEffect(() => {
    if (!targetUserId) return;

    const targetStatusRef = ref(rtdb, `status/${targetUserId}`);
    const unsubscribe = onValue(targetStatusRef, (snapshot) => {
      const val = snapshot.val();
      if (val && val.state === "offline") {
        const graceUntil = val.offlineGraceUntil || 0;
        const now = Date.now();
        // 5-minute grace period rule: if within 5 minutes of leaving/logout, show online/active
        if (now < graceUntil) {
          setPresence({ isOnline: true, graceActive: true, lastSeen: val?.lastSeen });
        } else {
          setPresence({ isOnline: false, graceActive: false, lastSeen: val?.lastSeen });
        }
      } else {
        setPresence({ isOnline: true });
      }
    });

    return () => unsubscribe();
  }, [targetUserId]);

  return presence;
}
