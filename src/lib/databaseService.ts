import { db, auth } from "./firebase";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, onSnapshot } from "firebase/firestore";
import { Profile, PartnerPreferences, AdminSettings, Grievance, MarriageRecord, AdminUser, getAdminStageInfo, Pandit } from "../types";
import { calculateMatchScore } from "./matchEngine";

// --- Firestore Error Handling Infrastructure ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Firestore Error Handled]: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
// ------------------------------------------------

export const ROOT_ADMINS: AdminUser[] = [
  {
    id: "admin-subbu",
    name: "Sri G.V. Subramanyam",
    mobile: "9347359489",
    password: "xG9$mK2!wP7#rT5_tV4*yC8&nB3%fX1_zS5hQ2",
    email: "subramanyamghadiyaram@gmail.com",
    role: "super_admin",
    stage: 1,
    designation: "Sole Proprietor & Chief Executive, Glark Solutions / shubhamastu.in (Stage 1 Super Admin)",
    createdAt: "2026-07-01T10:00:00Z",
    status: "active",
    isRoot: true
  },
  {
    id: "admin-subba-reddy",
    name: "Mr. Posham Venkata Subba Reddy",
    mobile: "9989079372",
    password: "SubbaReddy@2026!#",
    email: "subbareddyposham@gmail.com",
    role: "super_admin",
    stage: 2,
    designation: "Stage 2 Super Admin & Operational Head, Glark Solutions / shubhamastu.in",
    createdAt: "2026-07-07T16:00:00Z",
    status: "active",
    isRoot: true
  },
  {
    id: "admin-tejaswar",
    name: "Mr. Karna Tejaswar Reddy",
    mobile: "9392551166",
    password: "grievance123",
    email: "k.tejaswar567@gmail.com",
    role: "super_admin",
    stage: 2,
    designation: "Stage 2 Super Admin & Chief Grievance Redressal Officer",
    createdAt: "2026-08-15T10:00:00Z",
    status: "active",
    isRoot: true
  }
];

export interface AdminNotification {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  timestamp: string;
  read: boolean;
  targetCandidateId?: string;
  targetCandidateRegNumber?: string;
  category?: 'verification' | 'payment' | 'profile' | 'suspension' | 'grievance' | 'pandit' | 'system' | 'status';
}

export const INITIAL_ADMIN_AUDIT_LOGS: AdminNotification[] = [
  {
    id: "notif-seed-1",
    adminId: "admin-subbu",
    adminName: "Sri G.V. Subramanyam",
    action: "Proprietor System Initialized & Stage 1 Authority Active",
    details: "Sole Proprietor & Chief Executive initialized the Shubhamastu Brahmin Vivaha registry with strict Gotra validation.",
    timestamp: "2026-07-01T10:00:00Z",
    read: true,
    category: "system"
  },
  {
    id: "notif-seed-2",
    adminId: "admin-subba-reddy",
    adminName: "Sri Posham Venkata Subba Reddy",
    action: "Verified Payment ₹900 (Full 28-Day Membership)",
    details: "Candidate: Sharma Aditya (BVM-1001), Txn ID: UPI/20260707/98827, Received via: subbareddy@upi",
    timestamp: "2026-07-07T16:00:00Z",
    read: true,
    targetCandidateRegNumber: "BVM-1001",
    category: "payment"
  },
  {
    id: "notif-seed-3",
    adminId: "admin-tejaswar",
    adminName: "Sri Karna Tejaswar Reddy",
    action: "Resolved Grievance Case #GR-2026-001",
    details: "Candidate: Narasimhaiah (BVM-1006) - Verified phone contact and adjusted caste sub-category according to Shastra compliance.",
    timestamp: "2026-08-15T10:00:00Z",
    read: true,
    targetCandidateRegNumber: "BVM-1006",
    category: "grievance"
  }
];

export const adminNotificationService = {
  async getNotifications(): Promise<AdminNotification[]> {
    const getLocal = (): AdminNotification[] => {
      try {
        const data = localStorage.getItem("admin_notifications");
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
      localStorage.setItem("admin_notifications", JSON.stringify(INITIAL_ADMIN_AUDIT_LOGS));
      return INITIAL_ADMIN_AUDIT_LOGS;
    };

    try {
      const q = query(collection(db, "admin_notifications"));
      const snapshot = await getDocs(q);
      const list: AdminNotification[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AdminNotification);
      });

      // Merge with local list so we don't drop newly added offline/cached records
      const local = getLocal();
      const map = new Map<string, AdminNotification>();
      for (const item of local) map.set(item.id, item);
      for (const item of list) map.set(item.id, item);

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      localStorage.setItem("admin_notifications", JSON.stringify(merged.slice(0, 250)));
      return merged;
    } catch (err: any) {
      console.warn("Firestore notification fetch warning, reading local state:", err?.message);
      return getLocal();
    }
  },

  async logAction(
    adminId: string,
    adminName: string,
    action: string,
    details: string,
    meta?: {
      targetCandidateId?: string;
      targetCandidateRegNumber?: string;
      category?: 'verification' | 'payment' | 'profile' | 'suspension' | 'grievance' | 'pandit' | 'system' | 'status';
    }
  ): Promise<AdminNotification> {
    const newNotif: AdminNotification = {
      id: "notif-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
      adminId,
      adminName,
      action,
      details,
      timestamp: new Date().toISOString(),
      read: false,
      targetCandidateId: meta?.targetCandidateId,
      targetCandidateRegNumber: meta?.targetCandidateRegNumber,
      category: meta?.category || "system"
    };

    // 1. Immediately store in localStorage so UI updates synchronously
    try {
      const local = localStorage.getItem("admin_notifications");
      let list: AdminNotification[] = local ? JSON.parse(local) : [...INITIAL_ADMIN_AUDIT_LOGS];
      list = list.filter(item => item.id !== newNotif.id);
      list.unshift(newNotif);
      if (list.length > 250) list.pop();
      localStorage.setItem("admin_notifications", JSON.stringify(list));
    } catch (e) {
      console.error("Local storage notification update error:", e);
    }

    // 2. Dispatch custom event for real-time UI reaction
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin_notification_added", { detail: newNotif }));
    }

    // 3. Persist to Firestore admin_notifications
    try {
      await setDoc(doc(db, "admin_notifications", newNotif.id), newNotif);
    } catch (e: any) {
      console.warn("Firestore admin_notifications write warning:", e?.message);
    }

    // 4. Also mirror into Firestore audit_logs collection
    try {
      await setDoc(doc(db, "audit_logs", newNotif.id), {
        log_id: newNotif.id,
        action_type: action,
        admin_id: adminId,
        admin_name: adminName,
        details: details,
        candidate_reg: meta?.targetCandidateRegNumber || "",
        timestamp_ist: newNotif.timestamp
      });
    } catch (e: any) {
      // non-fatal
    }

    return newNotif;
  },

  async markAllRead(): Promise<void> {
    try {
      const local = localStorage.getItem("admin_notifications");
      if (local) {
        const list: AdminNotification[] = JSON.parse(local);
        const updated = list.map(n => ({ ...n, read: true }));
        localStorage.setItem("admin_notifications", JSON.stringify(updated));
      }
    } catch (e) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin_notification_added"));
    }

    try {
      const notifs = await this.getNotifications();
      for (const n of notifs) {
        if (!n.read) {
          await updateDoc(doc(db, "admin_notifications", n.id), { read: true }).catch(() => {});
        }
      }
    } catch (e: any) {
      console.warn("Firestore markAllRead warning:", e?.message);
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      const local = localStorage.getItem("admin_notifications");
      if (local) {
        const list: AdminNotification[] = JSON.parse(local);
        const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
        localStorage.setItem("admin_notifications", JSON.stringify(updated));
      }
    } catch (e) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin_notification_added"));
    }

    try {
      await updateDoc(doc(db, "admin_notifications", id), { read: true }).catch(() => {});
    } catch (e: any) {
      console.warn("Firestore markAsRead warning:", e?.message);
    }
  },

  subscribe(callback: (notifications: AdminNotification[]) => void): () => void {
    const getLocal = (): AdminNotification[] => {
      try {
        const data = localStorage.getItem("admin_notifications");
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
      localStorage.setItem("admin_notifications", JSON.stringify(INITIAL_ADMIN_AUDIT_LOGS));
      return INITIAL_ADMIN_AUDIT_LOGS;
    };

    // 1. Immediately emit current cached/local logs
    callback(getLocal());

    // 2. Listen to custom event and storage events
    const handleUpdate = () => {
      callback(getLocal());
    };

    if (typeof window !== "undefined") {
      window.addEventListener("admin_notification_added", handleUpdate);
      window.addEventListener("storage", handleUpdate);
    }

    // 3. Attach Firestore real-time onSnapshot
    let unsubFirestore = () => {};
    try {
      const q = query(collection(db, "admin_notifications"));
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          const list: AdminNotification[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as AdminNotification);
          });

          // Merge with local state
          const local = getLocal();
          const map = new Map<string, AdminNotification>();
          for (const item of local) map.set(item.id, item);
          for (const item of list) map.set(item.id, item);

          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          localStorage.setItem("admin_notifications", JSON.stringify(merged.slice(0, 250)));
          callback(merged);
        },
        (err) => {
          console.warn("Firestore admin_notifications subscription warning (using local):", err?.message);
          callback(getLocal());
        }
      );
    } catch (e) {
      console.warn("Firestore admin_notifications subscribe init error:", e);
    }

    return () => {
      unsubFirestore();
      if (typeof window !== "undefined") {
        window.removeEventListener("admin_notification_added", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      }
    };
  },
  async logPendingVerification(email: string, otp: string) {
    try {
      await setDoc(doc(db, "pending_verifications", email.toLowerCase()), {
        email,
        otp,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "pending_verifications");
    }
  },
  subscribePendingVerifications(callback: (verifications: any[]) => void) {
    const q = query(collection(db, "pending_verifications"));
    return onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "pending_verifications");
    });
  },
  async elevateToAdmin(uid: string, adminDetails: any) {
    try {
      await setDoc(doc(db, "admins", uid), {
        ...adminDetails,
        elevatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "admins");
    }
  }
};

