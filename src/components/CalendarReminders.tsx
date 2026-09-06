import React, { useState } from "react";
import { Profile, CalendarReminder } from "../types";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Bell, Sparkles, Heart, CheckCircle2, User, CalendarDays, MapPin } from "lucide-react";
import { databaseService } from "../lib/databaseService";

interface CalendarRemindersProps {
  currentProfile: Profile;
  onUpdateProfile: (updated: Profile) => void;
  allProfiles?: Profile[];
}

const PRESET_AUSPICIOUS_DATES = [
  {
    title: "Akshaya Tritiya - Supreme Auspicious Muhurtam",
    date: "2026-05-19",
    time: "09:30",
    type: "Auspicious Date / Muhurtam" as const,
    description: "Highly auspicious day for fixing marriage alliances (Vivaha Nischitartham) and sacred engagements according to Vedic panchangam."
  },
  {
    title: "Vasantha Panchami Vivaha Muhurtam",
    date: "2026-01-23",
    time: "10:15",
    type: "Auspicious Date / Muhurtam" as const,
    description: "Blessed day dedicated to Goddess Saraswati, ideal for auspicious beginnings and matchmaking ceremonies."
  },
  {
    title: "Vaikunta Ekadasi Auspicious Alliance Meet",
    date: "2026-12-21",
    time: "11:00",
    type: "Auspicious Date / Muhurtam" as const,
    description: "Sacred day of Lord Vishnu door opening, highly favorable for family introductions and matching discussions."
  },
  {
    title: "Guru Purnima Astrological Alignment",
    date: "2026-07-29",
    time: "08:00",
    type: "Astrology Consultation" as const,
    description: "Favorable planetary alignment for horoscope matching and seeking blessings from family elders and gurus."
  },
];

