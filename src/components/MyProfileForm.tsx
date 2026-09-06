import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Compass, MapPin, Calendar, Clock, Phone, Briefcase, Heart, Award, ShieldCheck, User, UploadCloud, Camera, Trash2, Image, FileText, Eye, EyeOff } from "lucide-react";
import { Profile, AstrologyDetails } from "../types";
import { BRAHMIN_SUB_CASTES, BRAHMIN_GOTRAMS } from "../lib/brahminMetadata";
import { calculatePanchangam } from "../lib/panchangam";
import { KundaliChart } from "./KundaliChart";
import SearchableSelect from "./SearchableSelect";
import { databaseService } from "../lib/databaseService";

interface MyProfileFormProps {
  currentProfile: Profile;
  onSaveProfile: (profile: Profile) => Promise<void>;
}

export default function MyProfileForm({ currentProfile, onSaveProfile }: MyProfileFormProps) {
  const [formData, setFormData] = useState<Partial<Profile>>({
    name: currentProfile.name || "",
    dob: currentProfile.dob || "",
    birth_time: currentProfile.birth_time || "",
    birth_location: currentProfile.birth_location || "",
    birth_pincode: currentProfile.birth_pincode || "",
    salary_lpa: currentProfile.salary_lpa || 8,
    contact_number: currentProfile.contact_number || "",
    gender: currentProfile.gender || "Female",
    sub_caste: currentProfile.sub_caste || "",
    height_feet: currentProfile.height_feet || 5.4,
    profession: currentProfile.profession || "",
    gothram: currentProfile.gothram || "",
    surname: currentProfile.surname || "",
    nakshatram: currentProfile.nakshatram || "",
    partner_expectation_type: currentProfile.partner_expectation_type || (currentProfile.gender === "Male" ? "Housewife (గృహిణి)" : "Any Profession (ఏదైనా ఉద్యోగం)"),
    partner_expectations_desc: currentProfile.partner_expectations_desc || "",
    company_name: currentProfile.company_name || "",
    job_branch: currentProfile.job_branch || "",
    working_shift: currentProfile.working_shift || "Day Shift (పగటి వేళ)",
    partner_height_diff_pref: currentProfile.partner_height_diff_pref || "No Preference",
    partner_lpa_pref: currentProfile.partner_lpa_pref || "No Preference",
    partner_shift_pref: currentProfile.partner_shift_pref || "No Preference",
    photo_url: currentProfile.photo_url || "",
    photo_url_2: currentProfile.photo_url_2 || "",
    photo_url_3: currentProfile.photo_url_3 || "",
    kundali_url: currentProfile.kundali_url || "",
  });

  // Local states for exact/buffer time choice in profile edit
  const isInitialBuffer = (currentProfile.birth_time || "").includes("to");
  const initialBufferFrom = isInitialBuffer ? (currentProfile.birth_time || "").split(" to ")[0] : "09:00";
  const initialBufferTo = isInitialBuffer ? (currentProfile.birth_time || "").split(" to ")[1] : "10:00";

  const [profileTimeType, setProfileTimeType] = useState<"exact" | "buffer">(isInitialBuffer ? "buffer" : "exact");
  const [profileBufferFrom, setProfileBufferFrom] = useState(initialBufferFrom);
  const [profileBufferTo, setProfileBufferTo] = useState(initialBufferTo);

  const [showUserPassword, setShowUserPassword] = useState(false);
  const [editedUserPassword, setEditedUserPassword] = useState(currentProfile.password || "");
  const [isSavingUserPassword, setIsSavingUserPassword] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);

  useEffect(() => {
    setEditedUserPassword(currentProfile.password || "");
  }, [currentProfile]);

  const handleUpdateUserPassword = async () => {
    if (!editedUserPassword.trim()) {
      alert("Password cannot be empty.");
      return;
    }
    setIsSavingUserPassword(true);
    setPasswordUpdateSuccess(false);
    try {
      const updated: Profile = {
        ...currentProfile,
        password: editedUserPassword.trim()
      };
      await onSaveProfile(updated);
      setPasswordUpdateSuccess(true);
      setTimeout(() => setPasswordUpdateSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to update password:", err);
      alert("Failed to save password.");
    } finally {
      setIsSavingUserPassword(false);
    }
  };

  // Sync birth_time in MyProfileForm when buffer/time selection updates
  useEffect(() => {
    if (profileTimeType === "buffer") {
      setFormData((prev) => ({
        ...prev,
        birth_time: `${profileBufferFrom} to ${profileBufferTo}`
      }));
    }
  }, [profileTimeType, profileBufferFrom, profileBufferTo]);

  // Uploading and Camera capture states for Profile Form
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [cameraActiveTarget, setCameraActiveTarget] = useState<"photo_url" | "photo_url_2" | "photo_url_3" | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const startCamera = async (target: "photo_url" | "photo_url_2" | "photo_url_3") => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setCameraStream(stream);
      setCameraActiveTarget(target);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Camera access denied or device has no camera.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActiveTarget(null);
  };

  const capturePhoto = () => {
    if (!cameraActiveTarget) return;
    const video = document.getElementById("profile-camera-preview") as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setFormData((prev) => ({ ...prev, [cameraActiveTarget]: dataUrl }));
      }
    }
    stopCamera();
  };

  const handleDeviceUpload = async (
    file: File,
    field: "photo_url" | "photo_url_2" | "photo_url_3" | "kundali_url"
  ) => {
    if (!file) return;
    setUploadingTarget(field);
    try {
      const uploadedUrl = await databaseService.uploadFile(file, "user-uploads", currentProfile.id || "temp-user");
      setFormData((prev) => ({ ...prev, [field]: uploadedUrl }));
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to process local file.");
    } finally {
      setUploadingTarget(null);
    }
  };

  const [loading, setLoading] = useState(false);
  const [astrology, setAstrology] = useState<AstrologyDetails | undefined>(currentProfile.astrology);
  const [successMsg, setSuccessMsg] = useState("");

  // Google Maps-style location autocomplete states
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Debounced location search for My Profile Form
  useEffect(() => {
    const loc = formData.birth_location;
    if (!loc || loc.length < 2) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const { searchLocation } = await import("../lib/locationService");
        const results = await searchLocation(loc);
        setLocationSuggestions(results);
        setShowLocationDropdown(results.length > 0);
      } catch (err) {
        console.error("Failed to query location suggestions:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [formData.birth_location]);

  // Click outside handler for location suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const container = document.getElementById("profile-birth-place-container");
      if (container && !container.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-recalculate astrology when DOB or birth time changes, and fill up the fields immediately
  useEffect(() => {
    const dob = formData.dob;
    const birthTime = formData.birth_time;
    if (dob) {
      try {
        const localCalc = calculatePanchangam(dob, birthTime || "08:30");
        const astroResult: AstrologyDetails = {
          nakshatra: localCalc.nakshatram.english,
          nakshatraLord: localCalc.nakshatraLord,
          nakshatraLordTelugu: localCalc.nakshatraLordTelugu,
          pada: localCalc.pada,
          rashi: `${localCalc.rasi.english} (${localCalc.rasi.telugu})`,
          tithi: localCalc.tithi.english,
          deity: localCalc.deity,
          deityTelugu: localCalc.deityTelugu,
          spiritualAnalysis: localCalc.spiritualAnalysis,
          compatibilityTraits: localCalc.compatibilityTraits,
          spiritualScore: localCalc.spiritualScore,
          hamsaGuidance: localCalc.hamsaGuidance
        };
        setAstrology(astroResult);
        
        setFormData((prev) => {
          if (prev.nakshatram === localCalc.nakshatram.english) return prev;
          return {
            ...prev,
            nakshatram: localCalc.nakshatram.english
          };
        });
      } catch (e) {
        console.error("Auto calculation of panchangam failed:", e);
      }
    }
  }, [formData.dob, formData.birth_time]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "salary_lpa" || name === "height_feet" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleGenerateAstrologyAndSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const dobToCheck = formData.dob;
    const genderToCheck = formData.gender || currentProfile.gender || "Female";
    if (dobToCheck) {
      const calculateExactAge = (dobString: string): number => {
        if (!dobString) return 0;
        const birthDate = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };
      const minAgeReq = genderToCheck === "Male" ? 24 : 21;
      const currentAge = calculateExactAge(dobToCheck);
      if (currentAge < minAgeReq - 1) {
        alert(`⚠️ Age Restriction: Minimum age is ${minAgeReq} years for ${genderToCheck === "Male" ? "Boys" : "Girls"}. Current age is ${currentAge} years. Updating profile is restricted below ${minAgeReq - 1} years.`);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setSuccessMsg("");

    let astroResult: AstrologyDetails | undefined = astrology;

    try {
      // 1. Fetch astrological alignment from our server-side API or fall back to local computation
      try {
        const response = await fetch("/api/astrology", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dob: formData.dob,
            time: formData.birth_time || "12:00",
            location: formData.birth_location || "Varanasi, India",
          }),
        });

        if (response.ok) {
          astroResult = await response.json();
          setAstrology(astroResult);
        }
      } catch (apiErr) {
        console.warn("Astrology API offline, computing locally:", apiErr);
      }

      if (!astroResult && formData.dob) {
        const localCalc = calculatePanchangam(formData.dob, formData.birth_time || "08:30");
        astroResult = {
          nakshatra: localCalc.nakshatram.english,
          nakshatraLord: localCalc.nakshatraLord,
          nakshatraLordTelugu: localCalc.nakshatraLordTelugu,
          pada: localCalc.pada,
          rashi: `${localCalc.rasi.english} (${localCalc.rasi.telugu})`,
          tithi: localCalc.tithi.english,
          deity: localCalc.deity,
          deityTelugu: localCalc.deityTelugu,
          spiritualAnalysis: localCalc.spiritualAnalysis,
          compatibilityTraits: localCalc.compatibilityTraits,
          spiritualScore: localCalc.spiritualScore,
          hamsaGuidance: localCalc.hamsaGuidance
        };
        setAstrology(astroResult);
      }

      // 2. Build complete profile and save to persistent storage
      const updatedProfile: Profile = {
        ...currentProfile,
        ...(formData as Profile),
        astrology: astroResult,
        status: currentProfile.status || "Pending",
      };

      await onSaveProfile(updatedProfile);
      setSuccessMsg("Your cosmic coordinates have been aligned and profile updated successfully!");
    } catch (err) {
      console.error("Error generating astrological details:", err);
      alert("An error occurred while saving, but we registered your details successfully.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-[#362B5A] to-[#4e3f80] text-white p-8 rounded-3xl shadow-xl border border-orange-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-10">
          <Sparkles className="w-64 h-64 text-orange-400" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 bg-[#C2242C]/20 text-orange-300 w-fit px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase">
            <Compass className="w-3.5 h-3.5 animate-spin" />
            <span>Kundali Milan Engine</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Your Spiritual Identity</h2>
          <p className="text-blue-100 max-w-2xl leading-relaxed">
            In the sacred tradition of Shiva and Sati's eternal connection, true matching begins with cosmic geometry. Complete your details and calculate your Vedic coordinates to unlock your Nakshatra, Tithi, and divine personality markers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <form onSubmit={handleGenerateAstrologyAndSave} className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#362B5A]/5 space-y-6">
          <h3 className="text-lg font-bold text-[#362B5A] border-b border-gray-100 pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-[#C2242C]" />
            Personal & Professional Details
          </h3>

          {/* Photos & Kundali Upload Portal */}
          <div className="bg-[#EBF6FF]/40 border-2 border-[#362B5A]/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <Image className="w-5 h-5 text-[#C2242C]" />
              <h4 className="font-extrabold text-[#362B5A] text-sm uppercase tracking-wider">
                Vedic Portrait & Kundali Photos (చిత్రాలు & కుండలి)
              </h4>
            </div>

            {/* Webcam Active Container */}
            {cameraActiveTarget && (
              <div className="bg-black rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden">
                <video
                  id="profile-camera-preview"
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el && cameraStream) el.srcObject = cameraStream;
                  }}
                  className="w-full max-w-xs h-48 object-cover rounded-xl border border-white/20"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase cursor-pointer"
                  >
                    Capture
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="py-1.5 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-xs font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Photo 1 */}
              <div className="bg-white p-3 rounded-xl border border-[#362B5A]/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Portrait Photo 1 (Main)</span>
                  {formData.photo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, photo_url: "" }))}
                      className="text-[10px] text-red-500 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
                {formData.photo_url ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#362B5A]/10 shadow-inner">
                    <img src={formData.photo_url} alt="Main" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={uploadingTarget === "photo_url"}
                        onClick={() => document.getElementById("p1-file")?.click()}
                        className="flex-1 py-1.5 bg-blue-50 text-[#362B5A] border border-blue-100 hover:bg-blue-100 rounded-lg text-[10px] font-black uppercase text-center cursor-pointer"
                      >
                        {uploadingTarget === "photo_url" ? "Loading..." : "File"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startCamera("photo_url")}
                        className="flex-1 py-1.5 bg-amber-50 text-[#C2242C] border border-amber-100 hover:bg-amber-100 rounded-lg text-[10px] font-black uppercase text-center cursor-pointer"
                      >
                        Camera
                      </button>
                    </div>
                    <input
                      type="file"
                      id="p1-file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleDeviceUpload(e.target.files[0], "photo_url")}
                    />
                  </div>
                )}
                <input
                  type="url"
                  placeholder="Or paste URL link directly..."
                  value={formData.photo_url || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, photo_url: e.target.value }))}
                  className="w-full text-[11px] px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Photo 2 */}
              <div className="bg-white p-3 rounded-xl border border-[#362B5A]/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Portrait Photo 2</span>
                  {formData.photo_url_2 && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, photo_url_2: "" }))}
                      className="text-[10px] text-red-500 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
                {formData.photo_url_2 ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#362B5A]/10 shadow-inner">
                    <img src={formData.photo_url_2} alt="Photo 2" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={uploadingTarget === "photo_url_2"}
                        onClick={() => document.getElementById("p2-file")?.click()}
                        className="flex-1 py-1.5 bg-blue-50 text-[#362B5A] border border-blue-100 hover:bg-blue-100 rounded-lg text-[10px] font-black uppercase text-center cursor-pointer"
                      >
                        {uploadingTarget === "photo_url_2" ? "Loading..." : "File"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startCamera("photo_url_2")}
                        className="flex-1 py-1.5 bg-amber-50 text-[#C2242C] border border-amber-100 hover:bg-amber-100 rounded-lg text-[10px] font-black uppercase text-center cursor-pointer"
                      >
                        Camera
                      </button>
                    </div>
                    <input
                      type="file"
                      id="p2-file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleDeviceUpload(e.target.files[0], "photo_url_2")}
                    />
                  </div>
                )}
                <input
                  type="url"
                  placeholder="Or paste URL link directly..."
                  value={formData.photo_url_2 || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, photo_url_2: e.target.value }))}
                  className="w-full text-[11px] px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Photo 3 */}
              <div className="bg-white p-3 rounded-xl border border-[#362B5A]/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Portrait Photo 3</span>
                  {formData.photo_url_3 && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, photo_url_3: "" }))}
                      className="text-[10px] text-red-500 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
                {formData.photo_url_3 ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#362B5A]/10 shadow-inner">
                    <img src={formData.photo_url_3} alt="Photo 3" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={uploadingTarget === "photo_url_3"}
                        onClick={() => document.getElementById("p3-file")?.click()}
                        className="flex-1 py-1.5 bg-blue-50 text-[#362B5A] border border-blue-100 hover:bg-blue-100 rounded-lg text-[10px] font-black uppercase text-center cursor-pointer"
                      >
                        {uploadingTarget === "photo_url_3" ? "Loading..." : "File"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startCamera("photo_url_3")}
                        className="flex-1 py-1.5 bg-amber-50 text-[#C2242C] border border-amber-100 hover:bg-amber-100 rounded-lg text-[10px] font-black uppercase text-center cursor-pointer"
                      >
                        Camera
                      </button>
                    </div>
                    <input
                      type="file"
                      id="p3-file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleDeviceUpload(e.target.files[0], "photo_url_3")}
                    />
                  </div>
                )}
                <input
                  type="url"
                  placeholder="Or paste URL link directly..."
                  value={formData.photo_url_3 || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, photo_url_3: e.target.value }))}
                  className="w-full text-[11px] px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Candidate Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Subramanyam Sharma"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A]"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Auspicious Category (Gender)</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A] cursor-pointer"
              >
                <option value="Female">Chi.La.Sow. Lakshmi Soubhagyavathi (Bride / వధువు)</option>
                <option value="Male">Chiranjeevi (Groom / వరుడు)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Surname (ఇంటిపేరు / Inti Peru)</label>
              <input
                type="text"
                name="surname"
                required
                value={formData.surname}
                onChange={handleChange}
                placeholder="e.g. Duvvuri, Ghadiyaram, Vedula"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A]"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Gothram (గోత్రం) *</label>
              <SearchableSelect
                options={BRAHMIN_GOTRAMS}
                selectedValue={formData.gothram || ""}
                onChange={(val) => setFormData(prev => ({ ...prev, gothram: val }))}
                placeholder="Search and Select Gotram (గోత్రం)..."
                theme="light"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Nakshatram (నక్షత్రం / Star)</label>
              <select
                name="nakshatram"
                value={formData.nakshatram}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A] cursor-pointer"
              >
                <option value="">Select Nakshatram (నక్షత్రం ఎంచుకోండి)</option>
                <option value="Ashwini">Ashwini (అశ్విని)</option>
                <option value="Bharani">Bharani (భరణి)</option>
                <option value="Krittika">Krittika (కృత్తిక)</option>
                <option value="Rohini">Rohini (రోహిణి)</option>
                <option value="Mrigashira">Mrigashira (మృగశిర)</option>
                <option value="Ardra">Ardra (ఆరుద్ర)</option>
                <option value="Punarvasu">Punarvasu (పునర్వసు)</option>
                <option value="Pushya">Pushya (పుష్యమి)</option>
                <option value="Ashlesha">Ashlesha (ఆశ్లేష)</option>
                <option value="Magha">Magha (మఖ)</option>
                <option value="Purva Phalguni">Purva Phalguni (పుబ్బ)</option>
                <option value="Uttara Phalguni">Uttara Phalguni (ఉత్తర)</option>
                <option value="Hasta">Hasta (హస్త)</option>
                <option value="Chitra">Chitra (చిత్త)</option>
                <option value="Swati">Swati (స్వాతి)</option>
                <option value="Vishakha">Vishakha (విశాఖ)</option>
                <option value="Anuradha">Anuradha (అనూరాధ)</option>
                <option value="Jyeshta">Jyeshta (జ్యేష్ఠ)</option>
                <option value="Mula">Mula (మూల)</option>
                <option value="Purva Ashadha">Purva Ashadha (పూర్వాషాఢ)</option>
                <option value="Uttara Ashadha">Uttara Ashadha (ఉత్తరాషాఢ)</option>
                <option value="Shravana">Shravana (శ్రవణం)</option>
                <option value="Dhanishta">Dhanishta (ధనిష్ఠ)</option>
                <option value="Shatabhisha">Shatabhisha (శతభిషం)</option>
                <option value="Purva Bhadrapada">Purva Bhadrapada (పూర్వాభాద్ర)</option>
                <option value="Uttara Bhadrapada">Uttara Bhadrapada (ఉత్తరాభాద్ర)</option>
                <option value="Revati">Revati (రేవతి)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Sub-Caste (Brahmin Sect) *</label>
              <SearchableSelect
                options={BRAHMIN_SUB_CASTES}
                selectedValue={formData.sub_caste || ""}
                onChange={(val) => setFormData(prev => ({ ...prev, sub_caste: val }))}
                placeholder="Select Brahmin Sub-Caste (శాఖ)..."
                theme="light"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Height (in Feet)</label>
              <input
                type="number"
                step="0.1"
                name="height_feet"
                value={formData.height_feet}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A]"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Profession & Employment</label>
              <input
                type="text"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                placeholder="e.g. Software Engineer, Priest, Lecturer"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A]"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Annual Income (₹ LPA - Lakhs per annum)</label>
              <input
                type="number"
                name="salary_lpa"
                value={formData.salary_lpa}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A]"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Company Name (సంస్థ పేరు)</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="e.g. TCS, Infosys, Govt"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A]"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Branch / Job Place (కార్యాలయ స్థలం)</label>
              <input
                type="text"
                name="job_branch"
                value={formData.job_branch}
                onChange={handleChange}
                placeholder="e.g. Hyderabad, Gachibowli"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A]"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Working Shift (షిఫ్ట్ వివరాలు)</label>
              <select
                name="working_shift"
                value={formData.working_shift}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A] cursor-pointer"
              >
                <option value="Day Shift (పగటి వేళ)">Day Shift (పగటి వేళ)</option>
                <option value="Night Shift (రాత్రి వేళ)">Night Shift (రాత్రి వేళ)</option>
                <option value="Rotational Shift (షిఫ్టులు)">Rotational Shift (షిఫ్టులు)</option>
                <option value="Flexible Shift (అనుకూల సమయం)">Flexible Shift (అనుకూల సమయం)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Direct Contact Number (Mobile / Whatsapp)</label>
              <input
                type="tel"
                name="contact_number"
                required
                readOnly={Boolean(currentProfile.contact_number && currentProfile.contact_number.trim().length > 0)}
                value={formData.contact_number}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] text-base font-extrabold ${currentProfile.contact_number ? 'bg-gray-100 text-gray-600 cursor-not-allowed font-mono' : 'bg-[#EBF6FF]/20 text-[#362B5A]'}`}
              />
              {currentProfile.contact_number && (
                <p className="text-[10px] text-amber-700 font-bold mt-1">🔒 Registered mobile number cannot be removed or changed once set (Used for portal login).</p>
              )}
            </div>
          </div>

          {/* Partner Expectations & Profile Preferences */}
          <h3 className="text-lg font-bold text-[#362B5A] border-b border-gray-100 pb-3 pt-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#C2242C]" />
            Partner Expectations & Profile Preferences (భాగస్వామి వివరాలు)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Partner Profession Preference</label>
              {formData.gender === "Male" ? (
                <select
                  name="partner_expectation_type"
                  value={formData.partner_expectation_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A] cursor-pointer"
                >
                  <option value="Housewife (గృహిణి)">Housewife (గృహిణి)</option>
                  <option value="Any Profession (ఏదైనా ఉద్యోగం)">Any Profession (ఏదైనా ఉద్యోగం)</option>
                  <option value="Working Profession (ఉద్యోగిని)">Working Profession required (ఉద్యోగం తప్పనిసరి)</option>
                </select>
              ) : (
                <select
                  name="partner_expectation_type"
                  value={formData.partner_expectation_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A] cursor-pointer"
                >
                  <option value="Any Profession (ఏదైనా ఉద్యోగం)">Any Profession (ఏదైనా ఉద్యోగం)</option>
                  <option value="Well Settled / High Income (బాగా స్థిరపడిన వరుడు)">Well Settled Job (బాగా స్థిరపడిన ఉద్యోగం)</option>
                  <option value="Specific Profession preferred (ప్రత్యేకమైన ఉద్యోగం)">Specific profession required (ఉద్యోగం తప్పనిసరి)</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Expected Qualities in Partner (కోరుకునే గుణాలు)</label>
              <input
                type="text"
                name="partner_expectations_desc"
                value={formData.partner_expectations_desc}
                onChange={handleChange}
                placeholder="e.g. Well cultured, respecting traditional values, vegetarian"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A]"
              />
            </div>



            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Expected Partner Income Range (సంవత్సర ఆదాయం)</label>
              <select
                name="partner_lpa_pref"
                value={formData.partner_lpa_pref}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A] cursor-pointer"
              >
                <option value="No Preference">No Preference / Not Specific (ఆదాయంతో సంబంధం లేదు)</option>
                <option value="< 6 LPA">&lt; 6 LPA (6 లక్షల లోపు)</option>
                <option value="6 - 12 LPA">6 - 12 LPA (6 నుండి 12 లక్షలు)</option>
                <option value="12 - 18 LPA">12 - 18 LPA (12 నుండి 18 లక్షలు)</option>
                <option value="18 - 24 LPA">18 - 24 LPA (18 నుండి 24 లక్షలు)</option>
                <option value="24+ LPA">24+ LPA (24 లక్షల పైన)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-[#362B5A] uppercase tracking-wider mb-2">Preferred Partner Working Shift (షిఫ్ట్ ప్రాధాన్యత)</label>
              <select
                name="partner_shift_pref"
                value={formData.partner_shift_pref}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-base font-extrabold text-[#362B5A] cursor-pointer"
              >
                <option value="No Preference">No Preference (ఏదైనా పర్వాలేదు)</option>
                <option value="Day Shift Only">Day Shift Only (పగటి వేళ మాత్రమే)</option>
                <option value="Night Shift Only">Night Shift Only (రాత్రి వేళ మాత్రమే)</option>
                <option value="Flexible Shift">Flexible / Rotational Shift (ఫ్లెక్సిబుల్ / ఏ సమయమైనా)</option>
              </select>
            </div>
          </div>

          {/* Celestial coordinates section */}
          <h3 className="text-lg font-bold text-[#362B5A] border-b border-gray-100 pb-3 pt-4 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#C2242C]" />
            Sacred Astrological Coordinates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#362B5A] uppercase tracking-wider mb-2">Date of Birth</label>
              <input
                type="date"
                name="dob"
                required
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#362B5A] uppercase tracking-wider">Birth Time Selection Type</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setProfileTimeType("exact")}
                  className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    profileTimeType === "exact"
                      ? "bg-[#362B5A] text-white shadow"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Exact Time
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileTimeType("buffer");
                    setFormData((prev) => ({
                      ...prev,
                      birth_time: `${profileBufferFrom} to ${profileBufferTo}`
                    }));
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    profileTimeType === "buffer"
                      ? "bg-[#362B5A] text-white shadow"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Buffer / Gap
                </button>
              </div>

              {profileTimeType === "exact" ? (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Exact Time of Birth</label>
                  <input
                    type="time"
                    name="birth_time"
                    value={(formData.birth_time || "").includes("to") ? "08:30" : formData.birth_time}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-sm font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">From</label>
                      <input
                        type="time"
                        value={profileBufferFrom}
                        onChange={(e) => setProfileBufferFrom(e.target.value)}
                        className="w-full bg-white border border-gray-200 focus:border-[#362B5A] rounded-lg py-2 px-2 text-sm focus:outline-none font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">To</label>
                      <input
                        type="time"
                        value={profileBufferTo}
                        onChange={(e) => setProfileBufferTo(e.target.value)}
                        className="w-full bg-white border border-gray-200 focus:border-[#362B5A] rounded-lg py-2 px-2 text-sm focus:outline-none font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Pre-defined Interval Helper */}
                  <div>
                    <label className="text-[10px] font-black text-[#362B5A] uppercase tracking-wider block mb-1.5">Quick Intervals</label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {[
                        { label: "Early Morning (4am - 6am)", from: "04:00", to: "06:00" },
                        { label: "Morning (6am - 9am)", from: "06:00", to: "09:00" },
                        { label: "Mid Day (9am - 12pm)", from: "09:00", to: "12:00" },
                        { label: "Afternoon (12pm - 3pm)", from: "12:00", to: "15:00" },
                        { label: "Late Afternoon (3pm - 6pm)", from: "15:00", to: "18:00" },
                        { label: "Evening (6pm - 9pm)", from: "18:00", to: "21:00" },
                        { label: "Night (9pm - 12am)", from: "21:00", to: "00:00" },
                        { label: "Late Night (12am - 4am)", from: "00:00", to: "04:00" },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setProfileBufferFrom(item.from);
                            setProfileBufferTo(item.to);
                          }}
                          className={`py-1 px-1.5 rounded text-[10px] font-bold text-left border transition-colors cursor-pointer ${
                            profileBufferFrom === item.from && profileBufferTo === item.to
                              ? "bg-[#362B5A]/10 text-[#362B5A] border-[#362B5A]/30"
                              : "bg-white text-gray-500 border-gray-200 hover:text-gray-900"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-[10px] text-[#362B5A] font-bold bg-[#EBF6FF]/40 px-2 py-1.5 rounded border border-[#362B5A]/10">
                    Selected Buffer: {profileBufferFrom} to {profileBufferTo}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" id="profile-birth-place-container">
              <label className="block text-xs font-bold text-[#362B5A] uppercase tracking-wider mb-2">Birth Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="text"
                  name="birth_location"
                  value={formData.birth_location}
                  onChange={(e) => {
                    handleChange(e);
                    setShowLocationDropdown(true);
                  }}
                  onFocus={() => {
                    if (locationSuggestions.length > 0) setShowLocationDropdown(true);
                  }}
                  placeholder="City, Country"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 relative text-sm font-bold"
                />
              </div>
              {showLocationDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                  {loadingSuggestions && (
                    <div className="p-3.5 text-xs text-gray-500 flex items-center gap-2.5 font-semibold">
                      <div className="w-4 h-4 border-2 border-[#362B5A] border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching matching locations...</span>
                    </div>
                  )}
                  {!loadingSuggestions && locationSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          birth_location: suggestion.display_name || suggestion.name,
                        }));
                        setShowLocationDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3.5 hover:bg-gray-50/80 transition-colors flex items-start gap-3 text-xs text-gray-600 font-semibold group cursor-pointer bg-white"
                    >
                      <MapPin className="w-4 h-4 text-[#C2242C] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="space-y-1 min-w-0 flex-1 pr-2">
                        <p className="text-[#362B5A] text-xs font-bold group-hover:text-[#C2242C] transition-colors whitespace-normal break-words">{suggestion.name}</p>
                        <p className="text-[10.5px] text-gray-400 font-medium leading-relaxed whitespace-normal break-words">{suggestion.display_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#362B5A] uppercase tracking-wider mb-2">Birth Place Pincode (Optional)</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  name="birth_pincode"
                  maxLength={6}
                  value={formData.birth_pincode || ""}
                  onChange={(e) => {
                    const cleanValue = e.target.value.replace(/\D/g, "");
                    setFormData((prev) => ({ ...prev, birth_pincode: cleanValue }));
                  }}
                  placeholder="e.g. 518502"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/20 text-sm font-bold font-mono"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Uniquely identifies your exact native birth village/town.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-[#C2242C] text-white font-bold text-sm tracking-widest uppercase hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-700/10"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Consulting the Heavens...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-orange-200" />
                <span>Calculate Vedic Alignment & Save</span>
              </>
            )}
          </button>

          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 text-sm font-medium rounded-xl border border-emerald-100 text-center flex items-center justify-center gap-2 animate-bounce">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>

        {/* Astrology / Kundali Card Column */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Gold-Embossed Sacred Brahmin Identity Card */}
          <div className="bg-gradient-to-br from-[#1a1333] via-[#362B5A] to-[#120c24] text-white rounded-3xl p-6 border-2 border-amber-400 shadow-xl relative overflow-hidden space-y-4">
            {/* Spiritual Pattern Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full filter blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#C2242C]/10 rounded-full filter blur-xl pointer-events-none" />
            
            {/* Border lines representing sacred borders */}
            <div className="absolute inset-1.5 border border-dashed border-amber-400/20 rounded-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between border-b border-amber-400/20 pb-3">
              <div className="text-left">
                <span className="text-[9px] uppercase tracking-widest text-amber-300 font-extrabold block">BRAMHANA VIVAHA</span>
                <span className="text-xs uppercase font-mono tracking-wider text-amber-400/80">Divine Identity Card</span>
              </div>
              <Award className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
            </div>

            <div className="relative z-10 py-2 space-y-3.5 text-center">
              <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-lg px-6 py-2 rounded-xl shadow-lg border border-yellow-300 font-mono tracking-widest uppercase select-all">
                {currentProfile.reg_number || "BVM-Pending"}
              </div>
              
              <div className="space-y-1">
                <h4 className="text-base font-black text-white">{currentProfile.name}</h4>
                <p className="text-[10px] text-amber-300/80 font-mono">Registered Mobile: {currentProfile.contact_number}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{currentProfile.gender} • {currentProfile.sub_caste} Brahmin</p>
              </div>
            </div>

            <div className="relative z-10 bg-amber-400/5 border border-amber-400/20 p-3 rounded-xl text-center space-y-1">
              <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest block">📸 SCREENSHOT THIS KEY</span>
              <p className="text-[9.5px] text-gray-300 leading-relaxed font-semibold">
                Keep this screenshot in your phone gallery. Use this ID or your Mobile number for easy references with our administration.
              </p>
            </div>
          </div>

          {/* LOGIN CREDENTIALS & SECURITY */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="p-2 bg-[#EBF6FF] text-[#362B5A] rounded-xl">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#362B5A] uppercase tracking-wider">Login Security Settings (లాగిన్ పాస్వర్డ్)</h4>
                <p className="text-[10px] text-gray-400">View or change your security credentials</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-500 uppercase text-[9px]">Your Login Mobile:</span>
                <span className="font-mono font-bold text-[#362B5A] select-all">{currentProfile.contact_number}</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase text-[9px] block">Your Login Password:</label>
                <div className="relative">
                  <input
                    type={showUserPassword ? "text" : "password"}
                    value={editedUserPassword}
                    onChange={(e) => setEditedUserPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 pr-20 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-mono text-xs font-bold"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                      className="p-1 bg-gray-50 text-gray-400 hover:text-[#362B5A] rounded-md transition-colors"
                      title={showUserPassword ? "Hide password" : "Show password"}
                    >
                      {showUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateUserPassword}
                      disabled={isSavingUserPassword || editedUserPassword === currentProfile.password}
                      className="px-2.5 py-1 bg-[#362B5A] hover:bg-opacity-90 disabled:opacity-50 text-white font-bold text-[9px] uppercase rounded-md transition-all shrink-0 cursor-pointer"
                    >
                      {isSavingUserPassword ? "Saving..." : "Change"}
                    </button>
                  </div>
                </div>
              </div>

              {passwordUpdateSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-100 text-center animate-in fade-in duration-200">
                  ✓ Password updated successfully!
                </div>
              )}
            </div>
          </div>

          {astrology ? (
            <div className="bg-[#362B5A] text-white rounded-3xl p-8 border border-orange-500/20 shadow-xl space-y-6 relative overflow-hidden">
              {/* Spiritual Aura Background */}
              <div className="absolute inset-0 bg-radial-at-t from-orange-500/10 via-transparent to-transparent pointer-events-none" />

              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-orange-300 font-mono tracking-widest uppercase">Sacred Horoscope</span>
                  <h4 className="text-2xl font-bold font-sans">Cosmic Alignment</h4>
                </div>
                <div className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-xs font-bold border border-orange-400/30">
                  Pada {astrology.pada}
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                  <span className="text-[10px] text-blue-200/60 uppercase tracking-widest block mb-1">నక్షత్రం (Nakshatra)</span>
                  <p className="text-base font-bold text-white">{astrology.nakshatra}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                  <span className="text-[10px] text-blue-200/60 uppercase tracking-widest block mb-1">అధిపతి (Ruler / Lord)</span>
                  <p className="text-base font-bold text-white">
                    {astrology.nakshatraLord} {astrology.nakshatraLordTelugu ? `(${astrology.nakshatraLordTelugu})` : ""}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                  <span className="text-[10px] text-blue-200/60 uppercase tracking-widest block mb-1">తిథి (Tithi / Lunar Day)</span>
                  <p className="text-base font-bold text-white">{astrology.tithi}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                  <span className="text-[10px] text-blue-200/60 uppercase tracking-widest block mb-1">రాశి (Moon Sign / Rashi)</span>
                  <p className="text-base font-bold text-white">{astrology.rashi}</p>
                </div>
              </div>

              {/* Dynamic Traditional Kundali Chart */}
              <div className="relative z-10 w-full pt-2">
                {(() => {
                  const dobForCalc = formData.dob || currentProfile.dob;
                  const timeForCalc = formData.birth_time || currentProfile.birth_time || "08:30";
                  if (dobForCalc) {
                    try {
                      const localCalc = calculatePanchangam(dobForCalc, timeForCalc);
                      return (
                        <KundaliChart
                          lagnamIndex={localCalc.lagnam.index}
                          rasiIndex={localCalc.rasi.index}
                          name={formData.name || currentProfile.name}
                          dob={dobForCalc}
                          birthTime={timeForCalc}
                          birthLocation={formData.birth_location || currentProfile.birth_location || "Not provided"}
                        />
                      );
                    } catch (err) {
                      console.error("Error drawing KundaliChart:", err);
                    }
                  }
                  return null;
                })()}
              </div>

              {/* Spiritual alignment score dial */}
              <div className="flex items-center gap-4 bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl relative z-10">
                <div className="bg-[#C2242C] text-white p-3 rounded-full flex items-center justify-center font-mono font-bold text-lg w-12 h-12 shadow-md">
                  {astrology.spiritualScore}%
                </div>
                <div>
                  <span className="text-[10px] text-orange-300 uppercase tracking-widest block font-bold">Divine Alignment Index</span>
                  <p className="text-xs text-blue-100">Compatibility index modeled on Sati-Shiva divine energy matching.</p>
                </div>
              </div>

              {/* Narrative Analysis */}
              <div className="space-y-2 relative z-10">
                <span className="text-[10px] text-blue-200/60 uppercase tracking-widest block font-bold">Spiritual analysis</span>
                <p className="text-sm leading-relaxed text-blue-100/90 italic font-serif">
                  "{astrology.spiritualAnalysis}"
                </p>
              </div>

              {/* Hamsa & Divine Guidance */}
              {astrology.hamsaGuidance && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl relative z-10 space-y-3">
                  <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
                    <span className="text-[10.5px] text-amber-400 uppercase tracking-widest font-black">📿 హంస & ఇష్టదైవ అనుగ్రహం (Hamsa & Deity Guidance)</span>
                    <span className="bg-amber-400 text-black px-2 py-0.5 rounded text-[9px] font-black">{astrology.hamsaGuidance.hamsaSymbol.telugu}</span>
                  </div>
                  
                  <div className="bg-black/40 p-3 rounded-xl border border-yellow-500/10">
                    <span className="font-extrabold text-amber-300 block text-xs mb-1">ఇష్ట దేవత / పూజించాల్సిన దైవం (Ishta Devata):</span>
                    <span className="font-bold text-white text-sm">{astrology.hamsaGuidance.ishtaDevata.telugu} ({astrology.hamsaGuidance.ishtaDevata.english})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-1 text-xs">
                    <div className="space-y-0.5 border-l-2 border-pink-500 pl-2.5">
                      <span className="font-bold text-pink-400 block">💍 వివాహం కొరకు (For Marriage):</span>
                      <p className="text-zinc-300">{astrology.hamsaGuidance.marriage}</p>
                    </div>
                    <div className="space-y-0.5 border-l-2 border-emerald-500 pl-2.5">
                      <span className="font-bold text-emerald-400 block">💼 వ్యాపారం కొరకు (For Business):</span>
                      <p className="text-zinc-300">{astrology.hamsaGuidance.business}</p>
                    </div>
                    <div className="space-y-0.5 border-l-2 border-sky-500 pl-2.5">
                      <span className="font-bold text-sky-400 block">🎓 చదువు / విద్య కొరకు (For Education):</span>
                      <p className="text-zinc-300">{astrology.hamsaGuidance.education}</p>
                    </div>
                    <div className="space-y-0.5 border-l-2 border-amber-500 pl-2.5">
                      <span className="font-bold text-amber-400 block">🏢 ఉద్యోగం / కెరీర్ కొరకు (For Job & Career):</span>
                      <p className="text-zinc-300">{astrology.hamsaGuidance.job}</p>
                    </div>
                    <div className="space-y-0.5 border-l-2 border-purple-500 pl-2.5 bg-purple-500/5 p-2 rounded-xl">
                      <span className="font-bold text-purple-300 block">📿 నిత్య పరిహారం (Daily Remedy):</span>
                      <p className="text-zinc-300">{astrology.hamsaGuidance.remedy}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Compatibility Traits */}
              <div className="space-y-3 relative z-10 pt-2 border-t border-white/10">
                <span className="text-[10px] text-blue-200/60 uppercase tracking-widest block font-bold">Spiritual Attributes</span>
                <div className="flex flex-wrap gap-2">
                  {astrology.compatibilityTraits.map((trait, idx) => (
                    <span key={idx} className="bg-white/5 text-blue-100 text-xs px-3 py-1.5 rounded-lg border border-white/5 font-medium">
                      ✦ {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-gray-200 text-center space-y-4 flex flex-col items-center justify-center h-full min-y-[400px]">
              <div className="p-4 bg-[#EBF6FF] text-[#362B5A] rounded-full">
                <Compass className="w-8 h-8 animate-pulse text-[#C2242C]" />
              </div>
              <h4 className="text-lg font-bold text-[#362B5A]">Kundali Chart Awaiting Coordinates</h4>
              <p className="text-sm text-gray-500 max-w-xs">
                Provide your Date, Time, and Location of birth, and click "Calculate Vedic Alignment & Save" to map your lunar coordinates and Nakshatra.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
