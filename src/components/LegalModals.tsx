import React, { useState } from "react";
import { Shield, ShieldAlert, FileText, Lock, X, Sparkles, RefreshCw, CheckCircle2, XCircle, Clock, CreditCard } from "lucide-react";

interface LegalModalsProps {
  darkTheme?: boolean;
}

export type LegalDocType = "terms" | "privacy" | "grievance" | "refund" | null;

export function LegalFooter({ darkTheme = false }: LegalModalsProps) {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(null);

  const containerClass = darkTheme
    ? "bg-black/90 text-zinc-400 border-t border-amber-500/15 py-8 px-4"
    : "bg-slate-50 text-slate-600 border-t border-gray-200 py-8 px-4";

  return (
    <>
      <footer className={`${containerClass} text-center space-y-4 relative z-20`}>
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center items-center gap-x-5 gap-y-3 text-xs font-bold uppercase tracking-wider">
          <a
            href="/terms"
            className="hover:text-amber-500 transition-colors flex items-center gap-1 cursor-pointer text-amber-600 dark:text-amber-400"
          >
            <FileText className="w-3.5 h-3.5" />
            Terms of Service (/terms)
          </a>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <a
            href="/refund-policy"
            className="hover:text-emerald-500 transition-colors flex items-center gap-1 cursor-pointer text-emerald-600 dark:text-emerald-400"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refund Policy (/refund-policy)
          </a>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <a
            href="/grievance"
            className="hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer text-rose-600 dark:text-rose-400"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Grievance Redressal (/grievance)
          </a>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <button
            onClick={() => setActiveDoc("terms")}
            className="hover:text-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Terms Modal
          </button>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <button
            onClick={() => setActiveDoc("refund")}
            className="hover:text-emerald-500 transition-colors flex items-center gap-1 cursor-pointer text-emerald-700 dark:text-emerald-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refund Modal
          </button>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <button
            onClick={() => setActiveDoc("grievance")}
            className="hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer text-rose-700 dark:text-rose-300"
          >
            <Shield className="w-3.5 h-3.5" />
            Grievance Modal
          </button>
        </div>

        <div className="pt-4 border-t border-zinc-800/20 max-w-lg mx-auto text-[10px] space-y-1">
          <p className="font-semibold uppercase tracking-widest text-[#362B5A] dark:text-amber-300/80">
            SHUBHAMASTU MATRIMONY • A UNIT OF GLARK SOLUTIONS
          </p>
          <p className="text-gray-400 dark:text-zinc-500 font-sans tracking-normal leading-relaxed">
            Owned & operated by Glark Solutions. Registered Intermediary under Section 2(1)(w) and Section 79 of the Information Technology Act, 2000. All profile data is self-reported by candidates or families.
          </p>
        </div>

        {activeDoc && (
          <LegalDocumentModal docType={activeDoc} onClose={() => setActiveDoc(null)} />
        )}
      </footer>
    </>
  );
}

interface ModalProps {
  docType: "terms" | "privacy" | "grievance" | "refund";
  onClose: () => void;
}

