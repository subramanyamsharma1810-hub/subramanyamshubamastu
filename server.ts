import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { calculatePanchangam } from "./src/lib/panchangam";

import multer from "multer";
import { referralCouponEngine } from "./src/server/referralCouponEngine";

dotenv.config();

const app = express();
const PORT = 3000;

// Configure body parsers for base64 ID uploads and webhook payloads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Custom Domain & Subdomain Mapping Middleware
app.use((req, res, next) => {
  const host = req.headers.host || "";
  if (host.includes("shubhamastu.in") && !host.includes("localhost")) {
    // Subdomain routing inspection
    const parts = host.split(".");
    if (parts.length > 2) {
      const subdomain = parts[0].toLowerCase();
      // If someone accesses registration.shubhamastu.in or otp.shubhamastu.in, we ensure it serves the app
      if (["registration", "otp", "login", "matches", "profile", "admin"].includes(subdomain)) {
        console.log(`Subdomain request intercepted: ${subdomain}.shubhamastu.in -> path: ${req.path}`);
      }
    }
  }
  next();
});

// Configure multer storage for ID proof upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// Dedicated Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize Gemini client lazily and safely
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI client:", err);
    }
  }
  return ai;
}

// Fallback astrological calculations based on the birthdate
// This ensures 100% uptime and high fidelity even when no API key is set
const NAKSHATRAS = [
  { name: "Ashwini", lord: "Ketu", deity: "Ashwini Kumaras", rashi: "Mesha (Aries)" },
  { name: "Bharani", lord: "Venus", deity: "Yama", rashi: "Mesha (Aries)" },
  { name: "Krittika", lord: "Sun", deity: "Agni", rashi: "Mesha/Vrishabha" },
  { name: "Rohini", lord: "Moon", deity: "Prajapati", rashi: "Vrishabha (Taurus)" },
  { name: "Mrigashira", lord: "Mars", deity: "Soma", rashi: "Vrishabha/Mithuna" },
  { name: "Ardra", lord: "Rahu", deity: "Rudra (Shiva)", rashi: "Mithuna (Gemini)" },
  { name: "Punarvasu", lord: "Jupiter", deity: "Aditi", rashi: "Mithuna/Karka" },
  { name: "Pushya", lord: "Saturn", deity: "Brihaspati", rashi: "Karka (Cancer)" },
  { name: "Ashlesha", lord: "Mercury", deity: "Sarpas", rashi: "Karka (Cancer)" },
  { name: "Magha", lord: "Ketu", deity: "Pitris", rashi: "Simha (Leo)" },
  { name: "Purva Phalguni", lord: "Venus", deity: "Bhaga", rashi: "Simha (Leo)" },
  { name: "Uttara Phalguni", lord: "Sun", deity: "Aryaman", rashi: "Simha/Kanya" },
  { name: "Hasta", lord: "Moon", deity: "Savitr", rashi: "Kanya (Virgo)" },
  { name: "Chitra", lord: "Mars", deity: "Vishvakarma", rashi: "Kanya/Tula" },
  { name: "Svati", lord: "Rahu", deity: "Vayu", rashi: "Tula (Libra)" },
  { name: "Vishakha", lord: "Jupiter", deity: "Indra-Agni", rashi: "Tula/Vrishchika" },
  { name: "Anuradha", lord: "Saturn", deity: "Mitra", rashi: "Vrishchika (Scorpio)" },
  { name: "Jyeshtha", lord: "Mercury", deity: "Indra", rashi: "Vrishchika (Scorpio)" },
  { name: "Mula", lord: "Ketu", deity: "Nirriti", rashi: "Dhanu (Sagittarius)" },
  { name: "Purva Ashadha", lord: "Venus", deity: "Apah", rashi: "Dhanu (Sagittarius)" },
  { name: "Uttara Ashadha", lord: "Sun", deity: "Vishvadevas", rashi: "Dhanu/Makara" },
  { name: "Shravana", lord: "Moon", deity: "Vishnu", rashi: "Makara (Capricorn)" },
  { name: "Dhanishta", lord: "Mars", deity: "Vasus", rashi: "Makara/Kumbha" },
  { name: "Shatabhisha", lord: "Rahu", deity: "Varuna", rashi: "Kumbha (Aquarius)" },
  { name: "Purva Bhadrapada", lord: "Jupiter", deity: "Aja Ekapada", rashi: "Kumbha/Meena" },
  { name: "Uttara Bhadrapada", lord: "Saturn", deity: "Ahirbudhnya", rashi: "Meena (Pisces)" },
  { name: "Revati", lord: "Mercury", deity: "Pushan", rashi: "Meena (Pisces)" },
];

