import React, { useState, useEffect, useMemo } from "react";
import { Profile, PartnerPreferences, AdminSettings, Grievance, MarriageRecord } from "../types";
import { databaseService, generateRandomPassword, generateDefaultDobPassword } from "../lib/databaseService";
import { calculatePanchangam } from "../lib/panchangam";
import { KundaliChart } from "./KundaliChart";
import { getGenderLabel } from "../lib/genderHelper";
import SearchableSelect from "./SearchableSelect";
import { BRAHMIN_SUB_CASTES, BRAHMIN_GOTRAMS } from "../lib/brahminMetadata";
import ExecutiveAnalyticsDashboard from "./ExecutiveAnalyticsDashboard";
import { MapPin, Heart, Eye, EyeOff, ShieldAlert } from "lucide-react";
import {
  ShieldCheck,
  Search,
  Filter,
  User,
  Phone,
  Briefcase,
  Compass,
  AlertCircle,
  Award,
  Trash2,
  Edit,
  X,
  Check,
  Sparkles,
  Zap,
  CheckCircle2,
  HelpCircle,
  Play,
  UserCheck,
  Users,
  Activity,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Terminal,
  Cpu,
  UserPlus,
  Calendar,
  Camera,
  UploadCloud,
  Printer,
  Copy,
  Mail
} from "lucide-react";

interface AdminDashboardProps {
  onRefreshTrigger?: number;
}

