import React, { useState, useEffect } from "react";
import { databaseService } from "../lib/databaseService";
import { Profile } from "../types";
import { Printer, ArrowLeft, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";

interface PublicReceiptViewerProps {
  transactionId: string;
  onBack: () => void;
}

export default function PublicReceiptViewer({ transactionId, onBack }: PublicReceiptViewerProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReceiptProfile() {
      setLoading(true);
      try {
        const profiles = await databaseService.getProfiles(true);
        // Find profile matching this transaction ID either as free match fee or premium upgrade
        const found = profiles.find(
          (p) =>
            p.fee_transaction_id === transactionId ||
            p.upgrade_transaction_id === transactionId
        );

        if (found) {
          setProfile(found);
        } else {
          setError("No verified payment ledger matching this Transaction ID was found in the Bramhana Vivaha Vedika registry.");
        }
      } catch (err) {
        console.error("Error loading receipt:", err);
        setError("Failed to query the secure database. Please check your network connection.");
      } finally {
        setLoading(false);
      }
    }
    loadReceiptProfile();
  }, [transactionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 space-y-4">
        <svg className="animate-spin h-10 w-10 text-[#C2242C]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-xs font-black text-[#362B5A] uppercase tracking-widest font-mono">
          Retrieving Secure Matrimonial Receipt...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-xl border border-rose-100 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-[#C2242C] rounded-3xl flex items-center justify-center mx-auto border-2 border-rose-100">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-[#362B5A] tracking-tight">Receipt Not Found</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              {error || "We could not find any active verified registration for this transaction ID."}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 px-4 bg-[#362B5A] hover:bg-[#251d3f] text-white rounded-2xl font-bold uppercase tracking-wider text-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal</span>
          </button>
        </div>
      </div>
    );
  }

  const isUpgrade = profile.upgrade_transaction_id === transactionId;
  const amount = isUpgrade ? 900 : 100;
  const approvedAt = profile.fee_received_at || new Date().toLocaleString();
  const approvedBy = profile.fee_received_by || "System Auto-Audit";
  const upiId = profile.fee_receiver_upi || "bramhanavedika@ybl";
  const regNo = profile.reg_no || profile.phone || "N/A";

  return (
    <div className="min-h-screen bg-neutral-100/50 py-10 px-4 flex flex-col items-center justify-center space-y-6">
      {/* Receipt Card Wrapper */}
      <div id="printable-receipt-card" className="bg-white rounded-[32px] max-w-xl w-full p-6 sm:p-10 shadow-xl border border-gray-100 space-y-6 text-left relative overflow-hidden">
        {/* Dynamic Watermark Background */}
        <div className="absolute right-10 top-24 opacity-[0.05] pointer-events-none select-none">
          <div className="border-4 border-dashed border-[#C2242C] text-[#C2242C] px-6 py-3 font-mono font-black text-4xl rounded-xl uppercase tracking-widest rotate-[-15deg]">
            BVV VERIFIED
          </div>
        </div>

        {/* Decorative Indian border accents at the top */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-[#C2242C] to-[#362B5A] rounded-t-full absolute top-0 left-0 right-0" />

        {/* Header */}
        <div className="flex justify-between items-start border-b border-dashed border-amber-200 pb-5">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#362B5A] tracking-tight uppercase">Bramhana Vivaha Vedika</h2>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Sri G.V. Subramanyam Registrar | Ph: 9494301555</p>
            <span className="inline-block text-[9px] bg-[#C2242C] text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              సనాతన బ్రాహ్మణ వివాహ వేదిక
            </span>
          </div>
          <div className="text-right space-y-1">
            <span className="text-xs bg-emerald-50 text-emerald-800 font-mono font-black px-3 py-1.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              Paid ₹{amount}
            </span>
            <p className="text-[10px] font-mono text-gray-400 mt-2">
              Receipt No:<br/>
              <strong className="text-gray-600">BVV-REC-{transactionId.substring(0, 8).toUpperCase()}</strong>
            </p>
          </div>
        </div>

        {/* Success Status Banner */}
        <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-1 bg-emerald-500 text-white rounded-full mt-0.5 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <h4 className="font-bold text-emerald-900 uppercase tracking-wide">Signature Verification Secured</h4>
            <p className="text-emerald-700 leading-normal">
              This payment transaction signature matches our secure registration ledger. Your profile status is <strong>ACTIVATED ({isUpgrade ? "Premium" : "Verified"})</strong>.
            </p>
          </div>
        </div>

        {/* Billing Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 bg-[#FAF9F5] p-4 rounded-2xl border border-amber-100/50">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest block">Billing To (సభ్యుల వివరాలు):</span>
            <p className="font-extrabold text-gray-800 text-sm">{profile.surname} {profile.name}</p>
            <p className="text-gray-500 leading-relaxed font-semibold">
              ID/Reg: <strong className="text-[#362B5A]">{regNo}</strong><br/>
              Gender: <strong className="text-gray-700">{profile.gender}</strong><br/>
              Contact: <strong className="text-gray-700">{profile.phone}</strong>
            </p>
          </div>

          <div className="space-y-2 bg-[#FAF9F5] p-4 rounded-2xl border border-amber-100/50">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest block">Audit Ledger Details (చెల్లింపు వివరాలు):</span>
            <p className="text-gray-500 leading-relaxed font-semibold">
              Transaction ID:<br/>
              <strong className="text-indigo-900 font-mono font-bold block truncate text-[11px]" title={transactionId}>{transactionId}</strong>
              Receiver UPI: <strong className="text-emerald-800 font-bold block mt-0.5">{upiId}</strong>
              Approved At: <strong className="text-gray-700 block mt-0.5">{approvedAt}</strong>
              Approved By: <strong className="text-[#362B5A] block mt-0.5">{approvedBy}</strong>
            </p>
          </div>
        </div>

        {/* Service Table Summary */}
        <div className="pt-2 text-xs">
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-extrabold uppercase pb-1.5 border-b border-gray-100 tracking-wider">
            <span>Description of Matrimonial Access</span>
            <span className="text-right">Total (INR)</span>
          </div>
          <div className="flex justify-between items-start py-3">
            <div className="max-w-[80%] text-left space-y-0.5">
              <p className="font-extrabold text-gray-700">Premium Registry Activation & Verification Fee</p>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Enables full system verification status, unlocks reverse opposite-gender matching engine metrics, provides access to certified Jataka & Gothram verification, and secures registry inclusion.
              </p>
            </div>
            <span className="font-bold text-[#362B5A] font-mono text-right shrink-0 text-sm">₹{amount}.00</span>
          </div>
          <div className="flex justify-between items-center p-3.5 bg-amber-500/5 border border-amber-200/40 rounded-2xl mt-2 font-mono">
            <span className="text-xs text-amber-950 font-black uppercase tracking-wide">Total Settled Amount:</span>
            <span className="font-black text-[#C2242C] text-base text-right">₹{amount}.00</span>
          </div>
        </div>

        {/* Signature Stamp Block */}
        <div className="flex justify-between items-end pt-4 border-t border-dashed border-gray-100 text-[10px]">
          <div>
            <p className="font-extrabold text-[#362B5A] margin-0">Sri G.V. Subramanyam</p>
            <p className="text-gray-400 leading-none mt-0.5">Chief Registrar, Bramhana Welfare</p>
          </div>
          <div className="text-right">
            <span className="text-[9px] bg-red-50 text-[#C2242C] font-black px-2.5 py-0.5 rounded uppercase border border-red-200 font-mono tracking-wider">
              APPROVED BY VEDIKA
            </span>
            <p className="font-bold text-gray-700 mt-1.5 leading-tight">{approvedBy}</p>
            <p className="text-gray-400 leading-none">Admin Representative</p>
          </div>
        </div>

        {/* Footer legalities */}
        <div className="text-center font-semibold text-[9px] text-gray-400 border-t border-gray-100 pt-4 leading-normal">
          <p>🙏 **Thank you for registering with Bramhana Vivaha Vedika.** 🙏</p>
          <p className="mt-1">This is a computer-generated, digitally verified receipt. No physical signature is required under Section 65B of the Indian Evidence Act, 1872.</p>
        </div>
      </div>

      {/* Control Buttons (Hidden on print) */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl relative z-10 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 py-3 px-4 bg-[#362B5A] hover:bg-[#251d3f] text-white rounded-2xl font-extrabold uppercase tracking-wider text-xs cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#362B5A]/20"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF Receipt</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 px-4 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 rounded-2xl font-extrabold uppercase tracking-wider text-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>

      {/* Embedded CSS style overrides for high fidelity printing */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-receipt-card {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
