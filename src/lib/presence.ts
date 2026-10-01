import { useEffect, useState } from "react";
import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";
import { rtdb } from "./firebase";

export function useUserPresence(userId?: string) {
  useEffect(() => {
    if (!userId) return;

    const myStatusRef = ref(rtdb, `status/${userId}`);
    const connectedRef = ref(rtdb, ".info/connected");

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // When user disconnects unexpectedly, update status to offline
        onDisconnect(myStatusRef).set({
          state: "offline",
          lastSeen: serverTimestamp()
        });

        // Set online status
        set(myStatusRef, {
          state: "online",
          lastChanged: serverTimestamp()
        }).catch((err) => {
          console.error("Failed to set online presence:", err);
        });
      }
    });

    // Also update offline status on window unload / unmount
    const handleUnload = () => {
      set(myStatusRef, {
        state: "offline",
        lastSeen: serverTimestamp()
      });
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
  const [presence, setPresence] = useState<{ isOnline: boolean; lastSeen?: number }>({ isOnline: false });

  useEffect(() => {
    if (!targetUserId) return;

    const targetStatusRef = ref(rtdb, `status/${targetUserId}`);
    const unsubscribe = onValue(targetStatusRef, (snapshot) => {
      const val = snapshot.val();
      if (val && val.state === "online") {
        setPresence({ isOnline: true });
      } else {
        setPresence({ isOnline: false, lastSeen: val?.lastSeen });
      }
    });

    return () => unsubscribe();
  }, [targetUserId]);

  return presence;
}
