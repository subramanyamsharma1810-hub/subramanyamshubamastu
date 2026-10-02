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
          // When user disconnects unexpectedly, update status to offline
          await onDisconnect(myStatusRef).set({
            state: "offline",
            lastSeen: serverTimestamp()
          });

          // Set online status
          await set(myStatusRef, {
            state: "online",
            lastChanged: serverTimestamp()
          });
        } catch (err) {
          console.error("Failed to set presence onDisconnect/set:", err);
        }
      }
    });

    const handleUnload = () => {
      set(myStatusRef, {
        state: "offline",
        lastSeen: serverTimestamp()
      }).catch(() => {});
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleUnload);
      set(myStatusRef, {
        state: "offline",
        lastSeen: serverTimestamp()
      }).catch(() => {});
    };
  }, [userId]);
}

export function usePresenceStatus(targetUserId?: string): { isOnline: boolean; lastSeen?: number } {
  const [presence, setPresence] = useState<{ isOnline: boolean; lastSeen?: number }>({ isOnline: true });

  useEffect(() => {
    if (!targetUserId) return;

    const targetStatusRef = ref(rtdb, `status/${targetUserId}`);
    const unsubscribe = onValue(targetStatusRef, (snapshot) => {
      const val = snapshot.val();
      if (val && val.state === "offline") {
        setPresence({ isOnline: false, lastSeen: val?.lastSeen });
      } else {
        setPresence({ isOnline: true });
      }
    });

    return () => unsubscribe();
  }, [targetUserId]);

  return presence;
}
