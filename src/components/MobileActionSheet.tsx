import React, { useState } from "react";
import { 
  X, 
  Heart, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  Calendar, 
  Share2, 
  Bookmark, 
  BookmarkCheck, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Ban, 
  ExternalLink,
  ChevronRight,
  Compass,
  Bell,
  UserCheck
} from "lucide-react";
import { Profile } from "../types";
import { adminNotificationService } from "../lib/databaseService";

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  match: Profile | null;
  currentProfile: Profile | null;
  isAdmin: boolean;
  onExpressInterest: (profile: Profile) => void;
  onViewDetails: (profile: Profile) => void;
  onOpenDateProposal?: (profile: Profile) => void;
  onOpenPandith?: (profile: Profile) => void;
  onReportGrievance?: (profile: Profile) => void;
  onStatusUpdated?: (updatedProfile: Profile) => void;
}

export default function MobileActionSheet({
  isOpen,
  onClose,
  match,
  currentProfile,
  isAdmin,
  onExpressInterest,
  onViewDetails,
  onOpenDateProposal,
  onOpenPandith,
  onReportGrievance,
  onStatusUpdated
}: MobileActionSheetProps) {
  const [isShortlisted, setIsShortlisted] = useState<boolean>(() => {
    if (!match) return false;
    try {
      const saved = localStorage.getItem("bramhana_shortlisted_ids");
      const list: string[] = saved ? JSON.parse(saved) : [];
      return list.includes(match.id);
    } catch (e) {
      return false;
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [adminWorking, setAdminWorking] = useState<boolean>(false);
  const [showAdminStatusSelect, setShowAdminStatusSelect] = useState<boolean>(false);

  if (!isOpen || !match) return null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const calculateAge = (dobString: string): number => {
    if (!dobString) return 28;
    const diff = Date.now() - new Date(dobString).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970) || 28;
  };

  const handleToggleShortlist = () => {
    try {
      const saved = localStorage.getItem("bramhana_shortlisted_ids");
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (list.includes(match.id)) {
        list = list.filter((id) => id !== match.id);
        setIsShortlisted(false);
        triggerToast("Profile removed from shortlists");
      } else {
        list.push(match.id);
        setIsShortlisted(true);
        triggerToast("Profile bookmarked to your sacred shortlist! ⭐");
      }
      localStorage.setItem("bramhana_shortlisted_ids", JSON.stringify(list));
    } catch (e) {
      triggerToast("Shortlist updated");
    }
  };

  const handleShareProfile = async () => {
    const shareTitle = `Shubhamastu Matrimony - ${match.name} (${match.sub_caste})`;
    const shareText = `Namaskaram! Please view the sacred matrimonial profile of ${match.name} (${match.sub_caste}, Gotram: ${match.gothram || "Brahmin"}, Age: ${calculateAge(match.dob)} yrs). Registered under Shubhamastu Vivaha Vedika.`;
    const shareUrl = window.location.origin + `?profile=${match.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        triggerToast("Shared successfully!");
      } catch (err) {
        // User dismissed share
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        triggerToast("Profile link copied to clipboard!");
      } catch (err) {
        triggerToast("Unable to copy profile link");
      }
    }
  };

  const handleWhatsAppChat = () => {
    const cleaned = (match.contact_number || "").replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Namaskaram 🙏, we noticed the profile of ${match.name} on Shubhamastu Brahmin Matrimony (${match.reg_number || "Verified"}). We would like to connect families for sacred matrimonial discussion.`
    );
    if (!cleaned) {
      triggerToast("Contact number pending verification");
      return;
    }
    window.open(`https://wa.me/91${cleaned.slice(-10)}?text=${msg}`, "_blank");
  };

  const handleAdminStatusChange = async (newStatus: "Verified" | "Active" | "Pending" | "Declined") => {
    setAdminWorking(true);
    try {
      const currentAdminRaw = localStorage.getItem("bramhana_current_admin");
      let adminId = "admin-subbu";
      let adminName = "Sri G.V. Subramanyam";
      if (currentAdminRaw) {
        try {
          const parsed = JSON.parse(currentAdminRaw);
          adminId = parsed.id || adminId;
          adminName = parsed.name || adminName;
        } catch (e) {}
      }

      await adminNotificationService.logAction(
        adminId,
        adminName,
        `Quick 3-Dots Status Update: ${match.name} -> ${newStatus}`,
        `Admin modified candidate status for Reg: ${match.reg_number || match.id} (${match.name}) from 3-dots mobile drawer.`,
        {
          targetCandidateId: match.id,
          targetCandidateRegNumber: match.reg_number,
          category: "status"
        }
      );

      const updated = { ...match, status: newStatus };
      if (onStatusUpdated) {
        onStatusUpdated(updated);
      }
      triggerToast(`Status changed to ${newStatus} & logged in 3-Admin Audit Bell!`);
      setShowAdminStatusSelect(false);
    } catch (err) {
      triggerToast("Failed to update status");
    } finally {
      setAdminWorking(false);
    }
  };

  const handleAdminAuditNote = async () => {
    const note = prompt(`Enter administrative note or cross-audit log entry for ${match.name}:`, `Verified horoscope and Gotram alignment for ${match.name}`);
    if (!note) return;

    setAdminWorking(true);
    try {
      const currentAdminRaw = localStorage.getItem("bramhana_current_admin");
      let adminId = "admin-subbu";
      let adminName = "Sri G.V. Subramanyam";
      if (currentAdminRaw) {
        try {
          const parsed = JSON.parse(currentAdminRaw);
          adminId = parsed.id || adminId;
          adminName = parsed.name || adminName;
        } catch (e) {}
      }

      await adminNotificationService.logAction(
        adminId,
        adminName,
        `Manual Audit Entry: ${match.name}`,
        note,
        {
          targetCandidateId: match.id,
          targetCandidateRegNumber: match.reg_number,
          category: "verification"
        }
      );
      triggerToast("Activity recorded to 3-Admin Cross-Audit Bell! 🔔");
    } catch (e) {
      triggerToast("Error recording audit log");
    } finally {
      setAdminWorking(false);
    }
  };

  const age = calculateAge(match.dob);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-emerald-600 text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-bold border border-emerald-400 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Backdrop tap to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Action Sheet Panel */}
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom duration-300 border border-gray-100">
        
        {/* Top Pull Handle for Mobile Gestures */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Candidate Profile Header Card */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#362B5A] to-[#453472] text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
            aria-label="Close options"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="relative">
              <img
                src={match.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=200"}
                alt={match.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 rounded-full text-white ring-2 ring-[#362B5A]">
                <ShieldCheck className="w-3 h-3" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base font-extrabold text-white truncate leading-tight">
                  {match.surname ? `${match.surname} ` : ""}{match.name}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                  {match.reg_number || "BVM"}
                </span>
              </div>
              <p className="text-xs text-blue-100/90 font-medium mt-0.5">
                {age} yrs · {match.height_feet || 5.8} Ft · {match.sub_caste}
              </p>
              <p className="text-[11px] text-amber-300 font-mono truncate">
                Gotram: {match.gothram || "Brahmin"} · {match.profession || "Professional"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Action List */}
        <div className="overflow-y-auto p-4 space-y-4 divide-y divide-gray-100 flex-1">
          
          {/* USER QUICK ACTIONS */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2 px-1">
              Candidate Actions (అభ్యర్థి వివరాలు & స్పందనలు)
            </span>

            {/* Express Interest */}
            <button
              onClick={() => {
                onExpressInterest(match);
                onClose();
              }}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between hover:bg-emerald-50 text-emerald-800 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Heart className="w-5 h-5 fill-emerald-600 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800">Express Sacred Interest</p>
                  <p className="text-[10px] text-gray-500">పరిచయ ప్రస్తావన పంపండి</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
            </button>

            {/* Direct WhatsApp Chat */}
            <button
              onClick={handleWhatsAppChat}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between hover:bg-emerald-50 text-emerald-900 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800">Chat on WhatsApp</p>
                  <p className="text-[10px] text-gray-500">వాట్సాప్ సందేశం పంపండి</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
            </button>

            {/* Full Sacred Profile Details */}
            <button
              onClick={() => {
                onViewDetails(match);
                onClose();
              }}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between hover:bg-blue-50 text-blue-900 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-blue-800">Sacred Biodata & Kundali</p>
                  <p className="text-[10px] text-gray-500">పూర్తి జాతకం మరియు కుటుంబ వివరాలు</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </button>

            {/* Date / Pelli Chupulu Proposal */}
            {onOpenDateProposal && (
              <button
                onClick={() => {
                  onOpenDateProposal(match);
                  onClose();
                }}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between hover:bg-purple-50 text-purple-900 transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-purple-800">Request Pelli Chupulu / Meet</p>
                    <p className="text-[10px] text-gray-500">సమావేశం లేదా పెళ్లి చూపులు అభ్యర్థించండి</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
              </button>
            )}

            {/* Shortlist Bookmark Toggle */}
            <button
              onClick={handleToggleShortlist}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between hover:bg-amber-50 text-amber-900 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {isShortlisted ? <BookmarkCheck className="w-5 h-5 text-amber-600" /> : <Bookmark className="w-5 h-5 text-amber-600" />}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-amber-800">
                    {isShortlisted ? "Bookmarked in Shortlist" : "Bookmark / Shortlist"}
                  </p>
                  <p className="text-[10px] text-gray-500">సేవ్ చేసి తర్వాత చూడండి</p>
                </div>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                {isShortlisted ? "Saved" : "Save"}
              </span>
            </button>

            {/* Share Profile */}
            <button
              onClick={handleShareProfile}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between hover:bg-slate-50 text-slate-800 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Share2 className="w-5 h-5 text-slate-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900">Share Matrimonial Biodata</p>
                  <p className="text-[10px] text-gray-500">కుటుంబ సభ్యులకు లింక్ షేర్ చేయండి</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Grievance Cell / Report Discrepancy */}
            {onReportGrievance && (
              <button
                onClick={() => {
                  onReportGrievance(match);
                  onClose();
                }}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between hover:bg-rose-50 text-rose-800 transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-rose-800">Report Discrepancy (గ్రీవెన్స్ సెల్)</p>
                    <p className="text-[10px] text-gray-500">తప్పుడు సమాచారం లేదా ప్రవర్తన నివేదించండి</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-rose-600" />
              </button>
            )}
          </div>

          {/* ADMIN POWER CONTROLS DOCK (Visible to Administrators) */}
          {isAdmin && (
            <div className="pt-3 space-y-2.5 bg-amber-50/50 p-3 rounded-2xl border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-900 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>3-Admin Power Controls (అడ్మిన్ నియంత్రణలు)</span>
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 font-bold">
                  Status: {match.status}
                </span>
              </div>

              {/* Status Selector Drawer */}
              {!showAdminStatusSelect ? (
                <button
                  disabled={adminWorking}
                  onClick={() => setShowAdminStatusSelect(true)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-700" />
                    <span>Quick Status Change / ధృవీకరణ</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-mono">Current: {match.status} ▾</span>
                </button>
              ) : (
                <div className="p-2.5 bg-white rounded-xl border border-amber-300 space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-700 mb-1">Set candidate status:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleAdminStatusChange("Verified")}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 cursor-pointer"
                    >
                      ✓ Mark Verified
                    </button>
                    <button
                      onClick={() => handleAdminStatusChange("Active")}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold border border-blue-300 cursor-pointer"
                    >
                      ✓ Mark Active
                    </button>
                    <button
                      onClick={() => handleAdminStatusChange("Pending")}
                      className="p-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded-lg text-xs font-bold border border-yellow-300 cursor-pointer"
                    >
                      ⏳ Mark Pending
                    </button>
                    <button
                      onClick={() => handleAdminStatusChange("Declined")}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-800 rounded-lg text-xs font-bold border border-red-300 cursor-pointer"
                    >
                      ✕ Suspend / Freeze
                    </button>
                  </div>
                </div>
              )}

              {/* Route to Pandith Consultation Desk */}
              {onOpenPandith && (
                <button
                  disabled={adminWorking}
                  onClick={() => {
                    onOpenPandith(match);
                    onClose();
                  }}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-purple-700" />
                    <span>Assign Pandith Consultation Desk</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
                </button>
              )}

              {/* Manual Entry to 3-Admin Cross Audit Bell */}
              <button
                disabled={adminWorking}
                onClick={handleAdminAuditNote}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Bell className="w-4 h-4 animate-bounce" />
                <span>Log to 3-Admin Audit Bell</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer Quick Dismiss */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
          >
            Close Menu
          </button>
        </div>

      </div>
    </div>
  );
}
