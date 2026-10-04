import { rtdb } from "./firebase";
import { ref, set } from "firebase/database";

export async function registerCallPushNotifications(userId: string) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push notifications not supported by this browser.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Call Push Service Worker registered:", registration);

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const deviceId = `device_${Math.random().toString(36).substring(2, 9)}`;
      const tokenRef = ref(rtdb, `push_tokens/${userId}/${deviceId}`);
      await set(tokenRef, {
        deviceId,
        registeredAt: Date.now(),
        userAgent: navigator.userAgent
      });
      localStorage.setItem("shubhamastu_push_device_id", deviceId);
      console.log("Device registered for multi-device call push notifications.");
    }
  } catch (err) {
    console.warn("Failed to register push notifications:", err);
  }
}
