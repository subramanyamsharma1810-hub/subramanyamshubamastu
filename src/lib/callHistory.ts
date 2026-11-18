import { ref, set, update, remove } from "firebase/database";
import { rtdb } from "./firebase";
import { Profile } from "../types";

export type CallStatus = "Ringing" | "Accepted" | "Missed" | "Declined";

export interface CallHistoryRecord {
  id: string;
  callSessionId: string;
  callerId: string;
  callerName: string;
  callerRegNumber?: string;
  callerPhoto?: string;
  receiverId: string;
  receiverName: string;
  receiverRegNumber?: string;
  receiverPhoto?: string;
  callType: "audio" | "video";
  status: CallStatus;
  timestamp: number;
  durationSeconds: number;
}

const localKey = (profileId: string) => `call_history_${profileId}`;

const upsertLocal = (profileId: string, record: CallHistoryRecord) => {
  try {
    const stored = JSON.parse(localStorage.getItem(localKey(profileId)) || "[]");
    const list = Array.isArray(stored) ? stored : [];
    const index = list.findIndex((item: CallHistoryRecord) =>
      item.callSessionId === record.callSessionId || item.id === record.id
    );
    if (index >= 0) list[index] = record;
    else list.unshift(record);
    localStorage.setItem(localKey(profileId), JSON.stringify(list));
  } catch (error) {
    console.error("Failed to persist call history locally:", error);
  }
};

export const createCallHistoryRecord = (
  caller: Profile,
  receiver: Profile,
  callSessionId: string,
  callType: "audio" | "video"
) => {
  const record: CallHistoryRecord = {
    id: callSessionId,
    callSessionId,
    callerId: caller.id,
    callerName: caller.name,
    callerRegNumber: caller.reg_number || "SHUBH",
    callerPhoto: caller.photo_url,
    receiverId: receiver.id,
    receiverName: receiver.name,
    receiverRegNumber: receiver.reg_number || "SHUBH",
    receiverPhoto: receiver.photo_url,
    callType,
    status: "Ringing",
    timestamp: Date.now(),
    durationSeconds: 0,
  };

  upsertLocal(caller.id, record);
  upsertLocal(receiver.id, record);
  set(ref(rtdb, `call_history/${caller.id}/${callSessionId}`), record).catch(() => {});
  set(ref(rtdb, `call_history/${receiver.id}/${callSessionId}`), record).catch(() => {});
};

export const updateCallHistoryRecord = (
  callerId: string,
  receiverId: string,
  callSessionId: string,
  callerStatus: CallStatus,
  receiverStatus: CallStatus,
  durationSeconds = 0
) => {
  const callerRef = ref(rtdb, `call_history/${callerId}/${callSessionId}`);
  const receiverRef = ref(rtdb, `call_history/${receiverId}/${callSessionId}`);

  let callerRecord: CallHistoryRecord | null = null;
  let receiverRecord: CallHistoryRecord | null = null;
  try {
    callerRecord = JSON.parse(localStorage.getItem(localKey(callerId)) || "[]")
      .find((item: CallHistoryRecord) => item.callSessionId === callSessionId) || null;
    receiverRecord = JSON.parse(localStorage.getItem(localKey(receiverId)) || "[]")
      .find((item: CallHistoryRecord) => item.callSessionId === callSessionId) || null;
  } catch {}

  if (callerRecord) {
    const updated = { ...callerRecord, status: callerStatus, durationSeconds };
    upsertLocal(callerId, updated);
  }
  if (receiverRecord) {
    const updated = { ...receiverRecord, status: receiverStatus, durationSeconds };
    upsertLocal(receiverId, updated);
  }

  update(callerRef, { status: callerStatus, durationSeconds }).catch(() => {});
  update(receiverRef, { status: receiverStatus, durationSeconds }).catch(() => {});
};

export const clearCallHistoryRecordMirrors = async (profileId: string) => {
  const peerSessionIds = new Map<string, Set<string>>();
  try {
    const records = JSON.parse(localStorage.getItem(localKey(profileId)) || "[]");
    if (Array.isArray(records)) {
      records.forEach((record: CallHistoryRecord) => {
        const peerId = record.callerId === profileId ? record.receiverId : record.callerId;
        if (!peerId) return;
        if (!peerSessionIds.has(peerId)) peerSessionIds.set(peerId, new Set());
        peerSessionIds.get(peerId)!.add(record.callSessionId);
      });
    }
  } catch {}

  localStorage.removeItem(localKey(profileId));
  const removals: Promise<unknown>[] = [
    remove(ref(rtdb, `call_history/${profileId}`)).catch(() => {}),
  ];

  peerSessionIds.forEach((sessionIds, peerId) => {
    try {
      const peerList = JSON.parse(localStorage.getItem(localKey(peerId)) || "[]");
      if (Array.isArray(peerList)) {
        const remaining = peerList.filter((record: CallHistoryRecord) => !sessionIds.has(record.callSessionId));
        localStorage.setItem(localKey(peerId), JSON.stringify(remaining));
      }
    } catch {}

    sessionIds.forEach((sessionId) => {
      removals.push(remove(ref(rtdb, `call_history/${peerId}/${sessionId}`)).catch(() => {}));
    });
  });

  await Promise.all(removals);
};