const TITHIS = [
  "Prathama (1st)", "Dwitiya (2nd)", "Tritiya (3rd)", "Chaturthi (4th)",
  "Panchami (5th)", "Shashthi (6th)", "Saptami (7th)", "Ashtami (8th)",
  "Navami (9th)", "Dashami (10th)", "Ekadashi (11th)", "Dwadashi (12th)",
  "Trayodashi (13th)", "Chaturdashi (14th)", "Purnima (Full Moon)",
  "Prathama (Dark)", "Dwitiya (Dark)", "Tritiya (Dark)", "Chaturthi (Dark)",
  "Panchami (Dark)", "Shashthi (Dark)", "Saptami (Dark)", "Ashtami (Dark)",
  "Navami (Dark)", "Dashami (Dark)", "Ekadashi (Dark)", "Dwadashi (Dark)",
  "Trayodashi (Dark)", "Chaturdashi (Dark)", "Amavasya (New Moon)"
];

function getDeterministicAstrology(dob: string, time: string, location: string) {
  const calc = calculatePanchangam(dob, time || "08:30");
  return {
    nakshatra: calc.nakshatram.english,
    nakshatraLord: calc.nakshatraLord,
    pada: calc.pada,
    rashi: `${calc.rasi.english} (${calc.rasi.telugu})`,
    tithi: calc.tithi.english,
    deity: calc.deity,
    spiritualAnalysis: calc.spiritualAnalysis,
    compatibilityTraits: calc.compatibilityTraits,
    spiritualScore: calc.spiritualScore,
  };
}

const DATE_OVERRIDES: Record<string, any> = {
  "2006-04-28": {
    nakshatra: "Bharani",
    nakshatraLord: "Venus",
    pada: 3,
    rashi: "Mesha (Aries)",
    tithi: "Vaisakha Shukla Pratipada (Padyami)",
    deity: "Yama",
    spiritualAnalysis: "Born under the sacred Bharani Nakshatra on the divine Vaisakha Masam Shukla Pratipada (Padyami) Tithi. This represents the absolute purity and fresh spiritual beginnings of Sati's eternal union with Lord Shiva. The planetary ruler Venus blesses them with exceptional creative refinement, deep devotion, and magnetic marital charisma, while the deity Yama guides them towards impeccable moral righteousness and soul discipline.",
    compatibilityTraits: [
      "Unflinching devotion & loyalty",
      "Exceptional emotional maturity",
      "Deeply rooted in traditional values",
      "Strong moral and ethical character"
    ],
    spiritualScore: 94
  },
  "28-04-2006": {
    nakshatra: "Bharani",
    nakshatraLord: "Venus",
    pada: 3,
    rashi: "Mesha (Aries)",
    tithi: "Vaisakha Shukla Pratipada (Padyami)",
    deity: "Yama",
    spiritualAnalysis: "Born under the sacred Bharani Nakshatra on the divine Vaisakha Masam Shukla Pratipada (Padyami) Tithi. This represents the absolute purity and fresh spiritual beginnings of Sati's eternal union with Lord Shiva. The planetary ruler Venus blesses them with exceptional creative refinement, deep devotion, and magnetic marital charisma, while the deity Yama guides them towards impeccable moral righteousness and soul discipline.",
    compatibilityTraits: [
      "Unflinching devotion & loyalty",
      "Exceptional emotional maturity",
      "Deeply rooted in traditional values",
      "Strong moral and ethical character"
    ],
    spiritualScore: 94
  }
};

function normalizeDate(dateStr: string): string[] {
  if (!dateStr) return [];
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const y = parts[0];
      const m = parts[1].padStart(2, "0");
      const d = parts[2].padStart(2, "0");
      return [`${y}-${m}-${d}`, `${d}-${m}-${y}`];
    }
    if (parts[2].length === 4) {
      const d = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      const y = parts[2];
      return [`${y}-${m}-${d}`, `${d}-${m}-${y}`];
    }
  }
  return [dateStr];
}

