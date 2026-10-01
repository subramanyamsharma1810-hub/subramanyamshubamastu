import fs from "fs";
import path from "path";
import { sendContactRequestEmail } from "./zeptoMailService.ts";

const DATA_DIR = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
  ? path.join('/tmp', '.data')
  : path.join(process.cwd(), ".data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const STORE_FILE = path.join(DATA_DIR, "contact_reveal_store.json");

export interface PhoneRevealRequestRecord {
  requestId: string;
  requesterId: string;
  targetUserId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  respondedAt?: string;
}

interface ContactStore {
  requests: PhoneRevealRequestRecord[];
  privacySettings: Record<string, "ALWAYS_HIDDEN" | "ON_MUTUAL_REQUEST_ONLY">;
}

function loadStore(): ContactStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error loading contact reveal store:", err);
  }
  return {
    requests: [],
    privacySettings: {}
  };
}

function saveStore(store: ContactStore) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving contact reveal store:", err);
  }
}

export const contactRevealEngine = {
  getPrivacySetting(userId: string): "ALWAYS_HIDDEN" | "ON_MUTUAL_REQUEST_ONLY" {
    const store = loadStore();
    return store.privacySettings[userId] || "ON_MUTUAL_REQUEST_ONLY";
  },

  setPrivacySetting(userId: string, setting: "ALWAYS_HIDDEN" | "ON_MUTUAL_REQUEST_ONLY") {
    const store = loadStore();
    store.privacySettings[userId] = setting;
    saveStore(store);
  },

  getRequest(requesterId: string, targetUserId: string): PhoneRevealRequestRecord | null {
    const store = loadStore();
    return store.requests.find(
      r => r.requesterId === requesterId && r.targetUserId === targetUserId
    ) || null;
  },

  getIncomingRequests(userId: string): PhoneRevealRequestRecord[] {
    const store = loadStore();
    return store.requests.filter(r => r.targetUserId === userId);
  },

  getOutgoingRequests(userId: string): PhoneRevealRequestRecord[] {
    const store = loadStore();
    return store.requests.filter(r => r.requesterId === userId);
  },

  createRequest(requesterId: string, targetUserId: string, requesterName: string, targetEmail?: string, targetName?: string) {
    const store = loadStore();
    
    // Check existing request
    let existing = store.requests.find(
      r => r.requesterId === requesterId && r.targetUserId === targetUserId
    );

    if (existing) {
      if (existing.status === "REJECTED") {
        // Allow re-requesting if previously rejected
        existing.status = "PENDING";
        existing.requestedAt = new Date().toISOString();
        existing.respondedAt = undefined;
        saveStore(store);
      }
      return { success: true, request: existing, newlyCreated: false };
    }

    const newReq: PhoneRevealRequestRecord = {
      requestId: "req_" + Math.random().toString(36).substring(2, 11),
      requesterId,
      targetUserId,
      status: "PENDING",
      requestedAt: new Date().toISOString()
    };

    store.requests.push(newReq);
    saveStore(store);

    // Send email notification via ZeptoMail if target email is provided
    if (targetEmail) {
      sendContactRequestEmail(targetEmail, requesterName, requesterId, targetName).catch(err => {
        console.error("Failed to send contact request email:", err);
      });
    }

    return { success: true, request: newReq, newlyCreated: true };
  },

  respondRequest(requestId: string, userId: string, status: "APPROVED" | "REJECTED") {
    const store = loadStore();
    const req = store.requests.find(r => r.requestId === requestId);
    if (!req) {
      return { success: false, message: "Request not found" };
    }

    if (req.targetUserId !== userId) {
      return { success: false, message: "Unauthorized action" };
    }

    req.status = status;
    req.respondedAt = new Date().toISOString();
    saveStore(store);

    return { success: true, request: req };
  },

  isApproved(requesterId: string, targetUserId: string): boolean {
    if (requesterId === targetUserId) return true;
    const store = loadStore();
    const req = store.requests.find(
      r => r.requesterId === requesterId && r.targetUserId === targetUserId && r.status === "APPROVED"
    );
    return !!req;
  }
};
