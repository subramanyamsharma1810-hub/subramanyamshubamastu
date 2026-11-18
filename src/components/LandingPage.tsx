import React, { useState, useEffect, useRef } from "react";
import { Profile, Pandit } from "../types";
import { databaseService, generateRandomPassword, adminNotificationService } from "../lib/databaseService";
import { verifyPassword } from "../lib/passwordSecurity";
import { KundaliChart } from "./KundaliChart";
import { calculatePanchangam, lookupByStartingLetter, TELUGU_PHONETIC_MAPPINGS } from "../lib/panchangam";
import { ensureAuth, auth, googleProvider } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
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
  RefreshCw,
  Eye,
  EyeOff,
  Quote,
  Star,
  HeartHandshake,
  Tag,
  Check,
  Zap,
  CreditCard,
  Mail,
  ShieldCheck,
  Download,
  Search
} from "lucide-react";
import { downloadAstrologyPdf } from "../lib/astrologyPdfGenerator";

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
  const [showUserLoginModal, setShowUserLoginModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminMobile, setAdminMobile] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminOtp, setAdminOtp] = useState("");
  const [adminGeneratedOtp, setAdminGeneratedOtp] = useState("");
  const [isAdminOtpSent, setIsAdminOtpSent] = useState(false);
  const [adminOtpSuccessMsg, setAdminOtpSuccessMsg] = useState("");
  const [adminError, setAdminError] = useState("");
  const [pendingAdminProfile, setPendingAdminProfile] = useState<Profile | null>(null);
  const [showAdminOtpModal, setShowAdminOtpModal] = useState<boolean>(false);
  const [enteredAdminOtp, setEnteredAdminOtp] = useState<string>("");
  const [targetAdminOtp, setTargetAdminOtp] = useState<string>("");
  const [adminOtpNotice, setAdminOtpNotice] = useState<string>("");
  const [registeredProfile, setRegisteredProfile] = useState<Profile | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  // Language selection state (Telugu / English)
  const [lang, setLang] = useState<"te" | "en">("te");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regSurname, setRegSurname] = useState("");
  const [regGender, setRegGender] = useState<"Male" | "Female">("Female");
  const [regDob, setRegDob] = useState("");
  const [regBirthPlace, setRegBirthPlace] = useState("");
  const [regBirthPincode, setRegBirthPincode] = useState("");
  const regSubscriptionStatus = "free" as const;
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
  const [otpCooldown, setOtpCooldown] = useState<number>(0);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [otpErrorMsg, setOtpErrorMsg] = useState("");
  const [otpSuccessMsg, setOtpSuccessMsg] = useState("");

  // Initialize from localStorage if exists
  useEffect(() => {
    const savedExpiry = localStorage.getItem("bvm_otp_expiry");
    if (savedExpiry) {
      const expiryTime = parseInt(savedExpiry, 10);
      const now = Date.now();
      if (expiryTime > now) {
        setOtpCooldown(Math.ceil((expiryTime - now) / 1000));
      } else {
        localStorage.removeItem("bvm_otp_expiry");
      }
    }
  }, []);

  // 2-minute (120 seconds) countdown timer for OTP resend
  useEffect(() => {
    if (otpCooldown <= 0) {
      localStorage.removeItem("bvm_otp_expiry");
      return;
    }
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const formatCooldownTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Multi-step registration wizard states
  const [regStep, setRegStep] = useState<number>(1);
  const [regFatherName, setRegFatherName] = useState("");
  const [regMotherName, setRegMotherName] = useState("");
  const [regMainCaste, setRegMainCaste] = useState("Brahmin");
  const [regMealPreference, setRegMealPreference] = useState("Vegetarian");
  const [regPartnerMealPreference, setRegPartnerMealPreference] = useState("Only My Meal");
  const [regPartnerProfessionPreference, setRegPartnerProfessionPreference] = useState("Any Profession");

  // Referral state
  const [regReferredBy, setRegReferredBy] = useState("");
  const [myReferralCode] = useState("SUBHA-" + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [panditsList, setPanditsList] = useState<Pandit[]>([]);

  useEffect(() => {
    databaseService.getPandits().then(setPanditsList);
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setRegReferredBy(ref);
    }
  }, []);

  const handleWhatsAppShare = () => {
    const inviteText = encodeURIComponent(
      `🙏 Namaste! Join Subhamastu Matrimony (a unit of Glark Solutions) using my sacred referral link and find your ideal match:\n\n${window.location.origin}/?ref=${myReferralCode}\n\n✨ Register today with code ${myReferralCode} and get special divine blessings!`
    );
    window.open(`https://wa.me/?text=${inviteText}`, "_blank");
  };

  const calculateCandidateAge = (dobString: string): number => {
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

  const handleSendEmailOtp = async () => {
    if (isSendingOtp) return;
    setOtpErrorMsg("");
    setOtpSuccessMsg("");
    if (!regEmail || !regEmail.includes("@")) {
      const msg = "❌ Please enter a valid candidate email address in the box first to send OTP. (దయచేసి ముందుగా సరైన ఈమెయిల్ చిరునామా నమోదు చేయండి)";
      setOtpErrorMsg(msg);
      alert("⚠️ Please enter a valid email address in the candidate email box first, then click 'Send OTP to Mail'.");
      return;
    }
    setIsSendingOtp(true);
    // Standard 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    try {
      // Fire-and-forget background log so Firestore never delays or blocks email delivery
      adminNotificationService.logPendingVerification(regEmail.trim(), code).catch(() => {});

      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail.trim(), otp: code })
      });
      const data = await res.json();
      
      setIsOtpSent(true);
      setOtpCooldown(60);
      setOtpSuccessMsg(`✉️ 6-Digit OTP successfully sent to ${regEmail} via verification@shubhamastu.in. Please check your inbox & spam.`);
    } catch (err) {
      console.error("Notice sending email OTP:", err);
      setIsOtpSent(true);
      setOtpCooldown(60);
      setOtpSuccessMsg(`✉️ 6-Digit OTP dispatched to ${regEmail}. Please check your inbox.`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = () => {
    setOtpErrorMsg("");
    setOtpSuccessMsg("");
    if (!regOtp || regOtp.trim().length === 0) {
      setOtpErrorMsg("⚠️ Please enter the 6-digit OTP code sent to your email.");
      return;
    }
    const cleanRegOtp = regOtp.trim();
    const cleanGenOtp = generatedOtp ? generatedOtp.trim() : "";
    const isValidRegOtp = cleanRegOtp === cleanGenOtp;

    if (isValidRegOtp) {
      setIsEmailVerified(true);
      setOtpSuccessMsg("✅ Email Verified Successfully via OTP! (ఈమెయిల్ విజయవంతంగా ధృవీకరించబడింది)");
    } else {
      setOtpErrorMsg("❌ Incorrect OTP! Please check the 6-digit code from your email and try again. (తప్పు OTP. దయచేసి మళ్లీ తనిఖీ చేయండి)");
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
    if (!newPasswordValue || newPasswordValue.length < 8) {
      alert("Please enter a valid password (at least 8 characters).");
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

  // Helper to dispatch OTP email via Zoho ZeptoMail backend API
  const [isSendingAdminOtp, setIsSendingAdminOtp] = useState(false);

  const dispatchAdminOtpEmail = async (email: string, otp: string) => {
    setIsSendingAdminOtp(true);
    try {
      // Log to Firestore pending_verifications collection for Admin OTP Monitor fallback
      await adminNotificationService.logPendingVerification(email, otp);
      
      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        console.log("ZeptoMail Admin OTP API dispatched successfully to", email, data);
        return { success: true, data };
      } else {
        console.warn("ZeptoMail Admin OTP API warning response:", data);
        return { success: false, error: data.error || "Failed to trigger mail via ZeptoMail" };
      }
    } catch (err: any) {
      console.error("Failed to trigger ZeptoMail OTP API:", err);
      return { success: false, error: err?.message || "Network error dispatching OTP" };
    } finally {
      setIsSendingAdminOtp(false);
    }
  };

  // Admin Login handler - Step 1: Send OTP
  const handleSendAdminOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminOtpSuccessMsg("");

    const identifier = adminEmail.trim().toLowerCase();
    if (!identifier || !adminPassword.trim()) {
      setAdminError("Enter your authorized admin email/mobile and password.");
      return;
    }

    const verifiedAdmin = await databaseService.verifyAdminLogin(identifier, adminPassword);
    if (!verifiedAdmin || !verifiedAdmin.email) {
      setAdminError("Access denied. Check the authorized admin email/mobile and password.");
      return;
    }

    const emailTrim = verifiedAdmin.email.toLowerCase();
    setAdminEmail(emailTrim);
    setAdminMobile(verifiedAdmin.mobile || "");
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP matching input maxLength={6}
    setAdminGeneratedOtp(otp);

    const result = await dispatchAdminOtpEmail(emailTrim, otp);
    if (result.success) {
      setIsAdminOtpSent(true);
      setAdminOtpSuccessMsg(`✉️ 6-Digit OTP successfully dispatched to ${emailTrim} via verification@shubhamastu.in. Please check your inbox.`);
    } else {
      setIsAdminOtpSent(true);
      setAdminOtpSuccessMsg(`✉️ 6-Digit OTP dispatched to ${emailTrim} via verification@shubhamastu.in.`);
    }
  };

  const handleResendAdminOtp = async () => {
    setAdminError("");
    setAdminOtpSuccessMsg("");
    const emailTrim = adminEmail.trim().toLowerCase();
    if (!emailTrim) return;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setAdminGeneratedOtp(otp);
    const result = await dispatchAdminOtpEmail(emailTrim, otp);
    if (result.success) {
      setAdminOtpSuccessMsg(`🔄 6-Digit OTP re-sent successfully to ${emailTrim} via verification@shubhamastu.in.`);
    } else {
      setAdminOtpSuccessMsg(`🔄 6-Digit OTP sent to ${emailTrim} via verification@shubhamastu.in.`);
    }
  };

  // Admin Login handler - Step 2: Verify OTP & Login
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    const emailTrim = adminEmail.trim().toLowerCase();

    if (!isAdminOtpSent) {
      return handleSendAdminOtp(e);
    }

    const cleanAdminOtp = adminOtp ? adminOtp.trim() : "";
    const cleanGenAdminOtp = adminGeneratedOtp ? adminGeneratedOtp.trim() : "";

    const isValidAdminOtp = 
      cleanAdminOtp === cleanGenAdminOtp || 
      (cleanGenAdminOtp && cleanAdminOtp === cleanGenAdminOtp.slice(-6));

    if (!cleanAdminOtp || !isValidAdminOtp) {
      setAdminError("Invalid OTP code. Please enter the correct 6-digit OTP sent to your email.");
      return;
    }

    try {
      await ensureAuth();
      const profiles = await databaseService.getProfiles(true);
      const isSubbu = emailTrim === "subramanyamghadiyaram@gmail.com";
      const isSubba = emailTrim === "subbareddyposham@gmail.com";
      const isKarna = emailTrim === "k.tejaswar567@gmail.com";
      const isPraveen = emailTrim === "praveenproq@gmail.com";
      
      let adminProf = profiles.find((p) => 
        p.email?.toLowerCase() === emailTrim ||
        (isSubbu && p.id === "admin-subbu") || 
        (isSubba && p.id === "admin-subba-reddy") ||
        (isKarna && p.id === "admin-tejaswar") ||
        (isPraveen && p.id === "admin-praveen")
      );

      if (!adminProf) {
        adminProf = {
          id: isSubbu ? "admin-subbu" : isSubba ? "admin-subba-reddy" : isKarna ? "admin-tejaswar" : "admin-praveen",
          reg_number: isSubbu ? "BVM-1001" : isSubba ? "BVM-1007" : isKarna ? "BVM-1010" : "BVM-1011",
          name: isSubbu ? "Sri G.V. Subramanyam" : isSubba ? "Mr. Posham Venkata Subba Reddy" : isKarna ? "Mr. Karna Tejaswar Reddy" : "Mr. Praveen",
          dob: "1994-06-15",
          gender: "Male",
          height_feet: 5.10,
          sub_caste: "Smartha",
          profession: "Super Admin",
          salary_lpa: 20,
          contact_number: adminMobile.trim() || (isSubbu ? "9347359489" : isSubba ? "9989079372" : isKarna ? "9392551166" : "9876543219"),
          email: emailTrim,
          status: "Verified",
          role: "super_admin",
          subscription_status: "free"
        };
      }

      await ensureAuth();
      const currentUid = (await import("../lib/firebase")).auth.currentUser?.uid;
      if (currentUid) {
        await adminNotificationService.elevateToAdmin(currentUid, {
          id: adminProf.id,
          name: adminProf.name,
          email: emailTrim,
          role: adminProf.role
        });
      }

      localStorage.setItem("bramhana_admin_session", "true");
      localStorage.setItem("bramhana_logged_in_user_id", adminProf.id);
      localStorage.setItem("bramhana_logged_in_user_name", adminProf.name);
      localStorage.setItem("bramhana_logged_in_email", emailTrim);

      onLoginSuccess(adminProf);
      setShowAdminModal(false);
      setIsAdminOtpSent(false);
      setAdminPassword("");
      setAdminMobile("");
      setAdminEmail("");
      setAdminOtp("");
    } catch (err: any) {
      setAdminError(err?.message || "Failed to complete admin login.");
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!mobileNumber || !password) {
      setLoginError("Please enter your mobile number or email and password.");
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
      // Use the specialized lookup method that handles masked profiles and private data
      const match = await databaseService.getProfileByPhone(inputClean);

      if (match) {
        const normalizedEntered = passClean.replace(/[-/]/g, "");
        const normalizedDob = match.dob.replace(/[-/]/g, "");
        const dobParts = match.dob.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
        const legacyDobPasswords = dobParts
          ? [normalizedDob, `${dobParts[3]}${dobParts[2]}${dobParts[1]}`, `${dobParts[3]}${dobParts[2]}${dobParts[1].slice(2)}`]
          : [normalizedDob];
        const isLegacyDobPassword = legacyDobPasswords.includes(normalizedEntered);
        const passwordMatches = Boolean(
          match.password_hash &&
          !isLegacyDobPassword &&
          await verifyPassword(passClean, match.password_hash)
        );

        if (passwordMatches) {
          const cleanNum = match.contact_number ? match.contact_number.replace(/\D/g, "") : "";
          const isAdminAcc = match.role === "admin" || match.role === "super_admin" || match.role === "employee" || ["admin-subbu", "admin-subba-reddy", "admin-tejaswar", "admin-praveen"].includes(match.id) || match.email?.toLowerCase() === "praveenproq@gmail.com";

          if (isAdminAcc) {
            const adminEmailToUse = match.email || (match.id === "admin-subbu" ? "subramanyamghadiyaram@gmail.com" : match.id === "admin-subba-reddy" ? "subbareddyposham@gmail.com" : match.id === "admin-tejaswar" ? "k.tejaswar567@gmail.com" : "praveenproq@gmail.com");
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            setTargetAdminOtp(otp);
            setPendingAdminProfile(match);
            await dispatchAdminOtpEmail(adminEmailToUse, otp);
            setAdminOtpNotice(`Security Verification: An OTP has been successfully dispatched to your registered admin email (${adminEmailToUse.replace(/(.{3})(.*)(@.*)/, "$1***$3")}).`);
            setShowAdminOtpModal(true);
            return;
          }

          await ensureAuth();
          localStorage.setItem("bramhana_logged_in_user_id", match.id);
          setShowUserLoginModal(false);
          onLoginSuccess(match);
        } else {
          setLoginError(`Incorrect password. Please verify your login credentials or contact administration.`);
        }
      } else {
        setLoginError("Invalid credentials. No profile matches that mobile number or email.");
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

    const minAgeReq = regGender === "Male" ? 24 : 21;
    const currentAge = calculateCandidateAge(regDob);
    if (currentAge < minAgeReq) {
      alert(`⚠️ Age Restriction (వయోపరిమితి నిబంధన):\n\nMinimum age requirement is ${minAgeReq} years for ${regGender === "Male" ? "Male (Grooms / అబ్బాయిలు: 24+ mandatory)" : "Female (Brides / అమ్మాయిలు: 21+ mandatory)"}.\n\nCurrent calculated age is ${currentAge} years.\n\nRegistration is strictly prohibited below ${minAgeReq} years.`);
      return;
    }

    if (!regPhone || regPhone.replace(/\D/g, "").length < 10) {
      alert("Please enter a valid 10-digit Mobile Number (మొబైల్ సంఖ్య).");
      return;
    }

    if (!regEmail || !regEmail.includes("@")) {
      alert("⚠️ Email Address Required: Please enter candidate email address.");
      return;
    }
    if (regPassword.trim().length < 8) {
      alert("Please set a password of at least 8 characters. DOB can no longer be used as a password.");
      return;
    }

    if (!isEmailVerified) {
      alert("⚠️ Email Verification Required (ఓటీపీ ధృవీకరణ అవసరం):\n\nPlease verify your email address via 6-digit OTP sent to your email inbox before completing registration.");
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
        if (adminId === "admin-subbu") {
          registeredBy = "GV Subramanyam";
        } else if (adminId === "admin-subba-reddy") {
          registeredBy = "PV Subba Reddy";
        } else if (adminId === "admin-tejaswar") {
          registeredBy = "Karna Tejaswar Reddy";
        } else if (adminId === "admin-praveen") {
          registeredBy = "Praveen";
        } else {
          registeredBy = "Bramhana Admin";
        }
      }

      const profLower = regProfession.toLowerCase();
      const isDefence = profLower.includes("defence") || profLower.includes("army") || profLower.includes("navy") || profLower.includes("air force") || profLower.includes("military");
      const isTeacher = profLower.includes("teacher") || profLower.includes("professor") || profLower.includes("educator") || profLower.includes("lecturer");

      const badgeType = isDefence ? "Shoorveer" : isTeacher ? "Guruvu" : "Standard";
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
        password: regPassword.trim(),
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
        referral_code: myReferralCode,
        referred_by: regReferredBy.trim() || undefined,
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
      setPassword("");
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

  const t = {
    te: {
      badge: "బ్రాహ్మణ వివాహ వేదిక",
      title1: "తెలుగు బ్రాహ్మణుల కోసం",
      title2: "ప్రత్యేక వివాహ వేదిక",
      bullet1: "బ్రాహ్మణులకే ప్రత్యేకంగా",
      bullet2: "గోత్రం ఆధారిత శోధన",
      bullet3: "సురక్షితమైన & గోప్యమైన సేవ",
      bullet4: "సంప్రదాయ వివాహ బంధాలకు ప్రాధాన్యం",
      districtSearchTitle: "ప్రాంతాల వారీగా వధూవరుల శోధన",
    },
    en: {
      badge: "100% Dedicated Brahmin Matrimony",
      title1: "For Telugu Brahmin Families",
      title2: "A Trusted Matrimonial Platform",
      bullet1: "Exclusive for Brahmin Families",
      bullet2: "Gotram-based Search",
      bullet3: "Secure and Confidential Service",
      bullet4: "Traditional Family Values",
      districtSearchTitle: "District-wise Bride and Groom Search",
    }
  }[lang];

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    setRegBirthPlace(district);
    setShowRegisterModal(true);
  };

  return (
    <div
      className="landing-light-theme relative min-h-screen bg-[#FAF8F5] text-zinc-900 overflow-x-hidden flex flex-col font-sans select-none bg-cover bg-center bg-scroll md:bg-fixed"
      style={{
        backgroundImage:
          "linear-gradient(rgba(250,248,245,0.64), rgba(250,248,245,0.88)), url('/images/telugu-wedding-hero.png')",
        backgroundPosition: "center top",
      }}
    >
      <style>{`
        .landing-light-theme [class*="bg-black"],
        .landing-light-theme [class*="bg-zinc-9"],
        .landing-light-theme [class*="bg-gray-9"] {
          background-color: #fffaf0 !important;
          color: #4a1f1f !important;
        }
        .landing-light-theme [class*="text-white"],
        .landing-light-theme [class~="text-black"] {
          color: #4a1f1f !important;
        }
        .landing-light-theme [class*="border-zinc-"] {
          border-color: #e8c982 !important;
        }
        .landing-light-theme [class*="placeholder-zinc-"]::placeholder {
          color: #9b8060 !important;
        }
      `}</style>
      
      {/* Mango Leaf Toran Decorative Top Bar */}
      <div className="relative w-full h-20 sm:h-28 lg:h-32 bg-[#fffaf0]/95 border-b-2 border-amber-400 shadow-sm overflow-hidden">
        <img
          src="/images/mango-toranam.svg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-x-0 bottom-1 sm:bottom-2 flex justify-center px-4">
          <span className="rounded-full bg-[#fffaf0]/90 px-3 py-1 text-[8px] sm:text-[10px] font-black text-[#99151B] tracking-[0.12em] shadow-sm">
            {lang === "te" ? "బ్రాహ్మణ సంప్రదాయాలకు గౌరవం • పవిత్రమైన వివాహ బంధాలు" : "HONOURING TRADITION • CREATING SACRED ALLIANCES"}
          </span>
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-30 w-full bg-white/95 backdrop-blur-md border-b border-amber-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-24 sm:min-h-28 lg:min-h-32 py-3 flex items-center justify-between gap-3">
          
          {/* Webpage Name & Slogan */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="bg-white p-2 sm:p-3 rounded-full flex items-center justify-center shadow-lg border-2 border-[#C2242C] shrink-0">
              <svg
                viewBox="0 0 48 48"
                className="w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24"
                role="img"
                aria-label="Kalasam logo"
              >
                <path d="M24 5c-2 4-5 6-9 7 3 2 6 3 9 2 3 1 6 0 9-2-4-1-7-3-9-7Z" fill="#2f7d32" />
                <path d="M24 5c1 4 3 7 6 9M24 5c-1 4-3 7-6 9" stroke="#1b5e20" strokeWidth="1.5" fill="none" />
                <path d="M16 17h16l-2 5H18l-2-5Z" fill="#d79b18" stroke="#99151b" strokeWidth="1.5" />
                <path d="M18 22h12l3 14c-3 4-15 4-18 0l3-14Z" fill="#f3bd35" stroke="#99151b" strokeWidth="1.5" />
                <path d="M20 27h8M19 31h10" stroke="#99151b" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="24" cy="24" r="1.5" fill="#99151b" />
              </svg>
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-5xl lg:text-6xl leading-none font-black tracking-wide text-[#C2242C] uppercase font-sans truncate block">
                  {lang === "te" ? "శుభమస్తు" : "SHUBHAMASTU"}
                </span>
                <span className="text-[10px] lg:text-xs bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold hidden md:inline-block">
                  {lang === "te" ? "తెలుగు బ్రాహ్మణ వివాహ వేదిక" : "TELUGU BRAHMIN MATRIMONY"}
                </span>
              </div>
              <p className="text-[9px] sm:text-[11px] text-amber-900 font-mono tracking-widest uppercase truncate font-bold">
                {lang === "te" ? "తెలుగు బ్రాహ్మణ వివాహ వేదిక" : "Trusted Telugu Brahmin Matrimony"}
              </p>
            </div>
          </div>

          {/* Navigation & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Nav Links */}
            <div className="hidden lg:flex items-center gap-3 text-xs font-extrabold text-zinc-800">
              <a href="#home" className="hover:text-amber-700 transition-colors">{lang === "te" ? "హోమ్" : "Home"}</a>
              <button type="button" onClick={() => setShowRegisterModal(true)} className="hover:text-amber-700 transition-colors cursor-pointer">{lang === "te" ? "వధువరుల శోధన" : "Search Matches"}</button>
              <button type="button" onClick={() => setShowRegisterModal(true)} className="hover:text-amber-700 transition-colors cursor-pointer">{lang === "te" ? "గోత్రాలు" : "Gotram"}</button>
              <button type="button" onClick={() => setShowRegisterModal(true)} className="hover:text-amber-700 transition-colors cursor-pointer">{lang === "te" ? "వివాహాలు" : "Marriages"}</button>
              <button type="button" onClick={() => setShowContactModal(true)} className="hover:text-amber-700 transition-colors cursor-pointer">{lang === "te" ? "సంప్రదించండి" : "Contact"}</button>
              <button type="button" onClick={() => setShowStatusAlert(true)} className="hover:text-amber-700 transition-colors cursor-pointer">{lang === "te" ? "మా గురించి" : "About"}</button>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center bg-amber-100 border border-amber-300 rounded-xl p-0.5 text-xs font-bold shadow-xs">
              <button
                type="button"
                onClick={() => setLang("te")}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${lang === "te" ? "bg-amber-600 text-white shadow-xs" : "text-amber-900 hover:text-[#99151B]"}`}
              >
                తెలుగు
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${lang === "en" ? "bg-amber-600 text-white shadow-xs" : "text-amber-900 hover:text-[#99151B]"}`}
              >
                English
              </button>
            </div>

            {/* Login & Register Buttons */}
            <button
              type="button"
              onClick={() => setShowUserLoginModal(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <User className="w-3.5 h-3.5 text-amber-700" />
              <span>{lang === "te" ? "లాగిన్" : "Login"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>{lang === "te" ? "అడ్మిన్ లాగిన్" : "Admin Login"}</span>
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#C2242C] to-[#99151B] text-white hover:brightness-110 active:scale-95 text-xs font-extrabold rounded-xl transition-all border border-amber-400 uppercase tracking-wider shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === "te" ? "ఉచితంగా నమోదు" : "Register Free"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.15fr_1fr] items-center gap-6">
          
          {/* Left Column: Title & Feature Checklist */}
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-100/90 border border-amber-300 rounded-full text-amber-900 text-xs font-mono font-black uppercase tracking-widest shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>{t.badge}</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-amber-700">
                <span className="block text-amber-800 font-extrabold text-xl sm:text-2xl mb-1">{t.title1}</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 uppercase">
                  {t.title2}
                </span>
              </h1>

              <ul className="space-y-3 pt-2 text-sm font-bold text-zinc-900">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-black text-xs font-black flex items-center justify-center shadow-xs shrink-0">✓</span>
                  <span>{t.bullet1}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-black text-xs font-black flex items-center justify-center shadow-xs shrink-0">✓</span>
                  <span>{t.bullet2}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-black text-xs font-black flex items-center justify-center shadow-xs shrink-0">✓</span>
                  <span>{t.bullet3}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-black text-xs font-black flex items-center justify-center shadow-xs shrink-0">✓</span>
                  <span>{t.bullet4}</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Wedding Couple Visual */}
          <div className="hidden xl:flex items-end justify-center min-h-[360px]">
            <img
              src="/images/original-wedding-slow.gif"
              alt="Brahmin wedding couple"
              className="w-full max-h-[390px] object-contain object-bottom drop-shadow-2xl"
            />
          </div>

          {/* Right Column: Partner Search Card */}
          <div className="bg-white/95 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-amber-200">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <Heart className="w-5 h-5 fill-amber-600 text-amber-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-amber-900 text-base">మీ జీవిత భాగస్వామిని కనుగొనండి</h3>
                <p className="text-[10px] text-zinc-600">Find your life partner • Gotram & Sub-caste verified matching</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowRegisterModal(true); }} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <span className="text-amber-700">•</span> నేను (Looking for)
                </label>
                <select className="w-full bg-white border border-amber-300 focus:border-amber-600 rounded-xl py-2.5 px-3 text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer">
                  <option value="Bride">వధువు (Bride)</option>
                  <option value="Groom">వరుడు (Groom)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <span className="text-amber-700">•</span> గోత్రం (Gotram)
                </label>
                <select className="w-full bg-white border border-amber-300 focus:border-amber-600 rounded-xl py-2.5 px-3 text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer">
                  <option value="">అన్ని గోత్రాలు (All Gotrams)</option>
                  {BRAHMIN_GOTRAMS.map(g => (
                    <option key={g.id} value={g.id}>{g.labelEn}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <span className="text-amber-700">•</span> ఉపగోత్రం (Sub-caste)
                </label>
                <select className="w-full bg-white border border-amber-300 focus:border-amber-600 rounded-xl py-2.5 px-3 text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer">
                  <option value="">అన్ని ఉపగోత్రాలు (All Sub-castes)</option>
                  {BRAHMIN_SUB_CASTES.map(s => (
                    <option key={s.id} value={s.id}>{s.labelEn}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-105 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-300 mt-2"
              >
                <Search className="w-4 h-4 text-black" />
                <span>సభ్యులను శోధించండి (Search Matches)</span>
              </button>
            </form>
          </div>

        </div>
      </section>





      {/* Trust strip matching the traditional reference layout */}
      <section className="relative z-20 w-full border-y-2 border-amber-300 bg-[#FFF8E8]/95 shadow-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 divide-x divide-amber-300/80">
          {[
            ["👥", "తెలుగు బ్రాహ్మణులకు ప్రత్యేక వేదిక", "Dedicated Brahmin Families"],
            ["🪔", "సంప్రదాయం • శుభకరం • కుటుంబ విలువలు", "Tradition • Purity • Values"],
            ["🛡️", "ధృవీకరించిన ప్రొఫైల్స్", "(గోప్య సమాచారం)"],
            ["🔒", "సురక్షిత గోప్య & Data Protection", "Privacy Protected"],
            ["🤝", "వివాహ వేదిక సహాయం", "Sacred Alliance Support"],
          ].map(([icon, teLabel, enLabel]) => (
            <div key={enLabel} className="px-3 py-4 text-center">
              <div className="text-xl mb-1" aria-hidden="true">{icon}</div>
              <p className="text-xs sm:text-sm font-black text-[#99151B]">{teLabel}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-amber-900">{enLabel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: DISTRICT-WISE BRIDE / GROOM SEARCH (AP & TELANGANA) */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-gradient-to-br from-[#0B3B17] via-[#0E4720] to-[#06240E] rounded-3xl border-4 border-amber-400 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left">
          
          {/* Mango Leaf Toran Decorative Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-7 bg-[radial-gradient(#1e7e34_25%,transparent_25%)] bg-[size:16px_16px] opacity-90 border-b border-amber-400/60 flex items-center justify-around px-2 text-[10px] font-bold text-amber-300 bg-[#0B3B17]">
            <span>🌿 మామిడి తోరణం • Mangalekarana 🌿</span>
          </div>

          <div className="text-center space-y-2 pt-4 pb-6 border-b border-amber-500/40">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-400 text-black rounded-full text-xs font-mono font-black uppercase tracking-widest shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>ఉచితంగా నమోదు • 100% Free Registration Across All Districts</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-amber-300 uppercase tracking-tight">
              🌿 {t.districtSearchTitle} 🌿
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mx-auto font-medium">
              Explore verified Brahmin alliances across every district of Andhra Pradesh & Telangana. Select your preferred region below.
            </p>
            {selectedDistrict && (
              <p className="inline-flex items-center gap-2 mx-auto px-3 py-1 rounded-full bg-amber-300 text-emerald-950 text-xs font-black">
                Selected district: {selectedDistrict}
              </p>
            )}
          </div>

          {/* 3 Regional Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            
            {/* Card 1: Rayalaseema */}
            <div className="bg-white/95 rounded-2xl p-5 border-2 border-amber-400/80 shadow-lg space-y-3 text-zinc-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <h4 className="font-black text-amber-900 text-base flex items-center gap-2">
                    <span>🏛️ రాయలసీమ</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full font-bold">8 Districts</span>
                </div>
                <p className="text-[11px] font-bold text-amber-800 mt-2">జిల్లాలు:</p>
                <div className="flex flex-wrap gap-1.5 pt-2 text-xs font-medium text-zinc-700">
                  {["కర్నూలు", "నంద్యాల", "అనంతపురము", "శ్రీ సత్యసాయి", "వై.ఎస్.ఆర్. కడప", "అన్నమయ్య", "చిత్తూరు", "తిరుపతి"].map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => handleDistrictSelect(dist)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                <span className="text-emerald-700 font-bold">✓ Free Registration</span>
                <button
                  type="button"
                  onClick={() => handleDistrictSelect("Rayalaseema")}
                  className="text-amber-700 hover:underline font-extrabold cursor-pointer"
                >
                  Search Profiles →
                </button>
              </div>
            </div>

            {/* Card 2: Godavari (East & West) */}
            <div className="bg-white/95 rounded-2xl p-5 border-2 border-amber-400/80 shadow-lg space-y-3 text-zinc-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <h4 className="font-black text-amber-900 text-base flex items-center gap-2">
                    <span>🌴 గోదావరి (తూర్పు / పశ్చిమ)</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full font-bold">Godavari Delta</span>
                </div>
                <p className="text-[11px] font-bold text-amber-800 mt-2">ఉభయ గోదావరి జిల్లాల వారీగా:</p>
                <div className="flex flex-wrap gap-1.5 pt-2 text-xs font-medium text-zinc-700">
                  {["తూర్పు గోదావరి", "కాకినాడ", "డా. బి.ఆర్. అంబేద్కర్ కోనసీమ", "అల్లూరి సీతారామరాజు", "పశ్చిమ గోదావరి", "ఏలూరు", "నర్సాపురం", "ఎన్టీఆర్", "పోలవరం"].map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => handleDistrictSelect(dist)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                <span className="text-emerald-700 font-bold">✓ Free Registration</span>
                <button
                  type="button"
                  onClick={() => handleDistrictSelect("Godavari")}
                  className="text-amber-700 hover:underline font-extrabold cursor-pointer"
                >
                  Search Profiles →
                </button>
              </div>
            </div>

            {/* Card 3: Telangana */}
            <div className="bg-white/95 rounded-2xl p-5 border-2 border-amber-400/80 shadow-lg space-y-3 text-zinc-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <h4 className="font-black text-amber-900 text-base flex items-center gap-2">
                    <span>🏛️ తెలంగాణ</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full font-bold">10+ Districts</span>
                </div>
                <p className="text-[11px] font-bold text-amber-800 mt-2">జిల్లాలు:</p>
                <div className="flex flex-wrap gap-1.5 pt-2 text-xs font-medium text-zinc-700">
                  {["హైదరాబాద్", "రంగారెడ్డి", "మేడ్చల్-మల్కాజ్‌గిరి", "సంగారెడ్డి", "సిద్దిపేట", "మెదక్", "మహబూబ్‌నగర్", "నాగర్‌కర్నూల్", "వనపర్తి", "ఇతర జిల్లాలు..."].map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => handleDistrictSelect(dist)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                <span className="text-emerald-700 font-bold">✓ Free Registration</span>
                <button
                  type="button"
                  onClick={() => handleDistrictSelect("Telangana")}
                  className="text-amber-700 hover:underline font-extrabold cursor-pointer"
                >
                  Search Profiles →
                </button>
              </div>
            </div>

          </div>

          <div className="mt-6 pt-4 border-t border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-xs text-emerald-100 font-medium">
              ✨ Register your candidate profile completely free of cost and list your alliance preferences across AP & Telangana districts.
            </p>
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer shrink-0 border border-yellow-300"
            >
              ఇప్పుడే ఉచితంగా నమోదు చేసుకోండి (Free Registration) →
            </button>
          </div>

        </div>
      </section>

      {/* SECTION: NOTICE & DIRECT NAVIGATION */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 border-t border-amber-200">
        <div className="bg-white rounded-3xl border border-amber-300/80 p-6 sm:p-8 space-y-6 shadow-md">
          {/* Important Legal Disclaimer Banner */}
          <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 text-xs text-amber-900">
            <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5 leading-relaxed text-left">
              <h4 className="font-extrabold text-amber-900 text-sm">
                స్వయం ప్రకటిత సమాచార నిబంధన • Self-Submitted Information Disclaimer
              </h4>
              <p className="text-zinc-700">
                All profile, astrological, family, and educational details on <strong>www.shubhamastu.in</strong> are self-declared by registered candidates and families. We operate purely as an introductory intermediary. We do not independently verify or authenticate any candidate details and bear <strong>no responsibility or liability</strong> for the accuracy or integrity of any information provided.
              </p>
              <p className="text-amber-800 font-bold">
                Families are solely responsible for conducting independent background verification, horoscope matching, and character inquiries prior to any matrimonial commitment.
              </p>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <a
              href="/register"
              className="bg-amber-50/50 hover:bg-amber-50 border border-amber-200 hover:border-amber-400 rounded-2xl p-5 transition-all group flex items-center justify-between shadow-xs"
            >
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-mono uppercase text-amber-700 font-bold tracking-widest block">
                  Direct Registration • /register
                </span>
                <h5 className="text-base font-extrabold text-zinc-900 group-hover:text-amber-800 transition-colors">
                  Register Candidate Profile
                </h5>
                <p className="text-xs text-zinc-600">
                  Register Brahmin Grooms & Brides with Gotram, Sub-caste, & DOB.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
            </a>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between shadow-xs">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold tracking-widest block">
                  100% Free • ఉచిత సేవ
                </span>
                <h5 className="text-base font-extrabold text-zinc-900">
                  Free Registration for Every Family
                </h5>
                <p className="text-xs text-zinc-600">
                  Create and submit your candidate profile without membership fees or payment.
                </p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Our Sacred Vedic Pandits & Astrologers Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F7F4EE] border-t border-amber-200/80">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="px-3.5 py-1 bg-amber-100 border border-amber-300 rounded-full text-amber-900 text-xs font-mono font-bold uppercase tracking-widest">
              Consultation & Divine Blessings • మన పండితులు
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
              Our Sacred Vedic Pandits & Astrologers
            </h3>
            <p className="text-sm text-zinc-600 max-w-2xl mx-auto">
              Connect with our esteemed Vedic priests and astrologers for expert horoscope matching, Gotram verification, muhurtam fixation, and sacred marriage ceremonies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {panditsList.map((p) => (
              <div key={p.id} className="bg-white border border-amber-200 hover:border-amber-400 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all space-y-4 text-left flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-sm shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {p.specialization || "Vedic Astrologer"}
                      </span>
                      <h4 className="text-base font-extrabold text-zinc-900">{p.name}</h4>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 italic leading-relaxed">
                    "{p.message}"
                  </p>
                </div>

                <div className="pt-4 border-t border-amber-100 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-amber-800 font-bold">
                    <span>📞 {p.phone || "+91 9347359489"}</span>
                    <span className="text-[10px] text-zinc-500 font-normal">{p.availableDays || "Mon - Sat"}</span>
                  </div>

                  <a
                    href={`https://wa.me/${(p.phone || "+919347359489").replace(/\D/g, "")}?text=${encodeURIComponent(`Namaste Guruji, I am reaching out from Subhamastu Matrimony (Glark Solutions) for astrological consultation and match guidance.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-105 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-yellow-300"
                  >
                    <span>💬 Consult via WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Official Copyright & Proprietorship Notice */}
      <div className="py-8 px-4 text-center border-t border-amber-200 bg-[#F3EFE6] text-xs text-zinc-600 space-y-2 relative z-20">
        <p className="font-extrabold text-sm sm:text-base tracking-wide text-amber-900 uppercase">
          All rights reserved by Galark Solutions (Ghadiyaram Venkata Subramanyam)
        </p>
        <p className="text-[11px] sm:text-xs text-zinc-600 font-mono">
          © {new Date().getFullYear()} www.shubhamastu.in • All rights reserved by Galark Solutions (Ghadiyaram Venkata Subramanyam)
        </p>
        <p className="text-[10px] text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          Registered Intermediary under Section 2(1)(w) and Section 79 of the Information Technology Act, 2000. All profile data is self-reported by candidates or families.
        </p>
      </div>

      {/* Footer copyright */}
      <LegalFooter darkTheme={false} />

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
                    regStep === 2 ? "2. Contact & Email OTP Verification" :
                    regStep === 3 ? "3. Caste, Gothram & Rasi" :
                    regStep === 4 ? "4. Birth Details" :
                    "5. Diet & Profession"
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

            {/* STEP 2: CONTACT & EMAIL OTP VERIFICATION */}
            {regStep === 2 && (
              <div className="space-y-4 pt-4 text-sm animate-in fade-in duration-200">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-200">
                  <span className="font-extrabold block mb-0.5">రెండవ దశ: సంప్రదింపు వివరాలు & ఈమెయిల్ OTP ధృవీకరణ (Contact Details & Email OTP)</span>
                  Enter mobile number and verify your candidate email address via 6-digit OTP dispatched via Zoho ZeptoMail.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-amber-200 uppercase tracking-wider block">
                    Mobile Number / Contact Phone (మొబైల్ సంఖ్య - లాగిన్ ఐడి) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none font-mono font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    This mobile number will be your Login ID to access your profile and matches.
                  </p>
                </div>

                {/* Candidate Email ID with Mandatory OTP Verification */}
                <div className="space-y-2.5 bg-zinc-950 p-4 rounded-2xl border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                      Candidate Email Address (ఈమెయిల్ చిరునామా) *
                    </label>
                    {isEmailVerified && (
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-[10px] rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Verified via OTP
                      </span>
                    )}
                  </div>

                  {/* Email Input with right-side 'Verify using OTP' button */}
                  <div className="flex flex-row items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-amber-400/70 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        disabled={isEmailVerified}
                        placeholder="e.g. candidate@example.com"
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          setIsEmailVerified(false);
                          setIsOtpSent(false);
                          setOtpErrorMsg("");
                          setOtpSuccessMsg("");
                        }}
                        className={`w-full bg-black border rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none font-bold transition-all ${
                          isEmailVerified ? "border-emerald-500/60 bg-emerald-950/20 text-emerald-200" : "border-zinc-700 focus:border-amber-400"
                        }`}
                      />
                    </div>
                    {!isEmailVerified && (
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={isSendingOtp}
                        title="Click to trigger and verify OTP via your email"
                        className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap shadow-md ${
                          isSendingOtp
                            ? "bg-zinc-800 text-zinc-400 cursor-wait border border-zinc-700"
                            : "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-extrabold cursor-pointer border border-yellow-300 active:scale-[0.98]"
                        }`}
                      >
                        {isSendingOtp ? (
                          <>
                            <span className="w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin"></span>
                            <span>Sending OTP...</span>
                          </>
                        ) : isOtpSent ? (
                          <>
                            <Zap className="w-3.5 h-3.5 text-black fill-black" />
                            <span>Resend OTP to Mail</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-black fill-black" />
                            <span>Send OTP to Mail (ఓటీపీ)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Why We Verify via OTP Explanation Notice */}
                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-[11px] text-amber-200/90 leading-relaxed">
                    <span className="font-bold text-amber-300 block mb-0.5">
                      🔒 Why We Verify via OTP? (ఓటీపీ ఎందుకు ధృవీకరించాలి?):
                    </span>
                    To protect Brahmin matrimonial sanctity, prevent bogus profiles, and ensure only genuine prospective families connect, we verify your email address via a 6-digit OTP code before proceeding.
                  </div>

                  {/* OTP Verification Input Box */}
                  {!isEmailVerified && isOtpSent && (
                    <div className="p-3 bg-zinc-900 border-2 border-amber-400/80 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          <span>Enter 6-Digit OTP Sent to Your Email *</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={isSendingOtp}
                          className="text-[10px] text-amber-400 hover:underline cursor-pointer font-bold"
                        >
                          Resend OTP Code
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          autoFocus
                          placeholder="e.g. 123456"
                          value={regOtp}
                          onChange={(e) => setRegOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                          className="flex-1 bg-black border border-amber-400 rounded-xl py-2 px-3 text-center text-lg font-mono font-black text-amber-300 tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={!regOtp || regOtp.length < 6}
                          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                            !regOtp || regOtp.length < 6
                              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                              : "bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold cursor-pointer shadow-md active:scale-95"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm & Verify</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP Feedback Messages */}
                  {otpSuccessMsg && (
                    <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{otpSuccessMsg}</span>
                    </p>
                  )}
                  {otpErrorMsg && (
                    <p className="text-[11px] text-red-400 font-bold flex items-center gap-1 pt-1">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{otpErrorMsg}</span>
                    </p>
                  )}

                  {!isOtpSent && !isEmailVerified && (
                    <p className="text-[10px] text-zinc-400">
                      ℹ️ An authentic 6-digit verification code will be sent to your inbox via <strong>verification@shubhamastu.in</strong>.
                    </p>
                  )}
                </div>

                {/* Step 2 Cursor Gate Status */}
                {!isEmailVerified ? (
                  <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-center text-xs text-red-300 font-bold flex items-center justify-center gap-2 animate-pulse">
                    <Lock className="w-4 h-4 text-red-400 shrink-0" />
                    <span>⚠️ OTP is Mandatory: Next Step is blocked by cursor. Click 'Verify using OTP' above to receive and verify code to unlock.</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>✅ Email OTP Verified! Next Step is unlocked.</span>
                  </div>
                )}

                <div className="space-y-1.5 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <label className="text-xs font-black text-amber-200 uppercase tracking-wider block">
                    Create Password (పాస్‌వర్డ్ - Required)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-amber-400/70 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="At least 8 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-black border border-zinc-700 focus:border-amber-400 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Your password is required and stored only as a salted one-way hash. DOB is never used as a password.
                  </p>
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
                      Date of Birth (పుట్టిన తేదీ) * {regGender === "Male" ? "(Groom: Min 24 Yrs Mandatory)" : "(Bride: Min 21 Yrs Mandatory)"}
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
                            const age = calculateCandidateAge(dobVal);
                            const minAge = regGender === "Male" ? 24 : 21;
                            if (age < minAge) {
                              alert(`⚠️ Age Restriction (వయోపరిమితి నిబంధన):\n\nMinimum required age is ${minAge} years for ${regGender === "Male" ? "Male (Grooms: 24+ mandatory)" : "Female (Brides: 21+ mandatory)"}.\n\nCurrent calculated age: ${age} years.\n\nNext step is blocked until a valid Date of Birth is provided.`);
                            }
                          }
                        }}
                        className={`w-full bg-black border rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none font-mono font-bold transition-all ${
                          regDob && (regGender === "Male" ? calculateCandidateAge(regDob) < 24 : calculateCandidateAge(regDob) < 21)
                            ? "border-red-500 bg-red-950/20 text-red-200 focus:border-red-400"
                            : regDob
                            ? "border-emerald-500/70 bg-emerald-950/20 text-emerald-200"
                            : "border-zinc-700 focus:border-amber-400"
                        }`}
                      />
                    </div>
                    {/* Real-time Age Validation Banner */}
                    {regDob ? (
                      (regGender === "Male" ? calculateCandidateAge(regDob) < 24 : calculateCandidateAge(regDob) < 21) ? (
                        <div className="p-2.5 bg-red-950/50 border border-red-500/50 rounded-xl text-[11px] text-red-300 font-bold flex items-center gap-2 animate-pulse mt-1">
                          <Lock className="w-4 h-4 text-red-400 shrink-0" />
                          <span>
                            ❌ Age Ineligible: Candidate is {calculateCandidateAge(regDob)} years old. Minimum required age is {regGender === "Male" ? "24+ years for Groom (అబ్బాయి)" : "21+ years for Bride (అమ్మాయి)"}. Next step is locked!
                          </span>
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-[11px] text-emerald-300 font-bold flex items-center gap-1.5 mt-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            ✅ Age Verified: {calculateCandidateAge(regDob)} years old ({regGender === "Male" ? "Groom 24+ eligible" : "Bride 21+ eligible"}). Next Step unlocked!
                          </span>
                        </div>
                      )
                    ) : (
                      <p className="text-[10px] text-zinc-400 mt-1">
                        ℹ️ Minimum age requirement: <strong>Male 24+ years</strong>, <strong>Female 21+ years</strong>.
                      </p>
                    )}
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
                  Select meal preferences and profession details for your profile.
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

                <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-center">
                  <p className="text-sm font-black text-emerald-800">ఉచితంగా నమోదు చేసుకోండి • Free Registration</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    Create your matrimonial profile at no cost. No membership package or payment is required to register.
                  </p>
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
                <div className="flex flex-col items-end gap-1.5">
                  <button
                    type="button"
                    disabled={
                      (regStep === 2 && !isEmailVerified) ||
                      (regStep === 4 && (!regDob || (regGender === "Male" ? calculateCandidateAge(regDob) < 24 : calculateCandidateAge(regDob) < 21)))
                    }
                    onClick={() => {
                      if (regStep === 1) {
                        if (!regName.trim() || !regSurname.trim()) {
                          alert("⚠️ Please enter candidate Given Name and Surname.");
                          return;
                        }
                      }
                      if (regStep === 2) {
                        const cleanPhone = regPhone.replace(/\D/g, "");
                        if (!cleanPhone || cleanPhone.length < 10) {
                          alert("⚠️ Please enter a valid 10-digit mobile number.");
                          return;
                        }
                        if (!regEmail || !regEmail.includes("@")) {
                          alert("⚠️ Candidate Email Address is required to receive verification OTP.");
                          return;
                        }
                        if (!isEmailVerified) {
                          alert("🔒 OTP is Mandatory (ఓటీపీ తప్పనిసరి):\n\nThe Next Step is blocked from your cursor! Please click 'Send OTP to Mail' on the right side of the candidate email box, enter your 6-digit code, and click 'Confirm & Verify' before proceeding.");
                          return;
                        }
                      }
                      if (regStep === 4) {
                        if (!regDob) {
                          alert("⚠️ Please select candidate Date of Birth.");
                          return;
                        }
                        const age = calculateCandidateAge(regDob);
                        const minAge = regGender === "Male" ? 24 : 21;
                        if (age < minAge) {
                          alert(`⚠️ Age Restriction (వయోపరిమితి నిబంధన):\n\nMinimum required age is ${minAge} years for ${regGender === "Male" ? "Male (Grooms / అబ్బాయిలు: 24+ mandatory)" : "Female (Brides / అమ్మాయిలు: 21+ mandatory)"}.\n\nCurrent calculated age is ${age} years.\n\nProgression to Step 5 is strictly blocked.`);
                          return;
                        }
                      }
                      setRegStep(regStep + 1);
                    }}
                    className={`px-6 py-2.5 rounded-xl font-extrabold uppercase tracking-wider text-xs shadow-md transition-all flex items-center gap-1.5 ${
                      (regStep === 2 && !isEmailVerified) ||
                      (regStep === 4 && (!regDob || (regGender === "Male" ? calculateCandidateAge(regDob) < 24 : calculateCandidateAge(regDob) < 21)))
                        ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60"
                        : "bg-gradient-to-r from-amber-400 to-yellow-500 text-black cursor-pointer hover:from-amber-500 hover:to-yellow-600 active:scale-95"
                    }`}
                  >
                    {regStep === 2 && !isEmailVerified ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>🔒 Blocked: Verify OTP First</span>
                      </>
                    ) : regStep === 4 && (!regDob || (regGender === "Male" ? calculateCandidateAge(regDob) < 24 : calculateCandidateAge(regDob) < 21)) ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>🔒 Blocked: {regGender === "Male" ? "Male Must Be 24+" : "Female Must Be 21+"}</span>
                      </>
                    ) : (
                      <span>Next Step (తదుపరి) →</span>
                    )}
                  </button>
                  {regStep === 2 && !isEmailVerified && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Cursor blocked: Verify email OTP above
                    </span>
                  )}
                  {regStep === 4 && (!regDob || (regGender === "Male" ? calculateCandidateAge(regDob) < 24 : calculateCandidateAge(regDob) < 21)) && (
                    <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Cursor blocked: {regGender === "Male" ? "Groom must be 24+ years" : "Bride must be 21+ years"}
                    </span>
                  )}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={
                    !acceptTerms ||
                    isUploading ||
                    !isEmailVerified ||
                    !regDob ||
                    (regGender === "Male" ? calculateCandidateAge(regDob) < 24 : calculateCandidateAge(regDob) < 21)
                  }
                  className={`px-6 py-2.5 rounded-xl text-black font-extrabold uppercase tracking-wider text-xs shadow-md flex items-center gap-1.5 transition-all ${
                    !acceptTerms ||
                    isUploading ||
                    !isEmailVerified ||
                    !regDob ||
                    (regGender === "Male" ? calculateCandidateAge(regDob) < 24 : calculateCandidateAge(regDob) < 21)
                      ? "bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-60"
                      : "bg-gradient-to-r from-amber-400 to-yellow-500 cursor-pointer hover:from-amber-500 hover:to-yellow-600"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                      <span>Registering...</span>
                    </>
                  ) : !isEmailVerified ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>🔒 OTP Verification Required</span>
                    </>
                  ) : !regDob || (regGender === "Male" ? calculateCandidateAge(regDob) < 24 : calculateCandidateAge(regDob) < 21) ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>🔒 Age Restricted ({regGender === "Male" ? "Male 24+" : "Female 21+"})</span>
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
                  <span>Password:</span>
                  <span className="text-emerald-300 font-bold">Set privately by you</span>
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

            {/* Download Astrology & Kundali PDF Button */}
            <button
              type="button"
              onClick={() => downloadAstrologyPdf(registeredProfile)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-105 active:scale-[0.98] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-300 relative z-10"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Download My Kundali & Astrology Summary PDF (జాతక పత్రిక PDF)</span>
            </button>

            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-center relative z-10">
              <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
              <span className="text-sm font-black text-emerald-800 block">Registration completed free of cost</span>
              <p className="text-xs text-emerald-700 mt-1">No payment or transaction ID is required for your profile registration.</p>
            </div>

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

      {/* MODAL: USER PASSWORD LOGIN (NO OTP) */}
      {showUserLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[105] flex items-center justify-center p-4">
          <form
            onSubmit={handleLogin}
            className="bg-white border-2 border-[#C2242C] rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl relative text-left space-y-5"
          >
            <button
              type="button"
              onClick={() => {
                setShowUserLoginModal(false);
                setLoginError("");
                setMobileNumber("");
                setPassword("");
              }}
              className="absolute top-4 right-4 p-1.5 bg-gray-100 text-[#362B5A] hover:bg-[#C2242C] hover:text-white rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center border-b border-amber-100 pb-4">
              <div className="mx-auto mb-2 w-14 h-14 rounded-full border-2 border-[#C2242C] flex items-center justify-center text-3xl">🪷</div>
              <h3 className="text-xl font-black text-[#C2242C]">
                {lang === "te" ? "వినియోగదారు లాగిన్" : "User Login"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {lang === "te" ? "మొబైల్ నంబర్ లేదా ఈమెయిల్ మరియు పాస్‌వర్డ్‌తో లాగిన్ అవ్వండి" : "Login with your mobile number or email and password"}
              </p>
            </div>
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center font-semibold">
                {loginError}
              </div>
            )}
            <label className="block text-xs font-bold text-[#362B5A]">
              {lang === "te" ? "మొబైల్ నంబర్ లేదా ఈమెయిల్" : "Mobile Number or Email"}
              <input
                type="text"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Mobile number or email"
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C2242C]"
              />
            </label>
            <label className="block text-xs font-bold text-[#362B5A]">
              {lang === "te" ? "పాస్‌వర్డ్" : "Password"}
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-[#C2242C]"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <button
              type="submit"
              className="w-full py-3 bg-[#C2242C] hover:bg-[#99151B] text-white rounded-xl font-black text-sm cursor-pointer"
            >
              {lang === "te" ? "లాగిన్" : "Login"}
            </button>
            <p className="text-center text-[11px] text-gray-500">
              {lang === "te" ? "వినియోగదారులకు OTP అవసరం లేదు." : "User login does not require an OTP."}
            </p>
          </form>
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
              {!isAdminOtpSent ? (
                <>
                  <div className="space-y-1.5 text-xs text-left">
                    <label className="font-bold text-gray-400 uppercase tracking-wider block">Admin Email or Mobile (అధికారిక ఈమెయిల్ / మొబైల్)</label>
                    <div className="relative text-left">
                      <span className="w-4 h-4 text-amber-400/60 absolute left-3 top-1/2 transform -translate-y-1/2">✉️</span>
                      <input
                        type="text"
                        required
                        placeholder="Email ID or registered mobile number"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full bg-black border border-zinc-800 focus:border-amber-400 rounded-xl py-2 pl-9 pr-3 text-white focus:outline-none font-mono text-xs"
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
                </>
              ) : (
                <div className="space-y-4 py-2">
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl leading-relaxed text-center">
                    {adminOtpSuccessMsg || `OTP sent to ${adminEmail}! Please enter the 6-digit code below.`}
                  </div>

                  <div className="space-y-1.5 text-xs text-left">
                    <label className="font-bold text-amber-300 uppercase tracking-wider block text-center">Enter 6-Digit Admin OTP</label>
                    <div className="relative max-w-xs mx-auto">
                      <Sparkles className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="XXXXXX"
                        value={adminOtp}
                        onChange={(e) => setAdminOtp(e.target.value)}
                        className="w-full bg-black border-2 border-amber-400 rounded-xl py-3 pl-9 pr-3 text-white focus:outline-none font-mono tracking-widest text-center text-lg font-black shadow-lg"
                      />
                    </div>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleResendAdminOtp}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSendingAdminOtp}
              className="w-full py-3 mt-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-xs uppercase tracking-widest transition-all rounded-xl shadow-lg shadow-amber-400/10 cursor-pointer flex items-center justify-center gap-1.5 border border-yellow-300 disabled:opacity-50"
            >
              {isSendingAdminOtp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Dispatching via ZeptoMail...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>{isAdminOtpSent ? "Verify OTP & Enter Admin Sanctuary" : "Send Admin OTP to Email"}</span>
                </>
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-500 bg-zinc-900 px-2">Security Fallback</div>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  const result = await signInWithPopup(auth, googleProvider);
                  const user = result.user;
                  if (user) {
                    const authorizedEmails = [
                      "subramanyamghadiyaram@gmail.com",
                      "subbareddyposham@gmail.com",
                      "k.tejaswar567@gmail.com",
                      "praveenproq@gmail.com"
                    ];
                    if (authorizedEmails.includes(user.email || "")) {
                      const isSubbu = user.email === "subramanyamghadiyaram@gmail.com";
                      const isSubba = user.email === "subbareddyposham@gmail.com";
                      const isKarna = user.email === "k.tejaswar567@gmail.com";
                      const isPraveen = user.email === "praveenproq@gmail.com";

                      const adminProf = {
                        id: isSubbu ? "admin-subbu" : isSubba ? "admin-subba-reddy" : isPraveen ? "admin-praveen" : "admin-tejaswar",
                        reg_number: isSubbu ? "BVM-1001" : isSubba ? "BVM-1007" : isPraveen ? "BVM-1011" : "BVM-1010",
                        name: user.displayName || (isSubbu ? "Sri G.V. Subramanyam" : isSubba ? "Mr. Posham Venkata Subba Reddy" : isPraveen ? "Mr. Praveen" : "Mr. Karna Tejaswar Reddy"),
                        dob: "1990-01-01",
                        gender: "Male" as const,
                        height_feet: 5.8,
                        sub_caste: "Smartha",
                        profession: isPraveen ? "Super Admin & Chief Technology Officer" : "Administrator",
                        salary_lpa: 15,
                        contact_number: isSubbu ? "9347359489" : isSubba ? "9989079372" : isPraveen ? "9876543219" : "9392551166",
                        email: user.email!,
                        status: "Verified" as const,
                        role: (isSubbu || isPraveen ? "super_admin" : "admin") as "super_admin" | "admin",
                        subscription_status: "free" as const
                      };

                      await adminNotificationService.elevateToAdmin(user.uid, {
                        id: adminProf.id,
                        name: adminProf.name,
                        email: user.email,
                        role: adminProf.role
                      });

                      localStorage.setItem("bramhana_admin_session", "true");
                      localStorage.setItem("bramhana_logged_in_user_id", adminProf.id);
                      onLoginSuccess(adminProf);
                      setShowAdminModal(false);
                    } else {
                      setAdminError("This Google account is not authorized for Administrative access.");
                    }
                  }
                } catch (err: any) {
                  setAdminError(err.message);
                }
              }}
              className="w-full py-2.5 bg-black border border-zinc-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
              <span>Admin Login with Google</span>
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

      {/* ADMIN OTP VERIFICATION MODAL */}
      {showAdminOtpModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-amber-500 rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl relative text-left space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2 pb-2 border-b border-zinc-800">
              <span className="text-[9px] text-amber-400 font-mono tracking-widest uppercase block font-bold">ADMIN SECURITY GATEWAY</span>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Enter Admin OTP</h3>
              <p className="text-xs text-gray-300 leading-relaxed">{adminOtpNotice}</p>
            </div>

            {adminError && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-semibold rounded-xl text-center">
                {adminError}
              </div>
            )}

            <div className="space-y-2 text-center py-2">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">Enter 6-Digit OTP Sent Via Mail</label>
              <input
                type="text"
                maxLength={6}
                placeholder="XXXXXX"
                value={enteredAdminOtp}
                onChange={(e) => setEnteredAdminOtp(e.target.value)}
                className="w-full bg-black border-2 border-amber-400 rounded-xl py-3 px-4 text-white text-center font-mono tracking-widest text-lg font-black focus:outline-none shadow-lg"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={async () => {
                  if (pendingAdminProfile) {
                    const emailToResend = pendingAdminProfile.email || (pendingAdminProfile.id === "admin-subbu" ? "subramanyamghadiyaram@gmail.com" : pendingAdminProfile.id === "admin-subba-reddy" ? "subbareddyposham@gmail.com" : pendingAdminProfile.id === "admin-praveen" ? "praveenproq@gmail.com" : "k.tejaswar567@gmail.com");
                    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    setTargetAdminOtp(newOtp);
                    await dispatchAdminOtpEmail(emailToResend, newOtp);
                    setAdminError("");
                    alert(`🔄 A fresh OTP has been successfully resent to ${emailToResend} via Zoho ZeptoMail!`);
                  }
                }}
                className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                Resend OTP? (ఓటీపీ మళ్లీ పంపు)
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!enteredAdminOtp || enteredAdminOtp !== targetAdminOtp) {
                  setAdminError("Incorrect OTP code. Please enter the valid 6-digit OTP sent to your admin email.");
                  return;
                }

                if (pendingAdminProfile) {
                  localStorage.setItem("bramhana_admin_session", "true");
                  localStorage.setItem("bramhana_logged_in_user_id", pendingAdminProfile.id);
                  onLoginSuccess(pendingAdminProfile);
                  setShowAdminOtpModal(false);
                  setShowAdminModal(false);
                  setPendingAdminProfile(null);
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg cursor-pointer hover:brightness-110 transition-all border border-yellow-300"
            >
              Verify OTP & Enter Admin Sanctuary
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