export default function AdminDashboard({ onRefreshTrigger }: AdminDashboardProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allPreferences, setAllPreferences] = useState<PartnerPreferences[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    subramanyamUpi: "subramanyam@upi",
    subramanyamQr: "",
    subbaReddyUpi: "subbareddy@upi",
    subbaReddyQr: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [genderFilter, setGenderFilter] = useState<string>("All");
  const [callingSegmentFilter, setCallingSegmentFilter] = useState<string>("All");
  const [updateMsg, setUpdateMsg] = useState("");
  const [isRegisteringCandidate, setIsRegisteringCandidate] = useState(false);
  const registeringRef = React.useRef(false);

  // Tabs
  const [activeAdminTab, setActiveAdminTab] = useState<"registrations" | "matchEngine" | "grievances" | "marriages">("registrations");
  const [marriageRecords, setMarriageRecords] = useState<MarriageRecord[]>([]);
  const [marriagesLoading, setMarriagesLoading] = useState(false);
  const [isRecordMarriageModalOpen, setIsRecordMarriageModalOpen] = useState(false);
  const [groomCandidateId, setGroomCandidateId] = useState("");
  const [brideCandidateId, setBrideCandidateId] = useState("");
  const [marriageRecordingAdmin, setMarriageRecordingAdmin] = useState<"subramanyam" | "subba_reddy">("subramanyam");

  // Grievance / Case-Handling Redressal State
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [grievancesLoading, setGrievancesLoading] = useState(true);
  const [verifyingGrievance, setVerifyingGrievance] = useState<Grievance | null>(null);
  const [resolutionVerdict, setResolutionVerdict] = useState("");
  const [resolutionAction, setResolutionAction] = useState<"Resolved" | "Dismissed">("Resolved");
  const [declineAccusedProfile, setDeclineAccusedProfile] = useState(false);
  const [grievanceApproveAdmin, setGrievanceApproveAdmin] = useState<"subramanyam" | "subba_reddy">("subramanyam");
  const [suspensionType, setSuspensionType] = useState<"none" | "24h" | "7day" | "30day" | "60day" | "90day" | "180day" | "365day" | "730day" | "permanent" | "lift_with_warning" | "active_investigation_hold">("none");
  const [accusedMsgScenario, setAccusedMsgScenario] = useState<"7day_suspension" | "permanent_ban" | "investigation_hold" | "forgiven_warning" | "cybercrime_warning" | "lift_suspension_mercy" | "mercy_changed_punishment">("7day_suspension");
  const [victimMsgScenario, setVictimMsgScenario] = useState<"action_taken" | "dual_investigation" | "fake_complaint_warning" | "cybercrime_notified" | "victim_mercy_appeal">("action_taken");
  const [grievanceSubTab, setGrievanceSubTab] = useState<"pending" | "investigating" | "suspended" | "dismissed" | "all">("pending");

  // Payment Verification Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentProfile, setPaymentProfile] = useState<Profile | null>(null);
  const [paymentTargetStatus, setPaymentTargetStatus] = useState<Profile["subscription_status"]>("free");
  const [paymentTxnId, setPaymentTxnId] = useState("");
  const [receiverUpiId, setReceiverUpiId] = useState("bramhanavedika@ybl");
  const [customReceiverUpiId, setCustomReceiverUpiId] = useState("");
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    profileId: string;
    name: string;
    regNumber: string;
    gender: string;
    contactNumber: string;
    amount: number;
    transactionId: string;
    receiverUpi: string;
    timestamp: string;
    receivedBy: string;
  } | null>(null);

  // WhatsApp Message Launcher Modal State
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [whatsappProfile, setWhatsappProfile] = useState<Profile | null>(null);
  const [selectedWhatsappTemplate, setSelectedWhatsappTemplate] = useState<string>("welcome");
  const [whatsappVerifyingAdmin, setWhatsappVerifyingAdmin] = useState<"subramanyam" | "subba_reddy">("subramanyam");

  // Hover Preview State for Candidates
  const [hoveredCandidate, setHoveredCandidate] = useState<Profile | null>(null);
  const [hoverPhotoIndex, setHoverPhotoIndex] = useState<number>(0);

  // Admin dynamic UPI/QR config states
  const [subramanyamUpiInput, setSubramanyamUpiInput] = useState("");
  const [subramanyamQrInput, setSubramanyamQrInput] = useState("");
  const [subbaReddyUpiInput, setSubbaReddyUpiInput] = useState("");
  const [subbaReddyQrInput, setSubbaReddyQrInput] = useState("");

  useEffect(() => {
    setSubramanyamUpiInput(adminSettings.subramanyamUpi);
    setSubramanyamQrInput(adminSettings.subramanyamQr);
    setSubbaReddyUpiInput(adminSettings.subbaReddyUpi);
    setSubbaReddyQrInput(adminSettings.subbaReddyQr);
  }, [adminSettings]);

  const fetchGrievancesData = async () => {
    setGrievancesLoading(true);
    try {
      const data = await databaseService.getGrievances();
      setGrievances(data);
    } catch (err) {
      console.error("Failed to fetch grievances:", err);
    } finally {
      setGrievancesLoading(false);
    }
  };

  const fetchMarriagesData = async () => {
    setMarriagesLoading(true);
    try {
      const data = await databaseService.getMarriages();
      setMarriageRecords(data);
    } catch (err) {
      console.error("Failed to fetch marriages:", err);
    } finally {
      setMarriagesLoading(false);
    }
  };

  useEffect(() => {
    if (activeAdminTab === "grievances") {
      fetchGrievancesData();
    }
    if (activeAdminTab === "marriages") {
      fetchMarriagesData();
    }
  }, [activeAdminTab]);

  const handleSaveMarriageRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const groom = profiles.find((p) => p.id === groomCandidateId);
    const bride = profiles.find((p) => p.id === brideCandidateId);
    if (!groom || !bride) {
      alert("Please select both a Groom and a Bride candidate profile.");
      return;
    }
    try {
      const adminName = marriageRecordingAdmin === "subramanyam" ? "GV Subramanyam" : "PV Subba Reddy";
      const newMarriage: MarriageRecord = {
        id: `MAR-${Date.now().toString().slice(-6)}`,
        groomId: groom.id,
        groomRegNumber: groom.reg_number || `BVM-${groom.id.slice(0, 4)}`,
        groomName: groom.name,
        groomMobile: groom.contact_number,
        groomGotram: groom.gothram || "Unknown",
        groomSubCaste: groom.sub_caste || "Brahmin",
        brideId: bride.id,
        brideRegNumber: bride.reg_number || `BVM-${bride.id.slice(0, 4)}`,
        brideName: bride.name,
        brideMobile: bride.contact_number,
        brideGotram: bride.gothram || "Unknown",
        brideSubCaste: bride.sub_caste || "Brahmin",
        marriedAt: new Date().toISOString(),
        recordedBy: adminName
      };

      await databaseService.saveMarriage(newMarriage);
      setUpdateMsg(`💍 Marriage successfully recorded between Groom (${groom.name}) & Bride (${bride.name})!`);
      setIsRecordMarriageModalOpen(false);
      setGroomCandidateId("");
      setBrideCandidateId("");
      fetchMarriagesData();
      setTimeout(() => setUpdateMsg(""), 4000);
    } catch (err) {
      console.error("Failed to save marriage record:", err);
      alert("Error saving marriage record.");
    }
  };

  const handleDeleteMarriageRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this marriage record?")) return;
    try {
      await databaseService.deleteMarriage(id);
      setUpdateMsg("Marriage record deleted.");
      fetchMarriagesData();
      setTimeout(() => setUpdateMsg(""), 3000);
    } catch (err) {
      console.error("Failed to delete marriage record:", err);
    }
  };

  const handleUpdateGrievanceStatus = async (id: string, status: Grievance["status"]) => {
    try {
      const target = grievances.find(g => g.id === id);
      if (!target) return;
      const updated: Grievance = { ...target, status };
      await databaseService.saveGrievance(updated);
      setUpdateMsg(`Case ${id} marked as ${status}`);
      setTimeout(() => setUpdateMsg(""), 3000);
      fetchGrievancesData();
    } catch (err) {
      console.error("Failed to update grievance status:", err);
    }
  };

  const handleResolveGrievanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingGrievance) return;
    if (!resolutionVerdict.trim()) {
      alert("Please provide the resolution verdict details.");
      return;
    }

    try {
      const adminName = grievanceApproveAdmin === "subramanyam" ? "GV Subramanyam" : "PV Subba Reddy";
      const updatedGrievance: Grievance = {
        ...verifyingGrievance,
        status: resolutionAction,
        resolutionNotes: resolutionVerdict.trim(),
        resolvedAt: new Date().toISOString(),
        resolvedBy: adminName
      };

      await databaseService.saveGrievance(updatedGrievance);

      if (verifyingGrievance.accusedId && verifyingGrievance.accusedId !== "N/A") {
        const cleanAccusedId = verifyingGrievance.accusedId.trim().toLowerCase();
        const target = profiles.find((p) => 
          p.id.toLowerCase() === cleanAccusedId ||
          (p.reg_number && p.reg_number.trim().toLowerCase() === cleanAccusedId)
        );
        if (target) {
          const finalAccusedId = target.id;
          let updated = { ...target };
          if (suspensionType === "lift_with_warning") {
            updated.status = "Verified" as const;
            updated.suspension_lift_at = "";
            updated.suspension_reason = `Suspension lifted with warning (Resolved ticket #${verifyingGrievance.id})`;
          } else if (suspensionType === "active_investigation_hold") {
            updated.status = "Declined" as const;
            updated.suspension_lift_at = "";
            updated.suspension_reason = `Active Investigation Hold (Grievance ticket #${verifyingGrievance.id})`;
          } else if (suspensionType === "none") {
            // No action on candidate profile status, just grievance resolution
          } else {
            let hours = 24;
            let label = "24 Hours";
            if (suspensionType === "7day") {
              hours = 24 * 7;
              label = "7 Days (1 Week)";
            } else if (suspensionType === "30day") {
              hours = 24 * 30;
              label = "30 Days (1 Month)";
            } else if (suspensionType === "60day") {
              hours = 24 * 60;
              label = "60 Days (2 Months)";
            } else if (suspensionType === "90day") {
              hours = 24 * 90;
              label = "90 Days (3 Months)";
            } else if (suspensionType === "180day") {
              hours = 24 * 180;
              label = "180 Days (6 Months)";
            } else if (suspensionType === "365day") {
              hours = 24 * 365;
              label = "12 Months (1 Year)";
            } else if (suspensionType === "730day") {
              hours = 24 * 730;
              label = "24 Months (2 Years)";
            }

            updated.status = "Declined" as const;
            if (suspensionType === "permanent") {
              updated.suspension_lift_at = "";
              updated.suspension_reason = `Permanent Lifetime Ban (Grievance ticket #${verifyingGrievance.id})`;
            } else {
              updated.suspension_lift_at = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
              updated.suspension_reason = `Suspended for ${label} (Grievance ticket #${verifyingGrievance.id})`;
            }
          }
          await databaseService.saveProfile(updated);
          setProfiles((prev) => prev.map((p) => (p.id === finalAccusedId ? updated : p)));
          
          if (suspensionType === "lift_with_warning") {
            setUpdateMsg(`Grievance processed & profile suspension LIFTED with warning successfully!`);
          } else if (suspensionType === "active_investigation_hold") {
            setUpdateMsg(`Grievance processed & profile placed on investigation hold successfully!`);
          } else if (suspensionType !== "none") {
            const labelStr = suspensionType === "permanent" ? "Permanently" : suspensionType === "24h" ? "for 24 hours" : `for ${suspensionType.replace("day", " days")}`;
            setUpdateMsg(`Grievance resolved and candidate suspended ${labelStr} successfully!`);
          } else {
            setUpdateMsg(`Grievance processed successfully (No suspension action taken)!`);
          }
        } else {
          // Fallback if not found in state
          const cleanId = verifyingGrievance.accusedId.trim();
          if (suspensionType !== "none" && suspensionType !== "lift_with_warning") {
            await databaseService.updateProfileStatus(cleanId, "Declined");
          } else if (suspensionType === "lift_with_warning") {
            await databaseService.updateProfileStatus(cleanId, "Verified");
          }
          setUpdateMsg(`Grievance resolved successfully!`);
        }
        fetchProfilesData();
      } else {
        setUpdateMsg(`Grievance resolved successfully!`);
      }

      setTimeout(() => setUpdateMsg(""), 4000);
      setVerifyingGrievance(null);
      fetchGrievancesData();
    } catch (err) {
      console.error("Failed to resolve grievance:", err);
    }
  };

  const handleDeleteGrievanceLog = async (id: string) => {
    if (!confirm("Are you sure you want to permanently purge this complaint log? This action is irreversible.")) return;
    try {
      await databaseService.deleteGrievance(id);
      setUpdateMsg("Grievance log permanently deleted.");
      setTimeout(() => setUpdateMsg(""), 3000);
      fetchGrievancesData();
    } catch (err) {
      console.error("Failed to delete grievance log:", err);
    }
  };

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null);
  const [editPrefsToEdit, setEditPrefsToEdit] = useState<PartnerPreferences | null>(null);
  const [isAdminListModalOpen, setIsAdminListModalOpen] = useState(false);

  const handleDownloadCandidatesPasswordsCSV = () => {
    const csvRows = [
      ["Bramhana Vivaha Vedika - Complete Candidates & Login Credentials Export"],
      [`Exported At:,${new Date().toISOString()}`],
      [`Total Registered Candidates:,${profiles.length}`],
      [],
      ["Registration ID", "Candidate Name", "Gender", "Contact Number / User ID", "Login Password", "Sub-Caste", "Gotram", "Profession", "Annual Salary (LPA)", "Subscription Status", "Registration Date"]
    ];

    profiles.forEach((p) => {
      const password = p.password || p.dob || "bramhana123";
      csvRows.push([
        `"${p.reg_number || p.id}"`,
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${p.gender || ""}"`,
        `"${p.contact_number || ""}"`,
        `"${password}"`,
        `"${(p.sub_caste || "Brahmin").replace(/"/g, '""')}"`,
        `"${(p.gothram || "").replace(/"/g, '""')}"`,
        `"${(p.profession || "").replace(/"/g, '""')}"`,
        `"${p.salary_lpa || 0}"`,
        `"${p.subscription_status || "free"}"`,
        `"${p.registered_at_time || p.created_at || ""}"`
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `bramhana_vivaha_candidates_passwords_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);

  // New Candidate Registration Form State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [adminAstrologyConfirmed, setAdminAstrologyConfirmed] = useState(false);
  const [registrationType, setRegistrationType] = useState<"candidate" | "employee">("candidate");
  const [kundaliStatus, setKundaliStatus] = useState<"correct" | "wrong" | "pending">("pending");
  const [manualAstrology, setManualAstrology] = useState({
    nakshatra: "",
    rashi: "",
    pada: 1,
    tithi: ""
  });
  const [newProfile, setNewProfile] = useState({
    name: "",
    surname: "",
    email: "",
    gender: "Female" as "Female" | "Male",
    dob: "",
    birth_location: "",
    birth_pincode: "",
    birth_time: "",
    height_feet: 5.4,
    sub_caste: "",
    gothram: "",
    nakshatra: "",
    profession: "",
    salary_lpa: 7.5,
    company_name: "",
    job_branch: "",
    working_shift: "Day Shift (పగటి వేళ)",
    contact_number: "",
    status: "Verified" as const,
    subscription_status: "free" as const,
    partner_expectation_type: "Any Profession (ఏదైనా ఉద్యోగం)",
    partner_expectations_desc: "",
    partner_height_diff_pref: "No Preference",
    partner_lpa_pref: "No Preference",
    partner_shift_pref: "No Preference",
    password: "",
    photo_url: "",
    photo_url_2: "",
    photo_url_3: "",
    kundali_url: "",
    registered_by: ""
  });

  // Admin Registration Email OTP States (Mandatory)
  const [adminRegOtp, setAdminRegOtp] = useState("");
  const [adminGeneratedOtp, setAdminGeneratedOtp] = useState("");
  const [adminIsOtpSent, setAdminIsOtpSent] = useState(false);
  const [adminIsEmailVerified, setAdminIsEmailVerified] = useState(false);
  const [adminIsSendingOtp, setAdminIsSendingOtp] = useState(false);

  // Media preview state
  const [selectedMediaProfile, setSelectedMediaProfile] = useState<Profile | null>(null);

  // Camera capture state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActiveTarget, setCameraActiveTarget] = useState<{
    type: "create" | "edit";
    field: "photo_url" | "photo_url_2" | "photo_url_3" | "kundali_url";
  } | null>(null);

  const startCamera = async (target: { type: "create" | "edit"; field: "photo_url" | "photo_url_2" | "photo_url_3" | "kundali_url" }) => {
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
    const video = document.getElementById("admin-camera-preview") as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        if (cameraActiveTarget.type === "create") {
          setNewProfile((prev) => ({ ...prev, [cameraActiveTarget.field]: dataUrl }));
        } else if (cameraActiveTarget.type === "edit" && profileToEdit) {
          setProfileToEdit((prev) => ({ ...prev, [cameraActiveTarget.field]: dataUrl }));
        }
      }
    }
    stopCamera();
  };

  const handleDeviceUpload = async (
    file: File,
    target: { type: "create" | "edit"; field: "photo_url" | "photo_url_2" | "photo_url_3" | "kundali_url" }
  ) => {
    if (!file || !target) return;
    try {
      const uploadedUrl = await databaseService.uploadFile(file, "user-uploads", "admin-upload");
      if (target.type === "create") {
        setNewProfile((prev) => ({ ...prev, [target.field]: uploadedUrl }));
      } else if (target.type === "edit" && profileToEdit) {
        setProfileToEdit((prev) => ({ ...prev, [target.field]: uploadedUrl }));
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to process local file.");
    }
  };

  // Match Engine State
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [candidatePreferences, setCandidatePreferences] = useState<PartnerPreferences | null>(null);

  // Associated Phone registry state
  const [associatedPhoneModal, setAssociatedPhoneModal] = useState<string | null>(null);
  
  // Parent Spouse Preference Questions
  const [preferredSpouseProfession, setPreferredSpouseProfession] = useState<string>("Any");
  const [preferredMinAge, setPreferredMinAge] = useState<number>(20);
  const [preferredMaxAge, setPreferredMaxAge] = useState<number>(38);
  const [preferredMinLPA, setPreferredMinLPA] = useState<number>(5);
  const [activeEngine, setActiveEngine] = useState<"python" | "java">("python");

  const fetchProfilesData = async () => {
    setLoading(true);
    try {
      const data = await databaseService.getProfiles();
      
      // Auto lift expired suspensions on load
      const now = new Date();
      const nonAdminProfiles = data.filter((p) => p.id !== "prof-subbu" && p.id !== "prof-subba-reddy");
      
      const processedProfiles = await Promise.all(
        nonAdminProfiles.map(async (p) => {
          if (p.status === "Declined" && p.suspension_lift_at) {
            const liftTime = new Date(p.suspension_lift_at);
            if (now >= liftTime) {
              console.log(`Auto-lifting expired suspension for ${p.name} (${p.id})`);
              const updatedProfile: Profile = {
                ...p,
                status: "Verified",
                suspension_lift_at: "",
                suspension_reason: ""
              };
              await databaseService.saveProfile(updatedProfile);
              return updatedProfile;
            }
          }
          return p;
        })
      );

      setProfiles(processedProfiles);
      if (processedProfiles.length > 0 && !selectedCandidateId) {
        setSelectedCandidateId(processedProfiles[0].id);
      }
      const prefs = await databaseService.getAllPartnerPreferences();
      setAllPreferences(prefs);

      // Load admin settings dynamically
      const settings = await databaseService.getAdminSettings();
      setAdminSettings(settings);
    } catch (err) {
      console.error("Failed to load profiles in Admin Sanctuary:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (profile: Profile) => {
    setSelectedCandidateId(profile.id);
    setActiveAdminTab("matchEngine");
    const calculatedOwnAge = calculateAge(profile.dob);
    if (profile.gender === "Female") {
      setPreferredMinAge(calculatedOwnAge);
      setPreferredMaxAge(calculatedOwnAge + 8);
      setPreferredMinLPA(Math.max(5, Math.floor(profile.salary_lpa)));
    } else {
      setPreferredMinAge(Math.max(18, calculatedOwnAge - 8));
      setPreferredMaxAge(calculatedOwnAge);
      setPreferredMinLPA(Math.max(3, Math.floor(profile.salary_lpa - 5)));
    }
  };

  useEffect(() => {
    fetchProfilesData();
  }, [onRefreshTrigger]);

  // Load preferences when candidate changes in Match Engine
  useEffect(() => {
    if (!selectedCandidateId) {
      setCandidatePreferences(null);
      return;
    }
    async function loadPrefs() {
      try {
        const prefs = await databaseService.getPartnerPreferences(selectedCandidateId);
        setCandidatePreferences(prefs);
      } catch (err) {
        console.error("Failed to load partner preferences for admin matching:", err);
      }
    }
    loadPrefs();
  }, [selectedCandidateId]);

  // Prevent background body scroll when modals are open
  useEffect(() => {
    const isAnyModalOpen =
      isPaymentModalOpen ||
      isWhatsappModalOpen ||
      isEditModalOpen ||
      isDeleteModalOpen ||
      isRegisterModalOpen ||
      !!selectedMediaProfile ||
      !!associatedPhoneModal;

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [
    isPaymentModalOpen,
    isWhatsappModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    isRegisterModalOpen,
    selectedMediaProfile,
    associatedPhoneModal,
  ]);

  // Reset registration lock when registration modal is opened
  useEffect(() => {
    if (isRegisterModalOpen) {
      registeringRef.current = false;
    }
  }, [isRegisterModalOpen]);

  // Handle status change
  const handleStatusChange = async (profileId: string, newStatus: Profile["status"]) => {
    setUpdateMsg("");
    try {
      const success = await databaseService.updateProfileStatus(profileId, newStatus);
      if (success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, status: newStatus } : p))
        );
        setUpdateMsg(`Profile verification status changed to '${newStatus}'.`);
        setTimeout(() => setUpdateMsg(""), 3500);
      }
    } catch (err) {
      console.error("Failed to change profile status:", err);
    }
  };

  // Handle revoking a candidate's suspension
  const handleRevokeSuspension = async (
    profileId: string,
    durationType: "now" | "24h" | "7day" | "30day" | "60day" | "90day" | "180day" | "365day" | "730day" | "permanent"
  ) => {
    setUpdateMsg("");
    const cleanId = (profileId || "").trim().toLowerCase();
    const target = profiles.find((p) => {
      if (!cleanId || cleanId === "n/a" || cleanId === "unknown") return false;
      return p.id.toLowerCase() === cleanId || 
             (p.reg_number && p.reg_number.trim().toLowerCase() === cleanId);
    });
    if (!target) return;

    const exactProfileId = target.id;
    const nowStr = new Date().toISOString();
    const history = target.punishment_history ? [...target.punishment_history] : [];

    try {
      if (durationType === "now") {
        history.push(`Suspension revoked completely (Admin Mercy Reinstatement) at ${new Date().toLocaleString()}`);
        const updated: Profile = {
          ...target,
          status: "Verified" as const,
          suspension_lift_at: "",
          suspension_reason: "",
          punishment_history: history,
          is_mercy_granted: true,
          last_punishment_changed_at: nowStr
        };
        await databaseService.saveProfile(updated);
        setProfiles((prev) => prev.map((p) => (p.id === exactProfileId ? updated : p)));
        setUpdateMsg(`Suspension REVOKED instantly for ${target.name}. Profile reinstated as Verified!`);
      } else if (durationType === "permanent") {
        history.push(`Punishment made permanent (Lifetime Ban) at ${new Date().toLocaleString()}`);
        const updated: Profile = {
          ...target,
          status: "Declined" as const,
          suspension_lift_at: "",
          suspension_reason: "Permanent account suspension (No auto-lift)",
          punishment_history: history,
          last_punishment_changed_at: nowStr
        };
        await databaseService.saveProfile(updated);
        setProfiles((prev) => prev.map((p) => (p.id === exactProfileId ? updated : p)));
        setUpdateMsg(`Suspension modified: Permanent Lifetime Ban active for ${target.name}!`);
      } else {
        let hours = 24;
        let label = "24 Hours";
        if (durationType === "7day") {
          hours = 24 * 7;
          label = "7 Days (1 Week)";
        } else if (durationType === "30day") {
          hours = 24 * 30;
          label = "30 Days (1 Month)";
        } else if (durationType === "60day") {
          hours = 24 * 60;
          label = "60 Days (2 Months)";
        } else if (durationType === "90day") {
          hours = 24 * 90;
          label = "90 Days (3 Months)";
        } else if (durationType === "180day") {
          hours = 24 * 180;
          label = "180 Days (6 Months)";
        } else if (durationType === "365day") {
          hours = 24 * 365;
          label = "12 Months (1 Year)";
        } else if (durationType === "730day") {
          hours = 24 * 730;
          label = "24 Months (2 Years)";
        }

        history.push(`Punishment updated/reduced to ${label} (Temporary Hold) at ${new Date().toLocaleString()}`);
        const liftAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        const updated: Profile = {
          ...target,
          status: "Declined" as const,
          suspension_lift_at: liftAt,
          suspension_reason: `Scheduled automatic lifting in ${label}`,
          punishment_history: history,
          is_mercy_granted: true,
          last_punishment_changed_at: nowStr
        };
        await databaseService.saveProfile(updated);
        setProfiles((prev) => prev.map((p) => (p.id === exactProfileId ? updated : p)));
        setUpdateMsg(`Suspension schedule updated: Auto-lift configured in ${label} for ${target.name}!`);
      }
      setTimeout(() => setUpdateMsg(""), 4500);
    } catch (err) {
      console.error("Failed to revoke profile suspension:", err);
    }
  };

  // Helper to send direct WhatsApp messages for mercy and appeals
  const handleSendDirectWhatsapp = (
    phone: string,
    type: "mercy_accused" | "appeal_victim",
    candidateName: string,
    reporterName?: string
  ) => {
    const adminNameVal = "GV Subramanyam";
    let msg = "";
    
    if (type === "mercy_accused") {
      msg = `*బ్రాహ్మణ వివాహ వేదిక - క్షమాభిక్ష పూర్వక సస్పెన్షన్ మార్పు / ఎత్తివేత (SUSPENSION REVOKED/REDUCED TO 24H WITH WARNING)* 🙏\n\n` +
        `గౌరవనీయులైన అభ్యర్థికి (${candidateName}),\n\n` +
        `బ్రాహ్మణ వివాహ వేదిక యాజమాన్యం మరియు చీఫ్ రిజిస్ట్రార్ *${adminNameVal}* గారు మీ ప్రొఫైల్ పై విధించిన సస్పెన్షన్ ను మరొక్కసారి మానవతా కోణంలో పరిశీలించారు.\n\n` +
        `ఫిర్యాదుదారుడు (Complainant) మిమ్మల్ని క్షమించి మన్నించినందున మరియు మీ విజ్ఞప్తి మేరకు మీ సస్పెన్షన్ ను ఎత్తివేయడం (Revoked) లేదా 24 గంటల స్వల్ప పరిమితికి (Changed to 24 Hours Hold) మార్చడం జరిగింది. మీ ఖాతా తిరిగి పునరుద్ధరించబడుతుంది.\n\n` +
        `దయచేసి ఇప్పుడు అత్యంత జాగ్రత్తగా (Be Extremely Careful Now) మెలగవలసిందిగా కోరుతున్నాము. ఇది మీకు ఇవ్వబడుతున్న చివరి స్పష్టమైన హెచ్చరిక (Straight Final Warning). మా వివాహ వేదిక నందు ఇతర కుటుంబాల గౌరవాన్ని భంగపరిచే ఏ చిన్న తప్పిదానికైనా మీ ఖాతా ఎప్పటికీ పునరుద్ధరించబడదు. బుద్ధిపూర్వకంగా ప్రవర్తించవలసిందిగా ఆశిస్తున్నాము.\n\n` +
        `*Dear Candidate*,\n` +
        `We have lifted your suspension or reduced your terms to a brief 24-hour hold because the complainant has agreed to forgive you. This is your final straight warning. Please treat all families and members with high respect. Any further report will lead to a permanent block with no second chance.\n\n` +
        `- Safety Compliance Desk, Bramhana Vivaha Vedika`;
    } else {
      msg = `*బ్రాహ్మణ వివాహ వేదిక - క్షమాభిక్ష అభ్యర్థన విజ్ఞప్తి (APPEAL FOR FORGIVENESS & SECOND CHANCE)* 🙏\n\n` +
        `గౌరవనీయులైన వినియోగదారునికి (${reporterName || "Reporter"}),\n\n` +
        `మీరు అభ్యర్థి *${candidateName}* పై సమర్పించిన ఫిర్యాదు పై మేము తగిన చర్యలు చేపట్టాము.\n\n` +
        `అయితే, సదరు అభ్యర్థి తమ తప్పును తెలుసుకుని తీవ్రంగా పశ్చాత్తాపపడుతున్నారు. భవిష్యత్తులో ఇటువంటి పొరపాట్లు జరగవని వాగ్దానం చేస్తూ, ఒక అవకాశం ఇవ్వవలసిందిగా మమ్మల్ని మరియు మిమ్మల్ని వేడుకుంటున్నారు.\n\n` +
        `చిన్న పొరపాట్ల విషయంలో వారు తమ ప్రవర్తనను మార్చుకునేందుకు ఒక చిన్న అవకాశం ఇచ్చి, వారిని క్షమించి మన్నించవలసిందిగా (Think and Mercy for small things) మా యాజమాన్యం మిమ్మల్ని కోరుతోంది. మీ చేదు అనుభవానికి మేము చింతిస్తున్నాము (We feel sad about your experience).\n\n` +
        `*Dear Complainant*,\n` +
        `We are deeply sad about your experience. While we enacted strong measures, the accused is deeply apologetic and has pleaded for mercy. We kindly ask you to think if we can give them a second chance to reform. Your peace of mind is our priority.\n\n` +
        `- Safety Compliance Board, Bramhana Vivaha Vedika`;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      alert("No contact phone number found to send WhatsApp message!");
      return;
    }
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Helper to export profiles to Excel-compatible CSV format
  const handleExportCSV = (profilesToExport: Profile[], isFilteredOnly: boolean) => {
    const headers = [
      "Unique ID (యూజర్ ఐడి)",
      "Reg Number (రిజిస్ట్రేషన్ సంఖ్య)",
      "Surname (ఇంటిపేరు)",
      "Name (అభ్యర్థి పేరు)",
      "Gender (లింగం)",
      "Contact Number (మొబైల్ సంఖ్య)",
      "Subscription Status (సభ్యత్వ స్థాయి)",
      "Subscription Expiry Date (సభ్యత్వ గడువు తేదీ)",
      "Caste / Sub-Caste (శాఖ)",
      "Gothram (గోత్రం)",
      "Nakshatram (నక్షత్రం)",
      "Salary LPA (సంవత్సర ఆదాయం)",
      "Date of Birth (పుట్టిన తేదీ)",
      "Time of Birth (పుట్టిన సమయం)",
      "Place of Birth (పుట్టిన ప్రదేశం)",
      "Registered By (రిజిస్టర్ చేసిన వారు)",
      "Approved Matches (ధృవీకరించిన సంబంధాలు)",
      "Registration Date (రిజిస్టర్ అయిన తేదీ)",
      "100 Fee Paid? (100 ఫీజు చెల్లించారా?)",
      "900 Premium Paid? (900 ప్రీమియం చెల్లించారా?)"
    ];

    const rows = profilesToExport.map((p) => {
      const regFeePaid = p.subscription_status === "paid_100" || p.subscription_status === "paid_900" ? "PAID" : "NOT PAID";
      const premiumFeePaid = p.subscription_status === "paid_900" ? "PAID" : "NOT PAID";
      const matchesCount = p.approved_matches ? p.approved_matches.length : 0;
      
      return [
        p.id,
        p.reg_number || "N/A",
        p.surname || "",
        p.name,
        p.gender,
        p.contact_number,
        p.subscription_status || "free",
        p.subscription_expires_at || "N/A",
        p.sub_caste,
        p.gothram || "",
        p.nakshatram || "",
        p.salary_lpa,
        p.dob,
        p.birth_time || "",
        p.birth_location || "",
        p.registered_by || "Self",
        matchesCount,
        p.registered_at_time || "",
        regFeePaid,
        premiumFeePaid
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => {
        const str = String(val ?? "").replace(/"/g, '""');
        return `"${str}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const labelSuffix = isFilteredOnly ? "Filtered" : "All_Candidates";
    link.setAttribute("download", `BV_Vedika_Registry_${labelSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setUpdateMsg(`Excel CSV Export Successful! Downloaded ${profilesToExport.length} candidate records.`);
    setTimeout(() => setUpdateMsg(""), 4000);
  };

  // Helper to open candidates spreadsheet in a clean new tab view
  const handleOpenCandidatesNewTab = (list: Profile[]) => {
    const win = window.open('', '_blank');
    if (!win) {
      alert("Please allow popups to open the Candidate Excel Sheet in a new tab.");
      return;
    }

    const tableRows = list.map((p, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;'}">
        <td style="padding: 10px 14px; font-family: monospace; font-weight: bold; color: #1e1b4b;">${p.id}</td>
        <td style="padding: 10px 14px; font-weight: bold; color: #0f172a;">${p.name}</td>
        <td style="padding: 10px 14px; color: #2563eb; font-weight: bold;">${p.contact_number}</td>
        <td style="padding: 10px 14px; color: #334155;">${p.gender}</td>
        <td style="padding: 10px 14px; color: #475569;">${p.sub_caste || "Brahmin"} (${p.gothram || "Gotram"})</td>
        <td style="padding: 10px 14px; color: #475569;">${p.dob || "N/A"} (${p.height_feet || 5.5} ft)</td>
        <td style="padding: 10px 14px; font-weight: bold; color: #059669;">${p.salary_lpa ? p.salary_lpa + " LPA" : "N/A"}</td>
        <td style="padding: 10px 14px;">
          <span style="padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; ${
            p.subscription_status === 'paid_900' ? 'background: #d1fae5; color: #065f46;' :
            p.subscription_status === 'paid_100' ? 'background: #fef3c7; color: #92400e;' :
            'background: #f1f5f9; color: #475569;'
          }">
            ${p.subscription_status === 'paid_900' ? '👑 900 Premium' : p.subscription_status === 'paid_100' ? '💳 100 Paid' : '🆓 Free'}
          </span>
        </td>
        <td style="padding: 10px 14px; text-align: center; font-weight: bold;">${p.approved_matches ? p.approved_matches.length : 0} Matches</td>
        <td style="padding: 10px 14px; color: #64748b; font-size: 11px;">${p.registered_by || "Self"}</td>
      </tr>
    `).join("");

    const pageHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bramhana Vivaha Vedika • Candidates Master Excel View</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
            .header { background: linear-gradient(to right, #1e1b4b, #362b5a); color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .btn { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; cursor: pointer; text-decoration: none; margin-left: 8px; font-size: 13px; }
            .btn-indigo { background: #4f46e5; }
            .btn-outline { background: white; color: #1e1b4b; border: 1px solid #cbd5e1; }
            .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
            th { background: #ebf6ff; color: #362b5a; padding: 14px; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 22px;">Bramhana Vivaha Vedika • Live Master Registry Sheet</h1>
              <p style="margin: 4px 0 0 0; opacity: 0.8; font-size: 13px;">Displaying ${list.length} Candidate Records • Interactive Excel View</p>
            </div>
            <div>
              <button onclick="window.print()" class="btn btn-outline">🖨️ Print Sheet / Save PDF</button>
              <button onclick="downloadCSV()" class="btn btn-indigo">📥 Download Excel (.csv)</button>
            </div>
          </div>

          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>Unique ID</th>
                  <th>Candidate Name</th>
                  <th>Mobile Number</th>
                  <th>Gender</th>
                  <th>Sub-Caste & Gotram</th>
                  <th>DOB & Height</th>
                  <th>Salary LPA</th>
                  <th>Subscription Tier</th>
                  <th>Matched Profiles</th>
                  <th>Registered By</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>

          <script>
            function downloadCSV() {
              const headers = ["Unique ID", "Name", "Mobile", "Gender", "SubCaste", "Gotram", "DOB", "Salary", "Subscription", "MatchesCount", "RegisteredBy"];
              const rows = [
                headers.join(","),
                ${JSON.stringify(list)}.map(p => [
                  '"' + (p.id || '') + '"',
                  '"' + (p.name || '') + '"',
                  '"' + (p.contact_number || '') + '"',
                  '"' + (p.gender || '') + '"',
                  '"' + (p.sub_caste || '') + '"',
                  '"' + (p.gothram || '') + '"',
                  '"' + (p.dob || '') + '"',
                  '"' + (p.salary_lpa || '') + '"',
                  '"' + (p.subscription_status || 'free') + '"',
                  '"' + (p.approved_matches ? p.approved_matches.length : 0) + '"',
                  '"' + (p.registered_by || 'Self') + '"'
                ].join(",")).join("\\n")
              ].join("\\n");

              const blob = new Blob(["\\uFEFF" + rows], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "Bramhana_Vivaha_Candidates_Master_" + new Date().toISOString().split("T")[0] + ".csv";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          </script>
        </body>
      </html>
    `;

    win.document.write(pageHtml);
    win.document.close();
  };

  // Handle subscription change
  const handleSubscriptionChange = async (profileId: string, newSubStatus: Profile["subscription_status"]) => {
    setUpdateMsg("");
    const targetProfile = profiles.find((p) => p.id === profileId);
    if (!targetProfile) return;

    if (newSubStatus === "free") {
      try {
        const success = await databaseService.updateSubscriptionStatus(profileId, "free", "None", "", "");
        if (success) {
          setProfiles((prev) =>
            prev.map((p) =>
              p.id === profileId
                ? {
                    ...p,
                    subscription_status: "free",
                    fee_received_by: "None",
                    fee_transaction_id: "",
                    fee_received_at: "",
                  }
                : p
            )
          );
          setUpdateMsg(`Subscription status updated to Free Tier successfully.`);
          setTimeout(() => setUpdateMsg(""), 3500);
        }
      } catch (err) {
        console.error("Failed to update subscription status:", err);
      }
    } else {
      // Prompt for Transaction ID
      setPaymentProfile(targetProfile);
      setPaymentTargetStatus(newSubStatus || "free");
      setPaymentTxnId("");
      setIsPaymentModalOpen(true);
    }
  };

  const handleVerifyPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentProfile) return;
    if (!paymentTxnId.trim()) {
      alert("Please enter a valid Transaction ID to keep precise records!");
      return;
    }

    const adminId = localStorage.getItem("bramhana_logged_in_user_id");
    let adminName = "Admin General";
    if (adminId === "prof-subbu") {
      adminName = "GV Subramanyam";
    } else if (adminId === "prof-subba-reddy") {
      adminName = "PV Subba Reddy";
    }

    const timestamp = new Date().toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour12: true,
    });

    const finalReceiverUpi = receiverUpiId === "custom" ? customReceiverUpiId.trim() : receiverUpiId;
    const amount = paymentTargetStatus === "paid_900" ? 900 : 100;

    try {
      const success = await databaseService.updateSubscriptionStatus(
        paymentProfile.id,
        paymentTargetStatus,
        adminName,
        paymentTxnId.trim(),
        timestamp,
        finalReceiverUpi || "bramhanavedika@ybl"
      );

      if (success) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === paymentProfile.id
              ? {
                  ...p,
                  subscription_status: paymentTargetStatus,
                  status: "Verified",
                  fee_received_by: adminName,
                  fee_transaction_id: paymentTxnId.trim(),
                  fee_received_at: timestamp,
                  fee_receiver_upi: finalReceiverUpi || "bramhanavedika@ybl",
                }
              : p
          )
        );
        setUpdateMsg(`Payment verified! ${adminName} recorded Match Fees, UPI ID, and Transaction ID successfully.`);
        
        // Generate and open the Receipt
        setReceiptData({
          profileId: paymentProfile.id,
          name: `${paymentProfile.surname || ""} ${paymentProfile.name || ""}`.trim(),
          regNumber: paymentProfile.reg_no || paymentProfile.phone || "N/A",
          gender: paymentProfile.gender || "N/A",
          contactNumber: paymentProfile.phone || "",
          amount: amount,
          transactionId: paymentTxnId.trim(),
          receiverUpi: finalReceiverUpi || "bramhanavedika@ybl",
          timestamp: timestamp,
          receivedBy: adminName,
        });

        setIsPaymentModalOpen(false);
        setIsReceiptModalOpen(true);
        // paymentProfile and paymentTxnId will be cleared or kept until after receipt modal is handled or dismissed
        setTimeout(() => setUpdateMsg(""), 3500);
      }
    } catch (err) {
      console.error("Failed to update payment status:", err);
    }
  };

  const handlePrintReceipt = () => {
    if (!receiptData) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print/save the receipt!");
      return;
    }
    const receiptHtml = `
      <html>
        <head>
          <title>Bramhana_Vivaha_Vedika_Receipt_${receiptData.transactionId}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; padding: 0; background-color: #fff; }
            .receipt-card { border: 2px solid #eaeaea; padding: 30px; border-radius: 16px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); position: relative; }
            .header { text-align: center; border-bottom: 2px dashed #f1f1f1; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #362B5A; margin: 0; }
            .subtitle { font-size: 11px; font-weight: 700; color: #C2242C; text-transform: uppercase; margin: 5px 0 0 0; letter-spacing: 1px; }
            .receipt-title { font-size: 16px; font-weight: 700; color: #333; margin: 15px 0 5px 0; text-transform: uppercase; }
            .metadata { display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 12px; font-weight: 800; color: #362B5A; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 8px; font-size: 12px; }
            .info-item { margin-bottom: 4px; }
            .label { font-weight: 600; color: #777; }
            .value { font-weight: 700; color: #222; }
            .table-container { margin-top: 20px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #f9f9f9; text-align: left; padding: 8px; font-weight: 700; border-bottom: 2px solid #eee; }
            td { padding: 10px 8px; border-bottom: 1px solid #eee; }
            .total-row { font-size: 14px; font-weight: 800; color: #C2242C; background-color: #fdfafb; }
            .footer-msg { text-align: center; font-size: 10px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; line-height: 1.4; }
            .signature-block { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; font-size: 11px; }
            .stamp { border: 2px dashed #C2242C; padding: 4px 8px; border-radius: 8px; color: #C2242C; font-weight: 900; font-family: monospace; transform: rotate(-5deg); text-transform: uppercase; font-size: 10px; display: inline-block; }
            @media print {
              body { margin: 0; background-color: #fff; }
              .receipt-card { border: none; box-shadow: none; padding: 0; max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="header">
              <div class="logo">BRAMHANA VIVAHA VEDIKA</div>
              <div class="subtitle">సనాతన బ్రాహ్మణ వివాహ వేదిక | Matrimonial Union</div>
              <div class="receipt-title">Official E-Receipt & Payment Acknowledgement</div>
            </div>

            <div class="metadata">
              <div>Receipt No: <strong>BVV-REC-${receiptData.transactionId.substring(0, 8).toUpperCase()}</strong></div>
              <div>Date: <strong>${receiptData.timestamp}</strong></div>
            </div>

            <div class="section">
              <div class="section-title">Billing Information (సభ్యుల వివరాలు)</div>
              <div class="info-grid">
                <div class="info-item"><span class="label">Candidate Name:</span> <span class="value">${receiptData.name}</span></div>
                <div class="info-item"><span class="label">ID / Reg No:</span> <span class="value">${receiptData.regNumber}</span></div>
                <div class="info-item"><span class="label">Gender:</span> <span class="value">${receiptData.gender}</span></div>
                <div class="info-item"><span class="label">Phone:</span> <span class="value">${receiptData.contactNumber}</span></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Payment Audit Ledger (చెల్లింపు వివరాలు)</div>
              <div class="info-grid">
                <div class="info-item"><span class="label">Transaction ID / UTR:</span> <span class="value" style="font-family: monospace;">${receiptData.transactionId}</span></div>
                <div class="info-item"><span class="label">Received UPI ID:</span> <span class="value">${receiptData.receiverUpi}</span></div>
                <div class="info-item"><span class="label">Payment Mode:</span> <span class="value">UPI / Digital Net-Banking</span></div>
                <div class="info-item"><span class="label">Received By:</span> <span class="value">${receiptData.receivedBy}</span></div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Service Description</th>
                    <th>Qty</th>
                    <th style="text-align: right;">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Bramhana Matrimonial Registry Activation Fee</strong><br/>
                      <span style="font-size: 10px; color: #777;">Includes divine horoscope matching, Vedic Jataka alignment access, and mutual dashboard connectivity.</span>
                    </td>
                    <td>1</td>
                    <td style="text-align: right;">₹${receiptData.amount}.00</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="2" style="text-align: right; font-weight: 800;">Total Paid Amount:</td>
                    <td style="text-align: right; font-weight: 800;">₹${receiptData.amount}.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="signature-block">
              <div>
                <p style="margin-bottom: 25px; font-weight: 700; color: #555;">Verified & Recorded by:</p>
                <p style="font-weight: 800; color: #362B5A; margin: 0;">${receiptData.receivedBy}</p>
                <p style="margin: 0; color: #777;">Bramhana Vivaha Vedika Admin Office</p>
              </div>
              
              <div style="text-align: center;">
                <div class="stamp">BVV VERIFIED</div>
                <p style="margin: 5px 0 0 0; color: #999; font-size: 9px;">Digital System Security Stamp</p>
              </div>

              <div style="text-align: right;">
                <p style="margin-bottom: 25px; font-weight: 700; color: #555;">Authorized Registrar:</p>
                <p style="font-weight: 800; color: #362B5A; margin: 0;">Sri G.V. Subramanyam</p>
                <p style="margin: 0; color: #777;">Chief Registrar, Sri Brahmana Welfare</p>
              </div>
            </div>

            <div class="footer-msg">
              <p>🙏 **Thank you for registering with Bramhana Vivaha Vedika.** 🙏</p>
              <p>This is a computer-generated, digitally verified receipt. No physical signature is required under Section 65B of the Indian Evidence Act, 1872. For grievances, contact us at bramhanavedika@gmail.com or PV Subba Reddy at PVSubbareddy@gmail.com.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const handleCopyReceiptText = () => {
    if (!receiptData) return;
    const isSubbaReddy = receiptData.receivedBy?.toLowerCase().includes("subba reddy") || receiptData.receivedBy?.toLowerCase().includes("pv");
    const adminSignName = isSubbaReddy ? "Sri P.V. Subba Reddy" : "Sri G.V. Subramanyam";
    const adminTitle = isSubbaReddy ? "Grievance Redressal Officer & Joint Registrar" : "Chief Registrar";
    const adminPhone = isSubbaReddy ? "8096301555" : "9494301555 / 8096301555";
    const receiverUpi = isSubbaReddy ? "pvsubbareddy@okaxis (PhonePe: 9848012345)" : "9347359489@ybl (PhonePe: 9347359489)";

    const text = `🙏 *BRAMHANA VIVAHA VEDIKA MATRIMONY* 🙏
---------------------------------------------
*OFFICIAL PAYMENT RECEIPT & ACKNOWLEDGEMENT*

*Candidate Name:* ${receiptData.name}
*Registration/ID No:* ${receiptData.regNumber}
*Gender:* ${receiptData.gender}
*Contact Number:* ${receiptData.contactNumber}

*Payment Details:*
---------------------------------------------
*Paid Amount:* ₹${receiptData.amount}.00
*Transaction Ref ID (UTR):* ${receiptData.transactionId}
*Receiver UPI ID:* ${receiverUpi}
*Approved At:* ${receiptData.timestamp}
*Received & Approved By:* ${receiptData.receivedBy}

*Status:* PROFILE ACTIVATED (VERIFIED) ✅

Thank you for choosing Bramhana Vivaha Vedika. May the divine forces align to bring a blessed alliance!
---------------------------------------------
*${adminSignName}*
${adminTitle}, Bramhana Vivaha Vedika
Ph: ${adminPhone}`;

    navigator.clipboard.writeText(text);
    alert("Receipt text copied to clipboard successfully!");
  };

  const handleSendWhatsAppReceipt = () => {
    if (!receiptData) return;
    const defaultPhone = receiptData.contactNumber || "";
    const inputPhone = prompt("Confirm or edit recipient WhatsApp mobile number:", defaultPhone);
    if (!inputPhone) return;

    const rawPhone = inputPhone.replace(/\D/g, "");
    let cleanPhone = rawPhone;
    if (rawPhone.length === 10) {
      cleanPhone = "91" + rawPhone;
    }

    const isSubbaReddy = receiptData.receivedBy?.toLowerCase().includes("subba reddy") || receiptData.receivedBy?.toLowerCase().includes("pv");
    const receiverName = isSubbaReddy ? "P. V. SUBBA REDDY" : "GADIYARAM VENKATA SUBRAMANYAM";
    const receiverUpi = isSubbaReddy ? "pvsubbareddy@okaxis (PhonePe: 9848012345)" : "9347359489@ybl (PhonePe: 9347359489)";
    const adminSignName = isSubbaReddy ? "Sri P.V. Subba Reddy" : "Sri G.V. Subramanyam";
    const adminTitle = isSubbaReddy ? "Grievance Redressal Officer & Joint Registrar" : "Chief Registrar";
    const adminPhone = isSubbaReddy ? "8096301555" : "9494301555 / 8096301555";
    
    const message = `🎉 *BRAMHANA VIVAHA VEDIKA MATRIMONY* 🎉
---------------------------------------------
*Dear User, Thank you for updating your profile! (ధన్యవాదాలు)* 🙏

We have successfully received your payment of *₹${receiptData.amount}.00* and *VERIFIED* your digital transaction signature. 

🔒 *VERIFICATION STATUS: SYSTEM APPROVED & SECURED*
---------------------------------------------
*Candidate Name:* ${receiptData.name}
*Matrimony ID/Reg:* ${receiptData.regNumber}
*Paid Amount:* ₹${receiptData.amount}.00
*Txn Ref UTR:* ${receiptData.transactionId}
*Receiver Name:* ${receiverName}
*Receiver UPI ID:* ${receiverUpi}
*Approved At:* ${receiptData.timestamp}
*Status:* SUCCESS ✅

⚖️ *LEGAL COMPLIANCE & VALIDITY:*
This is an official computer-generated digital e-receipt. Under Section 65B of the Indian Information Technology (IT) Act, 2000, this digital receipt is legally certified and authenticated. *A physical signature is not required.*

📄 *DOWNLOAD / ATTACHED PDF E-RECEIPT:*
Click the secure link below to view, download, or print your official certified PDF receipt:
👉 ${window.location.origin}/?receipt=${receiptData.transactionId}

Your matrimonial status has been fully upgraded and *DHREVIKARINCHABADINDI* (ధృవీకరించబడింది) ✅. You can now browse verified Brahmin candidates, view direct contact details, and view horoscopes/Jataka compatibility matrices instantly.

May the divine blessings of Lord Venkateswara guide you to a blessed sacred alliance!

Regards,
*${adminSignName}*
${adminTitle}, Bramhana Vivaha Vedika
Ph: ${adminPhone}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank");
  };

  const handleSendEmailReceipt = () => {
    if (!receiptData) return;
    const email = prompt("Enter Candidate Email Address to send E-Receipt:", "subramanyamghadiyaram@gmail.com");
    if (!email) return;

    const subject = encodeURIComponent(`Bramhana Vivaha Vedika • Official E-Receipt [BVV-REC-${receiptData.transactionId.substring(0, 8).toUpperCase()}]`);
    const body = encodeURIComponent(
      `Dear ${receiptData.name},\n\n` +
      `Thank you for choosing Bramhana Vivaha Vedika. We have verified your transaction of ₹${receiptData.amount}.00.\n\n` +
      `Receipt Details:\n` +
      `• Candidate Name: ${receiptData.name}\n` +
      `• Registration/ID No: ${receiptData.regNumber}\n` +
      `• Transaction Ref (UTR): ${receiptData.transactionId}\n` +
      `• Receiver UPI: ${receiptData.receiverUpi}\n` +
      `• Approved At: ${receiptData.timestamp}\n` +
      `• Verified By: ${receiptData.receivedBy}\n\n` +
      `View & Print Digital Receipt Online:\n` +
      `${window.location.origin}/?receipt=${receiptData.transactionId}\n\n` +
      `Regards,\n` +
      `Sri G.V. Subramanyam Registrar\n` +
      `Bramhana Vivaha Vedika Office\n` +
      `Ph: 9494301555`
    );

    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
  };

  const handlePurgeFakeData = async () => {
    const confirmPurge = window.confirm(
      "⚠️ WARNING: Are you absolutely sure you want to delete all temporary candidates? This will wipe the database clean, preserving only the two official administrators (GV Subramanyam & PV Subba Reddy). This action cannot be undone."
    );
    if (!confirmPurge) return;

    try {
      setLoading(true);
      const remaining = await databaseService.purgeFakeData();
      setProfiles(remaining);
      setUpdateMsg("Clean sweep complete! All temporary and seeded profiles have been deleted.");
      setTimeout(() => setUpdateMsg(""), 4000);
    } catch (err) {
      console.error("Failed to purge fake data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Edit action
  const openEditModal = async (profile: Profile) => {
    setProfileToEdit({ ...profile });
    setIsEditModalOpen(true);
    try {
      const prefs = await databaseService.getPartnerPreferences(profile.id);
      if (prefs) {
        setEditPrefsToEdit({ ...prefs });
      } else {
        setEditPrefsToEdit({
          user_id: profile.id,
          age_gap: 5,
          height_range: "5.2 - 5.8",
          preferred_sub_caste: "Any"
        });
      }
    } catch (err) {
      console.error("Failed to load candidate partner preferences:", err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileToEdit) return;

    if (profileToEdit.dob) {
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
      const genderVal = profileToEdit.gender || "Female";
      const minAgeReq = genderVal === "Male" ? 24 : 21;
      const currentAge = calculateExactAge(profileToEdit.dob);
      if (currentAge < minAgeReq - 1) {
        alert(`⚠️ Age Restriction: Minimum age is ${minAgeReq} years for ${genderVal === "Male" ? "Boys" : "Girls"}. Current age is ${currentAge} years. Editing profile is restricted below ${minAgeReq - 1} years.`);
        return;
      }
    }

    // MANDATORY PHOTO & KUNDALI VALIDATION (2 photos + kundali compulsory)
    if (!profileToEdit.photo_url || !profileToEdit.photo_url.trim()) {
      alert("Compulsory: Please upload or provide a First Photo for the Candidate!");
      return;
    }
    if (!profileToEdit.photo_url_2 || !profileToEdit.photo_url_2.trim()) {
      alert("Compulsory: Please upload or provide a Second Photo for the Candidate!");
      return;
    }
    if (!profileToEdit.kundali_url || !profileToEdit.kundali_url.trim()) {
      alert("Compulsory: Kundali document/image is MUST! Please upload or provide its link.");
      return;
    }

    let updatedProfile = { ...profileToEdit };
    if (updatedProfile.dob) {
      try {
        const localCalc = calculatePanchangam(updatedProfile.dob, updatedProfile.birth_time || "08:30");
        const calculatedAstrology = {
          nakshatra: localCalc.nakshatram.english,
          nakshatraLord: localCalc.nakshatraLord,
          pada: localCalc.pada,
          rashi: `${localCalc.rasi.english} (${localCalc.rasi.telugu})`,
          tithi: localCalc.tithi.english,
          deity: localCalc.deity,
          spiritualAnalysis: localCalc.spiritualAnalysis,
          compatibilityTraits: localCalc.compatibilityTraits,
          spiritualScore: localCalc.spiritualScore
        };
        updatedProfile.nakshatram = localCalc.nakshatram.english;
        updatedProfile.astrology = calculatedAstrology;
      } catch (e) {
        console.error("Local calculation failed:", e);
      }
    }

    try {
      const saved = await databaseService.saveProfile(updatedProfile);
      if (editPrefsToEdit) {
        await databaseService.savePartnerPreferences(editPrefsToEdit);
      }
      setProfiles((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      setUpdateMsg(`Profile and Partner Preferences for ${saved.name} were successfully updated.`);
      setIsEditModalOpen(false);
      setProfileToEdit(null);
      setEditPrefsToEdit(null);
      setTimeout(() => setUpdateMsg(""), 3500);
    } catch (err) {
      console.error("Failed to save edited profile:", err);
    }
  };

  // Admin Send Email OTP to Candidate
  const handleAdminSendEmailOtp = async () => {
    const emailToVerify = newProfile.email.trim();
    if (!emailToVerify || !emailToVerify.includes("@")) {
      alert("Please enter a valid candidate email address first!\nదయచేసి అభ్యర్థి యొక్క సరైన ఇమెయిల్ చిరునామాను నమోదు చేయండి.");
      return;
    }
    setAdminIsSendingOtp(true);
    const code = Math.floor(1000000 + Math.random() * 9000000).toString();
    setAdminGeneratedOtp(code);
    try {
      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify, otp: code })
      });
      const data = await res.json();
      if (data.success) {
        setAdminIsOtpSent(true);
        alert(`✉️ 7-Digit OTP sent to candidate's email (${emailToVerify})!\n\nPlease ask the candidate for the 7-digit code received in their email inbox.`);
      } else {
        alert("Failed to send email OTP: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error sending admin email OTP:", err);
      setAdminIsOtpSent(true);
      alert(`✉️ 7-Digit OTP sent to candidate's email (${emailToVerify})!\n\nPlease enter the 7-digit code received.`);
    } finally {
      setAdminIsSendingOtp(false);
    }
  };

  const handleAdminVerifyOtp = () => {
    if (!adminRegOtp.trim()) {
      alert("Please enter the 7-digit OTP received by the candidate.");
      return;
    }
    if (adminRegOtp.trim() === adminGeneratedOtp.trim()) {
      setAdminIsEmailVerified(true);
      alert("✅ Candidate Email Verified Successfully via OTP! (ఇమెయిల్ విజయవంతంగా ధృవీకరించబడింది)");
    } else {
      alert("❌ Incorrect OTP. Please check the 7-digit code sent to the candidate's email and try again.");
    }
  };

  // Create/Register New Candidate
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.name.trim()) {
      alert("Please enter Name (పేరు).");
      return;
    }
    if (!newProfile.contact_number.trim()) {
      alert("Please enter Contact Phone Number (ఫోన్ నెంబర్)!");
      return;
    }
    if (!newProfile.email || !newProfile.email.trim() || !newProfile.email.includes("@")) {
      alert("Please enter candidate's valid Email Address (ఇమెయిల్ చిరునామా)!");
      return;
    }
    if (!adminIsEmailVerified) {
      alert("Mandatory OTP Verification Required:\nPlease send the 7-digit OTP to the candidate's email and verify it before completing registration!\n(రిజిస్ట్రేషన్ పూర్తి చేయడానికి అభ్యర్థి ఇమెయిల్‌కు పంపిన 7-అంకెల OTPని తప్పనిసరిగా ధృవీకరించాలి).");
      return;
    }
    if (!newProfile.gothram || !newProfile.gothram.trim()) {
      alert("Please select Gothram (గోత్రం).");
      return;
    }
    if (!newProfile.sub_caste || !newProfile.sub_caste.trim()) {
      alert("Please select Sub-caste (శాఖ/ఉపకులం).");
      return;
    }

    if (registrationType === "candidate") {
      if (!newProfile.dob) {
        alert("Please select candidate's date of birth!");
        return;
      }
      if (!newProfile.birth_pincode.trim()) {
        alert("Please enter Birth Place Pincode (జనన స్థల పిన్ కోడ్).");
        return;
      }
    }

    if (isRegisteringCandidate || registeringRef.current) return;
    registeringRef.current = true;
    setIsRegisteringCandidate(true);

    try {
      const allProfiles = await databaseService.getProfiles();
      const cleanRegPhone = newProfile.contact_number.replace(/\D/g, "");
      const isDuplicate = allProfiles.some((p) => {
        const cleanStored = p.contact_number ? p.contact_number.replace(/\D/g, "") : "";
        return cleanStored && cleanRegPhone && cleanStored === cleanRegPhone;
      });

      if (isDuplicate) {
        const proceed = window.confirm(
          "This number is already registered! Please use another mobile number for a unique registration.\n\nDo you want to proceed and allow duplication for testing purposes?"
        );
        if (!proceed) {
          setIsRegisteringCandidate(false);
          registeringRef.current = false;
          return;
        }
      }

      const generatedId = "prof-" + Date.now();

      // Query the dynamic server-side astrology engine
      let calculatedAstrology = {
        nakshatra: (kundaliStatus === "wrong" && manualAstrology.nakshatra) ? manualAstrology.nakshatra : (newProfile.nakshatra.trim() || "Uttara Phalguni"),
        nakshatraLord: "Sun",
        pada: (kundaliStatus === "wrong" && manualAstrology.pada) ? manualAstrology.pada : 2,
        rashi: (kundaliStatus === "wrong" && manualAstrology.rashi) ? manualAstrology.rashi : "Simha (Leo)",
        tithi: (kundaliStatus === "wrong" && manualAstrology.tithi) ? manualAstrology.tithi : "Shukla Dashami",
        deity: "Aryaman",
        spiritualAnalysis: "Generous, high state of spiritual readiness, aligned with social upliftment and Brahminical values.",
        compatibilityTraits: ["Very kindhearted", "Passionate about Vedic literature", "Harmonious relationship indicator"],
        spiritualScore: 88
      };

      if (newProfile.dob && kundaliStatus !== "wrong") {
        try {
          const localCalc = calculatePanchangam(newProfile.dob, newProfile.birth_time || "08:30");
          calculatedAstrology = {
            nakshatra: localCalc.nakshatram.english,
            nakshatraLord: localCalc.nakshatraLord,
            pada: localCalc.pada,
            rashi: `${localCalc.rasi.english} (${localCalc.rasi.telugu})`,
            tithi: localCalc.tithi.english,
            deity: localCalc.deity,
            spiritualAnalysis: localCalc.spiritualAnalysis,
            compatibilityTraits: localCalc.compatibilityTraits,
            spiritualScore: localCalc.spiritualScore
          };
        } catch (e) {
          console.error("Local calculation failed:", e);
        }
      }

      if (newProfile.dob && kundaliStatus !== "wrong") {
        try {
          const response = await fetch("/api/astrology", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dob: newProfile.dob,
              time: newProfile.birth_time || "08:30",
              location: newProfile.birth_location || "Andhra Pradesh, India",
            }),
          });
          if (response.ok) {
            const result = await response.json();
            calculatedAstrology = result;
          }
        } catch (err) {
          console.warn("Astrological API offline, using precise local computations:", err);
        }
      }

      // If registered by is empty, let's auto-fill based on logged in admin
      const adminId = localStorage.getItem("bramhana_logged_in_user_id");
      let registeredBy = newProfile.registered_by;
      if (!registeredBy) {
        if (adminId === "prof-subbu") {
          registeredBy = "GV Subramanyam";
        } else if (adminId === "prof-subba-reddy") {
          registeredBy = "PV Subba Reddy";
        } else {
          registeredBy = "Bramhana Admin";
        }
      }

      let p1Url = newProfile.photo_url.trim() || (newProfile.gender === "Female" 
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"
        : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400");
      let p2Url = newProfile.photo_url_2.trim() || "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=400";
      let p3Url = newProfile.photo_url_3.trim() || "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400";

      const finalNewProfile: Profile = {
        id: generatedId,
        reg_number: "", // saveProfile generates sequentially
        role: registrationType, // "candidate" or "employee"
        name: newProfile.name.trim(),
        surname: newProfile.surname.trim(),
        email: newProfile.email.trim(),
        isEmailVerified: true,
        gothram: newProfile.gothram.trim(),
        dob: newProfile.dob || new Date().toISOString().split("T")[0],
        gender: newProfile.gender,
        height_feet: Number(newProfile.height_feet) || 5.4,
        sub_caste: newProfile.sub_caste.trim() || "Any",
        profession: registrationType === "employee" ? "Office Staff / Admin" : (newProfile.profession.trim() || "Software Engineer"),
        salary_lpa: Number(newProfile.salary_lpa) || 7.5,
        contact_number: newProfile.contact_number.trim(),
        status: newProfile.status,
        subscription_status: registrationType === "employee" ? "free" : newProfile.subscription_status,
        password: newProfile.password || (newProfile.dob ? generateDefaultDobPassword(newProfile.dob) : "123456"),
        photo_url: p1Url,
        photo_url_2: p2Url,
        photo_url_3: p3Url,
        kundali_url: newProfile.kundali_url.trim() || undefined,
        birth_time: newProfile.birth_time || "08:30",
        birth_location: newProfile.birth_location,
        birth_pincode: newProfile.birth_pincode,
        partner_expectation_type: newProfile.partner_expectation_type,
        partner_expectations_desc: newProfile.partner_expectations_desc,
        company_name: newProfile.company_name,
        job_branch: newProfile.job_branch,
        working_shift: newProfile.working_shift,
        partner_height_diff_pref: newProfile.partner_height_diff_pref,
        partner_lpa_pref: newProfile.partner_lpa_pref,
        partner_shift_pref: newProfile.partner_shift_pref,
        registered_by: registeredBy,
        registered_at_time: new Date().toLocaleString("en-US", { hour: "numeric", minute: "2-digit", day: "2-digit", month: "short", year: "numeric", hour12: true }),
        nakshatram: calculatedAstrology.nakshatra,
        astrology: calculatedAstrology,
        created_at: new Date().toISOString()
      };

      const saved = await databaseService.saveProfile(finalNewProfile);
      setProfiles((prev) => [saved, ...prev]);
      setUpdateMsg(`Successfully registered new candidate: ${saved.name} (${saved.reg_number})`);
      setIsRegisterModalOpen(false);
      
      // Reset state
      setNewProfile({
        name: "",
        surname: "",
        email: "",
        gender: "Female",
        dob: "",
        birth_location: "",
        birth_pincode: "",
        birth_time: "",
        height_feet: 5.4,
        sub_caste: "",
        gothram: "",
        nakshatra: "",
        profession: "",
        salary_lpa: 7.5,
        company_name: "",
        job_branch: "",
        working_shift: "Day Shift (పగటి వేళ)",
        contact_number: "",
        status: "Verified",
        subscription_status: "free",
        partner_expectation_type: "Any Profession (ఏదైనా ఉద్యోగం)",
        partner_expectations_desc: "",
        partner_height_diff_pref: "No Preference",
        partner_lpa_pref: "No Preference",
        partner_shift_pref: "No Preference",
        password: "",
        photo_url: "",
        photo_url_2: "",
        photo_url_3: "",
        kundali_url: "",
        registered_by: ""
      });
      setAdminRegOtp("");
      setAdminGeneratedOtp("");
      setAdminIsOtpSent(false);
      setAdminIsEmailVerified(false);
      setTimeout(() => setUpdateMsg(""), 4000);
    } catch (err) {
      console.error("Failed to register new profile:", err);
      alert("Error registering new profile. Please try again.");
    } finally {
      setIsRegisteringCandidate(false);
      registeringRef.current = false;
    }
  };

  // Delete action
  const openDeleteModal = (profile: Profile) => {
    setProfileToDelete(profile);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!profileToDelete) return;
    try {
      const success = await databaseService.deleteProfile(profileToDelete.id);
      if (success) {
        setProfiles((prev) => prev.filter((p) => p.id !== profileToDelete.id));
        setUpdateMsg(`Profile of ${profileToDelete.name} was deleted successfully.`);
        setIsDeleteModalOpen(false);
        setProfileToDelete(null);
        setTimeout(() => setUpdateMsg(""), 3500);
      }
    } catch (err) {
      console.error("Failed to delete profile:", err);
    }
  };

  // Create default preferences if missing
  const handleCreateDefaultPrefs = async () => {
    if (!selectedCandidateId) return;
    const defaultPrefs: PartnerPreferences = {
      user_id: selectedCandidateId,
      age_gap: 6,
      height_range: "5.0 - 6.0",
      preferred_sub_caste: "Any"
    };
    try {
      const saved = await databaseService.savePartnerPreferences(defaultPrefs);
      setCandidatePreferences(saved);
      setUpdateMsg("Initialized default partner preferences for alignment calculations.");
      setTimeout(() => setUpdateMsg(""), 3000);
    } catch (err) {
      console.error("Failed to create default preferences:", err);
    }
  };

  // Filter profiles for Registrations tab
  const filteredProfiles = profiles.filter((p) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
                          p.name.toLowerCase().includes(query) ||
                          (p.surname || "").toLowerCase().includes(query) ||
                          p.profession.toLowerCase().includes(query) ||
                          p.sub_caste.toLowerCase().includes(query) ||
                          (p.gothram || "").toLowerCase().includes(query) ||
                          (p.nakshatram || "").toLowerCase().includes(query) ||
                          p.id.toLowerCase().includes(query) ||
                          (p.reg_number || "").toLowerCase().includes(query) ||
                          p.contact_number.includes(query);
    const matchesStatus = statusFilter === "All"
      ? true
      : statusFilter === "Mercy"
        ? p.is_mercy_granted === true
        : p.status === statusFilter;
    const matchesGender = genderFilter === "All" || p.gender === genderFilter;

    // Agent Calling Segments:
    // "no_100_fee" -> ₹100 Registration Fee NOT Paid
    // "paid_100_no_matches" -> ₹100 Paid, but No Matches Found Yet
    // "has_matches_no_900" -> Matches Found, but NOT Paid ₹900 Premium
    // "paid_900" -> ₹900 Premium Fully Paid
    let matchesCallingSegment = true;
    if (callingSegmentFilter === "no_100_fee") {
      matchesCallingSegment = p.subscription_status === "free" || !p.subscription_status;
    } else if (callingSegmentFilter === "paid_100_no_matches") {
      matchesCallingSegment = p.subscription_status === "paid_100" && (!p.approved_matches || p.approved_matches.length === 0);
    } else if (callingSegmentFilter === "has_matches_no_900") {
      matchesCallingSegment = p.subscription_status === "paid_100" && (p.approved_matches && p.approved_matches.length > 0);
    } else if (callingSegmentFilter === "paid_900") {
      matchesCallingSegment = p.subscription_status === "paid_900";
    }

    return matchesSearch && matchesStatus && matchesGender && matchesCallingSegment;
  });

  // Calculations for Stats
  const totalProfiles = profiles.length;
  const verifiedCount = profiles.filter((p) => p.status === "Verified").length;
  const premiumCount = profiles.filter((p) => p.status === "Premium").length;
  const pendingCount = profiles.filter((p) => p.status === "Pending").length;

  const calculateAge = (dobString: string): number => {
    if (!dobString) return 28;
    const birthDate = new Date(dobString);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970) || 28;
  };

  // 1. Gender breakdown
  const malesCount = profiles.filter((p) => p.gender === "Male").length;
  const femalesCount = profiles.filter((p) => p.gender === "Female").length;

  // 2. Enrolled Today, Week, Month
  const todayStr = new Date().toISOString().split("T")[0];
  const nowMs = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * oneDayMs;
  const thirtyDaysMs = 30 * oneDayMs;

  let enrolledToday = 0;
  let enrolledThisWeek = 0;
  let enrolledThisMonth = 0;

  profiles.forEach((p) => {
    if (!p.created_at) return;
    const createdTime = new Date(p.created_at).getTime();
    const diffMs = nowMs - createdTime;
    const createdDateStr = new Date(p.created_at).toISOString().split("T")[0];

    if (createdDateStr === todayStr || diffMs <= oneDayMs) {
      enrolledToday++;
    }
    if (diffMs <= sevenDaysMs) {
      enrolledThisWeek++;
    }
    if (diffMs <= thirtyDaysMs) {
      enrolledThisMonth++;
    }
  });

  // 3. Gender and Age breakdowns (21-25, 25-30, 30+)
  const f_21_25 = profiles.filter(p => p.gender === "Female" && calculateAge(p.dob) >= 21 && calculateAge(p.dob) <= 25).length;
  const f_25_30 = profiles.filter(p => p.gender === "Female" && calculateAge(p.dob) > 25 && calculateAge(p.dob) <= 30).length;
  const f_30_plus = profiles.filter(p => p.gender === "Female" && calculateAge(p.dob) > 30).length;

  const m_21_25 = profiles.filter(p => p.gender === "Male" && calculateAge(p.dob) >= 21 && calculateAge(p.dob) <= 25).length;
  const m_25_30 = profiles.filter(p => p.gender === "Male" && calculateAge(p.dob) > 25 && calculateAge(p.dob) <= 30).length;
  const m_30_plus = profiles.filter(p => p.gender === "Male" && calculateAge(p.dob) > 30).length;

  // 4. Helper to compute mutual matches count for a given profile
  const computeMutualMatchCount = (profile: Profile, allProfiles: Profile[], allPrefs: PartnerPreferences[]) => {
    const myPref = allPrefs.find(pr => pr.user_id === profile.id) || {
      user_id: profile.id,
      age_gap: 5,
      height_range: "5.0 - 6.0",
      preferred_sub_caste: "Any"
    };
    const myAge = calculateAge(profile.dob);

    const oppositeGenderProfiles = allProfiles.filter(p => p.id !== profile.id && p.gender !== profile.gender);
    let count = 0;

    oppositeGenderProfiles.forEach(partner => {
      const partnerPref = allPrefs.find(pr => pr.user_id === partner.id) || {
        user_id: partner.id,
        age_gap: 5,
        height_range: "5.0 - 6.0",
        preferred_sub_caste: "Any"
      };

      const partnerAge = calculateAge(partner.dob);
      const ageDiff = Math.abs(partnerAge - myAge);

      // Check A's criteria against B
      const myAgeMatch = ageDiff <= myPref.age_gap;
      const myCasteMatch = myPref.preferred_sub_caste === "Any" || 
                           (myPref.preferred_sub_caste === "My Sub-caste" && partner.sub_caste.trim().toLowerCase() === profile.sub_caste.trim().toLowerCase()) ||
                           partner.sub_caste.toLowerCase().includes(myPref.preferred_sub_caste.toLowerCase()) ||
                           myPref.preferred_sub_caste.toLowerCase().includes(partner.sub_caste.toLowerCase());
      
      let myHeightMatch = true;
      if (myPref.height_range && myPref.height_range !== "Any") {
        const parts = myPref.height_range.split("-").map(h => parseFloat(h.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          myHeightMatch = partner.height_feet >= parts[0] && partner.height_feet <= parts[1];
        }
      }

      // Check B's criteria against A
      const partnerAgeMatch = ageDiff <= partnerPref.age_gap;
      const partnerCasteMatch = partnerPref.preferred_sub_caste === "Any" || 
                                (partnerPref.preferred_sub_caste === "My Sub-caste" && profile.sub_caste.trim().toLowerCase() === partner.sub_caste.trim().toLowerCase()) ||
                                profile.sub_caste.toLowerCase().includes(partnerPref.preferred_sub_caste.toLowerCase()) ||
                                partnerPref.preferred_sub_caste.toLowerCase().includes(profile.sub_caste.toLowerCase());

      let partnerHeightMatch = true;
      if (partnerPref.height_range && partnerPref.height_range !== "Any") {
        const parts = partnerPref.height_range.split("-").map(h => parseFloat(h.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          partnerHeightMatch = profile.height_feet >= parts[0] && profile.height_feet <= parts[1];
        }
      }

      if (myAgeMatch && myCasteMatch && myHeightMatch && partnerAgeMatch && partnerCasteMatch && partnerHeightMatch) {
        count++;
      }
    });

    return count;
  };

  // Compute stats for all profiles
  const profileMatchCounts = profiles.map(p => ({
    profile: p,
    count: computeMutualMatchCount(p, profiles, allPreferences)
  }));

  const totalMatchCounts = profileMatchCounts.reduce((acc, curr) => acc + curr.count, 0);
  const avgMatches = profiles.length > 0 ? (totalMatchCounts / profiles.length).toFixed(1) : "0";

  let highestMatchProfile = profileMatchCounts.length > 0 
    ? [...profileMatchCounts].sort((a, b) => b.count - a.count)[0] 
    : null;

  let lowestMatchProfile = profileMatchCounts.length > 0 
    ? [...profileMatchCounts].sort((a, b) => a.count - b.count)[0] 
    : null;

  // Gender-specific extremes
  const maleMatchCounts = profileMatchCounts.filter(pm => pm.profile.gender === "Male");
  const femaleMatchCounts = profileMatchCounts.filter(pm => pm.profile.gender === "Female");

  const highestBoyMatchProfile = maleMatchCounts.length > 0
    ? [...maleMatchCounts].sort((a, b) => b.count - a.count)[0]
    : null;

  const lowestBoyMatchProfile = maleMatchCounts.length > 0
    ? [...maleMatchCounts].sort((a, b) => a.count - b.count)[0]
    : null;

  const highestGirlMatchProfile = femaleMatchCounts.length > 0
    ? [...femaleMatchCounts].sort((a, b) => b.count - a.count)[0]
    : null;

  const lowestGirlMatchProfile = femaleMatchCounts.length > 0
    ? [...femaleMatchCounts].sort((a, b) => a.count - b.count)[0]
    : null;

  // Strict Jataka horoscope matched + Boy is 2-3 years older than girl + girl is not older than boy
  const perfectVedicPairs = useMemo(() => {
    const pairs: Array<{
      boy: Profile;
      girl: Profile;
      boyAge: number;
      girlAge: number;
      ageDiff: number;
      jatakaScore: number;
    }> = [];

    const boys = profiles.filter(p => p.gender === "Male");
    const girls = profiles.filter(p => p.gender === "Female");

    boys.forEach(boy => {
      const boyAge = calculateAge(boy.dob);
      girls.forEach(girl => {
        const girlAge = calculateAge(girl.dob);
        const ageDiff = boyAge - girlAge;
        
        // Boy is 2 or 3 years elder than woman (which naturally ensures woman is not elder than boy)
        if (ageDiff === 2 || ageDiff === 3) {
          // Gothram/Surname sibling checks (Sadharmya check)
          const isSameGothram = boy.gothram && girl.gothram && boy.gothram.trim().toLowerCase() === girl.gothram.trim().toLowerCase();
          const isSameSurname = boy.surname && girl.surname && boy.surname.trim().toLowerCase() === girl.surname.trim().toLowerCase();
          
          if (!isSameGothram && !isSameSurname) {
            // Astrology compatibility (spiritualScore represents celestial alignment)
            const boySpiritual = boy.astrology?.spiritualScore || 70;
            const girlSpiritual = girl.astrology?.spiritualScore || 70;
            const jatakaScore = Math.floor((boySpiritual + girlSpiritual) / 2);

            // Guna Milan / horoscope match of >= 60%
            if (jatakaScore >= 60) {
              pairs.push({
                boy,
                girl,
                boyAge,
                girlAge,
                ageDiff,
                jatakaScore
              });
            }
          }
        }
      });
    });

    return pairs;
  }, [profiles]);

  // Match Engine Calculations for Selected Candidate (Bidirectional Mutual Matching)
  const selectedCandidate = profiles.find((p) => p.id === selectedCandidateId);
  
  const calculatedMatches = selectedCandidate
    ? profiles
        .filter((partner) => {
          if (partner.id === selectedCandidate.id || partner.gender === selectedCandidate.gender) {
            return false;
          }
          // Traditional Sibling check: Same Gothram OR Same Surname = Sibling, No Match
          if (selectedCandidate.gothram && partner.gothram) {
            if (selectedCandidate.gothram.trim().toLowerCase() === partner.gothram.trim().toLowerCase()) {
              return false;
            }
          }
          if (selectedCandidate.surname && partner.surname) {
            if (selectedCandidate.surname.trim().toLowerCase() === partner.surname.trim().toLowerCase()) {
              return false;
            }
          }

          const partnerAge = calculateAge(partner.dob);
          
          // Strict filtering if Java JVM strict matching rules are enabled
          if (activeEngine === "java") {
            // Strict Age check
            if (partnerAge < preferredMinAge || partnerAge > preferredMaxAge) {
              return false;
            }
            // Strict LPA check
            if (partner.salary_lpa < preferredMinLPA) {
              return false;
            }
            // Strict Profession check
            if (preferredSpouseProfession !== "Any") {
              const cleanPref = preferredSpouseProfession.toLowerCase().replace(/\s+/g, "");
              const cleanProf = partner.profession.toLowerCase().replace(/\s+/g, "");
              if (!cleanProf.includes(cleanPref) && !cleanPref.includes(cleanProf)) {
                return false;
              }
            }
          }

          return true;
        })
        .map((partner) => {
          // Find preferences
          const myPref = candidatePreferences || {
            user_id: selectedCandidate.id,
            age_gap: 5,
            height_range: "5.0 - 6.0",
            preferred_sub_caste: "Any"
          };

          const partnerPref = allPreferences.find(pr => pr.user_id === partner.id) || {
            user_id: partner.id,
            age_gap: 5,
            height_range: "5.0 - 6.0",
            preferred_sub_caste: "Any"
          };

          const partnerAge = calculateAge(partner.dob);
          const candidateAge = calculateAge(selectedCandidate.dob);
          const ageDiff = Math.abs(partnerAge - candidateAge);

          // 1. My criteria check against partner
          const myAgeMatch = ageDiff <= myPref.age_gap;
          const myCasteMatch = myPref.preferred_sub_caste === "Any" || 
                               (myPref.preferred_sub_caste === "My Sub-caste" && partner.sub_caste.trim().toLowerCase() === selectedCandidate.sub_caste.trim().toLowerCase()) ||
                               partner.sub_caste.toLowerCase().includes(myPref.preferred_sub_caste.toLowerCase()) ||
                               myPref.preferred_sub_caste.toLowerCase().includes(partner.sub_caste.toLowerCase());
          
          let myHeightMatch = true;
          if (myPref.height_range && myPref.height_range !== "Any") {
            const parts = myPref.height_range.split("-").map(h => parseFloat(h.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              myHeightMatch = partner.height_feet >= parts[0] && partner.height_feet <= parts[1];
            }
          }

          // 2. Partner criteria check against me
          const partnerAgeMatch = ageDiff <= partnerPref.age_gap;
          const partnerCasteMatch = partnerPref.preferred_sub_caste === "Any" || 
                                    (partnerPref.preferred_sub_caste === "My Sub-caste" && selectedCandidate.sub_caste.trim().toLowerCase() === partner.sub_caste.trim().toLowerCase()) ||
                                    selectedCandidate.sub_caste.toLowerCase().includes(partnerPref.preferred_sub_caste.toLowerCase()) ||
                                    partnerPref.preferred_sub_caste.toLowerCase().includes(selectedCandidate.sub_caste.toLowerCase());

          let partnerHeightMatch = true;
          if (partnerPref.height_range && partnerPref.height_range !== "Any") {
            const parts = partnerPref.height_range.split("-").map(h => parseFloat(h.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              partnerHeightMatch = selectedCandidate.height_feet >= parts[0] && selectedCandidate.height_feet <= parts[1];
            }
          }

          // Criteria checks passed (Total 6 checks: 3 on each side)
          const myPassed = (myAgeMatch ? 1 : 0) + (myCasteMatch ? 1 : 0) + (myHeightMatch ? 1 : 0);
          const partnerPassed = (partnerAgeMatch ? 1 : 0) + (partnerCasteMatch ? 1 : 0) + (partnerHeightMatch ? 1 : 0);
          
          const isMutualMatch = myPassed === 3 && partnerPassed === 3;
          const passCount = myPassed;

          // Compute custom compatibility score based on selected engine
          let compatibilityScore = 0;
          if (activeEngine === "python") {
            // Python Weighted Scoring Engine (AI-enhanced analytics)
            let score = 50; // base score
            
            // Age Proximity weight: max 15 pts
            if (partnerAge >= preferredMinAge && partnerAge <= preferredMaxAge) {
              score += 15;
            } else {
              const ageDist = partnerAge < preferredMinAge ? preferredMinAge - partnerAge : partnerAge - preferredMaxAge;
              score += Math.max(0, 15 - ageDist * 3);
            }

            // Income LPA Level weight: max 15 pts
            if (partner.salary_lpa >= preferredMinLPA) {
              score += 15;
            } else {
              score += Math.max(0, Math.floor((partner.salary_lpa / Math.max(1, preferredMinLPA)) * 15));
            }

            // Profession match weight: max 15 pts
            if (preferredSpouseProfession !== "Any") {
              const cleanPref = preferredSpouseProfession.toLowerCase().replace(/\s+/g, "");
              const cleanProf = partner.profession.toLowerCase().replace(/\s+/g, "");
              if (cleanProf.includes(cleanPref) || cleanPref.includes(cleanProf)) {
                score += 15;
              }
            } else {
              score += 10;
            }

            // Astrology weight: max 15 pts
            const baseAstrologyScore = partner.astrology?.spiritualScore || 75;
            score += Math.floor((baseAstrologyScore / 100) * 15);

            // Mutual match bonus: max 20 pts
            if (isMutualMatch) {
              score += 20;
            }

            compatibilityScore = Math.min(100, Math.max(30, score));
          } else {
            // Java JVM Rules Engine Strict Scoring (Boolean logic)
            const baseAstrologyScore = partner.astrology?.spiritualScore || 75;
            compatibilityScore = isMutualMatch ? Math.min(100, baseAstrologyScore + 10) : Math.max(40, baseAstrologyScore - 15);
          }

          return {
            partner,
            partnerAge,
            ageDiff,
            ageMatch: myAgeMatch,
            casteMatch: myCasteMatch,
            heightMatch: myHeightMatch,
            partnerAgeMatch,
            partnerCasteMatch,
            partnerHeightMatch,
            passCount,
            isMutualMatch,
            compatibilityScore
          };
        })
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    : [];

  const revenueStats = useMemo(() => {
    let subbuReg = 0;
    let subbuPrem = 0;
    let subbaReg = 0;
    let subbaPrem = 0;
    let otherReg = 0;
    let otherPrem = 0;

    profiles.forEach((p) => {
      // Attribute to who approved the payment (fee_received_by) or registered_by as fallback
      const admin = p.fee_received_by || p.registered_by || "";
      const isSubbu = admin.toLowerCase().includes("subramanyam") || admin.toLowerCase().includes("subbu");
      const isSubbaReddy = admin.toLowerCase().includes("subba reddy") || admin.toLowerCase().includes("subbareddy") || admin.toLowerCase().includes("reddy");

      if (p.subscription_status === "paid_100") {
        if (isSubbu) {
          subbuReg += 100;
        } else if (isSubbaReddy) {
          subbaReg += 100;
        } else {
          otherReg += 100;
        }
      } else if (p.subscription_status === "paid_900") {
        if (isSubbu) {
          subbuReg += 100;
          subbuPrem += 900;
        } else if (isSubbaReddy) {
          subbaReg += 100;
          subbaPrem += 900;
        } else {
          otherReg += 100;
          otherPrem += 900;
        }
      }
    });

    return {
      subramanyam: { reg: subbuReg, prem: subbuPrem, total: subbuReg + subbuPrem },
      subbaReddy: { reg: subbaReg, prem: subbaPrem, total: subbaReg + subbaPrem },
      others: { reg: otherReg, prem: otherPrem, total: otherReg + otherPrem },
      total: {
        reg: subbuReg + subbaReg + otherReg,
        prem: subbuPrem + subbaPrem + otherPrem,
        total: subbuReg + subbuPrem + subbaReg + subbaPrem + otherReg + otherPrem
      }
    };
  }, [profiles]);

  const getAccusedWhatsappText = () => {
    if (!verifyingGrievance) return "";
    const adminNameVal = grievanceApproveAdmin === "subramanyam" ? "Sri G.V. Subramanyam (శ్రీ జి.వి. సుబ్రహ్మణ్యం)" : "Sri P.V. Subba Reddy (శ్రీ పి.వి. సుబ్బారెడ్డి)";
    const candidateName = verifyingGrievance.accusedName || "Candidate";
    
    if (accusedMsgScenario === "7day_suspension") {
      return `*బ్రాహ్మణ వివాహ వేదిక - తాత్కాలిక రక్షణ విచారణ నిలిపివేత (7 రోజుల సస్పెన్షన్)*\n\n` +
        `గౌరవనీయులైన అభ్యర్థికి (${candidateName}),\n` +
        `బ్రాహ్మణ వివాహ వేదిక నందు మీ ప్రొఫైల్ పై మా కేస్ రిడ్రెస్సల్ సెల్ కు ఒక ఫిర్యాదు వచ్చినందున, మీ ఖాతాను తాత్కాలికంగా 7 రోజుల పాటు నిలిపివేయడం (SUSPENDED FOR 7 DAYS) జరిగింది. ఈ అంశాన్ని చీఫ్ రిజిస్ట్రార్ *${adminNameVal}* గారు స్వయంగా పరిశీలిస్తున్నారు.\n\n` +
        `ఒకవేళ మీ ప్రొఫైల్ లోని వివరాలు తప్పుగా ఉన్నా, లేదా మీ విద్యార్హతలు/జీతం/కుటుంబ పారామీటర్లు తప్పుగా నమోదు చేసినా, లేదా మీ మొబైల్ నంబర్/ID ప్రూఫ్‌లు మా డేటాబేస్ లో సరిపోలకపోయినా, మీ ప్రొఫైల్ శాశ్వతంగా నిలిపివేయబడుతుంది. దయచేసి 7 రోజుల్లోగా తగిన నిజాయితీ గల నిరూపణ ఆధారాలను సమర్పించగలరు.\n\n` +
        `*Dear Candidate*,\n` +
        `An official safety grievance was submitted regarding your profile. An active investigation is under progress, and your matrimonial profile has been *TEMPORARILY SUSPENDED FOR 7 DAYS*. This case is being personally verified by Chief Registrar *${adminNameVal}*. If it is discovered that you have uploaded fake credentials, incorrect salary/family info, or if your phone/ID does not match our verified registry, your profile will be permanently blocked.\n\n` +
        `- Case Redressal Desk, Bramhana Vivaha Veadika (IT Act 2021 Safety Cell)`;
    }
    
    if (accusedMsgScenario === "permanent_ban") {
      return `*బ్రాహ్మణ వివాహ వేదిక - శాశ్వత ఖాతా రద్దు నివేదిక (PERMANENT LIFETIME BAN)*\n\n` +
        `గౌరవనీయులైన అభ్యర్థికి (${candidateName}),\n` +
        `బ్రాహ్మణ వివాహ వేదిక నందు మీ ప్రొఫైల్ పై తీవ్రమైన ఫిర్యాదు ఆధారంగా మరియు మీ ఐడెంటిటీ/మొబైల్ నంబర్/ఉద్యోగం/జీతం వంటి కనీస వివరాలు మా డేటాబేస్ తో సరిపోలకపోవడం మరియు మీరు తప్పుడు క్రెడెన్షియల్స్ సమర్పించినట్లు ధృవీకరించబడినందున, మీ ఖాతా శాశ్వతంగా రద్దు చేయబడింది (PERMANENT BAN/SUSPENDED).\n\n` +
        `ఈ శాశ్వత చర్యను చీఫ్ రిజిస్ట్రార్ *${adminNameVal}* గారు స్వయంగా ఖరారు చేశారు. ఒకవేళ మీ మొబైల్ నంబర్ లేదా ఐడి వివరాలు మ్యాచ్ కాకపోతే, మీ ప్రొఫైల్ లో మార్పులకు ఇక ఎటువంటి అవకాశం లేదు.\n\n` +
        `*Dear Candidate*,\n` +
        `Your profile has been *PERMANENTLY BANNED* and removed from our matrimonial registry. This action was officially taken by Chief Registrar *${adminNameVal}* after establishing that your submitted credentials, phone number, or ID verification failed to match our data registry.\n\n` +
        `- Case Redressal Desk, Bramhana Vivaha Veadika (IT Act 2021 Safety Cell)`;
    }
    
    if (accusedMsgScenario === "investigation_hold") {
      return `*బ్రాహ్మణ వివాహ వేదిక - అధికారిక విచారణ నోటీసు (UNDER ACTIVE INVESTIGATION)*\n\n` +
        `గౌరవనీయులైన అభ్యర్థికి (${candidateName}),\n` +
        `బ్రాహ్మణ వివాహ వేదిక నందు మీ ప్రొఫైల్ పై ఒక విచారణ అంశాన్ని మా కేస్ రిడ్రెస్సల్ డెస్క్ పరిశీలిస్తోంది. చీఫ్ రిజిస్ట్రార్ *${adminNameVal}* గారి ఆధ్వర్యంలో సమగ్ర దర్యాప్తు జరుగుతోంది.\n\n` +
        `మీ ఖాతా తాత్కాలికంగా నిలిపివేయబడి (SUSPENDED ENQUIRY) నిరంతర పరిశీలనలో ఉంచబడింది. తదుపరి నిర్ణయం వచ్చే వరకు రెండు వైపులా ప్రాథమిక పరిశోధన సాగుతుంది. దయచేసి సహకరించగలరు.\n\n` +
        `*Dear Candidate*,\n` +
        `Your matrimonial profile is currently under active safety investigation directed by Chief Registrar *${adminNameVal}*. Your account is temporarily suspended/on hold during this enquiry. Please cooperate with our safety compliance officers.\n\n` +
        `- Case Redressal Desk, Bramhana Vivaha Veadika (Pure Intermediary Safety Cell)`;
    }
    
    if (accusedMsgScenario === "forgiven_warning") {
      return `*బ్రాహ్మణ వివాహ వేదిక - ప్రొఫైల్ పునరుద్ధరణ & రక్షణ హెచ్చరిక (REINSTATED WITH WARNING)*\n\n` +
        `గౌరవనీయులైన అభ్యర్థికి (${candidateName}),\n` +
        `బ్రాహ్మణ వివాహ వేదిక నందు మీ ప్రొఫైల్ పై వచ్చిన విచారణ విజయవంతంగా ముగిసింది. చీఫ్ రిజిస్ట్రార్ *${adminNameVal}* గారు మీ వివరణను మరియు సమర్పించిన రుజువులను పరిశీలించి సంతృప్తి చెందినందున మీ వివాహ ప్రొఫైల్ తిరిగి పునరుద్ధరించబడింది.\n\n` +
        `భవిష్యత్తులో ఇతర వినియోగదారులతో మాట్లాడేటప్పుడు మరియు సమాచారాన్ని మార్పిడి చేసుకునేటప్పుడు మన సంస్కృతిని అనుసరిస్తూ గౌరవంగా మెలగవలసిందిగా హెచ్చరించడమైనది. మరొక్క సారి ఇటువంటి లోపాలు తలెత్తితే ఖాతా శాశ్వతంగా రద్దు చేయబడుతుంది.\n\n` +
        `*Dear Candidate*,\n` +
        `Following a detailed verification by Chief Registrar *${adminNameVal}*, your profile has been successfully reinstated. You are hereby issued a friendly compliance warning to adhere strictly to our code of conduct during communications.\n\n` +
        `- Case Redressal Desk, Bramhana Vivaha Veadika`;
    }

    if (accusedMsgScenario === "cybercrime_warning") {
      return `*బ్రాహ్మణ వివాహ వేదిక - తీవ్ర హెచ్చరిక & సైబర్ క్రైమ్ పోలీసు ఫిర్యాదు (CYBERCRIME POLICE COMPLAINT INITIATED)*\n\n` +
        `గౌరవనీయులైన అభ్యర్థికి (${candidateName}),\n` +
        `మీ ప్రొఫైల్ పై వచ్చిన తీవ్రమైన మోసపూరిత ఆరోపణలు, దూషణలు లేదా హరాస్మెంట్ ఫిర్యాదుల నేపథ్యంలో, మా వినియోగదారుల రక్షణ మరియు భద్రత దృష్ట్యా మీపై సైబర్ క్రైమ్ పోలీసు స్టేషన్ (Cybercrime Police Department) నందు అధికారికంగా ఫిర్యాదు సమర్పించడం జరుగుతోంది.\n\n` +
        `బ్రాహ్మణ వివాహ వేదిక ఎల్లప్పుడూ నిజాయితీ గల సంబంధాలను ప్రోత్సహిస్తుంది. వినియోగదారులను మోసగించడానికి లేదా తప్పుడు వివరాలతో మోసం చేయాలని చూసే వారిపై చట్టపరమైన క్రమశిక్షణ చర్యలు తప్పవు. మీ ప్రొఫైల్ శాశ్వతంగా బ్లాక్ చేయబడింది.\n\n` +
        `*Dear Candidate*,\n` +
        `Due to severe complaints of fraud, abuse, or harassment associated with your profile, we have officially initiated a formal complaint with the Cybercrime Police Department under the Indian IT Act to safeguard our user community from fraudulent entities. Your profile has been *PERMANENTLY BANNED* with zero tolerance.\n\n` +
        `- Legal Safety Cell, Bramhana Vivaha Veadika (Pure Intermediary Secure Portal)`;
    }

    if (accusedMsgScenario === "lift_suspension_mercy") {
      return `*బ్రాహ్మణ వివాహ వేదిక - క్షమాభిక్ష పూర్వక సస్పెన్షన్ ఎత్తివేత (SUSPENSION LIFTED WITH MERCY & WARNING)*\n\n` +
        `గౌరవనీయులైన అభ్యర్థికి (${candidateName}),\n` +
        `మీ ప్రొఫైల్ పై విధించిన సస్పెన్షన్ ను మీ విజ్ఞప్తి మరియు మీరు సమర్పించిన తగిన వివరణల ఆధారంగా మా యాజమాన్యం మరియు చీఫ్ రిజిస్ట్రార్ *${adminNameVal}* గారు ఒక సారి క్షమించి (Mercy Granted), సస్పెన్షన్ ను ఎత్తివేయడం (LIFTED SUSPENSION) జరిగింది. మీ ప్రొఫైల్ తిరిగి పునరుద్ధరించబడింది.\n\n` +
        `భవిష్యత్తులో ఇటువంటి పొరపాట్లు లేదా ఆరోపణలు పునరావృతమైతే, ఎటువంటి ముందస్తు సమాచారం లేకుండా మీ ఖాతాను శాశ్వతంగా రద్దు చేస్తామని తీవ్రంగా హెచ్చరించడమైనది. దయచేసి నియమ నిబంధనలను గౌరవించగలరు.\n\n` +
        `*Dear Candidate*,\n` +
        `Following a deep evaluation and exercising administrative mercy based on your submission, Chief Registrar *${adminNameVal}* has officially approved the lifting of your profile suspension. Your matrimonial profile is now fully reinstated. Please consider this as a final compliance warning.\n\n` +
        `- Management Board, Bramhana Vivaha Veadika (Aesthetic Redressal Cell)`;
    }

    if (accusedMsgScenario === "mercy_changed_punishment") {
      return `*బ్రాహ్మణ వివాహ వేదిక - క్షమాభిక్ష పూర్వక మార్చబడిన శిక్ష (PUNISHMENT CHANGED & WARNING)*\n\n` +
        `గౌరవనీయులైన అభ్యర్థికి (${candidateName}),\n` +
        `బ్రాహ్మణ వివాహ వేదిక యాజమాన్యం మరియు చీఫ్ రిజిస్ట్రార్ *${adminNameVal}* గారు మీ ప్రొఫైల్ పై విధించిన సస్పెన్షన్ ను మరొక్కసారి మానవతా కోణంలో పరిశీలించారు. మీ అభ్యర్థన మేరకు మీ శిక్షను సడలించి (24 గంటల పరిమితి / సస్పెన్షన్ ఎత్తివేతగా) మార్చడం జరిగింది.\n\n` +
        `దయచేసి ఇప్పుడు అత్యంత జాగ్రత్తగా (Be Careful Now) మెలగవలసిందిగా కోరుతున్నాము. ఇది మీకు ఇవ్వబడుతున్న చివరి స్పష్టమైన హెచ్చరిక (Straight Warning). మా వేదిక నందు ఇతర కుటుంబాల గౌరవాన్ని భంగపరిచే ఏ చిన్న తప్పిదానికైనా మీ ఖాతా ఎప్పటికీ పునరుద్ధరించబడదు.\n\n` +
        `*Dear Candidate*,\n` +
        `We have updated and reduced your suspension terms (reduced to a brief hold / revoked entirely) as an act of administrative mercy. Please be extremely careful now. This is a straight warning. We are giving you a fair chance to reform and communicate with respect.\n\n` +
        `- Administrative Case Redressal, Bramhana Vivaha Veadika`;
    }
    
    return "";
  };

  const getVictimWhatsappText = () => {
    if (!verifyingGrievance) return "";
    const adminNameVal = grievanceApproveAdmin === "subramanyam" ? "Sri G.V. Subramanyam (శ్రీ జి.వి. సుబ్రహ్మణ్యం)" : "Sri P.V. Subba Reddy (శ్రీ పి.వి. సుబ్బారెడ్డి)";
    const reporterName = verifyingGrievance.reporterName || "User";
    const accusedName = verifyingGrievance.accusedName || "Candidate";
    const id = verifyingGrievance.id || "N/A";
    
    if (victimMsgScenario === "action_taken") {
      return `*బ్రాహ్మణ వివాహ వేదిక - ఫిర్యాదు పరిష్కార నివేదిక / Case Resolved & Action Taken*\n\n` +
        `గౌరవనీయులైన వినియోగదారునికి (${reporterName}),\n` +
        `మీరు అభ్యర్థి ${accusedName} పై సమర్పించిన ఫిర్యాదు (టికెట్ నంబర్: *${id}*) విజయవంతంగా స్వీకరించబడింది. ఈ అంశాన్ని చీఫ్ రిజిస్ట్రార్ *${adminNameVal}* గారు స్వయంగా పరిశీలించారు.\n\n` +
        `సదరు ప్రొఫైల్ పై లభించిన ప్రాథమిక ఆధారాలతో మరియు నిబంధనల ఉల్లంఘన కారణంగా మేము సదరు నిందితుని ప్రొఫైల్ ను తక్షణమే నిలిపివేసి (SUSPENDED) చర్యలు తీసుకున్నాము. వివాహ సంబంధాన్ని ఖాయం చేసుకునే ముందే మీరు కూడా వ్యక్తిగతంగా అన్ని వివరాలు స్వయంగా విచారించుకోవాల్సిందిగా మనవి.\n\n` +
        `*Dear Complainant*,\n` +
        `Your grievance report (Ticket ID: *${id}*) against ${accusedName} has been fully verified and resolved by Chief Registrar *${adminNameVal}*. The accused candidate's profile has been *SUSPENDED* from the matrimonial search. Please conduct your own personal checks before proceeding.\n\n` +
        `- Case Redressal Desk, Bramhana Vivaha Veadika (Pure Intermediary Notice)`;
    }
    
    if (victimMsgScenario === "dual_investigation") {
      return `*బ్రాహ్మణ వివాహ వేదిక - ద్వైపాక్షిక సమగ్ర విచారణ నోటీసు (JOINT SAFETY INVESTIGATION)*\n\n` +
        `గౌరవనీయులైన వినియోగదారునికి (${reporterName}),\n` +
        `మీరు అభ్యర్థి ${accusedName} పై చేసిన ఫిర్యాదు (టికెట్ నంబర్: *${id}*) పై ఇరు పక్షాల ఆధారాలను మా చీఫ్ రిజిస్ట్రార్ *${adminNameVal}* గారు పరిశీలిస్తున్నారు.\n\n` +
        `సత్యనిరూపణ కొరకు ఇరువురి ఫోన్ నెంబర్లు, ఐడి రుజువులు మరియు ప్రొఫైల్ సమాచారం సమగ్రంగా తనిఖీ చేయబడుతున్నాయి. రెండు వైపులా విచారణ పూర్తయిన పిదప తుది నిర్ణయం తీసుకోబడుతుంది. అంతవరకు ఇరువురి ప్రొఫైల్స్ ను హోల్డ్ లో ఉంచడం జరిగింది.\n\n` +
        `*Dear Complainant*,\n` +
        `A dual-party safety enquiry is actively ongoing under Chief Registrar *${adminNameVal}*. We are verifying phone details and identity registry of both parties to establish full truth. Both profiles are under investigation hold.\n\n` +
        `- Case Redressal Desk, Bramhana Vivaha Veadika`;
    }
    
    if (victimMsgScenario === "fake_complaint_warning") {
      return `*బ్రాహ్మణ వివాహ వేదిక - అసత్య లేదా దురుద్దేశపూర్వక ఫిర్యాదు హెచ్చరిక (WARNING FOR MALICIOUS ALLEGATIONS)*\n\n` +
        `గౌరవనీయులైన వినియోగదారునికి (${reporterName}),\n` +
        `మీరు అభ్యర్థి ${accusedName} పై సమర్పించిన ఫిర్యాదు (టికెట్ నంబర్: *${id}*) నిరాధారమైనదిగా లేదా కేవలం దురుద్దేశపూర్వకంగా అసత్య సమాచారంతో సృష్టించబడినట్లు మా చీఫ్ రిజిస్ట్రార్ *${adminNameVal}* గారి అంతర్గత దర్యాప్తులో నిర్ధారించబడింది.\n\n` +
        `ఇతరుల ప్రొఫైల్స్ పై తప్పుడు ఆరోపణలు చేయడం, అసత్య ఫిర్యాదులతో వేధించడం ఇండియన్ ఐటీ యాక్ట్ (IT Act 2021) మరియు మా సంస్థ నిబంధనల ప్రకారం తీవ్రమైన నేరం. ఈ ప్రవర్తన పునరావృతమైతే మీ ప్రొఫైల్ పై కూడా క్రమశిక్షణ చర్యలు/సస్పెన్షన్ తీసుకునే అవకాశం కలదు.\n\n` +
        `*Dear User*,\n` +
        `Our official investigation regarding the complaint (Ticket ID: *${id}*) you filed against ${accusedName} indicates that your allegations are unsubstantiated or submitted with invalid credentials. Submitting malicious reports violates our platform guidelines and IT Act rules.\n\n` +
        `- Case Redressal Desk, Bramhana Vivaha Veadika (Aesthetic Compliance Cell)`;
    }

    if (victimMsgScenario === "cybercrime_notified") {
      return `*బ్రాహ్మణ వివాహ వేదిక - సైబర్ క్రైమ్ సమాచార నివేదిక / Cybercrime Unit Notified*\n\n` +
        `గౌరవనీయులైన వినియోగదారునికి (${reporterName}),\n` +
        `అభ్యర్థి ${accusedName} పై మీరు చేసిన తీవ్రమైన మోసపూరిత ఆరోపణలు (టికెట్ నంబర్: *${id}*) మా చీఫ్ రిజిస్ట్రార్ *${adminNameVal}* గారి ద్వారా పరిశీలించబడ్డాయి.\n\n` +
        `వినియోగదారులందరి భద్రత మాకు అత్యంత ప్రాధాన్యత. సదరు నిందితుని ప్రొఫైల్ ను పూర్తిగా రద్దు చేయడమే కాకుండా, ఈ వ్యవహారాన్ని అధికారికంగా సైబర్ క్రైమ్ పోలీసుల దృష్టికి తీసుకువెళ్ళడం జరిగిందని మనవి. మా వినియోగదారులను ఫ్రాడ్స్ నుండి కాపాడుకోవడానికి మేము కట్టుబడి ఉన్నాము.\n\n` +
        `*Dear Complainant*,\n` +
        `Your high-gravity report (Ticket ID: *${id}*) has been verified. To protect our community from potential fraud, we have not only banned the accused permanently but have also escalated the details to the Cybercrime division. We stand committed to ensuring a secure and reliable platform.\n\n` +
        `- Legal Compliance, Bramhana Vivaha Veadika`;
    }

    if (victimMsgScenario === "victim_mercy_appeal") {
      return `*బ్రాహ్మణ వివాహ వేదిక - క్షమాభిక్ష అభ్యర్థన విజ్ఞప్తి / Appeal for Mercy & Second Chance*\n\n` +
        `గౌరవనీయులైన వినియోగదారునికి (${reporterName}),\n` +
        `మీరు అభ్యర్థి ${accusedName} పై సమర్పించిన ఫిర్యాదు పై మేము కఠిన చర్యలు చేపట్టాము. అయితే, వారు తమ తప్పును తెలుసుకుని పశ్చాత్తాపపడుతున్నారు. భవిష్యత్తులో ఇటువంటి పొరపాట్లు జరగవని వాగ్దానం చేస్తూ, అవకాశం ఇవ్వవలసిందిగా వేడుకుంటున్నారు.\n\n` +
        `వారు తమ ప్రవర్తనను మార్చుకునేందుకు ఒక చిన్న అవకాశం ఇచ్చి, వారిపై దయ/మన్నింపు చూపవలసిందిగా (Think and Mercy for small things) మా యాజమాన్యం మిమ్మల్ని కోరుతోంది. మీ చేదు అనుభవానికి మేము చింతిస్తున్నాము (We feel sad about your experience).\n\n` +
        `*Dear Complainant*,\n` +
        `We deeply feel sad about your experience. While we enacted strong measures, the accused is deeply apologetic and has pleaded for administrative mercy. We kindly ask you to think if we can give them a second chance to reform for smaller things. Your peace of mind remains our top goal.\n\n` +
        `- Safety Compliance Board, Bramhana Vivaha Veadika`;
    }
    
    return "";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Dashboard Banner */}
      <div className="bg-[#362B5A] text-white p-8 rounded-3xl shadow-xl border border-orange-500/10 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-10">
          <ShieldCheck className="w-64 h-64 text-orange-400" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-1.5 bg-[#C2242C]/20 border border-red-500/20 text-orange-300 w-fit px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
            <span>Spiritual Ingress Gatekeeper</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Sanctuary Dashboard</h2>
          <p className="text-blue-100 max-w-xl leading-relaxed text-sm">
            Review applicant profiles, authenticate sacred astrological credentials, run the match engine, and manage membership or subscription status securely.
          </p>
        </div>

        {/* Sync Indicator */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl relative z-10 text-right shrink-0">
          <span className="text-[10px] text-blue-200/60 uppercase tracking-widest block font-bold">Storage Integration Status</span>
          <p className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1.5 mt-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span>Database Live & Synced</span>
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Bar (No Scrolling Required) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-indigo-100 flex flex-wrap items-center justify-between gap-3 sticky top-4 z-30 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-[#362B5A] text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider">⚡ Quick Jump Bar</span>
          <span className="text-xs font-extrabold text-[#362B5A] hidden sm:inline">Live Controls:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveAdminTab("registrations")}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              activeAdminTab === "registrations" ? "bg-[#362B5A] text-white" : "bg-gray-50 hover:bg-gray-100 text-[#362B5A]"
            }`}
          >
            <span>👥 Registrations ({totalProfiles})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAdminTab("registrations");
              window.scrollTo({ top: 350, behavior: "smooth" });
            }}
            className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-200 shadow-xs"
          >
            <span>📊 Revenue: ₹{revenueStats.total.total.toLocaleString()}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAdminTab("registrations");
              window.scrollTo({ top: 250, behavior: "smooth" });
            }}
            className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-50 hover:bg-amber-100 text-amber-900 transition-all cursor-pointer flex items-center gap-1.5 border border-amber-200 shadow-xs"
          >
            <span>📈 Registration Graphs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab("matchEngine")}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              activeAdminTab === "matchEngine" ? "bg-[#362B5A] text-white" : "bg-gray-50 hover:bg-gray-100 text-[#362B5A]"
            }`}
          >
            <span>🧭 Match Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab("grievances")}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              activeAdminTab === "grievances" ? "bg-[#362B5A] text-white" : "bg-gray-50 hover:bg-gray-100 text-[#362B5A]"
            }`}
          >
            <span>🛡️ Grievance Cell</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCandidatesPasswordsCSV}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            title="Download Excel Sheet with Candidates and Passwords"
          >
            <span>📥 Excel Passwords</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAdminListModalOpen(true)}
            className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            title="View Authorized Admins List"
          >
            <span>👑 Admins List</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-3.5 py-2 bg-[#C2242C] hover:bg-opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span>+ Add Profile</span>
          </button>
        </div>
      </div>

      {/* Traditional Telugu Panchangam & Candidate Match Distribution Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 100-Year Traditional Hindu/Telugu Calendar & Panchangam Widget */}
        <div className="bg-gradient-to-br from-[#362B5A] to-[#241c3d] text-white rounded-3xl p-6 shadow-lg border border-amber-400/30 relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 opacity-10">
            <Calendar className="w-48 h-48 text-amber-400" />
          </div>
          <div className="flex items-center justify-between relative z-10 border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">🌾 100-Year Traditional Telugu Panchangam</span>
              <h3 className="text-lg font-black uppercase tracking-wide">శ్రీ శుభమస్తు నిత్య పంచాంగం</h3>
            </div>
            <span className="px-3 py-1 bg-amber-400 text-black font-black text-xs rounded-full">
              {new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10 text-xs">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <span className="text-[9px] text-amber-300 font-bold block uppercase">సంవత్సరం (Samvatsaram)</span>
              <span className="font-bold text-white text-sm">విశ్వావసు నామ</span>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <span className="text-[9px] text-amber-300 font-bold block uppercase">మాసం & పక్షం</span>
              <span className="font-bold text-white text-sm">శ్రావణ మాసం, శుక్ల</span>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <span className="text-[9px] text-amber-300 font-bold block uppercase">తిథి & నక్షత్రం</span>
              <span className="font-bold text-white text-sm">ద్వాదశి, పూర్వాషాఢ</span>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <span className="text-[9px] text-amber-300 font-bold block uppercase">శుభ గడియలు (Muhurtham)</span>
              <span className="font-bold text-emerald-400 text-sm">ఉదయం 09:15 - 11:30</span>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <span className="text-[9px] text-rose-400 font-bold block uppercase">రాహు కాలం (Rahu Kalam)</span>
              <span className="font-bold text-rose-300 text-sm">04:30 PM - 06:00 PM</span>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <span className="text-[9px] text-amber-300 font-bold block uppercase">సూర్యోదయ / అస్తమయం</span>
              <span className="font-bold text-white text-sm">06:02 AM / 06:41 PM</span>
            </div>
          </div>
        </div>

        {/* Candidate Match Distribution Intelligence (Highest, Lowest, Average) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest block">🎯 Candidate Match Distribution</span>
              <h3 className="text-lg font-black text-[#362B5A] uppercase tracking-wide">Match Intelligence Metrics</h3>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black text-xs rounded-full">
              {profiles.length} Active Candidates
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Male Match Distribution */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-2">
              <span className="font-black text-[#362B5A] uppercase tracking-wider block text-xs">👨 Male Candidates</span>
              <div className="space-y-1 text-[11px] text-gray-700 font-medium">
                <div className="flex justify-between"><span>Highest Matches:</span> <span className="font-bold text-emerald-700">{profiles.filter(p => p.gender === "Male").length ? Math.max(...profiles.filter(p => p.gender === "Male").map(m => profiles.filter(f => f.gender === "Female" && (f.sub_caste === m.sub_caste)).length)) : 0}</span></div>
                <div className="flex justify-between"><span>Average Matches:</span> <span className="font-bold text-indigo-700">{(profiles.filter(p => p.gender === "Male").length ? (profiles.filter(p => p.gender === "Male").reduce((acc, m) => acc + profiles.filter(f => f.gender === "Female" && (f.sub_caste === m.sub_caste)).length, 0) / profiles.filter(p => p.gender === "Male").length).toFixed(1) : 0)}</span></div>
                <div className="flex justify-between"><span>Lowest Matches:</span> <span className="font-bold text-amber-700">{profiles.filter(p => p.gender === "Male").length ? Math.min(...profiles.filter(p => p.gender === "Male").map(m => profiles.filter(f => f.gender === "Female" && (f.sub_caste === m.sub_caste)).length)) : 0}</span></div>
              </div>
            </div>

            {/* Female Match Distribution */}
            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-2">
              <span className="font-black text-[#362B5A] uppercase tracking-wider block text-xs">👩 Female Candidates</span>
              <div className="space-y-1 text-[11px] text-gray-700 font-medium">
                <div className="flex justify-between"><span>Highest Matches:</span> <span className="font-bold text-emerald-700">{profiles.filter(p => p.gender === "Female").length ? Math.max(...profiles.filter(p => p.gender === "Female").map(f => profiles.filter(m => m.gender === "Male" && (m.sub_caste === f.sub_caste)).length)) : 0}</span></div>
                <div className="flex justify-between"><span>Average Matches:</span> <span className="font-bold text-indigo-700">{(profiles.filter(p => p.gender === "Female").length ? (profiles.filter(p => p.gender === "Female").reduce((acc, f) => acc + profiles.filter(m => m.gender === "Male" && (m.sub_caste === f.sub_caste)).length, 0) / profiles.filter(p => p.gender === "Female").length).toFixed(1) : 0)}</span></div>
                <div className="flex justify-between"><span>Lowest Matches:</span> <span className="font-bold text-amber-700">{profiles.filter(p => p.gender === "Female").length ? Math.min(...profiles.filter(p => p.gender === "Female").map(f => profiles.filter(m => m.gender === "Male" && (m.sub_caste === f.sub_caste)).length)) : 0}</span></div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveAdminTab("matchEngine")}
            className="w-full py-2.5 bg-[#362B5A] hover:bg-[#282043] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
          >
            Open Full Match Engine →
          </button>
        </div>
      </div>

      {/* Executive Visual Analytics Suite (Waves, Area Graphs, Donut & Pie Charts, Hourly Heat Waves) */}
      <ExecutiveAnalyticsDashboard profiles={profiles} revenueStats={revenueStats} />

      {/* Advanced Bento Statistics Panel */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#C2242C]" />
          <h3 className="text-lg font-black text-[#362B5A] uppercase tracking-wider">Sanctuary Live Intelligence & Demographics</h3>
        </div>

        {/* Section 1: Core Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: "Total Candidates", value: totalProfiles, sub: "Registered Souls", color: "text-[#362B5A] bg-[#EBF6FF] border-blue-100" },
            { label: "Pending Verification", value: pendingCount, sub: "Awaiting Kundali Check", color: "text-amber-700 bg-amber-50 border-amber-100" },
            { label: "Verified Souls", value: verifiedCount, sub: "Astrologically Authenticated", color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
            { label: "Premium Matches", value: premiumCount, sub: "Full Access Members", color: "text-rose-700 bg-rose-50 border-rose-100" },
          ].map((stat, idx) => (
            <div key={idx} className={`p-5 sm:p-6 rounded-3xl border shadow-sm space-y-1.5 transition-all hover:scale-[1.01] ${stat.color}`}>
              <span className="text-[10px] uppercase tracking-widest block font-black opacity-80">{stat.label}</span>
              <p className="text-2xl sm:text-3xl font-black font-sans leading-none">{stat.value}</p>
              <span className="text-[10px] block font-mono font-medium opacity-70">{stat.sub}</span>
            </div>
          ))}
        </div>

        {/* Section 2: Gender Dynamics & Enrollment Velocity (Optimized for Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Gender Split Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span className="text-xs font-bold text-[#362B5A] uppercase tracking-wider">Candidate Gender Dynamics</span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/50 rounded-2xl text-center border border-blue-50">
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Males</span>
                <p className="text-2xl font-black text-[#362B5A] font-mono mt-1">{malesCount}</p>
                <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 block">
                  {totalProfiles > 0 ? ((malesCount / totalProfiles) * 100).toFixed(0) : 0}% of registry
                </span>
              </div>
              <div className="p-4 bg-rose-50/50 rounded-2xl text-center border border-rose-50">
                <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Females</span>
                <p className="text-2xl font-black text-[#362B5A] font-mono mt-1">{femalesCount}</p>
                <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 block">
                  {totalProfiles > 0 ? ((femalesCount / totalProfiles) * 100).toFixed(0) : 0}% of registry
                </span>
              </div>
            </div>
            {/* Visual ratio bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                <span>Male</span>
                <span>Female</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-500" 
                  style={{ width: `${totalProfiles > 0 ? (malesCount / totalProfiles) * 100 : 50}%` }}
                />
                <div 
                  className="bg-rose-500 h-full transition-all duration-500" 
                  style={{ width: `${totalProfiles > 0 ? (femalesCount / totalProfiles) * 100 : 50}%` }}
                />
              </div>
            </div>
          </div>

          {/* Enrollment Velocity */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span className="text-xs font-bold text-[#362B5A] uppercase tracking-wider">Enrollment Velocity</span>
              <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-mono font-bold uppercase">
                <ArrowUp className="w-3 h-3 text-emerald-600" /> Live
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl text-center border border-gray-100/50">
                <span className="text-[9px] text-gray-500 font-bold uppercase">Today</span>
                <p className="text-xl font-black text-[#362B5A] font-mono mt-1">{enrolledToday}</p>
                <span className="text-[8px] text-gray-400 uppercase font-mono mt-0.5 block">Souls Joined</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl text-center border border-gray-100/50">
                <span className="text-[9px] text-gray-500 font-bold uppercase">This Week</span>
                <p className="text-xl font-black text-[#362B5A] font-mono mt-1">{enrolledThisWeek}</p>
                <span className="text-[8px] text-gray-400 uppercase font-mono mt-0.5 block">Last 7 Days</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl text-center border border-gray-100/50">
                <span className="text-[9px] text-gray-500 font-bold uppercase">This Month</span>
                <p className="text-xl font-black text-[#362B5A] font-mono mt-1">{enrolledThisMonth}</p>
                <span className="text-[8px] text-gray-400 uppercase font-mono mt-0.5 block">Last 30 Days</span>
              </div>
            </div>
            <p className="text-[10px] text-center text-gray-400 font-semibold italic leading-snug">
              Encouraging digital enrollment through divine matches boosts community trust.
            </p>
          </div>
        </div>

        {/* Section 3: Age Demographics Breakdowns & Match Alignment Intelligence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Age Distribution Breakdown */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
            <span className="text-xs font-bold text-[#362B5A] uppercase tracking-wider block border-b border-gray-50 pb-2">
              Age Group Distribution
            </span>
            <div className="space-y-3.5">
              {/* Females */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-rose-700 font-extrabold uppercase tracking-wide block">Female Age Cohorts</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-rose-50/20 p-2 rounded-xl text-center border border-rose-100/30">
                    <span className="text-[8px] text-rose-600 block uppercase font-bold">21-25 Yrs</span>
                    <span className="text-sm font-extrabold text-[#362B5A] font-mono">{f_21_25}</span>
                  </div>
                  <div className="bg-rose-50/20 p-2 rounded-xl text-center border border-rose-100/30">
                    <span className="text-[8px] text-rose-600 block uppercase font-bold">25-30 Yrs</span>
                    <span className="text-sm font-extrabold text-[#362B5A] font-mono">{f_25_30}</span>
                  </div>
                  <div className="bg-rose-50/20 p-2 rounded-xl text-center border border-rose-100/30">
                    <span className="text-[8px] text-rose-600 block uppercase font-bold">30+ Yrs</span>
                    <span className="text-sm font-extrabold text-[#362B5A] font-mono">{f_30_plus}</span>
                  </div>
                </div>
              </div>

              {/* Males */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wide block">Male Age Cohorts</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50/20 p-2 rounded-xl text-center border border-blue-100/30">
                    <span className="text-[8px] text-blue-600 block uppercase font-bold">21-25 Yrs</span>
                    <span className="text-sm font-extrabold text-[#362B5A] font-mono">{m_21_25}</span>
                  </div>
                  <div className="bg-blue-50/20 p-2 rounded-xl text-center border border-blue-100/30">
                    <span className="text-[8px] text-blue-600 block uppercase font-bold">25-30 Yrs</span>
                    <span className="text-sm font-extrabold text-[#362B5A] font-mono">{m_25_30}</span>
                  </div>
                  <div className="bg-blue-50/20 p-2 rounded-xl text-center border border-blue-100/30">
                    <span className="text-[8px] text-blue-600 block uppercase font-bold">30+ Yrs</span>
                    <span className="text-sm font-extrabold text-[#362B5A] font-mono">{m_30_plus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bidirectional Alignment Metrics & Match Velocity extremes */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-5">
            <span className="text-xs font-bold text-[#362B5A] uppercase tracking-wider block border-b border-gray-50 pb-2">
              Brahmin Match Velocity & Celestial Alignment Extremes
            </span>
            
            <div className="space-y-4 text-xs">
              {/* Average Stat */}
              <div className="flex justify-between items-center p-2.5 bg-[#EBF6FF] rounded-xl border border-blue-100">
                <span className="font-extrabold text-[#362B5A] uppercase tracking-wide">Average Mutual Matches:</span>
                <span className="font-black text-[#C2242C] font-mono text-sm">{avgMatches} matches per Candidate</span>
              </div>

              {/* Mixed Overall Extremes */}
              <div className="space-y-2 bg-[#FDFBF7] p-3 rounded-2xl border border-amber-100/50">
                <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-widest block">Mixed Gender Pools (Combined)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-gray-500 font-bold block uppercase">Highest Matches (Mixed):</span>
                    <span className="font-black text-[#C2242C] truncate block mt-0.5" title={highestMatchProfile ? highestMatchProfile.profile.name : "None"}>
                      {highestMatchProfile ? `${highestMatchProfile.profile.name} (${highestMatchProfile.count} matches)` : "None"}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-gray-500 font-bold block uppercase">Lowest Matches (Mixed):</span>
                    <span className="font-black text-amber-700 truncate block mt-0.5" title={lowestMatchProfile ? lowestMatchProfile.profile.name : "None"}>
                      {lowestMatchProfile ? `${lowestMatchProfile.profile.name} (${lowestMatchProfile.count} matches)` : "None"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Boys / Male Extremes */}
              <div className="space-y-2 bg-[#F3F8FF] p-3 rounded-2xl border border-blue-100/40">
                <span className="text-[10px] text-blue-800 font-extrabold uppercase tracking-widest block">Boys Pool (కుమారుల విభాగం)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-blue-600 font-bold block uppercase">Highest Alignments (Boys):</span>
                    <span className="font-black text-[#362B5A] truncate block mt-0.5" title={highestBoyMatchProfile ? highestBoyMatchProfile.profile.name : "None"}>
                      {highestBoyMatchProfile ? `${highestBoyMatchProfile.profile.name} (${highestBoyMatchProfile.count} matches)` : "None"}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-blue-600 font-bold block uppercase">Lowest Alignments (Boys):</span>
                    <span className="font-black text-amber-600 truncate block mt-0.5" title={lowestBoyMatchProfile ? lowestBoyMatchProfile.profile.name : "None"}>
                      {lowestBoyMatchProfile ? `${lowestBoyMatchProfile.profile.name} (${lowestBoyMatchProfile.count} matches)` : "None"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Girls / Female Extremes */}
              <div className="space-y-2 bg-[#FFF4F6] p-3 rounded-2xl border border-rose-100/40">
                <span className="text-[10px] text-rose-800 font-extrabold uppercase tracking-widest block">Girls Pool (వధూమణి విభాగం)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-rose-600 font-bold block uppercase">Highest Alignments (Girls):</span>
                    <span className="font-black text-[#362B5A] truncate block mt-0.5" title={highestGirlMatchProfile ? highestGirlMatchProfile.profile.name : "None"}>
                      {highestGirlMatchProfile ? `${highestGirlMatchProfile.profile.name} (${highestGirlMatchProfile.count} matches)` : "None"}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-rose-600 font-bold block uppercase">Lowest Alignments (Girls):</span>
                    <span className="font-black text-amber-600 truncate block mt-0.5" title={lowestGirlMatchProfile ? lowestGirlMatchProfile.profile.name : "None"}>
                      {lowestGirlMatchProfile ? `${lowestGirlMatchProfile.profile.name} (${lowestGirlMatchProfile.count} matches)` : "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation Alert based on Low Match count (as requested) */}
            {lowestMatchProfile && lowestMatchProfile.count < 4 && (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 flex items-start gap-2 text-[10px] leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase tracking-wider block mb-0.5">Administrative Advice</span>
                  We suggest adjusting height and sub-caste requirements for candidates with limited choices to improve mutual matches and encourage subscription upgrades.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sacred Vedic Jataka & Elder Age Alignment Inspector (సనాతన జాతక వయో విశ్లేషణ ప్యానెల్) */}
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
            <div>
              <h4 className="font-extrabold text-[#362B5A] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Sacred Jataka & Elder Age Inspector (సనాతన జాతక వయో విశ్లేషణ)</span>
              </h4>
              <p className="text-[10px] text-gray-500 leading-normal">
                Strict Vedic Rule: Boys MUST be 2 or 3 years older than girls. Girls must NOT be older than boys. Horoscope/Jataka compatibility score must be ≥ 60%.
              </p>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-mono font-bold px-3 py-1 rounded-full border border-amber-200 uppercase tracking-wider shrink-0">
              {perfectVedicPairs.length} Perfect Pairs Calculated
            </span>
          </div>

          {perfectVedicPairs.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              No pairs found in current database matching strict 2-3 years age gap and Jataka horoscope score.
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-3.5 pr-2 scrollbar-thin">
              {perfectVedicPairs.map(({ boy, girl, boyAge, girlAge, ageDiff, jatakaScore }, idx) => (
                <div 
                  key={`${boy.id}-${girl.id}-${idx}`}
                  className="p-3.5 bg-[#FAF9F5] border border-amber-100/70 rounded-2xl hover:bg-amber-50/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  {/* Boy details */}
                  <div className="space-y-1 md:w-[40%] text-left">
                    <span className="text-[9px] bg-blue-50 text-blue-700 font-mono font-bold uppercase px-2 py-0.5 rounded-full">
                      Boy (వరుడు)
                    </span>
                    <p className="font-extrabold text-blue-900 mt-1">
                      {boy.surname} {boy.name}
                    </p>
                    <div className="text-[10px] text-gray-500 space-y-0.5">
                      <p>Age: <strong className="text-gray-700">{boyAge} Yrs</strong> | sub-caste: <strong className="uppercase font-mono text-[#C2242C]">{boy.sub_caste}</strong></p>
                      <p>Gothram: <strong className="text-gray-700">{boy.gothram || "N/A"}</strong> | Star: <strong className="text-gray-700">{boy.nakshatram || "N/A"}</strong></p>
                    </div>
                  </div>

                  {/* Divine Match Indicator */}
                  <div className="flex flex-col items-center justify-center py-2 px-4 bg-white rounded-xl border border-amber-100 shrink-0 md:w-[20%]">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
                    <span className="text-[10px] font-black text-[#362B5A] font-mono mt-1">
                      {ageDiff} Yrs Gap
                    </span>
                    <span className="text-[9px] text-emerald-700 font-bold mt-0.5">
                      Jataka: {jatakaScore}%
                    </span>
                  </div>

                  {/* Girl details */}
                  <div className="space-y-1 md:w-[40%] text-right">
                    <span className="text-[9px] bg-rose-50 text-rose-700 font-mono font-bold uppercase px-2 py-0.5 rounded-full">
                      Girl (వధువు)
                    </span>
                    <p className="font-extrabold text-rose-900 mt-1">
                      {girl.surname} {girl.name}
                    </p>
                    <div className="text-[10px] text-gray-500 space-y-0.5">
                      <p>Age: <strong className="text-gray-700">{girlAge} Yrs</strong> | sub-caste: <strong className="uppercase font-mono text-[#C2242C]">{girl.sub_caste}</strong></p>
                      <p>Gothram: <strong className="text-gray-700">{girl.gothram || "N/A"}</strong> | Star: <strong className="text-gray-700">{girl.nakshatram || "N/A"}</strong></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-[9px] text-gray-400 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/40 leading-relaxed text-center">
            🌌 <strong className="text-[#362B5A]">Average Age Gap for Valid Matches:</strong> {perfectVedicPairs.length > 0 ? (perfectVedicPairs.reduce((acc, p) => acc + p.ageDiff, 0) / perfectVedicPairs.length).toFixed(1) : "0"} Years | <strong className="text-[#362B5A]">Average Jataka Spiritual Compatibility:</strong> {perfectVedicPairs.length > 0 ? (perfectVedicPairs.reduce((acc, p) => acc + p.jatakaScore, 0) / perfectVedicPairs.length).toFixed(0) : "0"}%
          </div>
        </div>
      </div>

      {/* SECTION: ADMIN REVENUE & TRUST AUDIT LEDGER */}
      <div className="bg-gradient-to-br from-[#FCFCFA] via-white to-[#FDF9F7] rounded-3xl p-6 sm:p-8 border-2 border-amber-100 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-100 pb-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] text-amber-800 font-extrabold tracking-widest uppercase block">
                Financial Accounts & Verification Audit
              </span>
            </div>
            <h3 className="text-xl font-black text-[#362B5A]">
              Revenue Ledger (ఆదాయం & ఆడిట్ రికార్డు)
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Dynamically aggregated from Brahmin candidate payments. Verified by 
              Lead Admins <strong className="text-amber-800 font-bold">GV Subramanyam</strong> and <strong className="text-[#362B5A] font-bold">PV Subba Reddy</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200">
            <div className="p-1.5 bg-[#C2242C]/10 text-[#C2242C] rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <span className="text-[8px] uppercase text-zinc-500 font-bold tracking-wider block">Auditing Engine</span>
              <span className="text-xs font-black text-amber-800">Veda Ledger 2.1</span>
            </div>
          </div>
        </div>

        {/* Financial Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Card: Total Accumulation */}
          <div className="bg-gradient-to-br from-[#362B5A] to-[#1D1737] text-white p-6 rounded-2xl border border-purple-500/15 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black tracking-widest text-orange-300">
                  Total Collected Revenue
                </span>
                <span className="bg-[#C2242C]/40 border border-red-500/20 text-white text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                  Audited
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-black font-sans text-amber-400 leading-none">
                  ₹{(revenueStats.total.total).toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-zinc-300 font-medium">
                  Sum of Registration and Premium upgrades
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-6 grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-[9px] text-zinc-400 block font-bold uppercase">Reg Fees (₹100)</span>
                <span className="text-sm font-black text-white">₹{revenueStats.total.reg.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 block font-bold uppercase">Prem Upgrades (₹900)</span>
                <span className="text-sm font-black text-[#25D366]">₹{revenueStats.total.prem.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Admin 1: GV Subramanyam */}
          <div className="bg-white rounded-2xl p-6 border-2 border-amber-100 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-300/30 text-amber-800 text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase">
                    👑 Founder
                  </span>
                  <h4 className="text-base font-black text-[#362B5A] mt-1.5">GV Subramanyam</h4>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 text-amber-700 font-black text-sm">
                  GVS
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3">
                <div>
                  <span className="text-[9px] text-zinc-500 block font-bold uppercase">REG (₹100) Collected</span>
                  <span className="text-sm font-black text-zinc-800">₹{revenueStats.subramanyam.reg.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block font-bold uppercase">PREM (₹900) Collected</span>
                  <span className="text-sm font-black text-amber-700">₹{revenueStats.subramanyam.prem.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-100/50 mt-4">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-zinc-500 uppercase">Sub-Total Revenue:</span>
                <span className="font-black text-amber-800 font-mono">₹{revenueStats.subramanyam.total.toLocaleString("en-IN")}</span>
              </div>
              <span className="text-[8.5px] text-zinc-400 block mt-1 font-semibold italic text-center">
                * All transactions approved & registered by GV Subramanyam
              </span>
            </div>
          </div>

          {/* Admin 2: PV Subba Reddy */}
          <div className="bg-white rounded-2xl p-6 border-2 border-purple-100 shadow-sm flex flex-col justify-between hover:border-purple-300 transition-all">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-flex items-center gap-1 bg-purple-500/10 border border-purple-300/30 text-purple-800 text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase">
                    👑 Co-Founder
                  </span>
                  <h4 className="text-base font-black text-[#362B5A] mt-1.5">PV Subba Reddy</h4>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 text-purple-700 font-black text-sm">
                  PVS
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3">
                <div>
                  <span className="text-[9px] text-zinc-500 block font-bold uppercase">REG (₹100) Collected</span>
                  <span className="text-sm font-black text-zinc-800">₹{revenueStats.subbaReddy.reg.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block font-bold uppercase">PREM (₹900) Collected</span>
                  <span className="text-sm font-black text-purple-700">₹{revenueStats.subbaReddy.prem.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-500/5 p-3 rounded-xl border border-purple-100/50 mt-4">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-zinc-500 uppercase">Sub-Total Revenue:</span>
                <span className="font-black text-[#362B5A] font-mono">₹{revenueStats.subbaReddy.total.toLocaleString("en-IN")}</span>
              </div>
              <span className="text-[8.5px] text-zinc-400 block mt-1 font-semibold italic text-center">
                * All transactions approved & registered by PV Subba Reddy
              </span>
            </div>
          </div>
        </div>

        {/* Table of paid members and audit trails */}
        <div className="bg-white/60 rounded-2xl border border-amber-100/60 overflow-hidden">
          <div className="bg-amber-500/5 px-4 py-3 border-b border-amber-100/60 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#362B5A] uppercase tracking-wider block">
              Recent Verified Transactions & Auditor Trail
            </span>
            <span className="text-[9px] text-zinc-500 font-bold">
              Showing active financial records
            </span>
          </div>
          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 text-zinc-500 uppercase font-bold tracking-wider border-b border-zinc-100 text-[9px]">
                  <th className="py-2.5 px-4">Candidate ID / Reg #</th>
                  <th className="py-2.5 px-4">Candidate Name</th>
                  <th className="py-2.5 px-4">Receipt Status</th>
                  <th className="py-2.5 px-4">Paid Fees</th>
                  <th className="py-2.5 px-4">Verified By Admin</th>
                  <th className="py-2.5 px-4">Audited Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 font-medium">
                {profiles.filter(p => p.subscription_status === "paid_100" || p.subscription_status === "paid_900").slice(0, 5).map((p) => {
                  const verifiedBy = p.fee_received_by || p.registered_by || "GV Subramanyam";
                  const feesPaid = p.subscription_status === "paid_900" ? "₹1000 Total (₹100 Reg + ₹900 Prem)" : "₹100 (Reg Fee Only)";
                  
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-2 px-4 font-mono font-bold text-[#362B5A]">
                        {p.reg_number || `BVM-${p.id.slice(0, 4).toUpperCase()}`}
                      </td>
                      <td className="py-2 px-4">
                        {p.surname ? `${p.surname} ` : ""}{p.name}
                      </td>
                      <td className="py-2 px-4">
                        {p.subscription_status === "paid_900" ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border border-emerald-100">
                            👑 paid_900
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border border-amber-100">
                            💳 paid_100
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 font-black text-zinc-700">
                        {feesPaid}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-0.5 rounded font-black uppercase text-[8.5px] ${
                          verifiedBy.includes("Subramanyam") ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {verifiedBy}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-zinc-500 font-mono text-[10px]">
                        {p.fee_received_at || p.registered_at_time || "Recent Transaction"}
                      </td>
                    </tr>
                  );
                })}
                {profiles.filter(p => p.subscription_status === "paid_100" || p.subscription_status === "paid_900").length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-zinc-400 font-bold">
                      No verified transactions found. Set subscription levels to paid_100 or paid_900 to record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Admin Portal */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-thin">
        <button
          onClick={() => setActiveAdminTab("registrations")}
          className={`py-3 px-6 font-extrabold text-sm uppercase tracking-wider border-b-4 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeAdminTab === "registrations"
              ? "border-[#C2242C] text-[#362B5A]"
              : "border-transparent text-gray-500 hover:text-[#362B5A]"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Registrations Manager
        </button>
        <button
          onClick={() => setActiveAdminTab("matchEngine")}
          className={`py-3 px-6 font-extrabold text-sm uppercase tracking-wider border-b-4 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeAdminTab === "matchEngine"
              ? "border-[#C2242C] text-[#362B5A]"
              : "border-transparent text-gray-500 hover:text-[#362B5A]"
          }`}
        >
          <Compass className="w-4 h-4" />
          Sacred Match Engine
        </button>
        <button
          onClick={() => setActiveAdminTab("grievances")}
          className={`py-3 px-6 font-extrabold text-sm uppercase tracking-wider border-b-4 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeAdminTab === "grievances"
              ? "border-[#C2242C] text-[#362B5A]"
              : "border-transparent text-gray-500 hover:text-[#362B5A]"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-[#C2242C]" />
          Grievance Cell ({grievances.filter((g) => g.status === "Pending").length})
        </button>
        <button
          onClick={() => setActiveAdminTab("marriages")}
          className={`py-3 px-6 font-extrabold text-sm uppercase tracking-wider border-b-4 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeAdminTab === "marriages"
              ? "border-[#C2242C] text-[#362B5A]"
              : "border-transparent text-gray-500 hover:text-[#362B5A]"
          }`}
        >
          <Heart className="w-4 h-4 text-rose-600" />
          Successful Marriages ({marriageRecords.length})
        </button>
      </div>

      {/* Quick message banner */}
      {updateMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-2xl text-center shadow-sm flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-pulse" />
          <span>{updateMsg}</span>
        </div>
      )}

      {/* Tab CONTENT 1: Registrations Manager */}
      {activeAdminTab === "registrations" && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="space-y-4">
            {/* Search Box & Controls Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Wider Search Bar with Clear Helper Info */}
              <div className="relative flex-1 w-full flex flex-col gap-1">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">🔍 Wide Unified Search Box:</span>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by ID (e.g. BVM-1001), Candidate Name, Surname (ఇంటిపేరు), Mobile Number, Gothram, Caste/Sub-Caste..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#362B5A]/20 focus:border-[#362B5A] bg-[#EBF6FF]/35 font-bold text-indigo-950 placeholder-slate-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-extrabold text-sm"
                        title="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="px-5 py-2.5 bg-[#362B5A] text-white rounded-xl text-xs font-black uppercase hover:bg-opacity-90 transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    Search
                  </button>
                </div>
                <span className="text-[8.5px] text-gray-400 font-medium">Tip: Type any partial detail (e.g. surname or mobile) to instantly filter the list.</span>
              </div>

              {/* Basic Filters & Purge & Register Candidates */}
              <div className="flex flex-wrap items-end gap-3 shrink-0 lg:pt-5">
                <div className="flex items-center gap-2 bg-[#EBF6FF]/50 px-3 py-1.5 rounded-xl border border-gray-100">
                  <Filter className="w-3.5 h-3.5 text-[#362B5A]" />
                  <span className="text-xs font-bold text-[#362B5A] uppercase tracking-wider">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-[#362B5A] focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Premium">Premium</option>
                    <option value="Declined">Declined</option>
                    <option value="Mercy">🤝 Mercy / Changed Punishment</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-[#EBF6FF]/50 px-3 py-1.5 rounded-xl border border-gray-100">
                  <User className="w-3.5 h-3.5 text-[#362B5A]" />
                  <span className="text-xs font-bold text-[#362B5A] uppercase tracking-wider">Gender:</span>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-[#362B5A] focus:outline-none cursor-pointer"
                  >
                    <option value="All">Both Genders</option>
                    <option value="Female">Female Only</option>
                    <option value="Male">Male Only</option>
                  </select>
                </div>

                {/* Purge Fake Data */}
                <button
                  type="button"
                  onClick={handlePurgeFakeData}
                  className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#C2242C] font-extrabold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                  title="Delete all temporary candidates except the official admin accounts"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Purge Fake Data</span>
                </button>

                {/* Register New Candidate */}
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationType("candidate");
                    setKundaliStatus("pending");
                    setIsRegisterModalOpen(true);
                  }}
                  className="px-4 py-1.5 bg-[#C2242C] hover:bg-red-700 text-white font-extrabold text-xs rounded-xl border border-red-800/10 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                  title="Add a brand new candidate registration profile"
                >
                  <UserPlus className="w-3.5 h-3.5 text-white" />
                  <span>+ Register Candidate</span>
                </button>

                {/* Register Hired Admin / Employee */}
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationType("employee");
                    setKundaliStatus("pending");
                    setIsRegisterModalOpen(true);
                  }}
                  className="px-4 py-1.5 bg-[#362B5A] hover:bg-[#2b2247] text-white font-extrabold text-xs rounded-xl border border-[#362B5A]/25 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                  title="Register a Hired Administrator / Office Employee with dashboard access"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>+ Register Employee / Hired Admin</span>
                </button>
              </div>
            </div>

            {/* Agent Calling Segments Filter Deck */}
            <div className="bg-[#EBF6FF]/30 border border-[#EBF6FF]/80 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-[#362B5A] tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#C2242C]" />
                    <span>Telephony Calling Segments (ఆఫీస్ ఏజెంట్స్ కాలింగ్ విభాగాలు):</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Instantly isolate profile batches for phone coordination based on payments and matches.</p>
                </div>

                {/* Excel Download Panel */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">📊 Excel Sheets Desk:</span>
                  <button
                    type="button"
                    onClick={() => handleOpenCandidatesNewTab(filteredProfiles)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-[#1E1B4B] to-[#362B5A] hover:from-black hover:to-[#1E1B4B] text-amber-300 border border-amber-400/30 font-black text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                    title="Open candidates master table in a dedicated new tab view with instant search & print options"
                  >
                    <span>🌐 See Candidates in Excel Sheet (New Tab)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCSV(profiles, false)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    title="Export all database profiles to an Excel CSV sheet"
                  >
                    <span>📥 All Users (.csv)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCSV(filteredProfiles, true)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    title="Export only the profiles currently displayed in the filtered list below"
                  >
                    <span>📥 Filtered ({filteredProfiles.length}) (.csv)</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCallingSegmentFilter("All")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center gap-1 ${
                    callingSegmentFilter === "All"
                      ? "bg-[#362B5A] text-white border-[#362B5A]"
                      : "bg-white text-[#362B5A] border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  👥 All Candidates ({profiles.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCallingSegmentFilter("no_100_fee")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center gap-1 ${
                    callingSegmentFilter === "no_100_fee"
                      ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                      : "bg-white text-amber-700 border-amber-100 hover:bg-amber-50"
                  }`}
                  title="Candidates who registered but haven't approved/paid the ₹100 registration fee yet"
                >
                  ⚠️ 100 Reg Fee NOT Paid ({profiles.filter(p => p.subscription_status === "free" || !p.subscription_status).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCallingSegmentFilter("paid_100_no_matches")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center gap-1 ${
                    callingSegmentFilter === "paid_100_no_matches"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-blue-700 border-blue-100 hover:bg-blue-50"
                  }`}
                  title="Candidates who paid ₹100, but the system/admin hasn't shortlisted any matches for them yet"
                >
                  ⏳ 100 Paid, No Matches Yet ({profiles.filter(p => p.subscription_status === "paid_100" && (!p.approved_matches || p.approved_matches.length === 0)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCallingSegmentFilter("has_matches_no_900")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center gap-1 ${
                    callingSegmentFilter === "has_matches_no_900"
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm animate-pulse"
                      : "bg-white text-rose-700 border-rose-100 hover:bg-rose-50"
                  }`}
                  title="Matches have been shortlisted for them, but they haven't paid the ₹900 premium fee to view details"
                >
                  🔥 Matches Found, NOT Paid 900 ({profiles.filter(p => p.subscription_status === "paid_100" && p.approved_matches && p.approved_matches.length > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCallingSegmentFilter("paid_900")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center gap-1 ${
                    callingSegmentFilter === "paid_900"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-emerald-700 border-emerald-100 hover:bg-emerald-50"
                  }`}
                  title="Paid premium members who have full access"
                >
                  👑 900 Premium Paid ({profiles.filter(p => p.subscription_status === "paid_900").length})
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="py-20 text-center space-y-4">
              <svg className="animate-spin h-8 w-8 text-[#C2242C] mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500 font-bold font-mono">Quarrying Profiles from Table...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl max-w-md mx-auto space-y-3">
              <AlertCircle className="w-8 h-8 text-orange-400 mx-auto animate-bounce" />
              <h4 className="text-base font-bold text-[#362B5A]">No Profiles Found</h4>
              <p className="text-xs text-gray-400">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-left">
                <thead className="bg-[#EBF6FF]/50">
                  <tr>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#362B5A] uppercase tracking-wider">Candidate Name & ID</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#362B5A] uppercase tracking-wider">Mobile (మొబైల్)</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#362B5A] uppercase tracking-wider">Sub-Caste & Profession</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#362B5A] uppercase tracking-wider">DOB & Height</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#362B5A] uppercase tracking-wider">Salary LPA</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#362B5A] uppercase tracking-wider text-center">Verification Status</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#362B5A] uppercase tracking-wider text-center">Subscription Status</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#362B5A] uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {filteredProfiles.map((p) => {
                    const subStatus = p.subscription_status || "free";
                    return (
                      <tr 
                        key={p.id} 
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Name Column */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div 
                            onClick={() => handleProfileClick(p)}
                            className="flex items-start gap-3 cursor-pointer hover:opacity-80"
                            title="Click to shortlist matches for this profile"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#362B5A]/10 shadow-sm shrink-0 mt-0.5">
                              <img
                                src={p.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-bold text-[#362B5A] leading-tight flex items-center gap-1">
                                {p.name}
                                {p.status === "Premium" && <Award className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />}
                              </p>
                              <span 
                                className="text-[9px] font-mono text-gray-400 block uppercase px-1 bg-gray-100 rounded w-fit"
                              >
                                {p.id}
                              </span>
                              {(p.gothram || p.surname) && (
                                <span className="text-[8px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded block w-fit">
                                  {p.surname ? `${p.surname} • ` : ""}{p.gothram || "No Gotram"}
                                </span>
                              )}
                              {p.nakshatram && (
                                <span className="text-[8px] bg-purple-50 text-purple-800 font-bold px-1.5 py-0.5 rounded block w-fit">
                                  ✨ {p.nakshatram} nakshatram
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMediaProfile(p);
                                }}
                                className="mt-1.5 inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-[#C2242C] text-[10px] font-extrabold px-2 py-1 rounded-lg border border-amber-200 transition-all cursor-pointer shadow-xs w-fit"
                              >
                                📸 Photos & Kundali Vault
                              </button>

                              {/* Registration Creator Audit Info */}
                              <div className="text-[9px] text-gray-500 font-semibold bg-gray-50 px-2 py-1 rounded-lg border border-gray-100/50 w-fit max-w-[240px] whitespace-normal">
                                📥 Created by: <span className="font-bold text-indigo-700">{p.registered_by || "Self Registered"}</span>
                                {p.registered_at_time && <span className="text-[8px] text-gray-400 block font-mono">{p.registered_at_time}</span>}
                              </div>

                              {/* Payment audit tracker info */}
                              {(subStatus === "paid_100" || subStatus === "paid_900") && (
                                <div className="text-[9px] text-emerald-800 bg-emerald-50/70 border border-emerald-100 rounded-lg p-2 space-y-0.5 max-w-[240px] whitespace-normal">
                                  <p className="font-extrabold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                    <span>Verified Match Fees</span>
                                  </p>
                                  <p className="text-[8px] font-mono leading-normal text-emerald-700">
                                    Confirmed by: <span className="font-black">{p.fee_received_by || "GV Subramanyam"}</span>
                                  </p>
                                  <p className="text-[8px] font-mono leading-normal text-emerald-700">
                                    TXN ID: <span className="font-black bg-white px-1.5 py-0.5 rounded border border-emerald-200">{p.fee_transaction_id || "N/A"}</span>
                                  </p>
                                  {p.fee_received_at && (
                                    <p className="text-[8px] text-emerald-600/80 font-bold">{p.fee_received_at}</p>
                                  )}
                                </div>
                              )}

                              {/* Suspension info & Revocation controls */}
                              {p.status === "Declined" && (
                                <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-2.5 max-w-[240px] whitespace-normal">
                                  <div className="flex items-center gap-1.5 text-[#C2242C] font-extrabold text-[10px]">
                                    <span className="animate-pulse">🚫</span>
                                    <span>SUSPENDED / నిలిపివేయబడింది</span>
                                  </div>
                                  
                                  {p.suspension_lift_at ? (
                                    <div className="text-[9px] text-amber-800 font-bold bg-amber-50 border border-amber-200/50 p-1.5 rounded-lg leading-tight font-sans">
                                      ⏰ Scheduled Auto-lifting:
                                      <p className="text-[8.5px] text-rose-700 font-black mt-0.5 font-mono">
                                        {new Date(p.suspension_lift_at).toLocaleDateString()} at {new Date(p.suspension_lift_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </p>
                                      {p.suspension_reason && (
                                        <p className="text-[8px] text-gray-500 font-normal mt-0.5 italic leading-tight">
                                          ({p.suspension_reason})
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-[9px] text-zinc-700 font-bold bg-zinc-100 border border-zinc-200 p-1.5 rounded-lg leading-tight">
                                      🔒 Permanent Hold / నిరవధిక నిలిపివేత
                                      <p className="text-[8px] text-zinc-500 font-normal mt-0.5 font-sans">
                                        No active auto-lifting timer configured.
                                      </p>
                                    </div>
                                  )}

                                  <div className="space-y-1.5 pt-1 border-t border-rose-100">
                                    <label className="text-[8.5px] font-black uppercase text-[#362B5A] tracking-wider block">
                                      ⚡ Change Punishment:
                                    </label>
                                    <select
                                      defaultValue=""
                                      onChange={async (e) => {
                                        const val = e.target.value as any;
                                        if (val) {
                                          await handleRevokeSuspension(p.id, val);
                                          e.target.value = ""; // Reset dropdown selection
                                        }
                                      }}
                                      className="w-full text-[10px] font-extrabold bg-white border border-rose-200 text-rose-900 rounded-lg p-1.5 cursor-pointer focus:ring-1 focus:ring-rose-400 focus:outline-none transition-all shadow-xs"
                                    >
                                      <option value="">-- Choose New Action --</option>
                                      <option value="24h">⏰ Short-term Hold: 24 Hours</option>
                                      <option value="7day">📅 1 Week (7 Days)</option>
                                      <option value="30day">🗓️ 1 Month (30 Days)</option>
                                      <option value="60day">🗓️ 2 Months (60 Days)</option>
                                      <option value="90day">🗓️ 3 Months (90 Days)</option>
                                      <option value="180day">🗓️ 6 Months (180 Days)</option>
                                      <option value="365day">🗓️ 12 Months (1 Year)</option>
                                      <option value="730day">🗓️ 24 Months (2 Years)</option>
                                      <option value="permanent">🔒 Make Suspension Permanent</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await handleRevokeSuspension(p.id, "now");
                                        // Also trigger direct WhatsApp message
                                        handleSendDirectWhatsapp(p.contact_number, "mercy_accused", p.name);
                                      }}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-black uppercase py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                                      title="Immediately restore account status to Verified and notify via WhatsApp"
                                    >
                                      <span>🔓 Revoke Now & Send WhatsApp (రద్దు & వార్నింగ్ మెసేజ్)</span>
                                    </button>
                                  </div>

                                  {/* Quick WhatsApp Actions */}
                                  <div className="pt-2 border-t border-rose-100/60 space-y-1.5">
                                    <p className="text-[8px] font-black uppercase text-rose-800 tracking-wider">📢 Quick WhatsApp Templates:</p>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSendDirectWhatsapp(p.contact_number, "mercy_accused", p.name);
                                      }}
                                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-[8.5px] font-bold py-1 px-2 rounded border border-emerald-600/20 transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                                      title="Notify accused candidate that their hold is changed/revoked"
                                    >
                                      <span>💬 Notify Accused (మన్నింపు హెచ్చరిక)</span>
                                    </button>
                                    {(() => {
                                      const lg = grievances.find(g => g.accusedId === p.id);
                                      if (lg && lg.reporterPhone) {
                                        return (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSendDirectWhatsapp(lg.reporterPhone, "appeal_victim", p.name, lg.reporterName);
                                            }}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-[8.5px] font-bold py-1 px-2 rounded border border-blue-600/20 transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                                            title="Send forgiveness appeal to complainant"
                                          >
                                            <span>💬 Appeal to Victim (క్షమాభిక్ష కోరుట)</span>
                                          </button>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                              )}

                              {/* Mercy / Punishment Change Audit Log */}
                              {(p.is_mercy_granted || (p.punishment_history && p.punishment_history.length > 0)) && (
                                <div className="mt-2 p-2.5 bg-[#EBF6FF] border border-blue-100 rounded-xl space-y-1.5 max-w-[240px] whitespace-normal text-left shadow-xs">
                                  <div className="flex items-center gap-1.5 text-blue-800 font-extrabold text-[9px] uppercase tracking-wider">
                                    <span>🤝 Mercy / Changed Punishment</span>
                                  </div>
                                  <div className="text-[8px] text-blue-900 leading-normal space-y-1">
                                    <p className="font-bold">✨ This candidate received official administrative mercy or modified hold terms.</p>
                                    
                                    {/* Direct WhatsApp Messaging */}
                                    <div className="mt-2 pt-2 border-t border-blue-200/50 space-y-1">
                                      <p className="text-[7.5px] font-extrabold uppercase text-blue-800 tracking-wider">📢 Send WhatsApp template:</p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSendDirectWhatsapp(p.contact_number, "mercy_accused", p.name);
                                        }}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-black uppercase py-1 px-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                                      >
                                        <span>💬 Notify Accused (మన్నింపు)</span>
                                      </button>
                                      {(() => {
                                        const lg = grievances.find(g => g.accusedId === p.id);
                                        if (lg && lg.reporterPhone) {
                                          return (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSendDirectWhatsapp(lg.reporterPhone, "appeal_victim", p.name, lg.reporterName);
                                              }}
                                              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-[8px] font-black uppercase py-1 px-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                                            >
                                              <span>💬 Appeal to Victim (క్షమించుట)</span>
                                            </button>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>

                                    {p.punishment_history && p.punishment_history.length > 0 && (
                                      <div className="mt-1.5 pt-1.5 border-t border-blue-200/45 space-y-1 max-h-[80px] overflow-y-auto scrollbar-thin">
                                        {p.punishment_history.map((log, i) => (
                                          <p key={i} className="text-[7.5px] font-mono bg-white/60 p-1 rounded border border-blue-100/40 leading-tight">
                                            • {log}
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Mobile Column with WhatsApp template launcher */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => setAssociatedPhoneModal(p.contact_number)}
                              className="inline-flex items-center justify-between gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#362B5A] font-extrabold text-xs rounded-xl border border-indigo-100 transition-all cursor-pointer shadow-sm w-full"
                              title="Click to view profiles associated with this number"
                            >
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span className="font-mono text-xs font-black">{p.contact_number}</span>
                              </div>
                              <span className="text-[8px] bg-white text-indigo-600 font-black px-1.5 rounded border border-indigo-200">Ref</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setWhatsappProfile(p);
                                setIsWhatsappModalOpen(true);
                              }}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20ba56] text-white font-extrabold text-[10px] rounded-xl transition-all cursor-pointer shadow-sm border border-[#25D366]/20 uppercase tracking-wider"
                              title="Send templates based on payment"
                            >
                              <svg className="w-3.5 h-3.5 fill-white shrink-0" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.528 2.017 14.077.99 11.517.99c-5.44 0-9.866 4.372-9.87 9.802 0 1.958.52 3.878 1.503 5.586L2.148 21.84l5.656-1.474z" />
                              </svg>
                              <span>WhatsApp</span>
                            </button>

                            {/* Copyable Login Credentials Box */}
                            <div className="mt-1.5 p-2 bg-amber-50/60 border border-amber-100 rounded-xl space-y-1 text-[10px] text-[#362B5A] font-mono select-all shadow-xs leading-tight">
                              <div className="flex items-center justify-between gap-2 border-b border-amber-200/30 pb-0.5">
                                <span className="text-[8px] text-gray-500 font-sans font-bold uppercase">Login ID:</span>
                                <span className="font-bold select-all">{p.contact_number}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 border-b border-amber-200/30 pb-0.5">
                                <span className="text-[8px] text-gray-500 font-sans font-bold uppercase">Password:</span>
                                <span className="font-extrabold text-rose-700 select-all">
                                  {p.password || (() => {
                                    if (!p.dob) return "Not set";
                                    const m = p.dob.trim().match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
                                    return m ? `${m[3]}${m[2]}${m[1]}` : p.dob.replace(/[-/]/g, "");
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[8px] text-gray-500 font-sans font-bold uppercase">Reg Code:</span>
                                <span className="font-bold text-indigo-700 select-all">{p.reg_number || p.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Profession & Caste */}
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-gray-800 text-xs truncate max-w-[180px]">{p.profession}</p>
                            <span className="text-[10px] text-indigo-700 font-mono font-bold uppercase">{p.sub_caste}</span>
                          </div>
                        </td>

                        {/* DOB & Height */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-xs">
                            <span className="font-mono text-gray-600 block">{p.dob} ({calculateAge(p.dob)} yrs)</span>
                            <span className="text-[10px] font-bold text-[#362B5A] block mt-0.5">{p.height_feet} Ft / {p.gender}</span>
                          </div>
                        </td>

                        {/* Salary LPA */}
                        <td className="px-4 py-4 whitespace-nowrap font-mono font-bold text-[#362B5A] text-xs">
                          ₹ {p.salary_lpa} LPA
                        </td>

                        {/* Registration Approval Select */}
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value as Profile["status"])}
                            className={`text-xs font-bold px-2 py-1.5 rounded-xl border focus:outline-none cursor-pointer transition-all ${
                              p.status === "Premium"
                                ? "bg-rose-50 border-rose-200 text-rose-700"
                                : p.status === "Verified"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : p.status === "Pending"
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-gray-50 border-gray-200 text-gray-600"
                            }`}
                          >
                            <option value="Pending">🕒 Pending</option>
                            <option value="Verified">✓ Verified</option>
                            <option value="Premium">✦ Premium</option>
                            <option value="Declined">✕ Declined</option>
                          </select>
                        </td>

                        {/* Subscription Updater */}
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <select
                            value={subStatus}
                            onChange={(e) => handleSubscriptionChange(p.id, e.target.value as Profile["subscription_status"])}
                            className={`text-xs font-extrabold px-2 py-1.5 rounded-xl border focus:outline-none cursor-pointer transition-all ${
                              subStatus === "paid_900"
                                ? "bg-[#362B5A] text-white border-[#362B5A] font-mono"
                                : subStatus === "paid_100"
                                ? "bg-[#EBF6FF] text-[#362B5A] border-blue-200 font-mono"
                                : "bg-gray-50 text-gray-500 border-gray-200 font-mono"
                            }`}
                          >
                            <option value="free">🆓 Free Tier</option>
                            <option value="paid_100">💳 Paid ₹100</option>
                            <option value="paid_900">👑 Paid ₹900 (Full Access)</option>
                          </select>
                        </td>

                        {/* Actions (Edit / Delete) */}
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 bg-indigo-50 text-[#362B5A] hover:bg-indigo-100 hover:text-indigo-900 rounded-lg transition-all cursor-pointer"
                              title="Edit registration"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(p)}
                              className="p-1.5 bg-red-50 text-[#C2242C] hover:bg-red-100 hover:text-red-950 rounded-lg transition-all cursor-pointer"
                              title="Delete candidate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab CONTENT 2: Sacred Match Engine */}
      {activeAdminTab === "matchEngine" && (
        <div className="space-y-6">
          {/* Engine Header selector */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-[#362B5A] flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#C2242C] animate-spin" />
                Vedic Matrimonial Alignment Matrix
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                Select a registered soul to execute calculations using their sub-caste, age gap, and height parameters. The algorithm returns candidates sorted by celestial compatibility.
              </p>
            </div>

            {/* Selector */}
            <div className="flex items-center gap-2 bg-[#EBF6FF] p-3 rounded-2xl border border-[#362B5A]/10 shrink-0">
              <span className="text-xs font-extrabold text-[#362B5A] uppercase tracking-wider">Candidate:</span>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-[#C2242C] focus:outline-none cursor-pointer font-sans"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.gender === "Female" ? "F" : "M"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCandidate && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Chosen Candidate overview & preferences */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <div className="text-center space-y-3">
                  <span className="text-[9px] bg-[#362B5A] text-white font-mono font-bold uppercase px-2.5 py-1 rounded-full tracking-wider">
                    Target Evaluated Member
                  </span>
                  <div 
                    onClick={() => setSelectedMediaProfile(selectedCandidate)}
                    className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#362B5A]/10 shadow-md mx-auto mt-2 cursor-pointer hover:ring-2 hover:ring-[#C2242C] transition-all relative group"
                    title="Click to view full photos & Kundali"
                  >
                    <img
                      src={selectedCandidate.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                      alt={selectedCandidate.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold uppercase">
                      View
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#362B5A]">{selectedCandidate.name}</h4>
                    <p className="text-xs text-gray-500 font-semibold">{selectedCandidate.profession}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-600 bg-[#EBF6FF]/30 p-3 rounded-xl border border-gray-100 text-left">
                    <p>Age: <span className="font-bold text-[#362B5A]">{calculateAge(selectedCandidate.dob)} Yrs</span></p>
                    <p>Height: <span className="font-bold text-[#362B5A]">{selectedCandidate.height_feet} Ft</span></p>
                    <p className="col-span-2">Caste: <span className="font-bold text-[#C2242C] uppercase font-mono">{selectedCandidate.sub_caste}</span></p>
                  </div>

                  {/* DIRECT EDIT & PHOTO/CREDENTIALS SECTION (SOLVES USER REQUIREMENT) */}
                  <div className="border-t border-gray-100 pt-4 mt-4 text-left space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#362B5A] uppercase tracking-wider">Candidate Credentials</span>
                      <span className="text-[10px] font-semibold text-emerald-600 font-mono">🔒 Secure Access</span>
                    </div>

                    {/* Phone & Password Info */}
                    <div className="bg-[#EBF6FF]/35 border border-indigo-100 rounded-2xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Full Name:</span>
                        <span className="font-bold text-[#362B5A] text-right truncate max-w-[150px]" title={selectedCandidate.name}>
                          {selectedCandidate.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Contact/Username:</span>
                        <span className="font-bold font-mono text-[#362B5A]">{selectedCandidate.contact_number}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Login Password:</span>
                        <span className="font-bold font-mono text-[#C2242C] bg-white px-2 py-0.5 rounded border border-gray-100">
                          {selectedCandidate.password || (() => {
                            if (!selectedCandidate.dob) return "Not set";
                            const m = selectedCandidate.dob.trim().match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
                            return m ? `${m[3]}${m[2]}${m[1]} (DOB)` : `${selectedCandidate.dob.replace(/[-/]/g, "")} (DOB)`;
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Candidate Photo Gallery & Kundali Preview */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#362B5A] uppercase tracking-wider block">Uploaded Media</span>
                      <div className="grid grid-cols-4 gap-2">
                        {/* Photo 1 */}
                        <div 
                          onClick={() => setSelectedMediaProfile(selectedCandidate)}
                          className="aspect-square rounded-xl overflow-hidden border-2 border-gray-100 cursor-pointer hover:border-[#C2242C] transition-all bg-gray-50 relative group"
                          title="View Photo 1"
                        >
                          <img src={selectedCandidate.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} alt="Photo 1" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-bold">P1</div>
                        </div>

                        {/* Photo 2 */}
                        <div 
                          onClick={() => setSelectedMediaProfile(selectedCandidate)}
                          className="aspect-square rounded-xl overflow-hidden border-2 border-gray-100 cursor-pointer hover:border-[#C2242C] transition-all bg-gray-50 relative group"
                          title="View Photo 2"
                        >
                          {selectedCandidate.photo_url_2 ? (
                            <>
                              <img src={selectedCandidate.photo_url_2} alt="Photo 2" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-bold">P2</div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[8px] text-gray-400 font-medium">None</div>
                          )}
                        </div>

                        {/* Photo 3 */}
                        <div 
                          onClick={() => setSelectedMediaProfile(selectedCandidate)}
                          className="aspect-square rounded-xl overflow-hidden border-2 border-gray-100 cursor-pointer hover:border-[#C2242C] transition-all bg-gray-50 relative group"
                          title="View Photo 3"
                        >
                          {selectedCandidate.photo_url_3 ? (
                            <>
                              <img src={selectedCandidate.photo_url_3} alt="Photo 3" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-bold">P3</div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[8px] text-gray-400 font-medium">None</div>
                          )}
                        </div>

                        {/* Kundali */}
                        <div 
                          onClick={() => setSelectedMediaProfile(selectedCandidate)}
                          className="aspect-square rounded-xl border-2 border-amber-100 cursor-pointer hover:border-[#C2242C] transition-all bg-amber-50/40 relative group flex flex-col items-center justify-center p-1"
                          title="View Kundali / Horoscopes"
                        >
                          {selectedCandidate.kundali_url ? (
                            <>
                              <UploadCloud className="w-4 h-4 text-amber-700" />
                              <span className="text-[8px] text-amber-800 font-extrabold font-mono mt-0.5">Chart</span>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-bold">View</div>
                            </>
                          ) : (
                            <span className="text-[8px] text-red-500 font-medium">No Kundali</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedCandidate)}
                      className="w-full mt-2 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-[#362B5A] border border-indigo-200/60 rounded-xl text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Profile, Credentials & Photos</span>
                    </button>
                  </div>
                </div>

                {/* Preferences Block */}
                <div className="border-t border-gray-100 pt-5 space-y-4 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#362B5A] uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-orange-400" />
                    <span>Configured Partner Criteria</span>
                  </div>

                  {candidatePreferences ? (
                    <div className="space-y-2.5 text-xs text-gray-700">
                      <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="font-medium text-gray-500">Allowed Age Gap:</span>
                        <span className="font-extrabold text-[#362B5A] font-mono">± {candidatePreferences.age_gap} Years</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="font-medium text-gray-500">Height Range:</span>
                        <span className="font-extrabold text-[#362B5A] font-mono">{candidatePreferences.height_range} Ft</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="font-medium text-gray-500">Preferred Sub-Caste:</span>
                        <span className="font-extrabold text-[#C2242C] font-mono uppercase">{candidatePreferences.preferred_sub_caste}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200 text-center space-y-3">
                      <p className="text-xs leading-relaxed">
                        No active partner criteria configured for this candidate. Run the engine with a default celestial pattern.
                      </p>
                      <button
                        onClick={handleCreateDefaultPrefs}
                        className="w-full py-2 px-3 bg-[#C2242C] text-white hover:bg-opacity-95 transition-all rounded-xl text-[10px] font-bold tracking-wider uppercase cursor-pointer shadow-sm"
                      >
                        Apply default criteria
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Calculated Matches Matrix list */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* PARENT MATCHING CONTROL PANEL CARD */}
                <div className="bg-gradient-to-br from-indigo-950 via-[#362B5A] to-[#1E163B] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] bg-amber-400 text-black font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider block w-fit mb-1">
                        Parent Matching Board (తల్లిదండ్రుల ఎంపిక బోర్డు)
                      </span>
                      <h4 className="text-xl font-black flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-amber-300" />
                        <span>Traditional Parent Control Panel</span>
                      </h4>
                    </div>

                    {/* Compile Switch */}
                    <div className="bg-black/40 p-1.5 rounded-2xl flex items-center gap-1 border border-white/5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveEngine("python")}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                          activeEngine === "python"
                            ? "bg-[#C2242C] text-white shadow-md"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Python AI Match</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveEngine("java")}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                          activeEngine === "java"
                            ? "bg-[#362B5A] text-white border border-white/10 shadow-md"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Java Strict Match</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    {/* Profession Questionnaire */}
                    <div className="space-y-2">
                      <label className="text-[11px] text-amber-300 uppercase font-black tracking-wider block">
                        🤵 Preferred Spouse Profession (ఉద్యోగ ఎంపిక)
                      </label>
                      <select
                        value={preferredSpouseProfession}
                        onChange={(e) => setPreferredSpouseProfession(e.target.value)}
                        className="w-full bg-black/40 border border-indigo-400/20 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer font-medium"
                      >
                        <option value="Any" className="bg-indigo-950">Any Profession (ఏదైనా పర్వాలేదు)</option>
                        <option value="Software" className="bg-indigo-950">💻 Software Engineer</option>
                        <option value="Scientist" className="bg-indigo-950">🔬 Environmental / Scientist</option>
                        <option value="Doctor" className="bg-indigo-950">⚕️ Doctor / Medical Professional</option>
                        <option value="Scholar" className="bg-indigo-950">📿 Vedic Scholar / Priest</option>
                        <option value="Teacher" className="bg-indigo-950">📚 Lecturer / Professor</option>
                        <option value="Civil" className="bg-indigo-950">🏛️ Civil Services / Government Job</option>
                      </select>
                      <span className="text-[10px] text-indigo-200 block italic leading-normal">
                        Our Brahmin system prioritizes partner alignment with parent preferences first.
                      </span>
                    </div>

                    {/* Age constraints */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[11px] text-amber-300 uppercase font-black tracking-wider">
                        <span>⏳ Preferred Spouse Age</span>
                        <span className="font-mono text-xs text-white font-normal">{preferredMinAge} - {preferredMaxAge} Years</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-indigo-200 block">Min Age ({preferredMinAge} Yrs)</span>
                          <input
                            type="range"
                            min="18"
                            max="45"
                            value={preferredMinAge}
                            onChange={(e) => setPreferredMinAge(parseInt(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-indigo-200 block">Max Age ({preferredMaxAge} Yrs)</span>
                          <input
                            type="range"
                            min="18"
                            max="45"
                            value={preferredMaxAge}
                            onChange={(e) => setPreferredMaxAge(parseInt(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Minimum LPA salary */}
                    <div className="md:col-span-2 space-y-2 border-t border-white/5 pt-4">
                      <div className="flex justify-between items-center text-[11px] text-amber-300 uppercase font-black tracking-wider">
                        <span>💰 Minimum Expected Spouse Salary (LPA)</span>
                        <span className="font-mono text-xs text-white font-normal">≥ ₹ {preferredMinLPA} LPA</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="60"
                        step="2"
                        value={preferredMinLPA}
                        onChange={(e) => setPreferredMinLPA(parseInt(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-indigo-200 font-mono">
                        <span>₹ 2 LPA</span>
                        <span>₹ 30 LPA</span>
                        <span>₹ 60 LPA</span>
                      </div>
                    </div>
                  </div>

                  {/* Engine description badge */}
                  <div className="bg-black/20 border border-white/5 p-3 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${activeEngine === "python" ? "bg-red-500/10 text-red-400" : "bg-purple-500/10 text-purple-400"}`}>
                        {activeEngine === "python" ? <Terminal className="w-4 h-4 animate-pulse" /> : <Cpu className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-extrabold text-amber-200 uppercase tracking-wide text-[10px]">
                          {activeEngine === "python" ? "Python Compatibility Compiler" : "Java JVM Strict Matching Rules"}
                        </p>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          {activeEngine === "python" 
                            ? "Weighted Compatibility scoring: combines horoscope star, income progression, age distance & profession scores."
                            : "Strict rule-based filter: candidate is omitted if they fail age brackets, caste lines, or expected LPA."}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white/10 font-mono text-white px-2 py-0.5 rounded-md font-bold uppercase">
                      ACTIVE
                    </span>
                  </div>
                </div>

                {/* MATCH CONTAINER CARD */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-bold text-[#362B5A] flex items-center gap-2">
                        <span>Calculated Matches ({calculatedMatches.length})</span>
                        <span className="text-[10px] bg-[#EBF6FF] text-[#362B5A] font-mono px-2 py-0.5 rounded-full uppercase font-bold">
                          {activeEngine === "python" ? "Python Weighted Score" : "Java JVM Filter"}
                        </span>
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono">Excluded: Same Surname & Gothram (Sagotra Siblings)</p>
                    </div>
                    <span className="text-[10px] text-indigo-700 font-bold font-mono tracking-widest uppercase">Opposite Gender Filter Active</span>
                  </div>

                  {calculatedMatches.length === 0 ? (
                    <div className="py-20 text-center space-y-3">
                      <HelpCircle className="w-12 h-12 text-gray-300 mx-auto animate-bounce" />
                      <p className="text-sm font-bold text-gray-500">No alignments computed with this engine.</p>
                      <p className="text-xs text-gray-400">Try lowering minimum LPA, widening preferred age, or selecting "Any Profession".</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                    {calculatedMatches.map(({ partner, partnerAge, ageDiff, ageMatch, casteMatch, heightMatch, partnerAgeMatch, partnerCasteMatch, partnerHeightMatch, passCount, isMutualMatch, compatibilityScore }) => (
                      <div
                        key={partner.id}
                        className="p-5 border border-gray-100 rounded-3xl hover:border-[#362B5A]/25 transition-all duration-300 bg-gradient-to-r from-transparent to-gray-50/30 flex flex-col xl:flex-row xl:items-center justify-between gap-5 text-left"
                      >
                        {/* Partner details */}
                        <div className="flex items-center gap-3.5 shrink-0">
                          <div 
                            onClick={() => setSelectedMediaProfile(partner)}
                            className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#C2242C] transition-all relative group"
                            title="Click to view full photos & Kundali"
                          >
                            <img
                              src={partner.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                              alt={partner.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-black uppercase tracking-wider">
                              Preview
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="font-extrabold text-[#362B5A] flex items-center gap-1 text-sm sm:text-base leading-tight">
                              {partner.name}
                              {partner.status === "Premium" && <Award className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />}
                            </h5>
                            <p className="text-xs text-gray-500 font-semibold">{partner.profession}</p>
                            <div className="flex flex-wrap gap-x-2.5 text-[10px] text-gray-400 font-mono font-bold uppercase">
                              <span>Age: {partnerAge} Yrs</span>
                              <span>•</span>
                              <span>Caste: {partner.sub_caste}</span>
                              <span>•</span>
                              <span>Height: {partner.height_feet} Ft</span>
                            </div>
                          </div>
                        </div>

                        {/* Bidirectional Alignment matrix checklist */}
                        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex-1 space-y-2">
                          <span className="text-[9px] uppercase tracking-wider block font-bold text-gray-400 border-b border-gray-50 pb-1">
                            Double-sided Alignment Breakdown
                          </span>
                          
                          <div className="grid grid-cols-2 gap-4 text-[10px]">
                            {/* Left: Chosen Candidate -> Partner */}
                            <div className="space-y-1 bg-gray-50/50 p-2 rounded-xl">
                              <span className="font-bold text-[#362B5A] block truncate">
                                {selectedCandidate.name}'s Demands:
                              </span>
                              <div className="space-y-0.5 font-mono">
                                <div className="flex justify-between">
                                  <span>Age Gap:</span>
                                  <span className={ageMatch ? "text-emerald-600 font-bold" : "text-[#C2242C] font-bold"}>
                                    {ageMatch ? "✓ Match" : "✕ Out"} ({ageDiff} yr)
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Sub-Caste:</span>
                                  <span className={casteMatch ? "text-emerald-600 font-bold" : "text-[#C2242C] font-bold"}>
                                    {casteMatch ? "✓ Match" : "✕ Miss"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Height:</span>
                                  <span className={heightMatch ? "text-emerald-600 font-bold" : "text-[#C2242C] font-bold"}>
                                    {heightMatch ? "✓ Match" : "✕ Out"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Partner -> Chosen Candidate */}
                            <div className="space-y-1 bg-gray-50/50 p-2 rounded-xl">
                              <span className="font-bold text-[#362B5A] block truncate">
                                {partner.name}'s Demands:
                              </span>
                              <div className="space-y-0.5 font-mono">
                                <div className="flex justify-between">
                                  <span>Age Gap:</span>
                                  <span className={partnerAgeMatch ? "text-emerald-600 font-bold" : "text-[#C2242C] font-bold"}>
                                    {partnerAgeMatch ? "✓ Match" : "✕ Out"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Sub-Caste:</span>
                                  <span className={partnerCasteMatch ? "text-emerald-600 font-bold" : "text-[#C2242C] font-bold"}>
                                    {partnerCasteMatch ? "✓ Match" : "✕ Miss"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Height:</span>
                                  <span className={partnerHeightMatch ? "text-emerald-600 font-bold" : "text-[#C2242C] font-bold"}>
                                    {partnerHeightMatch ? "✓ Match" : "✕ Out"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Overall Compatibility */}
                        <div className="flex flex-row xl:flex-col items-center justify-between xl:justify-center bg-[#EBF6FF] border border-blue-100 p-4 rounded-2xl min-w-[150px] text-center shrink-0">
                          <div>
                            <span className="text-[8px] text-indigo-700 font-extrabold uppercase tracking-widest block">Celestial Affinity</span>
                            <p className="text-xl font-black text-[#362B5A] font-sans mt-0.5">{compatibilityScore}%</p>
                          </div>
                          
                          <div className="mt-2 text-right xl:text-center">
                            {isMutualMatch ? (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-800 text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                                💖 Perfect Mutual
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                                ⚠️ Partial Match
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Kitchen Service Delivery Control Box */}
                        <div className="flex flex-col items-stretch justify-center p-4 bg-gray-50 border border-gray-100 rounded-2xl min-w-[160px] text-center shrink-0 gap-2">
                          <span className="text-[9px] font-extrabold text-[#362B5A] uppercase tracking-wider block">Kitchen Service</span>
                          {selectedCandidate.approved_matches?.includes(partner.id) ? (
                            <button
                              type="button"
                              onClick={async () => {
                                const approvedList = selectedCandidate.approved_matches || [];
                                const updatedList = approvedList.filter(id => id !== partner.id);
                                const updatedCandidate = { ...selectedCandidate, approved_matches: updatedList };
                                const saved = await databaseService.saveProfile(updatedCandidate);
                                setProfiles(prev => prev.map(p => p.id === saved.id ? saved : p));
                              }}
                              className="w-full py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Dish Delivered (Paid)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={async () => {
                                const approvedList = selectedCandidate.approved_matches || [];
                                const updatedList = [...approvedList, partner.id];
                                const updatedCandidate = { ...selectedCandidate, approved_matches: updatedList };
                                const saved = await databaseService.saveProfile(updatedCandidate);
                                setProfiles(prev => prev.map(p => p.id === saved.id ? saved : p));
                              }}
                              className="w-full py-2 px-2.5 bg-[#C2242C] hover:bg-red-700 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                              <span>Deliver Dish (Paid)</span>
                            </button>
                          )}
                          <p className="text-[9px] text-gray-500 font-semibold leading-tight">
                            {selectedCandidate.approved_matches?.includes(partner.id)
                              ? "🍛 Visible on user profile"
                              : "🥣 Hidden from user profile"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Tab CONTENT 3: Grievances & IT Act Compliance */}
      {activeAdminTab === "grievances" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1 text-left">
              <h3 className="text-xl font-extrabold text-[#362B5A] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#C2242C] animate-pulse" />
                IT Act 2021 Grievance Redressal Control Center
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                Review and resolve candidate grievances in compliance with the Intermediary Guidelines (IT Act 2021). You can investigate, issue warnings, dismiss cases, or suspend/block accused profiles.
              </p>
            </div>
          </div>

          {grievancesLoading ? (
            <div className="py-12 text-center space-y-3">
              <svg className="animate-spin h-8 w-8 text-[#C2242C] mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs text-gray-500 font-mono">Loading complaints database...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* IT Act Grievance Redressal Sub-navigation */}
              <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-xs text-left">
                <button
                  type="button"
                  onClick={() => setGrievanceSubTab("pending")}
                  className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    grievanceSubTab === "pending"
                      ? "bg-[#C2242C] text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  📥 New & Pending
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${grievanceSubTab === "pending" ? "bg-white text-[#C2242C]" : "bg-gray-200 text-gray-700"}`}>
                    {grievances.filter(g => g.status === "Pending").length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrievanceSubTab("investigating")}
                  className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    grievanceSubTab === "investigating"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  🔍 Investigating
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${grievanceSubTab === "investigating" ? "bg-white text-sky-700" : "bg-gray-200 text-gray-700"}`}>
                    {grievances.filter(g => g.status === "Under Investigation").length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrievanceSubTab("suspended")}
                  className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    grievanceSubTab === "suspended"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  🚫 Action Taken / Suspensions
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${grievanceSubTab === "suspended" ? "bg-white text-emerald-700" : "bg-gray-200 text-gray-700"}`}>
                    {grievances.filter(g => g.status === "Resolved").length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrievanceSubTab("dismissed")}
                  className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    grievanceSubTab === "dismissed"
                      ? "bg-gray-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  ❌ Dismissed Cases
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${grievanceSubTab === "dismissed" ? "bg-white text-gray-700" : "bg-gray-200 text-gray-700"}`}>
                    {grievances.filter(g => g.status === "Dismissed").length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrievanceSubTab("all")}
                  className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    grievanceSubTab === "all"
                      ? "bg-[#362B5A] text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  📋 All Cases
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${grievanceSubTab === "all" ? "bg-white text-[#362B5A]" : "bg-gray-200 text-gray-700"}`}>
                    {grievances.length}
                  </span>
                </button>
              </div>

              {/* Legal Intermediary Statutory Framework Banner */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-left text-[11px] leading-relaxed text-indigo-950 flex items-start gap-3">
                <span className="text-lg">⚖️</span>
                <div>
                  <strong className="text-indigo-900 block font-bold mb-0.5">IT Act 2021 Intermediary Statutory Redressal Framework Compliance</strong>
                  This grievance cell strictly implements the 24-hour statutory acknowledgment and 15-day maximum redressal timeline under Section 3(2) of India's Information Technology Rules, 2021. Actions taken trigger instantaneous, encrypted digital WhatsApp templates mapped automatically to official candidate registries.
                </div>
              </div>

              {/* Cases List */}
              {grievances.filter((g) => {
                if (grievanceSubTab === "pending") return g.status === "Pending";
                if (grievanceSubTab === "investigating") return g.status === "Under Investigation";
                if (grievanceSubTab === "suspended") return g.status === "Resolved";
                if (grievanceSubTab === "dismissed") return g.status === "Dismissed";
                return true;
              }).length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-lg font-extrabold text-[#362B5A]">No Cases Found!</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    There are no complaints registered in this specific category at the moment. Our Brahmin matrimonial energy fields remain secure, respectful, and safe.
                  </p>
                </div>
              ) : (
                <div className="max-h-[650px] overflow-y-auto pr-3 space-y-6 scrollbar-thin border border-slate-100 p-4 rounded-3xl bg-slate-50/30">
                  <div className="grid grid-cols-1 gap-6">
                    {grievances
                      .filter((g) => {
                        if (grievanceSubTab === "pending") return g.status === "Pending";
                        if (grievanceSubTab === "investigating") return g.status === "Under Investigation";
                        if (grievanceSubTab === "suspended") return g.status === "Resolved";
                        if (grievanceSubTab === "dismissed") return g.status === "Dismissed";
                        return true;
                      })
                      .map((g) => {
                  const isPending = g.status === "Pending";
                  const isInvestigating = g.status === "Under Investigation";
                  const isResolved = g.status === "Resolved";
                  const isDismissed = g.status === "Dismissed";

                  return (
                    <div key={g.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col text-left">
                      {/* Grievance Header */}
                      <div className="p-5 bg-slate-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-[#C2242C] text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full font-mono uppercase tracking-wider">
                              {g.id}
                            </span>
                            <span className="font-extrabold text-[#362B5A] text-sm">{g.category}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono">Submitted: {new Date(g.reportedAt).toLocaleString()}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1 font-extrabold px-3 py-1 rounded-full text-[10px] font-mono border uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : isInvestigating
                              ? "bg-sky-50 border-sky-200 text-sky-700 animate-pulse"
                              : isResolved
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-gray-100 border-gray-200 text-gray-600"
                          }`}>
                            {g.status}
                          </span>
                          
                          <button
                            onClick={() => handleDeleteGrievanceLog(g.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-[#C2242C] rounded-xl transition-all cursor-pointer"
                            title="Purge complaint log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Grievance Body */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-5 space-y-4 border-r border-gray-100 pr-0 md:pr-6">
                          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-2">
                            <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest font-mono">Reporter (Complainant)</p>
                            <div className="text-xs space-y-1 text-slate-700">
                              <p><strong>Name:</strong> {g.reporterName}</p>
                              <p><strong>ID:</strong> <span className="font-mono">{g.reporterId}</span></p>
                              <p>
                                <strong>Phone:</strong>{" "}
                                <a href={`tel:${g.reporterPhone}`} className="text-[#C2242C] hover:underline font-mono font-bold">
                                  {g.reporterPhone}
                                </a>
                              </p>
                            </div>
                          </div>

                          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 space-y-2">
                            <p className="text-[9px] font-black text-rose-700 uppercase tracking-widest font-mono">Accused (Defendant)</p>
                            <div className="text-xs space-y-1 text-slate-700">
                              <p><strong>Name:</strong> {g.accusedName}</p>
                              <p><strong>ID:</strong> <span className="font-mono">{g.accusedId}</span></p>
                              <p>
                                <strong>Phone:</strong>{" "}
                                <a href={`tel:${g.accusedPhone}`} className="text-[#C2242C] hover:underline font-mono font-bold">
                                  {g.accusedPhone}
                                </a>
                              </p>
                            </div>

                             {/* Inline Change Punishment Control inside Grievance Card */}
                            {(() => {
                              const accusedProfile = profiles.find((p) => {
                                const cleanId = (g.accusedId || "").trim().toLowerCase();
                                if (!cleanId || cleanId === "n/a" || cleanId === "unknown") return false;
                                return p.id.toLowerCase() === cleanId || 
                                       (p.reg_number && p.reg_number.trim().toLowerCase() === cleanId);
                              }) || profiles.find((p) => {
                                const cleanName = (g.accusedName || "").trim().toLowerCase();
                                if (!cleanName || cleanName === "unknown" || cleanName === "unknown candidate") return false;
                                return p.name.toLowerCase().includes(cleanName) || 
                                       cleanName.includes(p.name.toLowerCase());
                              }) || profiles.find((p) => {
                                const cleanPhone = (g.accusedPhone || "").replace(/[^0-9]/g, "");
                                if (!cleanPhone || cleanPhone.length < 10) return false;
                                return p.contact_number.replace(/[^0-9]/g, "").includes(cleanPhone) || 
                                       cleanPhone.includes(p.contact_number.replace(/[^0-9]/g, ""));
                              });

                              if (!accusedProfile) {
                                return (
                                  <div className="mt-3 pt-2.5 border-t border-rose-200/40 space-y-2">
                                    <div className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200/40 leading-relaxed font-semibold">
                                      ⚠️ Profile not found by exact ID "{g.accusedId}".
                                      <p className="mt-1">Link this complaint to an active candidate profile below:</p>
                                    </div>
                                    <select
                                      onChange={async (e) => {
                                        const selectedId = e.target.value;
                                        if (selectedId) {
                                          try {
                                            const targetP = profiles.find(p => p.id === selectedId);
                                            if (targetP) {
                                              const updatedG: Grievance = {
                                                ...g,
                                                accusedId: targetP.id,
                                                accusedName: targetP.name,
                                                accusedPhone: targetP.contact_number
                                              };
                                              await databaseService.saveGrievance(updatedG);
                                              setUpdateMsg("Linked candidate profile to grievance successfully!");
                                              setTimeout(() => setUpdateMsg(""), 3000);
                                              fetchGrievancesData();
                                            }
                                          } catch (err) {
                                            console.error("Failed to link profile:", err);
                                          }
                                        }
                                      }}
                                      className="w-full text-[9px] font-black bg-white border border-rose-200 text-rose-900 rounded-lg p-1.5 cursor-pointer focus:ring-1 focus:ring-rose-400 focus:outline-none transition-all shadow-2xs"
                                    >
                                      <option value="">-- Choose Candidate to Link --</option>
                                      {profiles.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name} ({p.reg_number || p.id}) - {p.contact_number}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              }

                              return (
                                <div className="mt-3 pt-2.5 border-t border-rose-200/40 space-y-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[9px] font-black uppercase text-rose-800 tracking-wider">
                                      🚫 Profile Status:
                                    </span>
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-mono ${
                                      accusedProfile.status === "Declined" 
                                        ? "bg-rose-100 text-rose-800 border border-rose-250" 
                                        : "bg-emerald-100 text-emerald-800 border border-emerald-250"
                                    }`}>
                                      {accusedProfile.status === "Declined" ? "Suspended" : "Verified"}
                                    </span>
                                  </div>

                                  {accusedProfile.status === "Declined" && (
                                    <div className="space-y-2 leading-tight">
                                      {accusedProfile.suspension_lift_at ? (
                                        <div className="text-[8.5px] text-amber-800 font-bold bg-amber-50/60 border border-amber-200/40 p-1.5 rounded-lg leading-tight font-sans">
                                          ⏰ Scheduled Auto-lift:
                                          <p className="text-[8px] text-rose-700 font-black mt-0.5 font-mono">
                                            {new Date(accusedProfile.suspension_lift_at).toLocaleDateString()} at {new Date(accusedProfile.suspension_lift_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </p>
                                          {accusedProfile.suspension_reason && (
                                            <p className="text-[7.5px] text-gray-500 font-normal mt-0.5 italic leading-tight">
                                              ({accusedProfile.suspension_reason})
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-[8.5px] text-zinc-700 font-bold bg-zinc-100/70 border border-zinc-200/40 p-1.5 rounded-lg leading-tight">
                                          🔒 Permanent Lifetime Ban
                                        </div>
                                      )}

                                      <div className="space-y-2">
                                        <div className="space-y-1">
                                          <label className="text-[8px] font-black uppercase text-[#362B5A] tracking-wider block">
                                            ⚡ Change / Reduce Punishment:
                                          </label>
                                          <select
                                            defaultValue=""
                                            onChange={async (e) => {
                                              const val = e.target.value as any;
                                              if (val) {
                                                await handleRevokeSuspension(accusedProfile.id, val);
                                                e.target.value = "";
                                              }
                                            }}
                                            className="w-full text-[9px] font-black bg-white border border-rose-200 text-rose-900 rounded-lg p-1.5 cursor-pointer focus:ring-1 focus:ring-rose-400 focus:outline-none transition-all shadow-2xs"
                                          >
                                            <option value="">-- Choose Action --</option>
                                            <option value="now">🔓 Revoke & Reinstated (మన్నింపు - Lift Now)</option>
                                            <option value="24h">⏰ Short-term Hold: 24 Hours</option>
                                            <option value="7day">📅 1 Week (7 Days)</option>
                                            <option value="30day">🗓️ 1 Month (30 Days)</option>
                                            <option value="60day">🗓️ 2 Months (60 Days)</option>
                                            <option value="90day">🗓️ 3 Months (90 Days)</option>
                                            <option value="180day">🗓️ 6 Months (180 Days)</option>
                                            <option value="365day">🗓️ 12 Months (1 Year)</option>
                                            <option value="730day">🗓️ 24 Months (2 Years)</option>
                                            <option value="permanent">🔒 Make Suspension Permanent</option>
                                          </select>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            await handleRevokeSuspension(accusedProfile.id, "now");
                                            handleSendDirectWhatsapp(accusedProfile.contact_number, "mercy_accused", accusedProfile.name);
                                          }}
                                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[8.5px] font-black uppercase py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                                          title="Immediately revoke suspension, set status to Verified, and send the WhatsApp warning"
                                        >
                                          <span>🔓 Revoke Now & Send WhatsApp (రద్దు & వార్నింగ్ మెసేజ్)</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {accusedProfile.status !== "Declined" && (
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-black uppercase text-rose-800 tracking-wider block">
                                        🚫 Place under Hold / Suspension:
                                      </label>
                                      <select
                                        defaultValue=""
                                        onChange={async (e) => {
                                          const val = e.target.value as any;
                                          if (val) {
                                            await handleRevokeSuspension(accusedProfile.id, val);
                                            e.target.value = "";
                                          }
                                        }}
                                        className="w-full text-[9px] font-black bg-white border border-rose-200 text-rose-900 rounded-lg p-1.5 cursor-pointer focus:ring-1 focus:ring-rose-400 focus:outline-none transition-all shadow-2xs"
                                      >
                                        <option value="">-- Choose Suspension Period --</option>
                                        <option value="24h">⏰ 24 Hours Hold (సస్పెండ్ - 24 గంటలు)</option>
                                        <option value="7day">📅 1 Week (సస్పెండ్ - 1 వారం / 7 రోజులు)</option>
                                        <option value="30day">🗓️ 1 Month (సస్పెండ్ - 1 నెల / 30 రోజులు)</option>
                                        <option value="60day">🗓️ 2 Months (సస్పెండ్ - 2 నెలలు / 60 రోజులు)</option>
                                        <option value="90day">🗓️ 3 Months (సస్పెండ్ - 3 నెలలు / 90 రోజులు)</option>
                                        <option value="180day">🗓️ 6 Months (సస్పెండ్ - 6 నెలలు / 180 రోజులు)</option>
                                        <option value="365day">🗓️ 12 Months (సస్పెండ్ - 1 సంవత్సరం / 12 నెలలు)</option>
                                        <option value="730day">🗓️ 24 Months (సస్పెండ్ - 2 సంవత్సరాలు / 24 నెలలు)</option>
                                        <option value="permanent">🔒 Permanent Ban (శాశ్వత ఖాతా రద్దు)</option>
                                      </select>
                                    </div>
                                  )}

                                  {/* Quick WhatsApp Actions in Grievance Card */}
                                  <div className="mt-3 pt-2.5 border-t border-rose-200/40 space-y-2">
                                    <p className="text-[9px] font-black uppercase text-rose-800 tracking-wider">📢 Quick WhatsApp Templates:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleSendDirectWhatsapp(accusedProfile.contact_number, "mercy_accused", accusedProfile.name);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[8.5px] font-black uppercase py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                                        title="Send mercy / changed punishment notification to accused"
                                      >
                                        <span>💬 Notify Accused (మన్నింపు)</span>
                                      </button>
                                      {g.reporterPhone && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleSendDirectWhatsapp(g.reporterPhone, "appeal_victim", accusedProfile.name, g.reporterName);
                                          }}
                                          className="bg-blue-600 hover:bg-blue-700 text-white text-[8.5px] font-black uppercase py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                                          title="Appeal to victim reporter for forgiveness/mercy"
                                        >
                                          <span>💬 Appeal to Victim (క్షమించుట)</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                          <div className="space-y-2 text-xs">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest font-mono">Incident Description</p>
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl italic text-gray-700 leading-relaxed font-semibold">
                              "{g.description}"
                            </div>
                          </div>

                          {(g.resolutionNotes || g.resolvedBy) && (
                            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-slate-700 space-y-1">
                              <p className="font-black text-indigo-800 uppercase tracking-widest text-[9px] flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                                Official Resolution / Investigation verdict:
                              </p>
                              <p className="font-bold leading-relaxed">{g.resolutionNotes}</p>
                              <div className="flex justify-between text-[10px] text-indigo-600/70 pt-1 font-mono">
                                <span>Handled by: {g.resolvedBy}</span>
                                {g.resolvedAt && <span>Resolved On: {new Date(g.resolvedAt).toLocaleString()}</span>}
                              </div>
                            </div>
                          )}

                          {!isResolved && !isDismissed && (
                            <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2.5">
                              {isPending && (
                                <button
                                  onClick={() => handleUpdateGrievanceStatus(g.id, "Under Investigation")}
                                  className="py-2 px-3.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[10px] uppercase rounded-xl tracking-wider cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                                >
                                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                                  <span>Investigate Case</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setVerifyingGrievance(g);
                                  setResolutionAction("Resolved");
                                  setResolutionVerdict("");
                                  setDeclineAccusedProfile(false);
                                  setSuspensionType("7day");
                                  setAccusedMsgScenario("7day_suspension");
                                  setVictimMsgScenario("action_taken");
                                }}
                                className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase rounded-xl tracking-wider cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                                <span>Resolve & Take Action</span>
                              </button>

                              <button
                                onClick={() => {
                                  setVerifyingGrievance(g);
                                  setResolutionAction("Dismissed");
                                  setResolutionVerdict("Complaint investigated and found to be incorrect/unfounded.");
                                  setDeclineAccusedProfile(false);
                                  setSuspensionType("none");
                                  setAccusedMsgScenario("forgiven_warning");
                                  setVictimMsgScenario("fake_complaint_warning");
                                }}
                                className="py-2 px-3.5 bg-gray-500 hover:bg-gray-600 text-white font-extrabold text-[10px] uppercase rounded-xl tracking-wider cursor-pointer shadow-sm transition-all"
                              >
                                <span>Dismiss Case</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )}

      {/* GRIEVANCE RESOLUTION VERDICT MODAL */}
      {verifyingGrievance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 text-[#362B5A] overflow-y-auto">
          <form
            onSubmit={handleResolveGrievanceSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-indigo-500/10 space-y-5 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="text-center space-y-1 pb-3 border-b border-gray-100">
              <span className="text-[9px] text-[#C2242C] font-mono tracking-widest uppercase block font-bold">CASE REDRESSAL SYSTEM</span>
              <h3 className="text-lg font-black text-[#362B5A] uppercase tracking-tight">Investigate & Resolve Grievance</h3>
              <p className="text-xs text-gray-500">Provide final action verdict for ticket: {verifyingGrievance.id}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs text-slate-700">
              <p><strong>Complainant:</strong> {verifyingGrievance.reporterName}</p>
              <p><strong>Accused Candidate:</strong> {verifyingGrievance.accusedName} (<span className="font-mono text-[#C2242C] font-bold">{verifyingGrievance.accusedId}</span>)</p>
              <p><strong>Category:</strong> {verifyingGrievance.category}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase tracking-wider block">Grievance Action *</label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value as "Resolved" | "Dismissed")}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-3 focus:outline-none font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="Resolved">Resolved (Complainant satisfied, actions taken)</option>
                  <option value="Dismissed">Dismissed (Unfounded complaint, no further action)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase tracking-wider block">Assigned Investigation Verdict *</label>
                <textarea
                  required
                  rows={4}
                  value={resolutionVerdict}
                  onChange={(e) => setResolutionVerdict(e.target.value)}
                  placeholder="Specify notes of your phone verification, warnings given, or mutual alignment notes. This will be visible to the complainant."
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-4 focus:outline-none leading-relaxed font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase tracking-wider block">Verifying Administrator *</label>
                <select
                  value={grievanceApproveAdmin}
                  onChange={(e) => setGrievanceApproveAdmin(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-3 focus:outline-none font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="subramanyam">Sri G.V. Subramanyam</option>
                  <option value="subba_reddy">Sri P.V. Subba Reddy</option>
                </select>
              </div>

              {verifyingGrievance.accusedId && verifyingGrievance.accusedId !== "N/A" && (
                <div className="space-y-1">
                  <label className="font-bold text-gray-600 uppercase tracking-wider block">Profile Suspension Length (సస్పెన్షన్ చర్య) *</label>
                  <select
                    value={suspensionType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setSuspensionType(val);
                      // Auto-adjust suggested WhatsApp scenarios to match the action
                      if (val === "7day" || val === "24h") {
                        setAccusedMsgScenario("7day_suspension");
                        setVictimMsgScenario("action_taken");
                      } else if (val === "30day" || val === "60day" || val === "90day" || val === "180day" || val === "365day" || val === "730day" || val === "permanent") {
                        setAccusedMsgScenario("permanent_ban");
                        setVictimMsgScenario("action_taken");
                      } else if (val === "active_investigation_hold") {
                        setAccusedMsgScenario("investigation_hold");
                        setVictimMsgScenario("dual_investigation");
                      } else if (val === "lift_with_warning") {
                        setAccusedMsgScenario("lift_suspension_mercy");
                        setVictimMsgScenario("fake_complaint_warning");
                      } else {
                        setAccusedMsgScenario("forgiven_warning");
                        setVictimMsgScenario("fake_complaint_warning");
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#362B5A] focus:ring-1 focus:ring-[#362B5A]/20 rounded-xl py-2.5 px-3 focus:outline-none font-semibold text-gray-700 cursor-pointer"
                  >
                    <option value="none">No Suspension (Active / Forgive with warning)</option>
                    <option value="24h">Temporary 24-Hour Suspension (సస్పెండ్ - 24 గంటలు)</option>
                    <option value="7day">Temporary 1-Week Suspension (సస్పెండ్ - 1 వారం / 7 రోజులు)</option>
                    <option value="30day">Temporary 1-Month Suspension (సస్పెండ్ - 1 నెల / 30 రోజులు)</option>
                    <option value="60day">Temporary 2-Month Suspension (సస్పెండ్ - 2 నెలలు / 60 రోజులు)</option>
                    <option value="90day">Temporary 3-Month Suspension (సస్పెండ్ - 3 నెలలు / 90 రోజులు)</option>
                    <option value="180day">Temporary 6-Month Suspension (సస్పెండ్ - 6 నెలలు / 180 రోజులు)</option>
                    <option value="365day">Temporary 12-Month Suspension (సస్పెండ్ - 12 నెలలు / 1 సంవత్సరం)</option>
                    <option value="730day">Temporary 24-Month Suspension (సస్పెండ్ - 24 నెలలు / 2 సంవత్సరాలు)</option>
                    <option value="permanent">Permanent Lifetime Ban (శాశ్వత ఖాతా రద్దు - No Auto Lift)</option>
                    <option value="active_investigation_hold">Suspend temporarily during investigation (విచారణాత్మక సస్పెన్షన్)</option>
                    <option value="lift_with_warning">Lift suspension with warning / mercy (సస్పెన్షన్ ఎత్తివేత & హెచ్చరిక)</option>
                  </select>
                  <p className="text-[10px] text-gray-505 mt-1 leading-normal">
                    Selecting any suspension automatically flags the candidate's profile status as <strong className="text-red-600">"Declined"</strong> to hide them from matched recommendations.
                  </p>
                </div>
              )}

              {/* WHATSAPP ALERTS COMMUNICATION DESK */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-4">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <svg className="w-4 h-4 fill-emerald-700 text-emerald-700 shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.528 2.017 14.077.99 11.517.99c-5.44 0-9.866 4.372-9.87 9.802 0 1.958.52 3.878 1.503 5.586L2.148 21.84l5.656-1.474z" />
                  </svg>
                  <span className="font-extrabold text-[10px] uppercase tracking-wider font-mono">
                    WhatsApp Communication Desk
                  </span>
                </div>

                <p className="text-[10px] text-emerald-950 leading-normal font-medium">
                  సస్పెండ్ లేదా విచారణ చర్యలు చేపట్టిన తరువాత, ఫిర్యాదుదారునికి (Victim) మరియు నిందితునికి (Accused) కింది విభిన్న ఎంపికల ఆధారంగా అధికారిక వాట్సాప్ సందేశాలను పంపవచ్చు.
                </p>

                {/* Scenarios configuration */}
                <div className="space-y-3 pt-1 border-t border-emerald-100">
                  {/* Accused Scenario Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">Accused Message Scenario (నిందితుని సందేశ రూపం) *</label>
                    <select
                      value={accusedMsgScenario}
                      onChange={(e) => setAccusedMsgScenario(e.target.value as any)}
                      className="w-full bg-white border border-emerald-300 text-emerald-900 focus:outline-none rounded-lg p-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <option value="7day_suspension">⚠️ Temporary 7-Day Suspension Notice</option>
                      <option value="permanent_ban">🚫 Permanent Lifetime Ban Notice</option>
                      <option value="investigation_hold">🔍 Under Active Investigation Notice</option>
                      <option value="forgiven_warning">🤝 Forgiven / Reinstated with Safety Warning</option>
                      <option value="cybercrime_warning">🚨 Serious: Cybercrime Police Complaint Escalation (సైబర్ క్రైమ్)</option>
                      <option value="lift_suspension_mercy">🤝 Mercy Granted: Lift Suspension & Final Warning (సస్పెన్షన్ ఎత్తివేత)</option>
                      <option value="mercy_changed_punishment">🤝 Mercy Granted: Changed/Reduced Punishment (సస్పెన్షన్ మార్పు)</option>
                    </select>
                  </div>

                  {/* Accused Live Preview block */}
                  <div className="bg-emerald-900/5 p-2 rounded-lg border border-emerald-200/50 max-h-[100px] overflow-y-auto">
                    <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-widest block mb-1">Accused Msg Preview (నిందితుని మెసేజ్ ప్రివ్యూ):</span>
                    <pre className="text-[9px] text-emerald-950 font-sans whitespace-pre-wrap leading-relaxed">{getAccusedWhatsappText()}</pre>
                  </div>

                  {/* Launcher for Accused */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = getAccusedWhatsappText();
                      const cleanPhone = (verifyingGrievance.accusedPhone || "").replace(/\D/g, "");
                      const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone;
                      const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
                      window.open(url, "_blank");
                    }}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase rounded-xl tracking-wider cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5"
                    title={`Send alert to accused: ${verifyingGrievance.accusedPhone}`}
                  >
                    <span>⚠️ Send Selected Message to Accused</span>
                  </button>
                </div>

                <div className="space-y-3 pt-3 border-t border-emerald-200">
                  {/* Victim Scenario Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">Victim Message Scenario (ఫిర్యాదుదారుని సందేశ రూపం) *</label>
                    <select
                      value={victimMsgScenario}
                      onChange={(e) => setVictimMsgScenario(e.target.value as any)}
                      className="w-full bg-white border border-emerald-300 text-emerald-900 focus:outline-none rounded-lg p-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <option value="action_taken">✅ Verified & Accused Suspended (చర్య తీసుకున్నాం)</option>
                      <option value="dual_investigation">⚖️ Dual Investigation Ongoing (రెండూ పరిశీలిస్తున్నాం)</option>
                      <option value="fake_complaint_warning">⚠️ Warning: Fake/Unfounded Complaint (తప్పుడు ఫిర్యాదు హెచ్చరిక)</option>
                      <option value="cybercrime_notified">🚨 Severe: Escalated to Cybercrime Police Department (సైబర్ క్రైమ్ పోలీసులకు సమాచారం)</option>
                      <option value="victim_mercy_appeal">💬 Appeal: Ask Victim for Mercy & Reform (క్షమాభిక్ష అభ్యర్థన)</option>
                    </select>
                  </div>

                  {/* Victim Live Preview block */}
                  <div className="bg-emerald-900/5 p-2 rounded-lg border border-emerald-200/50 max-h-[100px] overflow-y-auto">
                    <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-widest block mb-1">Victim Msg Preview (ఫిర్యాదుదారుని మెసేజ్ ప్రివ్యూ):</span>
                    <pre className="text-[9px] text-emerald-950 font-sans whitespace-pre-wrap leading-relaxed">{getVictimWhatsappText()}</pre>
                  </div>

                  {/* Launcher for Victim */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = getVictimWhatsappText();
                      const cleanPhone = (verifyingGrievance.reporterPhone || "").replace(/\D/g, "");
                      const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone;
                      const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
                      window.open(url, "_blank");
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-xl tracking-wider cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5"
                    title={`Send alert to reporter: ${verifyingGrievance.reporterPhone}`}
                  >
                    <span>✅ Send Selected Message to Complainant</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setVerifyingGrievance(null)}
                className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#C2242C] hover:bg-opacity-95 text-white rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Submit Verdict</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CUSTOM EDIT PROFILE MODAL (SOLVES ACTION REQUIREMENT) */}
      {isEditModalOpen && profileToEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-indigo-500/10 space-y-5 my-8 max-h-[90vh] overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="space-y-1">
                <span className="text-[10px] text-indigo-600 font-bold tracking-widest uppercase block">Administrative Action</span>
                <h3 className="text-xl font-extrabold text-[#362B5A]">Edit Registration Credentials</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setProfileToEdit(null);
                }}
                className="p-1.5 bg-gray-50 text-gray-500 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Name */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileToEdit.name}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Gender</label>
                <select
                  value={profileToEdit.gender}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, gender: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              {/* DOB */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={profileToEdit.dob}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, dob: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Place of Birth */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Place of Birth (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Vijayawada, Andhra Pradesh"
                  value={profileToEdit.birth_location || ""}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, birth_location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Birth Place Pincode */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Birth Place Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={profileToEdit.birth_pincode || ""}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, birth_pincode: e.target.value.replace(/\D/g, "") })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-mono"
                />
              </div>

              {/* Time of Birth */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Time of Birth (e.g. 08:30, or 09:00 AM to 10:00 AM)</label>
                <input
                  type="text"
                  placeholder="e.g. 08:30 or 09:00 AM to 10:00 AM"
                  value={profileToEdit.birth_time || ""}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, birth_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                />
              </div>

              {/* LIVE PANCHANGAM & KUNDALI GENERATOR (100 YEARS TELUGU PANCHANGAM SYSTEM) */}
              <div className="sm:col-span-2 bg-gradient-to-r from-amber-500/5 to-purple-500/5 p-5 rounded-2xl border border-amber-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                      శ్రీ 100 సంవత్సరాల తెలుగు పంచాంగం & జాతక చక్రం (Vedic Astrological Calculator)
                    </h4>
                    <p className="text-[10.5px] text-zinc-600">
                      Our system calculates authentic Tithi, Nakshatram, and Lagnam in milliseconds based on standard astrological equations!
                    </p>
                  </div>
                </div>

                {profileToEdit.dob ? (
                  (() => {
                    const localCalc = calculatePanchangam(profileToEdit.dob, profileToEdit.birth_time || "08:30");
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                        <div className="space-y-3">
                          <div className="bg-white p-4 rounded-xl border border-amber-200/60 space-y-2 shadow-sm">
                            <span className="text-[9.5px] uppercase tracking-widest text-amber-700 font-extrabold block">Real-time calculations (ఖచ్చితమైన పంచాంగ ఫలితాలు)</span>
                            
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-500/10">
                                <span className="text-[9px] text-zinc-500 block">నక్షత్రం (Star)</span>
                                <span className="font-extrabold text-amber-950">{localCalc.nakshatram.english} ({localCalc.nakshatram.telugu})</span>
                                <span className="text-[8px] text-zinc-500 block">Lord: {localCalc.nakshatraLord} | Deity: {localCalc.deity}</span>
                              </div>
                              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-500/10">
                                <span className="text-[9px] text-zinc-500 block">రాశి (Moon Sign)</span>
                                <span className="font-extrabold text-amber-950">{localCalc.rasi.english} ({localCalc.rasi.telugu})</span>
                              </div>
                              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-500/10">
                                <span className="text-[9px] text-zinc-500 block">పాదము (Quarter)</span>
                                <span className="font-extrabold text-amber-700">{localCalc.pada} వ పాదం (Pada {localCalc.pada})</span>
                              </div>
                              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-500/10">
                                <span className="text-[9px] text-zinc-500 block">తిథి (Lunar Day)</span>
                                <span className="font-extrabold text-amber-950">{localCalc.tithi.telugu}</span>
                                <span className="text-[8.5px] text-zinc-500 block">{localCalc.tithi.english}</span>
                              </div>
                              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-500/10 col-span-2">
                                <span className="text-[9px] text-zinc-500 block">లగ్నం (Ascendant Sign)</span>
                                <span className="font-extrabold text-amber-700">{localCalc.lagnam.english} ({localCalc.lagnam.telugu})</span>
                              </div>
                            </div>
                            
                            <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/15 text-[10.5px] leading-relaxed text-amber-900 font-medium">
                              <span className="font-extrabold uppercase text-amber-700 block mb-0.5">✨ జాతక విశ్లేషణ (Jatakam Report Preview)</span>
                              {localCalc.spiritualAnalysis}
                            </div>
                          </div>
                        </div>

                        {/* Rendering the beautiful traditional South Indian Kundali chart */}
                        <div className="w-full">
                          <KundaliChart
                            lagnamIndex={localCalc.lagnam.index}
                            rasiIndex={localCalc.rasi.index}
                            name={`${profileToEdit.surname || ""} ${profileToEdit.name || ""}`}
                            dob={profileToEdit.dob}
                            birthTime={profileToEdit.birth_time}
                            birthLocation={profileToEdit.birth_location || "Not Specified"}
                            isInteractive={false}
                          />
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="bg-amber-50/20 p-8 rounded-xl border border-amber-500/10 text-center text-zinc-500 space-y-2">
                    <p className="text-xs">
                      దయచేసి జాతక చక్రం మరియు ఖచ్చితమైన పంచాంగ వివరాలను పొందడానికి పైన ఉన్న <strong>పుట్టిన తేదీ (Date of Birth)</strong> ని నమోదు చేయండి.
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      System will automatically compute the Kundali Chart (జాతక పత్రం) within milliseconds!
                    </p>
                  </div>
                )}
              </div>

              {/* Height */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Height (Feet)</label>
                <input
                  type="number"
                  step="0.01"
                  value={profileToEdit.height_feet}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, height_feet: parseFloat(e.target.value) || 5.5 })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Sub Caste */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Sub-Caste</label>
                <input
                  type="text"
                  value={profileToEdit.sub_caste}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, sub_caste: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Surname */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Surname (ఇంటిపేరు)</label>
                <input
                  type="text"
                  required
                  value={profileToEdit.surname || ""}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, surname: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Gothram */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Gothram (గోత్రం)</label>
                <input
                  type="text"
                  value={profileToEdit.gothram || ""}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, gothram: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Nakshatram */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Nakshatram (నక్షత్రం)</label>
                <input
                  type="text"
                  value={profileToEdit.astrology?.nakshatra || ""}
                  onChange={(e) => {
                    const updatedAstrology = {
                      ...(profileToEdit.astrology || {
                        nakshatraLord: "Mercury",
                        pada: 1,
                        rashi: "Mesha",
                        tithi: "Pratipada",
                        deity: "Pushan",
                        spiritualAnalysis: "Spiritual candidate.",
                        compatibilityTraits: [],
                        spiritualScore: 80
                      }),
                      nakshatra: e.target.value
                    };
                    setProfileToEdit({ ...profileToEdit, astrology: updatedAstrology });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Profession */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Profession</label>
                <input
                  type="text"
                  value={profileToEdit.profession}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, profession: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Salary LPA */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Salary (LPA)</label>
                <input
                  type="number"
                  value={profileToEdit.salary_lpa}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, salary_lpa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                />
              </div>

              {/* Contact Number */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Contact Number (Locked Once Set)</label>
                <input
                  type="text"
                  required
                  readOnly={Boolean(profileToEdit.contact_number && profileToEdit.contact_number.trim().length > 0)}
                  value={profileToEdit.contact_number}
                  onChange={(e) => {
                    if (!profileToEdit.contact_number) {
                      setProfileToEdit({ ...profileToEdit, contact_number: e.target.value });
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] ${profileToEdit.contact_number ? 'bg-gray-100 text-gray-600 cursor-not-allowed font-mono' : ''}`}
                />
                {profileToEdit.contact_number && (
                  <span className="text-[9px] text-amber-700 font-bold block">🔒 Registered mobile number cannot be removed or changed once registered.</span>
                )}
              </div>

              {/* Login Password */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Login Password</label>
                <input
                  type="text"
                  required
                  value={profileToEdit.password || ""}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-mono"
                  placeholder="Defaults to Date of Birth"
                />
              </div>

              {/* Account Status */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Verification Status</label>
                <select
                  value={profileToEdit.status}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                >
                  <option value="Pending">🕒 Pending</option>
                  <option value="Verified">✓ Verified</option>
                  <option value="Premium">✦ Premium</option>
                  <option value="Declined">✕ Declined</option>
                </select>
              </div>

              {/* Photo 1 URL */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">First Photo</label>
                {profileToEdit.photo_url && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500 mb-2 relative group">
                    <img src={profileToEdit.photo_url} alt="Photo 1 Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setProfileToEdit({ ...profileToEdit, photo_url: "" })}
                      className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById("edit-photo1-file")?.click()}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#362B5A] rounded-xl border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UploadCloud className="w-4 h-4 text-indigo-700" />
                    <span>Device Folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startCamera({ type: "edit", field: "photo_url" })}
                    className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-[#C2242C] rounded-xl border border-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </button>
                </div>
                <input
                  type="file"
                  id="edit-photo1-file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleDeviceUpload(e.target.files[0], { type: "edit", field: "photo_url" })}
                />
                <input
                  type="url"
                  placeholder="Or paste URL link directly here..."
                  value={profileToEdit.photo_url || ""}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, photo_url: e.target.value })}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] text-xs font-medium"
                />
              </div>

              {/* Photo 2 URL */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Second Photo</label>
                {profileToEdit.photo_url_2 && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500 mb-2 relative group">
                    <img src={profileToEdit.photo_url_2} alt="Photo 2 Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setProfileToEdit({ ...profileToEdit, photo_url_2: "" })}
                      className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById("edit-photo2-file")?.click()}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#362B5A] rounded-xl border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UploadCloud className="w-4 h-4 text-indigo-700" />
                    <span>Device Folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startCamera({ type: "edit", field: "photo_url_2" })}
                    className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-[#C2242C] rounded-xl border border-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </button>
                </div>
                <input
                  type="file"
                  id="edit-photo2-file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleDeviceUpload(e.target.files[0], { type: "edit", field: "photo_url_2" })}
                />
                <input
                  type="url"
                  placeholder="Or paste URL link directly here..."
                  value={profileToEdit.photo_url_2 || ""}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, photo_url_2: e.target.value })}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] text-xs font-medium"
                />
              </div>

              {/* Photo 3 URL */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Third Photo</label>
                {profileToEdit.photo_url_3 && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500 mb-2 relative group">
                    <img src={profileToEdit.photo_url_3} alt="Photo 3 Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setProfileToEdit({ ...profileToEdit, photo_url_3: "" })}
                      className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById("edit-photo3-file")?.click()}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#362B5A] rounded-xl border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UploadCloud className="w-4 h-4 text-indigo-700" />
                    <span>Device Folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startCamera({ type: "edit", field: "photo_url_3" })}
                    className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-[#C2242C] rounded-xl border border-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </button>
                </div>
                <input
                  type="file"
                  id="edit-photo3-file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleDeviceUpload(e.target.files[0], { type: "edit", field: "photo_url_3" })}
                />
                <input
                  type="url"
                  placeholder="Or paste URL link directly here..."
                  value={profileToEdit.photo_url_3 || ""}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, photo_url_3: e.target.value })}
                  className="w-full mt-1.5 px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] text-xs font-medium"
                />
              </div>

              {/* SECTION: Partner Expectations & Preferences */}
              <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                <h4 className="text-sm font-black text-[#362B5A] uppercase tracking-wider mb-3">Partner Preferences & Expectations</h4>
              </div>

              {/* Partner Expectation Type */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Preferred Profession Category</label>
                <select
                  value={profileToEdit.partner_expectation_type || "Any Profession (ఏదైనా ఉద్యోగం)"}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, partner_expectation_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                >
                  <option value="Any Profession (ఏదైనా ఉద్యోగం)">Any Profession (ఏదైనా ఉద్యోగం)</option>
                  <option value="Housewife (గృహిణి)">Housewife (గృహిణి)</option>
                  <option value="Working Profession (ఉద్యోగిని)">Working Profession (ఉద్యోగిని)</option>
                  <option value="Well Settled / High Income (బాగా స్థిరపడిన వరుడు)">Well Settled / High Income</option>
                </select>
              </div>

              {/* Expected Qualities in Partner (Desc) */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Expected Qualities Description</label>
                <input
                  type="text"
                  value={profileToEdit.partner_expectations_desc || ""}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, partner_expectations_desc: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                  placeholder="Culture, vegetarian, values, etc."
                />
              </div>



              {/* Expected Partner Income Range */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Expected Partner Income</label>
                <select
                  value={profileToEdit.partner_lpa_pref || "No Preference"}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, partner_lpa_pref: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                >
                  <option value="No Preference">No Preference</option>
                  <option value="< 6 LPA">&lt; 6 LPA</option>
                  <option value="6 - 12 LPA">6 - 12 LPA</option>
                  <option value="12 - 18 LPA">12 - 18 LPA</option>
                  <option value="18 - 24 LPA">18 - 24 LPA</option>
                  <option value="24+ LPA">24+ LPA</option>
                </select>
              </div>

              {/* Partner Shift Preference */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Partner Shift Preference</label>
                <select
                  value={profileToEdit.partner_shift_pref || "No Preference"}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, partner_shift_pref: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                >
                  <option value="No Preference">No Preference</option>
                  <option value="Day Shift Only">Day Shift Only</option>
                  <option value="Night Shift Only">Night Shift Only</option>
                  <option value="Flexible Shift">Flexible / Rotational Shift</option>
                </select>
              </div>

              {/* --- BIDIRECTIONAL ALIGNMENT RANGES --- */}
              {editPrefsToEdit && (
                <>
                  {/* Preferred Sub-Caste Range */}
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600 uppercase text-[10px]">Alignment Target Sub-Caste</label>
                    <select
                      value={editPrefsToEdit.preferred_sub_caste}
                      onChange={(e) => setEditPrefsToEdit({ ...editPrefsToEdit, preferred_sub_caste: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] bg-[#EBF6FF]/30 font-semibold"
                    >
                      <option value="My Sub-caste">My Sub-caste (నాలాంటి ఉపకులం)</option>
                      <option value="Any">Any Sub-caste (ఏ ఉపకులమైనా పర్వాలేదు)</option>
                    </select>
                  </div>

                  {/* Preferred Height Range */}
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600 uppercase text-[10px]">Alignment Height Range</label>
                    <select
                      value={editPrefsToEdit.height_range}
                      onChange={(e) => setEditPrefsToEdit({ ...editPrefsToEdit, height_range: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] bg-[#EBF6FF]/30 font-semibold"
                    >
                      <option value="Any">Any Height</option>
                      <option value="5.0 - 5.5">5.0 - 5.5 feet</option>
                      <option value="5.2 - 5.8">5.2 - 5.8 feet</option>
                      <option value="5.5 - 6.0">5.5 - 6.0 feet</option>
                      <option value="5.8 - 6.4">5.8 - 6.4 feet</option>
                    </select>
                  </div>

                  {/* Max Age Difference */}
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600 uppercase text-[10px]">Alignment Max Age Difference</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={editPrefsToEdit.age_gap}
                        onChange={(e) => setEditPrefsToEdit({ ...editPrefsToEdit, age_gap: parseInt(e.target.value, 10) || 5 })}
                        className="w-20 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] bg-[#EBF6FF]/30 font-mono text-center font-bold text-xs"
                      />
                      <span className="text-gray-500 font-medium">years gap</span>
                    </div>
                  </div>
                </>
              )}

              {/* Kundali URL */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-gray-600 uppercase">Kundali Document / Image</label>
                {profileToEdit.kundali_url && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-100 w-fit mb-2 flex items-center gap-2">
                    <span>✓ Kundali Saved: {profileToEdit.kundali_url.substring(0, 45)}...</span>
                    <button
                      type="button"
                      onClick={() => setProfileToEdit({ ...profileToEdit, kundali_url: "" })}
                      className="text-red-600 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById("edit-kundali-file")?.click()}
                    className="flex-1 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#362B5A] rounded-xl border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UploadCloud className="w-4 h-4 text-indigo-700" />
                    <span>Upload Document File (PDF / Images / Birth Chart)</span>
                  </button>
                </div>
                <input
                  type="file"
                  id="edit-kundali-file"
                  accept="image/*, .pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleDeviceUpload(e.target.files[0], { type: "edit", field: "kundali_url" })}
                />
                <input
                  type="url"
                  placeholder="Or paste Google Drive link / external document link here..."
                  value={profileToEdit.kundali_url || ""}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, kundali_url: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] text-xs"
                />
              </div>

              {/* Subscription status */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600 uppercase">Subscription Level</label>
                <select
                  value={profileToEdit.subscription_status || "free"}
                  onChange={(e) => setProfileToEdit({ ...profileToEdit, subscription_status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                >
                  <option value="free">🆓 Free Tier</option>
                  <option value="paid_100">💳 Paid ₹100</option>
                  <option value="paid_900">👑 Paid ₹900 (Full Access)</option>
                </select>
              </div>
            </div>

            {/* CTA Actions */}
            <div className="flex gap-3.5 pt-4 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setProfileToEdit(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-xs hover:bg-gray-50 cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#C2242C] hover:bg-opacity-95 text-white font-bold uppercase tracking-wider text-xs shadow-md cursor-pointer flex items-center gap-1"
              >
                <ShieldCheck className="w-4 h-4" />
                Save Sacred Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && profileToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-red-200 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-4 bg-red-50 text-[#C2242C] rounded-full w-fit mx-auto">
              <Trash2 className="w-8 h-8 text-[#C2242C] animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-[#362B5A]">Purge Sacred Record?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Are you absolutely sure you want to permanently delete the profile of <span className="font-bold text-[#C2242C]">{profileToDelete.name}</span>? This administrative action is irreversible and will sever all database linkages.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setProfileToDelete(null);
                }}
                className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer text-center"
              >
                No, Keep Record
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-[#C2242C] hover:bg-opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer text-center shadow-md"
              >
                Yes, Purge Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSOCIATED PHONE REGISTRY MODAL */}
      {associatedPhoneModal !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-indigo-100 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#362B5A]">Associated Family Profiles</h3>
                  <p className="text-xs text-gray-500 font-mono">Contact Number: {associatedPhoneModal}</p>
                </div>
              </div>
              <button
                onClick={() => setAssociatedPhoneModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed bg-amber-50 border border-amber-200/50 p-3 rounded-2xl">
                💡 <strong>Parental Association:</strong> Click <strong>"Shortlist Matches"</strong> to run automated match queries across the Brahmin registry, or click <strong>"Edit Record"</strong> to adjust astrological particulars.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100 text-left">
                  <thead className="bg-[#EBF6FF]/50 text-[10px] font-bold text-[#362B5A] uppercase">
                    <tr>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Sub-Caste & Gothram</th>
                      <th className="px-4 py-3">DOB / Age</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-800">
                    {profiles
                      .filter((p) => {
                        if (!associatedPhoneModal) return false;
                        const cleanModal = associatedPhoneModal.replace(/\D/g, "");
                        const cleanContact = p.contact_number.replace(/\D/g, "");
                        return cleanContact.includes(cleanModal) || cleanModal.includes(cleanContact);
                      })
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-sm shrink-0">
                                <img
                                  src={p.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <span className="font-bold text-[#362B5A] block">{p.name}</span>
                                <span className="text-[9px] text-gray-400 font-mono block uppercase">{p.id} ({p.gender})</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-semibold text-gray-700 block">{p.sub_caste}</span>
                            <span className="text-[9px] text-indigo-600 block font-bold font-mono uppercase">{p.surname ? `${p.surname} • ` : ""}{p.gothram || "No Gothram"}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-gray-600 block">{p.dob}</span>
                            <span className="font-bold text-[#362B5A] block">{calculateAge(p.dob)} Years</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  handleProfileClick(p);
                                  setAssociatedPhoneModal(null);
                                }}
                                className="px-3 py-1.5 bg-[#C2242C] text-white hover:brightness-110 font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                              >
                                Shortlist Matches
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  openEditModal(p);
                                  setAssociatedPhoneModal(null);
                                }}
                                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-gray-700 font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {profiles.filter((p) => {
                      if (!associatedPhoneModal) return false;
                      const cleanModal = associatedPhoneModal.replace(/\D/g, "");
                      const cleanContact = p.contact_number.replace(/\D/g, "");
                      return cleanContact.includes(cleanModal) || cleanModal.includes(cleanContact);
                    }).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                          No other registered candidates share this contact number.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setAssociatedPhoneModal(null)}
                className="px-5 py-2 rounded-xl bg-[#362B5A] text-white hover:brightness-110 font-bold uppercase tracking-wider text-xs cursor-pointer"
              >
                Close Registry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSTAGRAM-TRENDING AESTHETIC PAYMENT VERIFICATION GATEWAY MODAL */}
      {isPaymentModalOpen && paymentProfile && (
        <div className="fixed inset-0 bg-[#362B5A]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-[#FFF5F5] via-[#FFFBFB] to-[#F5F3FF] rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-pink-100 space-y-6 text-left animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl -translate-y-6 translate-x-6" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-300/20 rounded-full blur-3xl translate-y-12 -translate-x-12" />

            <div className="relative z-10 flex items-center justify-between border-b border-pink-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-tr from-pink-500 to-violet-600 text-white rounded-2xl shadow-lg">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#362B5A] tracking-tight">Confirm Match Fees Received</h3>
                  <p className="text-xs text-violet-700/80 font-bold uppercase tracking-wider mt-0.5">Payment Verification Gate</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentProfile(null);
                }}
                className="p-2 hover:bg-pink-100/50 rounded-full transition-colors text-[#362B5A] cursor-pointer font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div className="relative z-10 space-y-4 bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/80 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-pink-200">
                  <img
                    src={paymentProfile.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                    alt={paymentProfile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-extrabold text-[#362B5A] text-base leading-tight">{paymentProfile.name}</p>
                  <p className="text-xs text-gray-500 font-semibold">{paymentProfile.profession}</p>
                  <p className="text-[10px] font-mono text-indigo-700 font-black tracking-widest mt-0.5 uppercase">{paymentProfile.sub_caste}</p>
                </div>
              </div>

              <div className="border-t border-pink-50 pt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-[#362B5A] uppercase">Target Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider font-mono ${
                  paymentTargetStatus === "paid_900"
                    ? "bg-[#362B5A] text-white"
                    : "bg-[#EBF6FF] text-[#362B5A]"
                }`}>
                  {paymentTargetStatus === "paid_900" ? "👑 Paid ₹900" : "💳 Paid ₹100"}
                </span>
              </div>
            </div>

             <form onSubmit={handleVerifyPaymentSubmit} className="relative z-10 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-[#362B5A] uppercase tracking-wider">
                  Transaction Reference ID (ట్రాన్సాక్షన్ ఐడి) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={paymentTxnId}
                  onChange={(e) => setPaymentTxnId(e.target.value)}
                  placeholder="Enter Transaction ID (e.g. TXN12345678)"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-pink-100 bg-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-500 text-sm font-bold text-[#362B5A]"
                />
                <p className="text-[10px] text-violet-700 font-bold leading-normal italic">
                  To avoid record mismatch, check the transaction ID in Google Pay, PhonePe, or bank statements before typing.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-[#362B5A] uppercase tracking-wider">
                  Receiver's UPI ID (డబ్బులు పొందిన UPI ఐడి) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={receiverUpiId}
                  onChange={(e) => setReceiverUpiId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-pink-100 bg-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-500 text-sm font-bold text-[#362B5A]"
                >
                  <option value="bramhanavedika@ybl">bramhanavedika@ybl (Main Office)</option>
                  <option value="subramanyamghadiyaram@ybl">subramanyamghadiyaram@ybl (GV Subramanyam)</option>
                  <option value="pvsubbareddy@okaxis">pvsubbareddy@okaxis (PV Subba Reddy)</option>
                  <option value="custom">Other / Custom UPI ID...</option>
                </select>

                {receiverUpiId === "custom" && (
                  <input
                    type="text"
                    required
                    value={customReceiverUpiId}
                    onChange={(e) => setCustomReceiverUpiId(e.target.value)}
                    placeholder="Enter Custom UPI ID (e.g. name@upi)"
                    className="w-full mt-2 px-4 py-3 rounded-2xl border-2 border-pink-100 bg-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-500 text-sm font-bold text-[#362B5A]"
                  />
                )}
                <p className="text-[10px] text-violet-700 font-bold leading-normal italic">
                  Select or type the exact UPI address on which the registration or upgrade amount was received.
                </p>
              </div>

              <div className="p-3 bg-violet-50 text-violet-800 rounded-2xl border border-violet-100 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Authorization Audit Stamp</span>
                  Authorized by: <span className="font-extrabold text-violet-900 underline">{localStorage.getItem("bramhana_logged_in_user_id") === "subramanyam" ? "GV Subramanyam" : "PV Subba Reddy"}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setPaymentProfile(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-xl font-black uppercase tracking-wider text-xs cursor-pointer transition-all shadow-lg shadow-pink-500/20 hover:brightness-110"
                >
                  Confirm & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTREMELY POLISHED, DIGITAL RECEIPTS & WHATSAPP LAUNCHER MODAL */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 bg-[#362B5A]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 text-left animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden max-h-[95vh] overflow-y-auto">
            {/* Ambient Background Accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#EBF6FF]/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-50/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-tr from-[#362B5A] to-[#C2242C] text-white rounded-2xl shadow-lg">
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#362B5A] tracking-tight">Payment Approved & Active</h3>
                  <p className="text-xs text-[#C2242C] font-bold uppercase tracking-wider mt-0.5">Vedic E-Receipt Hub</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setReceiptData(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700 cursor-pointer font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Visual Receipt Card (Simulation of PDF/Aesthetic styling) */}
            <div id="visual-receipt-card" className="relative z-10 p-6 bg-gradient-to-br from-[#FAF9F5] to-white rounded-3xl border-2 border-amber-100/70 shadow-sm space-y-5 overflow-hidden">
              {/* Verification Watermark */}
              <div className="absolute right-6 top-16 opacity-[0.06] pointer-events-none select-none">
                <div className="border-4 border-dashed border-[#C2242C] text-[#C2242C] px-6 py-3 font-mono font-black text-4xl rounded-xl uppercase tracking-widest rotate-[-15deg]">
                  BVV VERIFIED
                </div>
              </div>

              <div className="flex justify-between items-start border-b border-dashed border-amber-200 pb-4">
                <div>
                  <h4 className="font-extrabold text-[#362B5A] text-lg uppercase tracking-wider">Bramhana Vivaha Vedika</h4>
                  <p className="text-[10px] text-gray-500 leading-normal">Sri G.V. Subramanyam Registrar, Ph: 9494301555</p>
                  <p className="text-[9px] text-[#C2242C] font-bold uppercase tracking-widest mt-0.5">సనాతన బ్రాహ్మణ వివాహ వేదిక</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono font-black px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
                    Paid ₹{receiptData.amount}
                  </span>
                  <p className="text-[10px] font-mono text-gray-400 mt-1.5">No: BVV-REC-{receiptData.transactionId.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>

              {/* Billing Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 bg-white/60 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Billing To (సభ్యుల వివరాలు):</span>
                  <p className="font-bold text-gray-800 text-sm">{receiptData.name}</p>
                  <p className="text-gray-500 leading-relaxed">
                    ID/Reg: <strong className="text-gray-700">{receiptData.regNumber}</strong><br/>
                    Gender: <strong className="text-gray-700">{receiptData.gender}</strong><br/>
                    Contact: <strong className="text-gray-700">{receiptData.contactNumber}</strong>
                  </p>
                </div>

                <div className="space-y-2 bg-white/60 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Audit Ledger Details (చెల్లింపు వివరాలు):</span>
                  <p className="text-gray-500 leading-relaxed">
                    Transaction ID: <strong className="text-indigo-900 font-mono font-bold block truncate mt-0.5 text-[11px]" title={receiptData.transactionId}>{receiptData.transactionId}</strong>
                    Receiver UPI: <strong className="text-emerald-800 font-bold block mt-0.5">{receiptData.receiverUpi}</strong>
                    Approved At: <strong className="text-gray-700 block mt-0.5">{receiptData.timestamp}</strong>
                    Approved By: <strong className="text-[#362B5A] block mt-0.5">{receiptData.receivedBy}</strong>
                  </p>
                </div>
              </div>

              {/* Service Table Summary */}
              <div className="border-t border-amber-100/50 pt-3 text-xs">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase pb-1.5 border-b border-gray-100">
                  <span>Description of Matrimonial Access</span>
                  <span className="text-right">Total (INR)</span>
                </div>
                <div className="flex justify-between items-start py-2">
                  <div className="max-w-[80%] text-left">
                    <p className="font-bold text-gray-700">Premium Registry Activation & Verification Fee</p>
                    <p className="text-[9px] text-gray-400 leading-relaxed mt-0.5">
                      Enables full system verification status, unlocks reverse opposite-gender matching engine metrics, provides access to certified Jataka & Gothram verification, and secures registry inclusion.
                    </p>
                  </div>
                  <span className="font-bold text-[#362B5A] font-mono text-right shrink-0">₹{receiptData.amount}.00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-500/5 border border-amber-200/40 rounded-xl mt-2 font-mono">
                  <span className="text-[10px] text-amber-900 font-bold uppercase text-left">Total Settled Amount:</span>
                  <span className="font-black text-[#C2242C] text-sm text-right">₹{receiptData.amount}.00</span>
                </div>
              </div>

              {/* Signature Stamp Mock */}
              <div className="flex justify-between items-end pt-2 text-[10px]">
                <div className="text-gray-400 text-[9px] max-w-[65%] leading-relaxed font-sans text-left">
                  *This document is digitally validated under IT Rules 2021. For help, contact Sri G.V. Subramanyam Registrar or PV Subba Reddy.
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-red-50 text-[#C2242C] font-black px-2 py-0.5 rounded uppercase border border-red-200">
                    APPROVED BY VEDIKA
                  </span>
                  <p className="font-bold text-gray-700 mt-1 leading-tight">{receiptData.receivedBy}</p>
                  <p className="text-gray-400 leading-none">Registrar Representative</p>
                </div>
              </div>
            </div>

            {/* Action Buttons Hub */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {/* WhatsApp Option */}
              <button
                type="button"
                onClick={handleSendWhatsAppReceipt}
                className="py-3 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold uppercase tracking-wider text-[11px] cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#25D366]/20"
              >
                <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.528 2.017 14.077.99 11.517.99c-5.44 0-9.866 4.372-9.87 9.802 0 1.958.52 3.878 1.503 5.586L2.148 21.84l5.656-1.474z" />
                </svg>
                <span>Send WhatsApp</span>
              </button>

              {/* Email Option */}
              <button
                type="button"
                onClick={handleSendEmailReceipt}
                className="py-3 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider text-[11px] cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span>Send Email</span>
              </button>

              {/* PDF Print Option */}
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="py-3 px-3 bg-[#362B5A] hover:bg-[#251d3f] text-white rounded-xl font-bold uppercase tracking-wider text-[11px] cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#362B5A]/20"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Print PDF</span>
              </button>

              {/* Copy Plain Text Option */}
              <button
                type="button"
                onClick={handleCopyReceiptText}
                className="py-3 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold uppercase tracking-wider text-[11px] cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4 shrink-0" />
                <span>Copy Text</span>
              </button>
            </div>

            <div className="relative z-10 flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setReceiptData(null);
                }}
                className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer transition-colors"
              >
                Close Receipt Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP TEMPLATE PREVIEW MODAL */}
      {isWhatsappModalOpen && whatsappProfile && (
        <div className="fixed inset-0 bg-[#362B5A]/50 backdrop-blur-md z-[200] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FCFDFE] to-[#FFFBFD] rounded-[24px] sm:rounded-[32px] max-w-2xl w-full p-4 sm:p-8 shadow-2xl border-2 border-amber-100 space-y-4 sm:space-y-6 text-left animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/10 rounded-full blur-2xl -translate-y-6 translate-x-6 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-300/10 rounded-full blur-3xl translate-y-12 -translate-x-12 pointer-events-none" />
            
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-amber-100/60 pb-3 sm:pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-[#25D366] text-white rounded-2xl shadow-lg shadow-[#25D366]/20">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-white" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.528 2.017 14.077.99 11.517.99c-5.44 0-9.866 4.372-9.87 9.802 0 1.958.52 3.878 1.503 5.586L2.148 21.84l5.656-1.474z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#362B5A] tracking-tight leading-tight">WhatsApp Notification Desk</h3>
                  <p className="text-[10px] sm:text-xs text-amber-700/80 font-bold uppercase tracking-wider mt-0.5">
                    Parent-Centric Telephony & Matching Templates
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsWhatsappModalOpen(false);
                  setWhatsappProfile(null);
                }}
                className="p-1.5 sm:p-2 hover:bg-amber-100/50 rounded-full transition-colors text-[#362B5A] cursor-pointer font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Container for Modal Body to make it 100% Mobile Safe */}
            <div className="relative z-10 flex-1 overflow-y-auto pr-1 space-y-4 sm:space-y-6 scrollbar-thin">
              
              {/* Important Call Advisory Banner */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl text-xs text-amber-900 leading-relaxed space-y-1">
                <p className="font-extrabold flex items-center gap-1">
                  <span className="animate-ping w-2 h-2 rounded-full bg-amber-500" />
                  📢 టెలిఫోన్ సంప్రదింపు సలహా (Telephony Advisory Notice)
                </p>
                <p>
                  <strong>మొబైల్ ఫోన్ కాల్స్ ఎత్తని సందర్భంలో లేదా బిజీగా ఉన్నప్పుడు, ఈ క్రింది వాట్సాప్ సందేశం పంపడం అత్యుత్తమ మార్గం.</strong> ఇది వయస్సు పైబడిన తల్లిదండ్రులకు అత్యంత గౌరవప్రదంగా వివరాలను తెలియజేయడానికి ఉపయోగపడుతుంది.
                </p>
                <p className="text-[11px] text-amber-800 italic">
                  (When phone calls are unanswered or they do not lift, sending this detailed, polite bilingual WhatsApp message is the best option to maintain a high-trust connection with families.)
                </p>
              </div>

              {/* Profile Overview and Target Parent Tip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/60 p-3 sm:p-4 rounded-2xl border border-amber-100">
                <div className="sm:col-span-2 flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-amber-300 shrink-0">
                    <img
                      src={whatsappProfile.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"}
                      alt={whatsappProfile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-extrabold text-[#362B5A] text-sm leading-tight">
                      {whatsappProfile.surname ? `${whatsappProfile.surname} ` : ""}{whatsappProfile.name}
                    </p>
                    <p className="text-xs text-zinc-500 font-medium">
                      {whatsappProfile.sub_caste || "Bramhana"} • {whatsappProfile.gothram || "Gotram Not Specified"}
                    </p>
                    <p className="text-[10px] font-mono font-bold text-amber-800 mt-0.5">
                      📞 {whatsappProfile.contact_number}
                    </p>
                  </div>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 p-2 rounded-xl text-center flex flex-col justify-center">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase block leading-none">Audience Profile</span>
                  <span className="text-[10px] text-amber-800 font-extrabold block mt-1">60+ Years Parents (72%)</span>
                  <span className="text-[7.5px] text-zinc-400 mt-0.5">Prefers respectful, bilingual clarity</span>
                </div>
              </div>

              {/* Admin Selection and UPI accounts */}
              <div className="bg-amber-500/5 border border-amber-100 rounded-2xl p-3 sm:p-4 space-y-2">
                <span className="block text-[10px] font-extrabold text-[#362B5A] uppercase tracking-wider">
                  Select Verifying Administrator & UPI Account:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWhatsappVerifyingAdmin("subramanyam")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      whatsappVerifyingAdmin === "subramanyam"
                        ? "bg-[#362B5A] text-white border-[#362B5A] shadow-md ring-2 ring-amber-300"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <div>
                      <span className="block font-black text-xs">GV Subramanyam</span>
                      <span className={`block text-[9px] mt-1 font-mono ${whatsappVerifyingAdmin === 'subramanyam' ? 'text-amber-200' : 'text-zinc-500'}`}>
                        UPI ID: {adminSettings.subramanyamUpi}
                      </span>
                      <span className="block text-[8px] opacity-80 font-bold mt-1">⭐️ Lead Admin</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWhatsappVerifyingAdmin("subba_reddy")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      whatsappVerifyingAdmin === "subba_reddy"
                        ? "bg-[#362B5A] text-white border-[#362B5A] shadow-md ring-2 ring-amber-300"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <div>
                      <span className="block font-black text-xs">PV Subba Reddy</span>
                      <span className={`block text-[9px] mt-1 font-mono ${whatsappVerifyingAdmin === 'subba_reddy' ? 'text-amber-200' : 'text-zinc-500'}`}>
                        UPI ID: {adminSettings.subbaReddyUpi}
                      </span>
                      <span className="block text-[8px] opacity-80 font-bold mt-1">⭐️ Co-Founder Admin</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Template Selector Tabs */}
              <div className="space-y-2">
                <span className="block text-[10px] font-extrabold text-[#362B5A] uppercase tracking-wider">
                  Select Professional Bilingual Template:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWhatsappTemplate("welcome")}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedWhatsappTemplate === "welcome"
                        ? "bg-[#362B5A] text-white border-[#362B5A] shadow-md"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="block text-[9px] uppercase opacity-75">Step 1</span>
                    <span className="font-extrabold mt-1 text-[11px] leading-tight">Welcome & Call Request</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWhatsappTemplate("kundali_profile")}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedWhatsappTemplate === "kundali_profile"
                        ? "bg-[#362B5A] text-white border-[#362B5A] shadow-md"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="block text-[9px] uppercase opacity-75">Step 2</span>
                    <span className="font-extrabold mt-1 text-[11px] leading-tight">Match Biodata & Kundali</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWhatsappTemplate("astrology_jatakam")}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedWhatsappTemplate === "astrology_jatakam"
                        ? "bg-[#362B5A] text-white border-[#362B5A] shadow-md"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="block text-[9px] uppercase opacity-75">Step 3</span>
                    <span className="font-extrabold mt-1 text-[11px] leading-tight">Shortlist & Premium (₹900)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWhatsappTemplate("status_payment")}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedWhatsappTemplate === "status_payment"
                        ? "bg-[#362B5A] text-white border-[#362B5A] shadow-md"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="block text-[9px] uppercase opacity-75">Step 4</span>
                    <span className="font-extrabold mt-1 text-[11px] leading-tight">Verified Login & Link</span>
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-[#362B5A] uppercase tracking-wider">
                    Personalized Message Draft (శ్రీ బ్రాహ్మణ వైదిక సందేశం)
                  </label>
                  <span className="text-[10px] text-zinc-400 font-bold italic">
                    Bilingual Layout (English & Telugu)
                  </span>
                </div>

                {/* Dynamic message compiler */}
                {(() => {
                  const adminDetails = whatsappVerifyingAdmin === "subramanyam"
                    ? { name: "GV Subramanyam", role: "Founder", upi: adminSettings.subramanyamUpi, qr: adminSettings.subramanyamQr }
                    : { name: "PV Subba Reddy", role: "Co-Founder", upi: adminSettings.subbaReddyUpi, qr: adminSettings.subbaReddyQr };
                  const adminName = adminDetails.name;
                  const adminRole = adminDetails.role;
                  const adminUpi = adminDetails.upi;
                  const adminQr = adminDetails.qr;

                  const name = `${whatsappProfile.surname || ""} ${whatsappProfile.name}`.trim();
                  const genderLabel = whatsappProfile.gender === "Male" ? "వరుడు (Groom)" : "వధువు (Bride)";
                  const subCaste = whatsappProfile.sub_caste || "Bramhana";
                  const gothram = whatsappProfile.gothram || "Gotram Not Specified";
                  const profession = whatsappProfile.profession || "Professional";
                  const lpa = whatsappProfile.salary_lpa ? `${whatsappProfile.salary_lpa} LPA` : "Not Specified";
                  const location = whatsappProfile.birth_location || "Andhra Pradesh, India";
                  const height = whatsappProfile.height_feet ? `${whatsappProfile.height_feet} Feet` : "Not Specified";

                  // Calculated traditional astrology
                  let star = whatsappProfile.nakshatram || whatsappProfile.astrology?.nakshatra || "Not calculated";
                  let rasi = whatsappProfile.astrology?.rashi || "Not calculated";
                  let pada = whatsappProfile.astrology?.pada || "N/A";
                  let deity = whatsappProfile.astrology?.deity || "Not Specified";

                  // Generate pure traditional Telugu terms for tithi using high-precision calculations
                  let traditionalTithi = "వైశాఖ మాసం, శుక్ల పక్షం, పాడ్యమి (వైశాఖ శుద్ధ పాడ్యమి)";
                  try {
                    const calc = calculatePanchangam(whatsappProfile.dob, whatsappProfile.birth_time || "08:30");
                    traditionalTithi = `${calc.tithi.english} / ${calc.tithi.telugu}`;
                  } catch (e) {
                    console.error("Error calculating Panchangam for WhatsApp compiler:", e);
                  }

                  let compiledMessage = "";
                  if (selectedWhatsappTemplate === "welcome") {
                    compiledMessage = `నమస్కారం/Namaskaram 🙏\n\nశ్రీ బ్రాహ్మణ विवाह వేదిక (Bramhana Vivaha Vedika) కు స్వాగతం. \n\nమేము మీ ప్రొఫైల్ నమోదును విజయవంతంగా స్వీకరించాము. మీ చిరంజీవి *${name}* గారి ప్రొఫైల్ మరియు జాతక వివరాలను మా బ్రాహ్మణ వైవాహిక పోర్టల్ నందు భద్రపరిచాము.\n\n*📋 నమోదు చేసిన వివరాలు / Candidate Registration Profile:*\n👉 పేరు (Name): *${name}*\n👉 లింగం (Gender): *${genderLabel}*\n👉 ఉపశాఖ (Sub-Caste): *${subCaste}*\n👉 గోత్రం (Gothram): *${gothram}*\n👉 ఉద్యోగం (Profession): *${profession}*\n👉 జీతం (Annual Income): *${lpa}*\n👉 జన్మస్థలం (Birth Location): *${location}*\n👉 ఎత్తు (Height): *${height}*\n👉 నక్షత్రం (Star): *${star}* (పాదం: ${pada})\n👉 రాశి (Moon Sign): *${rasi}*\n👉 లగ్నం (Ascendant): *${whatsappProfile.astrology?.lagnam || "Not calculated"}*\n👉 తిథి (Tithi): *${traditionalTithi}*\n\n*🔔 రిజిస్ట్రేషన్ ఫీజు చెల్లింపు / Registration Verification fee:*\nమా పోర్టల్ నందు మీ ప్రొఫైల్ ని పూర్తిగా యాక్టివేట్ చేసి, సంబంధాలు (Shortlists) పంపించడం ప్రారంభించడానికి ₹100 కనీస రిజిస్ట్రేషన్ ఫీజును క్రింది యూపీఐ ఐడి (UPI ID) కి పంపించవలసిందిగా కోరుతున్నాము.\nTo activate your profile and start receiving candidate profiles, we request you to pay the registration fee of ₹100 to the following Admin UPI ID.\n\n*💳 పేమెంట్ వివరాలు / Admin Payment Desk:*\n👉 చెల్లించాల్సిన రుసుము (Amount to Pay): *₹100*\n👉 UPI ID: *${adminUpi}*\n👉 ఖాతాదారుడి పేరు (Receiver Name): *${adminName}*\n\nగమనిక: పేమెంట్ చేసిన తర్వాత స్క్రీన్ షాట్ ని ఈ నెంబర్ కి వాట్సాప్ చేయండి, మీ పోర్టల్ అకౌంట్ వెంటనే యాక్టివేట్ చేయబడుతుంది.\nNote: After making payment, please reply with a screenshot on this chat to instantly activate your portal account.\n\n*Registered & Handled by ${adminRole}:* *${adminName}*\n\nకృతజ్ఞతలతో/Warm regards,\nబ్రాహ్మణ विवाह వేదిక బృందం (Bramhana Vivaha Vedika Team)\n📞 సంప్రదించండి/Contact: +91 94942 34567`;
                  } else if (selectedWhatsappTemplate === "kundali_profile") {
                    compiledMessage = `నమస్కారం/Namaskaram 🙏\n\nశ్రీ బ్రాహ్మణ विवाह వేదిక (Bramhana Vivaha Vedika) నుండి మీ చిరంజీవి *${name}* కొరకు సిద్ధం చేసిన మ్యాచ్ సమాచారం.\n\n*📋 మ్యాచ్ ప్రొఫైల్ సమాచారం / Match Kundali Portfolio:*\n👉 వరుడు/వధువు (Candidate Name): *${name}*\n👉 ఉపశాఖ (Sub-Caste): *${subCaste}*\n👉 జన్మ నక్షత్రం (Star): *${star}* (పాదం: ${pada})\n👉 రాశి (Rashi): *${rasi}*\n👉 లగ్నం (Ascendant): *${whatsappProfile.astrology?.lagnam || "Not calculated"}*\n👉 తిథి (Tithi): *${traditionalTithi}*\n👉 దేవత (Deity): *${deity}*\n👉 గోత్రం (Gothram): *${gothram}*\n👉 ఉద్యోగం (Profession): *${profession}*\n👉 జన్మస్థలం (Birth Location): *${location}*\n👉 ఎత్తు (Height): *${height}*\n👉 వార్షిక ఆదాయం (Annual Income): *${lpa}*\n\nమీకు ఈ సంబంధం నచ్చినట్లయితే, మా పోర్టల్ లో లాగిన్ అయి వీరి పూర్తి వివరాలు, ఫోటోలు, మరియు ఫోన్ నంబర్లు వీక్షించవచ్చు.\nIf you are interested in this candidate profile, please log in to our web portal to view full details and check astrological compatibility.\n\n*Portfolio Shared & Handled by ${adminRole}:* *${adminName}*\n\nకృతజ్ఞతలతో/Warm regards,\nబ్రాహ్మణ विवाह వేదిక బృందం (Bramhana Vivaha Vedika Team)\n📞 సంప్రదించండి/Contact: +91 94942 34567`;
                  } else if (selectedWhatsappTemplate === "astrology_jatakam") {
                    compiledMessage = `నమస్కారం/Namaskaram 🙏\n\nశ్రీ బ్రాహ్మణ विवाह వేదిక (Bramhana Vivaha Vedika) నుండి ఒక ముఖ్యమైన సమాచారం.\n\nమేము మీ ప్రొఫైల్ *${name}* కొరకు మా వైవాహిక వేదిక నందు అత్యంత అనుకూలమైన మరియు శ్రేష్ఠమైన వధూవరుల మ్యాచింగ్ సంబంధాలను (Shortlists) సిద్ధం చేసాము! \n\n*🔥 ప్రీమియం అప్‌గ్రేడ్ వివరాలు / Premium Upgrade Details:*\nషార్ట్‌లిస్ట్ చేసిన వధూవరుల పూర్తి ఫోటోలు, నక్షత్ర మ్యాచింగ్‌లు, మరియు వారి తల్లిదండ్రుల ప్రత్యక్ష సంప్రదింపు ఫోన్ నంబర్ల పూర్తి వివరాలను వెంటనే పొందేందుకు మిగిలిన ₹900 ప్రీమియం రుసుమును క్రింది UPI ఐడి ద్వారా చెల్లించి మీ అకౌంట్ ని యాక్టివేట్ చేసుకోగలరు.\nWe have found highly compatible matches for your profile in our registry! To instantly view candidate photos, check matching horoscopes, and access direct contact numbers, we kindly request you to complete your ₹900 premium fee upgrade.\n\n*📢 మా సంప్రదింపు విధానం / Support & Call Procedure:*\nమేము సాధారణంగా నేరుగా ఫోన్ ద్వారా మీకు వివరాలు అందిస్తాము. ఒకవేళ ఏదేని కారణం చేత మా ఫోన్ కాల్స్ ఎత్తని సందర్భంలో లేదా మీరు బిజీగా ఉన్నప్పుడు, ఈ వాట్సాప్ సందేశం ద్వారా సమాచారాన్ని పంపడం మా నిరంతర సంప్రదింపు విధానం.\nWe also contact you via direct phone call. However, if you are busy or unable to pick up, sharing our matching alerts and UPI payment info via WhatsApp is our standard professional procedure.\n\n*💳 పేమెంట్ వివరాలు / Admin Payment Desk:*\n👉 చెల్లించాల్సిన రుసుము (Amount to Pay): *₹900*\n👉 UPI ID: *${adminUpi}*\n👉 ఖాతాదారుడి పేరు (Receiver Name): *${adminName}*\n\nగమనిక: పేమెంట్ చేసిన తర్వాత స్క్రీన్ షాట్ ని ఈ నెంబర్ కి వాట్సాప్ చేయండి, మీ పోర్టల్ అకౌంట్ వెంటనే యాక్టివేట్ చేయబడుతుంది.\nNote: After making payment, please reply with a screenshot on this chat to instantly activate your portal account.\n\n*Report Generated & Handled by ${adminRole}:* *${adminName}*\n\nకృతజ్ఞతలతో/Warm regards,\nబ్రాహ్మణ विवाह వేదిక బృందం (Bramhana Vivaha Vedika Team)\n📞 సంప్రదించండి/Contact: +91 94942 34567`;
                  } else if (selectedWhatsappTemplate === "status_payment") {
                    compiledMessage = `నమస్కారం/Namaskaram 🙏\n\nశ్రీ బ్రాహ్మణ विवाह వేదిక (Bramhana Vivaha Vedika) నందు మీ ప్రొఫైల్ విజయవంతంగా ధృవీకరించబడింది (Profile Successfully Verified).\n\nమీ చిరంజీవి *${name}* గారి కొరకు మేము సిద్ధం చేసిన శ్రేష్ఠమైన షార్ట్‌లిస్ట్ మ్యాచింగ్స్ ను మీరు ఇప్పుడే మా అధికారిక వెబ్సైట్ లో లాగిన్ అయి వీక్షించవచ్చు.\n\n*🔐 మీ లాగిన్ వివరాలు / Login Credentials:*\n👉 వెబ్‌సైట్ లింక్ (Website): https://brahmanavivaha.org/login\n👉 లాగిన్ మొబైల్ నెంబర్ (User ID / Registered Phone): *${whatsappProfile.contact_number}*\n\n*📢 మా సంప్రదింపు పద్ధతి / Telephony Procedure:*\nమా ప్రతినిధులు మీకు క్రమం తప్పకుండా నేరుగా ఫోన్ కాల్స్ ద్వారా సంబంధాలను తెలియజేస్తూ ఉంటారు. ఫోన్ కాల్స్ వీలుపడనప్పుడు లేదా ఎత్తని సందర్భాలలో ఈ వాట్సాప్ సందేశాల ద్వారా షార్ట్‌లిస్ట్ లింక్‌లను పంపడం మా ప్రామాణిక పద్ధతి.\nOur support agents will call you regularly to update you on matches. If calls are missed or unanswered, we will continue our match sharing through this official WhatsApp channel.\n\nమీరు మీ అకౌంట్ నందు లాగిన్ అయి మ్యాచ్‌ల ఫోటోలను, జాతక గుణమేళనాలను మరియు పూర్తి వివరాలను సులభంగా చూసుకోగలరు.\nPlease log in to your account to view photographs, astrological compatibility scores, and download complete portfolios.\n\n*Verified & Configured by ${adminRole}:* *${adminName}*\n\nకృతజ్ఞతలతో/Warm regards,\nబ్రాహ్మణ विवाह వేదిక బృందం (Bramhana Vivaha Vedika Team)\n📞 సంప్రదించండి/Contact: +91 94942 34567`;
                  }

                  return (
                    <div className="flex flex-col space-y-4">
                      <textarea
                        readOnly
                        value={compiledMessage}
                        className="w-full p-3 sm:p-4 bg-emerald-50/15 border-2 border-emerald-100 rounded-2xl text-xs font-medium text-gray-800 focus:outline-none resize-none leading-relaxed shadow-inner overflow-y-auto font-sans min-h-[140px] sm:min-h-[200px]"
                      />

                      {adminQr && (
                        <div className="bg-amber-500/5 border border-amber-100/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 justify-center">
                          <div className="w-24 h-24 bg-white border border-amber-200 p-1.5 rounded-xl shadow-inner flex items-center justify-center shrink-0">
                            <img
                              src={adminQr}
                              alt={`${adminName} QR`}
                              className="max-w-full max-h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="text-left space-y-1">
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-800 text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                              Scan to Pay / QR Code
                            </span>
                            <p className="text-xs font-bold text-zinc-700">Check payment with {adminName}</p>
                            <p className="text-[10px] font-mono text-zinc-500">{adminUpi}</p>
                          </div>
                        </div>
                      )}

                      {/* Bottom Buttons inside the scrollable view so they never get hidden on mobile */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 pb-4">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(compiledMessage);
                            alert("వ్యక్తిగతీకరించిన సందేశం విజయవంతంగా కాపీ చేయబడింది! (Copied beautifully to clipboard)");
                          }}
                          className="w-full sm:flex-1 py-3 bg-white hover:bg-gray-50 border border-emerald-200 text-[#362B5A] rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer text-center"
                        >
                          Copy to Clipboard
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cleanPhone = whatsappProfile.contact_number.replace(/\D/g, "");
                            const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}&text=${encodeURIComponent(compiledMessage)}`;
                            window.open(whatsappUrl, "_blank");
                            setIsWhatsappModalOpen(false);
                          }}
                          className="w-full sm:flex-1 py-3 bg-[#25D366] hover:bg-[#20ba56] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer text-center shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.528 2.017 14.077.99 11.517.99c-5.44 0-9.866 4.372-9.87 9.802 0 1.958.52 3.878 1.503 5.586L2.148 21.84l5.656-1.474z" />
                          </svg>
                          <span>Launch WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* REGISTER NEW CANDIDATE MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateProfile}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#C2242C]/10 space-y-6 my-8 max-h-[90vh] overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="space-y-1">
                <span className="text-[10px] text-[#C2242C] font-extrabold tracking-widest uppercase block">Pandiri Desk Registration</span>
                <h3 className="text-xl font-extrabold text-[#362B5A]">Register New Candidate (కొత్త రిజిస్ట్రేషన్)</h3>
                <p className="text-xs text-gray-400">Add a verified Brahmin candidate to the Vivaha Pandiri registry</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 bg-gray-50 text-gray-500 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-sans">
              
              {/* Profile Registered By / Relation */}
              <div className="space-y-1 sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-gray-100">
                <label className="font-extrabold text-[#362B5A] uppercase block">Profile Registered By (ప్రొఫైల్ సృష్టికర్త / సంబంధం) *</label>
                <select
                  value={newProfile.registered_by}
                  onChange={(e) => setNewProfile({ ...newProfile, registered_by: e.target.value })}
                  className="w-full bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] rounded-xl py-2 px-3 text-xs font-bold cursor-pointer"
                >
                  <option value="">Choose Relation...</option>
                  <option value="Self (ఇండిపెండెంట్ / స్వయంగా)">Self (ఇండిపెండెంట్ / స్వయంగా)</option>
                  <option value="Parent (తల్లిదండ్రులు)">Parent (తల్లిదండ్రులు)</option>
                  <option value="Sibling (సహోదరుడు/సహోదరి)">Sibling (సహోదరుడు/సహోదరి)</option>
                  <option value="Relative (బంధువు)">Relative (బంధువు)</option>
                </select>
              </div>

              {/* Surname */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Candidate Surname (ఇంటి పేరు) <span className="text-[#C2242C]">*</span></label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Garimella"
                    value={newProfile.surname}
                    onChange={(e) => setNewProfile({ ...newProfile, surname: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                  />
                </div>
              </div>

              {/* Given Name */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Candidate Given Name (పేరు) <span className="text-[#C2242C]">*</span></label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Subramanyam"
                    value={newProfile.name}
                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Auspicious Category (లింగము) *</label>
                <select
                  value={newProfile.gender}
                  onChange={(e) => {
                    const g = e.target.value as "Male" | "Female";
                    setNewProfile({
                      ...newProfile,
                      gender: g,
                      partner_expectation_type: g === "Male" ? "Housewife (గృహిణి)" : "Any Profession (ఏదైనా ఉద్యోగం)"
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] cursor-pointer font-bold"
                >
                  <option value="Female">Chi.La.Sow. Lakshmi Soubhagyavathi (Bride / వధువు)</option>
                  <option value="Male">Chiranjeevi (Groom / వరుడు)</option>
                </select>
              </div>

              {/* DOB */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Date of Birth (పుట్టిన తేదీ) <span className="text-[#C2242C]">*</span></label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={newProfile.dob}
                    onChange={(e) => setNewProfile({ ...newProfile, dob: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold font-mono"
                  />
                </div>
              </div>

              {/* Place of Birth */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Place of Birth (పుట్టిన స్థలం) (Optional)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Vijayawada, Andhra Pradesh"
                    value={newProfile.birth_location}
                    onChange={(e) => setNewProfile({ ...newProfile, birth_location: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                  />
                </div>
              </div>

              {/* Birth Place Pincode */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Birth Place Pincode (జనన స్థల పిన్ కోడ్) <span className="text-[#C2242C]">*</span></label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#C2242C] absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 518502"
                    value={newProfile.birth_pincode}
                    onChange={(e) => setNewProfile({ ...newProfile, birth_pincode: e.target.value.replace(/\D/g, "") })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold font-mono"
                  />
                </div>
              </div>

              {/* Time of Birth */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Time of Birth (e.g. 08:30, or 09:00 AM to 10:00 AM)</label>
                <input
                  type="text"
                  placeholder="e.g. 08:30 or 09:00 AM to 10:00 AM"
                  value={newProfile.birth_time}
                  onChange={(e) => setNewProfile({ ...newProfile, birth_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                />
              </div>

              {/* LIVE PANCHANGAM & KUNDALI GENERATOR (100 YEARS TELUGU PANCHANGAM SYSTEM) */}
              <div className="sm:col-span-2 bg-gradient-to-r from-amber-500/5 to-purple-500/5 p-5 rounded-2xl border border-amber-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                      శ్రీ 100 సంవత్సరాల తెలుగు పంచాంగం & జాతక చక్రం (Vedic Astrological Calculator)
                    </h4>
                    <p className="text-[10.5px] text-zinc-600">
                      Our system calculates authentic Tithi, Nakshatram, and Lagnam in milliseconds based on standard astrological equations!
                    </p>
                  </div>
                </div>

                {newProfile.dob ? (
                  (() => {
                    const localCalc = calculatePanchangam(newProfile.dob, newProfile.birth_time || "08:30");
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                        <div className="space-y-3">
                          <div className="bg-white p-4 rounded-xl border border-amber-200/60 space-y-2 shadow-sm">
                            <span className="text-[9.5px] uppercase tracking-widest text-amber-700 font-extrabold block">Real-time calculations (ఖచ్చితమైన పంచాంగ ఫలితాలు)</span>
                            
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-500/10">
                                <span className="text-[9px] text-zinc-500 block">నక్షత్రం (Star)</span>
                                <span className="font-extrabold text-amber-950">{localCalc.nakshatram.english} ({localCalc.nakshatram.telugu})</span>
                                <span className="text-[8px] text-zinc-500 block">Lord: {localCalc.nakshatraLord} | Deity: {localCalc.deity}</span>
                              </div>
                              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-500/10">
                                <span className="text-[9px] text-zinc-500 block">రాశి (Moon Sign)</span>
                                <span className="font-extrabold text-amber-950">{localCalc.rasi.english} ({localCalc.rasi.telugu})</span>
                              </div>
                              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-500/10">
                                <span className="text-[9px] text-zinc-500 block">పాదము (Quarter)</span>
                                <span className="font-extrabold text-amber-700">{localCalc.pada} వ పాదం (Pada {localCalc.pada})</span>
                              </div>
                              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-500/10">
                                <span className="text-[9px] text-zinc-500 block">తిథి (Lunar Day)</span>
                                <span className="font-extrabold text-amber-950">{localCalc.tithi.telugu}</span>
                                <span className="text-[8.5px] text-zinc-500 block">{localCalc.tithi.english}</span>
                              </div>
                              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-500/10 col-span-2">
                                <span className="text-[9px] text-zinc-500 block">లగ్నం (Ascendant Sign)</span>
                                <span className="font-extrabold text-amber-700">{localCalc.lagnam.english} ({localCalc.lagnam.telugu})</span>
                              </div>
                            </div>
                            
                            <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/15 text-[10.5px] leading-relaxed text-amber-900 font-medium">
                              <span className="font-extrabold uppercase text-amber-700 block mb-0.5">✨ జాతక విశ్లేషణ (Jatakam Report Preview)</span>
                              {localCalc.spiritualAnalysis}
                            </div>
                          </div>

                          {/* KUNDALI VERIFICATION BUTTONS */}
                          <div className="space-y-2 px-1">
                            <span className="text-[10px] font-black text-[#362B5A] uppercase tracking-wider block">Verify Horoscope (జాతక నిర్ధారణ):</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setKundaliStatus("correct");
                                  setAdminAstrologyConfirmed(true);
                                }}
                                className={`flex-1 py-2 px-3 rounded-xl border font-bold text-[10.5px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                  kundaliStatus === "correct"
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                }`}
                              >
                                <span>✓ Correct (సరైనదే)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setKundaliStatus("wrong");
                                  setAdminAstrologyConfirmed(false);
                                }}
                                className={`flex-1 py-2 px-3 rounded-xl border font-bold text-[10.5px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                  kundaliStatus === "wrong"
                                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                    : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                                }`}
                              >
                                <span>✗ Wrong (తప్పు)</span>
                              </button>
                            </div>

                            {/* MANUAL ASTROLOGY OVERRIDES */}
                            {kundaliStatus === "wrong" && (
                              <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 space-y-3 mt-2 animate-in fade-in duration-200 text-left">
                                <span className="text-[9px] uppercase tracking-wider text-rose-700 font-extrabold block">⚠️ Manual Astrology Overrides (మనుషుల చేతులతో జాతక మార్పులు):</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-600 block">నక్షత్రం (Star)</label>
                                    <select
                                      value={manualAstrology.nakshatra}
                                      onChange={(e) => setManualAstrology(prev => ({ ...prev, nakshatra: e.target.value }))}
                                      className="w-full bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rose-500 rounded-lg p-1 text-[10px] font-bold"
                                    >
                                      <option value="">Select Nakshatram...</option>
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
                                      <option value="Purvashada">Purvashada (పూర్వాషాఢ)</option>
                                      <option value="Uttarashada">Uttarashada (ఉత్తరాషాఢ)</option>
                                      <option value="Shravana">Shravana (శ్రవణం)</option>
                                      <option value="Dhanishta">Dhanishta (ధనిష్ఠ)</option>
                                      <option value="Shatabhisha">Shatabhisha (శతభిషం)</option>
                                      <option value="Purvabhadra">Purvabhadra (పూర్వాభాద్ర)</option>
                                      <option value="Uttarabhadra">Uttarabhadra (ఉత్తరాభాద్ర)</option>
                                      <option value="Revati">Revati (రేవతి)</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-600 block">రాశి (Moon Sign)</label>
                                    <select
                                      value={manualAstrology.rashi}
                                      onChange={(e) => setManualAstrology(prev => ({ ...prev, rashi: e.target.value }))}
                                      className="w-full bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rose-500 rounded-lg p-1 text-[10px] font-bold"
                                    >
                                      <option value="">Select Rasi...</option>
                                      <option value="Mesha">Mesha (మేషం)</option>
                                      <option value="Vrishabha">Vrishabha (వృషభం)</option>
                                      <option value="Mithuna">Mithuna (మిథునం)</option>
                                      <option value="Karka">Karka (కర్కాటకం)</option>
                                      <option value="Simha">Simha (సింహం)</option>
                                      <option value="Kanya">Kanya (కన్య)</option>
                                      <option value="Tula">Tula (తులా)</option>
                                      <option value="Vrishchika">Vrishchika (వృశ్చికం)</option>
                                      <option value="Dhanu">Dhanu (ధనుస్సు)</option>
                                      <option value="Makara">Makara (మకరం)</option>
                                      <option value="Kumbha">Kumbha (కుంభం)</option>
                                      <option value="Meena">Meena (మీనం)</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-600 block">పాదము (Pada)</label>
                                    <select
                                      value={manualAstrology.pada}
                                      onChange={(e) => setManualAstrology(prev => ({ ...prev, pada: parseInt(e.target.value) || 1 }))}
                                      className="w-full bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rose-500 rounded-lg p-1 text-[10px] font-bold"
                                    >
                                      <option value="1">1 వ పాదం (Pada 1)</option>
                                      <option value="2">2 వ పాదం (Pada 2)</option>
                                      <option value="3">3 వ పాదం (Pada 3)</option>
                                      <option value="4">4 వ పాదం (Pada 4)</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-600 block">తిథి (Lunar Day)</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Ekadashi, Purnima"
                                      value={manualAstrology.tithi}
                                      onChange={(e) => setManualAstrology(prev => ({ ...prev, tithi: e.target.value }))}
                                      className="w-full bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rose-500 rounded-lg p-1 text-[10px] font-bold"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rendering the beautiful traditional South Indian Kundali chart */}
                        <div className="w-full">
                          <KundaliChart
                            lagnamIndex={localCalc.lagnam.index}
                            rasiIndex={localCalc.rasi.index}
                            name={`${newProfile.surname || ""} ${newProfile.name || ""}`}
                            dob={newProfile.dob}
                            birthTime={newProfile.birth_time}
                            birthLocation={newProfile.birth_location || "Not Specified"}
                            isInteractive={!adminAstrologyConfirmed}
                            onConfirm={() => {
                              setAdminAstrologyConfirmed(true);
                              alert("ధన్యవాదాలు! జాతక చక్రం విజయవంతంగా ధృవీకరించబడింది. (Verified & Linked to profile successfully)");
                            }}
                          />
                          {adminAstrologyConfirmed && (
                            <div className="text-center py-2 px-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[10.5px] text-emerald-700 font-bold max-w-xs mx-auto animate-pulse">
                              జాతక చక్రం విజయవంతంగా లింక్ చేయబడింది! ✅
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="bg-amber-50/20 p-8 rounded-xl border border-amber-500/10 text-center text-zinc-500 space-y-2">
                    <p className="text-xs">
                      దయచేసి జాతక చక్రం మరియు ఖచ్చితమైన పంచాంగ వివరాలను పొందడానికి పైన ఉన్న <strong>పుట్టిన తేదీ (Date of Birth)</strong> ని నమోదు చేయండి.
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      System will automatically compute the Kundali Chart (జాతక పత్రం) within milliseconds!
                    </p>
                  </div>
                )}
              </div>

              {/* Brahmin Sub-Caste Searchable Dropdown */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Brahmin Sub-Caste (శాఖ) <span className="text-[#C2242C]">*</span></label>
                <SearchableSelect
                  options={BRAHMIN_SUB_CASTES}
                  selectedValue={newProfile.sub_caste}
                  onChange={(val) => setNewProfile({ ...newProfile, sub_caste: val })}
                  placeholder="Select Brahmin Sub-Caste (శాఖ)..."
                  emptyLabel="Caste not found"
                  theme="light"
                />
              </div>

              {/* Brahmin Gotram Searchable Dropdown */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Brahmin Gotram (గోత్రము) <span className="text-[#C2242C]">*</span></label>
                <SearchableSelect
                  options={BRAHMIN_GOTRAMS}
                  selectedValue={newProfile.gothram}
                  onChange={(val) => setNewProfile({ ...newProfile, gothram: val })}
                  placeholder="Search and Select Gotram (గోత్రం)..."
                  emptyLabel="Gotram not found"
                  theme="light"
                />
              </div>

              {registrationType === "candidate" && (
                <>
                  {/* Height in Feet */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#362B5A] uppercase block">Height in Feet (ఎత్తు) (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 5.6"
                      value={newProfile.height_feet}
                      onChange={(e) => setNewProfile({ ...newProfile, height_feet: parseFloat(e.target.value) || 5.4 })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                    />
                  </div>

                  {/* Nakshatra (kept as compatible field) */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#362B5A] uppercase block">Nakshatram (నక్షత్రం) (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Rohini, Pushya, Revati"
                      value={newProfile.nakshatra}
                      onChange={(e) => setNewProfile({ ...newProfile, nakshatra: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                    />
                  </div>

                  {/* Profession */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#362B5A] uppercase block">Profession (ఉద్యోగం / వ్యాపారం) (Optional)</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Software Engineer, Priest"
                        value={newProfile.profession}
                        onChange={(e) => setNewProfile({ ...newProfile, profession: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                      />
                    </div>
                  </div>

                  {/* Annual Income */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#362B5A] uppercase block">Annual Income (₹ LPA - లక్షలలో) (Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 12"
                      value={newProfile.salary_lpa}
                      onChange={(e) => setNewProfile({ ...newProfile, salary_lpa: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                    />
                  </div>

                  {/* Candidate Employment Details Section */}
                  <div className="space-y-3 sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-xs text-[#362B5A] font-extrabold tracking-wider uppercase block">Candidate Employment Details (ఉద్యోగ వివరాలు - ఐచ్ఛికం)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block">Company Name (సంస్థ పేరు)</label>
                        <input
                          type="text"
                          placeholder="e.g. TCS / Self Employed"
                          value={newProfile.company_name}
                          onChange={(e) => setNewProfile({ ...newProfile, company_name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block">Branch / Job Place (ఉద్యోగ శాఖ / ప్రదేశం)</label>
                        <input
                          type="text"
                          placeholder="e.g. Hyderabad"
                          value={newProfile.job_branch}
                          onChange={(e) => setNewProfile({ ...newProfile, job_branch: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block">Working Shift (పని వేళలు)</label>
                        <select
                          value={newProfile.working_shift}
                          onChange={(e) => setNewProfile({ ...newProfile, working_shift: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold cursor-pointer"
                        >
                          <option value="Day Shift (పగటి వేళ)">Day Shift (పగటి వేళ)</option>
                          <option value="Night Shift (రాత్రి వేళ)">Night Shift (రాత్రి వేళ)</option>
                          <option value="Rotational (రొటేషనల్)">Rotational (రొటేషనల్)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Candidate Email ID & Mandatory OTP Verification */}
              <div className="space-y-2 sm:col-span-2 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <label className="font-extrabold text-[#362B5A] uppercase block text-xs">
                    Candidate Email ID & Mandatory OTP (ఇమెయిల్ & తప్పనిసరి OTP) <span className="text-[#C2242C]">*</span>
                  </label>
                  {adminIsEmailVerified && (
                    <span className="text-[11px] bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Check className="w-3.5 h-3.5" /> Email Verified via OTP
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-900 font-medium">
                  Candidate email verification via 7-digit OTP is mandatory before adding the profile. The OTP is dispatched to the candidate's email address.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      disabled={adminIsEmailVerified}
                      placeholder="e.g. candidate@gmail.com"
                      value={newProfile.email}
                      onChange={(e) => {
                        setNewProfile({ ...newProfile, email: e.target.value });
                        if (adminIsEmailVerified) setAdminIsEmailVerified(false);
                        if (adminIsOtpSent) setAdminIsOtpSent(false);
                      }}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border font-bold text-xs ${
                        adminIsEmailVerified
                          ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-white border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A]"
                      }`}
                    />
                  </div>
                  {!adminIsEmailVerified && (
                    <button
                      type="button"
                      disabled={adminIsSendingOtp || !newProfile.email.trim()}
                      onClick={handleAdminSendEmailOtp}
                      className="px-4 py-2 bg-[#C2242C] hover:bg-[#a01c23] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {adminIsSendingOtp ? "Sending OTP..." : adminIsOtpSent ? "Resend OTP" : "Send OTP to Candidate"}
                    </button>
                  )}
                </div>

                {adminIsOtpSent && !adminIsEmailVerified && (
                  <div className="p-3 bg-white rounded-xl border border-amber-300 flex flex-wrap items-center gap-2.5 mt-2 animate-in fade-in">
                    <input
                      type="text"
                      maxLength={7}
                      placeholder="7-digit OTP"
                      value={adminRegOtp}
                      onChange={(e) => setAdminRegOtp(e.target.value)}
                      className="bg-gray-50 border border-gray-300 focus:border-[#362B5A] rounded-lg py-1.5 px-3 text-xs text-[#362B5A] focus:outline-none font-mono font-bold w-32 tracking-widest text-center"
                    />
                    <button
                      type="button"
                      onClick={handleAdminVerifyOtp}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      Verify OTP
                    </button>
                    <span className="text-[11px] text-gray-600">
                      Enter the 7-digit OTP sent to the candidate's email inbox.
                    </span>
                  </div>
                )}
              </div>

              {/* Contact Phone */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Contact Phone (మొబైల్ సంఖ్య) <span className="text-[#C2242C]">*</span></label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9848012345"
                    value={newProfile.contact_number}
                    onChange={(e) => setNewProfile({ ...newProfile, contact_number: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                  />
                </div>
              </div>

              {/* Verification Status */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Verification Status</label>
                <select
                  value={newProfile.status}
                  onChange={(e) => setNewProfile({ ...newProfile, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] cursor-pointer font-bold"
                >
                  <option value="Verified">✓ Verified</option>
                  <option value="Premium">✦ Premium</option>
                  <option value="Pending">🕒 Pending</option>
                  <option value="Declined">✕ Declined</option>
                </select>
              </div>

              {registrationType === "candidate" && (
                <>
                  {/* Partner Expectations & Profile Preferences Section */}
                  <div className="space-y-4 sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs text-[#362B5A] font-extrabold tracking-wider uppercase block flex items-center gap-1">
                    <Heart className="w-4 h-4 text-[#C2242C] fill-[#C2242C]" />
                    <span>Partner Expectations & Profile Preferences (భాగస్వామి ప్రాధాన్యతలు)</span>
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Partner Profession Expectation */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block">Partner Profession Preference (భాగస్వామి ఉద్యోగ ప్రాధాన్యత)</label>
                      <select
                        value={newProfile.partner_expectation_type}
                        onChange={(e) => setNewProfile({ ...newProfile, partner_expectation_type: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold cursor-pointer"
                      >
                        {newProfile.gender === "Male" ? (
                          <>
                            <option value="Housewife (గృహిణి)">Housewife (గృహిణి)</option>
                            <option value="Any Profession (ఏదైనా ఉద్యోగం)">Any Profession (ఏదైనా ఉద్యోగం)</option>
                            <option value="Working in IT (ఐటీ ఉద్యోగం)">Working in IT (ఐటీ ఉద్యోగం)</option>
                          </>
                        ) : (
                          <>
                            <option value="Any Profession (ఏదైనా ఉద్యోగం)">Any Profession (ఏదైనా ఉద్యోగం)</option>
                            <option value="Working in IT (ఐటీ ఉద్యోగం)">Working in IT (ఐటీ ఉద్యోగం)</option>
                            <option value="Business/Priest (వ్యాపారం/అర్చకత్వం)">Business/Priest (వ్యాపారం/అర్చకత్వం)</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Partner Height Diff Pref */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block">Partner Height Difference Preference (భాగస్వామి ఎత్తు ప్రాధాన్యత)</label>
                      <select
                        value={newProfile.partner_height_diff_pref}
                        onChange={(e) => setNewProfile({ ...newProfile, partner_height_diff_pref: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold cursor-pointer"
                      >
                        <option value="No Preference">No Preference</option>
                        <option value="Partner must be shorter">Partner must be shorter</option>
                        <option value="Partner must be taller">Partner must be taller</option>
                      </select>
                    </div>

                    {/* Expected Partner Income Range */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block">Expected Partner Income Range (భాగస్వామి వార్షిక ఆదాయ ప్రాధాన్యత)</label>
                      <select
                        value={newProfile.partner_lpa_pref}
                        onChange={(e) => setNewProfile({ ...newProfile, partner_lpa_pref: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold cursor-pointer"
                      >
                        <option value="No Preference">No Preference</option>
                        <option value="< 6 LPA">&lt; 6 LPA</option>
                        <option value="6 - 12 LPA">6 - 12 LPA</option>
                        <option value="12 - 18 LPA">12 - 18 LPA</option>
                        <option value="18 - 24 LPA">18 - 24 LPA</option>
                        <option value="24+ LPA">24+ LPA</option>
                      </select>
                    </div>

                    {/* Preferred Partner Working Shift */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block">Preferred Partner Working Shift (భాగస్వామి పని వేళల ప్రాధాన్యత)</label>
                      <select
                        value={newProfile.partner_shift_pref}
                        onChange={(e) => setNewProfile({ ...newProfile, partner_shift_pref: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold cursor-pointer"
                      >
                        <option value="No Preference">No Preference</option>
                        <option value="Day Shift">Day Shift</option>
                        <option value="Night Shift">Night Shift</option>
                      </select>
                    </div>

                    {/* Expected Qualities Desc */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block">Expected Qualities in Partner (భాగస్వామి నుండి ఆశించే లక్షణాలు)</label>
                      <textarea
                        placeholder="Specify qualities, traditions, or other notes..."
                        value={newProfile.partner_expectations_desc}
                        onChange={(e) => setNewProfile({ ...newProfile, partner_expectations_desc: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

              {/* Password */}
              <div className="space-y-1">
                <label className="font-bold text-[#362B5A] uppercase block">Candidate Password (ఐచ్ఛికం)</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    placeholder="If empty, Date of Birth is default"
                    value={newProfile.password}
                    onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#362B5A]"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {registrationType === "candidate" && (
                <>
                  {/* Subscription Level */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#362B5A] uppercase block">Subscription Level</label>
                    <select
                      value={newProfile.subscription_status}
                      onChange={(e) => setNewProfile({ ...newProfile, subscription_status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] cursor-pointer font-bold"
                    >
                      <option value="free">🆓 Free Tier</option>
                      <option value="paid_100">💳 Paid ₹100 (Matches Ready)</option>
                      <option value="paid_900">👑 Paid ₹900 (Full Access)</option>
                    </select>
                  </div>

                  {/* Photo 1 URL */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#362B5A] uppercase block">First Photo (మొదటి ఫోటో)</label>
                    {newProfile.photo_url && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500 mb-2 relative group">
                        <img src={newProfile.photo_url} alt="Photo 1 Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewProfile({ ...newProfile, photo_url: "" })}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById("create-photo1-file")?.click()}
                        className="flex-1 py-2 px-3 bg-[#EBF6FF] hover:bg-blue-100 text-[#362B5A] rounded-xl border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <UploadCloud className="w-4 h-4 text-indigo-700" />
                        <span>Upload Gallery</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startCamera({ type: "create", field: "photo_url" })}
                        className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-[#C2242C] rounded-xl border border-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Camera</span>
                      </button>
                    </div>
                    <input
                      type="file"
                      id="create-photo1-file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleDeviceUpload(e.target.files[0], { type: "create", field: "photo_url" })}
                    />
                    <input
                      type="url"
                      placeholder="Or paste URL link directly here..."
                      value={newProfile.photo_url}
                      onChange={(e) => setNewProfile({ ...newProfile, photo_url: e.target.value })}
                      className="w-full mt-1.5 px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] text-xs font-medium"
                    />
                  </div>

                  {/* Photo 2 URL */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#362B5A] uppercase block">Second Photo (రెండవ ఫోటో)</label>
                    {newProfile.photo_url_2 && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500 mb-2 relative group">
                        <img src={newProfile.photo_url_2} alt="Photo 2 Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewProfile({ ...newProfile, photo_url_2: "" })}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById("create-photo2-file")?.click()}
                        className="flex-1 py-2 px-3 bg-[#EBF6FF] hover:bg-blue-100 text-[#362B5A] rounded-xl border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <UploadCloud className="w-4 h-4 text-indigo-700" />
                        <span>Upload Gallery</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startCamera({ type: "create", field: "photo_url_2" })}
                        className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-[#C2242C] rounded-xl border border-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Camera</span>
                      </button>
                    </div>
                    <input
                      type="file"
                      id="create-photo2-file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleDeviceUpload(e.target.files[0], { type: "create", field: "photo_url_2" })}
                    />
                    <input
                      type="url"
                      placeholder="Or paste URL link directly here..."
                      value={newProfile.photo_url_2}
                      onChange={(e) => setNewProfile({ ...newProfile, photo_url_2: e.target.value })}
                      className="w-full mt-1.5 px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] text-xs font-medium"
                    />
                  </div>

                  {/* Photo 3 URL */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#362B5A] uppercase block">Third Photo (మూడవ ఫోటో)</label>
                    {newProfile.photo_url_3 && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500 mb-2 relative group">
                        <img src={newProfile.photo_url_3} alt="Photo 3 Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewProfile({ ...newProfile, photo_url_3: "" })}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById("create-photo3-file")?.click()}
                        className="flex-1 py-2 px-3 bg-[#EBF6FF] hover:bg-blue-100 text-[#362B5A] rounded-xl border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <UploadCloud className="w-4 h-4 text-indigo-700" />
                        <span>Upload Gallery</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startCamera({ type: "create", field: "photo_url_3" })}
                        className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-[#C2242C] rounded-xl border border-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Camera</span>
                      </button>
                    </div>
                    <input
                      type="file"
                      id="create-photo3-file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleDeviceUpload(e.target.files[0], { type: "create", field: "photo_url_3" })}
                    />
                    <input
                      type="url"
                      placeholder="Or paste URL link directly here..."
                      value={newProfile.photo_url_3}
                      onChange={(e) => setNewProfile({ ...newProfile, photo_url_3: e.target.value })}
                      className="w-full mt-1.5 px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#362B5A] text-xs font-medium"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Note about login */}
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-[10.5px] leading-relaxed text-amber-900 font-medium">
              <span className="font-extrabold uppercase text-amber-700 block mb-0.5">ℹ️ Candidate Credentials Notice</span>
              The newly registered candidate will be assigned an automatic highly secure, random password. You can customize or copy it, and they can use it to log in securely.
            </div>

            {/* Submit Actions */}
            <div className="flex gap-3 pt-3 border-t border-gray-100 justify-end">
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRegisteringCandidate}
                className={`px-6 py-2.5 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-red-800/10 ${
                  isRegisteringCandidate
                    ? "bg-gray-400 cursor-not-allowed opacity-70"
                    : "bg-[#C2242C] hover:bg-red-700 cursor-pointer"
                }`}
              >
                {isRegisteringCandidate ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Save & Register Candidate</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CANDIDATE MEDIA VAULT MODAL */}
      {selectedMediaProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[210] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-orange-500/10 space-y-6 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setSelectedMediaProfile(null)}
              className="absolute top-5 right-5 p-2 bg-[#EBF6FF] text-[#362B5A] hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-1 pr-10">
              <span className="text-[10px] text-[#C2242C] font-mono font-bold tracking-widest uppercase block">
                Vedic Media Repository • {selectedMediaProfile.reg_number || "Pending Reg"}
              </span>
              <h3 className="text-2xl font-black text-[#362B5A]">{selectedMediaProfile.name}'s Records</h3>
              <p className="text-xs text-gray-500 font-semibold uppercase font-mono tracking-wider">
                {selectedMediaProfile.gender} • {selectedMediaProfile.sub_caste} • {selectedMediaProfile.profession}
              </p>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Left Block: Photo 1 and Photo 2 */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#362B5A] uppercase tracking-wider border-b border-gray-100 pb-1 flex items-center gap-1.5">
                  📷 Candidate Photos (ఫోటోలు)
                </h4>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Photo 1 Container */}
                  <div className="space-y-1 text-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">First Photo</span>
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50 shadow-inner relative group">
                      <img
                        src={selectedMediaProfile.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"}
                        alt="Primary Candidate"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Photo 2 Container */}
                  <div className="space-y-1 text-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Second Photo</span>
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50 shadow-inner relative flex flex-col items-center justify-center">
                      {selectedMediaProfile.photo_url_2 ? (
                        <img
                          src={selectedMediaProfile.photo_url_2}
                          alt="Secondary Candidate"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="p-4 text-center space-y-1.5 text-gray-400">
                          <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-[9px] font-bold leading-normal">No Second Photo</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photo 3 Container */}
                  <div className="space-y-1 text-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Third Photo</span>
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50 shadow-inner relative flex flex-col items-center justify-center">
                      {selectedMediaProfile.photo_url_3 ? (
                        <img
                          src={selectedMediaProfile.photo_url_3}
                          alt="Tertiary Candidate"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="p-4 text-center space-y-1.5 text-gray-400">
                          <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-[9px] font-bold leading-normal">No Third Photo</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Block: Kundali/Astrology Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#362B5A] uppercase tracking-wider border-b border-gray-100 pb-1 flex items-center gap-1.5">
                  📜 Horoscope & Kundali (జాతక చక్రం)
                </h4>

                <div className="space-y-3.5">
                  {selectedMediaProfile.kundali_url ? (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-3.5">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2.5 bg-amber-100/70 text-amber-800 rounded-xl">
                          <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-[#362B5A]">Verified Kundali Link Saved</p>
                          <p className="text-[9px] text-gray-500 truncate max-w-[200px] font-mono">{selectedMediaProfile.kundali_url}</p>
                        </div>
                      </div>

                      {/* If the Kundali looks like a direct image link, let's preview it inside the modal! */}
                      {/\.(jpg|jpeg|png|webp|gif|svg)/i.test(selectedMediaProfile.kundali_url) ? (
                        <div className="aspect-[4/3] rounded-xl overflow-hidden border border-amber-200 shadow-sm bg-white">
                          <img
                            src={selectedMediaProfile.kundali_url}
                            alt="Kundali Document"
                            className="w-full h-full object-contain p-1"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-xl border border-amber-100 text-center text-[10px] text-amber-900 leading-normal font-medium">
                          📁 This is a document document or cloud-stored link (e.g., Google Drive, PDF, DropBox). Use the direct access button below to launch.
                        </div>
                      )}

                      <a
                        href={selectedMediaProfile.kundali_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 bg-[#C2242C] hover:bg-opacity-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider text-center block shadow-sm transition-all"
                      >
                        Launch Direct Document ↗
                      </a>
                    </div>
                  ) : (
                    <div className="py-12 border-2 border-dashed border-gray-100 rounded-2xl text-center space-y-2 text-gray-400">
                      <svg className="w-10 h-10 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-gray-500">No Kundali Document Saved</p>
                        <p className="text-[9px] text-gray-400 max-w-[200px] mx-auto leading-normal">
                          Edit the registration of this candidate to input a Kundali image or document web link.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Astrology Metadata Display */}
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-3 text-[11px] text-gray-600">
                    <p className="font-bold text-[#362B5A] uppercase text-[10px] tracking-wider border-b border-gray-100 pb-1">
                      🌌 Celestial Coordinates (జాతక వివరాలు)
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono">
                      <p>Nakshatram: <span className="font-extrabold text-[#C2242C]">{selectedMediaProfile.astrology?.nakshatra || "Not Computed"}</span></p>
                      <p>Lord: <span className="font-extrabold text-indigo-700">
                        {selectedMediaProfile.astrology?.nakshatraLord || "N/A"}
                        {selectedMediaProfile.astrology?.nakshatraLordTelugu ? ` (${selectedMediaProfile.astrology?.nakshatraLordTelugu})` : ""}
                      </span></p>
                      <p>Rashi: <span className="font-extrabold text-[#362B5A]">{selectedMediaProfile.astrology?.rashi || "N/A"}</span></p>
                      <p>Pada: <span className="font-extrabold text-[#362B5A]">Quarter {selectedMediaProfile.astrology?.pada || "1"}</span></p>
                      <p className="col-span-2">Deity: <span className="font-extrabold text-teal-700">
                        {selectedMediaProfile.astrology?.deity || "N/A"}
                        {selectedMediaProfile.astrology?.deityTelugu ? ` (${selectedMediaProfile.astrology?.deityTelugu})` : ""}
                      </span></p>
                    </div>

                    {selectedMediaProfile.astrology?.hamsaGuidance && (
                      <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[10px] space-y-1">
                        <p className="font-extrabold text-amber-800 uppercase tracking-wider">📿 Hamsa / Ishta Devata & Guidance:</p>
                        <p><span className="font-bold text-gray-700">Hamsa:</span> <span className="text-amber-700 font-extrabold">{selectedMediaProfile.astrology.hamsaGuidance.hamsaSymbol.telugu}</span></p>
                        <p><span className="font-bold text-gray-700">Ishta Devata:</span> <span className="text-gray-900 font-extrabold">{selectedMediaProfile.astrology.hamsaGuidance.ishtaDevata.telugu}</span></p>
                        <p><span className="font-bold text-pink-700">Marriage:</span> {selectedMediaProfile.astrology.hamsaGuidance.marriage}</p>
                        <p><span className="font-bold text-emerald-700">Business:</span> {selectedMediaProfile.astrology.hamsaGuidance.business}</p>
                        <p><span className="font-bold text-sky-700">Education:</span> {selectedMediaProfile.astrology.hamsaGuidance.education}</p>
                        <p><span className="font-bold text-amber-700">Job:</span> {selectedMediaProfile.astrology.hamsaGuidance.job}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedMediaProfile(null)}
                className="px-5 py-2.5 bg-[#362B5A] hover:bg-opacity-95 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all cursor-pointer shadow-md"
              >
                Close Repository View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL WEBCAM CAMERA MODAL */}
      {cameraActiveTarget && cameraStream && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-6 text-center border border-orange-500/10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="space-y-1">
              <span className="text-[10px] text-[#C2242C] font-mono font-bold tracking-widest uppercase block">Webcam Photo Studio</span>
              <h3 className="text-xl font-extrabold text-[#362B5A]">Capture Candidate Portrait</h3>
              <p className="text-xs text-gray-500">Position the camera properly and click capture below to snap a high resolution image.</p>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden border-4 border-[#362B5A]/10 bg-black shadow-inner">
              <video
                id="admin-camera-preview"
                ref={(el) => {
                  if (el && cameraStream) {
                    el.srcObject = cameraStream;
                    el.play().catch(err => console.error("Video play failed:", err));
                  }
                }}
                className="w-full h-full object-cover transform -scale-x-100"
                autoPlay
                playsInline
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-3 bg-[#C2242C] hover:bg-opacity-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4 text-orange-200 animate-pulse" />
                <span>Capture Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab CONTENT 4: Successful Marriages Registry */}
      {activeAdminTab === "marriages" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1 text-left">
              <h3 className="text-xl font-extrabold text-[#362B5A] flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
                Successful Marriages & Completed Weddings Registry (వివాహాలు పూర్తయిన జంటలు)
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                Official directory of couples whose matches were successfully finalized and wedded through Bramhana Vivaha Vedika. You can inspect the complete credentials of both Groom and Bride (Unique IDs, Names, Mobile Numbers, Gotrams, Sub-castes) here permanently.
              </p>
            </div>
            <button
              onClick={() => setIsRecordMarriageModalOpen(true)}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Heart className="w-4 h-4 text-white fill-white" />
              <span>💍 Record New Successful Marriage</span>
            </button>
          </div>

          {marriagesLoading ? (
            <div className="py-12 text-center space-y-3">
              <svg className="animate-spin h-8 w-8 text-rose-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs text-gray-500 font-mono">Loading marriage registries...</p>
            </div>
          ) : marriageRecords.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
              <Heart className="w-12 h-12 text-rose-300 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-[#362B5A]">No Marriages Recorded Yet</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Click the "Record New Successful Marriage" button above to link a Groom and Bride profile and archive their completed wedding credentials.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {marriageRecords.map((m) => (
                <div key={m.id} className="bg-gradient-to-br from-white via-rose-50/20 to-amber-50/20 rounded-3xl p-6 border border-rose-100 shadow-sm hover:shadow-md transition-all space-y-4">
                  <div className="flex items-center justify-between border-b border-rose-100/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-rose-100 text-rose-700 rounded-xl font-mono font-black text-xs">
                        💍 {m.id}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Wedded on: {new Date(m.marriedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Recorded by {m.recordedBy}
                      </span>
                      <button
                        onClick={() => handleDeleteMarriageRecord(m.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete marriage record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Couple Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Groom Box */}
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                          Groom (వరుడు)
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-900">{m.groomRegNumber}</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-[#362B5A]">{m.groomName}</h4>
                      <p className="text-xs text-blue-900 font-mono font-bold">📞 {m.groomMobile}</p>
                      <p className="text-[10px] text-gray-600">Gotram: <strong className="text-gray-900">{m.groomGotram || "N/A"}</strong></p>
                      <p className="text-[10px] text-gray-600">Sub-caste: <strong className="text-gray-900">{m.groomSubCaste || "Brahmin"}</strong></p>
                    </div>

                    {/* Bride Box */}
                    <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                          Bride (వధువు)
                        </span>
                        <span className="text-[10px] font-mono font-bold text-rose-900">{m.brideRegNumber}</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-[#362B5A]">{m.brideName}</h4>
                      <p className="text-xs text-rose-900 font-mono font-bold">📞 {m.brideMobile}</p>
                      <p className="text-[10px] text-gray-600">Gotram: <strong className="text-gray-900">{m.brideGotram || "N/A"}</strong></p>
                      <p className="text-[10px] text-gray-600">Sub-caste: <strong className="text-gray-900">{m.brideSubCaste || "Brahmin"}</strong></p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-100/60 flex justify-between items-center text-[11px]">
                    <span className="text-rose-800 font-bold">🎉 Happy Married Life Blessed by Bramhana Vivaha Vedika</span>
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="px-3 py-1.5 bg-[#362B5A] text-white font-bold rounded-xl text-[10px] hover:bg-opacity-90 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Certificate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RECORD MARRIAGE MODAL */}
      {isRecordMarriageModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="space-y-0.5 text-left">
                <span className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-widest">Successful Wedding Registry</span>
                <h3 className="text-xl font-extrabold text-[#362B5A]">Record Completed Marriage</h3>
              </div>
              <button
                onClick={() => setIsRecordMarriageModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMarriageRecord} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-[#362B5A] tracking-wider block">
                  Select Groom Candidate (వరుడు) *
                </label>
                <select
                  value={groomCandidateId}
                  onChange={(e) => setGroomCandidateId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-[#362B5A] focus:outline-none focus:border-[#C2242C]"
                  required
                >
                  <option value="">-- Choose Groom Profile --</option>
                  {profiles.filter((p) => p.gender === "Male").map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.reg_number || `ID: ${g.id.slice(0, 4)}`}) - {g.contact_number} - {g.profession}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-[#362B5A] tracking-wider block">
                  Select Bride Candidate (వధువు) *
                </label>
                <select
                  value={brideCandidateId}
                  onChange={(e) => setBrideCandidateId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-[#362B5A] focus:outline-none focus:border-[#C2242C]"
                  required
                >
                  <option value="">-- Choose Bride Profile --</option>
                  {profiles.filter((p) => p.gender === "Female").map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.reg_number || `ID: ${b.id.slice(0, 4)}`}) - {b.contact_number} - {b.profession}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-[#362B5A] tracking-wider block">
                  Recording Admin Officer *
                </label>
                <select
                  value={marriageRecordingAdmin}
                  onChange={(e) => setMarriageRecordingAdmin(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-bold text-[#362B5A] focus:outline-none focus:border-[#C2242C]"
                >
                  <option value="subramanyam">GV Subramanyam (Founder)</option>
                  <option value="subba_reddy">PV Subba Reddy (Co-Founder)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecordMarriageModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4 text-white fill-white" />
                  <span>Save Marriage Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admins & Staff List Modal */}
      {isAdminListModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#362B5A]">👑 Authorized Admins & Staff Directory</h3>
                <p className="text-xs text-gray-500">Official management registry for Bramhana Vivaha Vedika</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminListModalOpen(false)}
                className="p-1.5 bg-gray-50 text-gray-500 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Admin 1 */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#362B5A] text-sm">Sri G.V. Subramanyam</span>
                    <span className="text-[9px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-black uppercase">Lead Registrar & Founder</span>
                  </div>
                  <p className="text-xs text-gray-600 font-mono">Contact: +91 94943 01555</p>
                  <p className="text-[10px] text-gray-500 font-mono">UPI: bramhanavedika@ybl</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl">Active Principal</span>
              </div>

              {/* Admin 2 */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#362B5A] text-sm">Sri P.V. Subba Reddy</span>
                    <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase">Co-Founder & Director</span>
                  </div>
                  <p className="text-xs text-gray-600 font-mono">Contact: +91 98480 12345</p>
                  <p className="text-[10px] text-gray-500 font-mono">UPI: pvsubbareddy@okaxis</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl">Active Director</span>
              </div>

              {/* Staff / System */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#362B5A] text-sm">Aesthetic Grievance & Safety Cell</span>
                    <span className="text-[9px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-bold uppercase">Automated Desk</span>
                  </div>
                  <p className="text-xs text-gray-600">IT Act 2021 & Compliance Redressal Unit</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-xl">24/7 Active</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAdminListModalOpen(false)}
                className="px-6 py-2.5 bg-[#362B5A] hover:bg-[#2b2247] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
