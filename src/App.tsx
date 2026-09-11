import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./components/Header";
import MyProfileForm from "./components/MyProfileForm";
import PartnerPreferencesForm from "./components/PartnerPreferencesForm";
import UploadCenter from "./components/UploadCenter";
import MatchList from "./components/MatchList";
import AdminDashboard from "./components/AdminDashboard";
import LandingPage from "./components/LandingPage";
import GrievanceCell from "./components/GrievanceCell";
import CalendarReminders from "./components/CalendarReminders";
import { LegalFooter } from "./components/LegalModals";
import { SuspensionNotice } from "./components/SuspensionNotice";
import { Profile, PartnerPreferences } from "./types";
import { databaseService } from "./lib/databaseService";
import PublicReceiptViewer from "./components/PublicReceiptViewer";
import CompactKebabCardView from "./components/CompactKebabCardView";
import TermsPage from "./components/TermsPage";
import RefundPolicyPage from "./components/RefundPolicyPage";
import GrievancePage from "./components/GrievancePage";
import Register from "./components/Register";
import Payment from "./components/Payment";
import CheckoutPricing from "./components/CheckoutPricing";
import ReferralDashboard from "./components/ReferralDashboard";
import { Heart, Compass, Sparkles, AlertCircle, RefreshCw, Zap, TrendingUp, Palette, Check, ExternalLink, HelpCircle, ShieldCheck } from "lucide-react";

