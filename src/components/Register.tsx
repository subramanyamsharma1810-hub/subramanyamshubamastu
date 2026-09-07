import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { databaseService } from "../lib/databaseService";
import { Profile } from "../types";
import { BRAHMIN_SUB_CASTES } from "../lib/brahminMetadata";
import PhonePeQRCode from "./PhonePeQRCode";
import { 
  Heart, 
  Sparkles, 
  Calendar, 
  User, 
  Phone, 
  Lock, 
  Mail, 
  Briefcase, 
  MapPin, 
  CheckCircle2, 
  ShieldAlert, 
  CreditCard,
  ArrowRight,
  Home
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [surname, setSurname] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [dob, setDob] = useState("");
  const [gothram, setGothram] = useState("");
  const [subCaste, setSubCaste] = useState("Vaidiki Velanadu");
  const [heightFeet, setHeightFeet] = useState<number>(5.8);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [education, setEducation] = useState("");
  const [profession, setProfession] = useState("");
  const [salaryLpa, setSalaryLpa] = useState<number>(12);
  const [currentCity, setCurrentCity] = useState("Hyderabad");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");

  // Payment choice
  const [planChoice, setPlanChoice] = useState<"free" | "paid_100" | "paid_900">("paid_100");
  const [utrNumber, setUtrNumber] = useState("");
  const [referralCode, setReferralCode] = useState("");

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref") || params.get("referral") || params.get("referrer");
      if (ref) {
        setReferralCode(ref.toUpperCase().trim());
      }
    } catch (_) {}
  }, []);

  const [loading, setLoading] = useState(false);
  const [registeredProfile, setRegisteredProfile] = useState<Profile | null>(null);

  const calculateAge = (dobString: string): number => {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!surname.trim() || !name.trim()) {
      alert("Please enter Surname and Given Name.");
      return;
    }
    if (!dob) {
      alert("Please select Date of Birth.");
      return;
    }
    const age = calculateAge(dob);
    const minAge = gender === "Male" ? 24 : 21;
    if (age < minAge - 1) {
      alert(`Minimum registration age is ${minAge} years for ${gender === "Male" ? "Grooms" : "Brides"}. Current age: ${age} years.`);
      return;
    }
    if (!gothram.trim()) {
      alert("Please enter Gotram.");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password.trim() || password.length < 4) {
      alert("Please enter a password of at least 4 characters.");
      return;
    }

    setLoading(true);
    try {
      const regId = `BVM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanPhone = phone.replace(/\D/g, "");

      const isPaid = planChoice !== "free" && utrNumber.trim().length > 0;
      const subStatus = isPaid ? planChoice : "free";

      const newCandidate: Profile = {
        id: `prof-${Date.now()}`,
        reg_number: regId,
        surname: surname.trim(),
        name: `${surname.trim()} ${name.trim()}`,
        gender,
        dob,
        gothram: gothram.trim(),
        sub_caste: subCaste,
        height_feet: heightFeet,
        contact_number: cleanPhone,
        email: email.trim() || undefined,
        password: password.trim(),
        education: education.trim() || "Graduate",
        profession: profession.trim() || "Private Sector",
        salary_lpa: salaryLpa,
        current_city: currentCity.trim() || "Hyderabad",
        father_name: fatherName.trim(),
        mother_name: motherName.trim(),
        status: "Active",
        subscription_status: subStatus,
        payment_received: isPaid,
        fee_transaction_id: isPaid ? utrNumber.trim() : undefined,
        fee_received_by: isPaid ? "Automated Gateway" : undefined,
        fee_received_at: isPaid ? new Date().toISOString() : undefined,
        created_at: new Date().toISOString(),
      };

      const saved = await databaseService.saveProfile(newCandidate);
      setRegisteredProfile(saved);
      // Automatically log them in
      localStorage.setItem("bramhana_logged_in_user_id", saved.id);

      // Attribute referral if invite code was provided
      if (referralCode.trim()) {
        try {
          await fetch("/api/referrals/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              referrerCode: referralCode.trim().toUpperCase(),
              refereeId: saved.id,
              name: saved.name,
              phone: cleanPhone,
              email: saved.email || ""
            })
          });
        } catch (refErr) {
          console.warn("Failed to attribute referral code:", refErr);
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-gray-100 flex flex-col justify-between font-sans">
      {/* Navigation Header */}
      <header className="border-b border-amber-500/20 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
            </div>
            <div>
              <div className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                Shubhamastu Matrimony
              </div>
              <div className="text-[10px] text-amber-400 font-mono">www.shubhamastu.in • Brahmin Matrimony</div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-bold text-gray-300 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <Link
              to="/pay"
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-extrabold rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Automated Pay Desk</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Registration Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 w-full">
        {registeredProfile ? (
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-amber-400 tracking-widest">
                విజయవంతంగా నమోదు చేయబడింది • Registration Successful
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {registeredProfile.name}
              </h2>
              <p className="text-sm text-gray-300 max-w-md mx-auto">
                Your sacred profile has been registered in the Shubhamastu Brahmin Registry.
              </p>
            </div>

            {/* Sacred Reg Badge */}
            <div className="p-4 bg-amber-500/10 border-2 border-amber-400/60 rounded-2xl max-w-sm mx-auto space-y-1">
              <span className="text-[10px] text-amber-300 font-mono uppercase font-bold tracking-widest">
                SACRED REGISTRATION NUMBER
              </span>
              <div className="text-2xl font-black text-amber-200 font-mono tracking-wider">
                {registeredProfile.reg_number}
              </div>
            </div>

            {/* Status note */}
            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl max-w-lg mx-auto text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span>Account Status:</span>
                <span className="font-bold text-emerald-400">Active Profile</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Subscription Tier:</span>
                <span className="font-bold text-amber-300">
                  {registeredProfile.subscription_status === "paid_900" 
                    ? "👑 ₹900 Premium Tier (Full Access)" 
                    : registeredProfile.subscription_status === "paid_100" 
                    ? "💳 ₹100 Match Registered" 
                    : "🆓 Free (Pay to View Matches)"}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Gotram:</span>
                <span className="font-bold text-white">{registeredProfile.gothram}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Link
                to="/"
                className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
              >
                <span>Go to Member Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {registeredProfile.subscription_status === "free" && (
                <Link
                  to="/pay"
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-500/30 transition-all flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Activate Payment Desk</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-b from-zinc-900/90 to-black/90 border border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-mono font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Brahmin Candidate Registration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Register New Brahmin Candidate
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
                Strict Vedic Matchmaking based strictly on <strong className="text-amber-300">Different Gothras</strong> and <strong className="text-amber-300">Groom 1 to 3 Years Elder than Bride</strong>.
              </p>
            </div>

            {/* Disclaimer notice */}
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block text-amber-300">Self-Submitted Information Notice:</strong>
                <span>
                  All candidate and astrological details on www.shubhamastu.in are strictly self-submitted by families. We do not verify or certify any credentials and are not responsible for information provided. Families are advised to independently cross-check all details.
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Gender selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Candidate Gender (లింగం)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender("Male")}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      gender === "Male"
                        ? "bg-amber-500 text-black border-amber-400 shadow-md"
                        : "bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700"
                    }`}
                  >
                    Groom (వరుడు)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("Female")}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      gender === "Female"
                        ? "bg-amber-500 text-black border-amber-400 shadow-md"
                        : "bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700"
                    }`}
                  >
                    Bride (వధువు)
                  </button>
                </div>
              </div>

              {/* Name Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Surname (ఇంటి పేరు) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ఘడియారం (Ghadiyaram)"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Given Name (పేరు) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. సాయి కృష్ణ (Sai Krishna)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Gotram & Subcaste */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Gotram (గోత్రం) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kasyapa, Harithasa, Bharadwaja"
                    value={gothram}
                    onChange={(e) => setGothram(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Sub-caste (శాఖ) *</label>
                  <select
                    value={subCaste}
                    onChange={(e) => setSubCaste(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    {BRAHMIN_SUB_CASTES.map((c) => (
                      <option key={c.id} value={c.labelEn}>{c.labelEn}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DOB & Height */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Date of Birth (పుట్టిన తేదీ) *</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                  {dob && (
                    <span className="text-[11px] text-amber-300 block font-mono">
                      Calculated Age: {calculateAge(dob)} years
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Height (అడుగులు/Ft)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="4.5"
                    max="6.8"
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(parseFloat(e.target.value) || 5.6)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Contact & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Mobile Number (ఫోన్ సంఖ్య) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Email ID (ఐచ్చికం)</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Create Password (పాస్‌వర్డ్) *</label>
                  <input
                    type="password"
                    required
                    placeholder="At least 4 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Career & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Education (విద్యార్హత)</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech / MBA / MS"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Profession (ఉద్యోగం)</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer / Bank Manager"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">City (ప్రస్తుత నివాసం)</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad / Bengaluru"
                    value={currentCity}
                    onChange={(e) => setCurrentCity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Referral Code (Rule of 6 Engine) */}
              <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-amber-500/5 p-4 rounded-2xl border border-amber-500/20 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Referral Code (స్నేహితుని ఆహ్వాన కోడ్ - Optional)
                  </label>
                  <span className="text-[10px] font-mono text-gray-400">Rule of 6 Reward Engine</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. SUB1234 or FRIEND_CODE"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase().trim())}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white uppercase font-mono tracking-wider focus:outline-none focus:border-amber-400"
                  />
                  {referralCode && (
                    <button
                      type="button"
                      onClick={() => setReferralCode("")}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs rounded-xl"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">
                  Entering your friend's referral code attributes your membership to them and qualifies them for the ₹800/mo loyalty renewal tier upon reaching 6 referrals.
                </p>
              </div>

              {/* Automated Payment Selection */}
              <div className="border-t border-zinc-800 pt-6 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    Automated Registration & Fee Activation
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    INSTANT ACTIVATION
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    onClick={() => setPlanChoice("paid_100")}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      planChoice === "paid_100"
                        ? "bg-amber-500/10 border-amber-400 shadow-sm"
                        : "bg-zinc-950 border-zinc-800 text-gray-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-extrabold text-white">Match Fee</span>
                      <span className="text-xs font-mono font-black text-amber-400">₹100</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Instantly unlocks Brahmin opposite-gender matches and coordinates.
                    </p>
                  </label>

                  <label
                    onClick={() => setPlanChoice("paid_900")}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      planChoice === "paid_900"
                        ? "bg-amber-500/10 border-amber-400 shadow-sm"
                        : "bg-zinc-950 border-zinc-800 text-gray-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-extrabold text-white">Full Upgrade</span>
                      <span className="text-xs font-mono font-black text-amber-400">₹900</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Unlocks direct phone contacts, Kundali docs, and instant WhatsApp chat.
                    </p>
                  </label>

                  <label
                    onClick={() => setPlanChoice("free")}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      planChoice === "free"
                        ? "bg-amber-500/10 border-amber-400 shadow-sm"
                        : "bg-zinc-950 border-zinc-800 text-gray-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-extrabold text-white">Free Tier</span>
                      <span className="text-xs font-mono font-black text-gray-400">₹0</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Profile registered in registry; matches require ₹100 fee activation.
                    </p>
                  </label>
                </div>

                {/* If paid plan chosen, show UPI QR and UTR input */}
                {planChoice !== "free" && (
                  <div className="p-4 bg-zinc-950 border border-amber-500/25 rounded-2xl space-y-4">
                    <div className="text-center space-y-1">
                      <span className="text-[10px] text-amber-400 font-mono tracking-widest uppercase block font-bold">
                        Scan with PhonePe / GPay / Paytm / BHIM
                      </span>
                      <p className="text-xs text-zinc-300">
                        Amount to Pay: <strong className="text-amber-300">{planChoice === "paid_100" ? "₹100" : "₹900"}</strong> to Sri G.V. Subramanyam (UPI: 9347359489@ybl)
                      </p>
                    </div>

                    <div className="max-w-xs mx-auto">
                      <PhonePeQRCode amount={planChoice === "paid_100" ? 100 : 900} className="w-full shadow-md" />
                    </div>

                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
                        Enter 12-digit UPI UTR / Transaction ID (Automated Instant Verification)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 523489127890"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ""))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 px-3 text-xs text-white text-center font-mono tracking-widest uppercase focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-[9px] text-emerald-400 block text-center">
                        ⚡ Payment will be automatically activated upon submission!
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Acceptance */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    defaultChecked
                    className="mt-1 w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-amber-400"
                  />
                  <span className="text-xs text-gray-300 leading-relaxed">
                    I agree to the <Link to="/terms" target="_blank" className="text-amber-400 underline font-semibold">Terms of Service</Link> (shubhamastu.in/terms) and the <Link to="/refund" target="_blank" className="text-emerald-400 underline font-semibold">Cancellation & Refund Policy</Link> (shubhamastu.in/refund). I acknowledge that Shubhamastu.in operates strictly as an intermediary under Section 79 of the IT Act 2000, does not perform background verification, and our family assumes full responsibility for independent inquiries.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-black font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Registering Sacred Profile..." : "Complete Candidate Registration"}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500 space-y-2">
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs font-medium">
          <Link to="/terms" className="text-amber-400/90 hover:underline">
            Terms (/terms)
          </Link>
          <span>•</span>
          <Link to="/refund-policy" className="text-emerald-400/90 hover:underline">
            Refund Policy (/refund-policy)
          </Link>
          <span>•</span>
          <Link to="/grievance" className="text-rose-400/90 hover:underline">
            Grievance Redressal (/grievance)
          </Link>
          <span>•</span>
          <Link to="/" className="text-gray-400 hover:text-white">
            Home
          </Link>
          <span>•</span>
          <Link to="/pay" className="text-gray-400 hover:text-white">
            Payment & Activation
          </Link>
        </div>
        <p>© {new Date().getFullYear()} Shubhamastu Brahmin Matrimony (www.shubhamastu.in) • Glark Solutions. All rights reserved.</p>
        <p className="text-[10px] text-zinc-600">
          Strict 2-Rule Matching: Different Gotras & Groom 1 to 3 Years Elder. All candidate information is self-submitted.
        </p>
      </footer>
    </div>
  );
}
