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
  status: "Pending" | "Verified" | "Active" | "Premium" | "Married" | "Declined";
  gender: "Male" | "Female";
  sub_caste: string;
  height_feet: number;
  profession: string;
  education?: string;
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
  registered_by_admin_id?: string; // ID of the admin who created/registered this profile
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
  current_city?: string; // City of residence
  father_name?: string; // Father's Name
  mother_name?: string; // Mother's Name
  payment_received?: boolean; // Automated payment confirmation flag
  liked_profiles?: string[];  // Array of profile IDs this user has liked (swiped right)
  disliked_profiles?: string[]; // Array of profile IDs this user has skipped (swiped left)
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

export type AdminRole =
  | "super_admin"       // Stage 1: Can add or remove admins, full revenue, full candidates, grievance cell
  | "revenue_admin"     // Stage 2: Can see all revenue & candidates, grievance cell, but CANNOT add/remove admins
  | "candidate_admin"   // Stage 3: Can see ONLY candidates registered by him, grievance cell, cannot see org revenue, cannot add/remove admins
  | "grievance_admin"   // Stage 4: Grievance Officer, grievance cell access, cannot see revenue, cannot add/remove admins
  | "admin"             // Maps to Stage 2
  | "moderator"         // Maps to Stage 4
  | "compliance_officer"// Maps to Stage 4
  | "support_admin";    // Maps to Stage 4

export interface AdminStageInfo {
  stage: 1 | 2 | 3 | 4;
  stageName: string;
  stageNameTelugu: string;
  badgeColor: string;
  canManageAdmins: boolean;       // Add or remove administrators
  canViewAllRevenue: boolean;     // View financial dashboards and executive revenue
  canViewAllCandidates: boolean;  // View all candidates across portal
  canAccessGrievanceCell: boolean;// Access grievance cell redressal (All 4 stages can view grievance cell)
}

export function getAdminStageInfo(role?: string, explicitStage?: number): AdminStageInfo {
  if (explicitStage === 1 || role === "super_admin") {
    return {
      stage: 1,
      stageName: "Stage 1: Super Admin",
      stageNameTelugu: "సర్వోన్నత నిర్వాహకుడు",
      badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
      canManageAdmins: true,
      canViewAllRevenue: true,
      canViewAllCandidates: true,
      canAccessGrievanceCell: true,
    };
  }
  if (explicitStage === 2 || role === "revenue_admin" || role === "admin") {
    return {
      stage: 2,
      stageName: "Stage 2: Revenue & Operations Admin",
      stageNameTelugu: "రెవెన్యూ & కార్యనిర్వాహక అడ్మిన్",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      canManageAdmins: false,
      canViewAllRevenue: true,
      canViewAllCandidates: true,
      canAccessGrievanceCell: true,
    };
  }
  if (explicitStage === 3 || role === "candidate_admin") {
    return {
      stage: 3,
      stageName: "Stage 3: Candidate Coordinator Admin",
      stageNameTelugu: "అభ్యర్థుల రిజిస్ట్రేషన్ కోఆర్డినేటర్",
      badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
      canManageAdmins: false,
      canViewAllRevenue: false,
      canViewAllCandidates: false, // Only his registered candidates!
      canAccessGrievanceCell: true,
    };
  }
  return {
    stage: 4,
    stageName: "Stage 4: Grievance Officer & Support",
    stageNameTelugu: "సమస్యల పరిష్కార అధికారి",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    canManageAdmins: false,
    canViewAllRevenue: false,
    canViewAllCandidates: false,
    canAccessGrievanceCell: true,
  };
}

export interface AdminUser {
  id: string;
  name: string;
  mobile: string;
  password?: string;
  email?: string;
  role: AdminRole;
  stage?: 1 | 2 | 3 | 4;
  designation?: string;
  createdAt: string;
  addedBy?: string;
  status: "active" | "inactive";
  isRoot?: boolean;
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

export type DiscountType = "PERCENTAGE" | "FLAT";
export type DefenseVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ReferralStatus = "REGISTERED" | "QUALIFIED_PAID";
export type SubscriptionTierStatus = "ACTIVE" | "PENDING_VERIFICATION" | "EXPIRED" | "CANCELLED";

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_val: number;
  requires_id_upload: boolean;
  valid_from: string;
  valid_until: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  min_order_value?: number;
  description?: string;
  created_at?: string;
}

export interface DefenseVerification {
  id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
  coupon_id: string;
  coupon_code?: string;
  id_card_image_url: string;
  verification_status: DefenseVerificationStatus;
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referrer_name?: string;
  referrer_code?: string;
  referee_id: string;
  referee_name?: string;
  referee_phone?: string;
  referee_email?: string;
  status: ReferralStatus;
  order_id?: string;
  qualified_at?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  amount_paid: number;
  original_price: number;
  coupon_applied?: string;
  status: SubscriptionTierStatus;
  payment_id?: string;
  created_at: string;
  expires_at?: string;
  is_milestone_rate?: boolean;
}

export interface ReferralRankItem {
  user_id: string;
  name: string;
  phone: string;
  email: string;
  referral_code: string;
  total_invites: number;
  qualified_paid: number;
  is_eligible_800_tier: boolean;
  rank?: number;
}

export interface CouponApplyResponse {
  valid: boolean;
  code?: string;
  discount_type?: DiscountType;
  discount_val?: number;
  discount_amount: number;
  original_price: number;
  final_price: number;
  requires_id_upload: boolean;
  is_defense_coupon: boolean;
  is_milestone_applied: boolean;
  defense_status?: DefenseVerificationStatus | "NOT_SUBMITTED";
  message: string;
}
