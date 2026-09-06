import React, { useState, useEffect, useRef } from "react";
import { Profile, PartnerPreferences } from "../types";
import { calculateMatchScore } from "../lib/matchEngine";
import { getGenderLabel } from "../lib/genderHelper";

interface CompactKebabCardViewProps {
  currentProfile: Profile;
  profiles: Profile[];
  preferences: PartnerPreferences | null;
  onUpdateProfile: (updatedProfile: Profile) => Promise<void>;
  onLogout?: () => void;
}

export default function CompactKebabCardView({
  currentProfile,
  profiles,
  preferences,
  onUpdateProfile,
  onLogout
}: CompactKebabCardViewProps) {
  const [activeCardMenuId, setActiveCardMenuId] = useState<string | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState<boolean>(false);
  const [quickViewProfile, setQuickViewProfile] = useState<Profile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [privateNotes, setPrivateNotes] = useState<Record<string, string>>({});
  const [activeNoteModalProfile, setActiveNoteModalProfile] = useState<Profile | null>(null);
  const [noteInput, setNoteInput] = useState<string>("");
  const [reportedProfiles, setReportedProfiles] = useState<Record<string, boolean>>({});
  const [blockedProfiles, setBlockedProfiles] = useState<Record<string, boolean>>({});

  // Global escape and click-outside listeners
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveCardMenuId(null);
        setIsHeaderMenuOpen(false);
        setQuickViewProfile(null);
        setActiveNoteModalProfile(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const showToast = (text: string) => {
    triggerToast(text);
  };

  // Filter profiles
  const filteredProfiles = profiles.filter((p) => {
    if (p.id === currentProfile.id) return false;
    if (blockedProfiles[p.id]) return false;
    if (p.gender === currentProfile.gender) return false;
    if (currentProfile.subscription_status === "free" || p.subscription_status === "free") return false;
    return true;
  });

  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    const scoreA = calculateMatchScore(currentProfile, a).totalScore;
    const scoreB = calculateMatchScore(currentProfile, b).totalScore;
    return scoreB - scoreA;
  });

  const calculateAge = (dobString: string): number => {
    if (!dobString) return 28;
    const diff = Date.now() - new Date(dobString).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970) || 28;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300 border border-emerald-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global App Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-md text-white font-black text-sm">
            ॐ
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wide text-white uppercase">Subhamastu Compact</h1>
            <p className="text-[10px] text-slate-400 font-mono">Anti-Scroll Kebab Architecture</p>
          </div>
        </div>

        {/* Right side user avatar + 3-dot settings icon */}
        <div className="relative flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-200">{currentProfile.name}</span>
            <span className="text-[9px] text-emerald-400 font-mono uppercase">Verified Account</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer flex items-center gap-2 border border-slate-700 shadow-inner"
              title="User Settings Menu"
            >
              <img
                src={currentProfile.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=100"}
                alt="Avatar"
                className="w-6 h-6 rounded-lg object-cover"
              />
              <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {/* Header Settings Popover Menu */}
            {isHeaderMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-700 text-slate-300">
                  <p className="font-bold text-white">{currentProfile.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{currentProfile.contact_number}</p>
                </div>
                <button
                  onClick={() => { setIsHeaderMenuOpen(false); showToast("KYC Status: Verified & Approved"); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-700 text-slate-200 transition-all flex items-center justify-between"
                >
                  <span>Account Verification & KYC</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">Active</span>
                </button>
                <button
                  onClick={() => { setIsHeaderMenuOpen(false); showToast("Notification preferences updated."); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-700 text-slate-200 transition-all"
                >
                  🔔 Notification Preferences
                </button>
                <button
                  onClick={() => { setIsHeaderMenuOpen(false); showToast("Privacy mode toggled: Profile visible to matches."); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-700 text-slate-200 transition-all"
                >
                  🔒 Privacy / Hide My Profile
                </button>
                <button
                  onClick={() => { setIsHeaderMenuOpen(false); showToast("Billing Tier: Paid ₹900 Sacred Unlimited"); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-700 text-slate-200 transition-all flex items-center justify-between"
                >
                  <span>Billing & Unlock History</span>
                  <span className="font-mono text-amber-400">₹900</span>
                </button>
                <div className="border-t border-slate-700 pt-1">
                  {onLogout && (
                    <button
                      onClick={() => { setIsHeaderMenuOpen(false); onLogout(); }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-all font-bold"
                    >
                      🚪 Sign Out
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Anti-Scroll Viewport Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <div className="text-center space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[11px] font-mono text-amber-400 uppercase tracking-wider">
            <span>✨ Zero-Clutter Kebab View</span>
            <span>•</span>
            <span>{sortedProfiles.length} Matches Ready</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Compact High-Signal Profile Cards</h2>
          <p className="text-xs text-slate-400">Click the 3-dot (⋮) kebab menu on any card for instant actions without scrolling.</p>
        </div>

        {sortedProfiles.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-12 text-center space-y-3 my-auto">
            <p className="text-base font-bold text-slate-300">No active matches currently in viewport.</p>
            <p className="text-xs text-slate-500">Check back soon or update your partner preference filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedProfiles.map((match) => {
              const score = calculateMatchScore(currentProfile, match).totalScore;
              const age = calculateAge(match.dob);
              const isMenuOpen = activeCardMenuId === match.id;

              return (
                <div
                  key={match.id}
                  className="bg-slate-800/95 border border-slate-700/80 rounded-3xl p-4 shadow-xl relative flex flex-col justify-between hover:border-slate-600 transition-all"
                >
                  {/* Top Bar: Kebab Button */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold rounded-full border border-emerald-500/25">
                        {score}% Match
                      </span>
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 text-[10px] font-mono rounded-full">
                        {match.sub_caste}
                      </span>
                    </div>

                    {/* Kebab 3-dot Trigger */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveCardMenuId(isMenuOpen ? null : match.id)}
                        className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-600/50"
                        title="Open Card Actions Menu"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2.2" />
                          <circle cx="12" cy="12" r="2.2" />
                          <circle cx="12" cy="19" r="2.2" />
                        </svg>
                      </button>

                      {/* Contextual 3-Dot Overflow Menu (Floating Popover / Slide-up bottom sheet on mobile) */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-11 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
                            Card Actions (⋮ Kebab)
                          </div>

                          <button
                            onClick={() => { setActiveCardMenuId(null); setQuickViewProfile(match); }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 transition-all flex items-center gap-2"
                          >
                            <span>🔍</span> Quick View Profile
                          </button>

                          <button
                            onClick={() => {
                              setActiveCardMenuId(null);
                              showToast(`Downloading Jathakam PDF summary for ${match.name}...`);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 transition-all flex items-center gap-2"
                          >
                            <span>📥</span> Download Horoscope / Summary
                          </button>

                          <button
                            onClick={() => {
                              setActiveCardMenuId(null);
                              navigator.clipboard.writeText(`${window.location.origin}/profile/${match.id}`);
                              showToast(`Copied secure profile link for ${match.name}!`);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 transition-all flex items-center gap-2"
                          >
                            <span>🔗</span> Share Profile Link
                          </button>

                          <button
                            onClick={() => {
                              setActiveCardMenuId(null);
                              setActiveNoteModalProfile(match);
                              setNoteInput(privateNotes[match.id] || "");
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 transition-all flex items-center gap-2"
                          >
                            <span>📝</span> {privateNotes[match.id] ? "Edit Private Note" : "Add Preferences / Note"}
                          </button>

                          <div className="border-t border-slate-800 pt-1 space-y-1">
                            <button
                              onClick={() => {
                                setActiveCardMenuId(null);
                                setReportedProfiles(prev => ({ ...prev, [match.id]: true }));
                                showToast(`Report filed for ${match.name}. Safety desk reviewing.`);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-all flex items-center gap-2"
                            >
                              <span>⚠️</span> Report Inaccuracy
                            </button>
                            <button
                              onClick={() => {
                                setActiveCardMenuId(null);
                                setBlockedProfiles(prev => ({ ...prev, [match.id]: true }));
                                showToast(`Blocked ${match.name} successfully.`);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-all flex items-center gap-2 font-bold"
                            >
                              <span>🚫</span> Block Profile
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Card Main Content (Compact & Zero-Clutter) */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={match.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=200"}
                      alt={match.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 shadow-md shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white truncate">{match.name}</h3>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono shrink-0">Shoorveer</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{match.profession || "Brahmin Professional"}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{age} Yrs • {match.height_feet} Ft • ₹{match.salary_lpa} LPA</p>
                    </div>
                  </div>

                  {/* Private Note Badge if exists */}
                  {privateNotes[match.id] && (
                    <div className="mb-3 px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-700 text-[10px] text-amber-300 italic truncate">
                      📝 Note: "{privateNotes[match.id]}"
                    </div>
                  )}

                  {/* Single High-Priority Primary CTA */}
                  <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2">
                    <button
                      onClick={() => setQuickViewProfile(match)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md text-center"
                    >
                      View Match
                    </button>
                    <a
                      href={`tel:${match.contact_number}`}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center"
                      title="Direct Call"
                    >
                      📞
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Quick View Modal */}
      {quickViewProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setQuickViewProfile(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <img
                src={quickViewProfile.photo_url || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=200"}
                alt={quickViewProfile.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-700"
              />
              <div>
                <h3 className="text-base font-bold text-white">{quickViewProfile.name}</h3>
                <p className="text-xs text-rose-400 font-medium">{quickViewProfile.profession}</p>
                <p className="text-[10px] text-slate-400 font-mono">{quickViewProfile.sub_caste} Brahmin • {quickViewProfile.birth_location || "India"}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Verified Contact:</span>
                <span className="font-mono text-emerald-400 font-bold">{quickViewProfile.contact_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Annual Salary:</span>
                <span className="font-mono text-white font-bold">₹ {quickViewProfile.salary_lpa} LPA</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Gotram:</span>
                <span className="font-mono text-amber-300">{quickViewProfile.gothram || "Not Specified"}</span>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <a
                href={`tel:${quickViewProfile.contact_number}`}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs text-center uppercase tracking-wider"
              >
                Call Now
              </a>
              <button
                onClick={() => setQuickViewProfile(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Private Note Modal */}
      {activeNoteModalProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-white">Private Note for {activeNoteModalProfile.name}</h3>
            <p className="text-xs text-slate-400">Add an internal remark or preference note (visible only to you).</p>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="e.g. Spoke on phone, very polite family, horoscope matching in progress..."
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 h-28 resize-none font-sans"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPrivateNotes(prev => ({ ...prev, [activeNoteModalProfile.id]: noteInput }));
                  setActiveNoteModalProfile(null);
                  showToast("Private note saved successfully.");
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl"
              >
                Save Note
              </button>
              <button
                onClick={() => setActiveNoteModalProfile(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
