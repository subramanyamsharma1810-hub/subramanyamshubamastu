import React, { useState } from "react";
import { X, Sparkles, Phone, MessageSquare, CheckCircle, ShieldCheck } from "lucide-react";

interface PandithConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PandithConsultationModal({ isOpen, onClose }: PandithConsultationModalProps) {
  const [userName, setUserName] = useState("");
  const [userMobile, setUserMobile] = useState("");
  const [userRasiNakshatra, setUserRasiNakshatra] = useState("");
  const [partnerDetails, setPartnerDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Namaste Vedic Pandith ji, I want expert Jataka/Horoscope matching consultation.\nMy Name: ${userName || "Candidate"}\nMobile: ${userMobile}\nDetails: ${userRasiNakshatra}\nPartner: ${partnerDetails}\nNotes: ${notes}`);
    window.open(`https://wa.me/919347359489?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#362B5A] border-2 border-amber-400/50 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative text-left text-white space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-[#C2242C] text-white rounded-full transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 border-b border-white/15 pb-4">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-mono font-bold tracking-widest uppercase">
            <Sparkles className="w-4 h-4" /> Vedic Astrology & Guna Milanam
          </div>
          <h2 className="text-2xl font-black uppercase text-amber-300">Consult Expert Vedic Pandith</h2>
          <p className="text-xs text-blue-100/80">
            Get accurate horoscope matching (జాతక పరిశీలన), Nadi dosham, Gana milanam, and auspicious Muhurtam guidance directly from our esteemed Vedic scholars.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-300">Consultation Request Received!</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Om Namah Shivaya! Your horoscope and Jataka review request has been successfully queued for our Chief Vedic Scholar. Our Pandith will contact you shortly on <span className="font-mono font-bold text-amber-300">{userMobile || "your mobile"}</span>.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <MessageSquare className="w-4 h-4" /> Chat with Pandith on WhatsApp
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wide">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sreekanth Sharma"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wide">Mobile Number (WhatsApp)</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9347359489"
                  value={userMobile}
                  onChange={(e) => setUserMobile(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wide">Your Birth Details (Rasi, Nakshatram, Time & Place)</label>
              <input
                type="text"
                required
                placeholder="e.g. Mesha Rasi, Aswini Nakshatram, 10:30 AM, Hyderabad"
                value={userRasiNakshatra}
                onChange={(e) => setUserRasiNakshatra(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wide">Match / Partner Birth Details (If Known)</label>
              <input
                type="text"
                placeholder="e.g. Vrishabha Rasi, Rohini Nakshatram"
                value={partnerDetails}
                onChange={(e) => setPartnerDetails(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wide">Specific Inquiry / Dosha Notes</label>
              <textarea
                rows={2}
                placeholder="Mention any specific concerns like Nadi dosham, Manglik/Kuja dosham, or marriage timing."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg uppercase tracking-wider"
              >
                <Sparkles className="w-4 h-4" /> Submit for Jataka Review
              </button>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp Pandith
              </button>
            </div>

            <p className="text-[10px] text-center text-blue-200/60 font-mono">
              🔒 Confidential Vedic Astrology Service • Managed under traditional Brahmin heritage guidelines.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
