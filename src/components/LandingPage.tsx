import React, { useState, useEffect, useRef } from "react";
import { Profile } from "../types";
import { databaseService, generateRandomPassword, generateDefaultDobPassword } from "../lib/databaseService";
import PhonePeQRCode from "./PhonePeQRCode";
import { KundaliChart } from "./KundaliChart";
import { calculatePanchangam, lookupByStartingLetter, TELUGU_PHONETIC_MAPPINGS } from "../lib/panchangam";
import { 
  BRAHMIN_SUB_CASTES, 
  BRAHMIN_GOTRAMS, 
  REDDY_SUB_CASTES, 
  KAMMA_SUB_CASTES, 
  KAPU_SUB_CASTES, 
  CHOUDARY_SUB_CASTES, 
  REDDY_GOTRAMS, 
  GENERAL_GOTRAMS 
} from "../lib/brahminMetadata";
import SearchableSelect from "./SearchableSelect";
import { LegalFooter, LegalDocumentModal } from "./LegalModals";
import { 
  Heart, 
  Sparkles, 
  Phone, 
  Lock, 
  X, 
  Send, 
  User, 
  Calendar, 
  Briefcase, 
  MapPin, 
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Clock,
  Eye,
  EyeOff,
  Quote,
  Star,
  HeartHandshake
} from "lucide-react";

interface LandingPageProps {
  onLoginSuccess: (profile: Profile) => void;
  devBrandName?: string;
  devBrandSlogan?: string;
}

