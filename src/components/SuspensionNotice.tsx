import React, { useState, useEffect } from "react";
import { Profile } from "../types";
import { databaseService } from "../lib/databaseService";
import { ShieldAlert, Clock, Phone, Send, CheckCircle, RefreshCw, HelpCircle } from "lucide-react";

interface SuspensionNoticeProps {
  currentProfile: Profile;
  onRefresh: () => void;
}

export const SuspensionNotice: React.FC<SuspensionNoticeProps> = ({ currentProfile, onRefresh }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [appealText, setAppealText] = useState("");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!currentProfile.suspension_lift_at) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(currentProfile.suspension_lift_at!) - +new Date();
      if (difference <= 0) {
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (!remaining) {
        clearInterval(interval);
        onRefresh(); // Trigger automatic reload when countdown finishes!
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentProfile.suspension_lift_at, onRefresh]);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    // Mimic check and trigger refresh
    setTimeout(() => {
      onRefresh();
      setIsChecking(false);
    }, 1000);
  };

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealText.trim()) return;

    setIsSubmittingAppeal(true);
    try {
      const updatedProfile: Profile = {
        ...currentProfile,
        suspension_reason: `APPEAL SUBMITTED: "${appealText.trim()}" (on ${new Date().toLocaleDateString()})`
      };
      await databaseService.saveProfile(updatedProfile);
      setAppealSuccess(true);
      setAppealText("");
      setTimeout(() => {
        onRefresh();
      }, 2000);
    } catch (err) {
      console.error("Failed to save appeal:", err);
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const hasLiftTime = !!currentProfile.suspension_lift_at;

  return (
    <div className="bg-white border-2 border-red-200 rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto space-y-6 text-left relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Decorative Warning Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute inset-0 bg-repeat bg-[radial-gradient(#C2242C_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div className="p-3.5 bg-red-50 text-red-600 rounded-2xl shrink-0 shadow-inner border border-red-100">
          <ShieldAlert className="w-8 h-8 animate-bounce text-[#C2242C]" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 font-mono">
              ⚠️ IT Act 2021 Compliance Hold
            </span>
          </div>
          <h2 className="text-xl font-black text-[#362B5A] uppercase tracking-tight">
            Account Under Suspension • మీ ఖాతా నిలిపివేయబడింది
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            To maintain the sacred sanctity of our verified Brahmin community, this account is temporarily held.
          </p>
        </div>
      </div>

      {/* Dynamic Countdown Section if Scheduled to lift */}
      {hasLiftTime && timeLeft ? (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/60 p-5 rounded-2xl text-center space-y-3.5 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span>Automatic Access Reinstatement Timer</span>
          </div>

          <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto font-mono">
            {[
              { label: "DAYS", val: timeLeft.days },
              { label: "HOURS", val: timeLeft.hours },
              { label: "MINS", val: timeLeft.minutes },
              { label: "SECS", val: timeLeft.seconds }
            ].map((unit, idx) => (
              <div key={idx} className="bg-white border border-amber-200 rounded-xl p-2.5 shadow-xs flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-black text-[#C2242C] tracking-tight">
                  {unit.val.toString().padStart(2, "0")}
                </span>
                <span className="text-[8px] font-extrabold text-gray-400 mt-0.5 tracking-widest uppercase">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-amber-900/90 font-medium leading-relaxed max-w-md mx-auto">
            Your suspension will be automatically revoked on{" "}
            <strong className="text-amber-900 font-black">
              {new Date(currentProfile.suspension_lift_at!).toLocaleDateString()} at{" "}
              {new Date(currentProfile.suspension_lift_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </strong>
            . You can fully access the matrimonial cockpit and matches immediately after this timeline.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-2xl text-center space-y-2.5">
          <Clock className="w-8 h-8 text-zinc-400 mx-auto" />
          <h4 className="text-sm font-black text-[#362B5A] uppercase tracking-tight">
            Administrative Hold Active (నిర్వాహకుల సమీక్షలో ఉంది)
          </h4>
          <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed">
            Your profile does not currently have a scheduled automatic lifting time. It is under investigative review by the Chief Registrar due to a reported grievance, incorrect detail flag, or verification inquiry.
          </p>
        </div>
      )}

      {/* Safety Education Box */}
      <div className="bg-[#EBF6FF] border border-blue-200 p-4 rounded-2xl space-y-2">
        <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Why is my account restricted? • కారణాలు</span>
        </h4>
        <ul className="text-[11px] text-blue-950/90 space-y-1.5 leading-relaxed pl-1">
          <li className="flex items-start gap-1.5">
            <span className="text-blue-600 shrink-0 mt-0.5">•</span>
            <span><strong>Strict Integrity:</strong> Brahmin Matrimony requires absolute, verified details. Fake salary, incorrect gotram, or forged documents trigger instant automatic holds.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-blue-600 shrink-0 mt-0.5">•</span>
            <span><strong>IT Rules 2021:</strong> Harassment, misbehavior, or sending spam/indecent messages to matched families results in investigative holds.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-blue-600 shrink-0 mt-0.5">•</span>
            <span><strong>Automatic Reinstating:</strong> Once your scheduled time expires, the platform's scheduler will instantly unlock your account to Verified status.</span>
          </li>
        </ul>
      </div>

      {/* Interactive Appeals & Support Actions */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-black text-[#362B5A] uppercase tracking-wider">
          Take Action or Appeal Suspension • అప్పీల్ చేసుకోండి
        </h4>

        {appealSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in zoom-in-95 duration-200">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
            <span>
              Your appeal has been securely submitted to Sri G.V. Subramanyam (Chief Registrar). They will review your statement and update your suspension schedule shortly!
            </span>
          </div>
        ) : (
          <form onSubmit={handleSendAppeal} className="space-y-2">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#362B5A] uppercase tracking-widest block">
                Submit Formal Clarification (లిఖితపూర్వక వివరణ)
              </label>
              <textarea
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                placeholder="Type your explanation, correct gotram details, or apology note here. The Chief Registrar will evaluate this instantly..."
                rows={3}
                required
                className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-red-500 focus:outline-none bg-gray-50/50"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingAppeal || !appealText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C2242C] hover:bg-opacity-95 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingAppeal ? "Sending..." : "Submit Appeal to Chief Registrar"}</span>
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Support Helpline */}
          <a
            href="https://wa.me/919347359489?text=Namaste%20Sri%20Subramanyam%20garu%2C%20my%20account%20under%20Bramhana%20Vivaha%20Veadika%20is%20suspended.%20Please%20help%20me%20resolve."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/50 text-emerald-950 rounded-2xl transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-emerald-500 text-white rounded-lg group-hover:scale-110 transition-transform">
                <Phone className="w-4 h-4" />
              </span>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block">Grievance Helpline</span>
                <span className="text-xs font-extrabold">+91 93473 59489</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-emerald-600 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Refresh Checks */}
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="flex items-center justify-between p-3.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/50 text-indigo-950 rounded-2xl transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <span className={`p-1.5 bg-indigo-600 text-white rounded-lg ${isChecking ? "animate-spin" : "group-hover:scale-110 transition-transform"}`}>
                <RefreshCw className="w-4 h-4" />
              </span>
              <div className="space-y-0.5 text-left">
                <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-widest block">Check Platform Status</span>
                <span className="text-xs font-extrabold">{isChecking ? "Syncing..." : "Refresh Reinstatement"}</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-indigo-600 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
