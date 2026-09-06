import React, { useState, useEffect } from "react";
import { Sliders, Heart, ShieldCheck, Info, User } from "lucide-react";
import { PartnerPreferences } from "../types";
import { databaseService } from "../lib/databaseService";

interface PartnerPreferencesFormProps {
  userId: string;
  onSavePreferences: (pref: PartnerPreferences) => Promise<void>;
}

export default function PartnerPreferencesForm({ userId, onSavePreferences }: PartnerPreferencesFormProps) {
  const [ageGap, setAgeGap] = useState(5);
  const [heightRange, setHeightRange] = useState("5.2 - 5.8");
  const [subCaste, setSubCaste] = useState("Any");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadPrefs() {
      const existing = await databaseService.getPartnerPreferences(userId);
      if (existing) {
        setAgeGap(existing.age_gap);
        setHeightRange(existing.height_range);
        setSubCaste(existing.preferred_sub_caste);
      }
    }
    loadPrefs();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const pref: PartnerPreferences = {
        user_id: userId,
        age_gap: ageGap,
        height_range: heightRange,
        preferred_sub_caste: subCaste,
      };

      await onSavePreferences(pref);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error("Failed to save partner preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-[#362B5A] to-[#2d244a] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-orange-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-5">
          <Heart className="w-48 h-48 text-red-500 fill-red-500" />
        </div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl font-bold">Partner Preferences</h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Specify the qualities and ranges you seek in your prospective life partner. Our system uses these preferences along with Vedic lunar alignments to identify souls whose karmic profiles resonate harmoniously with yours.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#362B5A]/5 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-[#362B5A]">
          <Sliders className="w-5 h-5 text-[#C2242C]" />
          <h3 className="font-bold text-lg">Define Search Criteria</h3>
        </div>

        <div className="space-y-5">
          {/* Preferred Sub-Caste */}
          <div>
            <label className="block text-xs font-bold text-[#362B5A] uppercase tracking-wider mb-2">Preferred Sub-Caste (కోరుకునే ఉపకులం)</label>
            <select
              value={subCaste}
              onChange={(e) => setSubCaste(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 font-medium"
            >
              <option value="My Sub-caste">My Sub-caste (నాలాంటి ఉపకులం)</option>
              <option value="Any">Any Sub-caste (ఏ ఉపకులమైనా పర్వాలేదు)</option>
            </select>
            <div className="mt-3 flex items-start gap-2 text-xs text-indigo-800 bg-[#EBF6FF] p-3.5 rounded-xl border border-indigo-100">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-[#362B5A]" />
              <p className="leading-relaxed">
                Selecting "My Sub-caste" will only show candidates belonging to your exact Brahmin sub-caste, while "Any Sub-caste" welcomes divine alignments from all Brahmin sub-castes.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl bg-[#C2242C] text-white font-bold text-sm tracking-wider uppercase hover:bg-opacity-95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer text-center flex items-center justify-center gap-2"
          >
            {loading ? "Aligning preferences..." : "Save Preferences"}
          </button>

          {saved && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-100 text-center flex items-center justify-center gap-2 animate-pulse">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Preferences saved. Matches have been adjusted to your soul criteria!</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
