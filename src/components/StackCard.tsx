import React from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { Profile } from "../types";
import { calculateMatchScore } from "../lib/matchEngine";
import { Compass, X, Heart, Briefcase, MapPin } from "lucide-react";
import { getGenderLabel } from "../lib/genderHelper";
import { NAKSHATRAS } from "../lib/panchangam";

interface StackCardProps {
  match: Profile;
  currentProfile: Profile;
  isFront: boolean;
  handleSwipe: (match: Profile, direction: "left" | "right") => void;
  calculateAge: (dob: string) => number;
}

export function StackCard({ match, currentProfile, isFront, handleSwipe, calculateAge }: StackCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const scoreDetails = calculateMatchScore(currentProfile, match);
  const matchScore = scoreDetails.totalScore;
  const age = calculateAge(match.dob);

  const getNakshatraTelugu = (engName: string): string => {
    if (!engName) return "";
    const found = NAKSHATRAS.find(n => n.english.toLowerCase() === engName.toLowerCase());
    return found ? found.telugu : engName;
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, info) => {
        if (info.offset.x > 100) {
          handleSwipe(match, "right");
        } else if (info.offset.x < -100) {
          handleSwipe(match, "left");
        }
      }}
      animate={{ 
        scale: isFront ? 1 : 0.95, 
        y: isFront ? 0 : 20, 
        zIndex: isFront ? 10 : 0 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="absolute top-0 left-0 right-0 mx-auto w-full max-w-sm h-[560px] bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col"
    >
      <div className="h-3/5 w-full relative bg-gray-100">
        <img
          src={match.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=400"}
          alt={match.name}
          className="w-full h-full object-cover pointer-events-none select-none"
        />
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm shadow-md px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-orange-500/10">
          <Compass className="w-3.5 h-3.5 text-[#C2242C] animate-spin" />
          <span className="text-xs font-extrabold text-[#362B5A] font-mono">{matchScore}% Match</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
           <h3 className="text-2xl font-extrabold leading-tight">{match.name}, {age}</h3>
           <p className="text-sm font-semibold text-gray-200">{match.profession}</p>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between bg-white pointer-events-none">
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono text-gray-600">
              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-bold">{match.sub_caste}</span>
              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-md font-bold">{match.height_feet} Ft</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 font-semibold pt-2">
                <div className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>₹ {match.salary_lpa} LPA</span>
                </div>
                <div className="flex items-center gap-1 justify-end text-right">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{match.birth_location || "Varanasi"}</span>
                </div>
            </div>

            {match.astrology && (
                <div className="bg-[#EBF6FF] p-2 mt-2 rounded-xl border border-blue-100 flex items-center justify-between text-[10px]">
                <div>
                    <span className="text-gray-400 font-bold uppercase tracking-wider block">నక్షత్రం</span>
                    <span className="font-bold text-[#362B5A]">{getNakshatraTelugu(match.astrology.nakshatra)}</span>
                </div>
                </div>
            )}
        </div>
      </div>
      
      {isFront && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 pointer-events-auto">
            <button 
                onClick={(e) => { e.stopPropagation(); handleSwipe(match, "left"); }}
                className="w-14 h-14 rounded-full bg-white border-2 border-red-100 flex items-center justify-center text-red-500 shadow-xl hover:bg-red-50 transition-colors cursor-pointer"
            >
                <X className="w-6 h-6" />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); handleSwipe(match, "right"); }}
                className="w-14 h-14 rounded-full bg-white border-2 border-green-100 flex items-center justify-center text-emerald-500 shadow-xl hover:bg-emerald-50 transition-colors cursor-pointer"
            >
                <Heart className="w-6 h-6" />
            </button>
        </div>
      )}
    </motion.div>
  );
}
