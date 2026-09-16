import React, { useState, useEffect } from "react";
import { X, Sparkles, Phone, MessageSquare, CheckCircle, ShieldCheck } from "lucide-react";
import { Pandit } from "../types";
import { databaseService } from "../lib/databaseService";

interface PandithConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PandithConsultationModal({ isOpen, onClose }: PandithConsultationModalProps) {
  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      databaseService.getPandits()
        .then((data) => setPandits(data || []))
        .catch(() => setPandits([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#362B5A] border-2 border-amber-400/50 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative text-left text-white space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-[#C2242C] text-white rounded-full transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 border-b border-white/15 pb-4">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-mono font-bold tracking-widest uppercase">
            <Sparkles className="w-4 h-4" /> Vedic Astrology & Guna Milanam • పండితులు మరియు జ్యోతిష్యులు
          </div>
          <h2 className="text-2xl font-black uppercase text-amber-300">Our Sacred Vedic Pandits & Priests</h2>
          <p className="text-xs text-blue-100/80">
            Connect directly with our esteemed Vedic priests and astrologers for horoscope matching (జాతక పరిశీలన), muhurtam fixation, and spiritual guidance.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-amber-300 font-mono text-sm">
            Loading sacred pandits directory...
          </div>
        ) : pandits.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">
            No pandits registered yet. Admins can add pandits from the Admin Sanctuary.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pandits.map((p) => (
              <div key={p.id} className="bg-black/40 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-amber-400 shrink-0 shadow-md"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {p.specialization || "Vedic Astrologer"}
                      </span>
                      <h4 className="text-sm font-extrabold text-white leading-snug">{p.name}</h4>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 italic leading-relaxed">
                    "{p.message}"
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-300">
                    <span>📞 {p.phone || "+91 9347359489"}</span>
                    <span className="text-[10px] text-zinc-400">{p.availableDays || "Mon - Sat"}</span>
                  </div>

                  <a
                    href={`https://wa.me/${(p.phone || "+919347359489").replace(/\D/g, "")}?text=${encodeURIComponent(`Namaste Guruji, I am reaching out from Shubhamastu Matrimony for astrological consultation and match guidance.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Consult via WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-white/10 flex justify-between items-center">
          <p className="text-[10px] text-blue-200/60 font-mono">
            🔒 Verified Vedic Consultation Service • Shubhamastu Matrimony
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