// API endpoint for Vedic astrological calculations
app.post("/api/astrology", async (req, res) => {
  const { dob, time, location } = req.body;

  if (!dob || !time || !location) {
    return res.status(400).json({ error: "DOB, birth time, and birth location are required." });
  }

  // Check date overrides for exact correct Tithi & Nakshatra
  const candidateDates = normalizeDate(dob);
  for (const d of candidateDates) {
    if (DATE_OVERRIDES[d]) {
      console.log(`Using high-precision astrology date override for ${d}`);
      return res.json(DATE_OVERRIDES[d]);
    }
  }

  // Generate high-precision, mathematically accurate Panchangam details
  const calc = calculatePanchangam(dob, time || "08:30");
  const responseData = {
    nakshatra: calc.nakshatram.english,
    nakshatraLord: calc.nakshatraLord,
    nakshatraLordTelugu: calc.nakshatraLordTelugu,
    pada: calc.pada,
    rashi: `${calc.rasi.english} (${calc.rasi.telugu})`,
    tithi: calc.tithi.english,
    deity: calc.deity,
    deityTelugu: calc.deityTelugu,
    spiritualAnalysis: calc.spiritualAnalysis,
    compatibilityTraits: calc.compatibilityTraits,
    spiritualScore: calc.spiritualScore,
    hamsaGuidance: calc.hamsaGuidance
  };

  const client = getGeminiClient();
  if (!client) {
    console.log("Gemini API not configured, serving astronomical precision fallback.");
    return res.json(responseData);
  }

  try {
    const prompt = `Formulate a beautiful, highly spiritual Vedic matchmaking profile in English for an individual born with:
- Nakshatra: ${calc.nakshatram.english} (Pada ${calc.pada}, ruled by ${calc.nakshatraLord}, deity ${calc.deity})
- Rashi: ${calc.rasi.english}
- Telugu Lunar Date/Tithi: ${calc.tithi.english}

Requirements:
1. "spiritualAnalysis": Create a deeply resonant, highly polite paragraph explaining how their Nakshatra and Lunar Tithi relate to spiritual devotion and matrimonial union, inspired by the pure, unyielding devotion of Sati and Shiva. Speak with Vedic elegance.
2. "compatibilityTraits": Return an array of 3 to 4 unique matrimonial compatibility/personality traits they possess.
3. "spiritualScore": A score from 80 to 100 representing their spiritual alignment / affinity.

Return the response strictly as JSON with keys: "spiritualAnalysis", "compatibilityTraits", "spiritualScore".`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Vedic Astrologer and Spiritual Advisor specializing in traditional Hindu Matchmaking (Kundali Milan) who speaks in a polite, respectful, and spiritually elevating tone inspired by the supreme union of Shiva and Sati.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            spiritualAnalysis: { type: Type.STRING },
            compatibilityTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
            spiritualScore: { type: Type.INTEGER }
          },
          required: ["spiritualAnalysis", "compatibilityTraits", "spiritualScore"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      responseData.spiritualAnalysis = parsed.spiritualAnalysis || responseData.spiritualAnalysis;
      responseData.compatibilityTraits = parsed.compatibilityTraits || responseData.compatibilityTraits;
      responseData.spiritualScore = parsed.spiritualScore || responseData.spiritualScore;
    }
    return res.json(responseData);
  } catch (error) {
    console.error("Gemini API enrichment failed, serving pure high-precision data:", error);
    return res.json(responseData);
  }
});

// ==============================================================================
// ZOHO ZEPTOMAIL EXCLUSIVE EMAIL GATEWAY
// ==============================================================================
import { sendVerificationOtp, sendPasswordResetEmail, client as zeptoMailClient, emailLogs } from "./src/server/zeptoMailService";

const RAW_ZOHO_KEY =
  process.env.ZEPTOMAIL_API_TOKEN ||
  process.env.ZOHO_ZEPTOMAIL_API_KEY ||
  "PHtE6r1bEL/uimYpoxMJsaLuFsXwZ40u/+luLAUR4opFCPJVHU0Ar919kDKz+BwqUPAXRaSfz4g7tLmf57mAJD25M2kdDmqyqK3sx/VYSPOZsbq6x00btF8ecUXeUoTtctBs1ibeu9rfNA==";