export default function CalendarReminders({ currentProfile, onUpdateProfile, allProfiles = [] }: CalendarRemindersProps) {
  const [reminders, setReminders] = useState<CalendarReminder[]>(currentProfile.reminders || []);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>("All");

  // Form state
  const [title, setTitle] = useState<string>("");
  const [type, setType] = useState<CalendarReminder["type"]>("Auspicious Date / Muhurtam");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState<string>("10:00");
  const [description, setDescription] = useState<string>("");
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");

  const approvedMatches = allProfiles.filter(p => p.gender !== currentProfile.gender && p.id !== currentProfile.id);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      alert("Please provide a title and date for the reminder.");
      return;
    }

    const linkedMatch = approvedMatches.find(m => m.id === selectedMatchId);

    const newReminder: CalendarReminder = {
      id: "rem-" + Date.now(),
      userId: currentProfile.id,
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      type,
      matchId: selectedMatchId || undefined,
      matchName: linkedMatch ? linkedMatch.name : undefined,
      createdAt: new Date().toISOString(),
      notified: false
    };

    const updatedReminders = [newReminder, ...reminders];
    setReminders(updatedReminders);

    const updatedProfile: Profile = {
      ...currentProfile,
      reminders: updatedReminders
    };

    try {
      await databaseService.saveProfile(updatedProfile);
      onUpdateProfile(updatedProfile);
      setTitle("");
      setDescription("");
      setSelectedMatchId("");
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to save reminder:", err);
      alert("Failed to save reminder to database.");
    }
  };

  const handleAddPreset = async (preset: typeof PRESET_AUSPICIOUS_DATES[0]) => {
    const newReminder: CalendarReminder = {
      id: "rem-" + Date.now() + "-" + Math.floor(Math.random()*1000),
      userId: currentProfile.id,
      title: preset.title,
      description: preset.description,
      date: preset.date,
      time: preset.time,
      type: preset.type,
      createdAt: new Date().toISOString(),
      notified: false
    };

    const updatedReminders = [newReminder, ...reminders];
    setReminders(updatedReminders);

    const updatedProfile: Profile = {
      ...currentProfile,
      reminders: updatedReminders
    };

    try {
      await databaseService.saveProfile(updatedProfile);
      onUpdateProfile(updatedProfile);
      alert(`Successfully added "${preset.title}" to your calendar reminders!`);
    } catch (err) {
      console.error("Failed to add preset reminder:", err);
    }
  };

  const handleDeleteReminder = async (remId: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    const updatedReminders = reminders.filter(r => r.id !== remId);
    setReminders(updatedReminders);

    const updatedProfile: Profile = {
      ...currentProfile,
      reminders: updatedReminders
    };

    try {
      await databaseService.saveProfile(updatedProfile);
      onUpdateProfile(updatedProfile);
    } catch (err) {
      console.error("Failed to delete reminder:", err);
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (filterType === "All") return true;
    return r.type === filterType;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingCount = reminders.filter(r => r.date >= todayStr).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#362B5A] via-[#4A3D73] to-[#C2242C] rounded-2xl p-6 md:p-8 text-white shadow-xl mb-8 border border-orange-400/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-8 -translate-y-8">
          <CalendarDays className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-orange-300 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Divine Timing & Event Planner</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Calendar Reminders & Auspicious Muhurtams
          </h1>
          <p className="text-blue-100 max-w-2xl text-sm sm:text-base leading-relaxed">
            Set alerts for upcoming sacred wedding dates (Muhurtams), meetings with potential matches, horoscope consultation calls, and family discussion milestones.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-xs text-blue-200">Total Reminders</p>
                <p className="text-lg font-bold">{reminders.length}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-blue-200">Upcoming Events</p>
                <p className="text-lg font-bold">{upcomingCount}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="ml-auto bg-[#C2242C] hover:bg-[#a51c23] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Reminder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: My Scheduled Reminders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#C2242C]" />
              <span>Your Scheduled Alerts</span>
            </h2>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {["All", "Auspicious Date / Muhurtam", "Meeting with Match", "Astrology Consultation", "Family Discussion"].map((typeOption) => (
                <button
                  key={typeOption}
                  onClick={() => setFilterType(typeOption)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterType === typeOption
                      ? "bg-[#362B5A] text-white shadow"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {typeOption === "Auspicious Date / Muhurtam" ? "Muhurtams" : typeOption}
                </button>
              ))}
            </div>
          </div>

          {filteredReminders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Reminders Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                You haven't scheduled any alerts yet. Add a custom reminder or choose from our sacred Vedic Muhurtams on the right.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#C2242C] text-white px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2 shadow hover:bg-[#a51c23] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Reminder</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReminders.map((reminder) => {
                const isPast = reminder.date < todayStr;
                return (
                  <div
                    key={reminder.id}
                    className={`bg-white rounded-xl p-5 border shadow-sm transition-all hover:shadow-md relative overflow-hidden ${
                      isPast ? "border-gray-200 opacity-75" : "border-orange-500/30"
                    }`}
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C2242C]" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 pl-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            reminder.type === "Auspicious Date / Muhurtam"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : reminder.type === "Meeting with Match"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                          }`}>
                            {reminder.type}
                          </span>

                          {isPast && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                              Past Event
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-gray-900">{reminder.title}</h3>

                        {reminder.description && (
                          <p className="text-sm text-gray-600 leading-relaxed">{reminder.description}</p>
                        )}

                        {reminder.matchName && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg w-fit mt-1">
                            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                            <span>Linked Match: {reminder.matchName}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                          title="Delete Reminder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 pl-2">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                          <CalendarIcon className="w-4 h-4 text-orange-500" />
                          {new Date(reminder.date).toLocaleDateString("en-IN", {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        {reminder.time && (
                          <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                            <Clock className="w-4 h-4 text-blue-500" />
                            {reminder.time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Preset Sacred Muhurtams */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Sacred Vedic Muhurtams</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Click any auspicious date below to instantly add it to your calendar reminders.
            </p>

            <div className="space-y-3.5">
              {PRESET_AUSPICIOUS_DATES.map((preset, idx) => (
                <div key={idx} className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/60 hover:shadow-sm transition-all space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{preset.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{preset.description}</p>
                  
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
                      {new Date(preset.date).toLocaleDateString("en-IN", { month: 'short', day: 'numeric', year: 'numeric' })} ({preset.time})
                    </span>

                    <button
                      onClick={() => handleAddPreset(preset)}
                      className="bg-[#C2242C] hover:bg-[#a51c23] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="bg-[#C2242C] p-2 rounded-xl text-white">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Schedule New Reminder</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reminder Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Family Introduction Meet with Sharma Family"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#362B5A] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reminder Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#362B5A] text-sm bg-white"
                  >
                    <option value="Auspicious Date / Muhurtam">Auspicious Date / Muhurtam</option>
                    <option value="Meeting with Match">Meeting with Match</option>
                    <option value="Astrology Consultation">Astrology Consultation</option>
                    <option value="Family Discussion">Family Discussion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Link Approved Match (Optional)</label>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#362B5A] text-sm bg-white"
                  >
                    <option value="">-- None / General --</option>
                    {approvedMatches.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.reg_number || m.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#362B5A] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#362B5A] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Notes / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about location, astrologer name, or agenda..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#362B5A] text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C2242C] hover:bg-[#a51c23] text-white text-sm font-bold shadow transition-all"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
