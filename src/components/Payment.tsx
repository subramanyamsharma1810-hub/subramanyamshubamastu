import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { databaseService } from "../lib/databaseService";
import { Profile } from "../types";
import { getPaymentAmount, isPaymentTestMode } from "../lib/paymentTestMode";
import { 
  CreditCard, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Home, 
  UserPlus, 
  Heart,
  QrCode,
  Zap,
  AlertCircle
} from "lucide-react";

export default function Payment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState<Profile | null>(null);
  const [searchError, setSearchError] = useState("");

  const [selectedPlan, setSelectedPlan] = useState<"paid_10" | "paid_100" | "paid_900">("paid_10");
  const paymentTestMode = isPaymentTestMode();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState<{
    txnId: string;
    amount: number;
    plan: string;
    timestamp: string;
  } | null>(null);

  // Check if candidate is already logged in
  useEffect(() => {
    async function loadLoggedIn() {
      const loggedInId = localStorage.getItem("bramhana_logged_in_user_id");
      if (loggedInId) {
        try {
          const profiles = await databaseService.getProfiles(true);
          const active = profiles.find((p) => p.id === loggedInId);
          if (active) {
            setCandidateProfile(active);
            setSelectedPlan("paid_10");
          }
        } catch (e) {
          console.error("Error fetching logged in profile:", e);
        }
      }
    }
    loadLoggedIn();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setCandidateProfile(null);
    setPaymentSuccess(false);

    const query = searchQuery.trim().replace(/\D/g, "");
    const rawQuery = searchQuery.trim().toLowerCase();
    if (!query && !rawQuery) {
      setSearchError("Please enter your 10-digit mobile number or registration ID.");
      return;
    }

    setSearching(true);
    try {
      const profiles = await databaseService.getProfiles(true);
      const found = profiles.find((p) => {
        const cleanMobile = p.contact_number ? p.contact_number.replace(/\D/g, "") : "";
        const regId = (p.reg_number || "").toLowerCase();
        return (
          (query && cleanMobile && cleanMobile.includes(query)) ||
          (rawQuery && regId && regId.includes(rawQuery))
        );
      });

      if (found) {
        setCandidateProfile(found);
        setSelectedPlan("paid_10");
      } else {
        setSearchError("No candidate profile found with that mobile number or registration ID. Please check or register first.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Failed to look up candidate. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleAutomatedPayment = async () => {
    if (!candidateProfile) return;
    setIsProcessing(true);
    try {
      const isUpgrade = selectedPlan === "paid_900";
      const amount = getPaymentAmount(selectedPlan);
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          orderAmount: amount,
          customerId: candidateProfile.id,
          customerPhone: candidateProfile.contact_number,
          customerEmail: candidateProfile.email,
          customerName: candidateProfile.name,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.payment_link) {
        throw new Error(data.message || "Secure payment checkout could not be created.");
      }
      localStorage.setItem("bramhana_logged_in_user_id", candidateProfile.id);
      window.location.assign(data.payment_link);
    } catch (err) {
      console.error("Payment activation error:", err);
      alert("Failed to activate payment automatically. Please retry.");
    } finally {
      setIsProcessing(false);
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
              <div className="text-[10px] text-amber-400 font-mono">www.shubhamastu.in • Automated Payment Desk</div>
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
              to="/register"
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-extrabold rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Payment Section */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 w-full">
        {paymentSuccess && receiptDetails ? (
          /* Automated Receipt */
          <div className="bg-gradient-to-b from-zinc-900 to-black border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-widest flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4 fill-emerald-400" />
                AUTOMATED ACTIVATION COMPLETED • తక్షణ చెల్లింపు ధృవీకరణ
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Payment Automatically Confirmed!
              </h2>
              <p className="text-sm text-gray-300 max-w-md mx-auto">
                Your payment of <strong className="text-emerald-300">₹{receiptDetails.amount}</strong> was automatically registered. Your Brahmin Matrimony profile is now activated!
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 max-w-md mx-auto text-left space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-gray-400">Candidate Name:</span>
                <span className="font-bold text-white">{candidateProfile?.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-gray-400">Registration ID:</span>
                <span className="font-mono font-bold text-amber-300">{candidateProfile?.reg_number}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-gray-400">Transaction ID (UTR):</span>
                <span className="font-mono font-bold text-emerald-400">{receiptDetails.txnId}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-gray-400">Plan Activated:</span>
                <span className="font-bold text-white">{receiptDetails.plan}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-gray-400">Timestamp:</span>
                <span className="text-zinc-300">{receiptDetails.timestamp}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-400">Activation Mode:</span>
                <span className="text-emerald-400 font-bold">100% Automated System</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Link
                to="/"
                className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
              >
                <span>Go to Matches & Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-b from-zinc-900/90 to-black/90 border border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              {paymentTestMode && (
                <div className="mx-auto max-w-lg rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-xs font-bold text-emerald-300">
                  Gateway test mode: ₹10 for 31 days testing access.
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-mono font-bold uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Automated Matrimony Payments</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Automated Payment & Activation Desk
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
                Choose a plan, then complete payment securely through PhonePe. Subscription activation occurs only after payment confirmation.
              </p>
            </div>

            {/* Candidate Lookup Box */}
            <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  Find Candidate Profile
                </span>
                {candidateProfile && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Profile Linked
                  </span>
                )}
              </div>

              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Registered Mobile Number or Reg ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {searching ? "Searching..." : "Lookup"}
                </button>
              </form>

              {searchError && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              {candidateProfile && (
                <div className="p-4 bg-zinc-900 border border-amber-500/30 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-extrabold text-amber-200">{candidateProfile.name}</span>
                    <span className="font-mono text-[11px] text-zinc-400">{candidateProfile.reg_number}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-300">
                    <span className="bg-zinc-800 px-2 py-0.5 rounded">Gotram: <strong>{candidateProfile.gothram}</strong></span>
                    <span className="bg-zinc-800 px-2 py-0.5 rounded">Sub-caste: <strong>{candidateProfile.sub_caste}</strong></span>
                    <span className="bg-zinc-800 px-2 py-0.5 rounded">Phone: <strong>{candidateProfile.contact_number}</strong></span>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                      Current Tier: {candidateProfile.subscription_status || "free"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Plan selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block text-left">
                Select Automated Payment Option
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border bg-emerald-950/30 border-emerald-500/40 space-y-2 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">
                        Candidate Registration (ఉచిత నమోదు)
                      </h4>
                      <p className="text-[11px] text-zinc-300">
                        Profile creation, Gotram & Sub-caste listing, and basic search
                      </p>
                      <span className="text-[10px] text-emerald-400 font-semibold block mt-1">100% Free Forever</span>
                    </div>
                    <span className="text-base font-mono font-black text-emerald-400">FREE</span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedPlan("paid_10")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 text-left ${
                    selectedPlan === "paid_10"
                      ? "bg-amber-500/15 border-amber-400 shadow-md"
                      : "bg-zinc-950 border-zinc-800 text-gray-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">
                        Monthly Subscription (నెలవారీ సభ్యత్వం)
                      </h4>
                      <p className="text-[11px] text-zinc-300">Full verified matches, Gotram matching, direct contact & PhonePe activation</p>
                      <span className="text-[10px] text-amber-400 font-semibold block mt-1">31 Days Full Access via PhonePe (Testing Period)</span>
                    </div>
                    <span className="text-base font-mono font-black text-amber-400">₹{getPaymentAmount("paid_10")} (31 Days)</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-[11px] text-zinc-400">
                <span>Governed by our </span>
                <Link to="/refund" target="_blank" className="text-emerald-400 underline font-semibold hover:text-emerald-300">
                  Cancellation and Refund Policy
                </Link>
                <span>
                  {" "}(Registration is 100% Free; Testing Access is ₹10 for 31 days processed securely through PhonePe Payment Gateway).
                </span>
              </div>
            </div>

            {/* Direct PhonePe Gateway Checkout (No scanner, no manual UPI ID) */}
            <div className="p-6 bg-zinc-950 border border-amber-500/25 rounded-2xl space-y-6 text-center">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl mx-auto flex items-center justify-center border border-amber-500/30">
                <CreditCard className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-amber-400 font-mono tracking-widest uppercase block font-bold">
                  Official PhonePe Payment Gateway
                </span>
                <h3 className="text-xl font-black text-white">
                  Direct Online Checkout (₹{getPaymentAmount(selectedPlan)})
                </h3>
                <p className="text-xs text-zinc-300 max-w-md mx-auto">
                  Click the button below to be redirected directly to PhonePe. Subscription for 31 days testing access and your ⭐ Star Member badge will be activated immediately.
                </p>
              </div>

              {/* Secure Gateway Checkout Button */}
              <div className="max-w-md mx-auto space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleAutomatedPayment}
                  disabled={isProcessing || !candidateProfile}
                  className="w-full px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 active:scale-[0.99] text-black font-black text-sm uppercase tracking-wider rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Redirecting to PhonePe...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Pay ₹{getPaymentAmount(selectedPlan)} via PhonePe Gateway</span>
                    </>
                  )}
                </button>
                {!candidateProfile && (
                  <p className="text-[11px] text-amber-400/90 text-center font-semibold">
                    💡 Please search and link your mobile number above first so the system can activate your account!
                  </p>
                )}
              </div>
            </div>
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
          <Link to="/register" className="text-gray-400 hover:text-white">
            Register Candidate
          </Link>
        </div>
        <p>© {new Date().getFullYear()} Shubhamastu Brahmin Matrimony (www.shubhamastu.in) • All rights reserved by Galark Solutions (Ghadiyaram Venkata Subramanyam).</p>
      </footer>
    </div>
  );
}