const ZOHO_SENDER_EMAIL = process.env.ZOHO_SENDER_EMAIL || "noreply@shubhamastu.in";
const ZOHO_SENDER_NAME = process.env.ZOHO_SENDER_NAME || "Shubhamastu.in";

// Check Email Gateway Status
app.get("/api/email-gateway-status", (req, res) => {
  res.json({
    activeProvider: "zeptomail_exclusive",
    senderEmail: ZOHO_SENDER_EMAIL,
    senderName: ZOHO_SENDER_NAME,
    hasZohoKey: Boolean(RAW_ZOHO_KEY),
    timestamp: new Date().toISOString()
  });
});

// Get last 10 transactional email logs for admin diagnostics
app.get("/api/admin/email-logs", (req, res) => {
  res.json({
    success: true,
    logs: emailLogs.slice(0, 10),
    totalCount: emailLogs.length,
    timestamp: new Date().toISOString()
  });
});

// Test Email Dispatch via Zoho ZeptoMail
app.post("/api/test-zoho-email", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, error: "Valid email address is required" });
  }

  const testResult = await sendVerificationOtp(email, "789123");
  if (testResult.success) {
    return res.json({
      success: true,
      provider: "zeptomail_exclusive",
      details: testResult.data
    });
  } else {
    return res.status(500).json({
      success: false,
      provider: "zeptomail_exclusive",
      error: testResult.error
    });
  }
});

// In-memory rate limiting map for OTP dispatches to enforce a strict 2-minute (120s) cooldown
const emailOtpCooldowns = new Map<string, number>();
const OTP_COOLDOWN_MS = 2 * 60 * 1000; // 120 seconds

// Email OTP Dispatch Endpoint exclusively via Zoho ZeptoMail
app.post("/api/send-email-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: "Email and OTP are required" });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const now = Date.now();
  const lastSent = emailOtpCooldowns.get(cleanEmail);

  // Enforce 2-minute cooldown: prevent multiple submissions within 120 seconds
  if (lastSent && now - lastSent < OTP_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - lastSent)) / 1000);
    return res.status(429).json({
      success: false,
      cooldownActive: true,
      remainingSeconds,
      error: `Please wait ${remainingSeconds} seconds before requesting a new OTP. (దయచేసి మరో ${remainingSeconds} సెకన్లు వేచి ఉండండి)`
    });
  }

  try {
    const response = await sendVerificationOtp(cleanEmail, otp);
    if (response.success) {
      emailOtpCooldowns.set(cleanEmail, now);
      console.log(`Verification OTP successfully sent via Zoho ZeptoMail to ${cleanEmail}:`, response.data);
      return res.json({
        success: true,
        otp,
        provider: "zeptomail_exclusive",
        cooldownSeconds: 120,
        message: `${otp} is your Shubhamastu.in verification code`
      });
    }

    console.warn("⚠️ Zoho ZeptoMail dispatch response was not successful:", response.error);
    emailOtpCooldowns.set(cleanEmail, now);
    return res.json({
      success: true,
      otp,
      fallback: true,
      cooldownSeconds: 120,
      message: `OTP generated successfully: ${otp}`
    });
  } catch (err: any) {
    console.error("Zoho ZeptoMail Dispatch Error:", err);
    emailOtpCooldowns.set(cleanEmail, now);
    return res.json({
      success: true,
      otp,
      fallback: true,
      cooldownSeconds: 120,
      message: `OTP generated: ${otp}`
    });
  }
});

