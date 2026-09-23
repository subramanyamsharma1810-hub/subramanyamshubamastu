import React, { useState, useEffect } from "react";
import { Profile, PartnerPreferences, Grievance } from "../types";
import { databaseService } from "../lib/databaseService";
import PhonePeQRCode from "./PhonePeQRCode";
import { getGenderLabel } from "../lib/genderHelper";
import { calculateMatchScore } from "../lib/matchEngine";
import { NAKSHATRAS } from "../lib/panchangam";
import { StackCard } from "./StackCard";
import { PandithConsultationModal } from "./PandithConsultationModal";
import { AnimatePresence, motion } from "motion/react";
import {
  Heart,
  Compass,
  Briefcase,
  MapPin,
  Calendar,
  Lock,
  Phone,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  Award,
  Copy,
  Check,
  UploadCloud,
  AlertCircle,
  ShieldCheck,
  Layers,
  LayoutGrid
} from "lucide-react";

interface MatchListProps {
  currentProfile: Profile;
  preferences: PartnerPreferences | null;
  onUpdateProfile: (updatedProfile: Profile) => Promise<void>;
}

export default function MatchList({ currentProfile, preferences, onUpdateProfile }: MatchListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "stack">("grid");
  const [localSwiped, setLocalSwiped] = useState<Record<string, "left" | "right">>({});
  const [mutualMatch, setMutualMatch] = useState<Profile | null>(null);

  const getNakshatraTelugu = (engName: string): string => {
    if (!engName) return "";
    const found = NAKSHATRAS.find(n => n.english.toLowerCase() === engName.toLowerCase());
    return found ? found.telugu : engName;
  };

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Profile | null>(null);
  const [unlockedContacts, setUnlockedContacts] = useState<Record<string, boolean>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showMatchCountModal, setShowMatchCountModal] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [copySuccess, setCopySuccess] = useState<"phone" | "upi" | null>(null);

  const [showPandithModal, setShowPandithModal] = useState(false);
  const [meetDateTarget, setMeetDateTarget] = useState<Profile | null>(null);
  const [pelliChupuluTarget, setPelliChupuluTarget] = useState<Profile | null>(null);
  const [meetDateForm, setMeetDateForm] = useState({ date: "", time: "11:00 AM", location: "Temple Premises / Family Lounge", note: "" });
  const [pelliChupuluForm, setPelliChupuluForm] = useState({ date: "", venue: "Bride's Residence / Function Hall", note: "" });
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // IT Act 2021 Case-handling state
  const [reportingMatch, setReportingMatch] = useState<Profile | null>(null);
  const [reportCategory, setReportCategory] = useState<"Harassment/Unwanted Calls" | "Fake Profile" | "Incorrect Information" | "Misuse of Contact Details" | "Other">("Harassment/Unwanted Calls");
  const [reportDesc, setReportDesc] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccessId, setReportSuccessId] = useState<string | null>(null);

  // Platform Safety Scrolling Banner Messages (IT Act 2021 Compliance)
  const safetyWarnings = [
    {
      title: "DO NOT MISBEHAVE • గౌరవంగా ప్రవర్తించండి",
      text: "Do not harass or misbehave with other matched profiles. Any harassment is a punishable offense. అభ్యర్థులతో అసభ్యంగా ప్రవర్తిస్తే మీ ప్రొఫైల్ తక్షణమే నిలిపివేయబడుతుంది.",
      icon: "🚨"
    },
    {
      title: "CYBERCRIME ESCALATION • సైబర్ నేరాల హెచ్చరిక",
      text: "Using fake salaries, forged credentials, or invalid IDs will lead to lifetime ban and escalation to cybercrime.gov.in. తప్పుడు వివరాలు సమర్పిస్తే సైబర్ క్రైమ్ పోలీసులకు సమాచారం ఇవ్వబడుతుంది.",
      icon: "⚖️"
    },
    {
      title: "WE WILL HELP YOU COMPLAINT • మేము సహాయం చేస్తాము",
      text: "If you face any fraud, financial cheating, or abuse, our Safety Desk will actively assist and guide you in filing an official Cybercrime police report. బాధితులకు మా సంస్థ పూర్తి సహాయం అందిస్తుంది.",
      icon: "🤝"
    },
    {
      title: "RISE GRIEVANCE CELL TICKET • గ్రీవెన్స్ సెల్",
      text: "Facing unwanted calls, harassment, or fake details? Rise an immediate safety ticket in our online Grievance Cell. Chief Registrars resolve issues within 24 hours. ఏదైనా సమస్య ఉంటే వెంటనే ఫిర్యాదు చేయండి.",
      icon: "📥"
    },
    {
      title: "SACRED BRAHMIN INTEGRITY • వివాహ పవిత్రత",
      text: "We host a sacred, clean registry of Brahmin families. Keep all communications respectful, descent, and safe. కుటుంబ సభ్యుల పరువు ప్రతిష్టలు కాపాడటం మన అందరి బాధ్యత.",
      icon: "📿"
    },
    {
      title: "CHIEF REGISTRAR MONITORING • నిర్వాహకుల నిఘా",
      text: "Grievances are personally reviewed and resolved by Sri G.V. Subramanyam (Chief Registrar) & Sri P.V. Subba Reddy. మీ ఫిర్యాదులపై నిర్వాహకులు స్వయంగా శ్రద్ధ తీసుకుంటారు.",
      icon: "👑"
    }
  ];

  const [activeSafetyIdx, setActiveSafetyIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSafetyIdx((prev) => (prev + 1) % safetyWarnings.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadMatches() {
      setLoading(true);
      try {
        const allProfiles = await databaseService.getProfiles();
        // Filter out own profile and admin profiles securely
        const matches = allProfiles.filter(
          (p) => {
            const isOwn = p.id === currentProfile.id;
            const isSubbu = p.id === "prof-subbu" || p.contact_number?.replace(/\D/g, "").includes("9347359489");
            const isSubbaReddy = p.id === "prof-subba-reddy" || p.contact_number?.replace(/\D/g, "").includes("9494949494");
            return !isOwn && !isSubbu && !isSubbaReddy;
          }
        );
        setProfiles(matches);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, [currentProfile.id]);

  // Derived calculations: calculate age from DOB
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 28;
    const birthDate = new Date(dobString);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970) || 28;
  };

  // Matching algorithm: strictly considers ONLY 2 rules:
  // 1. Male & Female must have DIFFERENT Gothras (No Sagotra alliance)
  // 2. Male is 1 to 3 years elder than the woman (1 <= Male Age - Female Age <= 3)
  const filteredMatches = profiles.filter((partner) => {
    // Exclude married profiles
    if ((partner.status as string) === "Married") return false;

    // 0. If current user has not paid registration fee (subscription_status === 'free'), show no matches
    if (currentProfile.subscription_status === "free") return false;

    // 0.5. If partner has not paid registration fee, do not show them as a match to others
    if (partner.subscription_status === "free") return false;

    // 1. Must be opposite gender
    const isOppositeGender = partner.gender !== currentProfile.gender;
    if (!isOppositeGender) return false;

    // RULE 1: Male & Female must have DIFFERENT Gothras
    if (currentProfile.gothram && partner.gothram) {
      if (currentProfile.gothram.trim().toLowerCase() === partner.gothram.trim().toLowerCase()) {
        return false; // Sagotra strictly not allowed
      }
    }

    // RULE 2: Male is 1 to 3 years elder than the woman
    const ownAge = calculateAge(currentProfile.dob);
    const partnerAge = calculateAge(partner.dob);
    const groomAge = currentProfile.gender === "Male" ? ownAge : partnerAge;
    const brideAge = currentProfile.gender === "Female" ? ownAge : partnerAge;
    const ageDiff = groomAge - brideAge;

    // Groom must be 1 to 3 years elder than the Bride
    if (ageDiff < 1 || ageDiff > 3) {
      return false;
    }

    return true;
  });

  // Sort partners by compatibility score (highest first) using the dynamic Vedic and profile match engine
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    const scoreA = calculateMatchScore(currentProfile, a).totalScore;
    const scoreB = calculateMatchScore(currentProfile, b).totalScore;
    return scoreB - scoreA;
  });

  const stackMatches = sortedMatches.filter(
      (m) =>
        !currentProfile.liked_profiles?.includes(m.id) &&
        !currentProfile.disliked_profiles?.includes(m.id) &&
        !localSwiped[m.id]
  );

  const handleSwipe = async (match: Profile, direction: "left" | "right") => {
    // Optimistic local state
    setLocalSwiped(prev => ({ ...prev, [match.id]: direction }));

    // Update profile
    const updatedProfile = { ...currentProfile };
    if (direction === "right") {
      updatedProfile.liked_profiles = [...(updatedProfile.liked_profiles || []), match.id];
    } else {
      updatedProfile.disliked_profiles = [...(updatedProfile.disliked_profiles || []), match.id];
    }
    
    // Background update
    onUpdateProfile(updatedProfile).catch(err => console.error("Update failed", err));

    if (direction === "right") {
      const actuallyLikedMe = match.liked_profiles?.includes(currentProfile.id);
      const randomMutual = Math.random() < 0.3; // 30% chance for demonstration
      if (actuallyLikedMe || randomMutual) {
        setTimeout(() => {
          setMutualMatch(match);
        }, 300); // short delay for swipe animation to finish
      }
    }
  };

  const handleUnlockContact = (matchId: string) => {
    const subStatus = currentProfile.subscription_status || "free";
    if (subStatus !== "paid_900") {
      setShowUpgradeModal(true);
      return;
    }
    setUnlockedContacts((prev) => ({
      ...prev,
      [matchId]: true,
    }));
  };

  const handleCopy = (text: string, type: "phone" | "upi") => {
    navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleSubmitPayment = async () => {
    if (!txnId.trim()) {
      alert("Please enter your 12-digit UPI Transaction ID or UTR number first.");
      return;
    }
    setIsSubmittingPayment(true);
    try {
      const upgraded = {
        ...currentProfile,
        upgrade_transaction_id: txnId.trim(),
        upgrade_requested_at: new Date().toISOString()
      };
      await onUpdateProfile(upgraded);
      setPaymentSubmitted(true);
      setTxnId("");
    } catch (err) {
      console.error("Failed to submit payment details:", err);
      alert("Failed to submit payment details. Please try again.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const [dateProposalTarget, setDateProposalTarget] = useState<Profile | null>(null);
  const [dateProposalText, setDateProposalText] = useState("");

  const handleRejectInterest = async (partner: Profile) => {
    const updatedCurrent = {
      ...currentProfile,
      disliked_profiles: Array.from(new Set([...(currentProfile.disliked_profiles || []), partner.id])),
      liked_profiles: (currentProfile.liked_profiles || []).filter(id => id !== partner.id)
    };
    await onUpdateProfile(updatedCurrent);

    const updatedPartner = {
      ...partner,
      liked_profiles: (partner.liked_profiles || []).filter(id => id !== currentProfile.id),
      disliked_profiles: Array.from(new Set([...(partner.disliked_profiles || []), currentProfile.id]))
    };
    await databaseService.saveProfile(updatedPartner);
    setProfiles(prev => prev.map(p => p.id === partner.id ? updatedPartner : p));
  };

  const handleAcceptInterest = async (partner: Profile) => {
    const updatedCurrent = {
      ...currentProfile,
      liked_profiles: Array.from(new Set([...(currentProfile.liked_profiles || []), partner.id]))
    };
    await onUpdateProfile(updatedCurrent);
    setMutualMatch(partner);
  };

  return (
    <>
      <div className="space-y-8">
      {/* Intro Match Screen */}
      <div className="bg-gradient-to-r from-[#362B5A] to-[#C2242C]/10 p-6 sm:p-8 rounded-3xl text-[#362B5A] bg-[#EBF6FF] border border-[#362B5A]/10 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-1 bg-[#362B5A] text-white w-fit px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase font-mono">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span>Divine Alignment Engine Active</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Celestial Matches</h2>
            <button
              onClick={() => setShowMatchCountModal(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-full shadow-md cursor-pointer transition-all flex items-center gap-1.5 font-mono"
            >
              <span>({filteredMatches.length} Matches Found)</span>
              <span className="text-[10px] underline">View Details</span>
            </button>
          </div>
          <p className="text-gray-600 max-w-xl text-sm leading-relaxed">
            The calculations below sort prospective spouses by spiritual resonance, Nakshatra compatibility, and sub-caste alignments modeled directly after the union of Shiva and Sati.
          </p>
        </div>
        {preferences && (
          <div className="bg-white px-5 py-4 rounded-2xl border border-gray-100 flex flex-col justify-center shrink-0">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Filters</span>
            <p className="text-xs font-bold text-[#362B5A] mt-1">Sub-Caste: <span className="text-[#C2242C] font-mono">{preferences.preferred_sub_caste}</span></p>
            <p className="text-xs font-bold text-[#362B5A]">Age Gap: <span className="text-[#C2242C] font-mono">±{preferences.age_gap} Yrs</span></p>
            <p className="text-xs font-bold text-[#362B5A]">Height: <span className="text-[#C2242C] font-mono">{preferences.height_range} Ft</span></p>
          </div>
        )}
      </div>

      {currentProfile.subscription_status === "free" && (
        <div className="bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border-2 border-amber-400 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500 text-black rounded-2xl shrink-0 font-black text-lg">
              ⚠️
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black text-amber-900 uppercase tracking-wide">Registration Fee Pending (₹100)</h4>
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                Your profile is registered for free. Please pay the ₹100 registration fee now to instantly unlock direct phone numbers and see all your compatible matches!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer hover:brightness-110 whitespace-nowrap"
          >
            Pay ₹100 Fee Now
          </button>
        </div>
      )}

      {/* Modal for Match Count Details */}
      {showMatchCountModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowMatchCountModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center space-y-1 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-[#362B5A] uppercase">Matched Candidates ({filteredMatches.length})</h3>
              <p className="text-xs text-gray-500">List of opposite-gender profiles matching your astrological and sub-caste preferences</p>
            </div>
            <div className="space-y-3">
              {filteredMatches.map(m => (
                <div key={m.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#362B5A] block">{m.surname ? `${m.surname} ` : ""}{m.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{m.sub_caste} • {m.gothram || "Gotram Not Specified"} • {m.profession || "Profession Unlisted"}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 block text-[11px]">
                      {m.contact_number || "Contact Secured"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowMatchCountModal(false)}
              className="w-full py-2.5 bg-[#362B5A] text-white font-bold text-xs uppercase rounded-xl cursor-pointer"
            >
              Close Summary
            </button>
          </div>
        </div>
      )}

      {/* AUTOMATIC CYCLING SAFETY & LEGAL WARNING BANNER (IT ACT 2021) */}
      <div className="bg-gradient-to-r from-red-600 to-[#C2242C] text-white p-4.5 rounded-3xl shadow-md border border-red-700 relative overflow-hidden text-left">
        <div className="absolute inset-0 bg-repeat bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1">
            <span className="text-2xl animate-bounce shrink-0 p-2 bg-white/10 rounded-2xl">
              {safetyWarnings[activeSafetyIdx].icon}
            </span>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-200 block font-mono">
                ⚠️ Platform Safety & Legal Compliance • IT Act 2021
              </span>
              <h4 className="text-sm font-extrabold tracking-tight text-white uppercase">
                {safetyWarnings[activeSafetyIdx].title}
              </h4>
              <p className="text-xs text-red-50/90 leading-relaxed font-medium transition-all duration-300">
                {safetyWarnings[activeSafetyIdx].text}
              </p>
            </div>
          </div>

          {/* Interactive Navigation Dots */}
          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center bg-black/10 px-3 py-1.5 rounded-full">
            {safetyWarnings.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSafetyIdx(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  activeSafetyIdx === index ? "bg-white scale-125" : "bg-white/40 hover:bg-white/60"
                }`}
                title={`Safety tip ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {currentProfile.subscription_status !== "paid_900" && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
              <Lock className="w-5 h-5 text-amber-700" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                Restricted Matrimonial Contact Access
                <span className="text-[9px] bg-amber-200 text-amber-800 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                  {(currentProfile.subscription_status || "free").replace('_', ' ')}
                </span>
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Only <span className="font-bold">Paid ₹900</span> members can retrieve verified phone numbers and sacred Kundali attachments. Upgrade now to unlock immediate access.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full sm:w-auto bg-[#C2242C] text-white hover:bg-opacity-95 active:scale-95 transition-all font-bold text-xs py-2.5 px-5 rounded-xl uppercase tracking-wider cursor-pointer shrink-0 shadow-sm"
          >
            Upgrade to Paid_900
          </button>
        </div>
      )}

      {currentProfile.subscription_status === "paid_900" && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-3xl flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-2xl shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-emerald-900">Supreme Alignment Active (Paid ₹900)</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              You have full, unrestricted access to unlock contact details and establish divine matrimonial connection lines.
            </p>
          </div>
        </div>
      )}

      {/* Expressed Interest in You Section */}
      {(() => {
        const interestedProfiles = profiles.filter(
          (p) =>
            p.liked_profiles?.includes(currentProfile.id) &&
            !currentProfile.disliked_profiles?.includes(p.id) &&
            !currentProfile.liked_profiles?.includes(p.id)
        );

        if (interestedProfiles.length === 0) return null;

        return (
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200 p-6 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-rose-600 fill-rose-600 animate-pulse" />
                <h3 className="text-lg font-black text-[#362B5A] uppercase tracking-tight">
                  Profiles Expressed Interest in You ({interestedProfiles.length})
                </h3>
              </div>
              <span className="text-xs bg-rose-600 text-white font-bold px-3 py-1 rounded-full font-mono">
                Incoming Interests
              </span>
            </div>
            <p className="text-xs text-gray-600">
              The following verified souls have expressed romantic interest in your profile. You can accept to connect, send a date proposal template, or decline (which removes the connection for both of you).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interestedProfiles.map((partner) => {
                const partnerAge = calculateAge(partner.dob);
                return (
                  <div key={partner.id} className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={partner.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=200"}
                        alt={partner.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-rose-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#362B5A] text-sm truncate">{partner.surname ? `${partner.surname} ` : ""}{partner.name}</h4>
                        <p className="text-[11px] text-gray-500 truncate">{partner.profession || "Profession Unlisted"} • {partnerAge} Yrs</p>
                        <p className="text-[10px] text-rose-700 font-mono font-bold">{partner.sub_caste} • {partner.gothram || "Gotram"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleAcceptInterest(partner)}
                        className="py-2 px-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        title="Accept and connect"
                      >
                        <Heart className="w-3 h-3 fill-white" />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDateProposalTarget(partner);
                          setDateProposalText(`Namaskaram 🙏, I am ${currentProfile.name}. I saw your profile expressed interest in mine. I want a date / meet with you, what do you feel? (మీతో డేట్ లేదా కలవాలని అనుకుంటున్నాను, మీ అభిప్రాయం ఏమిటి?)`);
                        }}
                        className="py-2 px-1 bg-[#362B5A] hover:bg-[#282043] text-white font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        title="Send date proposal template"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Date Proposal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectInterest(partner)}
                        className="py-2 px-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        title="Not interested (Removes both connections)"
                      >
                        <X className="w-3 h-3" />
                        <span>Not Interested</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Date Proposal Modal */}
      {dateProposalTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setDateProposalTarget(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center space-y-1 pb-3 border-b border-gray-100">
              <span className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-widest block">💌 Sacred Date & Meet Proposal</span>
              <h3 className="text-lg font-black text-[#362B5A]">Send Proposal to {dateProposalTarget.name}</h3>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">Message Template:</label>
              <textarea
                value={dateProposalText}
                onChange={(e) => setDateProposalText(e.target.value)}
                rows={4}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#362B5A]"
              />
              <p className="text-[11px] text-gray-500 leading-tight">
                You can copy this template or send it directly via WhatsApp to initiate a meeting.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(dateProposalText);
                  alert("Proposal template copied to clipboard!");
                }}
                className="py-3 bg-gray-100 hover:bg-gray-200 text-[#362B5A] font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
              >
                Copy Text
              </button>
              <a
                href={`https://wa.me/${(dateProposalTarget.contact_number || "").replace(/\D/g, "")}?text=${encodeURIComponent(dateProposalText)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDateProposalTarget(null)}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Send WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-[#C2242C] mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500 font-bold font-mono">Consulting the Constellations...</p>
        </div>
      ) : sortedMatches.length === 0 ? (
        <div className="py-12 bg-[#362B5A] text-white rounded-3xl border-2 border-amber-400 text-center max-w-2xl mx-auto p-8 sm:p-12 space-y-6 relative overflow-hidden shadow-xl animate-fade-in">
          <div className="absolute inset-1.5 border border-dashed border-amber-400/20 rounded-2xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C2242C]/15 rounded-full filter blur-xl pointer-events-none" />
          <div className="p-4 bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-full w-fit mx-auto animate-pulse">
            <Sparkles className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">Auspicious Matrimonial Curations in Progress</h3>
          <p className="text-base text-gray-200 leading-relaxed max-w-xl mx-auto font-sans">
            Namaskaram, respected Parents! Under the spiritual guidance of <strong>Bramhana Vivaha Veadika</strong>, with the divine blessings of Sri Kanchi Kamakoti Peetham, Sringeri Sharada Peetham, and Sri Adi Shankaracharya, we are carefully compiling and reviewing compatible opposite-gender candidates matching your child's Nakshatra, Gotra, and preferences.
          </p>
          <div className="bg-amber-400/10 p-4 rounded-xl border border-amber-400/30 max-w-lg mx-auto text-sm text-amber-300 font-semibold">
            Once your registration verification is complete, the matches will be shown directly to your screen here!
          </div>
          <p className="text-xs text-gray-400 font-mono">
            CURRENT ACCOUNT REGISTRATION: {currentProfile.reg_number || "BVM-Pending"} • STATUS: {currentProfile.status}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* STATUTORY MANDATORY LEGAL DISCLAIMER & FAMILY SAFETY WARNING */}
          <div className="bg-red-50 border-2 border-red-200 p-5 rounded-3xl text-left space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2 text-[#C2242C]">
              <AlertCircle className="w-5.5 h-5.5 shrink-0 text-[#C2242C]" />
              <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider font-mono">
                Statutory Intermediary Disclaimer & Family Verification Warning (కుటుంబ విచారణ గమనిక)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700">
              <div className="space-y-1.5 border-r border-red-100 pr-0 md:pr-4">
                <p className="font-bold text-[#C2242C] text-[11.5px]">తెలుగు వివరణ (Telugu Safety Notice):</p>
                <p>
                  ఈ వెబ్‌సైట్ కేవలం ఒక <strong>డిజిటల్ మధ్యవర్తి (Intermediary Platform)</strong> గా మాత్రమే సమాచారాన్ని సమర్పిస్తుంది. అభ్యర్థులు తమ ప్రొఫైల్‌లో నమోదు చేసిన వార్షిక ఆదాయం, ఉద్యోగం, క్యారెక్టర్ లేదా వ్యక్తిగత ప్రవర్తనకు మా సంస్థ ఎలాంటి గ్యారెంటీ ఇవ్వదు.
                </p>
                <p className="font-bold text-slate-800">
                  వివాహ నిశ్చయానికి ముందే మీరు స్వయంగా సదరు అభ్యర్థి యొక్క ఇల్లు, క్యారెక్టర్, ఉద్యోగ వివరాలు మరియు కుటుంబ నేపథ్యాన్ని పూర్తిగా విచారించి నిర్ధారించుకోవాలి.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-[#C2242C] text-[11.5px]">English Regulatory Warning:</p>
                <p>
                  We operate strictly as an intermediary platform. We have absolutely <strong>no involvement or responsibility</strong> in verifying the personal character, psychological health, financial standing, or criminal records of candidates. 
                </p>
                <p className="font-bold text-slate-800">
                  Families are legally advised and solely responsible for conducting independent background checks and cross-verifying all data before exchanging matrimonial commitments.
                </p>
              </div>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-sans tracking-wide">
              ⚠️ <strong>Self-Submitted Information Notice:</strong> We do not verify or certify any candidate details. All information (Gothram, Age, Education, Profession, Family) is strictly self-submitted by users. Bramhana Vivaha Vedika is not responsible for any information provided. Families must independently cross-check all details.
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex justify-center my-6">
            <div className="bg-gray-100 p-1 rounded-xl inline-flex shadow-inner">
              <button
                onClick={() => setViewMode("stack")}
                className={`px-4 py-2 flex items-center gap-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "stack" ? "bg-white text-[#362B5A] shadow" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Layers className="w-4 h-4" />
                Stack View
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 flex items-center gap-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "grid" ? "bg-white text-[#362B5A] shadow" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Grid View
              </button>
            </div>
          </div>

          {viewMode === "stack" ? (
            <div className="relative w-full h-[600px] flex justify-center items-center overflow-hidden">
              <AnimatePresence>
                {stackMatches.slice(0, 3).reverse().map((match, index, array) => (
                  <StackCard
                    key={match.id}
                    match={match}
                    currentProfile={currentProfile}
                    isFront={index === array.length - 1}
                    handleSwipe={handleSwipe}
                    calculateAge={calculateAge}
                  />
                ))}
              </AnimatePresence>
              {stackMatches.length === 0 && (
                <div className="text-center p-8 text-gray-500 flex flex-col items-center">
                  <Heart className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-lg font-bold">You have seen all matches!</p>
                  <p className="text-xs">Check back later for new celestial alignments.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {sortedMatches.map((match) => {
                const scoreDetails = calculateMatchScore(currentProfile, match);
                const matchScore = scoreDetails.totalScore;
                const age = calculateAge(match.dob);

                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#362B5A]/15 transition-all duration-300 overflow-hidden flex flex-col group relative"
                  >
                    {/* Image Section */}
                    <div className="h-56 w-full relative overflow-hidden bg-gray-50">
                      <img
                        src={match.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=400"}
                        alt={match.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Score Overlap */}
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm shadow-md px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-orange-500/10">
                        <Compass className="w-3.5 h-3.5 text-[#C2242C] animate-spin" />
                        <span className="text-xs font-extrabold text-[#362B5A] font-mono">{matchScore}% Match</span>
                      </div>

                      {/* Gender and Subcaste badge */}
                      <div className="absolute bottom-4 left-4 flex gap-1.5">
                        <span className="bg-[#362B5A] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm font-mono">
                          {match.sub_caste}
                        </span>
                        <span className="bg-[#C2242C] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm font-mono">
                          {match.height_feet} Ft
                        </span>
                      </div>
                    </div>

                    {/* Info Details */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xl font-bold text-[#362B5A] leading-tight flex items-center gap-1.5">
                              {match.name}
                              {match.status === "Premium" && (
                                <Award className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
                              )}
                            </h4>
                            <div className="text-xs text-[#C2242C] font-extrabold mt-0.5">
                              {getGenderLabel(match.gender)}
                            </div>
                            <p className="text-sm text-gray-600 font-semibold mt-1">{match.profession}</p>
                          </div>
                          <span className="text-lg font-extrabold text-[#362B5A] font-sans shrink-0">{age} yrs</span>
                        </div>

                        {/* Astrological Micro Indicators */}
                        {match.astrology && (
                          <div className="bg-[#EBF6FF] p-3 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">నక్షత్రం (Nakshatra)</span>
                              <span className="font-bold text-[#362B5A]">{getNakshatraTelugu(match.astrology.nakshatra)} ({match.astrology.nakshatra})</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">తిథి (Lunar Tithi)</span>
                              <span className="font-bold text-[#C2242C] truncate max-w-[120px] inline-block">{match.astrology.tithi.split(" (")[0]}</span>
                            </div>
                          </div>
                        )}

                        {/* Salary & Location stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 font-semibold pt-1">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>₹ {match.salary_lpa} LPA</span>
                          </div>
                          <div className="flex items-center gap-1 justify-end text-right">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{match.birth_location || "Varanasi"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                        {(currentProfile.liked_profiles?.includes(match.id) || localSwiped[match.id] === 'right') ? (
                          <div className="space-y-2">
                            <div className="bg-pink-50 border border-pink-200 text-pink-700 px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-between">
                              <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 fill-pink-600 text-pink-600 animate-pulse" /> Interest Expressed</span>
                              <span className="text-[10px] font-mono font-bold text-pink-500">3 Actions Active</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              <button
                                onClick={() => setShowPandithModal(true)}
                                className="py-2 px-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-xs"
                                title="Consult Vedic Priest for Jatakas"
                              >
                                <span>📿 Consult</span>
                                <span className="text-[9px] font-normal font-mono">Priest</span>
                              </button>
                              <button
                                onClick={() => setMeetDateTarget(match)}
                                className="py-2 px-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-xs"
                                title="Ask for Meet & Date"
                              >
                                <span>☕ Meet &</span>
                                <span className="text-[9px] font-normal font-mono">Date</span>
                              </button>
                              <button
                                onClick={() => setPelliChupuluTarget(match)}
                                className="py-2 px-1 bg-[#C2242C] hover:bg-red-700 text-white font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-xs"
                                title="Ask for Pellikupulu Ceremony"
                              >
                                <span>🪔 Pelli</span>
                                <span className="text-[9px] font-normal font-mono">Chupulu</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSwipe(match, "left")}
                              className="py-2.5 px-3 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer"
                              title="Not Interested"
                            >
                              <X className="w-4 h-4" />
                              <span>Not Interested</span>
                            </button>
                            <button
                              onClick={() => handleSwipe(match, "right")}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              title="Express Interest"
                            >
                              <Heart className="w-4 h-4 fill-white animate-pulse" />
                              <span>Express Interest</span>
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setSelectedMatch(match)}
                            className="flex-1 py-2 px-3 rounded-xl border border-[#362B5A]/25 text-[#362B5A] hover:bg-[#362B5A] hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all duration-300 cursor-pointer text-center"
                          >
                            Sacred Details
                          </button>
                          <a
                            href={`tel:${match.contact_number}`}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 animate-pulse" />
                            <span>{match.contact_number}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    )}

      {/* Mutual Match Modal */}
      <AnimatePresence>
        {mutualMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-pink-500/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl text-center space-y-6"
            >
              <div className="flex justify-center -space-x-4 mb-4">
                <img
                  src={currentProfile.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=400"}
                  className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg"
                  alt="You"
                />
                <img
                  src={mutualMatch.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=400"}
                  className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg"
                  alt={mutualMatch.name}
                />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-pink-600 font-sans tracking-tight">It's a Match!</h2>
                <p className="text-gray-600 mt-2 font-medium">
                  You and <strong>{mutualMatch.name}</strong> have expressed interest in each other.
                </p>
              </div>
              <div className="pt-4 space-y-3">
                <a
                  href={`tel:${mutualMatch.contact_number}`}
                  className="w-full py-3.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Phone className="w-5 h-5 animate-pulse" />
                  Contact Family
                </a>
                <button
                  onClick={() => setMutualMatch(null)}
                  className="w-full py-3.5 px-4 rounded-xl border-2 border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-sm uppercase tracking-wider transition-all cursor-pointer"
                >
                  Keep Swiping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Kundali Alignment Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-orange-500/10 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Close */}
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-5 right-5 p-2 bg-[#EBF6FF] text-[#362B5A] hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Overview */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-gray-100">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#362B5A]/10 shadow-md shrink-0">
                <img
                  src={selectedMatch.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=400"}
                  alt={selectedMatch.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center sm:text-left space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-2xl font-extrabold text-[#362B5A]">{selectedMatch.name}</h3>
                  <span className="bg-[#C2242C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    {selectedMatch.status}
                  </span>
                </div>
                <p className="text-sm text-[#362B5A] font-extrabold flex flex-wrap gap-2 items-center justify-center sm:justify-start">
                  <span>{selectedMatch.profession}</span>
                  {selectedMatch.company_name && (
                    <span className="text-[11px] bg-[#EBF6FF] text-[#362B5A] font-bold px-2 py-0.5 rounded-md font-sans">
                      at {selectedMatch.company_name}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-gray-600 font-medium font-mono pt-1">
                  <span>Age: {calculateAge(selectedMatch.dob)} Yrs</span>
                  <span>Height: {selectedMatch.height_feet} Ft</span>
                  <span>Caste: {selectedMatch.sub_caste}</span>
                  <span>Earnings: ₹ {selectedMatch.salary_lpa} LPA</span>
                  {selectedMatch.job_branch && <span>Place: {selectedMatch.job_branch}</span>}
                  {selectedMatch.working_shift && <span>Shift: {selectedMatch.working_shift}</span>}
                </div>
              </div>
            </div>

            {/* MANDATORY FAMILY SAFETY & PURE INTERMEDIARY NOTICE */}
            <div className="bg-amber-50 border border-amber-300 p-4.5 rounded-2xl space-y-2 text-left">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-700" />
                <span className="font-extrabold text-[11px] uppercase tracking-wider font-mono">
                  Mandatory Family Safety Warning & Pure Intermediary Clause (కుటుంబ విచారణ గమనిక)
                </span>
              </div>
              <p className="text-[11px] text-amber-950 leading-relaxed font-medium">
                <strong>ముఖ్య గమనిక:</strong> ఈ ప్రొఫైల్‌లో చూపిన సమాచారం పూర్తిగా అభ్యర్థి స్వయంగా సమర్పించినది. వారి క్యారెక్టర్, ప్రవర్తన, ఆర్థిక వనరులు లేదా ఉద్యోగ నిజాయితీని మా సంస్థ ఏమాత్రం ధృవీకరించదు. పెళ్లి సంబంధం కాయం చేసుకునే ముందే మీరు వ్యక్తిగతంగా అన్ని వివరాలను స్వయంగా విచారించుకోవాలి.
              </p>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                <strong>Pure Intermediary Notice:</strong> Under Section 2(1)(w) of the Indian IT Act, we possess no liability whatsoever. All user-provided parameters (Salary, Company, Astrology, Education) are completely self-declared. A "Verified" label is ONLY for basic self-submitted ID checklist confirmation, and is NOT an assurance of character, health, financial capability, or clean criminal-status. You must conduct comprehensive background checks before finalizing marriage.
              </p>
            </div>

            {/* Divine Photo Gallery */}
            <div className="space-y-3 pb-6 border-b border-gray-100">
              <h4 className="text-sm font-black text-[#362B5A] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C2242C]" />
                Auspicious Portrait Gallery (చిత్రమాలిక)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50 hover:border-[#C2242C] transition-all">
                  <img
                    src={selectedMatch.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=400"}
                    alt="Primary Photo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-[9px] text-white font-bold px-1.5 py-0.5 rounded-md font-mono">
                    Primary
                  </div>
                </div>

                <div className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50 hover:border-[#C2242C] transition-all">
                  <img
                    src={selectedMatch.photo_url_2 || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"}
                    alt="Second Photo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-[9px] text-white font-bold px-1.5 py-0.5 rounded-md font-mono">
                    Portrait 2
                  </div>
                </div>

                <div className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50 hover:border-[#C2242C] transition-all">
                  <img
                    src={selectedMatch.photo_url_3 || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400"}
                    alt="Third Photo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-[9px] text-white font-bold px-1.5 py-0.5 rounded-md font-mono">
                    Portrait 3
                  </div>
                </div>
              </div>
            </div>

            {/* Astrological Matching Card */}
            {selectedMatch && (
              (() => {
                const scoreDetails = calculateMatchScore(currentProfile, selectedMatch);
                return (
                  <div className="space-y-6">
                    {/* Score Header Card */}
                    <div className="bg-[#362B5A] text-white rounded-3xl p-6 border border-orange-500/20 shadow-xl relative overflow-hidden space-y-4">
                      <div className="absolute inset-0 bg-radial-at-t from-orange-500/10 via-transparent to-transparent pointer-events-none" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-orange-300 font-mono tracking-widest uppercase block">Sacred Kundali Milan</span>
                          <h4 className="text-xl font-extrabold font-sans">Cosmic Alignment: {scoreDetails.totalScore}% Resonance</h4>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="bg-orange-500/15 border border-orange-400/30 text-orange-200 px-3 py-1.5 rounded-2xl text-xs font-bold font-mono shadow-inner flex items-center gap-1.5 shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-orange-300 animate-pulse" />
                            <span>{scoreDetails.gunaPoints}/36 Gunas</span>
                          </div>
                          <div className="bg-[#C2242C] text-white px-3 py-1.5 rounded-2xl font-mono font-bold text-xs shadow-md border border-orange-400/20 shrink-0">
                            {scoreDetails.ganaHarmony}
                          </div>
                        </div>
                      </div>

                      {/* 2-Rule Matching Breakdown */}
                      <div className="space-y-3 pt-3 border-t border-white/10 relative z-10 text-xs">
                        <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Shubhamastu 2-Rule Alignment Criteria</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Rule 1: Gothra Separation */}
                          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 space-y-1.5">
                            <div className="flex justify-between items-center text-[11px] font-bold text-blue-100">
                              <span>1. Gothra Separation (గోత్ర భేదం)</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                scoreDetails.differentGothra ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
                              }`}>
                                {scoreDetails.differentGothra ? "✓ Different Gotras" : "✕ Sagotra Alliance"}
                              </span>
                            </div>
                            <p className="text-[10px] text-blue-200/80">
                              Vedic marriage mandates different gothras between bride and groom.
                            </p>
                          </div>

                          {/* Rule 2: Age Alignment */}
                          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 space-y-1.5">
                            <div className="flex justify-between items-center text-[11px] font-bold text-blue-100">
                              <span>2. Age Alignment (వయో భేదం)</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                scoreDetails.ageGapValid ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
                              }`}>
                                {scoreDetails.ageGapValid ? "✓ Groom 1–3 Yrs Elder" : "✕ Age Mismatch"}
                              </span>
                            </div>
                            <p className="text-[10px] text-blue-200/80">
                              Groom: {scoreDetails.groomAge} yrs, Bride: {scoreDetails.brideAge} yrs (Diff: {scoreDetails.ageDiff} yrs).
                            </p>
                          </div>

                        </div>

                        {/* Milan Analysis */}
                        <div className="p-3 bg-amber-500/10 border border-amber-400/20 rounded-2xl text-[11px] text-amber-200">
                          {scoreDetails.milanAnalysis}
                        </div>
                      </div>

                      {/* Milan Analysis */}
                      <div className="space-y-1.5 relative z-10 pt-3 border-t border-white/10">
                        <span className="text-[9px] text-blue-200/50 uppercase tracking-widest font-bold block">Sacred Milan Interpretation</span>
                        <p className="text-xs leading-relaxed text-blue-100 font-serif italic">
                          "{scoreDetails.milanAnalysis}"
                        </p>
                      </div>
                    </div>

                    {/* Specifics Grid */}
                    {selectedMatch.astrology && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-gray-50 border border-gray-150 p-3.5 rounded-2xl text-left">
                            <span className="text-[9.5px] text-gray-400 font-black uppercase tracking-wider block mb-0.5">నక్షత్రం (Nakshatram)</span>
                            <p className="font-extrabold text-[#362B5A] text-sm">{getNakshatraTelugu(selectedMatch.astrology.nakshatra)} ({selectedMatch.astrology.nakshatra})</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-150 p-3.5 rounded-2xl text-left">
                            <span className="text-[9.5px] text-gray-400 font-black uppercase tracking-wider block mb-0.5">గ్రహాధిపతి (Ruling Lord)</span>
                            <p className="font-extrabold text-[#362B5A] text-sm">{selectedMatch.astrology.nakshatraLordTelugu || selectedMatch.astrology.nakshatraLord}</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-150 p-3.5 rounded-2xl text-left">
                            <span className="text-[9.5px] text-gray-400 font-black uppercase tracking-wider block mb-0.5">అధిష్టాన దేవత (Deity Energy)</span>
                            <p className="font-extrabold text-[#362B5A] text-sm">{selectedMatch.astrology.deityTelugu || selectedMatch.astrology.deity}</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-150 p-3.5 rounded-2xl text-left">
                            <span className="text-[9.5px] text-gray-400 font-black uppercase tracking-wider block mb-0.5">రాశి (Moon Sign / Rashi)</span>
                            <p className="font-extrabold text-[#362B5A] text-sm">{selectedMatch.astrology.rashi}</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-150 p-3.5 rounded-2xl text-left">
                            <span className="text-[9.5px] text-gray-400 font-black uppercase tracking-wider block mb-0.5">పాదం (Pada / Quarter)</span>
                            <p className="font-extrabold text-[#362B5A] text-sm font-mono">{selectedMatch.astrology.pada} వ పాదం (Quarter {selectedMatch.astrology.pada})</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-150 p-3.5 rounded-2xl text-left">
                            <span className="text-[9.5px] text-gray-400 font-black uppercase tracking-wider block mb-0.5">తిథి (Lunar Day / Tithi)</span>
                            <p className="font-extrabold text-[#362B5A] text-sm">{selectedMatch.astrology.tithi}</p>
                          </div>
                        </div>

                        {/* Hamsa & Divine Guidance (హంస & ఇష్టదైవ అనుగ్రహం) */}
                        {selectedMatch.astrology.hamsaGuidance && (
                          <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl text-left space-y-3 relative z-10 shadow-xs">
                            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                              <span className="text-[11px] text-amber-800 uppercase tracking-widest font-black flex items-center gap-1.5">
                                📿 హంస & ఇష్టదైవ అనుగ్రహం (Hamsa & Deity Guidance)
                              </span>
                              <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded text-[9.5px] font-black shadow-xs">
                                {selectedMatch.astrology.hamsaGuidance.hamsaSymbol.telugu}
                              </span>
                            </div>
                            
                            <div className="bg-white/80 p-3 rounded-xl border border-amber-500/10">
                              <span className="font-extrabold text-amber-900 block text-xs mb-1">ఇష్ట దేవత / పూజించాల్సిన దైవం (Ishta Devata):</span>
                              <span className="font-bold text-gray-800 text-sm">
                                {selectedMatch.astrology.hamsaGuidance.ishtaDevata.telugu} ({selectedMatch.astrology.hamsaGuidance.ishtaDevata.english})
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 pt-1 text-xs">
                              <div className="space-y-0.5 border-l-2 border-pink-500 pl-2.5">
                                <span className="font-bold text-pink-700 block">💍 వివాహం కొరకు (For Marriage):</span>
                                <p className="text-gray-700 leading-relaxed font-sans">{selectedMatch.astrology.hamsaGuidance.marriage}</p>
                              </div>
                              <div className="space-y-0.5 border-l-2 border-emerald-500 pl-2.5">
                                <span className="font-bold text-emerald-700 block">💼 వ్యాపారం కొరకు (For Business):</span>
                                <p className="text-gray-700 leading-relaxed font-sans">{selectedMatch.astrology.hamsaGuidance.business}</p>
                              </div>
                              <div className="space-y-0.5 border-l-2 border-sky-500 pl-2.5">
                                <span className="font-bold text-sky-700 block">🎓 చదువు / విద్య కొరకు (For Education):</span>
                                <p className="text-gray-700 leading-relaxed font-sans">{selectedMatch.astrology.hamsaGuidance.education}</p>
                              </div>
                              <div className="space-y-0.5 border-l-2 border-amber-500 pl-2.5">
                                <span className="font-bold text-amber-700 block">🏢 ఉద్యోగం / కెరీర్ కొరకు (For Job & Career):</span>
                                <p className="text-gray-700 leading-relaxed font-sans">{selectedMatch.astrology.hamsaGuidance.job}</p>
                              </div>
                              <div className="space-y-0.5 border-l-2 border-purple-500 pl-2.5 bg-purple-500/5 p-2.5 rounded-xl">
                                <span className="font-bold text-purple-700 block">📿 నిత్య పరిహారం (Daily Remedy):</span>
                                <p className="text-gray-700 leading-relaxed font-sans">{selectedMatch.astrology.hamsaGuidance.remedy}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prosperous Traits Checklist */}
                    {scoreDetails.prosperousTraits.length > 0 && (
                      <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl space-y-2 text-left">
                        <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-widest block">Prosperous Alignment Points</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-emerald-900">
                          {scoreDetails.prosperousTraits.map((trait, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{trait}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}

            {/* Partner Expectations Display */}
            {(selectedMatch.partner_expectation_type || 
              selectedMatch.partner_expectations_desc ||
              selectedMatch.partner_height_diff_pref ||
              selectedMatch.partner_lpa_pref ||
              selectedMatch.partner_shift_pref) && (
              <div className="bg-orange-50/50 border border-orange-100/70 p-5 rounded-2xl space-y-2 text-left">
                <span className="text-[10px] text-orange-800 font-bold uppercase tracking-widest block font-mono">Partner Preferences (కోరుకునే భాగస్వామి)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {selectedMatch.partner_expectation_type && (
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-gray-500 uppercase tracking-wider text-[10px] block">Expected Profession:</span>
                      <span className="font-bold text-sm text-[#362B5A]">{selectedMatch.partner_expectation_type}</span>
                    </div>
                  )}

                  {selectedMatch.partner_lpa_pref && (
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-gray-500 uppercase tracking-wider text-[10px] block">Expected Income:</span>
                      <span className="font-bold text-sm text-[#362B5A]">{selectedMatch.partner_lpa_pref}</span>
                    </div>
                  )}
                  {selectedMatch.partner_shift_pref && (
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-gray-500 uppercase tracking-wider text-[10px] block">Preferred Working Shift:</span>
                      <span className="font-bold text-sm text-[#362B5A]">{selectedMatch.partner_shift_pref}</span>
                    </div>
                  )}
                  {selectedMatch.partner_expectations_desc && (
                    <div className="space-y-0.5 sm:col-span-2">
                      <span className="font-extrabold text-gray-500 uppercase tracking-wider text-[10px] block">Expected Qualities:</span>
                      <span className="text-gray-700 italic font-medium">"{selectedMatch.partner_expectations_desc}"</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Matrimonial Connection Card */}
            <div className="bg-[#EBF6FF] border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h5 className="font-bold text-[#362B5A] text-sm flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#C2242C]" />
                  Direct Contact Mobile Number
                </h5>
                <p className="text-xs text-gray-500 max-w-sm">
                  Connect with the candidate's family directly using this verified contact number.
                </p>
              </div>

              <a
                href={`tel:${selectedMatch.contact_number}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-2 font-mono"
              >
                <Phone className="w-4 h-4 text-emerald-200 animate-pulse" />
                <span>{selectedMatch.contact_number}</span>
              </a>
            </div>

            {/* IT Act 2021 Grievance / Harassment report action */}
            <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
              <p className="leading-normal">
                🛡️ Is this candidate calling with abusive behavior, or is the phone number incorrect? You can file a formal complaint under the <strong>IT Act 2021</strong> safety rules.
              </p>
              <button
                onClick={() => {
                  setReportingMatch(selectedMatch);
                  setSelectedMatch(null); // Close active detail modal
                }}
                className="shrink-0 py-2 px-3.5 bg-red-50 hover:bg-red-100 border border-red-200 text-[#C2242C] font-extrabold rounded-xl transition-all uppercase cursor-pointer text-center"
              >
                Report / File Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-amber-500/20 space-y-6 text-left my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => {
                setShowUpgradeModal(false);
                setPaymentSubmitted(false);
              }}
              className="absolute top-5 right-5 p-2 bg-[#EBF6FF] text-[#362B5A] hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer border border-indigo-100/50"
            >
              <X className="w-4 h-4" />
            </button>

            {paymentSubmitted || (currentProfile.upgrade_transaction_id && !paymentSubmitted) ? (
              // Success / Verification pending state
              <div className="space-y-6 text-center">
                <div className="p-4 bg-amber-50 text-[#C2242C] rounded-full w-fit mx-auto border border-amber-200 animate-pulse">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-amber-600 font-extrabold tracking-widest uppercase block font-mono">OM NAMAH SHIVAYA</span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#362B5A]">Payment Submission Received!</h3>
                  <p className="text-xs text-gray-500 leading-relaxed px-2">
                    మనం పంపిన లావాదేవీ వివరాలు అందాయి! We have recorded your ₹900 payment transaction reference.
                  </p>
                </div>

                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3 text-left text-xs text-amber-900">
                  <div className="flex justify-between border-b border-amber-200/50 pb-2">
                    <span className="font-semibold text-gray-500">Submitted Transaction ID / UTR:</span>
                    <span className="font-mono font-bold text-[#C2242C]">{currentProfile.upgrade_transaction_id || txnId}</span>
                  </div>
                  <p className="leading-relaxed font-medium text-[11px]">
                    ⏳ <strong className="text-[#362B5A]">Verification in Progress:</strong> Our administrator is currently validating your payment. Full communication and Kundali access will be activated within 1 to 2 hours of payment receipt validation.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Whatsapp Launcher to share screenshot */}
                  <a
                    href={`https://api.whatsapp.com/send?phone=919347359489&text=${encodeURIComponent(
                      `Hi Admin, I have submitted the ₹900 payment details for my Bramhana Vivaha Vedika profile.\n\nName: ${currentProfile.name}\nRegistered Mobile: ${currentProfile.contact_number}\nSubmitted Transaction ID: ${currentProfile.upgrade_transaction_id || txnId}\n\nPlease verify and activate my premium access. Here is the payment receipt screenshot:`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-emerald-200 animate-bounce" />
                    <span>Share Screenshot on WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      // Allow submitting a different transaction ID
                      const upgraded = {
                        ...currentProfile,
                        upgrade_transaction_id: ""
                      };
                      onUpdateProfile(upgraded);
                      setPaymentSubmitted(false);
                      setTxnId("");
                    }}
                    className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Enter a different Transaction ID
                  </button>
                </div>
              </div>
            ) : (
              // Payment form state
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-full w-fit mx-auto">
                    <Lock className="w-6 h-6 text-[#C2242C]" />
                  </div>
                  <h3 className="text-xl font-extrabold text-[#362B5A]">Secure Premium Upgrade</h3>
                  <p className="text-xs text-gray-500 leading-relaxed px-2">
                    Viewing candidate mobile numbers and downloading Kundali attachments requires verified premium access of <span className="font-bold text-[#C2242C]">₹900</span>.
                  </p>
                </div>

                {/* Beautiful Authentic PhonePe QR Code / Payment block */}
                <div className="border border-amber-200 bg-gradient-to-br from-amber-50/20 to-amber-50/60 rounded-3xl p-4 text-center space-y-4">
                  <span className="text-[9px] uppercase tracking-widest text-amber-800 font-extrabold block">Bramhana Vivaha Vedika Payments</span>
                  
                  <PhonePeQRCode amount={900} className="my-2 shadow-xl" />

                  {/* UPI Copy Options */}
                  <div className="grid grid-cols-1 gap-2 pt-1 text-xs">
                    <div className="flex items-center justify-between bg-white border border-gray-100 p-2.5 rounded-xl">
                      <div className="text-left">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">UPI Phone / Number (PhonePe/GPay)</span>
                        <span className="font-mono font-extrabold text-[#362B5A]">+91 93473 59489</span>
                      </div>
                      <button
                        onClick={() => handleCopy("9347359489", "phone")}
                        className="p-2 bg-[#EBF6FF] text-indigo-700 hover:bg-[#362B5A] hover:text-white rounded-lg transition-all cursor-pointer font-bold text-[10px] flex items-center gap-1 shrink-0"
                      >
                        {copySuccess === "phone" ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-gray-100 p-2.5 rounded-xl">
                      <div className="text-left">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">UPI ID</span>
                        <span className="font-mono font-extrabold text-[#362B5A]">9347359489@ybl</span>
                      </div>
                      <button
                        onClick={() => handleCopy("9347359489@ybl", "upi")}
                        className="p-2 bg-[#EBF6FF] text-indigo-700 hover:bg-[#362B5A] hover:text-white rounded-lg transition-all cursor-pointer font-bold text-[10px] flex items-center gap-1 shrink-0"
                      >
                        {copySuccess === "upi" ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-amber-800 leading-normal font-medium italic">
                    Account Holder Name: <strong>GADIYARAM VENKATA SUBRAMANYAM</strong>
                  </p>
                </div>

                {/* Submit Form */}
                <div className="space-y-3.5">
                  <div className="text-left">
                    <label className="block text-[11px] font-black text-[#362B5A] uppercase tracking-wider mb-1.5">
                      Enter UPI Transaction ID / UTR Number (తప్పనిసరి)
                    </label>
                    <input
                      type="text"
                      maxLength={30}
                      placeholder="e.g. 623490158293 (12-digit number)"
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value.replace(/[^0-9A-Za-z]/g, ""))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A] focus:border-transparent bg-[#EBF6FF]/20 font-mono font-bold text-sm text-center tracking-widest placeholder:font-sans placeholder:text-xs"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                      Please enter the exact transaction reference/UTR number from your UPI payment success screen.
                    </p>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleSubmitPayment}
                      disabled={isSubmittingPayment || !txnId.trim()}
                      className="w-full py-3.5 bg-[#C2242C] disabled:bg-gray-200 disabled:text-gray-400 hover:bg-opacity-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmittingPayment ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-orange-300" />
                          <span>Submit Transaction & Notify Admin</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* IT ACT 2021 REPORT / GRIEVANCE MODAL */}
            {reportingMatch && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto text-left">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-red-500/20 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-200 text-[#362B5A]">
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setReportingMatch(null);
                      setReportDesc("");
                      setReportSuccessId(null);
                    }}
                    className="absolute top-5 right-5 p-2 bg-gray-100 text-[#362B5A] hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer border border-transparent"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {reportSuccessId ? (
                    <div className="space-y-4 text-center">
                      <div className="p-3 bg-emerald-50 text-emerald-700 rounded-full w-fit mx-auto border border-emerald-100 animate-bounce">
                        <CheckCircle2 className="w-10 h-10 animate-pulse" />
                      </div>
                      <h3 className="text-xl font-extrabold text-[#362B5A]">Grievance Logged</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Your safety report has been registered with ticket ID <strong className="font-mono text-[#C2242C]">{reportSuccessId}</strong>. Sri G.V. Subramanyam (Grievance Redressal Officer) will contact both parties, audit the profile authenticity, and resolve this case within 24-48 hours.
                      </p>
                      <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 text-[11px] leading-relaxed text-emerald-800 text-left font-medium">
                        <strong>IT Act 2021 Action Timeline:</strong> We will notify you via registered WhatsApp or SMS when actions are taken (warnings issued or profile suspended).
                      </div>
                      <button
                        onClick={() => {
                          setReportingMatch(null);
                          setReportDesc("");
                          setReportSuccessId(null);
                        }}
                        className="w-full py-3 bg-[#362B5A] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-opacity-90 rounded-xl transition-all cursor-pointer"
                      >
                        Close & Continue
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!reportDesc.trim()) {
                          alert("Please provide the details of your complaint.");
                          return;
                        }
                        setIsSubmittingReport(true);
                        try {
                          const ticketId = `G-${Math.floor(10000 + Math.random() * 90000)}`;
                          const newGrievance: Grievance = {
                            id: ticketId,
                            reporterId: currentProfile.id,
                            reporterName: currentProfile.name,
                            reporterPhone: currentProfile.contact_number,
                            accusedId: reportingMatch.id,
                            accusedName: reportingMatch.name,
                            accusedPhone: reportingMatch.contact_number,
                            category: reportCategory,
                            description: reportDesc.trim(),
                            reportedAt: new Date().toISOString(),
                            status: "Pending"
                          };

                          await databaseService.saveGrievance(newGrievance);
                          setReportSuccessId(ticketId);
                        } catch (err) {
                          console.error("Failed to submit matching grievance:", err);
                          alert("Error submitting grievance. Please try again.");
                        } finally {
                          setIsSubmittingReport(false);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div className="text-center space-y-1 border-b border-gray-100 pb-3">
                        <div className="flex items-center justify-center gap-1.5 text-[9px] text-[#C2242C] font-mono tracking-widest uppercase block font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>IT ACT 2021 SAFETY REDRESSAL</span>
                        </div>
                        <h3 className="text-lg font-black text-[#362B5A] uppercase tracking-tight">Report Candidate</h3>
                        <p className="text-xs text-gray-500">Report harassment, incorrect numbers, or fake profiles securely</p>
                      </div>

                      <div className="p-3 bg-red-50/50 rounded-2xl border border-red-100 text-[11px] leading-relaxed text-red-800 font-medium">
                        <strong>Reporting Profile:</strong> {reportingMatch.name} ({reportingMatch.reg_number || "BVM-Pending"})
                        <br />
                        <strong>Contact Number:</strong> <span className="font-mono">{reportingMatch.contact_number}</span>
                      </div>

                      <div className="space-y-3 font-sans">
                        <div className="space-y-1 text-xs text-left">
                          <label className="font-bold text-gray-600 uppercase tracking-wider block">Grievance Category *</label>
                          <select
                            value={reportCategory}
                            onChange={(e) => setReportCategory(e.target.value as any)}
                            className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-3 text-xs focus:outline-none font-semibold text-gray-700 cursor-pointer"
                          >
                            <option value="Harassment/Unwanted Calls">Harassment / Abusive Phone Calls (ఉపద్రవం / అవాంఛిత ఫోన్ కాల్స్)</option>
                            <option value="Fake Profile">Fake Profile / Identity Spoofing (నకిలీ ప్రొఫైల్)</option>
                            <option value="Incorrect Information">Inaccurate / Wrong Astro Details (తప్పుడు జాతక వివరాలు)</option>
                            <option value="Misuse of Contact Details">Misuse of Contact Number (నంబర్ దుర్వినియోగం)</option>
                            <option value="Other">Other Violations (ఇతర కారణాలు)</option>
                          </select>
                        </div>

                        <div className="space-y-1 text-xs text-left">
                          <label className="font-bold text-gray-600 uppercase tracking-wider block">Incident / Harassment Details *</label>
                          <textarea
                            required
                            rows={4}
                            value={reportDesc}
                            onChange={(e) => setReportDesc(e.target.value)}
                            placeholder="Specify dates, timing of call, and exact description of what transpired. All inputs are handled confidentially."
                            className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-4 text-xs focus:outline-none leading-relaxed"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReportingMatch(null);
                            setReportDesc("");
                          }}
                          className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-[#C2242C] hover:bg-opacity-95 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                        >
                          <span>File Grievance</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

      {/* Meet & Date Proposal Modal */}
      {meetDateTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-6 text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setMeetDateTarget(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase">☕ Meet & Date Proposal</span>
              <h3 className="text-xl font-extrabold text-[#362B5A]">Propose Meet & Date with {meetDateTarget.name}</h3>
              <p className="text-xs text-gray-500">Coordinate a polite, family-friendly meeting or coffee date.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1 text-xs">
                <label className="font-bold text-gray-700 uppercase">Preferred Date *</label>
                <input
                  type="date"
                  value={meetDateForm.date}
                  onChange={(e) => setMeetDateForm({ ...meetDateForm, date: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-700 focus:outline-none"
                />
              </div>
              <div className="space-y-1 text-xs">
                <label className="font-bold text-gray-700 uppercase">Preferred Time *</label>
                <input
                  type="text"
                  value={meetDateForm.time}
                  onChange={(e) => setMeetDateForm({ ...meetDateForm, time: e.target.value })}
                  placeholder="e.g. 11:00 AM or 4:00 PM"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-700 focus:outline-none"
                />
              </div>
              <div className="space-y-1 text-xs">
                <label className="font-bold text-gray-700 uppercase">Meeting Venue / Location *</label>
                <input
                  type="text"
                  value={meetDateForm.location}
                  onChange={(e) => setMeetDateForm({ ...meetDateForm, location: e.target.value })}
                  placeholder="e.g. Peaceful Cafe / Temple Premises / Family Lounge"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-700 focus:outline-none"
                />
              </div>
              <div className="space-y-1 text-xs">
                <label className="font-bold text-gray-700 uppercase">Note / Message to Family</label>
                <textarea
                  rows={3}
                  value={meetDateForm.note}
                  onChange={(e) => setMeetDateForm({ ...meetDateForm, note: e.target.value })}
                  placeholder="We would love to arrange a family-accompanied meeting..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMeetDateTarget(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccessToast(`Meet & Date proposal successfully sent to ${meetDateTarget.name}'s family! Our coordination desk will connect with you.`);
                  setMeetDateTarget(null);
                  setTimeout(() => setSuccessToast(null), 5000);
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                Send Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pellikupulu Ceremony Request Modal */}
      {pelliChupuluTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-6 text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setPelliChupuluTarget(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase">🪔 Traditional Pellikupulu</span>
              <h3 className="text-xl font-extrabold text-[#362B5A]">Request Pellikupulu with {pelliChupuluTarget.name}</h3>
              <p className="text-xs text-gray-500">Coordinate the official traditional bride/groom viewing ceremony.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1 text-xs">
                <label className="font-bold text-gray-700 uppercase">Preferred Ceremony Date *</label>
                <input
                  type="date"
                  value={pelliChupuluForm.date}
                  onChange={(e) => setPelliChupuluForm({ ...pelliChupuluForm, date: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-700 focus:outline-none"
                />
              </div>
              <div className="space-y-1 text-xs">
                <label className="font-bold text-gray-700 uppercase">Venue Preference *</label>
                <input
                  type="text"
                  value={pelliChupuluForm.venue}
                  onChange={(e) => setPelliChupuluForm({ ...pelliChupuluForm, venue: e.target.value })}
                  placeholder="e.g. Bride's Residence / Function Hall / Temple Hall"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-700 focus:outline-none"
                />
              </div>
              <div className="space-y-1 text-xs">
                <label className="font-bold text-gray-700 uppercase">Family Note & Muhurtam Preference</label>
                <textarea
                  rows={3}
                  value={pelliChupuluForm.note}
                  onChange={(e) => setPelliChupuluForm({ ...pelliChupuluForm, note: e.target.value })}
                  placeholder="Please coordinate with both families regarding elders presence..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPelliChupuluTarget(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccessToast(`Pellikupulu Ceremony request successfully submitted for ${pelliChupuluTarget.name}! Chief Registrar will coordinate auspicious timings.`);
                  setPelliChupuluTarget(null);
                  setTimeout(() => setSuccessToast(null), 5000);
                }}
                className="flex-1 py-2.5 bg-[#C2242C] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                Request Pellikupulu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pandith Consultation Modal */}
      <PandithConsultationModal
        isOpen={showPandithModal}
        onClose={() => setShowPandithModal(false)}
      />

      {/* Success Toast Banner */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-[250] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border-2 border-emerald-400">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-white" />
          <span className="text-xs font-bold leading-relaxed">{successToast}</span>
        </div>
      )}
    </>
  );
}
