import React from "react";
import { 
  Heart, 
  Sparkles, 
  Compass, 
  ShieldCheck, 
  MoreVertical, 
  Bell, 
  Phone, 
  User, 
  Grid 
} from "lucide-react";

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  isLoggedInUserAdmin: boolean;
  onOpenQuickMenu: () => void;
  onOpenPandithModal: () => void;
  onOpenAuditModal: () => void;
  adminAuditUnread?: number;
}

export default function BottomNav({
  currentTab,
  setCurrentTab,
  isAdmin,
  setIsAdmin,
  isLoggedInUserAdmin,
  onOpenQuickMenu,
  onOpenPandithModal,
  onOpenAuditModal,
  adminAuditUnread = 0
}: BottomNavProps) {
  const isUserAdmin = Boolean(
    isLoggedInUserAdmin ||
    isAdmin ||
    (typeof window !== "undefined" && localStorage.getItem("bramhana_admin_session") === "true")
  );

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#362B5A]/95 backdrop-blur-md border-t border-orange-500/25 px-2 py-1 shadow-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 items-center justify-around h-14 max-w-lg mx-auto">
        
        {/* Tab 1: Matches / Home */}
        <button
          type="button"
          onClick={() => setCurrentTab("matches")}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-all cursor-pointer relative ${
            currentTab === "matches" 
              ? "text-amber-300 font-extrabold" 
              : "text-white/70 hover:text-white"
          }`}
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${currentTab === "matches" ? "fill-amber-300 stroke-amber-300" : ""}`} />
            {currentTab === "matches" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Matches</span>
        </button>

        {/* Tab 2: Kundali / Profile */}
        <button
          type="button"
          onClick={() => setCurrentTab("profile")}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-all cursor-pointer relative ${
            currentTab === "profile" 
              ? "text-amber-300 font-extrabold" 
              : "text-white/70 hover:text-white"
          }`}
        >
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            {currentTab === "profile" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Kundali</span>
        </button>

        {/* Tab 3: Pandith Consultation Desk (Direct Action) */}
        <button
          type="button"
          onClick={onOpenPandithModal}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-all cursor-pointer text-white/90 hover:text-amber-300 relative group"
        >
          <div className="w-9 h-9 -mt-3 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg border-2 border-[#362B5A] group-active:scale-95 transition-transform">
            <Compass className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-bold text-amber-200">Pandith</span>
        </button>

        {/* Tab 4: Admin Desk or Call Logs */}
        {isUserAdmin ? (
          <button
            type="button"
            onClick={() => {
              if (isAdmin) {
                onOpenAuditModal();
              } else {
                setIsAdmin(true);
              }
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-all cursor-pointer relative ${
              isAdmin 
                ? "text-amber-300 font-extrabold" 
                : "text-white/70 hover:text-white"
            }`}
          >
            <div className="relative">
              <ShieldCheck className="w-5 h-5" />
              {adminAuditUnread > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                  {adminAuditUnread}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-bold">
              {isAdmin ? "Audit" : "Admin"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentTab("callHistory")}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-all cursor-pointer relative ${
              currentTab === "callHistory" 
                ? "text-amber-300 font-extrabold" 
                : "text-white/70 hover:text-white"
            }`}
          >
            <div className="relative">
              <Phone className="w-5 h-5" />
              {currentTab === "callHistory" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Calls</span>
          </button>
        )}

        {/* Tab 5: 3-Dots / Menu Navigator */}
        <button
          type="button"
          onClick={onOpenQuickMenu}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-white/80 hover:text-white transition-all cursor-pointer relative active:scale-95"
        >
          <div className="p-1 rounded-lg bg-white/10">
            <MoreVertical className="w-4.5 h-4.5 text-amber-300" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-bold">Menu</span>
        </button>

      </div>
    </nav>
  );
}