export const systemAuditService = {
  async getLogs(): Promise<any[]> {
    try {
      const q = query(collection(db, "audit_logs"));
      const snapshot = await getDocs(q);
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => new Date(b.timestamp_ist).getTime() - new Date(a.timestamp_ist).getTime());
      return list;
    } catch (err) {
      const local = localStorage.getItem("system_audit_logs");
      return local ? JSON.parse(local) : [];
    }
  },
  async logEvent(event: any) {
    const logId = event.log_id || `AUDIT-${Date.now()}`;
    const entry = {
      ...event,
      log_id: logId,
      timestamp_ist: event.timestamp_ist || new Date().toISOString()
    };
    try {
      await setDoc(doc(db, "audit_logs", logId), entry);
    } catch (e) {
      if ((e as any)?.code !== 'permission-denied') {
        handleFirestoreError(e, OperationType.CREATE, "audit_logs");
      }
    }
    const local = localStorage.getItem("system_audit_logs");
    const list = local ? JSON.parse(local) : [];
    list.unshift(entry);
    if (list.length > 200) list.pop();
    localStorage.setItem("system_audit_logs", JSON.stringify(list));
  }
};

export function generateRandomPassword(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const mix = "abcdefghijklmnopqrstuvwxyz0123456789";
  const len1 = 10 + Math.floor(Math.random() * 4); // 10 to 13
  const len2 = 5 + Math.floor(Math.random() * 4);  // 5 to 8
  let part1 = "";
  for (let i = 0; i < len1; i++) {
    part1 += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  let part2 = "";
  for (let i = 0; i < len2; i++) {
    part2 += mix.charAt(Math.floor(Math.random() * mix.length));
  }
  return `${part1}_${part2}`;
}

export function generateDefaultDobPassword(dob?: string): string {
  if (!dob) return generateRandomPassword();
  const cleanDob = dob.trim();
  const match = cleanDob.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (match) {
    const [_, yyyy, mm, dd] = match;
    return `${dd}${mm}${yyyy}`;
  }
  return cleanDob.replace(/[-/]/g, "") || generateRandomPassword();
}

// Pre-seeded, beautiful profiles reflecting the "Shiva & Sati" spiritual theme
const PRE_SEEDED_PROFILES: Profile[] = [
  {
    id: "admin-subbu",
    reg_number: "BVM-1001",
    password: "xG9$mK2!wP7#rT5_tV4*yC8&nB3%fX1_zS5hQ2",
    name: "Sri G.V. Subramanyam (Founder, Managing Director & Proprietor)",
    dob: "1995-08-15",
    gender: "Male",
    height_feet: 5.9,
    sub_caste: "Smartha",
    profession: "Founder, Managing Director & Proprietor",
    salary_lpa: 14.5,
    contact_number: "9347359489",
    status: "Verified",
    role: "admin",
    email: "subramanyamghadiyaram@gmail.com",
    subscription_status: "paid_900",
    photo_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
    birth_time: "06:15",
    birth_location: "Vijayawada, India",
    gothram: "Srivatsa",
    surname: "Ghadiyaram",
    astrology: {
      nakshatra: "Swati",
      nakshatraLord: "Rahu",
      pada: 3,
      rashi: "Tula (Libra)",
      tithi: "Shukla Dwadashi",
      deity: "Vayu",
      spiritualAnalysis: "Blessed with strong intellectual acumen and profound Vedic astrology skills. Calm and cosmic-oriented soul.",
      compatibilityTraits: ["Profoundly spiritual", "Wise teacher", "Devoted family values"],
      spiritualScore: 98
    },
    created_at: "2026-07-01T10:00:00Z"
  },
  {
    id: "admin-subba-reddy",
    reg_number: "BVM-1007",
    password: "SubbaReddy@2026!#",
    name: "PV Subba Reddy (Stage 2 Super Admin & Co-Founder)",
    dob: "1980-01-01",
    gender: "Male",
    height_feet: 5.10,
    sub_caste: "Smartha",
    profession: "CEO & Stage 2 Super Admin",
    salary_lpa: 30.0,
    contact_number: "9989079372",
    status: "Verified",
    role: "admin",
    subscription_status: "paid_900",
    photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
    birth_time: "08:00",
    birth_location: "Cuddapah, India",
    gothram: "Bharadwaja",
    surname: "PV",
    astrology: {
      nakshatra: "Krittika",
      nakshatraLord: "Sun",
      pada: 1,
      rashi: "Mesha (Aries)",
      tithi: "Shukla Pratipada",
      deity: "Agni",
      spiritualAnalysis: "Strong-willed, determined, and deeply administrative. Possesses excellent leadership qualities and traditional alignment.",
      compatibilityTraits: ["Dignified leadership", "Traditional values", "Reliable coordinator"],
      spiritualScore: 92
    },
    created_at: "2026-07-07T16:00:00Z",
    email: "Subbareddyposham@gmail.com"
  },
  {
    id: "admin-tejaswar",
    reg_number: "BVM-1010",
    password: "grievance123",
    name: "Mr. Karna Teajushwar Reddy (Stage 2 Super Admin & Chief Grievance Officer)",
    dob: "1992-05-20",
    gender: "Male",
    height_feet: 5.11,
    sub_caste: "Smartha",
    profession: "Chief Grievance Redressal Officer & Stage 2 Super Admin",
    salary_lpa: 18.0,
    contact_number: "9392551166",
    email: "K.tejaswar567@gmail.com",
    status: "Verified",
    role: "admin",
    photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
    birth_time: "10:30",
    birth_location: "Hyderabad, India",
    gothram: "Bharadwaja",
    surname: "Karna",
    astrology: {
      nakshatra: "Pushya",
      nakshatraLord: "Saturn",
      pada: 2,
      rashi: "Karkataka (Cancer)",
      tithi: "Shukla Saptami",
      deity: "Brihaspati",
      spiritualAnalysis: "Dedicated legal and grievance redressal officer committed to absolute transparency and platform integrity.",
      compatibilityTraits: ["Lawful", "Diligent", "Protective guardian"],
      spiritualScore: 95
    },
    created_at: "2026-08-15T10:00:00Z"
  },
  {
    id: "prof-yeashwini-9876543210",
    reg_number: "BVM-2026",
    password: "yeashawini.p@phonepe",
    name: "Yeashwini",
    surname: "P",
    dob: "1998-05-15",
    gender: "Female",
    height_feet: 5.4,
    sub_caste: "Smartha",
    profession: "Software Professional",
    company_name: "PhonePe",
    salary_lpa: 18.5,
    contact_number: "9876543210",
    email: "yeashaswini.p@phonepe.com",
    isEmailVerified: true,
    status: "Active",
    role: "candidate",
    subscription_status: "paid_100",
    payment_received: true,
    photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
    birth_time: "07:30",
    birth_location: "Bengaluru, India",
    current_city: "Bengaluru",
    gothram: "Kasyapa",
    astrology: {
      nakshatra: "Swati",
      nakshatraLord: "Rahu",
      pada: 2,
      rashi: "Tula (Libra)",
      tithi: "Shukla Dashami",
      deity: "Vayu",
      spiritualAnalysis: "Generous, highly accomplished, culturally rooted, spiritually aligned.",
      compatibilityTraits: ["Kindhearted", "Vedic values", "Respectful family culture"],
      spiritualScore: 94
    },
    created_at: "2026-08-01T10:00:00Z"
  }
];

// Initialize localStorage DB preserving existing and merged user profiles
if (typeof window !== "undefined") {
  try {
    const existing = localStorage.getItem("matrimonial_profiles");
    if (!existing) {
      localStorage.setItem("matrimonial_profiles", JSON.stringify(PRE_SEEDED_PROFILES));
    } else {
      const parsed: Profile[] = JSON.parse(existing);
      const map = new Map<string, Profile>();
      for (const p of parsed) map.set(p.id, p);
      // Ensure all seed profiles (including Yeashwini & admins) are always guaranteed present
      for (const p of PRE_SEEDED_PROFILES) {
        if (!map.has(p.id) || p.id === "prof-yeashwini-9876543210") {
          map.set(p.id, p);
        }
      }
      localStorage.setItem("matrimonial_profiles", JSON.stringify(Array.from(map.values())));
    }
  } catch (e) {
    localStorage.setItem("matrimonial_profiles", JSON.stringify(PRE_SEEDED_PROFILES));
  }

  const initialPrefs = [
    { user_id: "admin-subbu", age_gap: 5, height_range: "5.0 - 5.7", preferred_sub_caste: "Any" }
  ];
  if (!localStorage.getItem("partner_preferences")) {
    localStorage.setItem("partner_preferences", JSON.stringify(initialPrefs));
  }
}

// Pre-seeded, legally compliant grievances for demonstration and extensive local/cloud testing
const PRE_SEEDED_GRIEVANCES: Grievance[] = [
  {
    id: "G-84729",
    reporterId: "C-104",
    reporterName: "Srividya G.",
    reporterPhone: "+91 94912 34567",
    accusedId: "C-201",
    accusedName: "Narasimhaiah (Mechanical Engineer)",
    accusedPhone: "+91 98855 12345",
    category: "Fake Profile",
    description: "The candidate Narasimhaiah, registered as a Mechanical Engineer, has uploaded incorrect salary and professional credentials. Upon our family verification, the company details did not match. Please verify or suspend this profile.",
    reportedAt: "2026-07-16T18:30:00.000Z",
    status: "Pending"
  },
  {
    id: "G-10001",
    reporterId: "admin-subbu",
    reporterName: "Sri G.V. Subramanyam (Founder)",
    reporterPhone: "+91 93473 59489",
    accusedId: "C-301",
    accusedName: "Ranga Rao (System Analyst)",
    accusedPhone: "+91 98480 22334",
    category: "Fake Profile",
    description: "The accused reported a salary of 24 LPA, but during background verification, the pay slips and employer verification returned invalid credentials. Under active investigation.",
    reportedAt: "2026-07-17T08:15:00.000Z",
    status: "Pending"
  },
  {
    id: "G-10002",
    reporterId: "admin-subba-reddy",
    reporterName: "Sri P.V. Subba Reddy (CEO)",
    reporterPhone: "+91 94949 49494",
    accusedId: "C-302",
    accusedName: "Venkata Raman (Business Analyst)",
    accusedPhone: "+91 99081 23456",
    category: "Fake Profile",
    description: "Multiple users reported that Venkata Raman is already married and has submitted a fake single status declaration. Two-way investigations are actively underway.",
    reportedAt: "2026-07-17T09:30:00.000Z",
    status: "Under Investigation"
  },
  {
    id: "G-10003",
    reporterId: "C-405",
    reporterName: "Kalyani Sharma",
    reporterPhone: "+91 70134 56789",
    accusedId: "admin-subbu",
    accusedName: "Sri G.V. Subramanyam (Test Account)",
    accusedPhone: "+91 93473 59489",
    category: "Harassment/Unwanted Calls",
    description: "This is a dual testing query involving GV Subramanyam's own test number to verify the multi-tier warning alerts, temporary suspension length, and automatic Telugu/English WhatsApp templates.",
    reportedAt: "2026-07-17T10:45:00.000Z",
    status: "Pending"
  },
  {
    id: "G-10004",
    reporterId: "admin-subba-reddy",
    reporterName: "Sri P.V. Subba Reddy (Test Reporter)",
    reporterPhone: "+91 94949 49494",
    accusedId: "admin-subbu",
    accusedName: "Sri G.V. Subramanyam (Test Candidate)",
    accusedPhone: "+91 93473 59489",
    category: "Fake Profile",
    description: "Cross-verification test case: Dual safety investigation involving PV Subba Reddy reporting GV Subramanyam. Ideal for testing joint safety notice alerts.",
    reportedAt: "2026-07-17T11:00:00.000Z",
    status: "Under Investigation"
  },
  {
    id: "G-10005",
    reporterId: "C-509",
    reporterName: "Anusha Sastry",
    reporterPhone: "+91 88971 12233",
    accusedId: "admin-subba-reddy",
    accusedName: "Sri P.V. Subba Reddy (Test Account)",
    accusedPhone: "+91 94949 49494",
    category: "Fake Profile",
    description: "Testing permanent lifetime ban message flows and fake complaint warnings. Designed to evaluate the exact warning scenario responses for Subba Reddy's number.",
    reportedAt: "2026-07-17T11:30:00.000Z",
    status: "Pending"
  },
  {
    id: "G-10006",
    reporterId: "admin-subbu",
    reporterName: "Sri G.V. Subramanyam (Reporter)",
    reporterPhone: "+91 93473 59489",
    accusedId: "C-612",
    accusedName: "Sravanthi Mishra",
    accusedPhone: "+91 91122 33445",
    category: "Fake Profile",
    description: "Unmatched Nakshatra & Gothra details. This complaint is logged to test the fake complaint warnings and forgiven/reinstated WhatsApp communication flows.",
    reportedAt: "2026-07-17T12:00:00.000Z",
    status: "Resolved"
  },
  {
    id: "G-10007",
    reporterId: "C-702",
    reporterName: "Vasudha Murthy",
    reporterPhone: "+91 94405 67890",
    accusedId: "C-703",
    accusedName: "Pranav Kasyap",
    accusedPhone: "+91 93939 12345",
    category: "Harassment/Unwanted Calls",
    description: "Reporter complained about disrespectful chat communication. The investigation has been completed, and the profile was suspended for 7 days.",
    reportedAt: "2026-07-17T12:30:00.000Z",
    status: "Resolved"
  }
];

async function compressBase64Image(base64Str?: string, maxWidth = 400, quality = 0.5): Promise<string | undefined> {
  if (!base64Str || !base64Str.startsWith("data:image")) return base64Str;

  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(base64Str);
      return;
    }
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400");
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      let compressed = canvas.toDataURL("image/jpeg", quality);
      if (compressed.length > 900000) {
        compressed = canvas.toDataURL("image/jpeg", 0.3);
      }
      resolve(compressed);
    };
    img.onerror = () => resolve("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400");
  });
}

