import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldAlert, 
  FileText, 
  ArrowLeft, 
  Printer, 
  Copy, 
  Check, 
  Calendar,
  Building2,
  Phone,
  Mail,
  Clock,
  Send,
  Scale,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  Lock
} from "lucide-react";

export default function GrievancePage() {
  const [copied, setCopied] = useState(false);
  const [complaintType, setComplaintType] = useState("impersonation");
  const [fullName, setFullName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [profileUrlOrId, setProfileUrlOrId] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.origin + "/grievance";
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[GRIEVANCE TICKET] ${complaintType.toUpperCase()} - ${fullName}`);
    const body = encodeURIComponent(
      `STATUTORY GRIEVANCE SUBMISSION\n` +
      `---------------------------------\n` +
      `Category: ${complaintType}\n` +
      `Complainant Name: ${fullName}\n` +
      `Complainant Phone: ${userPhone}\n` +
      `Profile ID / Candidate Details: ${profileUrlOrId}\n\n` +
      `Description of Grievance:\n${description}\n\n` +
      `Submitted via: shubhamastu.in/grievance\n` +
      `Timestamp: ${new Date().toLocaleString("en-IN")}`
    );

    // Provide option to open WhatsApp or Mail
    window.open(`mailto:subramanyamghadiyaram@gmail.com?subject=${subject}&body=${body}`, "_blank");
    setSubmitted(true);
  };

  const handleWhatsAppGrievance = () => {
    const text = encodeURIComponent(
      `*STATUTORY GRIEVANCE - shubhamastu.in*\n` +
      `*Name:* ${fullName || "User"}\n` +
      `*Phone:* ${userPhone || "Not provided"}\n` +
      `*Category:* ${complaintType}\n` +
      `*Details:* ${description || "Requesting urgent review regarding profile/data."}`
    );
    window.open(`https://wa.me/919347359489?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 font-sans antialiased selection:bg-amber-200">
      {/* Top Notice Bar */}
      <div className="bg-[#362B5A] text-amber-200 text-xs px-4 py-2 text-center font-medium flex items-center justify-center gap-2 border-b border-white/10">
        <Scale className="w-3.5 h-3.5 text-amber-300" />
        <span>Official Statutory Mechanism • shubhamastu.in/grievance • Rule 3(2) IT Rules 2021 & DPDPA 2023 Compliance</span>
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        
        {/* Document Title Hero */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-700" />
              <span>Statutory Grievance Redressal</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last Updated: September 2026</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#362B5A] tracking-tight">
              GRIEVANCE REDRESSAL MECHANISM
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-mono">
              Official URL: <span className="font-bold text-amber-800">https://shubhamastu.in/grievance</span>
            </p>
          </div>

          {/* Statutory Framework Reference */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-stone-800 space-y-2">
            <p className="font-semibold text-stone-900">
              In strict accordance with:
            </p>
            <ul className="space-y-1.5 pl-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#362B5A]" />
                <span><strong>Rule 3(2)</strong> of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#362B5A]" />
                <span>The <strong>Consumer Protection (E-Commerce) Rules, 2020</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#362B5A]" />
                <span>The <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong></span>
              </li>
            </ul>
            <p className="pt-2 text-stone-600">
              <strong>Shubhamastu.in</strong> has appointed a designated Grievance Officer to handle consumer complaints, profile disputes, impersonation reports, and data privacy inquiries promptly and impartially.
            </p>
          </div>
        </div>

        {/* Designated Grievance Officer Profile Card */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#362B5A]">
              <UserCheck className="w-5 h-5 text-[#362B5A]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight">
                Designated Grievance Officer
              </h3>
              <p className="text-xs text-stone-500 font-mono">
                Statutory Contact for Legal & User Disputes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Name</span>
              <p className="text-base font-extrabold text-stone-900">
                Sri G.V. Subramanyam
              </p>
              <p className="text-xs text-amber-900 font-medium">Venkata Subramanyam Ghadiyaram (Proprietor)</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Designation</span>
              <p className="text-base font-extrabold text-[#362B5A]">
                Proprietor & Grievance Officer
              </p>
              <p className="text-xs text-stone-600">Chief Compliance & Redressal Officer</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Operating Entity</span>
              <p className="text-sm font-bold text-stone-800">
                Glark Solutions (G.V. Subramanyam, Proprietor)
              </p>
              <p className="text-xs text-stone-600">shubhamastu.in</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Operating Address & Jurisdiction</span>
              <p className="text-sm font-bold text-stone-800">
                Andhra Pradesh, India
              </p>
              <p className="text-xs text-stone-600">Exclusive jurisdiction of competent Andhra Pradesh courts</p>
            </div>
          </div>

          {/* Quick Contact Action Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a 
              href="mailto:subramanyamghadiyaram@gmail.com"
              className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 text-amber-950 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-800">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Email Proprietor & Grievance Desk</p>
                  <p className="text-xs font-mono text-amber-900 font-bold">subramanyamghadiyaram@gmail.com</p>
                  <p className="text-[10px] text-amber-800">Direct Compliance Desk</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800 group-hover:translate-x-0.5 transition-transform">→</span>
            </a>

            <a 
              href="https://wa.me/919347359489?text=Namaste%20Grievance%20Officer%2C%20I%20wish%20to%20raise%20an%20inquiry%20regarding%20shubhamastu.in"
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-950 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-200/60 flex items-center justify-center text-emerald-800">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Official Phone / WhatsApp</p>
                  <p className="text-xs font-mono text-emerald-900 font-black">+91 9347359489</p>
                  <p className="text-[10px] text-emerald-800">Direct Compliance Desk</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 group-hover:translate-x-0.5 transition-transform">→</span>
            </a>
          </div>
        </section>

        {/* Response Timelines */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#362B5A] text-white text-sm font-black flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight">
              Statutory Response Timelines
            </h3>
          </div>

          <div className="pl-0 sm:pl-11 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-blue-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Acknowledgment Window</span>
              </div>
              <p className="text-xl font-black text-blue-950">
                Within 24 to 48 hours
              </p>
              <p className="text-xs text-blue-900 leading-relaxed">
                Receipt of every formal ticket or grievance is acknowledged via registered email/WhatsApp with a tracking reference within 24 to 48 hours.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-purple-900">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>Resolution / Disposal Window</span>
              </div>
              <p className="text-xl font-black text-purple-950">
                Within 15 days
              </p>
              <p className="text-xs text-purple-900 leading-relaxed">
                Full investigation, profile audits, remediation, or formal statutory response will be disposed of within 15 days from the date of receipt.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Grievance Filing Form */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white text-sm font-black flex items-center justify-center shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight">
                Submit an Online Grievance or Profile Dispute
              </h3>
              <p className="text-xs text-stone-500">
                Direct dispatch to Proprietor & Grievance Officer Sri G.V. Subramanyam
              </p>
            </div>
          </div>

          <div className="pl-0 sm:pl-11 pt-2">
            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-black text-emerald-950">Grievance Dispatched Successfully</h4>
                <p className="text-xs sm:text-sm text-emerald-900 max-w-md mx-auto leading-relaxed">
                  Your grievance notice has been formatted and initiated. If your email client did not automatically launch, you can also send details directly to <strong>+91 9347359489</strong> on WhatsApp.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={handleWhatsAppGrievance}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send via WhatsApp (+91 9347359489)</span>
                  </button>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Submit Another Ticket
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700">Complaint Category *</label>
                    <select
                      value={complaintType}
                      onChange={(e) => setComplaintType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#362B5A]"
                    >
                      <option value="impersonation">Fake Profile / Impersonation / Misrepresentation</option>
                      <option value="privacy_dpdpa">Data Privacy / Right to Erasure (DPDPA 2023)</option>
                      <option value="harassment">Cyber Harassment / Inappropriate Behavior</option>
                      <option value="financial_dowry">Dowry Demand / Financial Fraud</option>
                      <option value="refund_dispute">Fee / Refund Inquiry (₹100 / ₹900)</option>
                      <option value="other">Other Statutory Grievance</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700">Complainant Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#362B5A]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700">Registered Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#362B5A]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700">Subject Profile ID / Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="Candidate Name or Profile ID in question"
                      value={profileUrlOrId}
                      onChange={(e) => setProfileUrlOrId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#362B5A]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Detailed Description of Grievance *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide detailed facts, dates, messages, or links to help the Grievance Officer conduct an efficient investigation..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#362B5A]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Protected under strict confidentiality protocols.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleWhatsAppGrievance}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp Officer</span>
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#362B5A] hover:bg-[#271f42] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>File Formal Grievance</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Legal Entity & Footer Navigation */}
        <div className="bg-stone-100 rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-4 text-xs sm:text-sm text-stone-700">
          <div className="flex items-center gap-2 text-stone-900 font-bold uppercase tracking-wider text-xs">
            <Building2 className="w-4 h-4 text-[#362B5A]" />
            <span>Platform Ownership & Regulatory Hierarchy</span>
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
              <p className="font-semibold text-stone-900">Grievance Officer:</p>
              <p>Sri G.V. Subramanyam (Proprietor)</p>
            </div>
            <div>
              <p className="font-semibold text-stone-900">Direct Compliance Desk:</p>
              <p>+91 9347359489 • subramanyamghadiyaram@gmail.com</p>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/terms" className="text-[#362B5A] hover:underline font-bold">
                Terms & Conditions →
              </Link>
              <span>•</span>
              <Link to="/refund-policy" className="text-[#362B5A] hover:underline font-bold">
                Cancellation & Refund Policy →
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
