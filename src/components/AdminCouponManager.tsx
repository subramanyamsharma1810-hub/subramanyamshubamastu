import React, { useState, useEffect } from "react";
import { 
  Tag, 
  ShieldCheck, 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Eye, 
  Search, 
  Filter, 
  Sparkles, 
  Calendar, 
  Percent, 
  DollarSign, 
  RefreshCw,
  Award,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Coupon, DefenseVerification, ReferralRankItem, DiscountType, DefenseVerificationStatus } from "../types";

export default function AdminCouponManager() {
  const [activeTab, setActiveTab] = useState<"coupons" | "verifications" | "leaderboard">("coupons");

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // New/Edit Coupon Form State
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<DiscountType>("PERCENTAGE");
  const [formVal, setFormVal] = useState<number>(50);
  const [formRequiresId, setFormRequiresId] = useState(false);
  const [formValidFrom, setFormValidFrom] = useState(new Date().toISOString().split("T")[0]);
  const [formValidUntil, setFormValidUntil] = useState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [formMinOrder, setFormMinOrder] = useState<number>(1500);
  const [formMaxUses, setFormMaxUses] = useState<number>(1000);
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  // Defense Verifications State
  const [verifications, setVerifications] = useState<DefenseVerification[]>([]);
  const [verifFilter, setVerifFilter] = useState<string>("ALL");
  const [verifLoading, setVerifLoading] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<DefenseVerification | null>(null);
  const [adminReviewNotes, setAdminReviewNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Referral Leaderboard State
  const [rankings, setRankings] = useState<ReferralRankItem[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  // Fetch Coupons
  const fetchCoupons = async () => {
    setCouponsLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
    } finally {
      setCouponsLoading(false);
    }
  };

  // Fetch Defense Verifications
  const fetchVerifications = async () => {
    setVerifLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications?status=${verifFilter}`);
      const data = await res.json();
      if (data.success) {
        setVerifications(data.verifications || []);
      }
    } catch (err) {
      console.error("Error fetching defense verifications:", err);
    } finally {
      setVerifLoading(false);
    }
  };

  // Fetch Referral Rankings
  const fetchRankings = async () => {
    setRankingsLoading(true);
    try {
      const res = await fetch("/api/admin/referrals/rankings");
      const data = await res.json();
      if (data.success) {
        setRankings(data.rankings || []);
      }
    } catch (err) {
      console.error("Error fetching referral rankings:", err);
    } finally {
      setRankingsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchVerifications();
    fetchRankings();
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [verifFilter]);

  // Toggle Coupon Active Status
  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !coupon.is_active })
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
        );
      }
    } catch (err) {
      alert("Failed to toggle coupon status");
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      alert("Failed to delete coupon");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormType(coupon.discount_type);
    setFormVal(coupon.discount_val);
    setFormRequiresId(coupon.requires_id_upload);
    setFormValidFrom(coupon.valid_from ? coupon.valid_from.split("T")[0] : "");
    setFormValidUntil(coupon.valid_until ? coupon.valid_until.split("T")[0] : "");
    setFormMinOrder(coupon.min_order_value || 0);
    setFormMaxUses(coupon.max_uses || 1000);
    setFormDescription(coupon.description || "");
    setFormIsActive(coupon.is_active);
    setFormError("");
    setIsAddModalOpen(true);
  };

  // Reset form
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormType("PERCENTAGE");
    setFormVal(10);
    setFormRequiresId(false);
    setFormValidFrom(new Date().toISOString().split("T")[0]);
    setFormValidUntil(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setFormMinOrder(1500);
    setFormMaxUses(1000);
    setFormDescription("");
    setFormIsActive(true);
    setFormError("");
    setIsAddModalOpen(true);
  };

  // Save Coupon (Create or Update)
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      setFormError("Coupon code is required");
      return;
    }
    if (formVal <= 0) {
      setFormError("Discount value must be greater than 0");
      return;
    }

    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        discount_type: formType,
        discount_val: Number(formVal),
        requires_id_upload: formRequiresId,
        valid_from: new Date(formValidFrom).toISOString(),
        valid_until: new Date(formValidUntil + "T23:59:59.999Z").toISOString(),
        min_order_value: Number(formMinOrder),
        max_uses: Number(formMaxUses),
        description: formDescription.trim(),
        is_active: formIsActive
      };

      if (editingCoupon) {
        const res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          setIsAddModalOpen(false);
          await fetchCoupons();
        } else {
          setFormError(data.message || "Failed to update coupon");
        }
      } else {
        const res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          setIsAddModalOpen(false);
          await fetchCoupons();
        } else {
          setFormError(data.message || "Failed to create coupon");
        }
      }
    } catch (err: any) {
      setFormError("Network error saving coupon");
    }
  };

  // Review Defense Verification (Approve/Reject)
  const handleReviewVerification = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedVerification) return;
    setIsReviewing(true);
    try {
      const res = await fetch(`/api/admin/verifications/${selectedVerification.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: adminReviewNotes.trim(),
          reviewerName: "Sri P.V. Subba Reddy (Senior Compliance Officer)"
        })
      });

      const data = await res.json();
      if (data.success) {
        setSelectedVerification(null);
        setAdminReviewNotes("");
        await fetchVerifications();
        alert(`Candidate Defense ID status successfully updated to ${status}.`);
      } else {
        alert(data.message || "Failed to review verification.");
      }
    } catch (err) {
      alert("Network error processing review.");
    } finally {
      setIsReviewing(false);
    }
  };

  const pendingVerificationsCount = verifications.filter((v) => v.verification_status === "PENDING").length;

  return (
    <div id="admin-coupon-manager-container" className="space-y-6 text-left">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#362B5A] via-[#453673] to-[#C2242C] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-400/30 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Operational Console</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Coupons, Defense Verification & Referrals
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/80 font-medium">
            Manage matrimonial discounts, Armed Forces ID proofs, and real-time viral referral rankings.
          </p>
        </div>

        <div className="flex gap-2 self-start sm:self-center">
          <button
            onClick={() => {
              fetchCoupons();
              fetchVerifications();
              fetchRankings();
            }}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer shadow-md"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-200 bg-white rounded-2xl p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab("coupons")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "coupons"
              ? "bg-[#362B5A] text-white shadow-md"
              : "text-zinc-600 hover:text-[#362B5A] hover:bg-zinc-100"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Active Coupons ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("verifications")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "verifications"
              ? "bg-[#362B5A] text-white shadow-md"
              : "text-zinc-600 hover:text-[#362B5A] hover:bg-zinc-100"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Defense ID Verifications</span>
          {pendingVerificationsCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-400 text-black text-[10px] font-black rounded-full shadow-xs animate-pulse">
              {pendingVerificationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "leaderboard"
              ? "bg-[#362B5A] text-white shadow-md"
              : "text-zinc-600 hover:text-[#362B5A] hover:bg-zinc-100"
          }`}
        >
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span>Referral Rankings (Rule of 6)</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE COUPONS MANAGER */}
      {activeTab === "coupons" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-[#362B5A]">Coupon Codes & Discount Engine</h3>
              <p className="text-xs text-zinc-500">
                Define flat or percentage discounts with expiration windows, usage limits, and defense ID gating.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-[#362B5A] hover:bg-[#483a75] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Coupon</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Verification Gate</th>
                  <th className="py-3 px-4">Validity Range</th>
                  <th className="py-3 px-4">Usage Count</th>
                  <th className="py-3 px-4">Active Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-zinc-50/60">
                    <td className="py-4 px-4 font-mono font-black text-sm text-[#362B5A]">
                      <div className="flex items-center gap-1.5">
                        <span>{coupon.code}</span>
                        {coupon.code === "AGNIVEERFLAT50" && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                            Official Defense
                          </span>
                        )}
                      </div>
                      {coupon.description && (
                        <span className="text-[11px] font-sans font-normal text-zinc-500 block truncate max-w-xs mt-0.5">
                          {coupon.description}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-bold">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 font-mono">
                        {coupon.discount_type === "PERCENTAGE" ? `${coupon.discount_val}% OFF` : `₹${coupon.discount_val} FLAT`}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {coupon.requires_id_upload ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                          <ShieldCheck className="w-3 h-3 text-amber-700" />
                          <span>Armed Forces ID Required</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-semibold">Instant Checkout</span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono text-[11px] text-zinc-600">
                      <div>From: {coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString() : "N/A"}</div>
                      <div>Until: {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : "N/A"}</div>
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <span className="font-bold text-zinc-800">{coupon.current_uses}</span>
                      <span className="text-zinc-400"> / {coupon.max_uses}</span>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          coupon.is_active ? "bg-emerald-600" : "bg-zinc-300"
                        }`}
                        title={coupon.is_active ? "Click to Deactivate" : "Click to Activate"}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            coupon.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(coupon)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all cursor-pointer"
                        title="Edit Coupon"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DEFENSE ID VERIFICATIONS */}
      {activeTab === "verifications" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-[#362B5A]">Armed Forces & Agniveer Verification Desk</h3>
              <p className="text-xs text-zinc-500">
                Inspect official Defense ID proofs submitted for the 50% AGNIVEERFLAT50 concession.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">Filter:</span>
              <select
                value={verifFilter}
                onChange={(e) => setVerifFilter(e.target.value)}
                className="px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none"
              >
                <option value="ALL">All Submissions</option>
                <option value="PENDING">Pending Review Only</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Candidate Details</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Coupon</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {verifications.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/60">
                    <td className="py-4 px-4">
                      <span className="font-bold text-sm text-[#362B5A] block">{item.user_name || "Candidate"}</span>
                      <span className="text-[11px] font-mono text-zinc-400">ID: {item.user_id}</span>
                    </td>

                    <td className="py-4 px-4 font-mono text-zinc-600">
                      <div>{item.user_phone || "N/A"}</div>
                      <div className="text-[10px] text-zinc-400">{item.user_email || ""}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        {item.coupon_code || "AGNIVEERFLAT50"}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-zinc-500 text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-4">
                      {item.verification_status === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Approved</span>
                        </span>
                      ) : item.verification_status === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300">
                          <X className="w-3 h-3 text-rose-600" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedVerification(item);
                          setAdminReviewNotes(item.admin_notes || "");
                        }}
                        className="px-3 py-1.5 bg-[#362B5A] hover:bg-[#483a75] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REFERRAL RANKINGS LEADERBOARD */}
      {activeTab === "leaderboard" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-[#362B5A]">Real-Time User Referral Rankings</h3>
              <p className="text-xs text-zinc-500">
                Monitors qualified paid subscriptions earned by members. 6 qualified referrals unlock the ₹800 milestone rate.
              </p>
            </div>
            <button
              onClick={fetchRankings}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Leaderboard</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Referral Code</th>
                  <th className="py-3 px-4">Total Invites</th>
                  <th className="py-3 px-4">Qualified Paid Subs</th>
                  <th className="py-3 px-4">Milestone Eligibility (₹800 Tier)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rankings.map((rankItem, idx) => (
                  <tr key={rankItem.user_id} className="hover:bg-zinc-50/60">
                    <td className="py-4 px-4 font-black">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs shadow-xs">
                        {idx === 0 ? (
                          <span className="bg-yellow-100 text-yellow-800 border border-yellow-300 w-full h-full rounded-full flex items-center justify-center">🥇 1</span>
                        ) : idx === 1 ? (
                          <span className="bg-zinc-200 text-zinc-800 border border-zinc-300 w-full h-full rounded-full flex items-center justify-center">🥈 2</span>
                        ) : idx === 2 ? (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 w-full h-full rounded-full flex items-center justify-center">🥉 3</span>
                        ) : (
                          <span className="text-zinc-600 font-bold">#{idx + 1}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-sm text-[#362B5A] block">{rankItem.name}</span>
                      <span className="text-[11px] font-mono text-zinc-500">{rankItem.phone}</span>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-[#362B5A]">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                        {rankItem.referral_code}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-zinc-700 font-semibold">
                      {rankItem.total_invites}
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        {rankItem.qualified_paid} / 6
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {rankItem.is_eligible_800_tier ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs">
                          <Award className="w-3.5 h-3.5 text-emerald-700" />
                          <span>UNLOCKED: ₹800 TIER ACTIVE</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500 font-semibold">
                          {6 - rankItem.qualified_paid} more paid referrals required
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEFENSE ID INSPECTION & REVIEW DRAWER/MODAL */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-6 text-left relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedVerification(null)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-700 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pb-3 border-b border-zinc-100">
              <span className="text-xs font-black uppercase tracking-widest text-[#C2242C] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Defense Personnel Document Review</span>
              </span>
              <h3 className="text-xl font-black text-[#362B5A]">
                Review Military ID Proof for 50% Concession
              </h3>
            </div>

            {/* Candidate Metadata Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-xs">
              <div>
                <span className="text-zinc-500 block font-semibold">Candidate:</span>
                <span className="font-bold text-zinc-800">{selectedVerification.user_name || "Candidate"}</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-semibold">Phone:</span>
                <span className="font-mono font-bold text-zinc-800">{selectedVerification.user_phone || "N/A"}</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-semibold">Applied Code:</span>
                <span className="font-mono font-bold text-amber-800">{selectedVerification.coupon_code || "AGNIVEERFLAT50"}</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-semibold">Status:</span>
                <span className="font-bold text-[#362B5A]">{selectedVerification.verification_status}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-zinc-500 block font-semibold">Uploaded At:</span>
                <span className="font-mono text-zinc-700">{new Date(selectedVerification.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Document Image Preview Box */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block">
                Official Armed Forces ID Document Preview:
              </label>
              <div className="border-2 border-zinc-200 rounded-2xl overflow-hidden bg-zinc-900 flex items-center justify-center p-2 max-h-80">
                <img
                  src={selectedVerification.id_card_image_url}
                  alt="Military ID Card"
                  className="max-h-72 w-auto object-contain rounded-lg shadow-md"
                />
              </div>
            </div>

            {/* Admin Notes Input */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block">
                Compliance Verification Notes:
              </label>
              <textarea
                rows={2}
                value={adminReviewNotes}
                onChange={(e) => setAdminReviewNotes(e.target.value)}
                placeholder="e.g., Armed forces regimental seal verified. 50% discount approved."
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 focus:outline-none focus:border-[#362B5A]"
              />
            </div>

            {/* Approve / Reject Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedVerification(null)}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isReviewing}
                onClick={() => handleReviewVerification("REJECTED")}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Reject ID Document</span>
              </button>
              <button
                disabled={isReviewing}
                onClick={() => handleReviewVerification("APPROVED")}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Approve 50% Concession</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT COUPON MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-5 text-left relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-700 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pb-2 border-b border-zinc-100">
              <h3 className="text-xl font-black text-[#362B5A]">
                {editingCoupon ? `Edit Coupon "${editingCoupon.code}"` : "Create New Coupon Code"}
              </h3>
              <p className="text-xs text-zinc-500">
                Configure discount rules, verification gates, and expiration limits.
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              {/* Code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">Coupon Code</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AGNIVEERFLAT50"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl font-mono font-bold uppercase text-xs text-[#362B5A] focus:outline-none focus:border-[#362B5A]"
                />
              </div>

              {/* Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">Discount Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as DiscountType)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#362B5A]"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FLAT">FLAT (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">
                    {formType === "PERCENTAGE" ? "Discount (%)" : "Discount Amount (₹)"}
                  </label>
                  <input
                    type="number"
                    value={formVal}
                    onChange={(e) => setFormVal(Number(e.target.value))}
                    min={1}
                    max={formType === "PERCENTAGE" ? 100 : 1500}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl font-mono font-bold text-xs text-[#362B5A] focus:outline-none focus:border-[#362B5A]"
                  />
                </div>
              </div>

              {/* Requires ID Upload Gate */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
                <input
                  id="requires-id-checkbox"
                  type="checkbox"
                  checked={formRequiresId}
                  onChange={(e) => setFormRequiresId(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#362B5A] cursor-pointer"
                />
                <label htmlFor="requires-id-checkbox" className="text-xs cursor-pointer">
                  <span className="font-bold text-[#362B5A] block">Requires Defense / Agniveer ID Card Proof</span>
                  <span className="text-[11px] text-amber-900/80">
                    User cannot checkout immediately. They must upload official Armed Forces ID for admin verification.
                  </span>
                </label>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">Valid From</label>
                  <input
                    type="date"
                    value={formValidFrom}
                    onChange={(e) => setFormValidFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">Valid Until</label>
                  <input
                    type="date"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Max Uses & Min Order */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">Usage Limit (Max Uses)</label>
                  <input
                    type="number"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">Description / Policy Note</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g., 50% concession for Indian Armed Forces and Agniveer defense personnel."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 focus:outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="coupon-active-checkbox"
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#362B5A] cursor-pointer"
                />
                <label htmlFor="coupon-active-checkbox" className="text-xs font-bold text-zinc-700 cursor-pointer">
                  Activate this coupon immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#362B5A] hover:bg-[#483a75] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer"
                >
                  {editingCoupon ? "Save Changes" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
