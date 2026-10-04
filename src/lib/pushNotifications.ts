import { rtdb } from "./firebase";
import { ref, set } from "firebase/database";

export async function registerCallPushNotifications(userId: string) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("/sw.js");

    // Only check current permission without forcing auto-prompt on load
    if ("Notification" in window && Notification.permission === "granted") {
      const deviceId = localStorage.getItem("shubhamastu_push_device_id") || `device_${Math.random().toString(36).substring(2, 9)}`;
      const tokenRef = ref(rtdb, `push_tokens/${userId}/${deviceId}`);
      await set(tokenRef, {
        deviceId,
        registeredAt: Date.now(),
        userAgent: navigator.userAgent
      }).catch(() => {});
      localStorage.setItem("shubhamastu_push_device_id", deviceId);
    }
  } catch (err) {}
}

export async function requestPushPermission(userId: string) {
  if (!("Notification" in window)) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await registerCallPushNotifications(userId);
    }
  } catch (err) {}
}
