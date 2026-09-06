import { db } from "./firebase";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query } from "firebase/firestore";
import { Profile, PartnerPreferences, AdminSettings, Grievance, MarriageRecord } from "../types";
import { calculateMatchScore } from "./matchEngine";

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
    id: "prof-subbu",
    reg_number: "BVM-1001",
    password: "xG9$mK2!wP7#rT5_tV4*yC8&nB3%fX1_zS5hQ2",
    name: "GV Subramanyam (Founder & Managing Director)",
    dob: "1995-08-15",
    gender: "Male",
    height_feet: 5.9,
    sub_caste: "Smartha",
    profession: "Founder & Managing Director",
    salary_lpa: 14.5,
    contact_number: "9347359489",
    status: "Verified",
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
    id: "prof-subba-reddy",
    reg_number: "BVM-1007",
    password: "yD5#qX8!fV3$pW9_rK2*mT4&nC7%sY6_zL1uB9",
    name: "PV Subba Reddy (CEO & Co-Founder)",
    dob: "1980-01-01",
    gender: "Male",
    height_feet: 5.10,
    sub_caste: "Smartha",
    profession: "CEO & Co-Founder",
    salary_lpa: 30.0,
    contact_number: "9494949494",
    status: "Verified",
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
    created_at: "2026-07-07T16:00:00Z"
  }
];

