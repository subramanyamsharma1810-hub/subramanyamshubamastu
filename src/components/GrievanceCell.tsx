import React, { useState, useEffect } from "react";
import { Profile, Grievance } from "../types";
import { databaseService } from "../lib/databaseService";
import { AlertCircle, ShieldAlert, Mail, Phone, CheckCircle2, Clock, Shield, Calendar, Send, Info } from "lucide-react";

interface GrievanceCellProps {
  currentProfile: Profile;
}

export default function GrievanceCell({ currentProfile }: GrievanceCellProps) {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewComplaintForm, setShowNewComplaintForm] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState<Grievance["category"]>("Harassment/Unwanted Calls");
  const [accusedId, setAccusedId] = useState("");
  const [accusedName, setAccusedName] = useState("");
  const [accusedPhone, setAccusedPhone] = useState("");
  const [description, setDescription] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadGrievances() {
      setLoading(true);
      try {
        const allGrievances = await databaseService.getGrievances();
        // Filter grievances filed by this user
        const userGrievances = allGrievances.filter(g => g.reporterId === currentProfile.id);
        setGrievances(userGrievances);
      } catch (err) {
        console.error("Failed to load user grievances:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGrievances();
  }, [currentProfile.id, submitSuccess]);

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Please provide details of your complaint.");
      return;
    }
    if (!acceptTerms) {
      alert("Please acknowledge the mandatory terms: 'I understand that any misbehavior on this platform will result in immediate suspension, and I am ready to face police consequences and legal trials if necessary.'");
      return;
    }

    setSubmitting(true);
    try {
      const ticketId = `G-${Math.floor(10000 + Math.random() * 90000)}`;
      const newGrievance: Grievance = {
        id: ticketId,
        reporterId: currentProfile.id,
        reporterName: currentProfile.name,
        reporterPhone: currentProfile.contact_number,
        accusedId: accusedId.trim() || "N/A",
        accusedName: accusedName.trim() || "Unknown",
        accusedPhone: accusedPhone.trim() || "N/A",
        category,
        description: description.trim(),
        reportedAt: new Date().toISOString(),
        status: "Pending"
      };

      await databaseService.saveGrievance(newGrievance);
      setSubmitSuccess(ticketId);
      
      // Clear form
      setAccusedId("");
      setAccusedName("");
      setAccusedPhone("");
      setDescription("");
      setShowNewComplaintForm(false);
    } catch (err) {
      console.error("Failed to submit grievance:", err);
      alert("Failed to submit complaint. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Banner / Legal Header */}
      <div className="bg-gradient-to-r from-red-900 to-[#362B5A] p-6 sm:p-8 rounded-3xl text-white border border-[#362B5A]/10 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-x-12 -translate-y-12 pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-1.5 bg-amber-400 text-slate-900 w-fit px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>IT Act 2021 Compliant Grievance Cell</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Grievance Redressal (ఫిర్యాదుల నివారణ విభాగం)</h2>
          <p className="text-gray-200 text-xs sm:text-sm leading-relaxed max-w-2xl font-medium">
            In compliance with the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, Bramhana Vivaha Vedika provides a structured mechanism to address safety concerns, harassment, phone number abuse, or misinformation. Your dignity and safety are our utmost priorities.
          </p>
        </div>
      </div>

      {/* Grid of details & complaint form launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Designated Grievance Officers Card - IT ACT MANDATED */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-5">
          <h3 className="font-extrabold text-[#362B5A] text-sm uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#C2242C]" />
            Grievance Redressal Officer
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Designated Officer</p>
              <p className="text-sm font-extrabold text-[#362B5A]">Sri G.V. Subramanyam</p>
              <p className="text-xs text-gray-500 font-semibold">Chief Matchmaker & Safety Registrar</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Co-Registrar & Appeals</p>
              <p className="text-sm font-extrabold text-[#362B5A]">Sri P.V. Subba Reddy</p>
              <p className="text-xs text-gray-500 font-semibold">Executive Redressal Officer</p>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-600 font-semibold">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span>subramanyamghadiyaram@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 font-semibold">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span>+91 9347359489</span>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-[11px] leading-relaxed text-amber-900 font-medium">
              <p className="font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                Safety Timelines (IT Act Rules):
              </p>
              Under IT Rules 2021, all complaints are acknowledged within <strong>24 hours</strong> with a unique ticket reference. Investigation and final resolution are mandated to be completed within <strong>15 days</strong> of receipt.
            </div>
          </div>
        </div>

        {/* Central Workspace: Filed Cases & File New Complaint Form */}
        <div className="lg:col-span-8 space-y-6">
          {submitSuccess && (
            <div className="p-5 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-3xl space-y-2 animate-bounce">
              <div className="flex items-center gap-2 text-sm font-black text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-pulse" />
                <span>Grievance Registered Successfully under IT Act 2021!</span>
              </div>
              <p className="text-xs leading-relaxed">
                Your ticket ID is <strong className="font-mono text-[#C2242C]">{submitSuccess}</strong>. Under IT Act Rules, our Grievance Officer Sri G.V. Subramanyam will review your complaint, investigate the candidate's phone records, and take immediate action (Warnings, Account Suspension, or Profile Block) within 24 hours.
              </p>
              <button
                onClick={() => setSubmitSuccess(null)}
                className="text-[10px] font-bold text-[#C2242C] uppercase hover:underline block"
              >
                Dismiss message
              </button>
            </div>
          )}

          {/* Header row to trigger complaint creation */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 className="text-lg font-extrabold text-[#362B5A]">Your Registered Complaints</h4>
            <button
              onClick={() => setShowNewComplaintForm(!showNewComplaintForm)}
              className="py-2 px-4 bg-[#C2242C] hover:bg-opacity-95 text-white text-xs font-bold rounded-xl uppercase tracking-wider shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>{showNewComplaintForm ? "Cancel Form" : "File New Complaint"}</span>
            </button>
          </div>

          {showNewComplaintForm && (
            <form onSubmit={handleSubmitGrievance} className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="border-b border-gray-100 pb-2">
                <h5 className="font-extrabold text-sm text-[#362B5A] uppercase tracking-wider flex items-center gap-1.5 text-red-700">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Grievance Submission Form (ఫిర్యాదు దరఖాస్తు)
                </h5>
                <p className="text-[10px] text-gray-400 font-medium">Please provide accurate information. Under the IT Act, filing false complaints with malicious intent is subject to account deletion and penalty.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-gray-600 uppercase tracking-wider">Complaint Category * (ఫిర్యాదు రకం)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Grievance["category"])}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-3 text-xs focus:outline-none font-semibold text-gray-700 cursor-pointer"
                  >
                    <option value="Harassment/Unwanted Calls">Harassment / Abusive Phone Calls (ఉపద్రవం / అవాంఛిత ఫోన్ కాల్స్)</option>
                    <option value="Fake Profile">Fake Profile / Identity Spoofing (నకిలీ ప్రొఫైల్)</option>
                    <option value="Incorrect Information">Inaccurate / Wrong Astro Details (తప్పుడు జాతక వివరాలు)</option>
                    <option value="Misuse of Contact Details">Misuse of Contact Number (నంబర్ దుర్వినియోగం)</option>
                    <option value="Other">Other Violations (ఇతర కారణాలు)</option>
                  </select>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-gray-600 uppercase tracking-wider">Accused Candidate Registration ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BVM-1004"
                    value={accusedId}
                    onChange={(e) => setAccusedId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-4 text-xs focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-gray-600 uppercase tracking-wider">Accused Candidate Name * (ఆరోపిత వ్యక్తి పేరు)</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Candidate name"
                    value={accusedName}
                    onChange={(e) => setAccusedName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-4 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-gray-600 uppercase tracking-wider">Accused Contact Mobile Number * (ఆరోపిత వ్యక్తి ఫోన్ నెంబర్)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9848022338"
                    value={accusedPhone}
                    onChange={(e) => setAccusedPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-4 text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-gray-600 uppercase tracking-wider">Detailed Description of Incident / Harassment * (వివరణాత్మక ఫిర్యాదు)</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Specify exactly what happened (e.g., 'This candidate is calling me repeatedly despite saying we are not interested', 'Using abusive language', 'Calling late at night with wrong intentions', etc.)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-4 text-xs focus:outline-none leading-relaxed"
                />
              </div>

              {/* Mandatory Checkbox Acknowledgement */}
              <div className="flex items-start gap-2.5 bg-red-50/70 p-3.5 rounded-xl border border-red-200">
                <input
                  id="grievance-accept-terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 rounded border-red-300 text-[#C2242C] focus:ring-[#C2242C] accent-[#C2242C] cursor-pointer"
                />
                <label htmlFor="grievance-accept-terms" className="text-[11px] text-red-950 font-semibold leading-relaxed cursor-pointer select-none">
                  I understand that any misbehavior on this platform will result in immediate suspension, and I am ready to face police consequences and legal trials if necessary.
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#C2242C] hover:bg-opacity-95 disabled:bg-gray-300 text-white font-extrabold text-xs uppercase tracking-wider transition-all rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Send className="w-4 h-4 text-red-200" />
                  )}
                  <span>Submit Formal Complaint under IT Act Rules</span>
                </button>
              </div>
            </form>
          )}

          {/* Grievances list rendering */}
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <svg className="animate-spin h-6 w-6 text-[#C2242C] mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs text-gray-500 font-mono">Retrieving official case logs...</p>
            </div>
          ) : grievances.length === 0 ? (
            <div className="py-12 px-6 bg-white rounded-3xl border border-gray-100 text-center space-y-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-full w-fit mx-auto border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h5 className="font-extrabold text-[#362B5A]">No Complaints Registered</h5>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Your profile is in perfect standing. You have not filed any safety reports or harassment cases. We continuously monitor matching calls to protect our community members.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {grievances.map((g) => {
                const isPending = g.status === "Pending";
                const isInvestigating = g.status === "Under Investigation";
                const isResolved = g.status === "Resolved";

                return (
                  <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-700 font-mono tracking-wider">{g.id}</span>
                        <span className="text-gray-300">•</span>
                        <span className="bg-slate-200/80 text-slate-800 font-bold px-2 py-0.5 rounded font-sans text-[10px]">
                          {g.category}
                        </span>
                      </div>
                      
                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] font-mono border uppercase tracking-wider ${
                        isPending
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : isInvestigating
                          ? "bg-sky-50 border-sky-200 text-sky-700 animate-pulse"
                          : isResolved
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-gray-100 border-gray-200 text-gray-600"
                      }`}>
                        {isPending && <Clock className="w-3 h-3" />}
                        {isInvestigating && <Clock className="w-3 h-3" />}
                        {isResolved && <CheckCircle2 className="w-3 h-3" />}
                        <span>{g.status}</span>
                      </span>
                    </div>

                    {/* Content Body */}
                    <div className="p-5 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-gray-600">
                        <p><strong>Accused Profile ID:</strong> <span className="font-mono">{g.accusedId}</span></p>
                        <p><strong>Accused Candidate:</strong> {g.accusedName}</p>
                        <p className="sm:col-span-2"><strong>Accused Contact Number:</strong> <span className="font-mono font-bold text-gray-900">{g.accusedPhone}</span></p>
                      </div>

                      <div className="space-y-1 text-gray-700 font-medium">
                        <p className="font-bold text-gray-500 uppercase tracking-wider text-[9px]">Grievance Details:</p>
                        <p className="leading-relaxed bg-white p-3 rounded-xl border border-gray-100 italic">
                          "{g.description}"
                        </p>
                      </div>

                      {/* Resolution Notes */}
                      {(g.resolutionNotes || g.resolvedBy) && (
                        <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-slate-700 space-y-1">
                          <p className="font-black text-indigo-800 uppercase tracking-wider text-[9px] flex items-center gap-1">
                            <Shield className="w-3 h-3 text-indigo-700" />
                            Grievance Officer Investigation Verdict:
                          </p>
                          <p className="leading-relaxed font-semibold">{g.resolutionNotes || "No verdict notes provided."}</p>
                          <div className="flex justify-between text-[10px] text-indigo-600/70 pt-1 font-mono">
                            <span>Handled by: {g.resolvedBy || "Redressal Cell"}</span>
                            {g.resolvedAt && <span>Resolved On: {new Date(g.resolvedAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      )}

                      {/* Timeline footer */}
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono pt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Filed on: {new Date(g.reportedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
