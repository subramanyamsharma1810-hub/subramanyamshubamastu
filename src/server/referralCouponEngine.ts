import fs from "fs";
import path from "path";
import { 
  Coupon, 
  DefenseVerification, 
  Referral, 
  Subscription, 
  ReferralRankItem, 
  CouponApplyResponse 
} from "../types";

// Persistent file-backed storage fallback to ensure flawless sandbox experience
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "matrimony_engine_store.json");

interface EngineStore {
  coupons: Coupon[];
  defenseVerifications: DefenseVerification[];
  referrals: Referral[];
  subscriptions: Subscription[];
  userReferralCodes: Record<string, string>; // userId -> referralCode
  userReferredBy: Record<string, string>;     // userId -> referralCode of referrer
  userDefenseStatus: Record<string, boolean>; // userId -> isDefenseVerified
}

// Initial seed data with core business rules
const INITIAL_COUPONS: Coupon[] = [
  {
    id: "cpn_agniveer_50",
    code: "AGNIVEERFLAT50",
    discount_type: "PERCENTAGE",
    discount_val: 50,
    requires_id_upload: true,
    valid_from: "2026-01-01T00:00:00.000Z",
    valid_until: "2027-12-31T23:59:59.000Z",
    min_order_value: 1500,
    max_uses: 5000,
    current_uses: 12,
    is_active: true,
    description: "Honoring Indian Armed Forces, Agniveer recruits, and Military Defense Personnel with 50% Flat Discount (User pays ₹750 instead of ₹1,500). Official Military ID upload required for verification.",
    created_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "cpn_shubh_10",
    code: "SHUBH10",
    discount_type: "PERCENTAGE",
    discount_val: 10,
    requires_id_upload: false,
    valid_from: "2026-01-01T00:00:00.000Z",
    valid_until: "2027-06-30T23:59:59.000Z",
    min_order_value: 1000,
    max_uses: 10000,
    current_uses: 84,
    is_active: true,
    description: "Shubhamastu welcome coupon - 10% discount on first month registration.",
    created_at: "2026-01-10T00:00:00.000Z"
  },
  {
    id: "cpn_veda_100",
    code: "VEDA100",
    discount_type: "FLAT",
    discount_val: 100,
    requires_id_upload: false,
    valid_from: "2026-01-01T00:00:00.000Z",
    valid_until: "2027-06-30T23:59:59.000Z",
    min_order_value: 1500,
    max_uses: 1000,
    current_uses: 45,
    is_active: true,
    description: "Flat ₹100 reduction on full subscription packages.",
    created_at: "2026-01-15T00:00:00.000Z"
  }
];

// Sample initial Defense verifications for demo
const INITIAL_VERIFICATIONS: DefenseVerification[] = [
  {
    id: "def_1001",
    user_id: "prof-subbu",
    user_name: "Sri G.V. Subramanyam",
    user_phone: "9347359489",
    user_email: "subramanyamghadiyaram@gmail.com",
    coupon_id: "cpn_agniveer_50",
    coupon_code: "AGNIVEERFLAT50",
    id_card_image_url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800",
    verification_status: "APPROVED",
    admin_notes: "Armed Forces Veteran ID verified by PV Subba Reddy. 50% discount authorized.",
    created_at: "2026-08-15T10:00:00.000Z",
    reviewed_at: "2026-08-15T11:30:00.000Z",
    reviewed_by: "Sri P.V. Subba Reddy"
  },
  {
    id: "def_1002",
    user_id: "prof-agniveer-test",
    user_name: "Havildar Ramesh Sharma",
    user_phone: "9876543210",
    user_email: "ramesh.defense@gov.in",
    coupon_id: "cpn_agniveer_50",
    coupon_code: "AGNIVEERFLAT50",
    id_card_image_url: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=800",
    verification_status: "PENDING",
    admin_notes: "Pending officer inspection of military regimental stamp.",
    created_at: new Date().toISOString()
  }
];