// Initialize localStorage DB if empty (fallback)
if (typeof window !== "undefined") {
  const localProf = localStorage.getItem("matrimonial_profiles");
  if (!localProf) {
    localStorage.setItem("matrimonial_profiles", JSON.stringify(PRE_SEEDED_PROFILES));
    const initialPrefs = [
      { user_id: "prof-subbu", age_gap: 5, height_range: "5.0 - 5.7", preferred_sub_caste: "Any" }
    ];
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
    reporterId: "prof-subbu",
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
    reporterId: "prof-subba-reddy",
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
    accusedId: "prof-subbu",
    accusedName: "Sri G.V. Subramanyam (Test Account)",
    accusedPhone: "+91 93473 59489",
    category: "Harassment/Unwanted Calls",
    description: "This is a dual testing query involving GV Subramanyam's own test number to verify the multi-tier warning alerts, temporary suspension length, and automatic Telugu/English WhatsApp templates.",
    reportedAt: "2026-07-17T10:45:00.000Z",
    status: "Pending"
  },
  {
    id: "G-10004",
    reporterId: "prof-subba-reddy",
    reporterName: "Sri P.V. Subba Reddy (Test Reporter)",
    reporterPhone: "+91 94949 49494",
    accusedId: "prof-subbu",
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
    accusedId: "prof-subba-reddy",
    accusedName: "Sri P.V. Subba Reddy (Test Account)",
    accusedPhone: "+91 94949 49494",
    category: "Fake Profile",
    description: "Testing permanent lifetime ban message flows and fake complaint warnings. Designed to evaluate the exact warning scenario responses for Subba Reddy's number.",
    reportedAt: "2026-07-17T11:30:00.000Z",
    status: "Pending"
  },
  {
    id: "G-10006",
    reporterId: "prof-subbu",
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

export const databaseService = {
  // Profiles Methods
  async getProfiles(ignoreFilter = false): Promise<Profile[]> {
    let rawProfiles: Profile[] = [];
    try {
      const q = query(collection(db, "profiles"));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Seed Firestore collection with default profiles on first run
        for (const p of PRE_SEEDED_PROFILES) {
          await setDoc(doc(db, "profiles", p.id), p);
        }
        rawProfiles = [...PRE_SEEDED_PROFILES];
      } else {
        querySnapshot.forEach((docSnap) => {
          rawProfiles.push(docSnap.data() as Profile);
        });
        
        // Guarantee the admin profiles are always fully up-to-date with current pre-seeded admin details
        for (const p of PRE_SEEDED_PROFILES) {
          const existingAdmin = rawProfiles.find(rp => rp.id === p.id);
          if (!existingAdmin || existingAdmin.contact_number !== p.contact_number || existingAdmin.password !== p.password || existingAdmin.name !== p.name) {
            try {
              await setDoc(doc(db, "profiles", p.id), p);
            } catch (fsErr) {
              console.error("Failed to sync admin profile to Firestore:", fsErr);
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
    } catch (err) {
      console.error("Error fetching from Firestore, returning local fallback:", err);
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
              await setDoc(doc(db, "profiles", lp.id), lp);
            } catch (syncErr) {
              console.warn(`Background sync failed for profile ${lp.id}:`, syncErr);
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

    // ROW LEVEL SECURITY (RLS) RULE: Exclude administrators from profile lists unless requested by administrators
    const currentUserId = typeof window !== "undefined" ? localStorage.getItem("bramhana_logged_in_user_id") : null;
    const isAdminUser = currentUserId === "prof-subbu" || currentUserId === "prof-subba-reddy" || localStorage.getItem("bramhana_admin_session") === "true";

    if (!isAdminUser) {
      return rawProfiles.filter((p) => {
        const isSubbu = p.id === "prof-subbu" || p.contact_number?.replace(/\D/g, "").includes("9347359489");
        const isSubbaReddy = p.id === "prof-subba-reddy" || p.contact_number?.replace(/\D/g, "").includes("9494949494");
        return !isSubbu && !isSubbaReddy;
      });
    }

    return rawProfiles;
  },

  async saveProfile(profile: Profile): Promise<Profile> {
    const finalProfile = { ...profile };
    
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
      const allProfiles = await this.getProfiles(true);
      const regNumbers = allProfiles
        .map(p => p.reg_number)
        .filter((r): r is string => !!r && r.startsWith("BVM-"));
      let maxNum = 1006; // Preseeds go up to 1006
      if (regNumbers.length > 0) {
        const nums = regNumbers.map(r => parseInt(r.replace("BVM-", ""), 10) || 0);
        maxNum = Math.max(...nums, maxNum);
      }
      finalProfile.reg_number = `BVM-${maxNum + 1}`;
    }

    if (!finalProfile.approved_matches) {
      finalProfile.approved_matches = [];
    }

    // Auto-compute reciprocal matching with all other profiles in registry
    try {
      const allProfiles = await this.getProfiles(true);
      for (const p of allProfiles) {
        if (p.id === finalProfile.id) continue;
        if (p.gender === finalProfile.gender) continue; // Opposite gender only

        // Gotram separation check (sagotra check)
        if (finalProfile.gothram && p.gothram) {
          if (finalProfile.gothram.trim().toLowerCase() === p.gothram.trim().toLowerCase()) {
            continue;
          }
        }

        const score = calculateMatchScore(finalProfile, p);
        if (score.totalScore >= 45) {
          // Add p.id to finalProfile.approved_matches
          if (!finalProfile.approved_matches.includes(p.id)) {
            finalProfile.approved_matches.push(p.id);
          }
          // Add finalProfile.id to p.approved_matches reciprocally
          if (!p.approved_matches) {
            p.approved_matches = [];
          }
          if (!p.approved_matches.includes(finalProfile.id)) {
            p.approved_matches.push(finalProfile.id);
            await setDoc(doc(db, "profiles", p.id), p).catch(err => console.error("Error updating reciprocal match p:", err));
          }
        }
      }
    } catch (e) {
      console.error("Error in reciprocal matching during saveProfile:", e);
    }

    try {
      await setDoc(doc(db, "profiles", finalProfile.id), finalProfile);
    } catch (err) {
      console.error("Error saving to Firestore:", err);
    }

    // Sync to local fallback & prevent any duplicate profile IDs
    const local = localStorage.getItem("matrimonial_profiles");
    let current: Profile[] = local ? JSON.parse(local) : PRE_SEEDED_PROFILES;
    
    // Prevent duplicate profile records by filtering out existing IDs first
    current = current.filter((p) => p.id !== finalProfile.id);
    
    // Prepend the updated/new profile
    current.unshift(finalProfile);
    
    localStorage.setItem("matrimonial_profiles", JSON.stringify(current));

    return finalProfile;
  },

  async updateProfileStatus(id: string, status: Profile["status"]): Promise<boolean> {
    try {
      await updateDoc(doc(db, "profiles", id), { status });
    } catch (err) {
      console.error("Error updating status on Firestore:", err);
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
      console.error("Error updating subscription status on Firestore:", err);
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
    try {
      const q = query(collection(db, "profiles"));
      const querySnapshot = await getDocs(q);
      for (const docSnap of querySnapshot.docs) {
        const id = docSnap.id;
        if (id !== "prof-subbu" && id !== "prof-subba-reddy") {
          await deleteDoc(doc(db, "profiles", id));
        }
      }
    } catch (err) {
      console.error("Error purging profiles from Firestore:", err);
    }

    const local = localStorage.getItem("matrimonial_profiles");
    let current: Profile[] = local ? JSON.parse(local) : PRE_SEEDED_PROFILES;
    const preserved = current.filter(p => p.id === "prof-subbu" || p.id === "prof-subba-reddy");
    
    if (!preserved.some(p => p.id === "prof-subbu")) {
      const subbu = PRE_SEEDED_PROFILES.find(p => p.id === "prof-subbu");
      if (subbu) preserved.push(subbu);
    }
    if (!preserved.some(p => p.id === "prof-subba-reddy")) {
      const subba = PRE_SEEDED_PROFILES.find(p => p.id === "prof-subba-reddy");
      if (subba) preserved.push(subba);
    }
    
    localStorage.setItem("matrimonial_profiles", JSON.stringify(preserved));
    return preserved;
  },

  async deleteProfile(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "profiles", id));
    } catch (err) {
      console.error("Error deleting profile from Firestore:", err);
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
      console.error("Error fetching all preferences from Firestore:", err);
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
      console.error("Error fetching preferences from Firestore, reading local state:", err);
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
      console.error("Error saving preferences to Firestore:", err);
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
      console.error("Error fetching admin settings from Firestore:", err);
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
      console.error("Error saving admin settings to Firestore:", err);
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
      console.error("Error fetching grievances from Firestore:", err);
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

  async saveGrievance(grievance: Grievance): Promise<Grievance> {
    try {
      await setDoc(doc(db, "grievances", grievance.id), grievance);
    } catch (err) {
      console.error("Error saving grievance to Firestore:", err);
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
      const q = query(collection(db, "marriages"));
      const snapshot = await getDocs(q);
      snapshot.forEach((docSnap) => {
        rawMarriages.push(docSnap.data() as MarriageRecord);
      });
    } catch (err) {
      console.error("Error fetching marriages from Firestore:", err);
    }

    const local = localStorage.getItem("matrimonial_marriages");
    if (local) {
      try {
        const localMarriages: MarriageRecord[] = JSON.parse(local);
        for (const lm of localMarriages) {
          if (!rawMarriages.some((rm) => rm.id === lm.id)) {
            rawMarriages.push(lm);
            try {
              await setDoc(doc(db, "marriages", lm.id), lm);
            } catch (syncErr) {
              console.warn(`Background sync failed for marriage ${lm.id}:`, syncErr);
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

  async saveMarriage(record: MarriageRecord): Promise<MarriageRecord> {
    try {
      await setDoc(doc(db, "marriages", record.id), record);
    } catch (err) {
      console.error("Error saving marriage to Firestore:", err);
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
      await deleteDoc(doc(db, "marriages", id));
    } catch (err) {
      console.error("Error deleting marriage from Firestore:", err);
    }

    const local = localStorage.getItem("matrimonial_marriages");
    if (local) {
      const current: MarriageRecord[] = JSON.parse(local);
      const filtered = current.filter((m) => m.id !== id);
      localStorage.setItem("matrimonial_marriages", JSON.stringify(filtered));
      return true;
    }
    return false;
  }
};
