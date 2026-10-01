import React, { useState, useEffect } from "react";
import { Phone, ShieldCheck, Clock, CheckCircle2, XCircle, MessageSquare, ExternalLink } from "lucide-react";
import { Profile } from "../../types";

interface PhoneRevealWidgetProps {
  targetUser: Profile;
  currentUserId?: string;
  currentUserProfile?: Profile;
}

export default function PhoneRevealWidget({
  targetUser,
  currentUserId,
  currentUserProfile
}: PhoneRevealWidgetProps) {
  const [status, setStatus] = useState<"NONE" | "PENDING" | "APPROVED" | "REJECTED">("NONE");
  const [loading, setLoading] = useState<boolean>(false);
  const [unmaskedPhone, setUnmaskedPhone] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const isOwnProfile = currentUserId === targetUser.id;

  useEffect(() => {
    async function checkStatus() {
      if (!currentUserId) return;
      if (isOwnProfile) {
        setStatus("APPROVED");
        setUnmaskedPhone(targetUser.contact_number);
        return;
      }
      try {
        const res = await fetch(`/api/profile/${targetUser.id}?requesterId=${currentUserId}`);
        const data = await res.json();
        if (data.success) {
          if (data.contactStatus) {
            setStatus(data.contactStatus);
          }
          if (data.isApproved) {
            setUnmaskedPhone(targetUser.contact_number);
          }
        }
      } catch (err) {
        console.error("Failed to fetch contact reveal status:", err);
      }
    }
    checkStatus();
  }, [targetUser.id, currentUserId, isOwnProfile]);

  const handleRequestContact = async () => {
    if (!currentUserId) {
      alert("Please log in to request contact numbers.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/contact/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUserId,
          targetUserId: targetUser.id,
          requesterName: currentUserProfile?.name || "Member",
          targetEmail: targetUser.email,
          targetName: targetUser.name
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus("PENDING");
      } else {
        setErrorMessage(data.message || "Failed to submit request.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isOwnProfile) {
    return (
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 text-amber-900 font-semibold mb-1">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <span>Your Phone Number (Protected)</span>
        </div>
        <p className="text-sm text-amber-800 mb-2 font-medium">{targetUser.contact_number}</p>
        <p className="text-xs text-amber-700/80">
          🔒 By default, your number is masked and hidden from other profiles until you mutually approve their request in your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2 text-stone-800 font-semibold">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <span>Contact Number Privacy</span>
        </div>
        <span className="text-xs px-2.5 py-1 bg-stone-100 text-stone-700 rounded-full font-medium">
          Verified Profile
        </span>
      </div>

      {status === "APPROVED" ? (
        <div className="space-y-3 bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Mutual Approval Granted</span>
          </div>
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-emerald-100">
            <span className="font-mono font-bold text-stone-900 text-lg tracking-wider">
              {targetUser.contact_number || unmaskedPhone || "+91 98765 43210"}
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-semibold">
              Verified
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`tel:${targetUser.contact_number || unmaskedPhone}`}
              className="flex-1 min-w-[120px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-sm text-sm"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
            <a
              href={`https://wa.me/${(targetUser.contact_number || unmaskedPhone || "").replace(/\D/g, "")}?text=Namaste%20${encodeURIComponent(targetUser.name)},%20I%20found%20your%20profile%20on%20Shubhamastu.in%20and%20would%20like%20to%20connect.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[120px] bg-[#25D366] hover:bg-[#20ba5a] text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-sm text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>
          </div>
        </div>
      ) : status === "PENDING" ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-full text-amber-700">
            <Clock className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 text-sm">Request Pending</h4>
            <p className="text-xs text-amber-700">
              Waiting for {targetUser.name} to approve your contact reveal request. An email notification has been dispatched.
            </p>
          </div>
        </div>
      ) : status === "REJECTED" ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-full text-rose-700">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-rose-900 text-sm">Request Declined</h4>
              <p className="text-xs text-rose-700">Your previous contact request was declined by the member.</p>
            </div>
          </div>
          <button
            onClick={handleRequestContact}
            disabled={loading}
            className="text-xs bg-stone-900 hover:bg-stone-800 text-white px-3 py-2 rounded-lg font-medium transition"
          >
            {loading ? "Sending..." : "Request Again"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-stone-600 text-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>🔒 Phone number protected for privacy (Masked: <code className="font-mono text-stone-800">+91 ••••• •••89</code>)</span>
          </div>
          <button
            onClick={handleRequestContact}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md text-sm"
          >
            <Phone className="w-4 h-4" />
            {loading ? "Sending Request..." : "Request Contact Number"}
          </button>
          {errorMessage && (
            <p className="text-xs text-rose-600 text-center font-medium">{errorMessage}</p>
          )}
          <p className="text-[11px] text-stone-500 text-center">
            Clicking request notifies the member instantly via email. Once approved, both profiles unlock direct phone & WhatsApp access.
          </p>
        </div>
      )}
    </div>
  );
}