export function LegalDocumentModal({ docType, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#362B5A] to-red-900 text-white flex justify-between items-center relative">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-1.5 text-amber-300 font-mono tracking-widest text-[9px] uppercase font-extrabold">
              <FileText className="w-3.5 h-3.5" />
              <span>IT ACT 2021 & STATUTORY COMPLIANCE</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">
              {docType === "grievance" 
                ? "Grievance Redressal (ఫిర్యాదుల నివారణ విభాగం)" 
                : docType === "refund"
                ? "Cancellation & Refund Policy (రద్దు మరియు వాపసు విధానం)"
                : "Terms, Conditions & Privacy Policy (నిబంధనలు మరియు గోప్యతా విధానం)"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 sm:p-8 overflow-y-auto text-left text-xs leading-relaxed space-y-6 text-slate-700 font-sans max-h-[60vh] scrollbar-thin">
          
          {(docType === "terms" || docType === "privacy") && (
            <>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-amber-900 uppercase tracking-wider text-[10px] font-mono">
                    TERMS AND CONDITIONS OF SERVICE • SEPTEMBER 2026
                  </p>
                  <a 
                    href="/terms" 
                    className="text-[11px] font-bold text-amber-900 underline hover:text-amber-700 flex items-center gap-1"
                  >
                    Open Full Page (shubhamastu.in/terms) →
                  </a>
                </div>
                <p className="text-slate-800 font-medium leading-relaxed text-xs">
                  Welcome to <strong>shubhamastu.in</strong> (the "Platform"), owned and operated by <strong>Glark Solutions</strong> ("Proprietorship", "We", "Us", or "Our"). By accessing, registering, or using our services, you ("User", "You", or "Registrant") agree to be bound by these Terms and Conditions. If you do not agree, please do not use this Platform.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#362B5A] text-white text-xs flex items-center justify-center">1</span>
                  <span>Nature of Service & Intermediary Status</span>
                </h4>
                <p>
                  <strong>Shubhamastu.in is an online matrimonial matchmaking facilitator and preliminary introductory service.</strong>
                </p>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  In accordance with <strong>Section 2(1)(w)</strong> and <strong>Section 79 of the Information Technology Act, 2000</strong>, Shubhamastu.in operates strictly as an intermediary. The platform provides a technology medium for users and families to discover matrimonial profiles.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-rose-900 uppercase text-sm border-b border-rose-100 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-700 text-white text-xs flex items-center justify-center">2</span>
                  <span>Absolute Disclaimer of Character, Financial, and Personal Verification</span>
                </h4>
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-2 text-rose-950">
                  <p>
                    <strong>No Background Checks:</strong> Glark Solutions and Shubhamastu.in <strong>DO NOT</strong> perform physical verification, criminal record checks, character assessments, psychological evaluations, matrimonial status audits, or financial/employment background verification of any registered user.
                  </p>
                  <p>
                    <strong>Sole Responsibility of Users/Guardians:</strong> All information displayed is self-reported by users or their family members. Users, prospective brides/grooms, parents, and legal guardians bear the sole and absolute responsibility to conduct thorough, independent, offline background checks, character inquiries, and family investigations prior to solemnizing any alliance or engaging in financial transactions.
                  </p>
                  <p>
                    <strong>No Liability for Misrepresentation:</strong> Under no circumstances shall Glark Solutions, its proprietor, partners, or affiliates be held liable for any deceit, cheating, marital disputes, domestic discord, fraud, bigamy, or physical/emotional harm resulting from interactions initiated via the Platform.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#362B5A] text-white text-xs flex items-center justify-center">3</span>
                  <span>Eligibility Criteria</span>
                </h4>
                <p>By registering or submitting details on Shubhamastu.in, you represent and warrant that:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                  <li>
                    The bride is at least <strong>18 years of age</strong> and the groom is at least <strong>21 years of age</strong> (as mandated under the Prohibition of Child Marriage Act and prevailing Indian marriage laws).
                  </li>
                  <li>
                    You are legally competent to enter into a binding contract under the <strong>Indian Contract Act, 1872</strong>.
                  </li>
                  <li>
                    The registration is made strictly for genuine matrimonial intent and not for casual dating, commercial solicitation, harassment, or unlawful objectives.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#362B5A] text-white text-xs flex items-center justify-center">4</span>
                  <span>Service Fees and Payment Structure</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
                    <p className="font-bold text-amber-900">Registration Fee: ₹100</p>
                    <p className="text-slate-700">
                      Match Exploration / Registration Processing Fee: ₹100 (Inclusive of applicable taxes). Governed by our conditional refund policy outlined in Section 5.
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl space-y-1">
                    <p className="font-bold text-purple-900">Premium Membership: ₹900</p>
                    <p className="text-slate-700">
                      Premium Membership / Service Activation Fee: ₹900 (Inclusive of applicable taxes). <strong>Strictly Non-Refundable</strong>.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Payments are processed via authorized payment aggregators (e.g., Cashfree Payments India Pvt. Ltd. / UPI).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#362B5A] text-white text-xs flex items-center justify-center">5</span>
                  <span>Code of Conduct & Prohibited Activities</span>
                </h4>
                <p>
                  Under <strong>Rule 3(1)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, users shall not host, upload, or transmit any content that:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>Is fraudulent, defamatory, obscene, invasive of another's privacy, or religiously hateful.</li>
                  <li>Solicits dowry, extortion, or unauthorized money transfers.</li>
                  <li>Impersonates any other individual or contains fake photographs.</li>
                </ul>
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs font-semibold">
                  Any violation will result in immediate termination of the account and referral to Indian cyber law enforcement authorities.
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#362B5A] text-white text-xs flex items-center justify-center">6</span>
                  <span>Limitation of Liability</span>
                </h4>
                <p>
                  To the maximum extent permitted by applicable Indian laws, Glark Solutions shall not be liable for any indirect, incidental, punitive, or consequential damages arising out of the use of our services. Our total liability for any claim shall not exceed the amount actually paid by you to us (capped at <strong>₹100</strong> or <strong>₹900</strong> as applicable).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#362B5A] text-white text-xs flex items-center justify-center">7</span>
                  <span>Governing Law and Jurisdiction</span>
                </h4>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal disputes arising out of these terms shall be subject to the <strong>exclusive jurisdiction of the competent courts in Andhra Pradesh, India</strong>.
                </p>
              </div>
            </>
          )}

          {docType === "grievance" && (
            <>
              <div className="bg-[#362B5A]/10 border-l-4 border-[#362B5A] p-4 rounded-r-xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-[#362B5A] uppercase tracking-wider text-[10px] font-mono">
                    STATUTORY GRIEVANCE REDRESSAL MECHANISM
                  </p>
                  <a 
                    href="/grievance" 
                    className="text-[11px] font-bold text-[#362B5A] underline hover:text-amber-800 flex items-center gap-1"
                  >
                    Open Grievance Desk (/grievance) →
                  </a>
                </div>
                <p className="text-slate-800 font-medium leading-relaxed text-xs">
                  In strict accordance with <strong>Rule 3(2) of the Information Technology Rules, 2021</strong>, the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, and the <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#362B5A]" />
                  <span>Designated Grievance Officer</span>
                </h4>
                <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl space-y-2 text-xs font-sans">
                  <p><strong className="text-slate-900">Name:</strong> Sri G.V. Subramanyam (Proprietor)</p>
                  <p><strong className="text-slate-900">Designation:</strong> Proprietor & Grievance Officer</p>
                  <p><strong className="text-slate-900">Entity:</strong> Glark Solutions (G.V. Subramanyam, Proprietor)</p>
                  <p><strong className="text-slate-900">Operating Address:</strong> Andhra Pradesh, India</p>
                  <p><strong className="text-slate-900">Official Email:</strong> <a href="mailto:subramanyamghadiyaram@gmail.com" className="text-amber-800 font-bold underline">subramanyamghadiyaram@gmail.com</a></p>
                  <p><strong className="text-slate-900">Official Phone / WhatsApp:</strong> <a href="https://wa.me/919347359489" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline">+91 9347359489</a></p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#362B5A]" />
                  <span>Statutory Response Timelines</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl space-y-1">
                    <p className="font-bold text-blue-950 uppercase text-[10px]">Acknowledgment</p>
                    <p className="font-extrabold text-blue-900 text-sm">Within 24 to 48 hours</p>
                    <p className="text-blue-800 text-[11px]">Direct confirmation issued to registered email/WhatsApp.</p>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl space-y-1">
                    <p className="font-bold text-purple-950 uppercase text-[10px]">Resolution / Disposal</p>
                    <p className="font-extrabold text-purple-900 text-sm">Within 15 days</p>
                    <p className="text-purple-800 text-[11px]">Formal investigation and grievance disposal from date of receipt.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {docType === "refund" && (
            <>
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-emerald-900 uppercase tracking-wider text-[10px] font-mono">
                    CANCELLATION AND REFUND POLICY • SEPTEMBER 2026
                  </p>
                  <a 
                    href="/refund" 
                    className="text-[11px] font-bold text-emerald-900 underline hover:text-emerald-700 flex items-center gap-1"
                  >
                    Open Full Page (shubhamastu.in/refund) →
                  </a>
                </div>
                <p className="text-slate-800 font-medium leading-relaxed text-xs">
                  At <strong>shubhamastu.in</strong> (operated by <strong>Glark Solutions</strong>), we maintain transparency regarding our pricing, matchmaking assistance, and service tiers.
                </p>
              </div>

              {/* 1. Fee Structure & Refund Eligibility */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#362B5A] text-white text-xs flex items-center justify-center">1</span>
                  <span>Fee Structure & Refund Eligibility</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-stone-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-100 text-stone-800 border-b border-stone-200 font-bold uppercase text-[10px]">
                        <th className="p-2.5">Fee Type</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Refund Status</th>
                        <th className="p-2.5">Conditions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-stone-700">
                      <tr>
                        <td className="p-2.5 font-bold">Match Search / Registration Fee</td>
                        <td className="p-2.5 font-mono font-bold text-[#362B5A]">₹100</td>
                        <td className="p-2.5 text-emerald-800 font-semibold">100% Refundable (Conditional)</td>
                        <td className="p-2.5">Fully refundable if zero suitable prospective matches matching your basic criteria are delivered within 30 days.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">Premium Membership / Service Activation Fee</td>
                        <td className="p-2.5 font-mono font-bold text-[#362B5A]">₹900</td>
                        <td className="p-2.5 text-rose-800 font-semibold">Non-Refundable</td>
                        <td className="p-2.5">Non-refundable once access is granted, profiles are shared, or contact credentials are unlocked.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. ₹100 Conditional Refund Protocol */}
              <div className="space-y-2">
                <h4 className="font-black text-emerald-900 uppercase text-sm border-b border-emerald-100 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-xs flex items-center justify-center">2</span>
                  <span>The ₹100 Conditional Refund Protocol</span>
                </h4>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-2 text-emerald-950">
                  <p>
                    When a user pays the ₹100 exploration fee, our matchmaking team actively checks database records and partner networks to identify suitable proposals matching the user's community, educational, and astrological/location criteria.
                  </p>
                  <p className="font-semibold">
                    If, after <strong>60 business days</strong>, our team is unable to present at least one viable profile meeting the submitted preferences, the user is entitled to a complete <strong>100% refund of ₹100</strong>.
                  </p>
                  <p className="text-[11px] bg-white/70 p-2 rounded-lg border border-emerald-200 text-stone-700">
                    <strong>Courtesy Letter:</strong> Alongside the refund, an official acknowledgment and apology message will be dispatched directly to your registered WhatsApp phone number.
                  </p>
                </div>
              </div>

              {/* 3. ₹900 Non-Refundable Membership Policy */}
              <div className="space-y-2">
                <h4 className="font-black text-rose-900 uppercase text-sm border-b border-rose-100 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-700 text-white text-xs flex items-center justify-center">3</span>
                  <span>The ₹900 Non-Refundable Membership Policy</span>
                </h4>
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-1.5 text-rose-950">
                  <p>
                    The ₹900 tier covers manual profile indexing, platform server resources, customer support, and direct exchange of contact information between consenting parties.
                  </p>
                  <p className="font-semibold">
                    Once this tier is paid and activated, no refunds or chargebacks will be issued under any circumstances, regardless of whether marriage is finalized, proposals are declined by the opposite party, or the user changes their mind.
                  </p>
                </div>
              </div>

              {/* 4. Refund Processing Timeline */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#362B5A] text-white text-xs flex items-center justify-center">4</span>
                  <span>Refund Processing Timeline</span>
                </h4>
                <p>
                  Approved refunds for the ₹100 search fee are processed within <strong>5 to 7 business days</strong>.
                </p>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                  Refunds are credited directly back to the original payment source (UPI account, debit card, or net banking) via our payment gateway partner (Cashfree Payments).
                </p>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#362B5A] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#282043] transition-colors cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
}
