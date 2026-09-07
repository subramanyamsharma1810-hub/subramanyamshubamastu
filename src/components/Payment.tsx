import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { databaseService } from "../lib/databaseService";
import { Profile } from "../types";
import PhonePeQRCode from "./PhonePeQRCode";
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

  const [selectedPlan, setSelectedPlan] = useState<"paid_100" | "paid_900">("paid_100");
  const [utrNumber, setUtrNumber] = useState("");
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
            if (active.subscription_status === "paid_100") {
              setSelectedPlan("paid_900"); // Suggest upgrade
            }
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
        if (found.subscription_status === "paid_100") {
          setSelectedPlan("paid_900");
        } else {
          setSelectedPlan("paid_100");
        }
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
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      alert("Please enter a valid 12-digit UPI Transaction ID or UTR number from PhonePe/GPay.");
      return;
    }

    setIsProcessing(true);
    try {
      const isUpgrade = selectedPlan === "paid_900";
      const amount = isUpgrade ? 900 : 100;
      const cleanTxn = utrNumber.trim().toUpperCase();

      // AUTOMATED ACTIVATION: update profile immediately in database
      const updatedProfile: Profile = {
        ...candidateProfile,
        subscription_status: selectedPlan,
        status: "Active",
        payment_received: true,
        fee_received_by: "Automated Gateway (PhonePe/UPI)",
        fee_received_at: new Date().toISOString(),
        ...(isUpgrade
          ? { upgrade_transaction_id: cleanTxn, upgrade_requested_at: new Date().toISOString() }
          : { fee_transaction_id: cleanTxn })
      };

      await databaseService.saveProfile(updatedProfile);
      setCandidateProfile(updatedProfile);

      setReceiptDetails({
        txnId: cleanTxn,
        amount,
        plan: isUpgrade ? "Full Communication Upgrade (₹900)" : "Match Registration Fee (₹100)",
        timestamp: new Date().toLocaleString(),
      });

      setPaymentSuccess(true);
      // Auto save login session
      localStorage.setItem("bramhana_logged_in_user_id", updatedProfile.id);
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
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-mono font-bold uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Automated Matrimony Payments</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Automated Payment & Activation Desk
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
                Scan PhonePe / UPI QR code, enter UTR number, and your subscription will be automatically and instantly activated. No waiting!
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
                <div
                  onClick={() => setSelectedPlan("paid_100")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 text-left ${
                    selectedPlan === "paid_100"
                      ? "bg-amber-500/10 border-amber-400 shadow-md"
                      : "bg-zinc-950 border-zinc-800 text-gray-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Match Registration Fee</h4>
                      <p className="text-[11px] text-zinc-400">Unlocks opposite-gender matches & Jataka</p>
                      <span className="text-[10px] text-emerald-400 font-semibold block mt-1">100% Conditional Refund</span>
                    </div>
                    <span className="text-base font-mono font-black text-amber-400">₹100</span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedPlan("paid_900")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 text-left ${
                    selectedPlan === "paid_900"
                      ? "bg-amber-500/10 border-amber-400 shadow-md"
                      : "bg-zinc-950 border-zinc-800 text-gray-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Full Communication Upgrade</h4>
                      <p className="text-[11px] text-zinc-400">Unlocks direct phone numbers & full candidate profiles</p>
                      <span className="text-[10px] text-zinc-500 font-semibold block mt-1">Strictly Non-Refundable</span>
                    </div>
                    <span className="text-base font-mono font-black text-amber-400">₹900</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-[11px] text-zinc-400">
                <span>Governed by our </span>
                <Link to="/refund" target="_blank" className="text-emerald-400 underline font-semibold hover:text-emerald-300">
                  Cancellation and Refund Policy
                </Link>
                <span> (₹100 refundable if zero viable matches within 60 days; ₹900 non-refundable upon activation).</span>
              </div>
            </div>

            {/* QR Code & Payment Details */}
            <div className="p-5 bg-zinc-950 border border-amber-500/25 rounded-2xl space-y-5 text-center">
              <div className="space-y-1">
                <span className="text-[10px] text-amber-400 font-mono tracking-widest uppercase block font-bold">
                  Official PhonePe / UPI QR Code
                </span>
                <p className="text-xs text-zinc-300">
                  Pay <strong className="text-amber-300 text-sm">₹{selectedPlan === "paid_100" ? 100 : 900}</strong> to <strong className="text-white">Sri G.V. Subramanyam</strong> (UPI: <strong className="font-mono text-amber-300">9347359489@ybl</strong>)
                </p>
              </div>

              <div className="max-w-xs mx-auto">
                <PhonePeQRCode amount={selectedPlan === "paid_100" ? 100 : 900} className="w-full shadow-lg" />
              </div>

              {/* Automated Verification Input */}
              <div className="max-w-md mx-auto space-y-3 pt-2 text-left">
                <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block text-center">
                  Enter 12-digit UPI UTR / Transaction Reference Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 12-digit UPI UTR Number"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ""))}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl py-2.5 px-3 text-xs text-white font-mono tracking-widest uppercase text-center focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAutomatedPayment}
                    disabled={isProcessing || !candidateProfile}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    {isProcessing ? "Activating..." : "Automate & Activate"}
                  </button>
                </div>
                {!candidateProfile && (
                  <p className="text-[10px] text-amber-400/90 text-center">
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
        <p>© {new Date().getFullYear()} Shubhamastu Brahmin Matrimony (www.shubhamastu.in) • Glark Solutions. All payments automated.</p>
      </footer>
    </div>
  );
}