// Sample referrals demonstrating the "Rule of 6"
const INITIAL_REFERRALS: Referral[] = [
  {
    id: "ref_101",
    referrer_id: "prof-subbu",
    referrer_name: "Sri G.V. Subramanyam",
    referrer_code: "SHUBH-7X9A",
    referee_id: "prof-ref-1",
    referee_name: "K. Sitarama Sastry",
    referee_phone: "9123456781",
    referee_email: "sitaram@example.com",
    status: "QUALIFIED_PAID",
    order_id: "CF_ORD_98112",
    qualified_at: "2026-08-01T12:00:00.000Z",
    created_at: "2026-08-01T10:00:00.000Z"
  },
  {
    id: "ref_102",
    referrer_id: "prof-subbu",
    referrer_name: "Sri G.V. Subramanyam",
    referrer_code: "SHUBH-7X9A",
    referee_id: "prof-ref-2",
    referee_name: "V. Venkata Raman",
    referee_phone: "9123456782",
    referee_email: "raman@example.com",
    status: "QUALIFIED_PAID",
    order_id: "CF_ORD_98113",
    qualified_at: "2026-08-05T14:30:00.000Z",
    created_at: "2026-08-04T09:00:00.000Z"
  },
  {
    id: "ref_103",
    referrer_id: "prof-subbu",
    referrer_name: "Sri G.V. Subramanyam",
    referrer_code: "SHUBH-7X9A",
    referee_id: "prof-ref-3",
    referee_name: "P. Radhakrishna Murthy",
    referee_phone: "9123456783",
    referee_email: "rk.murthy@example.com",
    status: "QUALIFIED_PAID",
    order_id: "CF_ORD_98114",
    qualified_at: "2026-08-10T16:00:00.000Z",
    created_at: "2026-08-09T11:00:00.000Z"
  },
  {
    id: "ref_104",
    referrer_id: "prof-subbu",
    referrer_name: "Sri G.V. Subramanyam",
    referrer_code: "SHUBH-7X9A",
    referee_id: "prof-ref-4",
    referee_name: "M. Anjaneya Sarma",
    referee_phone: "9123456784",
    referee_email: "anjaneya@example.com",
    status: "QUALIFIED_PAID",
    order_id: "CF_ORD_98115",
    qualified_at: "2026-08-18T10:00:00.000Z",
    created_at: "2026-08-17T08:00:00.000Z"
  },
  {
    id: "ref_105",
    referrer_id: "prof-subbu",
    referrer_name: "Sri G.V. Subramanyam",
    referrer_code: "SHUBH-7X9A",
    referee_id: "prof-ref-5",
    referee_name: "B. Lakshmi Narayana",
    referee_phone: "9123456785",
    referee_email: "lakshmi.narayana@example.com",
    status: "QUALIFIED_PAID",
    order_id: "CF_ORD_98116",
    qualified_at: "2026-08-25T11:00:00.000Z",
    created_at: "2026-08-24T15:00:00.000Z"
  },
  {
    id: "ref_106",
    referrer_id: "prof-subbu",
    referrer_name: "Sri G.V. Subramanyam",
    referrer_code: "SHUBH-7X9A",
    referee_id: "prof-ref-6",
    referee_name: "D. Sundareswara Rao",
    referee_phone: "9123456786",
    referee_email: "sundareswara@example.com",
    status: "QUALIFIED_PAID",
    order_id: "CF_ORD_98117",
    qualified_at: "2026-09-01T15:00:00.000Z",
    created_at: "2026-08-30T10:00:00.000Z"
  },
  {
    id: "ref_107",
    referrer_id: "prof-subbu",
    referrer_name: "Sri G.V. Subramanyam",
    referrer_code: "SHUBH-7X9A",
    referee_id: "prof-ref-7",
    referee_name: "T. Krishna Chaitanya",
    referee_phone: "9123456787",
    referee_email: "chaitanya@example.com",
    status: "REGISTERED",
    created_at: "2026-09-05T09:00:00.000Z"
  }
];

class ReferralCouponEngine {
  private store: EngineStore;

  constructor() {
    this.store = this.loadStore();
  }

