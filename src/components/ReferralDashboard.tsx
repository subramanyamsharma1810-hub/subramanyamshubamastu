import React, { useState, useEffect } from "react";
import { 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Award, 
  TrendingUp, 
  MessageCircle, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Gift,
  HelpCircle,
  Zap,
  Info
} from "lucide-react";
import { Profile, Referral } from "../types";

interface ReferralDashboardProps {
  currentProfile: Profile;
  onNavigateToCheckout?: () => void;
}

export default function ReferralDashboard({ currentProfile, onNavigateToCheckout }: ReferralDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Referral Stats from Engine API
  const [stats, setStats] = useState<{
    referralCode: string;
    referralUrl: string;
    whatsappShareUrl: string;
    whatsappText: string;
    totalInvites: number;
    qualifiedReferrals: number;
    milestoneTarget: number;
    isUnlocked800Tier: boolean;
    milestoneRate: number;
    baseRate: number;
    savings: number;
    progressPercentage: number;
    referralsList: Referral[];
  } | null>(null);

  // Quick invite simulation for demo testing
  const [testFriendName, setTestFriendName] = useState("");
  const [testFriendPhone, setTestFriendPhone] = useState("");
  const [isSimulatingInvite, setIsSimulatingInvite] = useState(false);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/referrals/stats/${currentProfile.id}?userName=${encodeURIComponent(currentProfile.name)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data);
        }
      }
    } catch (err) {
      console.error("Error fetching referral stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, [currentProfile.id]);

  const handleCopyLink = () => {
    if (stats?.referralUrl) {
      navigator.clipboard.writeText(stats.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Simulate a friend registering with referral code
  const handleSimulateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testFriendName.trim() || !testFriendPhone.trim()) {
      alert("Please enter a friend's name and mobile number.");
      return;
    }

    setIsSimulatingInvite(true);
    try {
      const mockRefereeId = `prof_test_${Date.now()}`;
      const res = await fetch("/api/referrals/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrerCode: stats?.referralCode,
          refereeId: mockRefereeId,
          name: testFriendName.trim(),
          phone: testFriendPhone.trim(),
          email: `${testFriendName.trim().toLowerCase().replace(/\s+/g, "")}@example.com`
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestFriendName("");
        setTestFriendPhone("");
        await fetchReferralData();
        alert(`Invitation logged! ${testFriendName} registered using your code.`);
      } else {
        alert(data.message || "Failed to log referral.");
      }
    } catch (err) {
      alert("Network error creating referral.");
    } finally {
      setIsSimulatingInvite(false);
    }
  };

  // Simulate friend paying first-month subscription (Qualifying the referral)
  const handleSimulatePayment = async (referral: Referral) => {
    try {
      const res = await fetch("/api/webhooks/payment-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: `CF_SIM_${Date.now()}`,
          payment_id: `PAY_SIM_${Math.floor(100000 + Math.random() * 900000)}`,
          user_id: referral.referee_id,
          amount: 1500,
          referee_name: referral.referee_name,
          referee_phone: referral.referee_phone,
          referee_email: referral.referee_email
        })
      });

      const data = await res.json();
      if (data.success) {
        await fetchReferralData();
        alert(`Success! Payment recorded for ${referral.referee_name || "Friend"}. This referral is now QUALIFIED!`);
      }
    } catch (err) {
      alert("Failed to simulate payment.");
    }
  };

  const qualifiedCount = stats?.qualifiedReferrals || 0;
  const milestoneTarget = 6;
  const remaining = Math.max(0, milestoneTarget - qualifiedCount);
  const isUnlocked = qualifiedCount >= milestoneTarget;

  return (
    <div id="referral-dashboard-container" className="space-y-8 text-left">
      {/* Hero Banner with Rule of 6 Visual */}
      <div className="bg-gradient-to-br from-[#362B5A] via-[#463773] to-[#C2242C] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#C2242C]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5" />
            <span>Community Referral Reward Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            The "Rule of 6" Referral Milestone
          </h1>

          <p className="text-xs sm:text-base text-blue-100/90 leading-relaxed font-medium">
            Introduce 6 genuine Brahmin families to Shubhamastu. When 6 of your invited friends register & complete their first month subscription, your own monthly renewal price permanently drops from <strong>₹1,500</strong> to just <strong className="text-amber-300">₹800</strong> (Direct ₹700 savings every single month!).
          </p>

          {/* Quick Stat Pill Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
              <span className="text-[10px] text-blue-200 uppercase font-semibold block">Target</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">6 Paid Referrals</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
              <span className="text-[10px] text-blue-200 uppercase font-semibold block">Your Rate</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-300">₹800 / mo</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
              <span className="text-[10px] text-blue-200 uppercase font-semibold block">Monthly Savings</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white">₹700 Off</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
              <span className="text-[10px] text-blue-200 uppercase font-semibold block">Current Progress</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">{qualifiedCount} / 6</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Milestone Bar & Unlocked Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#362B5A]">Your Milestone Progress</h2>
              {isUnlocked ? (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Unlocked (₹800 Tier Active)</span>
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-900 text-xs font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-300">
                  {remaining} more needed
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-medium">
              Only referrals who complete their first-month subscription count as Qualified.
            </p>
          </div>

          {isUnlocked && onNavigateToCheckout && (
            <button
              onClick={onNavigateToCheckout}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 self-start sm:self-center cursor-pointer"
            >
              <span>Renew at ₹800 Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Visual Multi-step Progress Bar (0 to 6) */}
        <div className="space-y-3">
          <div className="w-full bg-zinc-100 h-4 rounded-full overflow-hidden p-0.5 border border-zinc-200">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                isUnlocked 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                  : "bg-gradient-to-r from-amber-500 via-[#C2242C] to-[#362B5A]"
              }`}
              style={{ width: `${Math.min(100, Math.round((qualifiedCount / 6) * 100))}%` }}
            />
          </div>

          {/* 6 Circular Stepper Nodes */}
          <div className="grid grid-cols-6 text-center pt-2">
            {[1, 2, 3, 4, 5, 6].map((step) => {
              const isCompleted = qualifiedCount >= step;
              const isCurrent = qualifiedCount === step - 1;
              return (
                <div key={step} className="flex flex-col items-center space-y-1">
                  <div 
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-sm ${
                      isCompleted
                        ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                        : isCurrent
                        ? "bg-amber-500 text-black ring-4 ring-amber-100 animate-pulse font-bold"
                        : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step}
                  </div>
                  <span className={`text-[10px] font-bold ${isCompleted ? "text-emerald-700" : "text-zinc-500"}`}>
                    {step === 6 ? "₹800 Unlock!" : `Ref #${step}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1-Click Viral Sharing Section (WhatsApp Pre-text & Direct Copy Link) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-md space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#C2242C] flex items-center gap-1.5">
              <Share2 className="w-4 h-4" />
              <span>1-Click Viral Referral Sharing</span>
            </span>
            <h3 className="text-xl font-black text-[#362B5A]">Invite via WhatsApp or Copy Link</h3>
            <p className="text-xs text-zinc-500">
              Share your direct registration link with community groups, relatives, and parents looking for genuine Brahmin matches.
            </p>
          </div>

          {/* Direct WhatsApp Share Button */}
          {stats?.whatsappShareUrl && (
            <a
              href={stats.whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer group hover:scale-[1.01]"
            >
              <MessageCircle className="w-6 h-6 fill-white" />
              <span>Share on WhatsApp (Pre-Filled Telugu & English Invite)</span>
            </a>
          )}

          {/* Pre-text Preview Box */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
              <span>Preview of Pre-formatted WhatsApp Message:</span>
              <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md">Telugu / English</span>
            </div>
            <p className="text-zinc-700 font-sans italic leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-100">
              "{stats?.whatsappText || "Namaste! I found verified, genuine matrimonial proposals on Shubhamastu.in without paying heavy broker fees..."}"
            </p>
          </div>

          {/* Copy Direct Registration Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block">
              Your Personal Referral Link:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={stats?.referralUrl || `https://shubhamastu.in/register?ref=${stats?.referralCode || "PENDING"}`}
                className="flex-1 px-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl text-xs font-mono font-bold text-[#362B5A] select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5 shrink-0 ${
                  copied 
                    ? "bg-emerald-600 text-white" 
                    : "bg-[#362B5A] hover:bg-[#483a75] text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Referral Code Box */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Your Referral Code</span>
              <span className="text-lg font-black font-mono text-[#362B5A] tracking-widest">{stats?.referralCode || "SHUBH-7X9A"}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-700 cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? "Copied" : "Copy Code"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Rule of 6 Rules & Quick Simulation Tool */}
        <div className="lg:col-span-5 space-y-6">
          {/* Rules Card */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 space-y-4">
            <h4 className="font-extrabold text-[#362B5A] text-sm uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-[#C2242C]" />
              <span>How Qualified Referrals Work</span>
            </h4>

            <ul className="space-y-3 text-xs text-zinc-600 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#362B5A] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span>
                  <strong>Friends Register:</strong> Share your invite link. Your referral code is auto-attached during their registration.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#362B5A] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span>
                  <strong>Qualified Referral Criteria:</strong> A referral qualifies only when the referred candidate completes payment for their first month's subscription.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <span>
                  <strong>Milestone Reward:</strong> Reaching 6 Qualified Referrals automatically drops your renewal price from ₹1,500 to ₹800 forever.
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Interactive Testing Simulator (For evaluating the flow) */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Simulate Referral Registration (Demo)</span>
              </h4>
              <span className="text-[9px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full">Test Tool</span>
            </div>

            <form onSubmit={handleSimulateInvite} className="space-y-3">
              <input
                type="text"
                value={testFriendName}
                onChange={(e) => setTestFriendName(e.target.value)}
                placeholder="Friend's Full Name (e.g. K. Sastry)"
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:border-amber-500"
              />
              <input
                type="tel"
                value={testFriendPhone}
                onChange={(e) => setTestFriendPhone(e.target.value)}
                placeholder="Friend's Mobile (e.g. 9876543210)"
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isSimulatingInvite}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[11px] tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
              >
                {isSimulatingInvite ? "Registering..." : "+ Register Test Friend with My Code"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Referrals List Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100">
          <div>
            <h3 className="text-lg font-black text-[#362B5A]">Your Invited Candidates</h3>
            <p className="text-xs text-zinc-500">
              Track status of friends who joined using your invite link.
            </p>
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full self-start sm:self-center">
            Total Invites: {stats?.referralsList?.length || 0}
          </span>
        </div>

        {stats?.referralsList && stats.referralsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Referral Status</th>
                  <th className="py-3 px-4">Date Joined</th>
                  <th className="py-3 px-4 text-right">Action / Simulation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {stats.referralsList.map((ref, idx) => (
                  <tr key={ref.id || idx} className="hover:bg-zinc-50/50">
                    <td className="py-3.5 px-4 font-bold text-[#362B5A]">
                      {ref.referee_name || `Candidate #${idx + 1}`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-600">
                      {ref.referee_phone || "N/A"}
                    </td>
                    <td className="py-3.5 px-4">
                      {ref.status === "QUALIFIED_PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Qualified (Paid)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Registered (Pending Payment)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">
                      {ref.created_at ? new Date(ref.created_at).toLocaleDateString() : "Recent"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {ref.status !== "QUALIFIED_PAID" && (
                        <button
                          onClick={() => handleSimulatePayment(ref)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          title="Simulate referee paying first month subscription to test qualification"
                        >
                          ⚡ Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs text-zinc-500 font-medium">
              You have not referred anyone yet. Share your invite link above to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