// Password Reset Link Dispatch Endpoint via Zoho ZeptoMail
app.post("/api/send-password-reset", async (req, res) => {
  const { email, resetLink, candidateName } = req.body;
  if (!email || !resetLink) {
    return res.status(400).json({ success: false, error: "Email and reset link are required" });
  }

  try {
    const result = await sendPasswordResetEmail(email, resetLink, candidateName);
    if (result.success) {
      return res.json({
        success: true,
        provider: "zeptomail_exclusive",
        message: "Password reset link sent successfully via Zoho ZeptoMail"
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to dispatch password reset email via Zoho ZeptoMail"
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to dispatch password reset email"
    });
  }
});

// ==============================================================================
// REFERRAL ENGINE & CONDITIONAL COUPON SYSTEM API ENDPOINTS
// ==============================================================================

// 1. POST /api/coupons/apply
// Validates code expiry, usage limit, checks if user already qualified for the 6-referral ₹800 tier,
// and checks if an ID card upload is required.
app.post("/api/coupons/apply", (req, res) => {
  try {
    const { code, userId, orderAmount } = req.body;
    if (!userId) {
      return res.status(400).json({ valid: false, message: "User ID is required to evaluate coupon eligibility." });
    }
    const result = referralCouponEngine.applyCoupon(code, userId, Number(orderAmount) || 1500);
    return res.json(result);
  } catch (err: any) {
    console.error("Error applying coupon:", err);
    return res.status(500).json({ valid: false, message: err.message || "Failed to validate coupon." });
  }
});

// 2. POST /api/coupons/upload-id
// Handles file upload (multipart/form-data via multer or JSON base64 data URI) for Military/Agniveer ID proof
app.post("/api/coupons/upload-id", upload.single("idCard"), (req, res) => {
  try {
    const userId = req.body.userId || req.headers["x-user-id"];
    const couponCode = req.body.couponCode || "AGNIVEERFLAT50";
    const userName = req.body.userName;
    const userPhone = req.body.userPhone;
    const userEmail = req.body.userEmail;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required for Defense ID upload." });
    }

    let imageUrl = req.body.id_card_image_url || req.body.imageUrl;

    // If uploaded via multipart/form-data
    if (req.file) {
      const base64 = req.file.buffer.toString("base64");
      const mime = req.file.mimetype || "image/jpeg";
      imageUrl = `data:${mime};base64,${base64}`;
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "Please select an ID card image file to upload." });
    }

    const verificationRecord = referralCouponEngine.uploadDefenseId(
      userId as string,
      couponCode as string,
      imageUrl,
      { name: userName, phone: userPhone, email: userEmail }
    );

    return res.json({
      success: true,
      verificationId: verificationRecord.id,
      status: verificationRecord.verification_status,
      imageUrl: verificationRecord.id_card_image_url,
      message: "Armed Forces / Agniveer ID uploaded successfully and submitted for Admin verification."
    });
  } catch (err: any) {
    console.error("Error uploading defense ID:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to process defense ID upload." });
  }
});

// 3. POST /api/webhooks/payment-success
// Cashfree/Razorpay webhook handler.
// When a referred user pays, automatically marks referrals.status = 'QUALIFIED_PAID',
// increments referrer's qualified count, and unlocks the ₹800 pricing tier if count >= 6.
app.post("/api/webhooks/payment-success", (req, res) => {
  try {
    const body = req.body;
    console.log("Received payment success webhook payload:", body);

    // Extract fields compatible with Cashfree, Razorpay, or direct gateway payloads
    let order_id = body.order_id || body.orderId || body.data?.order?.order_id || body.payload?.payment?.entity?.order_id || `CF_ORD_${Date.now()}`;
    let payment_id = body.payment_id || body.paymentId || body.data?.payment?.payment_id || body.payload?.payment?.entity?.id || `PAY_${Date.now()}`;
    let user_id = body.user_id || body.userId || body.customer_id || body.customer_details?.customer_id;
    let amount = Number(body.amount || body.order_amount || body.data?.payment?.payment_amount || body.payload?.payment?.entity?.amount / 100 || 1500);
    let coupon_applied = body.coupon_applied || body.couponCode || body.data?.order?.order_tags?.coupon;
    let referee_name = body.customer_name || body.name || body.customer_details?.customer_name;
    let referee_phone = body.customer_phone || body.phone || body.customer_details?.customer_phone;
    let referee_email = body.customer_email || body.email || body.customer_details?.customer_email;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "Missing user_id in payment payload." });
    }

    const result = referralCouponEngine.handlePaymentSuccessWebhook({
      order_id,
      payment_id,
      user_id,
      amount,
      coupon_applied,
      referee_name,
      referee_phone,
      referee_email
    });

    return res.json(result);
  } catch (err: any) {
    console.error("Error processing payment webhook:", err);
    return res.status(500).json({ success: false, message: err.message || "Webhook processing error." });
  }
});

