import React, { useState } from "react";
import { Shield, ShieldAlert, FileText, Lock, X, Sparkles } from "lucide-react";

interface LegalModalsProps {
  darkTheme?: boolean;
}

export type LegalDocType = "terms" | "privacy" | "grievance" | null;

export function LegalFooter({ darkTheme = false }: LegalModalsProps) {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(null);

  const containerClass = darkTheme
    ? "bg-black/90 text-zinc-400 border-t border-amber-500/15 py-8 px-4"
    : "bg-slate-50 text-slate-600 border-t border-gray-200 py-8 px-4";

  return (
    <>
      <footer className={`${containerClass} text-center space-y-4 relative z-20`}>
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveDoc("terms")}
            className="hover:text-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Terms & Conditions & Privacy Policy
          </button>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <button
            onClick={() => setActiveDoc("grievance")}
            className="hover:text-amber-500 transition-colors flex items-center gap-1 cursor-pointer text-[#C2242C] dark:text-[#E85C63]"
          >
            <Shield className="w-3.5 h-3.5" />
            Grievance Redressal (IT Rules 2021)
          </button>
        </div>

        <div className="pt-4 border-t border-zinc-800/20 max-w-lg mx-auto text-[10px] space-y-1">
          <p className="font-semibold uppercase tracking-widest text-[#362B5A] dark:text-amber-300/80">
            BRAMHANA VIVAHA VEDIKA © 2026 • A PRODUCT OF GLARK SOLUTIONS
          </p>
          <p className="text-gray-400 dark:text-zinc-500 font-sans tracking-normal leading-relaxed">
            A Product of Glark Solutions. Registered Intermediary platform under Section 2(1)(w) of the Indian IT Act 2000. Astrological profiles and spiritual indexes are subject to self-provided credential verification.
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
  docType: "terms" | "privacy" | "grievance";
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
              {docType === "grievance" ? "Grievance Redressal (ఫిర్యాదుల నివారణ విభాగం)" : "Terms, Conditions & Privacy Policy (నిబంధనలు మరియు గోప్యతా విధానం)"}
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
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl space-y-1">
                <p className="font-extrabold text-amber-800 uppercase tracking-wider text-[10px] font-mono">Supreme Legal & Non-Liability Notice</p>
                <p className="text-slate-700 font-medium leading-relaxed">
                  In any circumstance, event, dispute, financial loss, or matrimonial mismatch whatsoever, Bramhana Vivaha Vedika, its founders, and administrators are <strong>strictly not responsible and held harmless</strong>. All users agree to absolute self-responsibility and mandatory pre-marital independent inquiries.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5">1. Acceptance of Terms & Privacy Governance</h4>
                <p>
                  By accessing, browsing, registering, or subscribing on <strong>Bramhana Vivaha Vedika</strong>, you irrevocably agree to be bound by these unified Terms, Conditions, and Privacy Policy. If you disagree with any clause, you must immediately close the portal.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5">2. Intermediary Status & IT Act Compliance</h4>
                <p>
                  We operate strictly as an <strong>"Intermediary"</strong> under Section 2(1)(w) of the Information Technology Act, 2000. Our platform facilitates pure Brahmin community profile matchmaking without endorsement or guarantee of user declarations.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5">3. Subscription Terms: ₹900 for 28 Days Full Access</h4>
                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl space-y-1.5">
                  <p className="font-bold text-blue-900 text-xs">
                    💳 Premium Subscription Model (₹900 / 28 Days):
                  </p>
                  <p className="text-slate-700 text-xs">
                    Full unlocking of contact numbers, WhatsApp connections, and sacred matching details is provided under our nominal <strong>₹900 premium plan valid strictly for 28 days</strong> from payment activation. Subscriptions do not auto-renew and require manual renewal. Fees are non-refundable once contact details or full profiles have been accessed.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5">4. Anti-Dowry Pledge (వరకట్న నిషేధ ప్రమాణం - Dowry Prohibition Act 1961)</h4>
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-1.5">
                  <p className="font-bold text-amber-900 text-xs">
                    In strict compliance with the <strong>Dowry Prohibition Act, 1961</strong>, Bramhana Vivaha Vedika explicitly bans the demand, giving, or taking of dowry in any format.
                  </p>
                  <p className="text-slate-700 text-xs">
                    Registering and using this sacred portal constitutes a formal legal and traditional oath that you and your family denounce, reject, and will not support or participate in any dowry practices or commercial matrimonial negotiations.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5">5. Mandatory Pre-Marital Independent Due Diligence (వివాహానికి ముందే విచారణ)</h4>
                <div className="bg-[#FAF9F5] border border-amber-500/20 p-3.5 rounded-xl space-y-1.5">
                  <p className="font-bold text-amber-950 text-xs">
                    ⚠️ CRITICAL SAFETY & DUE DILIGENCE MANDATE:
                  </p>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    While platform administrators verify submitted ID proofs and educational degrees for initial listings, we <strong>cannot</strong> certify a candidate’s physical health, personal character, mental stability, work environment, or family reputation. 
                  </p>
                  <p className="text-slate-700 text-xs leading-relaxed font-semibold">
                    The registered candidate’s family holds the absolute and sole legal responsibility to perform complete, independent physical background checks (including address visits, workplace inquiries, and neighborhood reviews) BEFORE finalizing any matrimonial engagement or exchange.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5">6. Absolute Non-Liability & Indemnity in Any Case</h4>
                <p className="font-semibold text-slate-900">
                  IN ANY CASE, EVENT, DISPUTE, FRAUD, OR GRIEVANCE WHATSOEVER:
                </p>
                <p>
                  Bramhana Vivaha Vedika, its owners, developers, coordinators, and employees shall <strong>NOT be held liable, sued, or held financially accountable</strong> for any direct, indirect, incidental, or consequential damages, mental harassment, emotional distress, financial fraud, dowry disputes, or physical safety issues arising from communication, matching, or marriage unions initiated via this portal. You agree to indemnify and hold our team harmless from any claims or legal proceedings in any court.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5">7. Privacy Policy & Secure Encrypted Storage</h4>
                <p>
                  We respect the sanctity of your personal data. We do not sell or monetize candidate information. All uploaded identity certificates (Aadhaar, PAN, educational transcripts) are kept in encrypted offline storage strictly for authentication and never exposed in public directories or search engine crawls.
                </p>
                <ul className="list-disc pl-5 space-y-1 pt-1">
                  <li><strong>Data Collected:</strong> Name, sub-caste, gotram, contact number, astrological details, educational & income records.</li>
                  <li><strong>Visibility:</strong> Phone numbers are strictly protected and only shared with authenticated matching members.</li>
                  <li><strong>Right to Erasure:</strong> You can request total deletion of your profile and records from Firestore by contacting administrators.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5">8. Grievance Redressal (IT Rules 2021)</h4>
                <p>
                  In compliance with Rule 3(11) of the IT Rules 2021, a designated Grievance Redressal Officer has been appointed. Any registered user who encounters cyber-harassment, impersonation, or fake details can file a formal complaint.
                </p>
                <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl space-y-1 font-sans">
                  <p className="font-extrabold text-slate-900">Designated Grievance Officer: Sri G.V. Subramanyam</p>
                  <p><strong>Chief Registrar Phone:</strong> +91 94942 34567</p>
                  <p><strong>Email Contacts:</strong> subramanyamghadiyaram@gmail.com</p>
                  <p className="text-[10px] text-gray-500 italic mt-1">We acknowledge formal tickets within 24 hours and resolve investigations within 15 days.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5">9. User Conduct, Police Consequences & Legal Trials</h4>
                <p>
                  Users must behave respectfully in line with traditional values. Uploading fake photographs, impersonating public figures, abusive chat, or seeking commercial commissions is strictly prohibited. 
                </p>
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl font-bold text-red-900 text-xs">
                  "If I do misbehave, harass anyone, or provide fraudulent credentials on Bramhana Vivaha Vedika, I am fully aware and ready to face police consequences, criminal investigation, and legal trials under Indian Law."
                </div>
              </div>
            </>
          )}

          {docType === "grievance" && (
            <>
              <div className="bg-[#C2242C]/10 border-l-4 border-[#C2242C] p-4 rounded-r-xl space-y-1">
                <p className="font-extrabold text-[#C2242C] uppercase tracking-wider text-[10px] font-mono">Grievance Redressal Mechanism</p>
                <p className="text-slate-700 font-medium leading-relaxed">
                  In compliance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5">Grievance Officer Contact Details</h4>
                <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl space-y-2 font-sans">
                  <p className="font-extrabold text-slate-900 text-sm">Sri G.V. Subramanyam (Chief Registrar)</p>
                  <p><strong>Organization:</strong> Bramhana Vivaha Vedika</p>
                  <p><strong>Phone:</strong> +91 94942 34567</p>
                  <p><strong>Email:</strong> subramanyamghadiyaram@gmail.com</p>
                  <p><strong>Working Hours:</strong> Monday to Saturday (10:00 AM – 6:00 PM IST)</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase text-sm border-b border-gray-100 pb-1.5">Filing Procedure & Timelines</h4>
                <p>
                  Any user or aggrieved person may submit a complaint regarding violation of terms, fake profiles, harassment, or privacy concerns via email or phone. 
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Acknowledgement:</strong> Within 24 hours of receiving the complaint.</li>
                  <li><strong>Resolution:</strong> Within 15 days from the date of receipt of the complaint.</li>
                </ul>
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
