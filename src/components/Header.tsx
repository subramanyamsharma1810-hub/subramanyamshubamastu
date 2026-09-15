import React, { useState } from "react";
import { Heart, ShieldCheck, Sparkles, User, Settings, LogOut, AlertCircle, Calendar, MoreVertical, X, CheckCircle, TrendingUp, Tag, Gift } from "lucide-react";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  onLogout?: () => void;
  isLoggedInUserAdmin?: boolean;
}

export default function Header({ currentTab, setCurrentTab, isAdmin, setIsAdmin, onLogout, isLoggedInUserAdmin }: HeaderProps) {
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const tabsList = [
    { id: "matches", label: "Matched Souls (మ్యాచెస్)", icon: Heart },
    { id: "compact-kebab", label: "Anti-Scroll Kebab UI (జీరో-క్లటర్ వ్యూ)", icon: Sparkles },
    { id: "checkout", label: "Checkout & Coupons (సభ్యత్వ రుసుము)", icon: Tag },
    { id: "referrals", label: "Refer & Earn ₹800 (రిఫరల్ హబ్)", icon: Gift },
    { id: "profile", label: "Spiritual Kundali (కుండలి)", icon: Sparkles },
    { id: "preferences", label: "Partner Criteria (అంచనాలు)", icon: User },
    { id: "upload", label: "Sacred Uploads (ఫోటోలు/పత్రాలు)", icon: Settings },
    { id: "calendar", label: "Calendar & Reminders (క్యాలెండర్)", icon: Calendar },
    { id: "grievances", label: "Grievance Cell (గ్రీవెన్స్)", icon: AlertCircle },
  ];

  return (
    <header className="bg-[#362B5A] text-white shadow-lg border-b border-orange-500/25 sticky top-0 z-50">
      {/* Subdomain & URL Address Bar Badge */}
      <div className="bg-black/60 border-b border-white/10 px-4 py-1.5 text-[11px] font-mono text-amber-300 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <span className="text-emerald-400 font-bold flex items-center gap-1">🔒 <span className="hidden xs:inline">https://</span></span>
          <span className="font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">shubhamastu.in</span>
          <span className="text-amber-300 font-bold">/{currentTab}</span>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">Active Subdomain Route</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo / Spiritual Theme */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-[#C2242C] p-2 sm:p-2.5 rounded-full flex items-center justify-center shadow-md animate-pulse">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-lg font-extrabold tracking-wider font-sans uppercase">Shubhamastu</span>
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-blue-200/80 font-mono tracking-widest uppercase">శుభమస్తు వివాహ వేదిక</p>
            </div>
          </div>

          {/* Clean Right Controls: 3-Dots Menu & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedInUserAdmin && typeof window !== "undefined" && localStorage.getItem("bramhana_admin_session") === "true" && (
              <button
                onClick={() => setIsAdmin(!isAdmin)}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                  isAdmin
                    ? "bg-amber-500 hover:bg-amber-400 text-black border border-amber-300"
                    : "bg-blue-600 hover:bg-blue-500 text-white border border-blue-400"
                }`}
                title={isAdmin ? "Switch to User Portal View" : "Switch to Admin Sanctuary"}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{isAdmin ? "User Portal View" : "Admin Sanctuary"}</span>
              </button>
            )}

            {/* 3 Dots Menu Button */}
            <button
              id="quick-menu-dots-btn"
              onClick={() => setShowQuickMenu(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 border border-white/15"
              title="Open Navigation Menu"
            >
              <MoreVertical className="w-5 h-5 text-amber-300" />
              <span className="text-xs font-black uppercase tracking-wider hidden xs:inline">Menu</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#C2242C]/20 border border-red-500/30 text-rose-300 hover:bg-[#C2242C] hover:text-white transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clean 3-Dots Menu Modal */}
      {showQuickMenu && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#362B5A] border-2 border-amber-400/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 text-left">
            <button
              onClick={() => setShowQuickMenu(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-[#C2242C] text-white rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1 pb-3 border-b border-white/10">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">⚡ Portal Navigator</span>
              <h3 className="text-lg font-black text-white uppercase">Shubhamastu Sections</h3>
              <p className="text-xs text-blue-200/70">Select any section to jump instantly.</p>
            </div>
            <div className="space-y-2 py-2">
              {isAdmin && (
                <div className="space-y-2 mb-3 pb-3 border-b border-white/10">
                  <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest block font-bold">👑 Admin Sanctuary Shortcuts</span>
                  <button
                    onClick={() => {
                      setIsAdmin(true);
                      setShowQuickMenu(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-md"
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
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/15"
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
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/15"
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
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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

              {isLoggedInUserAdmin && typeof window !== "undefined" && localStorage.getItem("bramhana_admin_session") === "true" && (
                <button
                  onClick={() => {
                    setIsAdmin(!isAdmin);
                    setShowQuickMenu(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isAdmin
                      ? "bg-amber-500 text-black shadow-lg"
                      : "bg-blue-600/30 hover:bg-blue-600/50 text-blue-100 border border-blue-400/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-black/20 text-white">
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                    </div>
                    <span className="uppercase">{isAdmin ? "Exit Admin Control Panel" : "Open Admin Control Panel"}</span>
                  </div>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowQuickMenu(false)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
            >
              Close Menu
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

