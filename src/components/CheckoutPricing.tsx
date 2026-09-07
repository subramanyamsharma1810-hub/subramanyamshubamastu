import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Tag, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  CreditCard, 
  Check, 
  X, 
  FileText, 
  Award, 
  Info,
  Clock,
  ArrowRight,
  Receipt
} from "lucide-react";
import { Profile, CouponApplyResponse } from "../types";

interface CheckoutPricingProps {
  currentProfile: Profile;
  onPaymentSuccess?: (paymentDetails: any) => void;
  onNavigateToReferrals?: () => void;
}

export default function CheckoutPricing({ 
  currentProfile, 
  onPaymentSuccess, 
  onNavigateToReferrals 
}: CheckoutPricingProps) {
  const [couponInput, setCouponInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponApplyResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Military / Agniveer ID file upload state
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Referral Milestone Check
  const [referralStats, setReferralStats] = useState<{
    qualifiedReferrals: number;
    isUnlocked800Tier: boolean;
    referralCode: string;
  } | null>(null);

  // Payment State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<any | null>(null);

  // Load referral status & evaluate milestone on load
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`/api/referrals/stats/${currentProfile.id}?userName=${encodeURIComponent(currentProfile.name)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setReferralStats({
              qualifiedReferrals: data.qualifiedReferrals,
              isUnlocked800Tier: data.isUnlocked800Tier,
              referralCode: data.referralCode
            });

            // If milestone is already unlocked, auto-apply the milestone rate
            if (data.isUnlocked800Tier) {
              const applyRes = await fetch("/api/coupons/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  code: "",
                  userId: currentProfile.id,
                  orderAmount: 1500
                })
              });
              const applyData = await applyRes.json();
              setCouponResult(applyData);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load referral stats for checkout:", err);
      }
    }
    loadStats();
  }, [currentProfile.id, currentProfile.name]);

  // Apply Coupon Handler
  const handleApplyCoupon = async (codeOverride?: string) => {
    const codeToApply = (codeOverride || couponInput).trim().toUpperCase();
    if (!codeToApply) {
      setErrorMessage("Please enter a coupon code");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToApply,
          userId: currentProfile.id,
          orderAmount: 1500
        })
      });

      const data: CouponApplyResponse = await res.json();

      if (!data.valid) {
        setErrorMessage(data.message || "Invalid coupon code");
        setCouponResult(null);
      } else {
        setCouponResult(data);
        setCouponInput(data.code || codeToApply);
        // If it requires defense ID and not yet submitted, reset upload states
        if (data.requires_id_upload && data.defense_status === "NOT_SUBMITTED") {
          setUploadSuccess(false);
        }
      }
    } catch (err: any) {
      setErrorMessage("Network error validating coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setCouponResult(null);
    setCouponInput("");
    setErrorMessage("");
    setIdFile(null);
    setIdPreview(null);
    setUploadSuccess(false);

    // If referral milestone was unlocked, restore milestone rate
    if (referralStats?.isUnlocked800Tier) {
      setCouponResult({
        valid: true,
        discount_amount: 700,
        original_price: 1500,
        final_price: 800,
        requires_id_upload: false,
        is_defense_coupon: false,
        is_milestone_applied: true,
        message: "Milestone Unlocked: ₹800 Referral Rate Applied!"
      });
    }
  };

  // Handle Drag & Drop for Military ID
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      alert("Please upload an image (JPG, PNG, WEBP) or PDF of your Military ID card.");
      return;
    }
    setIdFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setIdPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload Military ID to Server
  const handleUploadIdProof = async () => {
    if (!idPreview) {
      alert("Please select your Military / Agniveer ID card file first.");
      return;
    }

    setUploadingId(true);
    try {
      const res = await fetch("/api/coupons/upload-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentProfile.id,
          userName: currentProfile.name,
          userPhone: currentProfile.contact_number,
          userEmail: currentProfile.email,
          couponCode: couponResult?.code || "AGNIVEERFLAT50",
          id_card_image_url: idPreview
        })
      });

      const data = await res.json();
      if (data.success) {
        setUploadSuccess(true);
        setVerificationId(data.verificationId);
        if (couponResult) {
          setCouponResult({
            ...couponResult,
            defense_status: "PENDING",
            message: "Military ID submitted! 50% discount provisionally applied. Admin verification pending."
          });
        }
      } else {
        alert(data.message || "Failed to upload ID proof.");
      }
    } catch (err) {
      alert("Network error uploading Military ID.");
    } finally {
      setUploadingId(false);
    }
  };

  // Final Price Calculation
  const BASE_PRICE = 1500;
  const finalPayable = couponResult ? couponResult.final_price : BASE_PRICE;
  const totalSavings = BASE_PRICE - finalPayable;

  // Simulate or Execute Gateway Payment
  const handlePayNow = async () => {
    // Check if defense ID upload is mandatory and still unsubmitted
    if (couponResult?.requires_id_upload && !uploadSuccess && couponResult.defense_status === "NOT_SUBMITTED") {
      alert("Military / Agniveer ID card upload is required before completing 50% defense discount checkout.");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const orderId = `ORD_SHUBH_${Date.now()}`;
      const paymentId = `PAY_CF_${Math.floor(100000 + Math.random() * 900000)}`;

      // Trigger payment success webhook on backend
      const res = await fetch("/api/webhooks/payment-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          payment_id: paymentId,
          user_id: currentProfile.id,
          amount: finalPayable,
          coupon_applied: couponResult?.code || (couponResult?.is_milestone_applied ? "RULE_OF_6_MILESTONE" : undefined),
          referee_name: currentProfile.name,
          referee_phone: currentProfile.contact_number,
          referee_email: currentProfile.email
        })
      });

      const webhookData = await res.json();

      const receipt = {
        orderId,
        paymentId,
        amount: finalPayable,
        originalAmount: BASE_PRICE,
        savings: totalSavings,
        couponApplied: couponResult?.code,
        isMilestone: couponResult?.is_milestone_applied,
        timestamp: new Date().toISOString(),
        candidateName: currentProfile.name,
        regNumber: currentProfile.reg_number || "BVM-Registered",
        defensePending: couponResult?.requires_id_upload && !uploadSuccess ? true : false
      };

      setPaymentReceipt(receipt);
      setPaymentDone(true);
      if (onPaymentSuccess) {
        onPaymentSuccess(receipt);
      }
    } catch (err) {
      console.error("Payment failure:", err);
      alert("Payment processing encountered an issue. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div id="checkout-pricing-container" className="bg-white rounded-3xl border border-[#362B5A]/10 shadow-xl overflow-hidden text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#362B5A] via-[#483a75] to-[#C2242C] p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparent Matrimonial Access</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              First-Month Subscription Checkout
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/80 font-medium max-w-xl">
              Verified Vedic profiles, horoscope alignment, zero hidden brokerage.
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-white/20 sm:pl-6 self-start sm:self-center">
            <span className="text-[11px] uppercase tracking-wider text-blue-200 block font-semibold">Total Payable</span>
            <div className="flex items-baseline gap-2">
              {totalSavings > 0 && (
                <span className="text-sm line-through text-rose-300 font-semibold">₹{BASE_PRICE}</span>
              )}
              <span className="text-3xl sm:text-4xl font-black text-amber-300 font-mono">
                ₹{finalPayable}
              </span>
            </div>
          </div>
        </div>
      </div>

      {paymentDone && paymentReceipt ? (
        /* Payment Success Receipt View */
        <div className="p-8 space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Payment Completed Successfully
            </span>
            <h3 className="text-2xl font-black text-[#362B5A]">Welcome to Shubhamastu Premium</h3>
            <p className="text-sm text-zinc-600 max-w-md mx-auto">
              Your payment of <strong>₹{paymentReceipt.amount}</strong> has been confirmed. Your account is now active with full matchmaking access.
            </p>
          </div>

          {/* Receipt Details Box */}
          <div className="max-w-md mx-auto bg-zinc-50 rounded-2xl p-5 border border-zinc-200 text-left space-y-3 font-sans text-xs">
            <div className="flex justify-between pb-2 border-b border-zinc-200">
              <span className="text-zinc-500">Order ID:</span>
              <span className="font-mono font-bold text-zinc-800">{paymentReceipt.orderId}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-zinc-200">
              <span className="text-zinc-500">Payment Reference:</span>
              <span className="font-mono font-bold text-zinc-800">{paymentReceipt.paymentId}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-zinc-200">
              <span className="text-zinc-500">Member Name:</span>
              <span className="font-bold text-zinc-800">{paymentReceipt.candidateName}</span>
            </div>
            {paymentReceipt.couponApplied && (
              <div className="flex justify-between pb-2 border-b border-zinc-200 text-emerald-700">
                <span>Coupon Applied:</span>
                <span className="font-bold">{paymentReceipt.couponApplied}</span>
              </div>
            )}
            {paymentReceipt.savings > 0 && (
              <div className="flex justify-between pb-2 border-b border-zinc-200 text-emerald-700 font-bold">
                <span>Total Amount Saved:</span>
                <span>₹{paymentReceipt.savings}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-sm font-black text-[#362B5A]">
              <span>Amount Paid:</span>
              <span className="text-emerald-600 font-mono">₹{paymentReceipt.amount}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#362B5A] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#483a75] transition-all shadow-md"
            >
              Go to Matchmaking Dashboard
            </button>
            {onNavigateToReferrals && (
              <button
                onClick={onNavigateToReferrals}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Refer Friends & Unlock ₹800 Rate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Normal Checkout View */
        <div className="p-6 sm:p-8 space-y-8">
          {/* Milestone Unlocked Banner (If qualified) */}
          {referralStats?.isUnlocked800Tier && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-2 border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-4 animate-in fade-in">
              <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-[#362B5A] text-sm sm:text-base">
                    Milestone Unlocked: ₹800 Referral Rate Applied!
                  </h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-300">
                    Rule of 6 Achieved
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Congratulations! You have completed <strong>{referralStats.qualifiedReferrals} Qualified Referrals</strong>. Your subscription price has been automatically dropped from ₹1,500 to <strong>₹800</strong> (Direct ₹700 monthly savings).
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Price Breakdown & Coupon Box */}
            <div className="lg:col-span-7 space-y-6">
              {/* Itemized Price Breakdown */}
              <div className="border border-zinc-200 rounded-2xl p-5 bg-zinc-50/50 space-y-4">
                <h3 className="font-extrabold text-[#362B5A] text-sm uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C2242C]" />
                  <span>Base Pricing Architecture</span>
                </h3>

                <div className="space-y-3 text-sm divide-y divide-zinc-200/80">
                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <span className="font-semibold text-zinc-800 block">Registration & Onboarding Fee</span>
                      <span className="text-[11px] text-zinc-500">Vedic horoscope entry & administrative verification</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-800">₹600.00</span>
                  </div>

                  <div className="flex justify-between items-center pt-3">
                    <div>
                      <span className="font-semibold text-zinc-800 block">First Month Premium Matchmaking Access</span>
                      <span className="text-[11px] text-zinc-500">Direct contact unlocks & anti-scroll kebab UI</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-800">₹900.00</span>
                  </div>

                  <div className="flex justify-between items-center pt-3 text-zinc-600">
                    <span>Full First-Month Subscription Base Price</span>
                    <span className="font-mono font-bold">₹1,500.00</span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex justify-between items-center pt-3 text-emerald-700 font-bold bg-emerald-50/70 -mx-5 px-5 py-2 rounded-lg">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span>
                          {couponResult?.is_milestone_applied
                            ? "Referral Milestone Discount (Rule of 6)"
                            : `Coupon Discount (${couponResult?.code})`}
                        </span>
                      </span>
                      <span className="font-mono">- ₹{totalSavings}.00</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 text-base font-black text-[#362B5A]">
                    <span>Net Amount Payable</span>
                    <span className="text-2xl font-mono text-[#C2242C]">₹{finalPayable}.00</span>
                  </div>
                </div>
              </div>

              {/* Coupon Application Box */}
              <div className="border border-zinc-200 rounded-2xl p-5 bg-white space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span>Have a Coupon Code?</span>
                  </label>
                  {couponResult && (
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove Code</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. AGNIVEERFLAT50, SHUBH10"
                      className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl text-sm font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-[#362B5A] focus:bg-white transition-all text-[#362B5A]"
                    />
                  </div>
                  <button
                    onClick={() => handleApplyCoupon()}
                    disabled={loading || !couponInput.trim()}
                    className="px-5 py-3 bg-[#362B5A] hover:bg-[#483a75] disabled:bg-zinc-300 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Apply</span>
                      </>
                    )}
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {couponResult && couponResult.valid && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{couponResult.message}</span>
                      <span className="text-[11px] text-emerald-700">
                        {couponResult.code === "AGNIVEERFLAT50" 
                          ? "Armed Forces verification gate active. User pays ₹750."
                          : `Applied savings: ₹${couponResult.discount_amount}.`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick Coupon Chips */}
                <div className="pt-2 border-t border-zinc-100">
                  <span className="text-[11px] text-zinc-500 font-semibold block mb-2">Popular Codes:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setCouponInput("AGNIVEERFLAT50");
                        handleApplyCoupon("AGNIVEERFLAT50");
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                      <span>AGNIVEERFLAT50 (50% Defense Off)</span>
                    </button>
                    <button
                      onClick={() => {
                        setCouponInput("SHUBH10");
                        handleApplyCoupon("SHUBH10");
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg text-xs font-bold text-blue-900 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>SHUBH10 (10% Welcome Off)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Defense Upload Verification Gate or Payment Action */}
            <div className="lg:col-span-5 space-y-6">
              {/* Dynamic Alert & File Dropzone for Defense Personnel (AGNIVEERFLAT50) */}
              {couponResult && couponResult.requires_id_upload ? (
                <div className="border-2 border-amber-400 bg-amber-50/50 rounded-2xl p-5 space-y-4 shadow-md animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-amber-500 text-black rounded-xl font-bold shrink-0 shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#362B5A]">
                        Military / Agniveer ID Card Required for 50% Off
                      </h4>
                      <p className="text-xs text-amber-900/80 leading-relaxed mt-0.5">
                        In accordance with Indian Armed Forces welfare policy, please upload an official Defense, Agniveer, or Military Veteran ID card.
                      </p>
                    </div>
                  </div>

                  {/* Upload Status Alert */}
                  {uploadSuccess ? (
                    <div className="bg-emerald-100/90 border border-emerald-300 rounded-xl p-3.5 text-xs text-emerald-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <Clock className="w-4 h-4 text-emerald-700 animate-spin" />
                        <span>Status: PENDING_VERIFICATION</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        ID Document successfully uploaded (Ref: {verificationId || "DEF-100"}). You may proceed to checkout with the ₹750 provisional discount. Admin approval will be confirmed within 12-24 hours.
                      </p>
                      {idPreview && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-emerald-300 max-h-32">
                          <img src={idPreview} alt="Military ID Proof" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Secure File Dropzone */
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        dragActive
                          ? "border-[#362B5A] bg-blue-50"
                          : "border-amber-300 bg-white hover:border-amber-400"
                      }`}
                    >
                      <input
                        id="military-id-input"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {idPreview ? (
                        <div className="space-y-3">
                          <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden border-2 border-amber-400 shadow-sm">
                            <img src={idPreview} alt="ID Preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-zinc-800 block truncate max-w-xs mx-auto">
                              {idFile?.name || "Military_ID_Proof.jpg"}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              {(idFile?.size ? (idFile.size / 1024).toFixed(1) : "250")} KB • Ready to submit
                            </span>
                          </div>

                          <div className="flex justify-center gap-2 pt-1">
                            <button
                              onClick={handleUploadIdProof}
                              disabled={uploadingId}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              {uploadingId ? (
                                <span>Submitting...</span>
                              ) : (
                                <>
                                  <UploadCloud className="w-4 h-4" />
                                  <span>Submit for Verification</span>
                                </>
                              )}
                            </button>
                            <label
                              htmlFor="military-id-input"
                              className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
                            >
                              Change
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label htmlFor="military-id-input" className="cursor-pointer block space-y-2">
                          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-[#362B5A] block">
                              Click or Drag & Drop Armed Forces ID Card
                            </span>
                            <span className="text-[11px] text-zinc-500 block">
                              Supports JPG, PNG, WEBP or PDF (Max 10MB)
                            </span>
                          </div>
                          <span className="inline-block px-3 py-1 bg-amber-500 text-black text-[11px] font-black uppercase rounded-md tracking-wider">
                            Select ID Document
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Checkout Action Card */}
              <div className="border border-zinc-200 bg-zinc-50/50 rounded-2xl p-6 space-y-5">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    Instant Gateway Checkout
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-zinc-700">Total Due Today:</span>
                    <span className="text-3xl font-black text-[#362B5A] font-mono">₹{finalPayable}</span>
                  </div>
                </div>

                {/* Gateway Integration Button */}
                <button
                  onClick={handlePayNow}
                  disabled={isProcessingPayment || (couponResult?.requires_id_upload && !uploadSuccess && couponResult.defense_status === "NOT_SUBMITTED")}
                  className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                    couponResult?.requires_id_upload && !uploadSuccess && couponResult.defense_status === "NOT_SUBMITTED"
                      ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                      : "bg-[#C2242C] hover:bg-[#a51d24] text-white hover:scale-[1.01]"
                  }`}
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </div>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹{finalPayable} via Cashfree / Razorpay / UPI</span>
                    </>
                  )}
                </button>

                {couponResult?.requires_id_upload && !uploadSuccess && couponResult.defense_status === "NOT_SUBMITTED" && (
                  <p className="text-[11px] text-amber-800 text-center font-semibold">
                    ⚠️ Please upload your Military / Agniveer ID above to unlock the Pay button.
                  </p>
                )}

                <div className="pt-2 border-t border-zinc-200 space-y-2 text-[11px] text-zinc-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>256-bit Bank-Grade SSL Encryption (Cashfree & Razorpay)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant Matchmaking Portal Activation upon payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