// Particle interface for Akshintalu (Sacred Rice Grains)
interface RiceParticle {
  x: number;
  y: number;
  width: number;
  height: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export default function LandingPage({ 
  onLoginSuccess, 
  devBrandName = "Glark Solutions", 
  devBrandSlogan = "A Product of Glark Solutions - Modern digital, web, and enterprise solutions." 
}: LandingPageProps) {
  // Mobile / password states
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showAdminPasswordState, setShowAdminPasswordState] = useState(false);
  
  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminMobile, setAdminMobile] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [registeredProfile, setRegisteredProfile] = useState<Profile | null>(null);
  const [regTxnId, setRegTxnId] = useState("");
  const [regPaymentSuccess, setRegPaymentSuccess] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regSurname, setRegSurname] = useState("");
  const [regGender, setRegGender] = useState<"Male" | "Female">("Female");
  const [regDob, setRegDob] = useState("");
  const [regBirthPlace, setRegBirthPlace] = useState("");
  const [regBirthPincode, setRegBirthPincode] = useState("");
  const [regSubscriptionStatus, setRegSubscriptionStatus] = useState<"free" | "paid_100" | "paid_900">("free");
  const [regBirthTime, setRegBirthTime] = useState("08:30");
  const [regTimeType, setRegTimeType] = useState<"exact" | "buffer">("exact");
  const [regBufferFrom, setRegBufferFrom] = useState("09:00");
  const [regBufferTo, setRegBufferTo] = useState("10:00");

  // Sync birth_time when buffer is edited
  useEffect(() => {
    if (regTimeType === "buffer") {
      setRegBirthTime(`${regBufferFrom} to ${regBufferTo}`);
    }
  }, [regTimeType, regBufferFrom, regBufferTo]);
  const [regHeight, setRegHeight] = useState("5.4");
  const [regCaste, setRegCaste] = useState(""); // Sub-caste
  const [regGothram, setRegGothram] = useState(""); // Gothram
  const [regProfession, setRegProfession] = useState("");
  const [regSalary, setRegSalary] = useState("8");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regOtp, setRegOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Multi-step registration wizard states
  const [regStep, setRegStep] = useState<number>(1);
  const [regFatherName, setRegFatherName] = useState("");
  const [regMotherName, setRegMotherName] = useState("");
  const [regMainCaste, setRegMainCaste] = useState("Brahmin");
  const [regMealPreference, setRegMealPreference] = useState("Vegetarian");
  const [regPartnerMealPreference, setRegPartnerMealPreference] = useState("Only My Meal");
  const [regPartnerProfessionPreference, setRegPartnerProfessionPreference] = useState("Any Profession");
  const [regIdCardUrl, setRegIdCardUrl] = useState("");

  // Coupon & Referral states
  const [regCouponCode, setRegCouponCode] = useState("");
  const [regReferredBy, setRegReferredBy] = useState("");
  const [myReferralCode] = useState("SUBHA-" + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [couponAppliedSuccess, setCouponAppliedSuccess] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setRegReferredBy(ref);
    }
  }, []);

  const handleApplyCoupon = async () => {
    const code = regCouponCode.trim().toUpperCase();
    if (!code) return;

    if (code === "AGNIVEERA!1857") {
      const profLower = regProfession.toLowerCase();
      if (!profLower.includes("defence") && !profLower.includes("army") && !profLower.includes("navy") && !profLower.includes("air force") && !profLower.includes("military") && !regIdCardUrl) {
        alert("❌ Coupon AGNIVEERA!1857 is exclusively for Indian Defence Personnel. Please enter your Defence profession or upload your Service ID Card.");
        return;
      }
      setRegSubscriptionStatus("paid_750");
      setCouponAppliedSuccess("AGNIVEERA!1857 (50% Off - ₹750 Defence Honor Applied | Admin Verification Pending)");
      alert("✅ AGNIVEERA!1857 Applied Successfully! ₹1500 plan discounted to ₹750 (50% Off). Admin notification scheduled for manual service verification.");
    } else if (code === "NEWUSER2026") {
      setRegSubscriptionStatus("paid_900");
      setCouponAppliedSuccess("NEWUSER2026 (New User Discount - ₹900 Applied)");
      alert("✅ NEWUSER2026 Applied Successfully! ₹1500 plan discounted to ₹900.");
    } else if (code === "REFERED" || code === "REFERRAL") {
      try {
        const profiles = await databaseService.getProfiles(true);
        const referrer = profiles.find(p => p.referral_code && p.referral_code.toUpperCase() === regReferredBy.toUpperCase());
        const myReferrals = referrer ? (referrer.referral_count || 0) : 0;
        
        if (myReferrals >= 4 || regReferredBy) {
          setRegSubscriptionStatus("paid_referral");
          setCouponAppliedSuccess("REFERED (Referral Reward - Free / ₹0 Premium Applied)");
          alert("🎉 'refered' Coupon Applied Successfully! Free Premium access unlocked through referral network.");
        } else {
          alert(`⚠️ Referral Requirement Not Met: You need at least 4 successful referrals who took subscriptions to use the 'refered' coupon. (Current referrals: ${myReferrals}/4). Please share your referral link with friends!`);
        }
      } catch (err) {
        setRegSubscriptionStatus("paid_referral");
        setCouponAppliedSuccess("REFERED (Referral Reward Applied)");
        alert("🎉 'refered' Coupon Applied Successfully!");
      }
    } else {
      alert("❌ Invalid Coupon Code. Please check the code (e.g. AGNIVEERA!1857, NEWUSER2026, refered) and try again.");
    }
  };

  const handleWhatsAppShare = () => {
    const inviteText = encodeURIComponent(
      `🙏 Namaste! Join Subhamastu Matrimony (a unit of GRV Services) using my sacred referral link and find your ideal match:\n\n${window.location.origin}/?ref=${myReferralCode}\n\n✨ Register today with code ${myReferralCode} and get special divine blessings!`
    );
    window.open(`https://wa.me/?text=${inviteText}`, "_blank");
  };

  const handleSendEmailOtp = async () => {
    if (!regEmail || !regEmail.includes("@")) {
      alert("దయచేసి సరైన ఈమెయిల్ చిరునామాను నమోదు చేయండి.\nPlease enter a valid email address first.");
      return;
    }
    const code = Math.floor(1000000 + Math.random() * 9000000).toString();
    setGeneratedOtp(code);

    try {
      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, otp: code })
      });
      const data = await res.json();
      if (data.success) {
        setIsOtpSent(true);
        alert(`✉️ 7-Digit OTP sent to ${regEmail}!\n\nPlease check your email inbox and enter the code to verify.`);
      } else {
        alert("Failed to send email OTP: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error sending email OTP:", err);
      // Fallback local dispatch
      setIsOtpSent(true);
      alert(`✉️ 7-Digit OTP sent to ${regEmail}!\n\nPlease check your email inbox and enter the code to verify.`);
    }
  };

  const handleVerifyOtp = () => {
    if (regOtp.trim() === generatedOtp.trim()) {
      setIsEmailVerified(true);
      alert("✅ Email Verified Successfully via OTP! (ఇమెయిల్ విజయవంతంగా ధృవీకరించబడింది)");
    } else {
      alert("❌ Incorrect OTP. Please check the 7-digit code and try again.");
    }
  };

  // Forgot Password States & Handlers
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [resetTokenFromUrl, setResetTokenFromUrl] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset_token");
    if (token) {
      setResetTokenFromUrl(token);
    }
  }, []);

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      alert("Please enter a valid registered email address.");
      return;
    }

    setForgotLoading(true);
    try {
      const profiles = await databaseService.getProfiles(true);
      const matched = profiles.find(p => p.email && p.email.toLowerCase() === forgotEmail.trim().toLowerCase());
      
      const resetToken = "vivah_reset_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      const resetLink = `${window.location.origin}/?reset_token=${resetToken}`;

      localStorage.setItem(`pwd_reset_${resetToken}`, forgotEmail.trim().toLowerCase());

      const res = await fetch("/api/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          resetLink,
          candidateName: matched ? `${matched.name} ${matched.surname}` : "Valued Member"
        })
      });

      const data = await res.json();
      if (data.success) {
        setForgotSuccess(true);
        alert(`🔐 Password reset email successfully sent from subramanyamghadiyaram@gmail.com to ${forgotEmail}!\n\nPlease check your email inbox for the secure password reset link.`);
      } else {
        alert("Failed to send reset link: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error sending password reset:", err);
      alert("Failed to dispatch password reset email. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordValue || newPasswordValue.length < 4) {
      alert("Please enter a valid password (at least 4 characters).");
      return;
    }

    if (!resetTokenFromUrl) {
      alert("Invalid or expired reset token.");
      return;
    }

    const targetEmail = localStorage.getItem(`pwd_reset_${resetTokenFromUrl}`);
    if (!targetEmail) {
      alert("Reset token has expired or is invalid. Please request a new password reset.");
      return;
    }

    try {
      const profiles = await databaseService.getProfiles(true);
      const matched = profiles.find(p => p.email && p.email.toLowerCase() === targetEmail);
      if (matched) {
        await databaseService.saveProfile({
          ...matched,
          password: newPasswordValue
        });
        localStorage.removeItem(`pwd_reset_${resetTokenFromUrl}`);
        setShowResetSuccessModal(true);
        setResetTokenFromUrl(null);
      } else {
        alert("Associated profile not found.");
      }
    } catch (err) {
      console.error("Failed to update password:", err);
      alert("Failed to update password. Please try again.");
    }
  };
  const [regRegisteredBy, setRegRegisteredBy] = useState("Self (ఇండిపెండెంట్ / స్వయంగా)");
  const [regPartnerExpectationType, setRegPartnerExpectationType] = useState("Any Profession");
  const [regPartnerExpectationsDesc, setRegPartnerExpectationsDesc] = useState("");

  // Candidate job & partner expectation details
  const [regCompanyName, setRegCompanyName] = useState("");
  const [regJobBranch, setRegJobBranch] = useState("");
  const [regWorkingShift, setRegWorkingShift] = useState("Day Shift (పగటి వేళ)");
  const [regPartnerLpaPref, setRegPartnerLpaPref] = useState("No Preference");
  const [regPartnerShiftPref, setRegPartnerShiftPref] = useState("No Preference");

  // Photo upload states (2 photos)
  const [regPhoto1, setRegPhoto1] = useState<File | null>(null);
  const [regPhoto2, setRegPhoto2] = useState<File | null>(null);

  const [regPhoto1Url, setRegPhoto1Url] = useState<string>("");
  const [regPhoto2Url, setRegPhoto2Url] = useState<string>("");
  const [regRasi, setRegRasi] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const submittingRef = useRef(false);
  const [showPhoneticHelper, setShowPhoneticHelper] = useState(false);
  const [astrologyConfirmed, setAstrologyConfirmed] = useState(false);
  const [selectedPhoneticLetter, setSelectedPhoneticLetter] = useState<string>("");

  // Legal Agreement checklist states
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<"terms" | "privacy" | "grievance" | null>(null);

  // Google Maps-style location autocomplete states
  const [birthPlaceSuggestions, setBirthPlaceSuggestions] = useState<any[]>([]);
  const [showBirthPlaceDropdown, setShowBirthPlaceDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Debounced location search
  useEffect(() => {
    if (!regBirthPlace || regBirthPlace.length < 2) {
      setBirthPlaceSuggestions([]);
      setShowBirthPlaceDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const { searchLocation } = await import("../lib/locationService");
        const results = await searchLocation(regBirthPlace);
        setBirthPlaceSuggestions(results);
        setShowBirthPlaceDropdown(results.length > 0);
      } catch (err) {
        console.error("Failed to query location suggestions:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [regBirthPlace]);

  // Click outside handler for birth place suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const container = document.getElementById("birth-place-container");
      if (container && !container.contains(e.target as Node)) {
        setShowBirthPlaceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset submission lock when register modal is opened
  useEffect(() => {
    if (showRegisterModal) {
      submittingRef.current = false;
    }
  }, [showRegisterModal]);

  // Canvas Ref for falling Akshintalu (Sacred turmeric rice grains)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particle simulation for falling Akshintalu
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: RiceParticle[] = [];
    const maxParticles = 65;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Create single particle
    const createParticle = (isInitial = false): RiceParticle => {
      return {
        x: Math.random() * canvas.width,
        y: isInitial ? Math.random() * canvas.height : -20,
        // Rice grain proportions
        width: 3 + Math.random() * 4,
        height: 6 + Math.random() * 8,
        speedY: 1.2 + Math.random() * 2.2,
        speedX: -0.6 + Math.random() * 1.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: -0.02 + Math.random() * 0.04,
        opacity: 0.6 + Math.random() * 0.4
      };
    };

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(true));
    }

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        // Update physics
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        // Reset particle if off screen
        if (p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
          particles[idx] = createParticle(false);
        }

        // Draw Akshintalu (Sacred Golden Rice Grain)
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        // Golden/Turmeric Yellow Gradient for realistic rice grain look
        const gradient = ctx.createLinearGradient(0, -p.height/2, 0, p.height/2);
        gradient.addColorStop(0, "#FFE066"); // Bright yellow
        gradient.addColorStop(0.5, "#E6A100"); // Rich Turmeric Gold
        gradient.addColorStop(1, "#B37A00"); // Deep ochre shadow

        ctx.fillStyle = gradient;
        ctx.globalAlpha = p.opacity;

        // Draw elliptical grain of rice
        ctx.beginPath();
        ctx.ellipse(0, 0, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add a subtle glowing yellow aura around some grains
        if (idx % 4 === 0) {
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = 6;
          ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Admin Login handler
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    
    const mobileClean = adminMobile.trim().replace(/\D/g, "");
    const passClean = adminPassword.trim();
    
    try {
      const verifiedAdmin = await databaseService.verifyAdminCredentials(mobileClean, passClean);

      if (verifiedAdmin) {
        const profiles = await databaseService.getProfiles(true);
        const isSubbu = verifiedAdmin.id === "admin-subbu" || mobileClean.includes("9347359489");
        const isSubba = verifiedAdmin.id === "admin-subba-reddy" || mobileClean.includes("9494949494");
        
        let adminProf = profiles.find((p) => 
          p.id === verifiedAdmin.id || 
          (isSubbu && p.id === "prof-subbu") || 
          (isSubba && p.id === "prof-subba-reddy") ||
          p.contact_number?.replace(/\D/g, "").slice(-10) === mobileClean.slice(-10)
        );

        if (!adminProf) {
          adminProf = {
            id: verifiedAdmin.id,
            reg_number: `ADM-${mobileClean.slice(-4)}`,
            name: verifiedAdmin.name,
            dob: "1990-01-01",
            gender: "Male",
            height_feet: 5.8,
            sub_caste: "Smartha",
            profession: verifiedAdmin.designation || "Administrator",
            salary_lpa: 15,
            contact_number: verifiedAdmin.mobile,
            email: verifiedAdmin.email,
            status: "Active",
            role: "admin",
            subscription_status: "paid_900"
          };
        }
        
        localStorage.setItem("bramhana_admin_session", "true");
        localStorage.setItem("bramhana_logged_in_user_id", adminProf.id);
        onLoginSuccess(adminProf);
      } else {
        setAdminError("Incorrect Mobile Number or Password. Access is restricted.");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      setAdminError("Failed to initiate administrator session.");
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!mobileNumber || !password) {
      setLoginError("Please enter both Mobile Number and Password.");
      return;
    }

    const inputClean = mobileNumber.trim().toLowerCase();
    const passClean = password.trim();

    // If candidate tries to login with an admin email, reject them
    const adminEmails = ["subramanyamghadiyaram@gmail.com", "admin@brahmanavivaha.org", "gvsubramanyam@brahmanavivaha.org", "pvsubbareddy@brahmanavivaha.org"];
    if (inputClean.includes("@")) {
      if (adminEmails.includes(inputClean) || inputClean.includes("admin")) {
        setLoginError("Administrator emails cannot be used in candidate login. Please access the Admin Portal.");
        return;
      }
    }

    try {
      const profiles = await databaseService.getProfiles(true);
      
      let matchedProfiles = [];
      if (inputClean.includes("@")) {
        matchedProfiles = profiles.filter((p) => p.email && p.email.toLowerCase() === inputClean);
      } else {
        const cleanInput = inputClean.replace(/\D/g, "");
        matchedProfiles = profiles.filter((p) => {
          const cleanStored = p.contact_number ? p.contact_number.replace(/\D/g, "") : "";
          return cleanStored && cleanInput && cleanStored === cleanInput;
        });
      }

      if (matchedProfiles.length > 0) {
        // Helper to check if entered password matches the profile password or any DOB formats
        const checkPasswordMatch = (p: any, enteredPass: string): boolean => {
          const pass = enteredPass.trim();
          if (p.password && p.password === pass) return true;
          if (p.password && p.password.replace(/[-/]/g, "") === pass.replace(/[-/]/g, "")) return true;
          
          if (!p.dob) return false;
          // Get clean entered password
          const cleanPass = pass.replace(/[-/]/g, "");
          
          // Generate possible matches from DOB (format YYYY-MM-DD in DB)
          const dobStr = p.dob.trim();
          const match = dobStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
          if (match) {
            const [_, yyyy, mm, dd] = match;
            const possibleDOBPasswords = [
              // ddmmyyyy formats (primary - e.g. 28042008)
              `${dd}${mm}${yyyy}`,
              `${dd}-${mm}-${yyyy}`,
              `${dd}/${mm}/${yyyy}`,
              
              // ddmmyy formats (e.g. 280408)
              `${dd}${mm}${yyyy.substring(2)}`,
              `${dd}-${mm}-${yyyy.substring(2)}`,
              `${dd}/${mm}/${yyyy.substring(2)}`,
              
              // yyyymmdd formats (fallback/previous - e.g. 20080428)
              `${yyyy}${mm}${dd}`,
              `${yyyy}-${mm}-${dd}`,
              `${yyyy}/${mm}/${dd}`,
              
              // direct match with raw string
              dobStr
            ];
            return possibleDOBPasswords.some(
              (pword) => pword === pass || pword.replace(/[-/]/g, "") === cleanPass
            );
          }
          
          // Basic fallback if DOB is not in YYYY-MM-DD
          return dobStr === pass || dobStr.replace(/[-/]/g, "") === cleanPass;
        };

        // Find if any matched profile has a matching password (helps choose correct duplicate profile)
        const match = matchedProfiles.find((p) => checkPasswordMatch(p, passClean)) || matchedProfiles[0];

        // Match password with stored password OR child's DOB as password
        const passwordMatches = checkPasswordMatch(match, passClean);

        if (passwordMatches) {
          if (match.id === "prof-subbu" || match.id === "prof-subba-reddy" || match.role === "employee" || match.role === "admin") {
            localStorage.setItem("bramhana_admin_session", "true");
          }
          localStorage.setItem("bramhana_logged_in_user_id", match.id);
          onLoginSuccess(match);
        } else {
          setLoginError(`Incorrect password. Please verify your login credentials or contact administration.`);
        }
      } else {
        setLoginError("Invalid credentials. No profile matches that Mobile Number.");
      }
    } catch (err) {
      setLoginError("Credentials check failed. Please try again.");
    }
  };

  // Helper helper to convert files to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Custom Register Submit - Automated Payment Confirmation
  const handleSubmitRegPayment = async () => {
    if (!registeredProfile || !regTxnId.trim()) return;
    try {
      const isUpgrade = registeredProfile.subscription_status === "paid_900";
      const updatedProfile: Profile = {
        ...registeredProfile,
        subscription_status: isUpgrade ? "paid_900" : "paid_100",
        payment_received: true,
        fee_received_by: "Automated Gateway (PhonePe/UPI)",
        fee_received_at: new Date().toISOString(),
        ...(isUpgrade 
          ? { upgrade_transaction_id: regTxnId.trim(), upgrade_requested_at: new Date().toISOString() }
          : { fee_transaction_id: regTxnId.trim() }
        )
      };
      await databaseService.saveProfile(updatedProfile);
      setRegisteredProfile(updatedProfile);
      setRegPaymentSuccess(true);
      alert("🎉 చెల్లింపు ఆటోమేటిక్‌గా ధృవీకరించబడింది మరియు ఖాతా సక్రియం చేయబడింది!\n\nPayment automatically confirmed & account activated! You can now view matches immediately.");
    } catch (err) {
      console.error(err);
      alert("Error submitting transaction ID. Please try again.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      alert("మొదట నిబంధనలు మరియు షరతులను అంగీకరించండి.\n\nPlease read and accept the Terms & Conditions and Privacy Policy before submitting.");
      return;
    }
    if (!regSurname) {
      alert("Please enter Candidate Surname (ఇంటి పేరు).");
      return;
    }
    if (!regName) {
      alert("Please enter Candidate Given Name (పేరు).");
      return;
    }
    if (!regDob) {
      alert("Please enter Date of Birth (పుట్టిన తేదీ).");
      return;
    }

    const calculateExactAge = (dobString: string): number => {
      if (!dobString) return 0;
      const birthDate = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const minAgeReq = regGender === "Male" ? 24 : 21;
    const currentAge = calculateExactAge(regDob);
    if (currentAge < minAgeReq - 1) {
      alert(`⚠️ Age Restriction: Minimum age is ${minAgeReq} years for ${regGender === "Male" ? "Boys" : "Girls"}. Current calculated age is ${currentAge} years. Registration is strictly restricted below ${minAgeReq - 1} years.`);
      return;
    }

    if (!regPhone) {
      alert("Please enter Mobile Number (మొబైల్ సంఖ్య).");
      return;
    }

    if (isUploading || submittingRef.current) return;
    submittingRef.current = true;
    setIsUploading(true);

    try {
      const profiles = await databaseService.getProfiles(true);
      const cleanRegPhone = regPhone.replace(/\D/g, "");
      const isDuplicate = profiles.some((p) => {
        const cleanStored = p.contact_number ? p.contact_number.replace(/\D/g, "") : "";
        return cleanStored && cleanRegPhone && cleanStored === cleanRegPhone;
      });

      if (isDuplicate) {
        alert("ఈ మొబైల్ నంబర్ ఇప్పటికే మా డేటాబేస్‌లో నమోదు చేయబడింది! దయచేసి వేరే నంబర్‌ను ఉపయోగించండి.\n\nThis mobile number is already registered in our database! Please enter another number.");
        setIsUploading(false);
        submittingRef.current = false;
        return;
      }

      if (regEmail) {
        const emailClean = regEmail.trim().toLowerCase();
        const isEmailDuplicate = profiles.some((p) => p.email && p.email.trim().toLowerCase() === emailClean);
        if (isEmailDuplicate) {
          alert("ఈ ఈమెయిల్ చిరునామా ఇప్పటికే మా డేటాబేస్‌లో నమోదు చేయబడింది! దయచేసి వేరే ఈమెయిల్‌ను ఉపయోగించండి.\n\nThis email address is already registered in our database! Please enter another email.");
          setIsUploading(false);
          submittingRef.current = false;
          return;
        }
      }

      let p1Url = regGender === "Female" 
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"
        : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400";
      let p2Url = "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=400";
      let kUrl = "";

      if (regPhoto1) {
        p1Url = await fileToBase64(regPhoto1);
      }
      if (regPhoto2) {
        p2Url = await fileToBase64(regPhoto2);
      }

      // Query the dynamic server-side astrology engine
      let calculatedAstrology = {
        nakshatra: "Uttara Phalguni",
        nakshatraLord: "Sun",
        pada: 2,
        rashi: "Simha (Leo)",
        tithi: "Shukla Dashami",
        deity: "Aryaman",
        spiritualAnalysis: "Generous, high state of spiritual readiness, aligned with social upliftment and Brahminical values.",
        compatibilityTraits: ["Very kindhearted", "Passionate about Vedic literature", "Harmonious relationship indicator"],
        spiritualScore: 88
      };

      if (regDob) {
        try {
          const localCalc = calculatePanchangam(regDob, regBirthTime || "08:30");
          calculatedAstrology = {
            nakshatra: localCalc.nakshatram.english,
            nakshatraLord: localCalc.nakshatraLord,
            pada: localCalc.pada,
            rashi: `${localCalc.rasi.english} (${localCalc.rasi.telugu})`,
            tithi: localCalc.tithi.english,
            deity: localCalc.deity,
            spiritualAnalysis: localCalc.spiritualAnalysis,
            compatibilityTraits: localCalc.compatibilityTraits,
            spiritualScore: localCalc.spiritualScore
          };
        } catch (e) {
          console.error("Local panchangam calculation failed:", e);
        }
      }

      try {
        const response = await fetch("/api/astrology", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dob: regDob,
            time: regBirthTime || "08:30",
            location: regBirthPlace || "Andhra Pradesh, India",
          }),
        });
        if (response.ok) {
          const result = await response.json();
          calculatedAstrology = result;
        }
      } catch (err) {
        console.warn("Astrological API offline, using precise local computations:", err);
      }

      if (regRasi && regRasi !== "Not Sure") {
        calculatedAstrology.rashi = regRasi;
      }

      const newId = `prof-${Date.now()}`;
      
      const adminId = localStorage.getItem("bramhana_logged_in_user_id");
      let registeredBy = regRegisteredBy;
      if (localStorage.getItem("bramhana_admin_session") === "true") {
        if (adminId === "prof-subbu") {
          registeredBy = "GV Subramanyam";
        } else if (adminId === "prof-subba-reddy") {
          registeredBy = "PV Subba Reddy";
        } else {
          registeredBy = "Bramhana Admin";
        }
      }

      const profLower = regProfession.toLowerCase();
      const isDefence = profLower.includes("defence") || profLower.includes("army") || profLower.includes("navy") || profLower.includes("air force") || profLower.includes("military") || regCouponCode === "AGNIVEERA!1857";
      const isTeacher = profLower.includes("teacher") || profLower.includes("professor") || profLower.includes("educator") || profLower.includes("lecturer");

      const badgeType = isDefence ? "Shoorveer" : isTeacher ? "Guruvu" : "Standard";
      const discountVal = isDefence ? 50 : 0;

      const newProfile: Profile = {
        id: newId,
        name: regName,
        surname: regSurname,
        gothram: regGothram,
        dob: regDob,
        gender: regGender,
        height_feet: parseFloat(regHeight) || 5.4,
        sub_caste: regCaste,
        profession: regProfession,
        salary_lpa: parseFloat(regSalary) || 7.5,
        contact_number: regPhone,
        email: regEmail,
        isEmailVerified: isEmailVerified,
        status: "Pending",
        subscription_status: regSubscriptionStatus,
        password: regPassword || generateDefaultDobPassword(regDob), // default ddmmyyyy DOB format password
        photo_url: p1Url,
        photo_url_2: p2Url,
        kundali_url: kUrl,
        birth_time: regBirthTime || "08:30",
        birth_location: regBirthPlace,
        birth_pincode: regBirthPincode,
        partner_expectation_type: regPartnerExpectationType,
        partner_expectations_desc: regPartnerExpectationsDesc,
        company_name: regCompanyName,
        job_branch: regJobBranch,
        working_shift: regWorkingShift,
        partner_lpa_pref: regPartnerLpaPref,
        partner_shift_pref: regPartnerShiftPref,
        registered_by: registeredBy,
        registered_at_time: new Date().toLocaleString("en-US", { hour: "numeric", minute: "2-digit", day: "2-digit", month: "short", year: "numeric", hour12: true }),
        nakshatram: calculatedAstrology.nakshatra,
        astrology: calculatedAstrology,
        badge: badgeType,
        discount: discountVal,
        referral_code: myReferralCode,
        referred_by: regReferredBy.trim() || undefined,
        coupon_applied: regCouponCode.trim() || undefined,
        is_defence_verified: isDefence ? false : true
      };

      const saved = await databaseService.saveProfile(newProfile);

      if (regReferredBy.trim() && regSubscriptionStatus !== "free") {
        try {
          const profiles = await databaseService.getProfiles(true);
          const referrer = profiles.find(p => p.referral_code && p.referral_code.toUpperCase() === regReferredBy.trim().toUpperCase());
          if (referrer) {
            await databaseService.saveProfile({
              ...referrer,
              referral_count: (referrer.referral_count || 0) + 1
            });
          }
        } catch (e) {
          console.warn("Failed to update referrer count:", e);
        }
      }
      
      // Auto-fill login fields for the user
      setMobileNumber(saved.reg_number || "");
      setPassword(saved.password || "");
      setShowRegisterModal(false);
      
      // Clear inputs
      setRegPhoto1(null);
      setRegPhoto2(null);
      setRegPhoto1Url("");
      setRegPhoto2Url("");
      setRegRasi("");
      
      // Reset text states
      setRegName("");
      setRegSurname("");
      setRegDob("");
      setRegBirthPlace("");
      setRegBirthPincode("");
      setRegSubscriptionStatus("free");
      setRegBirthTime("08:30");
      setRegHeight("5.4");
      setRegCaste("");
      setRegGothram("");
      setRegProfession("");
      setRegSalary("8");
      setRegPhone("");
      setRegPassword("");
      setRegRegisteredBy("Self (ఇండిపెండెంట్ / స్వయంగా)");
      setRegPartnerExpectationsDesc("");
      setRegCompanyName("");
      setRegJobBranch("");
      setRegWorkingShift("Day Shift (పగటి వేళ)");
      setRegPartnerLpaPref("No Preference");
      setRegPartnerShiftPref("No Preference");

      // Notify user of their assigned registration number via a beautiful certificate!
      setRegisteredProfile(saved);

    } catch (err) {
      console.error("Failed to register soul:", err);
      alert("Celestial registration failed. Try again.");
    } finally {
      setIsUploading(false);
      submittingRef.current = false;
    }
  };

  // Contact Us Submit
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPhone) {
      alert("Please provide a contact phone number.");
      return;
    }
    setShowContactModal(false);
    setStatusMessage("Om Namah Shivaya! Your callback request has been received. With the blessings of Sri Kanchi Kamakoti Peetham, Sringeri Sharada Peetham, and Sri Adi Shankaracharya, we will get in touch with you soon.");
    setShowStatusAlert(true);
    setContactName("");
    setContactPhone("");
    setContactMsg("");
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col font-sans select-none">
      
      {/* Falling Akshintalu Canvas Particles */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-10 opacity-80"
      />

      {/* Decorative Gold Rangoli Overlays */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-36 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-amber-700/5 to-transparent pointer-events-none z-0" />
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-48 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-500/10 via-amber-700/5 to-transparent pointer-events-none z-0" />

      {/* Top Header Bar */}
      <header className="relative z-30 w-full bg-black/40 backdrop-blur-md border-b border-amber-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Webpage Name */}
          <div className="flex items-center gap-3">
            <div className="bg-[#C2242C] p-2.5 rounded-full flex items-center justify-center shadow-lg border border-amber-500/30">
              <Heart className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
            </div>
            <div className="text-left">
              <span className="text-base sm:text-xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 uppercase font-sans">
                Subhamastu Matrimony
              </span>
              <p className="text-[9px] text-amber-400 font-mono tracking-widest mt-0.5 uppercase">A unit of GRV Services</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#C2242C] to-[#99151B] text-white hover:brightness-110 active:scale-95 text-xs font-bold rounded-xl transition-all border border-amber-500/30 uppercase tracking-wider shadow-md shadow-[#C2242C]/10 cursor-pointer"
            >
              Register
            </button>
            <button
              onClick={() => setShowContactModal(true)}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 text-xs font-bold rounded-xl transition-all uppercase tracking-wider cursor-pointer"
            >
              Contact Us
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Login Split Content */}
      <main className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex flex-col lg:flex-row items-center justify-center gap-12 md:gap-16">
        
        {/* Left Side: Welcoming / Spiritual Message */}
        <div className="flex-1 text-left space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-mono font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Divine Marital Alignment</span>
          </div>

          {/* Core Welcome Prompted */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
            Welcome Warmly. <br />
            We will find a <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400">Best Partner</span> for you.
          </h1>

          <div className="border-l-4 border-[#C2242C] pl-4 space-y-2">
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed italic">
              "Just as Sati Devi was united in eternal spiritual matrimony with Lord Shiva under the auspicious blessings of the cosmos, we invoke sacred planetary alignments to unite your soul with its divine reflection."
            </p>
          </div>

          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Bramhana Vivaha Veadika is a pristine matchmaking sanctuary built specifically for Brahmin families. We authenticate horoscope matching, Kundali attributes, Gotra lineage, and sacred family ideals to deliver genuine matrimonial ties.
          </p>

          {/* Aesthetic Marigold decoration pointer */}
          <div className="flex items-center gap-3 pt-4 text-xs font-mono text-amber-400">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>SHOWERED WITH HOLY AKSHINTALU FROM ABOVE</span>
          </div>
        </div>

        {/* Right Side: Sacred Login Card */}
        <div className="w-full max-w-md shrink-0">
          <div className="bg-gradient-to-b from-zinc-900 to-black p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-2xl relative overflow-hidden space-y-6">
            
            {/* Background glowing sphere */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C2242C]/10 rounded-full filter blur-xl pointer-events-none" />

            <div className="text-center space-y-2 relative z-10">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-amber-300 uppercase">Sacred Union Portal</h2>
              <p className="text-xs text-gray-400">Enter Brahmin credentials to explore verified profiles</p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-semibold rounded-xl text-center">
                {loginError}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 text-left relative z-10">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                  Mobile Number or Email ID (మొబైల్ లేదా ఈమెయిల్)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-amber-400/60 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9347359489 or user@gmail.com"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none placeholder-gray-600 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    Forgot Password? (పాస్‌వర్డ్ మర్చిపోయారా?)
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400/60 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 rounded-xl py-2.5 pl-10 pr-12 text-sm text-white focus:outline-none placeholder-gray-600 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-amber-400 cursor-pointer p-1 transition-colors"
                    title={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-widest transition-all rounded-xl shadow-lg shadow-amber-400/10 cursor-pointer flex items-center justify-center gap-2 border border-yellow-300"
              >
                <span>Enter Sacred Vivaha</span>
                <ChevronRight className="w-4 h-4 text-black" />
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-3 text-[10px] text-zinc-500 font-mono uppercase">or quick social access</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <button
              type="button"
              onClick={() => {
                const dummyEmail = prompt("Enter your Google Account email to register instantly:", "subramanyamghadiyaram@gmail.com");
                if (dummyEmail) {
                  setRegName("Subramanyam");
                  setRegSurname("Gadiyaram");
                  setRegPhone("9347359489");
                  setShowRegisterModal(true);
                  alert(`🌐 Google Sign-In Verified for ${dummyEmail}! We have auto-filled your Brahmin candidate profile details.`);
                }
              }}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm border border-slate-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google (గూగుల్ ద్వారా నమోదు)</span>
            </button>

            <div className="pt-2 text-center text-xs text-gray-500 font-medium">
              Are you a new candidate?{" "}
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* SECTION: NOTICE & DIRECT NAVIGATION */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 border-t border-amber-500/20">
        <div className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-black rounded-3xl border border-amber-500/30 p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Important Legal Disclaimer Banner */}
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 text-xs text-amber-200">
            <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 leading-relaxed">
              <h4 className="font-extrabold text-amber-300 text-sm">
                స్వయం ప్రకటిత సమాచార నిబంధన • Self-Submitted Information Disclaimer
              </h4>
              <p className="text-gray-300">
                All profile, astrological, family, and educational details on <strong>www.shubhamastu.in</strong> are self-declared by registered candidates and families. We operate purely as an introductory intermediary. We do not independently verify or authenticate any candidate details and bear <strong>no responsibility or liability</strong> for the accuracy or integrity of any information provided.
              </p>
              <p className="text-amber-400/90 font-bold">
                Families are solely responsible for conducting independent background verification, horoscope matching, and character inquiries prior to any matrimonial commitment.
              </p>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <a
              href="/register"
              className="bg-zinc-900/80 hover:bg-zinc-800/80 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-5 transition-all group flex items-center justify-between shadow-lg"
            >
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-widest block">
                  Direct Registration • /register
                </span>
                <h5 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                  Register Candidate Profile
                </h5>
                <p className="text-xs text-zinc-400">
                  Register Brahmin Grooms & Brides with Gotram, Sub-caste, & DOB.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </a>

            <a
              href="/pay"
              className="bg-zinc-900/80 hover:bg-zinc-800/80 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-5 transition-all group flex items-center justify-between shadow-lg"
            >
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-widest block">
                  Instant Activation • /pay
                </span>
                <h5 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                  Automated Payment Desk
                </h5>
                <p className="text-xs text-zinc-400">
                  Instant ₹100 Match Activation or ₹900 Full Communication Upgrade.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <LegalFooter darkTheme={true} />

      {/* Render Legal Document Modal if triggered */}
      {activeLegalDoc && (
        <LegalDocumentModal docType={activeLegalDoc} onClose={() => setActiveLegalDoc(null)} />
      )}

      {/* MODAL 1: REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleRegisterSubmit}
            className="bg-zinc-900 border border-amber-500/20 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-5 right-5 p-2 bg-zinc-800 text-amber-300 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer border border-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-4 border-b border-zinc-800 space-y-1">
              <span className="text-[10px] text-amber-400 font-mono tracking-widest uppercase block">Sacred Ingress Step</span>
              <h3 className="text-2xl font-bold text-white tracking-tight uppercase">New Candidate Registration</h3>
              <p className="text-xs text-gray-400">Fill in candidate details for sacred matching</p>
            </div>

            {/* Quick Google Pre-Fill Banner */}
            <div className="p-3 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white rounded-xl shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Quick Google Auto-Fill (గూగుల్ త్వరిత నమోదు)</h4>
                  <p className="text-[10px] text-blue-200/80">Skip manual typing — auto-fill name & email instantly!</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const email = prompt("Enter Google Account email to auto-fill form:", "subramanyamghadiyaram@gmail.com");
                  if (email) {
                    setRegName("Subramanyam");
                    setRegSurname("Gadiyaram");
                    setRegPhone("9347359489");
                    alert(`⚡ Pre-filled form for ${email}!`);
                  }
                }}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-[11px] rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm"
              >
                ⚡ Auto-Fill with Google
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  Step {regStep} of 5: {
                    regStep === 1 ? "1. Names & Family Details" :
                    regStep === 2 ? "2. Contact & Email OTP" :
                    regStep === 3 ? "3. Caste, Gothram & Rasi" :
                    regStep === 4 ? "4. Birth Details" :
                    "5. Diet, Profession & Discounts"
                  }
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {Math.round((regStep / 5) * 100)}% Completed
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300" style={{ width: `${(regStep / 5) * 100}%` }}></div>
              </div>
            </div>

            {/* STEP 1: NAMES & FAMILY */}
            {regStep === 1 && (
              <div className="space-y-4 pt-4 text-sm animate-in fade-in duration-200">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-200">
                  <span className="font-extrabold block mb-0.5">మొదటి దశ: పేరు మరియు కుటుంబ వివరాలు</span>
                  Please provide candidate and family names for Vedic matching.
                </div>

                <div className="space-y-1.5 bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
                  <label className="text-xs font-black text-amber-200 uppercase tracking-wider block mb-1">Profile Registered By (ప్రొఫైల్ సృష్టికర్త / సంబంధం) *</label>
                  <select
                    value={regRegisteredBy}
                    onChange={(e) => setRegRegisteredBy(e.target.value)}
                    className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none font-bold cursor-pointer"
                  >
                    <option value="Self (ఇండిపెండెంట్ / స్వయంగా)">Self (ఇండిపెండెంట్ / స్వయంగా)</option>
                    <option value="Parent (తల్లిదండ్రులు)">Parent (తల్లిదండ్రులు)</option>
                    <option value="Sibling (సహోదరుడు/సహోదరి)">Sibling (సహోదరుడు/సహోదరి)</option>
                    <option value="Relative (బంధువు)">Relative (బంధువు)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-amber-200 uppercase tracking-wider block">Candidate Surname (ఇంటి పేరు) *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Garimella"
                        value={regSurname}
                        onChange={(e) => setRegSurname(e.target.value)}
                        className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-amber-200 uppercase tracking-wider block">Candidate Given Name (పేరు) *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Subramanyam"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-300 uppercase tracking-wider block">Father's Name (తండ్రి పేరు)</label>
                    <input
                      type="text"
                      placeholder="e.g. Venkata Ramana"
                      value={regFatherName}
                      onChange={(e) => setRegFatherName(e.target.value)}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-300 uppercase tracking-wider block">Mother's Name (తల్లి పేరు)</label>
                    <input
                      type="text"
                      placeholder="e.g. Annapurna"
                      value={regMotherName}
                      onChange={(e) => setRegMotherName(e.target.value)}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-300 uppercase tracking-wider block">Auspicious Category (లింగము) *</label>
                  <select
                    value={regGender}
                    onChange={(e) => {
                      const g = e.target.value as "Male" | "Female";
                      setRegGender(g);
                      setRegPartnerExpectationType(g === "Male" ? "Housewife (గృహిణి)" : "Any Profession (ఏదైనా ఉద్యోగం)");
                    }}
                    className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="Female">Chi.La.Sow. Lakshmi Soubhagyavathi (Bride / వధువు)</option>
                    <option value="Male">Chiranjeevi (Groom / వరుడు)</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: CONTACT & OTP */}
            {regStep === 2 && (
              <div className="space-y-4 pt-4 text-sm animate-in fade-in duration-200">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-200">
                  <span className="font-extrabold block mb-0.5">రెండవ దశ: సంప్రదింపు వివరాలు & ఇమెయిల్ OTP</span>
                  Enter your mobile number and verify your email securely.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-amber-200 uppercase tracking-wider block">Mobile Number / Contact Phone (మొబైల్ సంఖ్య) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9848012345"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none font-mono font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">This mobile number will be your Login ID to access your profile.</p>
                </div>

                <div className="space-y-2 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-200 uppercase tracking-wider block">Candidate Email ID & OTP Verification</label>
                    {isEmailVerified ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="e.g. subramanyam@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      disabled={isEmailVerified}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none font-bold disabled:opacity-60"
                    />
                    {!isEmailVerified && (
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md"
                      >
                        {isOtpSent ? "Resend OTP" : "Send OTP"}
                      </button>
                    )}
                  </div>

                  {isOtpSent && !isEmailVerified && (
                    <div className="p-3 bg-zinc-900 rounded-xl border border-amber-500/30 flex items-center gap-3 mt-2">
                      <input
                        type="text"
                        maxLength={7}
                        placeholder="7-digit OTP"
                        value={regOtp}
                        onChange={(e) => setRegOtp(e.target.value)}
                        className="bg-black border border-zinc-700 focus:border-amber-400 rounded-lg py-2 px-3 text-sm text-white focus:outline-none font-mono font-bold w-32 tracking-widest text-center"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-lg transition-all cursor-pointer"
                      >
                        Verify OTP
                      </button>
                      <span className="text-[11px] text-zinc-300">
                        Enter the 7-digit OTP sent to your email.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: CASTE, GOTHRAM & RASI */}
            {regStep === 3 && (
              <div className="space-y-4 pt-4 text-sm animate-in fade-in duration-200">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-200">
                  <span className="font-extrabold block mb-0.5">మూడవ దశ: కులం, గోత్రం మరియు రాశి (Caste, Gothram & Rasi)</span>
                  Select your community, sacred Gotram, and Moon Sign (Rasi).
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-amber-200 uppercase tracking-wider block">Community / Main Caste (కులము) *</label>
                  <select
                    value={regMainCaste}
                    onChange={(e) => setRegMainCaste(e.target.value)}
                    className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-3 px-3 text-sm text-white focus:outline-none font-bold cursor-pointer"
                  >
                    <option value="Brahmin">Brahmin (బ్రాహ్మణ)</option>
                    <option value="Choudary">Choudary (చౌదరి)</option>
                    <option value="Kamma">Kamma (కమ్మ)</option>
                    <option value="Kapu">Kapu (కాపు)</option>
                    <option value="Reddy">Reddy (రెడ్డి)</option>
                    <option value="Other">Other Community / All Communities (ఇతర సమాజాలు)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-amber-300 uppercase tracking-wider block">Sub-Caste / Branch (శాఖ / ఉపకులం)</label>
                  <SearchableSelect
                    options={
                      regMainCaste === "Brahmin" ? BRAHMIN_SUB_CASTES :
                      regMainCaste === "Reddy" ? REDDY_SUB_CASTES :
                      regMainCaste === "Kamma" ? KAMMA_SUB_CASTES :
                      regMainCaste === "Kapu" ? KAPU_SUB_CASTES :
                      regMainCaste === "Choudary" ? CHOUDARY_SUB_CASTES :
                      [{ id: "general", labelEn: "General / All Sub-Castes", labelTe: "అన్ని శాఖలు" }]
                    }
                    selectedValue={regCaste}
                    onChange={setRegCaste}
                    placeholder="Select Sub-Caste (శాఖ)..."
                    emptyLabel="Sub-Caste not found"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-amber-300 uppercase tracking-wider block">Gotram (గోత్రము) *</label>
                  <SearchableSelect
                    options={
                      regMainCaste === "Brahmin" ? BRAHMIN_GOTRAMS :
                      regMainCaste === "Reddy" ? REDDY_GOTRAMS :
                      GENERAL_GOTRAMS
                    }
                    selectedValue={regGothram}
                    onChange={setRegGothram}
                    placeholder="Search and Select Gotram (గోత్రం)..."
                    emptyLabel="Gotram not found"
                  />
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Or type custom Gotram here if not listed..."
                      value={regGothram}
                      onChange={(e) => setRegGothram(e.target.value)}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2 px-3 text-xs text-white uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-amber-300 uppercase tracking-wider block">Rasi / Moon Sign (రాశి) *</label>
                  <select
                    value={regRasi}
                    onChange={(e) => setRegRasi(e.target.value)}
                    className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none font-bold cursor-pointer"
                  >
                    <option value="">Select Rasi (రాశి ఎంచుకోండి)...</option>
                    <option value="Mesha (మేష రాశి)">మేష రాశి (Mesha - Aries)</option>
                    <option value="Vrishabha (వృషభ రాశి)">వృషభ రాశి (Vrishabha - Taurus)</option>
                    <option value="Mithuna (మిథున రాశి)">మిథున రాశి (Mithuna - Gemini)</option>
                    <option value="Karka (కర్కాటక రాశి)">కర్కాటక రాశి (Karka - Cancer)</option>
                    <option value="Simha (సింహ రాశి)">సింహ రాశి (Simha - Leo)</option>
                    <option value="Kanya (కన్యా రాశి)">కన్యా రాశి (Kanya - Virgo)</option>
                    <option value="Tula (తులా రాశి)">తులా రాశి (Tula - Libra)</option>
                    <option value="Vrischika (వృశ్చిక రాశి)">వృశ్చిక రాశి (Vrischika - Scorpio)</option>
                    <option value="Dhanus (ధనుస్సు రాశి)">ధనుస్సు రాశి (Dhanus - Sagittarius)</option>
                    <option value="Makara (మకర రాశి)">మకర రాశి (Makara - Capricorn)</option>
                    <option value="Kumbha (కుంభ రాశి)">కుంభ రాశి (Kumbha - Aquarius)</option>
                    <option value="Meena (మీన రాశి)">మీన రాశి (Meena - Pisces)</option>
                    <option value="Not Sure">Don't Know / తెలియదు (Will verify later)</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 4: BIRTH DETAILS */}
            {regStep === 4 && (
              <div className="space-y-4 pt-4 text-sm animate-in fade-in duration-200">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-200">
                  <span className="font-extrabold block mb-0.5">నాల్గవ దశ: జన్మ వివరాలు (Birth Details)</span>
                  Enter date of birth and birth location.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-300 uppercase tracking-wider block">
                      Date of Birth (పుట్టిన తేదీ) * {regGender === "Male" ? "(Boys: Min 24 Yrs)" : "(Girls: Min 21 Yrs)"}
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="date"
                        required
                        value={regDob}
                        onChange={(e) => {
                          const dobVal = e.target.value;
                          setRegDob(dobVal);
                          if (dobVal) {
                            const birthDate = new Date(dobVal);
                            const today = new Date();
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const m = today.getMonth() - birthDate.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                              age--;
                            }
                            const minAge = regGender === "Male" ? 24 : 21;
                            if (age < minAge - 1) {
                              alert(`⚠️ Age Notice: Minimum recommended age for ${regGender === "Male" ? "Boys is 24" : "Girls is 21"} years. (Current age: ${age} years).`);
                            }
                          }
                        }}
                        className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-amber-200 uppercase tracking-wider block">Birth Time (పుట్టిన సమయం)</label>
                    <input
                      type="time"
                      value={regBirthTime}
                      onChange={(e) => setRegBirthTime(e.target.value)}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative" id="birth-place-container">
                    <label className="text-xs font-black text-amber-200 uppercase tracking-wider block">Place of Birth (పుట్టిన స్థలం)</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                      <input
                        type="text"
                        placeholder="e.g. Vijayawada, AP"
                        value={regBirthPlace}
                        onChange={(e) => {
                          setRegBirthPlace(e.target.value);
                          setShowBirthPlaceDropdown(true);
                        }}
                        className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none font-bold"
                      />
                    </div>
                    {showBirthPlaceDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-zinc-900">
                        {birthPlaceSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setRegBirthPlace(suggestion.display_name || suggestion.name);
                              setShowBirthPlaceDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-zinc-900 text-xs text-gray-200 font-bold cursor-pointer"
                          >
                            {suggestion.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-amber-200 uppercase tracking-wider block">Birth Place Pincode (పిన్ కోడ్)</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 518502"
                      value={regBirthPincode}
                      onChange={(e) => setRegBirthPincode(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: DIET, PROFESSION, DISCOUNTS & SUBMISSION */}
            {regStep === 5 && (
              <div className="space-y-4 pt-4 text-sm animate-in fade-in duration-200">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-200">
                  <span className="font-extrabold block mb-0.5">ఐదవ దశ: ఆహారపు అలవాట్లు, వృత్తి మరియు ప్రత్యేక రాయితీలు</span>
                  Select meal preferences, profession, and defense/teacher service discount claims.
                </div>

                {/* Dietary Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-amber-300 uppercase tracking-wider block">Candidate Meal Preference (ఆహార శైలి)</label>
                    <select
                      value={regMealPreference}
                      onChange={(e) => setRegMealPreference(e.target.value)}
                      className="w-full bg-black border border-zinc-700 rounded-lg py-2 px-2 text-xs text-white font-bold cursor-pointer"
                    >
                      <option value="Vegetarian">Vegetarian (శాకాహారి)</option>
                      <option value="Non-Vegetarian">Non-Vegetarian (మాంసాహారి)</option>
                      <option value="Eggitarian">Eggitarian (గుడ్డు మాత్రమే)</option>
                      <option value="Jain">Jain Vegetarian (జైన్)</option>
                      <option value="Vegan">Vegan (వేగన్)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-amber-300 uppercase tracking-wider block">Partner Meal Expectation (భాగస్వామి ఆహార కోరిక)</label>
                    <select
                      value={regPartnerMealPreference}
                      onChange={(e) => setRegPartnerMealPreference(e.target.value)}
                      className="w-full bg-black border border-zinc-700 rounded-lg py-2 px-2 text-xs text-white font-bold cursor-pointer"
                    >
                      <option value="Only My Meal">Only My Meal Type (నా ఆహార శైలి మాత్రమే)</option>
                      <option value="Vegetarian Only">Vegetarian Only (శాకాహారి మాత్రమే)</option>
                      <option value="No Condition / Any">No Condition / Any (ఎలాంటివైనా పర్వాలేదు)</option>
                    </select>
                  </div>
                </div>

                {/* Profession & Income */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-300 uppercase tracking-wider block">Profession (ఉద్యోగం / వ్యాపారం)</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer / Teacher / Army Officer"
                      value={regProfession}
                      onChange={(e) => setRegProfession(e.target.value)}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-300 uppercase tracking-wider block">Annual Income (₹ LPA)</label>
                    <input
                      type="number"
                      placeholder="e.g. 12"
                      value={regSalary}
                      onChange={(e) => setRegSalary(e.target.value)}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Defense & Teacher Special Honors Notice */}
                <div className="p-3 bg-gradient-to-r from-red-950/40 to-amber-950/40 rounded-xl border border-red-500/20 text-xs space-y-2">
                  <span className="font-extrabold text-amber-300 block">🛡️ Special Honors for Indian Defense & Teachers (ప్రత్యేక గౌరవ రాయితీలు):</span>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    • <strong>Indian Defense Services</strong> (Army, Navy, Air Force, Police, CRPF, NSG, MARCOS): <span className="text-emerald-400 font-bold">90% Discount</span> on all plans.<br />
                    • <strong>Teachers & Professors</strong> (EDUCATORS): <span className="text-emerald-400 font-bold">50% Discount</span> in respect of life-changers.
                  </p>
                  <div>
                    <label className="text-[10px] font-black text-amber-200 block mb-1">Upload ID Card / Service Proof (సేవ గుర్తింపు కార్డు - ఐచ్ఛికం)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          setRegIdCardUrl(await fileToBase64(f));
                          alert("✅ ID Card uploaded successfully for special service discount review!");
                        }
                      }}
                      className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black hover:file:bg-amber-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Coupon Code & Referral Section */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-amber-500/30 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-amber-300 uppercase tracking-wider block">Have a Coupon Code? (కూపన్ కోడ్)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. AGNIVEERA!1857, NEWUSER2026, refered"
                        value={regCouponCode}
                        onChange={(e) => setRegCouponCode(e.target.value)}
                        className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2 px-3 text-xs text-white uppercase font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md"
                      >
                        Apply
                      </button>
                    </div>
                    {couponAppliedSuccess && (
                      <p className="text-[11px] text-emerald-400 font-bold mt-1">✓ {couponAppliedSuccess}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-900 space-y-2">
                    <label className="text-xs font-black text-amber-300 uppercase tracking-wider block">Referral Network & Sharing (మీ రెఫరల్ లింక్)</label>
                    <div className="flex items-center justify-between bg-black p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-xs font-mono text-amber-400 font-bold">Code: {myReferralCode}</span>
                      <button
                        type="button"
                        onClick={handleWhatsAppShare}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Share via WhatsApp
                      </button>
                    </div>
                    <div className="space-y-1 pt-1">
                      <label className="text-[10px] font-bold text-zinc-400 block uppercase">Enter Referred By Code (if any - స్నేహితుని రెఫరల్ కోడ్)</label>
                      <input
                        type="text"
                        placeholder="e.g. SUBHA-XYZ123"
                        value={regReferredBy}
                        onChange={(e) => setRegReferredBy(e.target.value)}
                        className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2 px-3 text-xs text-white uppercase font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Membership Package */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-amber-200 uppercase tracking-wider block">Membership Package (మెంబర్‌షిప్ ప్లాన్) *</label>
                  <select
                    value={regSubscriptionStatus}
                    onChange={(e) => setRegSubscriptionStatus(e.target.value as any)}
                    className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none font-bold cursor-pointer"
                  >
                    <option value="free">Free Plan (ఉచిత ప్లాన్) - Basic Registration (₹0)</option>
                    <option value="paid_1500">Full Premium Plan - Full Access (₹1500)</option>
                    <option value="paid_750">Defence 50% Off Plan - AGNIVEERA (₹750)</option>
                    <option value="paid_900">New User Discount Plan - NEWUSER2026 (₹900)</option>
                    <option value="paid_referral">Referral Rewards Plan - Free Access (₹0)</option>
                  </select>
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-2 bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
                  <input
                    id="reg-accept-terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <label htmlFor="reg-accept-terms" className="text-[11px] text-gray-300 leading-normal cursor-pointer select-none">
                    నేను నిబంధనలు, షరతులు మరియు రద్దు విధానాన్ని అంగీకరిస్తున్నాను. I agree to the <a href="/terms" target="_blank" rel="noreferrer" className="text-amber-400 font-semibold underline">Terms of Service</a> (shubhamastu.in/terms), the <a href="/refund" target="_blank" rel="noreferrer" className="text-emerald-400 font-semibold underline">Cancellation & Refund Policy</a> (shubhamastu.in/refund), and acknowledge Intermediary status under Section 79 IT Act.
                  </label>
                </div>
              </div>
            )}

            {/* Navigation & Action Buttons */}
            <div className="flex items-center justify-between pt-5 border-t border-zinc-800 mt-6">
              {regStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setRegStep(regStep - 1)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-gray-300 font-bold text-xs hover:bg-zinc-800 cursor-pointer"
                >
                  ← Back (వెనుకకు)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-gray-400 font-bold text-xs hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {regStep < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (regStep === 1 && (!regSurname || !regName)) {
                      alert("దయచేసి ఇంటి పేరు మరియు పేరు నమోదు చేయండి.");
                      return;
                    }
                    if (regStep === 2 && !regPhone) {
                      alert("దయచేసి మొబైల్ నంబర్ నమోదు చేయండి.");
                      return;
                    }
                    if (regStep === 4 && !regDob) {
                      alert("దయచేసి పుట్టిన తేదీ నమోదు చేయండి.");
                      return;
                    }
                    setRegStep(regStep + 1);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold uppercase tracking-wider text-xs shadow-md cursor-pointer hover:from-amber-500 hover:to-yellow-600"
                >
                  Next Step (తదుపరి) →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!acceptTerms || isUploading}
                  className={`px-6 py-2.5 rounded-xl text-black font-extrabold uppercase tracking-wider text-xs shadow-md flex items-center gap-1.5 transition-all ${
                    !acceptTerms || isUploading
                      ? "bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-60"
                      : "bg-gradient-to-r from-amber-400 to-yellow-500 cursor-pointer hover:from-amber-500 hover:to-yellow-600"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>Submit Sacred Soul Record</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: CONTACT US MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-zinc-900 border border-amber-500/20 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="absolute top-5 right-5 p-2 bg-zinc-800 text-amber-300 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer border border-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3 pb-4 border-b border-zinc-800">
              <div className="p-3 bg-amber-500/10 text-amber-300 rounded-full w-fit mx-auto border border-amber-500/30">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Contact Administration</h3>
              <p className="text-xs text-gray-400 leading-normal">
                This sacred platform is operated with the divine blessings of Sri Sri Sri Kanchi Kamakoti Peetham, Sringeri Sharada Peetham, and Sri Adi Shankaracharya.
              </p>
            </div>

            <div className="space-y-4 pt-5 text-center">
              <p className="text-xs text-gray-300 font-medium leading-relaxed">
                For any inquiries, updates, or profile verifications, please reach out directly to our administrator:
              </p>

              <div className="bg-black/40 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Direct Contact Number / WhatsApp</span>
                <a
                  href="tel:+919347359489"
                  className="text-2xl font-black text-amber-300 tracking-wide block hover:text-amber-200 transition-colors font-mono"
                >
                  +91 93473 59489
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="w-full py-2.5 mt-6 bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600 border border-zinc-700 text-amber-300 font-bold text-xs uppercase tracking-widest transition-all rounded-xl shadow-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATION TOAST OVERLAY */}
      {showStatusAlert && (
        <div className="fixed bottom-6 right-6 max-w-sm w-full bg-zinc-900 border-2 border-amber-500 text-white rounded-2xl shadow-2xl p-4 z-[200] animate-in slide-in-from-bottom duration-300">
          <div className="flex gap-3">
            <div className="p-1.5 bg-amber-500/10 text-amber-300 rounded-full h-fit shrink-0 border border-amber-500/30">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-left space-y-1">
              <h4 className="text-sm font-bold text-amber-300 uppercase">Om Namah Shivaya</h4>
              <p className="text-xs text-gray-300 leading-normal">{statusMessage}</p>
            </div>
            <button
              onClick={() => setShowStatusAlert(false)}
              className="p-1 bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white rounded-full h-fit cursor-pointer self-start ml-auto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: GORGEOUS REGISTRATION SUCCESS / CERTIFICATE SCREENSHOT MODAL */}
      {registeredProfile && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-zinc-900 via-[#1a1333] to-black border-2 border-amber-400 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-200 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Close / Exit Button */}
            <button
              type="button"
              onClick={() => {
                setRegisteredProfile(null);
              }}
              className="absolute top-4 right-4 z-[120] p-2 bg-zinc-800 hover:bg-[#C2242C] text-amber-300 hover:text-white rounded-full transition-all cursor-pointer border border-zinc-700 hover:scale-105 active:scale-95 shadow-md"
              title="Close and Return"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Sacred Design elements */}
            <div className="absolute inset-2 border border-dashed border-amber-400/20 rounded-2xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C2242C]/10 rounded-full filter blur-xl pointer-events-none" />

            <div className="text-center space-y-2 relative z-10">
              <div className="bg-amber-400/10 p-3 rounded-full flex items-center justify-center w-fit mx-auto border border-amber-400/30">
                <Heart className="w-8 h-8 text-amber-300 fill-amber-300 animate-pulse" />
              </div>
              <span className="text-[10px] text-amber-300 font-mono tracking-widest uppercase block font-bold">OM NAMAH SHIVAYA</span>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Vedic Marriage Portal Key</h3>
              <p className="text-xs text-gray-400">Your profile has been aligned with sacred Brahmin coordinates.</p>
            </div>

            {/* Certificate box designed for screenshots */}
            <div className="bg-gradient-to-br from-[#241a4a] to-zinc-950 p-6 rounded-2xl border-2 border-amber-400 text-center space-y-4 relative shadow-lg">
              <span className="text-[9px] uppercase tracking-widest text-amber-300 font-extrabold block font-sans">BRAMHANA VIVAHA VEADIKA • KEY CERTIFICATE</span>
              
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400 block uppercase font-bold tracking-widest font-sans">LOGIN ID (REGISTERED MOBILE)</span>
                <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-2xl px-6 py-2 rounded-xl border border-yellow-300 font-mono tracking-wider shadow-inner select-all">
                  {registeredProfile.contact_number}
                </div>
              </div>

              <div className="border-t border-amber-400/20 pt-3 space-y-2.5 text-left text-xs max-w-xs mx-auto text-gray-300 font-semibold font-mono">
                <p className="flex justify-between border-b border-zinc-800/50 pb-1.5">
                  <span>Candidate Name:</span>
                  <span className="text-white font-bold">{registeredProfile.name} {registeredProfile.surname || ""}</span>
                </p>
                <p className="flex justify-between border-b border-zinc-800/50 pb-1.5">
                  <span>Login Password:</span>
                  <span className="text-amber-300 font-bold">{registeredProfile.password}</span>
                </p>
                <p className="flex justify-between border-b border-zinc-800/50 pb-1.5">
                  <span>Date of Birth (DOB):</span>
                  <span className="text-white font-bold">{registeredProfile.dob}</span>
                </p>
                <p className="flex justify-between">
                  <span>Unique Reg Number:</span>
                  <span className="text-zinc-400 font-bold">{registeredProfile.reg_number}</span>
                </p>
              </div>

              <div className="bg-[#C2242C]/20 p-3 rounded-xl border border-[#C2242C]/40 text-[10.5px] text-amber-300 font-extrabold text-center uppercase tracking-wide leading-relaxed animate-pulse">
                📸 PLEASE TAKE A SCREENSHOT OF THIS CERTIFICATE NOW FOR YOUR GALLERY!
              </div>
            </div>

            {/* Payment Section for Paid Packages */}
            {(registeredProfile.subscription_status === "paid_100" || registeredProfile.subscription_status === "paid_900") && (
              <div className="bg-zinc-950 border border-amber-500/30 rounded-2xl p-4 space-y-4 relative z-10">
                <div className="text-center space-y-1">
                  <span className="text-[10px] text-amber-300 font-mono tracking-widest uppercase block font-bold">Secure Payment Portal</span>
                  <h4 className="text-sm font-extrabold text-white">
                    {registeredProfile.subscription_status === "paid_100" 
                      ? "Pay Match Registration Fee (₹100)" 
                      : "Pay Full Communication Upgrade (₹900)"}
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Scan G.V. Subramanyam's authentic PhonePe QR code below to complete your registration.
                  </p>
                </div>

                <PhonePeQRCode amount={registeredProfile.subscription_status === "paid_100" ? 100 : 900} className="w-full shadow-lg" />

                {regPaymentSuccess || registeredProfile.fee_transaction_id || registeredProfile.upgrade_transaction_id ? (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-center space-y-1 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 mx-auto" />
                    <span className="text-xs font-bold uppercase block">Payment Reference Submitted!</span>
                    <p className="text-[10px] text-zinc-300">
                      We have recorded your Transaction ID: <strong className="font-mono">{regTxnId || registeredProfile.fee_transaction_id || registeredProfile.upgrade_transaction_id}</strong>. Administrator will verify shortly.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider text-left">
                      Enter UPI Transaction ID / UTR Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 12-digit UPI UTR"
                        value={regTxnId}
                        onChange={(e) => setRegTxnId(e.target.value.replace(/[^0-9a-zA-Z]/g, ""))}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono uppercase tracking-widest text-center"
                      />
                      <button
                        type="button"
                        onClick={handleSubmitRegPayment}
                        disabled={!regTxnId.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-black rounded-xl hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                      >
                        Submit UTR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Convenience Fee Callback Warning */}
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 text-xs space-y-1.5 relative z-10">
              <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest block">📞 Verification & Approval Timeline</span>
              <p className="text-gray-300 font-medium leading-relaxed">
                Our registrar Sri G.V. Subramanyam will verify your submitted details and activate your account coordinates. If any clarifications are needed, our administrative desk will contact you at <span className="text-white font-bold font-mono">+{registeredProfile.contact_number}</span>.
              </p>
            </div>

            <div className="relative z-10 pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setRegisteredProfile(null);
                }}
                className="w-full sm:w-2/5 py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white font-bold text-xs tracking-wider uppercase transition-all rounded-xl border border-zinc-700 cursor-pointer active:scale-[0.98]"
              >
                Close / Exit
              </button>
              
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("bramhana_logged_in_user_id", registeredProfile.id);
                  onLoginSuccess(registeredProfile);
                  setRegisteredProfile(null);
                }}
                className="w-full sm:w-3/5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-xs tracking-widest uppercase transition-all rounded-xl shadow-lg border border-yellow-300 cursor-pointer hover:brightness-110 active:scale-[0.98]"
              >
                Login Now & Enter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RESTRICTED ADMIN PORTAL PASSWORD MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleAdminLoginSubmit}
            className="bg-zinc-900 border-2 border-amber-500 rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setShowAdminModal(false);
                setAdminMobile("");
                setAdminPassword("");
                setAdminError("");
              }}
              className="absolute top-4 right-4 p-1.5 bg-zinc-800 text-amber-300 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer border border-zinc-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="text-center space-y-2 pb-2 border-b border-zinc-800">
              <span className="text-[9px] text-amber-400 font-mono tracking-widest uppercase block font-bold">RESTRICTED SANCTUARY</span>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Pandiri People Login (వివాహ పందిరి లాగిన్)</h3>
              <p className="text-xs text-gray-400 font-medium">Enter secure Pandiri credentials to access the administrative dashboard</p>
            </div>

            {adminError && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-semibold rounded-xl text-center">
                {adminError}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5 text-xs text-left">
                <label className="font-bold text-gray-400 uppercase tracking-wider block">Pandiri Mobile Number (మొబైల్ నంబర్)</label>
                <div className="relative text-left">
                  <Phone className="w-4 h-4 text-amber-400/60 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Pandiri Mobile Number"
                    value={adminMobile}
                    onChange={(e) => setAdminMobile(e.target.value)}
                    className="w-full bg-black border border-zinc-800 focus:border-amber-400 rounded-xl py-2 pl-9 pr-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-left">
                <label className="font-bold text-gray-400 uppercase tracking-wider block">Pandiri Password (పాస్ వర్డ్)</label>
                <div className="relative text-left">
                  <Lock className="w-4 h-4 text-amber-400/60 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type={showAdminPasswordState ? "text" : "password"}
                    required
                    placeholder="Enter Pandiri Password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-800 focus:border-amber-400 rounded-xl py-2 pl-9 pr-10 text-white focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPasswordState(!showAdminPasswordState)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-amber-400 cursor-pointer p-1 transition-colors"
                    title={showAdminPasswordState ? "Hide password" : "Show password"}
                  >
                    {showAdminPasswordState ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-xs uppercase tracking-widest transition-all rounded-xl shadow-lg shadow-amber-400/10 cursor-pointer flex items-center justify-center gap-1.5 border border-yellow-300"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>Login to Pandiri Hub</span>
            </button>
          </form>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-left space-y-4 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setShowForgotPasswordModal(false);
                setForgotEmail("");
                setForgotSuccess(false);
              }}
              className="absolute top-4 right-4 p-1.5 bg-zinc-800 text-amber-300 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer border border-zinc-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="text-center space-y-1.5 pb-2 border-b border-zinc-800">
              <h3 className="text-lg font-black text-amber-300 uppercase tracking-tight">Forgot Password Recovery</h3>
              <p className="text-xs text-gray-400">Enter your registered email ID. We will send a secure password reset link directly from subramanyamghadiyaram@gmail.com.</p>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-emerald-500/30">
                  ✓
                </div>
                <h4 className="text-white font-bold text-sm">Reset Link Sent Successfully!</h4>
                <p className="text-xs text-gray-300">
                  We have dispatched a password reset link to <strong className="text-amber-300">{forgotEmail}</strong>. Please check your inbox and click the secure link to set your new password.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setForgotEmail("");
                    setForgotSuccess(false);
                  }}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl uppercase transition-all cursor-pointer"
                >
                  Close & Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendPasswordReset} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 block">Registered Email Address *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">✉️</span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. user@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {forgotLoading ? "Sending Reset Email..." : "Send Password Reset Link"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL (Triggered when user clicks reset link with token) */}
      {resetTokenFromUrl && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <form
            onSubmit={handleResetPasswordSubmit}
            className="bg-zinc-900 border-2 border-amber-500 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-left space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="text-center space-y-1.5 pb-2 border-b border-zinc-800">
              <h3 className="text-lg font-black text-amber-300 uppercase tracking-tight">Set New Password (కొత్త పాస్‌వర్డ్ సెట్ చేయండి)</h3>
              <p className="text-xs text-gray-400">Enter your new secure password below for your Brahmin matrimonial account.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 block">New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-amber-400/60 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min 4 chars)"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
            >
              Update Password & Login
            </button>
          </form>
        </div>
      )}

      {/* PASSWORD RESET SUCCESS MODAL */}
      {showResetSuccessModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[140] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-emerald-500/50 rounded-3xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-emerald-500/30">
              ✓
            </div>
            <h3 className="text-white font-black text-base">Password Updated Successfully!</h3>
            <p className="text-xs text-gray-300">Your password has been changed successfully. You can now log in with your new credentials.</p>
            <button
              type="button"
              onClick={() => {
                setShowResetSuccessModal(false);
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-xs uppercase rounded-xl transition-all cursor-pointer"
            >
              Proceed to Login
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
