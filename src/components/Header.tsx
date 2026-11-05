import React, { useState, useEffect } from "react";
import { Heart, ShieldCheck, Sparkles, User, Settings, LogOut, AlertCircle, Calendar, MoreVertical, X, CheckCircle, TrendingUp, Tag, Gift, Phone, Grid, Bell, FolderArchive } from "lucide-react";
import { PandithConsultationModal } from "./PandithConsultationModal";
import NotificationBell from "./NotificationBell";
import AdminAuditModal from "./AdminAuditModal";
import FrontendExportModal from "./FrontendExportModal";
import { Profile } from "../types";
import { adminNotificationService } from "../lib/databaseService";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  onLogout?: () => void;
  isLoggedInUserAdmin?: boolean;
  currentProfile?: Profile | null;
  allProfiles?: Profile[];
}

export default function Header({ currentTab, setCurrentTab, isAdmin, setIsAdmin, onLogout, isLoggedInUserAdmin, currentProfile, allProfiles }: HeaderProps) {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showPandithModal, setShowPandithModal] = useState(false);
  const [showAdminAuditModal, setShowAdminAuditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [adminAuditUnread, setAdminAuditUnread] = useState(0);

  // Check if current user has root admin clearance (Subbu, Subba Reddy, Tejaswar or admin session)
  const isUserAdmin = Boolean(
    isLoggedInUserAdmin || 
    (typeof window !== "undefined" && localStorage.getItem("bramhana_admin_session") === "true") ||
    currentProfile?.id === "admin-subbu" ||
    currentProfile?.id === "admin-subba-reddy" ||
    currentProfile?.id === "admin-tejaswar" ||
    currentProfile?.role === "admin"
  );

  useEffect(() => {
    if (!isUserAdmin) return;
    const unsub = adminNotificationService.subscribe((list) => {
      setAdminAuditUnread(list.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [isUserAdmin]);

  useEffect(() => {
    const handleOpenMenu = () => setShowQuickMenu(true);
    const handleOpenPandith = () => setShowPandithModal(true);
    const handleOpenAudit = () => setShowAdminAuditModal(true);

    window.addEventListener("open-portal-menu", handleOpenMenu);
    window.addEventListener("open-pandith-consultation", handleOpenPandith);
    window.addEventListener("open-admin-audit", handleOpenAudit);

    return () => {
      window.removeEventListener("open-portal-menu", handleOpenMenu);
      window.removeEventListener("open-pandith-consultation", handleOpenPandith);
      window.removeEventListener("open-admin-audit", handleOpenAudit);
    };
  }, []);

  const tabsList = [
    { id: "matches", label: "Matched Souls (మ్యాచెస్)", icon: Heart },
    { id: "compact-kebab", label: "Anti-Scroll Kebab UI (జీరో-క్లటర్ వ్యూ)", icon: Sparkles },
    { id: "checkout", label: "Checkout & Coupons (సభ్యత్వ రుసుము)", icon: Tag },
    { id: "referrals", label: "Refer & Earn ₹800 (రిఫరల్ హబ్)", icon: Gift },
    { id: "profile", label: "Spiritual Kundali (కుండలి)", icon: Sparkles },
    { id: "preferences", label: "Partner Criteria (అంచనాలు)", icon: User },
    { id: "upload", label: "Sacred Uploads (ఫోటోలు/పత్రాలు)", icon: Settings },
    { id: "calendar", label: "Calendar & Reminders (క్యాలెండర్)", icon: Calendar },
    { id: "callHistory", label: "Call History & Logs (కాల్ హిస్టరీ)", icon: Phone },
    { id: "grievances", label: "Grievance Cell (గ్రీవెన్స్)", icon: AlertCircle },
  ];

  return (
    <>
      <header className="bg-[#362B5A] text-white shadow-lg border-b border-orange-500/25 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20">
            {/* Logo / Spiritual Theme */}
            <div 
              onClick={() => setCurrentTab("matches")}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none"
            >
              <div className="bg-[#C2242C] p-1.5 sm:p-2.5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-white fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-lg font-extrabold tracking-wider font-sans uppercase">Shubhamastu</span>
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400" />
                </div>
                <p className="text-[8px] sm:text-[10px] text-blue-200/80 font-mono tracking-widest uppercase">శుభమస్తు వివాహ వేదిక</p>
              </div>
            </div>

            {/* Clean Right Controls: Admin Switch, Admin Cross-Audit Bell, Notification Bell, Menu, & Sign Out */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {isUserAdmin && (
                <button
                  onClick={() => setIsAdmin(!isAdmin)}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shadow-md ${
                    isAdmin
                      ? "bg-amber-500 hover:bg-amber-400 text-black border border-amber-300"
                      : "bg-blue-600 hover:bg-blue-500 text-white border border-blue-400"
                  }`}
                  title={isAdmin ? "Switch to User Portal View" : "Switch to Admin Sanctuary"}
                >
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{isAdmin ? "User Portal View" : "Admin Sanctuary"}</span>
                  <span className="sm:hidden">{isAdmin ? "User" : "Admin"}</span>
                </button>
              )}

              {/* 3-Admin Cross-Audit Bell Button (Header Trigger) */}
              {isUserAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAdminAuditModal(true)}
                  className="relative min-h-[44px] px-2.5 sm:px-3 py-2 bg-gradient-to-r from-amber-500/25 to-orange-500/25 hover:from-amber-500/40 hover:to-orange-500/40 border border-amber-400/50 text-amber-300 hover:text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 active:scale-95"
                  title="3-Admin Cross-Audit Bell: Real-time logs of actions by Sri Subramanyam, Sri Subba Reddy & Sri Tejaswar Reddy"
                >
                  <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
                  <span className="hidden md:inline text-[11px] font-black uppercase tracking-wider">Audit Bell</span>
                  {adminAuditUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-md animate-pulse">
                      {adminAuditUnread}
                    </span>
                  )}
                </button>
              )}

              {/* User Notification Bell Dropdown */}
              <NotificationBell currentProfile={currentProfile || null} allProfiles={allProfiles || []} onNavigateTab={setCurrentTab} />

              {/* 3 Dots Menu Button */}
              <button
                id="quick-menu-dots-btn"
                onClick={() => setShowQuickMenu(true)}
                className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 border border-white/15 active:scale-95"
                title="Open Navigation Menu"
                aria-label="Open Navigation Menu"
              >
                <MoreVertical className="w-5 h-5 text-amber-300" />
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider hidden xs:inline">Menu</span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="min-h-[44px] flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-[#C2242C]/20 border border-red-500/30 text-rose-300 hover:bg-[#C2242C] hover:text-white transition-all cursor-pointer active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Clean Bottom Sheet / Modal for Quick Menu on Mobile & Center on Desktop */}
      {showQuickMenu && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-[#362B5A] border-t-2 sm:border-2 border-amber-400/40 rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl relative space-y-4 text-left max-h-[85vh] overflow-y-auto">
            {/* Grab handle for touch users */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto sm:hidden" />

            <button
              onClick={() => setShowQuickMenu(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-[#C2242C] text-white rounded-full transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1 pb-3 border-b border-white/10">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">⚡ Portal Navigator</span>
              <h3 className="text-base sm:text-lg font-black text-white uppercase">Shubhamastu Sections</h3>
              <p className="text-xs text-blue-200/70">Select any section to jump instantly.</p>
            </div>
            <div className="space-y-2 py-2">
              {/* Dedicated 3 Root Admins & Cross-Audit Section for Admins */}
              {isUserAdmin && (
                <div className="space-y-2.5 mb-3 pb-3 border-b border-white/10 bg-white/5 p-3 rounded-2xl border border-amber-400/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest font-black flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>👑 3 Root Admins & Cross-Audit</span>
                    </span>
                    {adminAuditUnread > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                        {adminAuditUnread} New
                      </span>
                    )}
                  </div>

                  {/* 3 Admin Axis Overview Cards */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="p-1.5 rounded-xl bg-black/20 border border-amber-400/30 text-amber-200">
                      <p className="font-extrabold truncate">👑 G.V. Subbu</p>
                      <p className="text-[8px] text-blue-200/70 font-mono">Stage 1 Super</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-black/20 border border-emerald-400/30 text-emerald-200">
                      <p className="font-extrabold truncate">🏛️ P.V. Subba R.</p>
                      <p className="text-[8px] text-blue-200/70 font-mono">Stage 2 Head</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-black/20 border border-indigo-400/30 text-indigo-200">
                      <p className="font-extrabold truncate">⚖️ K. Tejaswar</p>
                      <p className="text-[8px] text-blue-200/70 font-mono">Grievance Off.</p>
                    </div>
                  </div>

                  {/* Open Audit Bell Direct Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickMenu(false);
                      setShowAdminAuditModal(true);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition-all cursor-pointer shadow-lg min-h-[44px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-black/15 text-slate-950 rounded-lg">
                        <Bell className="w-4 h-4 animate-bounce" />
                      </div>
                      <span className="uppercase">🔔 3-Admin Audit Bell & Activity Logs</span>
                    </div>
                    {adminAuditUnread > 0 ? (
                      <span className="bg-slate-950 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                        {adminAuditUnread} Unread
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-900 font-mono">Live</span>
                    )}
                  </button>

                  {/* 14 Mandatory Play Store Pre-Flight QA Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickMenu(false);
                      window.dispatchEvent(new CustomEvent("open-playstore-testing"));
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white transition-all cursor-pointer shadow-md min-h-[44px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧪</span>
                      <span className="uppercase tracking-wider">14 Play Store Mandatory Tests</span>
                    </div>
                    <span className="text-[9px] bg-black/20 text-blue-200 px-2 py-0.5 rounded-full font-mono font-bold">
                      Pre-Flight
                    </span>
                  </button>

                  {/* Switch between Admin Sanctuary and User Portal */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdmin(!isAdmin);
                      setShowQuickMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border min-h-[40px] ${
                      isAdmin
                        ? "bg-amber-400/20 text-amber-200 border-amber-400/40"
                        : "bg-blue-600/30 hover:bg-blue-600/50 text-blue-100 border-blue-400/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span>{isAdmin ? "Switch to User Portal View" : "Switch to Admin Sanctuary"}</span>
                    </div>
                    <span className="text-[9px] text-amber-300 font-mono uppercase">{isAdmin ? "Admin Active" : "User View"}</span>
                  </button>
                </div>
              )}

              {isAdmin && (
                <div className="space-y-2 mb-3 pb-3 border-b border-white/10">
                  <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest block font-bold">👑 Admin Sanctuary Shortcuts</span>
                  <button
                    onClick={() => {
                      setIsAdmin(true);
                      setShowQuickMenu(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-md min-h-[44px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-black/10 text-slate-950">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="uppercase font-black">📊 Revenue & Financial Desk</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsAdmin(true);
                      setShowQuickMenu(false);
                      window.scrollTo({ top: 350, behavior: "smooth" });
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/15 min-h-[44px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/10 text-amber-300">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="uppercase">👥 Registered Candidates List</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsAdmin(true);
                      setShowQuickMenu(false);
                      window.scrollTo({ top: 250, behavior: "smooth" });
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/15 min-h-[44px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="uppercase">📈 Registration Graphs & Analytics</span>
                    </div>
                  </button>
                </div>
              )}

              {!isAdmin && tabsList.map((t) => {
                const Icon = t.icon;
                const isSelected = currentTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setCurrentTab(t.id);
                      setShowQuickMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                      isSelected
                        ? "bg-[#C2242C] text-white shadow-lg border border-red-400"
                        : "bg-white/5 hover:bg-white/10 text-blue-100 border border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isSelected ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-300"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="uppercase">{t.label}</span>
                    </div>
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setShowQuickMenu(false);
                setShowPandithModal(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-md uppercase tracking-wider min-h-[44px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-black/10 text-slate-950">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>🏛️ Consult Vedic Pandith (జాతక పరిశీలన)</span>
              </div>
            </button>

            {/* Quick Menu Frontend Export Option */}
            <button
              type="button"
              onClick={() => {
                setShowQuickMenu(false);
                setShowExportModal(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white transition-all cursor-pointer shadow-md min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <FolderArchive className="w-4 h-4 text-emerald-200" />
                <span className="uppercase">📦 Download & Share Frontend (WA / Mail)</span>
              </div>
              <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-mono text-emerald-200">ZIP</span>
            </button>

            <button
              onClick={() => setShowQuickMenu(false)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer min-h-[44px]"
            >
              Close Menu
            </button>
          </div>
        </div>
      )}

      {/* Pandith Consultation Modal */}
      <PandithConsultationModal isOpen={showPandithModal} onClose={() => setShowPandithModal(false)} />

      {/* 3-Admin Cross-Audit Bell Modal */}
      <AdminAuditModal isOpen={showAdminAuditModal} onClose={() => setShowAdminAuditModal(false)} />

      {/* Complete Frontend Export & Share Modal */}
      <FrontendExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </>
  );
}