export const databaseService = {
  // Profiles Methods
  subscribeProfiles(callback: (profiles: Profile[]) => void) {
    const q = query(collection(db, "profiles"));
    return onSnapshot(q, (snapshot) => {
      const rawProfiles: Profile[] = [];
      snapshot.forEach((docSnap) => {
        rawProfiles.push(docSnap.data() as Profile);
      });
      
      // Merge with pre-seeded admins to ensure they are always visible to admins
      for (const p of PRE_SEEDED_PROFILES) {
        if (!rawProfiles.some(rp => rp.id === p.id)) {
          rawProfiles.push(p);
        }
      }

      // Sort profiles by created_at descending
      rawProfiles.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      callback(rawProfiles);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "profiles");
    });
  },

  async getProfiles(ignoreFilter = false): Promise<Profile[]> {
    let rawProfiles: Profile[] = [];
    try {
      const isAdminSession = typeof window !== "undefined" && localStorage.getItem("bramhana_admin_session") === "true";
      const q = query(collection(db, "profiles"));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Seed Firestore collection with default profiles on first run IF ADMIN
        if (isAdminSession) {
          for (const p of PRE_SEEDED_PROFILES) {
            await setDoc(doc(db, "profiles", p.id), p);
          }
        }
        rawProfiles = [...PRE_SEEDED_PROFILES];
      } else {
        querySnapshot.forEach((docSnap) => {
          rawProfiles.push(docSnap.data() as Profile);
        });
        
        // Guarantee the admin profiles are always fully up-to-date with current pre-seeded admin details
        // Only attempt this if it's an admin session to avoid permission errors
        if (isAdminSession) {
          for (const p of PRE_SEEDED_PROFILES) {
            const existingAdmin = rawProfiles.find(rp => rp.id === p.id);
            if (!existingAdmin || existingAdmin.contact_number !== p.contact_number || existingAdmin.password !== p.password || existingAdmin.name !== p.name) {
              try {
                await setDoc(doc(db, "profiles", p.id), p);
              } catch (fsErr) {
                // Non-fatal sync
              }
              if (existingAdmin) {
                const idx = rawProfiles.indexOf(existingAdmin);
                if (idx > -1) rawProfiles[idx] = p;
              } else {
                rawProfiles.push(p);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        console.warn("Firestore access restricted, reading from local cache...");
      } else {
        console.error("Firestore profiles fetch error:", err);
      }
      const local = localStorage.getItem("matrimonial_profiles");
      rawProfiles = local ? JSON.parse(local) : PRE_SEEDED_PROFILES;
    }

    // Always merge with localStorage to ensure local profiles are fully preserved and synchronized
    const local = localStorage.getItem("matrimonial_profiles");
    if (local) {
      try {
        const localProfiles: Profile[] = JSON.parse(local);
        for (const lp of localProfiles) {
          if (!rawProfiles.some((rp) => rp.id === lp.id)) {
            rawProfiles.push(lp);
            // Proactively try to sync this missing local profile to Firestore
            try {
              const safeLp = { ...lp };
              if (safeLp.photo_url && safeLp.photo_url.startsWith("data:image") && safeLp.photo_url.length > 900000) {
                safeLp.photo_url = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400";
              }
              await setDoc(doc(db, "profiles", lp.id), safeLp);
            } catch (syncErr) {
              // Silently handle size or network sync errors
            }
          }
        }
      } catch (parseErr) {
        console.error("Error parsing local profiles:", parseErr);
      }
    }

    // Sort profiles by created_at descending
    rawProfiles.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    // Update local cache
    if (rawProfiles.length > 0) {
      localStorage.setItem("matrimonial_profiles", JSON.stringify(rawProfiles));
    }

    if (ignoreFilter) {
      return rawProfiles;
    }

    // ROW LEVEL SECURITY (RLS) MASKING: Mask contact numbers for all users except admins and owners
    const currentUserId = typeof window !== "undefined" ? localStorage.getItem("bramhana_logged_in_user_id") : null;
    const isAdminUser = currentUserId === "admin-subbu" || currentUserId === "admin-subba-reddy" || currentUserId === "admin-tejaswar" || localStorage.getItem("bramhana_admin_session") === "true";

    return rawProfiles.map(p => {
      const isOwner = p.id === currentUserId;
      const isSubbu = p.id === "admin-subbu" || (p.contact_number && p.contact_number.includes("9347359489"));
      const isSubbaReddy = p.id === "admin-subba-reddy" || (p.contact_number && p.contact_number.includes("9494949494"));
      
      if (!isAdminUser && !isOwner) {
        // Mask phone number for prestige protection
        return {
          ...p,
          contact_number: p.contact_number ? p.contact_number.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2") : "Masked",
          email: "Protected"
        };
      }
      return p;
    }).filter((p) => {
      if (!isAdminUser) {
        const isSubbu = p.id === "admin-subbu" || (p.contact_number && p.contact_number.includes("9347359489"));
        const isSubbaReddy = p.id === "admin-subba-reddy" || (p.contact_number && p.contact_number.includes("9494949494"));
        return !isSubbu && !isSubbaReddy && p.role !== "admin";
      }
      return true;
    });
  },

  async getPrivateProfileData(profileId: string): Promise<{ contact_number: string, email?: string, password?: string } | null> {
    try {
      const docRef = doc(db, "profiles", profileId, "private", "data");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as { contact_number: string, email?: string, password?: string };
      }
    } catch (err) {
      console.warn(`Error fetching private data for ${profileId}:`, err);
    }
    return null;
  },

  async getProfileByPhone(identifier: string): Promise<Profile | null> {
    const raw = identifier ? identifier.trim() : "";
    if (!raw) return null;
    const cleanPhone = raw.replace(/\D/g, "");
    const lower = raw.toLowerCase();

    // 1. Instant check in localStorage
    try {
      const local = typeof window !== "undefined" ? localStorage.getItem("matrimonial_profiles") : null;
      if (local) {
        const profiles: Profile[] = JSON.parse(local);
        const match = profiles.find(p => {
          const pPhone = p.contact_number ? p.contact_number.replace(/\D/g, "") : "";
          const pEmail = p.email ? p.email.trim().toLowerCase() : "";
          const pReg = p.reg_number ? p.reg_number.trim().toLowerCase() : "";
          const pId = p.id ? p.id.toLowerCase() : "";
          return (cleanPhone && cleanPhone.length >= 10 && pPhone === cleanPhone) ||
                 (lower && pEmail === lower) ||
                 (lower && pReg === lower) ||
                 (lower && pId === lower);
        });
        if (match) return match;
      }
    } catch (e) {
      console.warn("Local storage lookup warning:", e);
    }

    // 2. Instant check in PRE_SEEDED_PROFILES (includes Yeashwini & admins)
    const seeded = PRE_SEEDED_PROFILES.find(p => {
      const pPhone = p.contact_number ? p.contact_number.replace(/\D/g, "") : "";
      const pEmail = p.email ? p.email.trim().toLowerCase() : "";
      const pReg = p.reg_number ? p.reg_number.trim().toLowerCase() : "";
      const pId = p.id ? p.id.toLowerCase() : "";
      return (cleanPhone && cleanPhone.length >= 10 && pPhone === cleanPhone) ||
             (lower && pEmail === lower) ||
             (lower && pReg === lower) ||
             (lower && pId === lower);
    });
    if (seeded) return seeded;

    // 3. Fallback: Search Firestore phone_lookup with timeout
    try {
      if (cleanPhone && cleanPhone.length >= 10) {
        const lookupRef = doc(db, "phone_lookup", cleanPhone);
        const lookupSnap = await Promise.race([
          getDoc(lookupRef),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
        ]) as any;
        
        if (lookupSnap && lookupSnap.exists()) {
          const profileId = lookupSnap.data().profileId;
          const profRef = doc(db, "profiles", profileId);
          const profSnap = await getDoc(profRef);
          if (profSnap && profSnap.exists()) {
            const profile = profSnap.data() as Profile;
            const privateData = await this.getPrivateProfileData(profileId);
            return {
              ...profile,
              contact_number: privateData?.contact_number || profile.contact_number,
              email: privateData?.email || profile.email,
              password: privateData?.password || profile.password
            };
          }
        }
      }
    } catch (err: any) {
      console.warn("Firestore lookup bypassed:", err?.message);
    }

    // 4. Fallback search across all loaded profiles
    try {
      const all = await this.getProfiles(true);
      const match = all.find(p => {
        const pPhone = p.contact_number ? p.contact_number.replace(/\D/g, "") : "";
        const pEmail = p.email ? p.email.trim().toLowerCase() : "";
        const pReg = p.reg_number ? p.reg_number.trim().toLowerCase() : "";
        return (cleanPhone && cleanPhone.length >= 10 && pPhone === cleanPhone) ||
               (lower && pEmail === lower) ||
               (lower && pReg === lower);
      });
      if (match) return match;
    } catch (e) {}

    return null;
  },

  async saveProfile(profile: Profile): Promise<Profile> {
    const finalProfile = { ...profile };

    try {
      finalProfile.photo_url = await compressBase64Image(finalProfile.photo_url);
      finalProfile.photo_url_2 = await compressBase64Image(finalProfile.photo_url_2);
      finalProfile.photo_url_3 = await compressBase64Image(finalProfile.photo_url_3);
      finalProfile.kundali_url = await compressBase64Image(finalProfile.kundali_url);
    } catch (e) {
      console.warn("Image compression warning, using original:", e);
    }
    
    if (!finalProfile.id) {
      finalProfile.id = `prof-${Date.now()}`;
    }
    
    if (!finalProfile.created_at) {
      finalProfile.created_at = new Date().toISOString();
    }
    
    if (!finalProfile.password) {
      finalProfile.password = generateDefaultDobPassword(finalProfile.dob);
    }
    
    // Generate next sequential reg_number based on all central profiles
    if (!finalProfile.reg_number) {
      try {
        const local = typeof window !== "undefined" ? localStorage.getItem("matrimonial_profiles") : null;
        const allProfiles: Profile[] = local ? JSON.parse(local) : [...PRE_SEEDED_PROFILES];
        const regNumbers = allProfiles
          .map(p => p.reg_number)
          .filter((r): r is string => !!r && r.startsWith("BVM-"));
        let maxNum = 2026;
        if (regNumbers.length > 0) {
          const nums = regNumbers.map(r => parseInt(r.replace("BVM-", ""), 10) || 0);
          maxNum = Math.max(...nums, maxNum);
        }
        finalProfile.reg_number = `BVM-${maxNum + 1}`;
      } catch (_) {
        finalProfile.reg_number = `BVM-${Math.floor(2027 + Math.random() * 9000)}`;
      }
    }

    if (!finalProfile.approved_matches) {
      finalProfile.approved_matches = [];
    }

    // STEP 1: Synchronously commit to localStorage FIRST - Registration NEVER fails or hangs
    try {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("matrimonial_profiles");
        let current: Profile[] = local ? JSON.parse(local) : [...PRE_SEEDED_PROFILES];
        current = current.filter((p) => p.id !== finalProfile.id);
        current.unshift(finalProfile);
        localStorage.setItem("matrimonial_profiles", JSON.stringify(current));
      }
    } catch (storageErr) {
      console.warn("LocalStorage save warning:", storageErr);
    }

    // STEP 2: In-memory reciprocal matching calculations
    try {
      const local = typeof window !== "undefined" ? localStorage.getItem("matrimonial_profiles") : null;
      const allProfiles: Profile[] = local ? JSON.parse(local) : [...PRE_SEEDED_PROFILES];
      for (const p of allProfiles) {
        if (p.id === finalProfile.id) continue;
        if (p.gender === finalProfile.gender) continue;

        if (finalProfile.gothram && p.gothram) {
          if (finalProfile.gothram.trim().toLowerCase() === p.gothram.trim().toLowerCase()) {
            continue;
          }
        }

        const score = calculateMatchScore(finalProfile, p);
        if (score.totalScore >= 45) {
          if (!finalProfile.approved_matches.includes(p.id)) {
            finalProfile.approved_matches.push(p.id);
          }
          if (!p.approved_matches) p.approved_matches = [];
          if (!p.approved_matches.includes(finalProfile.id)) {
            p.approved_matches.push(finalProfile.id);
          }
        }
      }
      // Re-save updated matching coordinates to localStorage
      if (typeof window !== "undefined") {
        let updatedList: Profile[] = local ? JSON.parse(local) : [...PRE_SEEDED_PROFILES];
        updatedList = updatedList.filter((p) => p.id !== finalProfile.id);
        updatedList.unshift(finalProfile);
        localStorage.setItem("matrimonial_profiles", JSON.stringify(updatedList));
      }
    } catch (e) {
      console.warn("Reciprocal matching calculation notice:", e);
    }

    // STEP 3: Non-blocking Firestore synchronization with strict timeout
    // Prevents "FirebaseError: Operation cancelled" from freezing registration
    (async () => {
      try {
        const publicProfile = { ...finalProfile };
        if (publicProfile.contact_number) {
          publicProfile.contact_number = publicProfile.contact_number.replace(/(\d{3})\d{4}(\d{2})/, "$1****$2");
        }
        publicProfile.email = "protected@shubhamastu.in";

        const cleanPhone = profile.contact_number ? profile.contact_number.replace(/\D/g, "") : "";

        const fsTasks = [
          setDoc(doc(db, "profiles", finalProfile.id), publicProfile).catch(() => {}),
          setDoc(doc(db, "profiles", finalProfile.id, "private", "data"), {
            contact_number: profile.contact_number,
            email: profile.email || "",
            password: finalProfile.password
          }).catch(() => {})
        ];

        if (cleanPhone) {
          fsTasks.push(
            setDoc(doc(db, "phone_lookup", cleanPhone), {
              profileId: finalProfile.id,
              timestamp: new Date().toISOString()
            }).catch(() => {})
          );
        }

        await Promise.race([
          Promise.all(fsTasks),
          new Promise((resolve) => setTimeout(resolve, 2500))
        ]);
      } catch (err: any) {
        console.warn("Firestore sync background notice (local storage preserved):", err?.message);
      }
    })();

    return finalProfile;
  },

  async updateProfileStatus(id: string, status: Profile["status"]): Promise<boolean> {
    try {
      await updateDoc(doc(db, "profiles", id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${id}`);
    }

    // Local Storage Fallback
    const local = localStorage.getItem("matrimonial_profiles");
    if (local) {
      const current: Profile[] = JSON.parse(local);
      const index = current.findIndex((p) => p.id === id);
      if (index >= 0) {
        current[index].status = status;
        localStorage.setItem("matrimonial_profiles", JSON.stringify(current));
        return true;
      }
    }
    return false;
  },

  async updateSubscriptionStatus(
    id: string, 
    subscription_status: Profile["subscription_status"],
    fee_received_by?: string,
    fee_transaction_id?: string,
    fee_received_at?: string,
    fee_receiver_upi?: string
  ): Promise<boolean> {
    const updateData: any = { subscription_status };
    if (subscription_status && subscription_status !== "free") {
      updateData.status = "Verified";
      const expiryDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      updateData.subscription_expires_at = expiryDate;
    } else {
      updateData.subscription_expires_at = null;
    }
    if (fee_received_by !== undefined) updateData.fee_received_by = fee_received_by;
    if (fee_transaction_id !== undefined) updateData.fee_transaction_id = fee_transaction_id;
    if (fee_received_at !== undefined) updateData.fee_received_at = fee_received_at;
    if (fee_receiver_upi !== undefined) updateData.fee_receiver_upi = fee_receiver_upi;

    try {
      await updateDoc(doc(db, "profiles", id), updateData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${id}`);
    }

    // Local Storage Fallback
    const local = localStorage.getItem("matrimonial_profiles");
    if (local) {
      const current: Profile[] = JSON.parse(local);
      const index = current.findIndex((p) => p.id === id);
      if (index >= 0) {
        current[index].subscription_status = subscription_status;
        if (subscription_status && subscription_status !== "free") {
          current[index].status = "Verified";
          const expiryDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          current[index].subscription_expires_at = expiryDate;
        } else {
          current[index].subscription_expires_at = undefined;
        }
        if (fee_received_by !== undefined) current[index].fee_received_by = fee_received_by;
        if (fee_transaction_id !== undefined) current[index].fee_transaction_id = fee_transaction_id;
        if (fee_received_at !== undefined) current[index].fee_received_at = fee_received_at;
        if (fee_receiver_upi !== undefined) current[index].fee_receiver_upi = fee_receiver_upi;
        localStorage.setItem("matrimonial_profiles", JSON.stringify(current));
        return true;
      }
    }
    return false;
  },

  async purgeFakeData(): Promise<Profile[]> {
    // Only attempt Firestore purge if user is logged in as a root admin (or has admin session)
    const isAdminSession = localStorage.getItem("bramhana_admin_session") === "true";
    if (!isAdminSession) {
      console.log("Skipping Firestore profile purge (Non-admin session).");
      const local = localStorage.getItem("matrimonial_profiles");
      return local ? JSON.parse(local) : PRE_SEEDED_PROFILES;
    }

    const path = "profiles";
    try {
      const q = query(collection(db, path));
      const querySnapshot = await getDocs(q);
      for (const docSnap of querySnapshot.docs) {
        const id = docSnap.id;
        if (id !== "admin-subbu" && id !== "admin-subba-reddy" && id !== "admin-tejaswar") {
          await deleteDoc(doc(db, path, id)).catch(() => {});
        }
      }
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        console.warn("Firestore profile purge failed due to permission denied. This is expected if elevation hasn't synced yet.");
      } else {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }

    const preserved = PRE_SEEDED_PROFILES.filter(p => p.id === "admin-subbu" || p.id === "admin-subba-reddy" || p.id === "admin-tejaswar");
    localStorage.setItem("matrimonial_profiles", JSON.stringify(preserved));
    return preserved;
  },

  async deleteProfile(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "profiles", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `profiles/${id}`);
    }

    // Local Storage Fallback
    const local = localStorage.getItem("matrimonial_profiles");
    if (local) {
      const current: Profile[] = JSON.parse(local);
      const filtered = current.filter((p) => p.id !== id);
      localStorage.setItem("matrimonial_profiles", JSON.stringify(filtered));
      return true;
    }
    return false;
  },

  // Partner Preferences Methods
  async getAllPartnerPreferences(): Promise<PartnerPreferences[]> {
    let rawPrefs: PartnerPreferences[] = [];
    try {
      const querySnapshot = await getDocs(collection(db, "partner_preferences"));
      querySnapshot.forEach((docSnap) => {
        rawPrefs.push(docSnap.data() as PartnerPreferences);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "partner_preferences");
    }

    // Always merge with localStorage to ensure local partner preferences are fully preserved and synchronized
    const local = localStorage.getItem("partner_preferences");
    if (local) {
      try {
        const localPrefs: PartnerPreferences[] = JSON.parse(local);
        for (const lp of localPrefs) {
          if (!rawPrefs.some((rp) => rp.user_id === lp.user_id)) {
            rawPrefs.push(lp);
            // Proactively try to sync this missing local preference to Firestore
            try {
              await setDoc(doc(db, "partner_preferences", lp.user_id), lp);
            } catch (syncErr) {
              console.warn(`Background sync failed for partner preferences of ${lp.user_id}:`, syncErr);
            }
          }
        }
      } catch (parseErr) {
        console.error("Error parsing local partner preferences:", parseErr);
      }
    }

    if (rawPrefs.length > 0) {
      localStorage.setItem("partner_preferences", JSON.stringify(rawPrefs));
    }
    return rawPrefs;
  },

  async getPartnerPreferences(userId: string): Promise<PartnerPreferences | null> {
    try {
      const docRef = doc(db, "partner_preferences", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as PartnerPreferences;
      }
    } catch (err) {
      console.warn("Error fetching preferences from Firestore, reading local state:", err);
    }

    const local = localStorage.getItem("partner_preferences");
    if (local) {
      const current: PartnerPreferences[] = JSON.parse(local);
      const match = current.find((p) => p.user_id === userId);
      return match || null;
    }
    return null;
  },

  async savePartnerPreferences(pref: PartnerPreferences): Promise<PartnerPreferences> {
    try {
      await setDoc(doc(db, "partner_preferences", pref.user_id), pref);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `partner_preferences/${pref.user_id}`);
    }

    // Local Storage Fallback
    const local = localStorage.getItem("partner_preferences");
    let current: PartnerPreferences[] = local ? JSON.parse(local) : [];

    const existingIndex = current.findIndex((p) => p.user_id === pref.user_id);
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...pref };
    } else {
      current.push(pref);
    }

    localStorage.setItem("partner_preferences", JSON.stringify(current));
    return pref;
  },

  // Storage Methods (Upload base64 representation to Firestore/Local storage simulated)
  async uploadFile(file: File, bucket: string, userId: string): Promise<string> {
    // Return a base64 representation which works everywhere flawlessly without complex setup
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  },

  async getAdminSettings(): Promise<AdminSettings> {
    const defaultSettings: AdminSettings = {
      subramanyamUpi: "subramanyam@upi",
      subramanyamQr: "",
      subbaReddyUpi: "subbareddy@upi",
      subbaReddyQr: ""
    };
    let currentSettings = { ...defaultSettings };
    let hasFirestoreData = false;

    try {
      const docRef = doc(db, "settings", "admin_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        currentSettings = { ...defaultSettings, ...docSnap.data() } as AdminSettings;
        hasFirestoreData = true;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "settings/admin_config");
    }

    const local = localStorage.getItem("bramhana_admin_settings");
    if (local) {
      try {
        const localSettings = JSON.parse(local);
        if (!hasFirestoreData) {
          // Merge local settings as Firestore didn't have any
          currentSettings = { ...currentSettings, ...localSettings };
          // Sync back to Firestore in background
          try {
            await setDoc(doc(db, "settings", "admin_config"), currentSettings);
          } catch (syncErr) {
            console.warn("Background sync of admin settings failed:", syncErr);
          }
        }
      } catch (e) {
        console.error("Error parsing local admin settings:", e);
      }
    }

    localStorage.setItem("bramhana_admin_settings", JSON.stringify(currentSettings));
    return currentSettings;
  },

  async saveAdminSettings(settings: AdminSettings): Promise<AdminSettings> {
    try {
      await setDoc(doc(db, "settings", "admin_config"), settings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/admin_config");
    }
    localStorage.setItem("bramhana_admin_settings", JSON.stringify(settings));
    return settings;
  },

// Grievance / Case-Handling Redressal (IT Act 2021) Methods
  async getGrievances(): Promise<Grievance[]> {
    let rawGrievances: Grievance[] = [];
    try {
      const querySnapshot = await getDocs(collection(db, "grievances"));
      querySnapshot.forEach((docSnap) => {
        rawGrievances.push(docSnap.data() as Grievance);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "grievances");
    }

    // Ensure the pre-seeded Narasimhaiah grievance is present so the admin always has it
    for (const psg of PRE_SEEDED_GRIEVANCES) {
      if (!rawGrievances.some((g) => g.id === psg.id)) {
        rawGrievances.push(psg);
        try {
          await setDoc(doc(db, "grievances", psg.id), psg);
        } catch (syncErr) {
          console.warn("Background sync of pre-seeded grievance failed:", syncErr);
        }
      }
    }

    // Always merge with localStorage to ensure local registrations/complaints are fully preserved and synchronized
    const local = localStorage.getItem("matrimonial_grievances");
    if (local) {
      try {
        const localGrievances: Grievance[] = JSON.parse(local);
        for (const lg of localGrievances) {
          if (!rawGrievances.some((rg) => rg.id === lg.id)) {
            rawGrievances.push(lg);
            // Proactively try to sync this missing local grievance to Firestore
            try {
              await setDoc(doc(db, "grievances", lg.id), lg);
            } catch (syncErr) {
              console.warn(`Background sync failed for grievance ${lg.id}:`, syncErr);
            }
          }
        }
      } catch (parseErr) {
        console.error("Error parsing local grievances:", parseErr);
      }
    }
    
    // Sort by reportedAt descending
    rawGrievances.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

    if (rawGrievances.length > 0) {
      localStorage.setItem("matrimonial_grievances", JSON.stringify(rawGrievances));
    }
    return rawGrievances;
  },

  subscribeGrievances(callback: (grievances: Grievance[]) => void) {
    const q = query(collection(db, "grievances"));
    return onSnapshot(q, (snapshot) => {
      const rawGrievances: Grievance[] = [];
      snapshot.forEach((docSnap) => {
        rawGrievances.push(docSnap.data() as Grievance);
      });
      
      // Ensure pre-seeded are present
      for (const psg of PRE_SEEDED_GRIEVANCES) {
        if (!rawGrievances.some((g) => g.id === psg.id)) {
          rawGrievances.push(psg);
        }
      }
      
      rawGrievances.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
      localStorage.setItem("matrimonial_grievances", JSON.stringify(rawGrievances));
      callback(rawGrievances);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "grievances");
    });
  },

  async saveGrievance(grievance: Grievance): Promise<Grievance> {
    try {
      await setDoc(doc(db, "grievances", grievance.id), grievance);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `grievances/${grievance.id}`);
    }

    // Local Storage Fallback
    const local = localStorage.getItem("matrimonial_grievances");
    let current: Grievance[] = local ? JSON.parse(local) : [];

    const existingIndex = current.findIndex((g) => g.id === grievance.id);
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...grievance };
    } else {
      current.push(grievance);
    }

    // Sort by reportedAt descending
    current.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

    localStorage.setItem("matrimonial_grievances", JSON.stringify(current));
    return grievance;
  },

  async deleteGrievance(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "grievances", id));
    } catch (err) {
      console.error("Error deleting grievance from Firestore:", err);
    }

    const local = localStorage.getItem("matrimonial_grievances");
    if (local) {
      const current: Grievance[] = JSON.parse(local);
      const filtered = current.filter((g) => g.id !== id);
      localStorage.setItem("matrimonial_grievances", JSON.stringify(filtered));
      return true;
    }
    return false;
  },

  async getMarriages(): Promise<MarriageRecord[]> {
    let rawMarriages: MarriageRecord[] = [];
    try {
      const q = query(collection(db, "marriage_records"));
      const snapshot = await getDocs(q);
      snapshot.forEach((docSnap) => {
        rawMarriages.push(docSnap.data() as MarriageRecord);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "marriage_records");
    }

    const local = localStorage.getItem("matrimonial_marriages");
    if (local) {
      try {
        const localMarriages: MarriageRecord[] = JSON.parse(local);
        for (const lm of localMarriages) {
          if (!rawMarriages.some((rm) => rm.id === lm.id)) {
            rawMarriages.push(lm);
            try {
              await setDoc(doc(db, "marriage_records", lm.id), lm);
            } catch (syncErr) {
              // Non-fatal sync
            }
          }
        }
      } catch (parseErr) {
        console.error("Error parsing local marriages:", parseErr);
      }
    }

    rawMarriages.sort((a, b) => new Date(b.marriedAt).getTime() - new Date(a.marriedAt).getTime());
    if (rawMarriages.length > 0) {
      localStorage.setItem("matrimonial_marriages", JSON.stringify(rawMarriages));
    }
    return rawMarriages;
  },

  subscribeMarriages(callback: (marriages: MarriageRecord[]) => void) {
    const q = query(collection(db, "marriage_records"));
    return onSnapshot(q, (snapshot) => {
      const rawMarriages: MarriageRecord[] = [];
      snapshot.forEach((docSnap) => {
        rawMarriages.push(docSnap.data() as MarriageRecord);
      });
      rawMarriages.sort((a, b) => new Date(b.marriedAt).getTime() - new Date(a.marriedAt).getTime());
      localStorage.setItem("matrimonial_marriages", JSON.stringify(rawMarriages));
      callback(rawMarriages);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "marriage_records");
    });
  },

  async saveMarriage(record: MarriageRecord): Promise<MarriageRecord> {
    try {
      await setDoc(doc(db, "marriage_records", record.id), record);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `marriage_records/${record.id}`);
    }

    const local = localStorage.getItem("matrimonial_marriages");
    let current: MarriageRecord[] = local ? JSON.parse(local) : [];
    const existingIndex = current.findIndex((m) => m.id === record.id);
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...record };
    } else {
      current.push(record);
    }
    current.sort((a, b) => new Date(b.marriedAt).getTime() - new Date(a.marriedAt).getTime());
    localStorage.setItem("matrimonial_marriages", JSON.stringify(current));
    return record;
  },

  async deleteMarriage(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "marriage_records", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `marriage_records/${id}`);
    }

    const local = localStorage.getItem("matrimonial_marriages");
    if (local) {
      const current: MarriageRecord[] = JSON.parse(local);
      const filtered = current.filter((m) => m.id !== id);
      localStorage.setItem("matrimonial_marriages", JSON.stringify(filtered));
      return true;
    }
    return false;
  },

  // Admin Management Methods
  async getAdmins(): Promise<AdminUser[]> {
    let list: AdminUser[] = [...ROOT_ADMINS];
    try {
      const q = query(collection(db, "admins"));
      const snapshot = await getDocs(q);
      const fetched: AdminUser[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push(docSnap.data() as AdminUser);
      });

      // Merge fetched admins, ensuring root admins take precedence
      for (const item of fetched) {
        const rootMatch = list.find((r) => r.mobile === item.mobile || r.id === item.id);
        if (!rootMatch) {
          list.push(item);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "admins");
    }

    // Merge with localStorage
    const local = localStorage.getItem("matrimonial_admins");
    if (local) {
      try {
        const localList: AdminUser[] = JSON.parse(local);
        for (const la of localList) {
          if (!list.some((a) => a.id === la.id || a.mobile.replace(/\D/g, "") === la.mobile.replace(/\D/g, ""))) {
            list.push(la);
          }
        }
      } catch (e) {
        console.error("Error reading local admins:", e);
      }
    }

    // Ensure root admins are always present and up-to-date
    for (const r of ROOT_ADMINS) {
      const idx = list.findIndex((a) => a.id === r.id || a.mobile === r.mobile);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...r };
      } else {
        list.unshift(r);
      }
    }

    localStorage.setItem("matrimonial_admins", JSON.stringify(list));
    return list;
  },

  async saveAdmin(adminData: AdminUser): Promise<AdminUser> {
    const stageInfo = getAdminStageInfo(adminData.role, adminData.stage);
    const admin: AdminUser = {
      ...adminData,
      id: adminData.id || `admin-${Date.now()}`,
      stage: stageInfo.stage,
      createdAt: adminData.createdAt || new Date().toISOString(),
      status: adminData.status || "active"
    };

    try {
      await setDoc(doc(db, "admins", admin.id), admin);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admins/${admin.id}`);
    }

    // Update local storage
    const currentAdmins = await this.getAdmins();
    const idx = currentAdmins.findIndex((a) => a.id === admin.id || a.mobile.replace(/\D/g, "") === admin.mobile.replace(/\D/g, ""));
    if (idx > -1) {
      currentAdmins[idx] = admin;
    } else {
      currentAdmins.push(admin);
    }
    localStorage.setItem("matrimonial_admins", JSON.stringify(currentAdmins));

    // Also synchronize a companion Profile entry with role: "admin"
    try {
      const cleanPhone = admin.mobile.replace(/\D/g, "");
      const adminProfileId = `prof-adm-${cleanPhone.slice(-10)}`;
      const companionProfile: Profile = {
        id: adminProfileId,
        reg_number: `ADM-${cleanPhone.slice(-4)}`,
        name: admin.name,
        contact_number: cleanPhone,
        email: admin.email || `${cleanPhone}@shubhamastu.in`,
        password: admin.password,
        role: "admin",
        status: "Active",
        subscription_status: "paid_900",
        dob: "1990-01-01",
        gender: "Male",
        height_feet: 5.8,
        sub_caste: "Smartha",
        profession: admin.designation || "Administrator",
        salary_lpa: 15,
        created_at: admin.createdAt
      };
      await setDoc(doc(db, "profiles", adminProfileId), companionProfile);
    } catch (profErr) {
      console.error("Could not sync admin profile record:", profErr);
    }

    return admin;
  },

  async deleteAdmin(id: string): Promise<boolean> {
    // Prevent deleting root admins
    if (id === "admin-subbu" || id === "admin-subba-reddy" || id === "admin-tejaswar") {
      console.warn("Root administrators cannot be removed.");
      return false;
    }

    try {
      await deleteDoc(doc(db, "admins", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${id}`);
    }

    const local = localStorage.getItem("matrimonial_admins");
    if (local) {
      const current: AdminUser[] = JSON.parse(local);
      const filtered = current.filter((a) => a.id !== id && !a.isRoot);
      localStorage.setItem("matrimonial_admins", JSON.stringify(filtered));
    }
    return true;
  },

  async verifyAdminCredentials(mobileInput: string, passwordInput: string): Promise<AdminUser | null> {
    const cleanInputMobile = mobileInput.trim().replace(/\D/g, "");
    const cleanInputPass = passwordInput.trim();

    if (!cleanInputMobile || !cleanInputPass) return null;

    const admins = await this.getAdmins();
    for (const a of admins) {
      const adminMobileClean = a.mobile.replace(/\D/g, "");
      // Match last 10 digits or exact match
      const mobileMatch = 
        adminMobileClean === cleanInputMobile ||
        adminMobileClean.slice(-10) === cleanInputMobile.slice(-10);
      
      if (mobileMatch && a.password === cleanInputPass && a.status === "active") {
        const stageInfo = getAdminStageInfo(a.role, a.stage);
        return {
          ...a,
          stage: stageInfo.stage
        };
      }
    }
    return null;
  },

  async getPandits(): Promise<Pandit[]> {
    let list: Pandit[] = [
      {
        id: "pandit-1",
        name: "Brahmashri Vedula Subrahmanya Sharma",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
        message: "Dedicated to conducting sacred Vedic marriages, Kundali matching, Gothra shuddhi, and providing divine blessings according to traditional Shastras.",
        phone: "+91 9441234567",
        specialization: "Vedic Astrology & Vivaha Muhurtam",
        availableDays: "Mon - Sat (9 AM - 6 PM)",
        createdAt: new Date().toISOString()
      },
      {
        id: "pandit-2",
        name: "Brahmashri Challa Sastry",
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
        message: "Expert in Ashtakoota Guna Milan, horoscope matching, dosha pariharam, and traditional Brahmin wedding rituals.",
        phone: "+91 9887654321",
        specialization: "Kundali Matching & Pariharam",
        availableDays: "All Days (By Appointment)",
        createdAt: new Date().toISOString()
      }
    ];

    try {
      const snap = await getDocs(collection(db, "pandits"));
      if (!snap.empty) {
        const fetched: Pandit[] = [];
        snap.forEach((d) => fetched.push(d.data() as Pandit));
        if (fetched.length > 0) list = fetched;
      }
    } catch (e) {
      console.warn("Could not fetch pandits from Firestore:", e);
    }

    const local = localStorage.getItem("matrimonial_pandits");
    if (local) {
      try {
        const localList: Pandit[] = JSON.parse(local);
        if (localList.length > 0) {
          list = localList;
        }
      } catch (e) {}
    }

    localStorage.setItem("matrimonial_pandits", JSON.stringify(list));
    return list;
  },

  async savePandit(pandit: Pandit): Promise<Pandit> {
    try {
      await setDoc(doc(db, "pandits", pandit.id), pandit);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `pandits/${pandit.id}`);
    }
    const current = await this.getPandits();
    const idx = current.findIndex(p => p.id === pandit.id);
    if (idx >= 0) {
      current[idx] = pandit;
    } else {
      current.push(pandit);
    }
    localStorage.setItem("matrimonial_pandits", JSON.stringify(current));
    return pandit;
  },

  async deletePandit(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "pandits", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `pandits/${id}`);
    }
    const current = await this.getPandits();
    const filtered = current.filter(p => p.id !== id);
    localStorage.setItem("matrimonial_pandits", JSON.stringify(filtered));
    return true;
  }
};
