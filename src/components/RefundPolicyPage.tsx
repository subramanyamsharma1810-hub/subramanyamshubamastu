import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  RefreshCw, 
  FileText, 
  ArrowLeft, 
  Printer, 
  Copy, 
  Check, 
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  MessageSquareQuote,
  ShieldAlert,
  Scale
} from "lucide-react";

export default function RefundPolicyPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.origin + "/refund";
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 font-sans antialiased selection:bg-amber-200">
      {/* Top Notice Bar */}
      <div className="bg-[#362B5A] text-amber-200 text-xs px-4 py-2 text-center font-medium flex items-center justify-center gap-2 border-b border-white/10">
        <Scale className="w-3.5 h-3.5 text-amber-300" />
        <span>Official Statutory Policy • shubhamastu.in/refund • Transparent Fair-Service Guarantee</span>
      </div>

      {/* Navigation Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <div className="hidden sm:block h-5 w-px bg-stone-200" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 font-serif font-black text-sm">
                శ్రీ
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-[#362B5A] tracking-tight leading-none">
                  shubhamastu.in
                </h1>
                <p className="text-[10px] text-stone-500 font-mono tracking-wider">
                  Glark Solutions
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
              title="Copy link to this page"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied Link" : "Copy Link"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#362B5A] hover:bg-[#271f42] text-white transition-colors cursor-pointer shadow-xs"
              title="Print Policy"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Document</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        
        {/* Document Title Hero */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
              <span>Consumer Assurance & Fee Policy</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last Updated: September 2026</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#362B5A] tracking-tight">
              CANCELLATION AND REFUND POLICY
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-mono">
              Official URL: <span className="font-bold text-amber-800">https://shubhamastu.in/refund</span>
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-stone-800 space-y-2">
            <p>
              At <strong>shubhamastu.in</strong> (operated by <strong>Glark Solutions</strong>), we maintain strict transparency regarding our pricing, matchmaking assistance, and service tiers.
            </p>
            <p className="text-stone-600">
              Please read this document carefully to understand the terms governing our ₹100 conditional search registration and the ₹900 premium membership activation fee.
            </p>
          </div>

          {/* Quick Section Guide */}
          <div className="pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Policy Structure</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
              <a href="#section-1" className="p-2 rounded-lg bg-stone-50 hover:bg-emerald-50 hover:text-emerald-900 transition-colors flex items-center gap-2">
                <span className="font-bold text-[#362B5A]">1.</span> Fee Structure & Refund Eligibility
              </a>
              <a href="#section-2" className="p-2 rounded-lg bg-stone-50 hover:bg-emerald-50 hover:text-emerald-900 transition-colors flex items-center gap-2">
                <span className="font-bold text-[#362B5A]">2.</span> The ₹100 Conditional Refund Protocol
              </a>
              <a href="#section-3" className="p-2 rounded-lg bg-stone-50 hover:bg-emerald-50 hover:text-emerald-900 transition-colors flex items-center gap-2">
                <span className="font-bold text-[#362B5A]">3.</span> The ₹900 Non-Refundable Membership Policy
              </a>
              <a href="#section-4" className="p-2 rounded-lg bg-stone-50 hover:bg-emerald-50 hover:text-emerald-900 transition-colors flex items-center gap-2">
                <span className="font-bold text-[#362B5A]">4.</span> Refund Processing Timeline
              </a>
            </div>
          </div>
        </div>

        {/* Section 1: Fee Structure & Refund Eligibility Table */}
        <section id="section-1" className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#362B5A] text-white text-sm font-black flex items-center justify-center shrink-0">
              1
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight">
              Fee Structure & Refund Eligibility
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 space-y-4">
            <p className="text-sm text-stone-700">
              Summary of all platform fees, their refundability classification, and associated statutory conditions:
            </p>

            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 text-stone-800 border-b border-stone-200 font-bold uppercase text-[11px] tracking-wider">
                    <th className="p-3.5">Fee Type</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Refund Status</th>
                    <th className="p-3.5">Conditions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-700">
                  <tr className="hover:bg-amber-50/50 transition-colors">
                    <td className="p-3.5 font-bold text-stone-900">
                      Match Search / Registration Fee
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#362B5A] text-sm">
                      ₹100
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        100% Refundable (Conditional)
                      </span>
                    </td>
                    <td className="p-3.5 leading-relaxed">
                      Fully refundable if zero suitable prospective matches matching your basic criteria are delivered within 30 days.
                    </td>
                  </tr>
                  <tr className="hover:bg-purple-50/50 transition-colors">
                    <td className="p-3.5 font-bold text-stone-900">
                      Premium Membership / Service Activation Fee
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#362B5A] text-sm">
                      ₹900
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        Non-Refundable
                      </span>
                    </td>
                    <td className="p-3.5 leading-relaxed">
                      Non-refundable once access is granted, profiles are shared, or contact credentials are unlocked.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 2: The ₹100 Conditional Refund Protocol */}
        <section id="section-2" className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-700 text-white text-sm font-black flex items-center justify-center shrink-0">
              2
            </span>
            <h3 className="text-lg sm:text-xl font-black text-emerald-950 tracking-tight">
              The ₹100 Conditional Refund Protocol
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>
              When a user pays the <strong>₹100 exploration fee</strong>, our matchmaking team actively checks database records and partner networks to identify suitable proposals matching the user's community, educational, and astrological/location criteria.
            </p>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Viable Matches Threshold</span>
              </div>
              <p className="text-xs sm:text-sm font-medium">
                If, after <strong>60 business days</strong>, our team is unable to present at least one viable profile meeting the submitted preferences, the user is entitled to a <strong>complete 100% refund of ₹100</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-900">
                <MessageSquareQuote className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Courtesy Letter Commitment</span>
              </div>
              <p className="text-xs sm:text-sm">
                <strong>Courtesy Letter:</strong> Alongside the refund, an official acknowledgment and apology message will be dispatched directly to your registered WhatsApp phone number.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: The ₹900 Non-Refundable Membership Policy */}
        <section id="section-3" className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-rose-700 text-white text-sm font-black flex items-center justify-center shrink-0">
              3
            </span>
            <h3 className="text-lg sm:text-xl font-black text-rose-950 tracking-tight">
              The ₹900 Non-Refundable Membership Policy
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 space-y-4 text-stone-700 text-sm leading-relaxed">
            <p>
              The <strong>₹900 tier</strong> covers manual profile indexing, platform server resources, customer support, and direct exchange of contact information between consenting parties.
            </p>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-900">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Finality of Activation</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold">
                Once this tier is paid and activated, <strong>no refunds or chargebacks will be issued under any circumstances</strong>, regardless of whether marriage is finalized, proposals are declined by the opposite party, or the user changes their mind.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Refund Processing Timeline */}
        <section id="section-4" className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#362B5A] text-white text-sm font-black flex items-center justify-center shrink-0">
              4
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight">
              Refund Processing Timeline
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 space-y-4 text-stone-700 text-sm leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-stone-800">
                  <Clock className="w-4 h-4 text-[#362B5A]" />
                  <span>Turnaround Window</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-800">
                  Approved refunds for the ₹100 search fee are processed within <strong>5 to 7 business days</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-stone-800">
                  <CreditCard className="w-4 h-4 text-[#362B5A]" />
                  <span>Settlement Channel</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-800">
                  Refunds are credited directly back to the <strong>original payment source</strong> (UPI account, debit card, or net banking) via our payment gateway partner (Cashfree Payments).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Legal Entity & Footer Navigation */}
        <div className="bg-stone-100 rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-4 text-xs sm:text-sm text-stone-700">
          <div className="flex items-center gap-2 text-stone-900 font-bold uppercase tracking-wider text-xs">
            <Building2 className="w-4 h-4 text-[#362B5A]" />
            <span>Platform Ownership & Legal Entity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <p className="font-semibold text-stone-900">Platform:</p>
              <p>shubhamastu.in (www.shubhamastu.in)</p>
            </div>
            <div>
              <p className="font-semibold text-stone-900">Owned & Operated By:</p>
              <p>Glark Solutions (G.V. Subramanyam, Proprietor)</p>
            </div>
            <div>
              <p className="font-semibold text-stone-900">Payment Gateway Partner:</p>
              <p>Cashfree Payments India Pvt. Ltd.</p>
            </div>
            <div>
              <p className="font-semibold text-stone-900">Refund Assistance:</p>
              <p>subramanyamghadiyaram@gmail.com</p>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/terms" className="text-[#362B5A] hover:underline font-bold">
                Terms & Conditions →
              </Link>
              <span>•</span>
              <Link to="/grievance" className="text-[#362B5A] hover:underline font-bold">
                Grievance Redressal →
              </Link>
              <span>•</span>
              <Link to="/" className="text-[#362B5A] hover:underline font-bold">
                Home →
              </Link>
            </div>
            <p>© 2026 shubhamastu.in • Glark Solutions. All Rights Reserved.</p>
          </div>
        </div>

      </main>
    </div>
  );
}