  private loadStore(): EngineStore {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          coupons: parsed.coupons || INITIAL_COUPONS,
          defenseVerifications: parsed.defenseVerifications || INITIAL_VERIFICATIONS,
          referrals: parsed.referrals || INITIAL_REFERRALS,
          subscriptions: parsed.subscriptions || [],
          userReferralCodes: parsed.userReferralCodes || { "prof-subbu": "SHUBH-7X9A" },
          userReferredBy: parsed.userReferredBy || {},
          userDefenseStatus: parsed.userDefenseStatus || { "prof-subbu": true }
        };
      }
    } catch (err) {
      console.warn("Failed to read store file, falling back to memory seed:", err);
    }

    return {
      coupons: INITIAL_COUPONS,
      defenseVerifications: INITIAL_VERIFICATIONS,
      referrals: INITIAL_REFERRALS,
      subscriptions: [],
      userReferralCodes: { "prof-subbu": "SHUBH-7X9A" },
      userReferredBy: {},
      userDefenseStatus: { "prof-subbu": true }
    };
  }

  private persistStore(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.store, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write to matrimony store file:", err);
    }
  }

  // Generate unique referral code (e.g., SHUBH-7X9A)
  public generateReferralCode(customPrefix: string = "SHUBH"): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${customPrefix}-${suffix}`;
  }

  public getOrCreateUserReferralCode(userId: string): string {
    if (this.store.userReferralCodes[userId]) {
      return this.store.userReferralCodes[userId];
    }
    const code = this.generateReferralCode();
    this.store.userReferralCodes[userId] = code;
    this.persistStore();
    return code;
  }

  public setUserReferralCode(userId: string, code: string): void {
    this.store.userReferralCodes[userId] = code.trim().toUpperCase();
    this.persistStore();
  }

  // Count qualified paid referrals for a user
  public getQualifiedReferralsCount(userId: string): number {
    return this.store.referrals.filter(
      (r) => r.referrer_id === userId && r.status === "QUALIFIED_PAID"
    ).length;
  }

  // Check if user has unlocked the 6-referral ₹800 milestone rate
  public hasUnlocked800Tier(userId: string): boolean {
    return this.getQualifiedReferralsCount(userId) >= 6;
  }

  // Get user referral stats
  public getUserReferralStats(userId: string, userName?: string) {
    const referralCode = this.getOrCreateUserReferralCode(userId);
    const userReferrals = this.store.referrals.filter((r) => r.referrer_id === userId);
    const qualifiedCount = userReferrals.filter((r) => r.status === "QUALIFIED_PAID").length;
    const isUnlocked = qualifiedCount >= 6;
    const directUrl = `https://shubhamastu.in/register?ref=${referralCode}`;

    // Pre-formatted Telugu & English WhatsApp sharing text
    const whatsappText = `Namaste! I found verified, genuine matrimonial proposals on Shubhamastu.in without paying heavy broker fees. Register using my invite link to get priority matchmaking: ${directUrl} (Use referral code: ${referralCode} during checkout).`;
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

    return {
      userId,
      userName: userName || "Candidate",
      referralCode,
      referralUrl: directUrl,
      whatsappText,
      whatsappShareUrl,
      totalInvites: userReferrals.length,
      qualifiedReferrals: qualifiedCount,
      milestoneTarget: 6,
      isUnlocked800Tier: isUnlocked,
      milestoneRate: 800,
      baseRate: 1500,
      savings: 700,
      progressPercentage: Math.min(100, Math.round((qualifiedCount / 6) * 100)),
      referralsList: userReferrals
    };
  }

  // Register a new referral (when referee signs up with ref code)
  public registerReferral(referrerCode: string, refereeId: string, refereeDetails: { name: string; phone: string; email?: string }): { success: boolean; message: string } {
    const cleanRefCode = referrerCode.trim().toUpperCase();

    // Find referrer by code
    let referrerId: string | null = null;
    for (const [uid, code] of Object.entries(this.store.userReferralCodes)) {
      if (code.toUpperCase() === cleanRefCode) {
        referrerId = uid;
        break;
      }
    }

    if (!referrerId) {
      return { success: false, message: "Invalid or nonexistent referral code." };
    }

    // Critical Edge Case 1: Self-Referral Prevention
    if (referrerId === refereeId) {
      return { success: false, message: "Self-referral is strictly forbidden." };
    }

    // Critical Edge Case 2: Duplicate Referral Prevention
    const alreadyReferred = this.store.referrals.find((r) => r.referee_id === refereeId);
    if (alreadyReferred) {
      return { success: false, message: "This user has already been registered with a referrer." };
    }

    const newReferral: Referral = {
      id: `ref_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      referrer_id: referrerId,
      referrer_code: cleanRefCode,
      referee_id: refereeId,
      referee_name: refereeDetails.name,
      referee_phone: refereeDetails.phone,
      referee_email: refereeDetails.email,
      status: "REGISTERED",
      created_at: new Date().toISOString()
    };

    this.store.referrals.push(newReferral);
    this.store.userReferredBy[refereeId] = cleanRefCode;
    this.persistStore();

    return { success: true, message: "Referral registered successfully." };
  }

  // Validate and Apply Coupon
  public applyCoupon(code: string, userId: string, orderAmount: number = 1500): CouponApplyResponse {
    const BASE_PRICE = 1500; // ₹600 Registration Onboarding + ₹900 Matchmaking Access
    const normalizedCode = (code || "").trim().toUpperCase();

    // Check if user has already unlocked the 6-referral milestone rate of ₹800
    const hasMilestone = this.hasUnlocked800Tier(userId);

    // If milestone is already unlocked and no code or code is blank
    if (hasMilestone && !normalizedCode) {
      return {
        valid: true,
        discount_amount: 700,
        original_price: BASE_PRICE,
        final_price: 800,
        requires_id_upload: false,
        is_defense_coupon: false,
        is_milestone_applied: true,
        message: "Milestone Unlocked: ₹800 Referral Rate Applied! (₹700 reduction for 6+ Qualified Referrals)"
      };
    }

    if (!normalizedCode) {
      return {
        valid: false,
        discount_amount: 0,
        original_price: BASE_PRICE,
        final_price: BASE_PRICE,
        requires_id_upload: false,
        is_defense_coupon: false,
        is_milestone_applied: false,
        message: "Please enter a coupon code."
      };
    }

    const coupon = this.store.coupons.find(
      (c) => c.code.toUpperCase() === normalizedCode
    );

    if (!coupon) {
      return {
        valid: false,
        discount_amount: 0,
        original_price: BASE_PRICE,
        final_price: hasMilestone ? 800 : BASE_PRICE,
        requires_id_upload: false,
        is_defense_coupon: false,
        is_milestone_applied: hasMilestone,
        message: `Coupon code "${normalizedCode}" does not exist.`
      };
    }

    if (!coupon.is_active) {
      return {
        valid: false,
        discount_amount: 0,
        original_price: BASE_PRICE,
        final_price: hasMilestone ? 800 : BASE_PRICE,
        requires_id_upload: false,
        is_defense_coupon: false,
        is_milestone_applied: hasMilestone,
        message: `Coupon code "${normalizedCode}" is currently inactive.`
      };
    }

    // Expiry verification
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);

    if (now < validFrom) {
      return {
        valid: false,
        discount_amount: 0,
        original_price: BASE_PRICE,
        final_price: hasMilestone ? 800 : BASE_PRICE,
        requires_id_upload: false,
        is_defense_coupon: false,
        is_milestone_applied: hasMilestone,
        message: `Coupon code "${normalizedCode}" is not active yet (starts ${validFrom.toLocaleDateString()}).`
      };
    }

    if (now > validUntil) {
      return {
        valid: false,
        discount_amount: 0,
        original_price: BASE_PRICE,
        final_price: hasMilestone ? 800 : BASE_PRICE,
        requires_id_upload: false,
        is_defense_coupon: false,
        is_milestone_applied: hasMilestone,
        message: `Coupon code "${normalizedCode}" expired on ${validUntil.toLocaleDateString()}.`
      };
    }

    // Usage limit verification
    if (coupon.current_uses >= coupon.max_uses) {
      return {
        valid: false,
        discount_amount: 0,
        original_price: BASE_PRICE,
        final_price: hasMilestone ? 800 : BASE_PRICE,
        requires_id_upload: false,
        is_defense_coupon: false,
        is_milestone_applied: hasMilestone,
        message: `Coupon code "${normalizedCode}" has reached its maximum usage limit.`
      };
    }

    // Minimum order value
    if (coupon.min_order_value && orderAmount < coupon.min_order_value) {
      return {
        valid: false,
        discount_amount: 0,
        original_price: BASE_PRICE,
        final_price: hasMilestone ? 800 : BASE_PRICE,
        requires_id_upload: false,
        is_defense_coupon: false,
        is_milestone_applied: hasMilestone,
        message: `Coupon code "${normalizedCode}" requires a minimum order of ₹${coupon.min_order_value}.`
      };
    }

    // Calculate coupon discount
    let couponDiscount = 0;
    if (coupon.discount_type === "PERCENTAGE") {
      couponDiscount = Math.round((BASE_PRICE * coupon.discount_val) / 100);
    } else {
      couponDiscount = Math.min(coupon.discount_val, BASE_PRICE);
    }

    const isDefense = coupon.requires_id_upload || normalizedCode === "AGNIVEERFLAT50";

    // Check defense verification status for user
    let defenseStatus: "PENDING" | "APPROVED" | "REJECTED" | "NOT_SUBMITTED" = "NOT_SUBMITTED";
    const existingVerif = this.store.defenseVerifications
      .filter((v) => v.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (existingVerif) {
      defenseStatus = existingVerif.verification_status;
    } else if (this.store.userDefenseStatus[userId]) {
      defenseStatus = "APPROVED";
    }

    // Choose best price: If milestone rate (₹800) is better than coupon discount, or vice versa
    const priceWithCoupon = Math.max(0, BASE_PRICE - couponDiscount);
    const finalPrice = Math.min(priceWithCoupon, hasMilestone ? 800 : priceWithCoupon);
    const totalDiscount = BASE_PRICE - finalPrice;

    return {
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_val: coupon.discount_val,
      discount_amount: totalDiscount,
      original_price: BASE_PRICE,
      final_price: finalPrice,
      requires_id_upload: isDefense,
      is_defense_coupon: isDefense,
      is_milestone_applied: hasMilestone && 800 < priceWithCoupon,
      defense_status: defenseStatus,
      message: isDefense
        ? (defenseStatus === "APPROVED"
            ? `50% Armed Forces Discount Applied! (Defense ID verified by Admin - You pay ₹${finalPrice})`
            : defenseStatus === "PENDING"
            ? `50% Armed Forces Discount Provisionally Applied (₹${finalPrice}). Official Military ID upload is currently PENDING Admin Verification.`
            : `Military / Agniveer ID Card Required for 50% Off (User pays ₹${finalPrice}). Please upload official ID proof below.`)
        : `Coupon "${coupon.code}" applied successfully! (You saved ₹${totalDiscount})`
    };
  }

  // Upload Military / Agniveer ID card
  public uploadDefenseId(userId: string, couponCode: string, idCardImageUrl: string, userDetails?: { name?: string; phone?: string; email?: string }): DefenseVerification {
    const coupon = this.store.coupons.find((c) => c.code.toUpperCase() === (couponCode || "AGNIVEERFLAT50").toUpperCase());
    
    // Check if verification already exists for user
    const existingIndex = this.store.defenseVerifications.findIndex((v) => v.user_id === userId);

    const record: DefenseVerification = {
      id: existingIndex >= 0 ? this.store.defenseVerifications[existingIndex].id : `def_${Date.now()}`,
      user_id: userId,
      user_name: userDetails?.name || "Candidate",
      user_phone: userDetails?.phone || "Phone not provided",
      user_email: userDetails?.email || "Email not provided",
      coupon_id: coupon ? coupon.id : "cpn_agniveer_50",
      coupon_code: coupon ? coupon.code : "AGNIVEERFLAT50",
      id_card_image_url: idCardImageUrl,
      verification_status: "PENDING",
      admin_notes: "Uploaded by candidate. Awaiting official Armed Forces credential verification.",
      created_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.store.defenseVerifications[existingIndex] = record;
    } else {
      this.store.defenseVerifications.unshift(record);
    }

    this.persistStore();
    return record;
  }

  // Review Defense Verification (Admin)
  public reviewDefenseVerification(verificationId: string, status: "APPROVED" | "REJECTED", adminNotes: string, reviewerName: string = "Admin"): DefenseVerification | null {
    const verification = this.store.defenseVerifications.find((v) => v.id === verificationId);
    if (!verification) return null;

    verification.verification_status = status;
    verification.admin_notes = adminNotes;
    verification.reviewed_at = new Date().toISOString();
    verification.reviewed_by = reviewerName;

    // Update user's defense verification flag
    this.store.userDefenseStatus[verification.user_id] = (status === "APPROVED");

    this.persistStore();
    return verification;
  }

  // Payment Webhook Handler (Cashfree / Razorpay)
  public handlePaymentSuccessWebhook(payload: {
    order_id: string;
    payment_id: string;
    user_id: string;
    amount: number;
    coupon_applied?: string;
    referee_name?: string;
    referee_phone?: string;
    referee_email?: string;
  }): {
    success: boolean;
    order_id: string;
    subscription_id: string;
    qualified_referral: boolean;
    referrer_id?: string;
    referrer_qualified_count?: number;
    milestone_unlocked?: boolean;
    message: string;
  } {
    const { order_id, payment_id, user_id, amount, coupon_applied, referee_name, referee_phone, referee_email } = payload;

    // 1. Record subscription
    const subscriptionId = `sub_${Date.now()}`;
    const newSubscription: Subscription = {
      id: subscriptionId,
      user_id,
      amount_paid: amount,
      original_price: 1500,
      coupon_applied: coupon_applied || undefined,
      status: "ACTIVE",
      payment_id,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_milestone_rate: amount === 800
    };
    this.store.subscriptions.push(newSubscription);

    // Increment coupon uses if coupon was applied
    if (coupon_applied) {
      const appliedCoupon = this.store.coupons.find(
        (c) => c.code.toUpperCase() === coupon_applied.toUpperCase()
      );
      if (appliedCoupon) {
        appliedCoupon.current_uses += 1;
      }
    }

    // 2. Check if this user was referred by someone
    // Look up referral record for this referee
    let referral = this.store.referrals.find((r) => r.referee_id === user_id);

    // If referee doesn't have an existing referral record but userReferredBy has it
    if (!referral && this.store.userReferredBy[user_id]) {
      const refCode = this.store.userReferredBy[user_id];
      let referrerId: string | null = null;
      for (const [uid, code] of Object.entries(this.store.userReferralCodes)) {
        if (code.toUpperCase() === refCode.toUpperCase()) {
          referrerId = uid;
          break;
        }
      }

      if (referrerId && referrerId !== user_id) {
        referral = {
          id: `ref_${Date.now()}`,
          referrer_id: referrerId,
          referrer_code: refCode,
          referee_id: user_id,
          referee_name: referee_name || "Paid Member",
          referee_phone: referee_phone,
          referee_email: referee_email,
          status: "REGISTERED",
          created_at: new Date().toISOString()
        };
        this.store.referrals.push(referral);
      }
    }

    let qualified = false;
    let referrerId: string | undefined;
    let qualifiedCount: number | undefined;
    let milestoneUnlocked = false;

    if (referral) {
      // Prevent self-referral
      if (referral.referrer_id !== user_id) {
        referral.status = "QUALIFIED_PAID";
        referral.order_id = order_id;
        referral.qualified_at = new Date().toISOString();
        if (referee_name) referral.referee_name = referee_name;

        qualified = true;
        referrerId = referral.referrer_id;
        qualifiedCount = this.getQualifiedReferralsCount(referrerId);
        milestoneUnlocked = qualifiedCount >= 6;
      }
    }

    this.persistStore();

    return {
      success: true,
      order_id,
      subscription_id: subscriptionId,
      qualified_referral: qualified,
      referrer_id: referrerId,
      referrer_qualified_count: qualifiedCount,
      milestone_unlocked: milestoneUnlocked,
      message: qualified
        ? `Payment verified! Referral marked as QUALIFIED_PAID for referrer (${referrerId}). Total Qualified: ${qualifiedCount} / 6.${milestoneUnlocked ? " 🎉 Milestone Unlocked: ₹800 Subscription Rate Available!" : ""}`
        : "Payment verified and subscription activated successfully."
    };
  }

  // Admin: Get all coupons
  public getAllCoupons(): Coupon[] {
    return this.store.coupons;
  }

  // Admin: Create Coupon
  public createCoupon(data: Partial<Coupon>): Coupon {
    const code = (data.code || "").trim().toUpperCase();
    const existing = this.store.coupons.find((c) => c.code.toUpperCase() === code);
    if (existing) {
      throw new Error(`Coupon with code "${code}" already exists.`);
    }

    const newCoupon: Coupon = {
      id: `cpn_${Date.now()}`,
      code,
      discount_type: data.discount_type || "PERCENTAGE",
      discount_val: Number(data.discount_val) || 10,
      requires_id_upload: Boolean(data.requires_id_upload),
      valid_from: data.valid_from || new Date().toISOString(),
      valid_until: data.valid_until || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      min_order_value: Number(data.min_order_value) || 0,
      max_uses: Number(data.max_uses) || 1000,
      current_uses: 0,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      description: data.description || "",
      created_at: new Date().toISOString()
    };

    this.store.coupons.unshift(newCoupon);
    this.persistStore();
    return newCoupon;
  }

  // Admin: Update Coupon
  public updateCoupon(id: string, data: Partial<Coupon>): Coupon | null {
    const coupon = this.store.coupons.find((c) => c.id === id);
    if (!coupon) return null;

    if (data.code) coupon.code = data.code.trim().toUpperCase();
    if (data.discount_type) coupon.discount_type = data.discount_type;
    if (data.discount_val !== undefined) coupon.discount_val = Number(data.discount_val);
    if (data.requires_id_upload !== undefined) coupon.requires_id_upload = Boolean(data.requires_id_upload);
    if (data.valid_from) coupon.valid_from = data.valid_from;
    if (data.valid_until) coupon.valid_until = data.valid_until;
    if (data.min_order_value !== undefined) coupon.min_order_value = Number(data.min_order_value);
    if (data.max_uses !== undefined) coupon.max_uses = Number(data.max_uses);
    if (data.is_active !== undefined) coupon.is_active = Boolean(data.is_active);
    if (data.description !== undefined) coupon.description = data.description;

    this.persistStore();
    return coupon;
  }

  // Admin: Delete Coupon
  public deleteCoupon(id: string): boolean {
    const idx = this.store.coupons.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.store.coupons.splice(idx, 1);
    this.persistStore();
    return true;
  }

  // Admin: Get Defense Verifications
  public getDefenseVerifications(filterStatus?: string): DefenseVerification[] {
    if (!filterStatus || filterStatus === "ALL") {
      return this.store.defenseVerifications;
    }
    return this.store.defenseVerifications.filter(
      (v) => v.verification_status === filterStatus
    );
  }

  // Admin: Real-time Leaderboard of User Referral Rankings
  public getReferralRankings(): ReferralRankItem[] {
    const userStatsMap: Record<string, { total: number; qualified: number }> = {};

    for (const ref of this.store.referrals) {
      if (!userStatsMap[ref.referrer_id]) {
        userStatsMap[ref.referrer_id] = { total: 0, qualified: 0 };
      }
      userStatsMap[ref.referrer_id].total += 1;
      if (ref.status === "QUALIFIED_PAID") {
        userStatsMap[ref.referrer_id].qualified += 1;
      }
    }

    // Include any users with registered referral codes even if 0 invites yet
    for (const uid of Object.keys(this.store.userReferralCodes)) {
      if (!userStatsMap[uid]) {
        userStatsMap[uid] = { total: 0, qualified: 0 };
      }
    }

    const items: ReferralRankItem[] = Object.entries(userStatsMap).map(([userId, stats]) => {
      const code = this.store.userReferralCodes[userId] || "SHUBH-PEND";
      const isEligible = stats.qualified >= 6;
      let name = "Registered User";
      let phone = "N/A";
      let email = "user@shubhamastu.in";

      if (userId === "prof-subbu") {
        name = "Sri G.V. Subramanyam";
        phone = "+91 9347359489";
        email = "subramanyamghadiyaram@gmail.com";
      } else if (userId === "prof-subba-reddy") {
        name = "Sri P.V. Subba Reddy";
        phone = "+91 9494949494";
        email = "subbareddy@gmail.com";
      }

      return {
        user_id: userId,
        name,
        phone,
        email,
        referral_code: code,
        total_invites: stats.total,
        qualified_paid: stats.qualified,
        is_eligible_800_tier: isEligible
      };
    });

    // Sort by qualified paid descending, then total invites descending
    items.sort((a, b) => {
      if (b.qualified_paid !== a.qualified_paid) {
        return b.qualified_paid - a.qualified_paid;
      }
      return b.total_invites - a.total_invites;
    });

    items.forEach((item, index) => {
      item.rank = index + 1;
    });

    return items;
  }
}

export const referralCouponEngine = new ReferralCouponEngine();