export default function App() {
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState<string>("matches");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<PartnerPreferences | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [adminMobileInput, setAdminMobileInput] = useState<string>("");
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>("");
  const [adminLoginError, setAdminLoginError] = useState<string>("");

  const [devBrandName, setDevBrandName] = useState<string>(() => {
    const saved = localStorage.getItem("bramhana_dev_brand_name");
    if (!saved || saved.includes("Murugan")) {
      localStorage.setItem("bramhana_dev_brand_name", "Glark Solutions");
      return "Glark Solutions";
    }
    return saved;
  });
  const [devBrandSlogan, setDevBrandSlogan] = useState<string>(() => {
    const saved = localStorage.getItem("bramhana_dev_brand_slogan");
    if (!saved || saved.includes("flawless craftsmanship")) {
      localStorage.setItem("bramhana_dev_brand_slogan", "A Product of Glark Solutions - Modern digital, web, and enterprise solutions.");
      return "A Product of Glark Solutions - Modern digital, web, and enterprise solutions.";
    }
    return saved;
  });
  const [isDevWidgetOpen, setIsDevWidgetOpen] = useState<boolean>(false);

  // Load active user profile and their preferences on mount
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const loggedInId = localStorage.getItem("bramhana_logged_in_user_id");
        if (loggedInId) {
          const profiles = await databaseService.getProfiles(true);
          setAllProfiles(profiles);
          let activeProfile = profiles.find((p) => p.id === loggedInId);
          if (activeProfile) {
            // Check if active suspension has expired
            if (activeProfile.status === "Declined" && activeProfile.suspension_lift_at) {
              const liftTime = new Date(activeProfile.suspension_lift_at);
              if (new Date() >= liftTime) {
                console.log(`Suspension expired on load for ${activeProfile.name}. Restoring to Verified status.`);
                const restored: Profile = {
                  ...activeProfile,
                  status: "Verified",
                  suspension_lift_at: "",
                  suspension_reason: ""
                };
                await databaseService.saveProfile(restored);
                activeProfile = restored;
              }
            }
            setCurrentProfile(activeProfile);
            const prefs = await databaseService.getPartnerPreferences(activeProfile.id);
            setPreferences(prefs);
            
            const isSystemAdmin = 
              activeProfile.id === "prof-subbu" || 
              activeProfile.id === "prof-subba-reddy" || 
              activeProfile.role === "employee" ||
              activeProfile.role === "admin" ||
              activeProfile.contact_number?.replace(/\D/g, "").includes("9347359489") || 
              activeProfile.contact_number?.replace(/\D/g, "").includes("9494949494");
            
            if (isSystemAdmin) {
              localStorage.setItem("bramhana_admin_session", "true");
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } else {
            setCurrentProfile(null);
          }
        } else {
          // If not logged in, keep currentProfile as null so LandingPage renders
          setCurrentProfile(null);
        }
      } catch (err) {
        console.error("Failed to load initial profile data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [refreshTrigger]);

  const handleLoginSuccess = (profile: Profile) => {
    setCurrentProfile(profile);
    const isSystemAdmin = 
      profile.id === "prof-subbu" || 
      profile.id === "prof-subba-reddy" || 
      profile.role === "employee" ||
      profile.role === "admin" ||
      profile.contact_number?.replace(/\D/g, "").includes("9347359489") || 
      profile.contact_number?.replace(/\D/g, "").includes("9494949494");
    
    if (isSystemAdmin) {
      localStorage.setItem("bramhana_admin_session", "true");
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");
    
    const mobileClean = adminMobileInput.trim().replace(/\D/g, "");
    const passClean = adminPasswordInput.trim();
    
    // Verify via databaseService (supports root admins and any added admins)
    const verifiedAdmin = await databaseService.verifyAdminCredentials(mobileClean, passClean);
    
    if (verifiedAdmin) {
      localStorage.setItem("bramhana_admin_session", "true");
      
      const profiles = await databaseService.getProfiles(true);
      const isSubbu = verifiedAdmin.id === "admin-subbu" || mobileClean.includes("9347359489");
      const isSubba = verifiedAdmin.id === "admin-subba-reddy" || mobileClean.includes("9494949494");
      
      let adminProf = profiles.find(p => 
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
      
      localStorage.setItem("bramhana_logged_in_user_id", adminProf.id);
      localStorage.setItem("bramhana_current_admin", JSON.stringify(verifiedAdmin));
      setCurrentProfile({
        ...adminProf,
        role: (verifiedAdmin.role as any) || adminProf.role || "admin"
      });
      setIsAdmin(true);
      setShowAdminLoginModal(false);
      setAdminPasswordInput("");
      setAdminMobileInput("");
    } else {
      setAdminLoginError("Incorrect Mobile Number or Password. Access is restricted.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bramhana_logged_in_user_id");
    localStorage.removeItem("bramhana_admin_session");
    localStorage.removeItem("bramhana_current_admin");
    setCurrentProfile(null);
    setIsAdmin(false);
  };

  const handleSaveProfile = async (updatedProfile: Profile) => {
    // Optimistic UI update - set state immediately!
    setCurrentProfile(updatedProfile);
    try {
      const saved = await databaseService.saveProfile(updatedProfile);
      setCurrentProfile(saved);
      // Trigger refresh for other components to synchronize data
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const handleSavePreferences = async (updatedPrefs: PartnerPreferences) => {
    // Optimistic UI update
    setPreferences(updatedPrefs);
    try {
      const saved = await databaseService.savePartnerPreferences(updatedPrefs);
      setPreferences(saved);
      // Trigger matches refresh
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to save preferences:", err);
    }
  };

  const handleUpdateProfileDirectly = async (updatedProfile: Profile) => {
    // Optimistic UI update
    setCurrentProfile(updatedProfile);
    try {
      await databaseService.saveProfile(updatedProfile);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to update profile directly:", err);
    }
  };

  // Top-level standalone routes
  if (location.pathname === "/terms" || location.pathname === "/terms/") {
    return <TermsPage />;
  }
  if (location.pathname === "/refund" || location.pathname === "/refund/" || location.pathname === "/refund-policy" || location.pathname === "/refund-policy/" || location.pathname === "/cancellation-and-refund") {
    return <RefundPolicyPage />;
  }
  if (location.pathname === "/grievance" || location.pathname === "/grievance/" || location.pathname === "/grievance-redressal") {
    return <GrievancePage />;
  }
  if (location.pathname === "/register" || location.pathname === "/register/") {
    return <Register />;
  }
  if (location.pathname === "/pay" || location.pathname === "/pay/") {
    return <Payment />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBF6FF] flex flex-col items-center justify-center space-y-4 p-6 text-center">
        <svg className="animate-spin h-10 w-10 text-[#C2242C]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <div className="space-y-2 max-w-xl">
          <p className="text-lg sm:text-xl font-bold text-[#362B5A] leading-relaxed font-serif">
            ఓం భూర్భువస్సువః తత్సవితుర్వరేణ్యం భర్గో దేవస్య ధీమహి ధియో యో నః ప్రచోదయాత్
          </p>
          <p className="text-xs font-semibold text-gray-600 tracking-wider uppercase font-mono">
            Aligning Brahmin Energy Fields & Gayatri Mantra Blessings...
          </p>
        </div>
      </div>
    );
  }

  // Render public receipt view if requested in URL
  const urlParams = new URLSearchParams(window.location.search);
  const receiptTxn = urlParams.get("receipt");
  if (receiptTxn) {
    return <PublicReceiptViewer transactionId={receiptTxn} onBack={() => { window.location.href = window.location.origin; }} />;
  }

  if (!currentProfile) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} devBrandName={devBrandName} devBrandSlogan={devBrandSlogan} />;
  }

  const isLoggedInUserAdmin = 
    currentProfile?.id === "prof-subbu" || 
    currentProfile?.id === "prof-subba-reddy" || 
    currentProfile?.contact_number?.replace(/\D/g, "").includes("9347359489") || 
    currentProfile?.contact_number?.replace(/\D/g, "").includes("9494949494");

  return (
    <div className="min-h-screen bg-[#EBF6FF] text-[#362B5A] font-sans flex flex-col">
      {/* Platform Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        onLogout={handleLogout}
        isLoggedInUserAdmin={isLoggedInUserAdmin}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Quick Active User Profile Card on the left (Except in Admin mode) */}
          {!isAdmin && (
            <div className="lg:col-span-3 bg-white rounded-3xl p-6 shadow-md border border-[#362B5A]/5 space-y-6">
              <div className="text-center space-y-3">
                <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-[#362B5A]/10 shadow-lg">
                  <img
                    src={currentProfile.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=400"}
                    alt={currentProfile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#362B5A] text-lg leading-tight">{currentProfile.name}</h3>
                  <p className="text-xs text-gray-500 font-semibold">{currentProfile.profession || "Sanskrit Teacher"}</p>
                </div>
                
                {/* Prominent Screenshot Key */}
                <div className="py-2 px-3 bg-amber-500/10 border-2 border-amber-400 rounded-2xl text-center space-y-0.5 shadow-sm shadow-amber-400/5 animate-pulse">
                  <span className="text-[8px] text-amber-700 block font-black uppercase tracking-widest leading-none">SACRED REGISTRATION ID</span>
                  <span className="text-sm font-black text-[#362B5A] font-mono tracking-wider">{currentProfile.reg_number || "BVM-Pending"}</span>
                </div>

                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider font-mono ${
                  currentProfile.status === "Premium"
                    ? "bg-rose-50 border-rose-200 text-[#C2242C]"
                    : currentProfile.status === "Married"
                    ? "bg-pink-50 border-pink-200 text-pink-800"
                    : currentProfile.status === "Active" || currentProfile.status === "Verified"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}>
                  {currentProfile.status === "Married" ? (
                    <span>💍</span>
                  ) : currentProfile.status === "Active" || currentProfile.status === "Verified" ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-orange-400 fill-orange-400" />
                  )}
                  <span>{currentProfile.status === "Verified" ? "Active" : currentProfile.status} status</span>
                </span>
              </div>

              {/* Astrological coordinates summary */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#C2242C] animate-spin" />
                  <span className="text-xs font-bold text-[#362B5A] uppercase tracking-wider">Your Cosmic Footprint</span>
                </div>

                {currentProfile.astrology ? (
                  <div className="space-y-3">
                    <div className="bg-[#EBF6FF] p-3 rounded-2xl border border-blue-100 text-xs font-semibold flex justify-between">
                      <span className="text-gray-500">Nakshatra:</span>
                      <span className="text-[#362B5A] font-bold">{currentProfile.astrology.nakshatra}</span>
                    </div>
                    <div className="bg-[#EBF6FF] p-3 rounded-2xl border border-blue-100 text-xs font-semibold flex justify-between">
                      <span className="text-gray-500">Tithi:</span>
                      <span className="text-[#C2242C] font-bold">{currentProfile.astrology.tithi}</span>
                    </div>
                    <div className="bg-[#EBF6FF] p-3 rounded-2xl border border-blue-100 text-xs font-semibold flex justify-between">
                      <span className="text-gray-500">Alignment:</span>
                      <span className="text-emerald-700 font-bold">{currentProfile.astrology.spiritualScore}% Match</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 text-center flex flex-col items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-[#C2242C]" />
                    <span>Astrology details pending calculations.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Central Workspace */}
          <div className={`${(isAdmin && isLoggedInUserAdmin) ? "lg:col-span-12" : "lg:col-span-9"} space-y-6`}>
            {(isAdmin && isLoggedInUserAdmin) ? (
              <AdminDashboard onRefreshTrigger={refreshTrigger} />
            ) : (
              <div>
                {currentProfile.status === "Declined" ? (
                  <SuspensionNotice
                    currentProfile={currentProfile}
                    onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
                  />
                ) : (
                  <>
                    {/* Post-Payment Active Member Notification Banner */}
                    {(!isAdmin && (currentProfile.subscription_status === "paid_100" || currentProfile.subscription_status === "paid_900" || currentProfile.status === "Verified" || currentProfile.status === "Active")) && (
                      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/20 to-blue-50/40 border-2 border-emerald-200 rounded-3xl p-6 shadow-xs mb-6 relative overflow-hidden text-left animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl translate-x-4 -translate-y-4 pointer-events-none" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-emerald-100/80 text-emerald-700 rounded-2xl shrink-0 shadow-inner">
                              <ShieldCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base font-extrabold text-[#362B5A] tracking-tight">Active Member • సక్రియం చేయబడిన సభ్యులు</h4>
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                                  Active Account
                                </span>
                              </div>
                              <p className="text-xs text-zinc-600 leading-relaxed max-w-2xl font-medium">
                                Congratulations! Your subscription is active on <strong>www.shubhamastu.in</strong>. 
                                Match recommendations are filtered according to Vedic norms (different Gothras & Groom 1–3 years elder). 
                                Please note that all candidate details are self-submitted and families are requested to verify credentials independently.
                              </p>
                              <p className="text-[11px] text-emerald-700/90 font-bold italic flex items-center gap-1 mt-1 font-sans">
                                ✨ Candidate matches matching your profile criteria are unlocked below.
                              </p>
                            </div>
                          </div>
                          
                          {currentTab !== "matches" && (
                            <button
                              onClick={() => setCurrentTab("matches")}
                              className="shrink-0 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5 self-start sm:self-center hover:scale-[1.02]"
                            >
                              <span>Review Matches</span>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {currentTab === "matches" && (
                      <MatchList
                        currentProfile={currentProfile}
                        preferences={preferences}
                        onUpdateProfile={handleUpdateProfileDirectly}
                      />
                    )}
                    {currentTab === "compact-kebab" && (
                      <div className="col-span-12 -mx-4 sm:-mx-6 lg:-mx-8 -my-8 md:-my-12">
                        <CompactKebabCardView
                          currentProfile={currentProfile}
                          profiles={allProfiles}
                          preferences={preferences}
                          onUpdateProfile={handleUpdateProfileDirectly}
                          onLogout={handleLogout}
                        />
                      </div>
                    )}
                    {currentTab === "profile" && (
                      <MyProfileForm
                        currentProfile={currentProfile}
                        onSaveProfile={handleSaveProfile}
                      />
                    )}
                    {currentTab === "preferences" && (
                      <PartnerPreferencesForm
                        userId={currentProfile.id}
                        onSavePreferences={handleSavePreferences}
                      />
                    )}
                    {currentTab === "upload" && (
                      <UploadCenter
                        currentProfile={currentProfile}
                        onUpdateProfile={handleUpdateProfileDirectly}
                      />
                    )}
                    {currentTab === "grievances" && (
                      <GrievanceCell
                        currentProfile={currentProfile}
                      />
                    )}
                    {currentTab === "calendar" && (
                      <CalendarReminders
                        currentProfile={currentProfile}
                        onUpdateProfile={handleUpdateProfileDirectly}
                        allProfiles={allProfiles}
                      />
                    )}
                    {currentTab === "checkout" && (
                      <CheckoutPricing
                        currentProfile={currentProfile}
                        onPaymentSuccess={() => {
                          setRefreshTrigger((prev) => prev + 1);
                          setCurrentTab("matches");
                        }}
                      />
                    )}
                    {currentTab === "referral" && (
                      <ReferralDashboard
                        currentProfile={currentProfile}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer copyright */}
      <LegalFooter darkTheme={false} />

      {/* SECURE ADMIN LOGIN MODAL */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleAdminVerify}
            className="bg-white border-2 border-[#362B5A] rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-200 space-y-4 text-[#362B5A] max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setShowAdminLoginModal(false);
                setAdminMobileInput("");
                setAdminPasswordInput("");
                setAdminLoginError("");
              }}
              className="absolute top-4 right-4 p-1.5 bg-gray-100 text-[#362B5A] hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center space-y-2 pb-2 border-b border-gray-100">
              <span className="text-[9px] text-[#C2242C] font-mono tracking-widest uppercase block font-bold">RESTRICTED SANCTUARY</span>
              <h3 className="text-lg font-black text-[#362B5A] uppercase tracking-tight">Pandiri People Login (వివాహ పందిరి లాగిన్)</h3>
              <p className="text-xs text-gray-500">Provide secure credentials to enter the matchmaking cockpit</p>
            </div>

            {adminLoginError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-[#C2242C] text-xs font-semibold rounded-xl text-center">
                {adminLoginError}
              </div>
            )}

            <div className="space-y-3 font-sans">
              <div className="space-y-1 text-xs text-left">
                <label className="font-bold text-[#362B5A] uppercase tracking-wider block">Pandiri Mobile Number (మొబైల్ నంబర్)</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Pandiri Mobile Number"
                  value={adminMobileInput}
                  onChange={(e) => setAdminMobileInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-4 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-xs text-left">
                <label className="font-bold text-[#362B5A] uppercase tracking-wider block">Pandiri Password (పాస్ వర్డ్)</label>
                <input
                  type="password"
                  required
                  placeholder="Enter Pandiri Password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-4 text-sm focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-2 bg-[#C2242C] text-white font-extrabold text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-orange-200" />
              <span>Login to Pandiri Hub</span>
            </button>
          </form>
        </div>
      )}

      {/* FLOATING DEVELOPER BRANDING HUB BADGE (Bottom-Left) */}
      <div className="hidden lg:block fixed bottom-4 left-4 z-[99] font-sans">
        {/* Pulsing Badge */}
        <button
          onClick={() => setIsDevWidgetOpen(true)}
          className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-2xl border border-amber-400/30 shadow-2xl hover:scale-105 active:scale-95 transition-all text-[11px] font-bold select-none cursor-pointer group shadow-amber-900/30"
        >
          <div className="relative">
            <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
          </div>
          <span className="tracking-wide">A Product of Glark Solutions</span>
        </button>

        {/* Branding Hub Modal / Bottom Drawer */}
        {isDevWidgetOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#121214] text-zinc-100 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-y-auto">
              
              {/* Close Button */}
              <button
                onClick={() => setIsDevWidgetOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white rounded-full transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Title Header */}
              <div className="border-b border-zinc-800/80 pb-4 mb-4">
                <span className="text-[9px] text-amber-400 font-mono tracking-widest uppercase block font-black">
                  SOFTWARE & ENTERPRISE SOLUTIONS
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mt-1">
                  <Palette className="w-5 h-5 text-amber-500" />
                  Glark Solutions
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  A Product of Glark Solutions — High-performance software engineering, web applications & digital platforms.
                </p>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800">
                
                {/* 1. Brand Identity */}
                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-3">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    A Product of Glark Solutions
                  </h4>
                  <p className="text-xs text-zinc-300">
                    Glark Solutions crafts scalable, highly reliable digital ecosystems, custom web architectures, and full-stack software tailored for communities, businesses, and global clients.
                  </p>
                  <p className="text-xs text-zinc-400 italic">
                    Below are enterprise brand styles. Click to select:
                  </p>

                  {/* Brand Selector Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5">
                    
                    {/* Option 1: Glark Solutions */}
                    <button
                      onClick={() => {
                        setDevBrandName("Glark Solutions");
                        setDevBrandSlogan("A Product of Glark Solutions - Modern digital, web, and enterprise solutions.");
                        localStorage.setItem("bramhana_dev_brand_name", "Glark Solutions");
                        localStorage.setItem("bramhana_dev_brand_slogan", "A Product of Glark Solutions - Modern digital, web, and enterprise solutions.");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                        devBrandName === "Glark Solutions"
                          ? "bg-amber-500/10 border-amber-500 text-white"
                          : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold block">1. Glark Solutions (Primary)</span>
                        {devBrandName === "Glark Solutions" && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-1 leading-normal italic">
                        "A Product of Glark Solutions — Modern, scalable, and trusted."
                      </span>
                    </button>

                    {/* Option 2: VelTech Systems */}
                    <button
                      onClick={() => {
                        setDevBrandName("VelTech Digital Solutions");
                        setDevBrandSlogan("We turn your digital concepts into dynamic online realities with clean code and friendly budgets.");
                        localStorage.setItem("bramhana_dev_brand_name", "VelTech Digital Solutions");
                        localStorage.setItem("bramhana_dev_brand_slogan", "We turn your digital concepts into dynamic online realities with clean code and friendly budgets.");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                        devBrandName === "VelTech Digital Solutions"
                          ? "bg-amber-500/10 border-amber-500 text-white"
                          : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold block">2. VelTech Digital (Highly Trending)</span>
                        {devBrandName === "VelTech Digital Solutions" && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-1 leading-normal italic">
                        "High-impact digital services and precision software engineering."
                      </span>
                    </button>

                    {/* Option 3: Skanda Systems */}
                    <button
                      onClick={() => {
                        setDevBrandName("Skanda Systems & Commerce");
                        setDevBrandSlogan("Engineered for growth. We craft beautiful, high-performance web applications and e-commerce stores.");
                        localStorage.setItem("bramhana_dev_brand_name", "Skanda Systems & Commerce");
                        localStorage.setItem("bramhana_dev_brand_slogan", "Engineered for growth. We craft beautiful, high-performance web applications and e-commerce stores.");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                        devBrandName === "Skanda Systems & Commerce"
                          ? "bg-amber-500/10 border-amber-500 text-white"
                          : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold block">3. Skanda Systems (Enterprise Vibe)</span>
                        {devBrandName === "Skanda Systems & Commerce" && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-1 leading-normal italic">
                        "Skanda represents the commander of divine forces. Sounds powerful and highly structured."
                      </span>
                    </button>

                    {/* Option 4: AuraSync Digital */}
                    <button
                      onClick={() => {
                        setDevBrandName("AuraSync Digital Commerce");
                        setDevBrandSlogan("Merging aesthetic brilliance with robust server engineering for premium e-commerce builds.");
                        localStorage.setItem("bramhana_dev_brand_name", "AuraSync Digital Commerce");
                        localStorage.setItem("bramhana_dev_brand_slogan", "Merging aesthetic brilliance with robust server engineering for premium e-commerce builds.");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                        devBrandName === "AuraSync Digital Commerce"
                          ? "bg-amber-500/10 border-amber-500 text-white"
                          : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold block">4. AuraSync Digital (Modern Creative)</span>
                        {devBrandName === "AuraSync Digital Commerce" && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-1 leading-normal italic">
                        "Completely modern freelance name. Evokes harmony, beauty, and synchronization."
                      </span>
                    </button>

                  </div>
                </div>

                {/* 2. Canva Pro Logo Blueprints */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-amber-500" />
                    Canva Pro Logo Layout & Font Blueprints
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Blueprint A: Bramhana Vivaha Veadika Logo */}
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-3">
                      <span className="text-[9px] uppercase tracking-wider text-amber-400 font-extrabold block">
                        DESIGN 1: MATRIMONIAL SITE
                      </span>
                      <h5 className="font-extrabold text-white text-xs">Bramhana Vivaha Veadika</h5>
                      
                      <div className="space-y-2 text-[11px] text-zinc-400">
                        <p>
                          <strong>🎨 Color Palette:</strong> Saffron (`#F15A24`), Imperial Crimson (`#C2242C`), Metallic Gold Gradient (`#D4AF37`).
                        </p>
                        <p>
                          <strong>✨ Canva Pro Elements:</strong> Search for <em>"Sacred Kalash line-art"</em>, <em>"Sacred Mandala vector"</em>, or <em>"Infinite Knot Gold"</em>.
                        </p>
                        <p>
                          <strong>✍️ Fonts to Pair:</strong> 
                          <span className="text-zinc-200 block mt-0.5">- Main: <strong>Cinzel Decorative</strong> or <strong>Playfair Display</strong> (Regal serif)</span>
                          <span className="text-zinc-200 block">- Subtitle: <strong>Montserrat</strong> or <strong>Inter</strong> (spaced tracking: 300)</span>
                        </p>
                        <div className="p-2 bg-black/40 rounded-lg text-[10px] text-zinc-500 leading-normal">
                          <strong>Layout Tip:</strong> Center the golden Kalash or circular mandala, then place "BRAMHANA VIVAHA VEADIKA" below it in luxury serif capitals.
                        </div>
                      </div>
                    </div>

                    {/* Blueprint B: E-Commerce / Freelance Brand Logo */}
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-3">
                      <span className="text-[9px] uppercase tracking-wider text-amber-400 font-extrabold block">
                        DESIGN 2: YOUR FREELANCE AGENCY
                      </span>
                      <h5 className="font-extrabold text-white text-xs">{devBrandName}</h5>
                      
                      <div className="space-y-2 text-[11px] text-zinc-400">
                        <p>
                          <strong>🎨 Color Palette:</strong> Deep Midnight Navy (`#0A192F`), Electric Neon Cyan (`#00F2FE`), Crisp White.
                        </p>
                        <p>
                          <strong>✨ Canva Pro Elements:</strong> Search for <em>"Abstract geometric spearhead"</em> (Vel), <em>"Minimalist cyber polygon"</em>, or <em>"Tech infinity monogram"</em>.
                        </p>
                        <p>
                          <strong>✍️ Fonts to Pair:</strong> 
                          <span className="text-zinc-200 block mt-0.5">- Main: <strong>Space Grotesk</strong> or <strong>Outfit Bold</strong> (Trending Tech Sans)</span>
                          <span className="text-zinc-200 block">- Subtitle: <strong>JetBrains Mono</strong> or <strong>Fira Code</strong> (Developer feel)</span>
                        </p>
                        <div className="p-2 bg-black/40 rounded-lg text-[10px] text-zinc-500 leading-normal">
                          <strong>Layout Tip:</strong> Use a stylized abstract "Vel" spearhead pointing upwards with a sleek gradient, with "VELTECH" in bold uppercase next to it.
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 3. Realism and Professional Advice */}
                <div className="p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10 text-xs text-amber-200 leading-relaxed">
                  <p>
                    🌟 <strong>Pro-Tip:</strong> <strong>Glark Solutions</strong> provides a premier corporate branding identity, conveying trust, scalable architecture, and modern full-stack enterprise standards.
                  </p>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="border-t border-zinc-800/80 pt-4 mt-4 flex items-center justify-between">
                <p className="text-[10px] text-zinc-500">
                  Branding changes take effect instantly!
                </p>
                <button
                  onClick={() => setIsDevWidgetOpen(false)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-widest transition-all rounded-xl cursor-pointer"
                >
                  Apply & Close
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
