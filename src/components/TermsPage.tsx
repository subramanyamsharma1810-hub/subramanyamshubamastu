import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  Scale, 
  ArrowLeft, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink,
  Lock,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2
} from "lucide-react";

export default function TermsPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.origin + "/terms";
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
        <span>Official Statutory Document • shubhamastu.in/terms • Section 79 IT Act 2000 Compliance</span>
      </div>

      {/* Main Navigation Header */}
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
              title="Print Terms"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>Statutory Legal Policy</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last Updated: September 2026</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#362B5A] tracking-tight">
              TERMS AND CONDITIONS OF SERVICE
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-mono">
              Official URL: <span className="font-bold text-amber-800">https://shubhamastu.in/terms</span>
            </p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-amber-950 space-y-2">
            <p>
              Welcome to <strong>shubhamastu.in</strong> (the <strong>"Platform"</strong>), owned and operated by <strong>Glark Solutions</strong> (<strong>"Proprietorship"</strong>, <strong>"We"</strong>, <strong>"Us"</strong>, or <strong>"Our"</strong>).
            </p>
            <p className="font-semibold">
              By accessing, registering, or using our services, you (<strong>"User"</strong>, <strong>"You"</strong>, or <strong>"Registrant"</strong>) agree to be bound by these Terms and Conditions. If you do not agree, please do not use this Platform.
            </p>
          </div>

          {/* Table of Contents Quick Links */}
          <div className="pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Sections Guide</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
              <a href="#section-1" className="p-2 rounded-lg bg-stone-50 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-2">
                <span className="font-bold text-[#362B5A]">1.</span> Nature of Service & Intermediary Status
              </a>
              <a href="#section-2" className="p-2 rounded-lg bg-stone-50 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-2">
                <span className="font-bold text-[#362B5A]">2.</span> Absolute Disclaimer of Verification
              </a>
              <a href="#section-3" className="p-2 rounded-lg bg-stone-50 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-2">
                <span className="font-bold text-[#362B5A]">3.</span> Eligibility Criteria (Ages 18 & 21)
              </a>
              <a href="#section-4" className="p-2 rounded-lg bg-stone-50 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-2">
                <span className="font-bold text-[#362B5A]">4.</span> Service Fees (₹100 & ₹900)
              </a>
              <a href="#section-5" className="p-2 rounded-lg bg-stone-50 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-2">
                <span className="font-bold text-[#362B5A]">5.</span> Code of Conduct & Prohibitions
              </a>
              <a href="#section-6" className="p-2 rounded-lg bg-stone-50 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-2">
                <span className="font-bold text-[#362B5A]">6.</span> Limitation of Liability
              </a>
              <a href="#section-7" className="p-2 rounded-lg bg-stone-50 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-2 sm:col-span-2">
                <span className="font-bold text-[#362B5A]">7.</span> Governing Law & Jurisdiction (Andhra Pradesh)
              </a>
            </div>
          </div>
        </div>

        {/* Section 1 */}
        <section id="section-1" className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#362B5A] text-white text-sm font-black flex items-center justify-center shrink-0">
              1
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight">
              Nature of Service & Intermediary Status
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 space-y-3 text-stone-700 text-sm leading-relaxed">
            <p className="font-semibold text-stone-900">
              Shubhamastu.in is an online matrimonial matchmaking facilitator and preliminary introductory service.
            </p>
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-950 space-y-2">
              <p className="font-medium">
                In accordance with <strong>Section 2(1)(w)</strong> and <strong>Section 79 of the Information Technology Act, 2000</strong>, Shubhamastu.in operates strictly as an <strong>intermediary</strong>.
              </p>
              <p className="text-xs text-blue-900/90 leading-relaxed">
                The platform provides a technology medium for users and families to discover matrimonial profiles. It does not act as a marriage bureau, personal counselor, or guarantor of marital alliances.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section id="section-2" className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-xs space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-rose-700 text-white text-sm font-black flex items-center justify-center shrink-0">
              2
            </span>
            <h3 className="text-lg sm:text-xl font-black text-rose-950 tracking-tight">
              Absolute Disclaimer of Character, Financial, and Personal Verification
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 space-y-4 text-stone-700 text-sm leading-relaxed">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>No Background Checks</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed font-semibold">
                Glark Solutions and Shubhamastu.in <strong>DO NOT</strong> perform physical verification, criminal record checks, character assessments, psychological evaluations, matrimonial status audits, or financial/employment background verification of any registered user.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Sole Responsibility of Users / Guardians:</span>
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed">
                All information displayed is <strong>self-reported</strong> by users or their family members. Users, prospective brides/grooms, parents, and legal guardians bear the <strong>sole and absolute responsibility</strong> to conduct thorough, independent, offline background checks, character inquiries, and family investigations prior to solemnizing any alliance or engaging in financial transactions.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-stone-600" />
                <span>No Liability for Misrepresentation:</span>
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed">
                Under no circumstances shall <strong>Glark Solutions</strong>, its proprietor, partners, or affiliates be held liable for any deceit, cheating, marital disputes, domestic discord, fraud, bigamy, or physical/emotional harm resulting from interactions initiated via the Platform.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section id="section-3" className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#362B5A] text-white text-sm font-black flex items-center justify-center shrink-0">
              3
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight">
              Eligibility Criteria
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 space-y-3 text-stone-700 text-sm leading-relaxed">
            <p>
              By registering or submitting details on Shubhamastu.in, you represent and warrant that:
            </p>

            <ul className="space-y-2.5 pt-1">
              <li className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="text-xs sm:text-sm">
                  <strong>Statutory Age Requirement:</strong> The bride is at least <strong>18 years of age</strong> and the groom is at least <strong>21 years of age</strong> (as mandated under the Prohibition of Child Marriage Act and prevailing Indian marriage laws).
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="text-xs sm:text-sm">
                  <strong>Legal Competency:</strong> You are legally competent to enter into a binding contract under the <strong>Indian Contract Act, 1872</strong>.
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="text-xs sm:text-sm">
                  <strong>Bona Fide Matrimonial Intent:</strong> The registration is made strictly for genuine matrimonial intent and not for casual dating, commercial solicitation, harassment, or unlawful objectives.
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section id="section-4" className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#362B5A] text-white text-sm font-black flex items-center justify-center shrink-0">
              4
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight">
              Service Fees and Payment Structure
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 space-y-4 text-stone-700 text-sm leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Registration Fee</span>
                  <span className="text-lg font-black text-[#362B5A]">₹100</span>
                </div>
                <p className="text-xs text-amber-950">
                  <strong>Match Exploration / Registration Processing Fee:</strong> ₹100 (Inclusive of applicable taxes). Governed by our conditional refund protocol outlined in our <Link to="/refund" className="underline font-bold text-amber-900 hover:text-amber-700">Cancellation and Refund Policy (shubhamastu.in/refund)</Link>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-900">Premium Membership</span>
                  <span className="text-lg font-black text-[#362B5A]">₹900</span>
                </div>
                <p className="text-xs text-purple-950">
                  <strong>Premium Membership / Service Activation Fee:</strong> ₹900 (Inclusive of applicable taxes). <strong>Strictly Non-Refundable</strong>.
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 italic">
              Payments are processed securely via authorized payment aggregators (e.g., Cashfree Payments India Pvt. Ltd. / Unified Payments Interface UPI).
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section id="section-5" className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#362B5A] text-white text-sm font-black flex items-center justify-center shrink-0">
              5
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight">
              Code of Conduct & Prohibited Activities
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 space-y-3 text-stone-700 text-sm leading-relaxed">
            <p>
              Under <strong>Rule 3(1)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, users shall not host, upload, or transmit any content that:
            </p>

            <ul className="space-y-2 pl-4 list-disc text-xs sm:text-sm text-stone-700">
              <li>Is fraudulent, defamatory, obscene, invasive of another's privacy, or religiously hateful.</li>
              <li>Solicits dowry, extortion, or unauthorized money transfers.</li>
              <li>Impersonates any other individual or contains fake photographs.</li>
            </ul>

            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-950 text-xs font-bold">
              ⚠️ Strict Legal Action: Any violation will result in immediate termination of the account and referral to Indian cyber law enforcement authorities.
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section id="section-6" className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#362B5A] text-white text-sm font-black flex items-center justify-center shrink-0">
              6
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight">
              Limitation of Liability
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 space-y-3 text-stone-700 text-sm leading-relaxed">
            <p>
              To the maximum extent permitted by applicable Indian laws, <strong>Glark Solutions</strong> shall not be liable for any indirect, incidental, punitive, or consequential damages arising out of the use of our services.
            </p>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 font-mono text-xs">
              <strong>Statutory Liability Cap:</strong> Our total liability for any claim shall not exceed the amount actually paid by you to us (capped at <strong>₹100</strong> or <strong>₹900</strong> as applicable).
            </div>
          </div>
        </section>

        {/* Section 7 */}
        <section id="section-7" className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#362B5A] text-white text-sm font-black flex items-center justify-center shrink-0">
              7
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight">
              Governing Law and Jurisdiction
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 space-y-3 text-stone-700 text-sm leading-relaxed">
            <p>
              These Terms shall be governed by and construed in accordance with the <strong>laws of the Republic of India</strong>.
            </p>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 font-medium text-xs sm:text-sm">
              Any legal disputes arising out of these terms shall be subject to the <strong>exclusive jurisdiction of the competent courts in Andhra Pradesh, India</strong>.
            </div>
          </div>
        </section>

        {/* Official Entity & Contact Box */}
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
              <p className="font-semibold text-stone-900">Jurisdiction & Location:</p>
              <p>Andhra Pradesh, India</p>
            </div>
            <div>
              <p className="font-semibold text-stone-900">Grievance / Support Email:</p>
              <p>subramanyamghadiyaram@gmail.com</p>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/refund-policy" className="text-[#362B5A] hover:underline font-bold">
                Cancellation & Refund Policy →
              </Link>
              <span>•</span>
              <Link to="/grievance" className="text-[#362B5A] hover:underline font-bold">
                Grievance Redressal →
              </Link>
              <span>•</span>
              <Link to="/" className="text-[#362B5A] hover:underline font-bold">
                Return to shubhamastu.in →
              </Link>
            </div>
            <p>© 2026 shubhamastu.in • Glark Solutions. All Rights Reserved.</p>
          </div>
        </div>

      </main>
    </div>
  );
}
