import fs from "fs";
import path from "path";
import { sendMissedCallEmail } from "./zeptoMailService.ts";

const DATA_DIR = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
  ? path.join('/tmp', '.data')
  : path.join(process.cwd(), ".data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CALL_STORE_FILE = path.join(DATA_DIR, "call_sessions_store.json");

export interface CallSession {
  callSessionId: string;
  callerId: string;
  callerName: string;
  callerRegNumber: string;
  receiverId: string;
  receiverEmail?: string;
  receiverName?: string;
  callType: "audio" | "video";
  status: "RINGING" | "ACTIVE" | "DECLINED" | "MISSED" | "ENDED";
  createdAt: number;
  expiresAt: number;
  connectedPeerId?: string;
  startedAt?: number;
}

interface CallStore {
  sessions: Record<string, CallSession>;
}

function loadStore(): CallStore {
  try {
    if (fs.existsSync(CALL_STORE_FILE)) {
      return JSON.parse(fs.readFileSync(CALL_STORE_FILE, "utf8"));
    }
  } catch (err) {
    console.error("Error loading call store:", err);
  }
  return { sessions: {} };
}

function saveStore(store: CallStore) {
  try {
    fs.writeFileSync(CALL_STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving call store:", err);
  }
}

export const callSessionEngine = {
  createSession(params: {
    callerId: string;
    callerName: string;
    callerRegNumber: string;
    receiverId: string;
    receiverEmail?: string;
    receiverName?: string;
    callType: "audio" | "video";
  }): CallSession {
    const store = loadStore();
    const callSessionId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    
    const session: CallSession = {
      callSessionId,
      callerId: params.callerId,
      callerName: params.callerName,
      callerRegNumber: params.callerRegNumber,
      receiverId: params.receiverId,
      receiverEmail: params.receiverEmail,
      receiverName: params.receiverName,
      callType: params.callType || "video",
      status: "RINGING",
      createdAt: now,
      expiresAt: now + 60000, // 60-second fast-ring timeout
    };

    store.sessions[callSessionId] = session;
    saveStore(store);
    return session;
  },

  getSession(callSessionId: string): CallSession | null {
    const store = loadStore();
    const session = store.sessions[callSessionId];
    if (!session) return null;

    // Check 60s timeout
    if (session.status === "RINGING" && Date.now() > session.expiresAt) {
      session.status = "MISSED";
      saveStore(store);
      // Trigger missed call email asynchronously
      if (session.receiverEmail) {
        sendMissedCallEmail({
          callerId: session.callerId,
          callerName: session.callerName,
          callerRegNumber: session.callerRegNumber,
          recipientEmail: session.receiverEmail,
          recipientName: session.receiverName || "Member",
        }).catch((err) => console.error("Failed to send timeout missed call email:", err));
      }
    }
    return session;
  },

  respondSession(callSessionId: string, userId: string, action: "ACCEPT" | "DECLINE"): { success: boolean; session?: CallSession; error?: string; errorCode?: string } {
    const store = loadStore();
    const session = store.sessions[callSessionId];
    if (!session) {
      return { success: false, error: "Call session not found", errorCode: "SESSION_NOT_FOUND" };
    }

    if (session.status !== "RINGING") {
      if (session.status === "ACTIVE") {
        return { success: false, error: "Room already occupied", errorCode: "ROOM_OCCUPIED" };
      }
      return { success: false, error: `Session is already ${session.status}`, errorCode: "INVALID_STATE" };
    }

    // Check timeout
    if (Date.now() > session.expiresAt) {
      session.status = "MISSED";
      saveStore(store);
      return { success: false, error: "Call session expired (60s timeout)", errorCode: "TIMEOUT" };
    }

    if (action === "ACCEPT") {
      session.status = "ACTIVE";
      session.connectedPeerId = userId;
      session.startedAt = Date.now();
      saveStore(store);
      return { success: true, session };
    } else {
      session.status = "DECLINED";
      saveStore(store);

      // Trigger missed call email when declined
      if (session.receiverEmail) {
        sendMissedCallEmail({
          callerId: session.callerId,
          callerName: session.callerName,
          callerRegNumber: session.callerRegNumber,
          recipientEmail: session.receiverEmail,
          recipientName: session.receiverName || "Member",
        }).catch((err) => console.error("Failed to send decline missed call email:", err));
      }

      return { success: true, session };
    }
  },

  getActiveSessionsForUser(userId: string): CallSession[] {
    const store = loadStore();
    const now = Date.now();
    const results: CallSession[] = [];

    for (const id of Object.keys(store.sessions)) {
      const s = store.sessions[id];
      if (s.receiverId === userId && s.status === "RINGING") {
        if (now > s.expiresAt) {
          s.status = "MISSED";
          saveStore(store);
        } else {
          results.push(s);
        }
      }
    }
    return results;
  }
};
