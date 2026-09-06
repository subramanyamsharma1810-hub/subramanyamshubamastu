import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle, Image, ShieldCheck, AlertCircle, Trash2, HelpCircle, Camera } from "lucide-react";
import { Profile } from "../types";
import { databaseService } from "../lib/databaseService";

interface UploadCenterProps {
  currentProfile: Profile;
  onUpdateProfile: (profile: Profile) => Promise<void>;
}

export default function UploadCenter({ currentProfile, onUpdateProfile }: UploadCenterProps) {
  const [photoUploading, setPhotoUploading] = useState(false);
  const [kundaliUploading, setKundaliUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(currentProfile.photo_url);
  const [kundaliUrl, setKundaliUrl] = useState<string | undefined>(currentProfile.kundali_url);
  const [photoFileName, setPhotoFileName] = useState("");
  const [kundaliFileName, setKundaliFileName] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // Camera capture state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setCameraStream(stream);
      setCameraActive(true);
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
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    const video = document.getElementById("user-camera-preview") as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        
        try {
          setPhotoUploading(true);
          setPhotoFileName("captured_selfie.jpg");
          
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], "captured_selfie.jpg", { type: "image/jpeg" });
          
          const uploadedUrl = await databaseService.uploadFile(file, "user-uploads", currentProfile.id || "temp-user");
          
          const updatedProfile: Profile = {
            ...currentProfile,
            photo_url: uploadedUrl
          };
          setPhotoUrl(uploadedUrl);
          await onUpdateProfile(updatedProfile);
          setStatusMsg("Beautiful selfie captured and uploaded to the sacred repository!");
        } catch (err) {
          console.error("Camera upload failed:", err);
          alert("Failed to save snapshot.");
        } finally {
          setPhotoUploading(false);
        }
      }
    }
    stopCamera();
  };

  const photoInputRef = useRef<HTMLInputElement>(null);
  const kundaliInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, type: "photo" | "kundali") => {
    if (type === "photo") {
      setPhotoUploading(true);
      setPhotoFileName(file.name);
    } else {
      setKundaliUploading(true);
      setKundaliFileName(file.name);
    }
    setStatusMsg("");

    try {
      // Perform upload (real Supabase bucket 'user-uploads' or base64 simulation)
      const uploadedUrl = await databaseService.uploadFile(file, "user-uploads", currentProfile.id || "temp-user");

      const updatedProfile: Profile = {
        ...currentProfile,
      };

      if (type === "photo") {
        updatedProfile.photo_url = uploadedUrl;
        setPhotoUrl(uploadedUrl);
      } else {
        updatedProfile.kundali_url = uploadedUrl;
        setKundaliUrl(uploadedUrl);
      }

      await onUpdateProfile(updatedProfile);
      setStatusMsg(`Successfully uploaded ${file.name} to the sacred repository!`);
    } catch (err) {
      console.error("Failed to upload file:", err);
      setStatusMsg("Failed to upload document. Please try again.");
    } finally {
      if (type === "photo") {
        setPhotoUploading(false);
      } else {
        setKundaliUploading(false);
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, type: "photo" | "kundali") => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], type);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-[#362B5A] to-[#201938] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-orange-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-5">
          <UploadCloud className="w-56 h-56 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-mono font-bold tracking-widest text-orange-400 uppercase">Supabase Storage Repository</span>
          <h2 className="text-2xl font-bold">Sacred Upload Center</h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Upload your profile portrait and PDF/JPG/PNG Kundali charts. Your documents are stored with extreme security, enabling verified admins and matches to appreciate your credentials.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-sm font-semibold rounded-2xl border border-emerald-100 flex items-center gap-2.5 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 animate-bounce" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Photo Upload Panel */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#362B5A]/5 space-y-4">
          <div>
            <h3 className="font-bold text-base text-[#362B5A] flex items-center gap-2">
              <Image className="w-5 h-5 text-[#C2242C]" />
              Profile Portrait Photo
            </h3>
            <p className="text-xs text-gray-400 mt-1">Accepts JPG, PNG, and GIF. High quality facial portraits preferred.</p>
          </div>

          <div
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, "photo")}
            onClick={() => photoInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
              photoUploading
                ? "border-orange-400 bg-orange-50/50"
                : "border-gray-200 hover:border-[#362B5A] hover:bg-[#EBF6FF]/10"
            }`}
          >
            <input
              type="file"
              ref={photoInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "photo")}
              accept="image/*"
              className="hidden"
            />

            {photoUploading ? (
              <div className="space-y-3">
                <svg className="animate-spin h-8 w-8 text-[#C2242C] mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-xs text-gray-500 font-bold">Uploading {photoFileName}...</p>
              </div>
            ) : photoUrl ? (
              <div className="space-y-3">
                <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-[#362B5A]/10 shadow-lg">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-bold text-white uppercase tracking-wider">Change</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full w-fit mx-auto">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Verified Photo Loaded</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-2.5 bg-[#EBF6FF] text-[#C2242C] rounded-full w-fit mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#362B5A]">Drag & drop or Click to browse</p>
                  <p className="text-[9px] text-gray-400">Recommended size: 500x500px</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 bg-[#EBF6FF] hover:bg-blue-100 text-[#362B5A] rounded-xl border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-4 h-4 text-indigo-700" />
              <span>Select File</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startCamera();
              }}
              className="flex-1 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-[#C2242C] rounded-xl border border-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Camera Selfie</span>
            </button>
          </div>
        </div>

        {/* Kundali Document Upload Panel */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#362B5A]/5 space-y-4">
          <div>
            <h3 className="font-bold text-base text-[#362B5A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C2242C]" />
              Sacred Kundali (Optional / స్వచ్ఛందమైనది)
            </h3>
            <p className="text-xs text-gray-400 mt-1">Accepts PDF, JPG, and PNG documents representing birth charts (Optional - can be uploaded or changed later).</p>
          </div>

          <div
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, "kundali")}
            onClick={() => kundaliInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
              kundaliUploading
                ? "border-orange-400 bg-orange-50/50"
                : "border-gray-200 hover:border-[#362B5A] hover:bg-[#EBF6FF]/10"
            }`}
          >
            <input
              type="file"
              ref={kundaliInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "kundali")}
              accept=".pdf, image/*"
              className="hidden"
            />

            {kundaliUploading ? (
              <div className="space-y-3">
                <svg className="animate-spin h-8 w-8 text-[#C2242C] mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-xs text-gray-500 font-bold">Uploading {kundaliFileName}...</p>
              </div>
            ) : kundaliUrl ? (
              <div className="space-y-3">
                <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200 flex items-center gap-3 w-fit mx-auto">
                  <FileText className="w-6 h-6 text-[#C2242C]" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#362B5A] truncate max-w-[150px]">Kundali_Verified.pdf</p>
                    <p className="text-[9px] text-gray-400">Available in Storage</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full w-fit mx-auto">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Kundali Loaded</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-2.5 bg-[#EBF6FF] text-[#C2242C] rounded-full w-fit mx-auto">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#362B5A]">Drag & drop or Click to browse</p>
                  <p className="text-[9px] text-gray-400">Recommended: PDF or JPEG</p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => kundaliInputRef.current?.click()}
            className="w-full py-2.5 bg-[#EBF6FF] hover:bg-blue-100 text-[#362B5A] rounded-xl border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <UploadCloud className="w-4 h-4 text-indigo-700" />
            <span>Select Kundali Document</span>
          </button>
        </div>
      </div>

      {/* USER WEBCAM CAMERA MODAL */}
      {cameraActive && cameraStream && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-6 text-center border border-orange-500/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <span className="text-[10px] text-[#C2242C] font-mono font-bold tracking-widest uppercase block">Live Selfie Studio</span>
              <h3 className="text-xl font-extrabold text-[#362B5A]">Capture Your Portrait</h3>
              <p className="text-xs text-gray-500">Center your face in the box, smile, and press the capture button.</p>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden border-4 border-[#362B5A]/10 bg-black shadow-inner">
              <video
                id="user-camera-preview"
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
    </div>
  );
}