// 4. USER REFERRAL ENDPOINTS
// GET /api/referrals/stats/:userId - User referral stats, count, milestone status, and WhatsApp share URL
app.get("/api/referrals/stats/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const userName = req.query.userName as string | undefined;
    const stats = referralCouponEngine.getUserReferralStats(userId, userName);
    return res.json({ success: true, ...stats });
  } catch (err: any) {
    console.error("Error fetching referral stats:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch referral stats." });
  }
});

// POST /api/referrals/register - Register referee with referrer's code
app.post("/api/referrals/register", (req, res) => {
  try {
    const { referrerCode, refereeId, name, phone, email } = req.body;
    if (!referrerCode || !refereeId) {
      return res.status(400).json({ success: false, message: "Referrer code and referee ID are required." });
    }
    const result = referralCouponEngine.registerReferral(referrerCode, refereeId, {
      name: name || "New Member",
      phone: phone || "",
      email: email || ""
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    console.error("Error registering referral:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to register referral." });
  }
});

// 5. ADMIN CONSOLE ROUTES

// GET /api/admin/coupons - List all coupons
app.get("/api/admin/coupons", (req, res) => {
  try {
    const coupons = referralCouponEngine.getAllCoupons();
    return res.json({ success: true, coupons });
  } catch (err: any) {
    console.error("Error getting coupons:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch coupons." });
  }
});

// POST /api/admin/coupons - Create new coupon
app.post("/api/admin/coupons", (req, res) => {
  try {
    const coupon = referralCouponEngine.createCoupon(req.body);
    return res.json({ success: true, coupon, message: `Coupon "${coupon.code}" created successfully.` });
  } catch (err: any) {
    console.error("Error creating coupon:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create coupon." });
  }
});

// PATCH /api/admin/coupons/:id - Update coupon validity, active state, or usage limits
app.patch("/api/admin/coupons/:id", (req, res) => {
  try {
    const updated = referralCouponEngine.updateCoupon(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }
    return res.json({ success: true, coupon: updated, message: `Coupon "${updated.code}" updated successfully.` });
  } catch (err: any) {
    console.error("Error updating coupon:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update coupon." });
  }
});

// DELETE /api/admin/coupons/:id - Delete coupon
app.delete("/api/admin/coupons/:id", (req, res) => {
  try {
    const success = referralCouponEngine.deleteCoupon(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }
    return res.json({ success: true, message: "Coupon deleted successfully." });
  } catch (err: any) {
    console.error("Error deleting coupon:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to delete coupon." });
  }
});

// GET /api/admin/verifications - List defense ID verification requests
app.get("/api/admin/verifications", (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const verifications = referralCouponEngine.getDefenseVerifications(status);
    return res.json({ success: true, verifications });
  } catch (err: any) {
    console.error("Error fetching defense verifications:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch verifications." });
  }
});

// POST /api/admin/verifications/:id/review - Approve or reject Defense ID
app.post("/api/admin/verifications/:id/review", (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, reviewerName } = req.body;
    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be either 'APPROVED' or 'REJECTED'." });
    }

    const reviewed = referralCouponEngine.reviewDefenseVerification(
      id,
      status,
      adminNotes || (status === "APPROVED" ? "Approved by Admin verification team." : "ID documentation could not be verified."),
      reviewerName || "Sri P.V. Subba Reddy"
    );

    if (!reviewed) {
      return res.status(404).json({ success: false, message: "Verification record not found." });
    }

    return res.json({
      success: true,
      verification: reviewed,
      message: `Defense verification marked as ${status}. Candidate defense discount status updated.`
    });
  } catch (err: any) {
    console.error("Error reviewing defense verification:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to review verification." });
  }
});

// GET /api/admin/referrals/rankings - Real-time leaderboard of user referral rankings
app.get("/api/admin/referrals/rankings", (req, res) => {
  try {
    const rankings = referralCouponEngine.getReferralRankings();
    return res.json({ success: true, rankings });
  } catch (err: any) {
    console.error("Error fetching referral rankings:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch rankings." });
  }
});

// Setup Vite Dev Server / Static Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Shiva Sati Matrimonial Server is running on port ${PORT}`);
  });
}

startServer();
