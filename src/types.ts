export interface AstrologyDetails {
  nakshatra: string;
  nakshatraLord: string;
  nakshatraLordTelugu?: string;
  pada: number;
  rashi: string;
  tithi: string;
  deity: string;
  deityTelugu?: string;
  spiritualAnalysis: string;
  compatibilityTraits: string[];
  spiritualScore: number;
  hamsaGuidance?: {
    ishtaDevata: { english: string; telugu: string };
    hamsaSymbol: { english: string; telugu: string };
    marriage: string;
    business: string;
    education: string;
    job: string;
    remedy: string;
  };
}

export interface Profile {
  id: string;
  reg_number?: string; // e.g., BVM-1001
  password?: string;   // defaults to dob if not explicitly specified
  role?: "candidate" | "employee" | "admin"; // Account level role
  name: string;
  dob: string;
  salary_lpa: number;
  contact_number: string;
  email?: string;               // Candidate email ID for registration and login
  isEmailVerified?: boolean;    // Whether email has been verified via OTP
  status: "Pending" | "Verified" | "Premium" | "Declined";
  gender: "Male" | "Female";
  sub_caste: string;
  height_feet: number;
  profession: string;
  photo_url?: string;
  photo_url_2?: string; // Second Photo
  photo_url_3?: string; // Third Photo
  kundali_url?: string; // Kundali Photo / Doc
  birth_time?: string;
  birth_location?: string; // Place of birth
  birth_pincode?: string;  // Postal Pincode of Birth Place
  partner_expectation_type?: string; // e.g., "Housewife", "Any Profession", "Working Profession", etc.
  partner_expectations_desc?: string; // Expected qualities in partner
  company_name?: string;       // Candidate's Company Name (if employee)
  job_branch?: string;         // Company branch or work location
  working_shift?: string;      // Candidate's working shift (Day/Night/Flexible)
  partner_height_diff_pref?: string; // e.g., "Taller", "Shorter", "No Preference", etc.
  partner_lpa_pref?: string;   // e.g., "0-6 LPA", "7-13 LPA", "14-30 LPA", "30-60 LPA", "60+ LPA", "No Preference"
  partner_shift_pref?: string; // e.g., "Day Shift Only", "Any Shift", "Flexible"
  astrology?: AstrologyDetails;
  subscription_status?: "free" | "paid_100" | "paid_900";
  subscription_expires_at?: string; // 28-day subscription expiry date
  approved_matches?: string[]; // IDs of matches delivered/approved by admin (the kitchen plate)
  gothram?: string;            // Gotram (గోత్రం)
  surname?: string;            // Surname (ఇంటిపేరు / Family Name / Inti Peru)
  nakshatram?: string;         // Nakshatram (నక్షత్రం / Star)
  created_at?: string;  // For statistics
  registered_by?: string;      // e.g., "GV Subramanyam", "PV Subba Reddy", or "Self-Registered"
  registered_at_time?: string;  // Date/Time of registration
  fee_received_by?: string;    // Admin who marked ₹100 fee as received
  fee_transaction_id?: string; // ₹100 transaction ID
  fee_received_at?: string;    // Timestamp of ₹100 payment approval
  fee_receiver_upi?: string;   // UPI ID where payment was received
  upgrade_transaction_id?: string; // ₹900 upgrade transaction ID / UTR
  upgrade_requested_at?: string;    // Timestamp of ₹900 payment submission
  suspension_lift_at?: string;     // Time when suspension is scheduled to be lifted automatically
  suspension_reason?: string;      // Reason for account suspension
  punishment_history?: string[];   // History of punishments & changes
  is_mercy_granted?: boolean;      // Whether administrative mercy has been granted to this candidate
  last_punishment_changed_at?: string; // Timestamp of last change in punishment
  reminders?: CalendarReminder[];  // Calendar reminders for auspicious dates & match meetings
  badge?: "Standard" | "Shoorveer" | "Guruvu"; // Shoorveer or Guruvu verification badge
  discount?: number; // Applied discount percentage (e.g. 90 or 50)
  referral_code?: string; // Unique referral code for this user
  referred_by?: string; // Referral code of the user who referred them
  referral_count?: number; // Number of people referred who took subscriptions
  coupon_applied?: string; // Applied coupon code
  is_defence_verified?: boolean; // Manual admin verification status for defence / coupon
}

export interface CalendarReminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: "Auspicious Date / Muhurtam" | "Meeting with Match" | "Astrology Consultation" | "Family Discussion" | "Other";
  matchId?: string;
  matchName?: string;
  createdAt: string;
  notified?: boolean;
}

export interface PartnerPreferences {
  id?: string;
  user_id: string;
  age_gap: number; // Max allowed age gap (e.g. 5 means +/- 5 years)
  height_range: string; // e.g., "5.0 - 5.8" or "5.5 - 6.2"
  preferred_sub_caste: string; // e.g., "Iyer", "Iyengar", "Smartha", "Any"
}

export interface AdminSettings {
  subramanyamUpi: string;
  subramanyamQr: string;
  subbaReddyUpi: string;
  subbaReddyQr: string;
}

export interface Grievance {
  id: string; // e.g. G-10001
  reporterId: string;
  reporterName: string;
  reporterPhone: string;
  accusedId: string;
  accusedName: string;
  accusedPhone: string;
  category: "Harassment/Unwanted Calls" | "Fake Profile" | "Incorrect Information" | "Misuse of Contact Details" | "Other";
  description: string;
  reportedAt: string; // ISO string
  status: "Pending" | "Under Investigation" | "Resolved" | "Dismissed";
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface MarriageRecord {
  id: string;
  groomId: string;
  groomRegNumber: string;
  groomName: string;
  groomMobile: string;
  groomGotram?: string;
  groomSubCaste?: string;
  brideId: string;
  brideRegNumber: string;
  brideName: string;
  brideMobile: string;
  brideGotram?: string;
  brideSubCaste?: string;
  marriedAt: string;
  recordedBy: string;
}
