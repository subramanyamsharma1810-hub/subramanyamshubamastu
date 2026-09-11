import React, { useState, useEffect } from "react";
import { AdminUser, AdminRole, getAdminStageInfo } from "../types";
import { databaseService, generateRandomPassword } from "../lib/databaseService";
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Shield,
  RefreshCw,
  AlertTriangle,
  X,
  Check,
  Lock,
  UserCog,
  Phone,
  Mail,
  Sparkles,
  Key,
  Send
} from "lucide-react";

interface AdminManagementTabProps {
  onAdminCountChange?: (count: number) => void;
  currentAdmin?: AdminUser | null;
}

export default function AdminManagementTab({ onAdminCountChange, currentAdmin }: AdminManagementTabProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Active Admin RBAC Clearance
  const activeAdminUser: AdminUser | null = currentAdmin || (() => {
    try {
      const saved = localStorage.getItem("bramhana_current_admin");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const activeStageInfo = getAdminStageInfo(activeAdminUser?.role, activeAdminUser?.stage);
  const canManageAdmins = activeStageInfo.canManageAdmins; // Strictly Stage 1 Super Admin

  // Zoho ZeptoMail Gateway Test State
  const [testEmailAddress, setTestEmailAddress] = useState("subramanyamghadiyaram@gmail.com");
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      alert("Please enter a valid email address to test.");
      return;
    }
    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const res = await fetch("/api/test-zoho-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmailAddress.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailResult({
          success: true,
          message: `✅ Test email successfully dispatched via Zoho ZeptoMail (from noreply@shubhamastu.in) to ${testEmailAddress}!`
        });
      } else {
        setTestEmailResult({
          success: false,
          message: `❌ Failed to dispatch test email: ${data.error || "Unknown error"}`
        });
      }
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: `❌ Network or dispatch error: ${err.message || "Failed"}`
      });
    } finally {
      setTestEmailLoading(false);
    }
  };

  // Form State
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("Administrator");
  const [role, setRole] = useState<AdminUser["role"]>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state for newly created admin
  const [createdAdmin, setCreatedAdmin] = useState<AdminUser | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await databaseService.getAdmins();
      setAdmins(data);
      if (onAdminCountChange) onAdminCountChange(data.length);
    } catch (err) {
      console.error("Failed to load admins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleGeneratePassword = () => {
    const generated = generateRandomPassword();
    setPassword(generated);
  };

  const handleOpenAddModal = () => {
    if (!canManageAdmins) {
      alert("🔒 Access Restricted: Only Stage 1 Super Admins are authorized to add administrators.");
      return;
    }
    setName("");
    setMobile("");
    setPassword(generateRandomPassword());
    setEmail("");
    setDesignation("Revenue & Operations Admin");
    setRole("revenue_admin");
    setFormError("");
    setCreatedAdmin(null);
    setIsAddModalOpen(true);
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!canManageAdmins) {
      setFormError("🔒 Permission Denied: Only Stage 1 Super Admins can add administrators.");
      return;
    }

    const cleanName = name.trim();
    const cleanMobile = mobile.trim().replace(/\D/g, "");
    const cleanPass = password.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setFormError("Please provide the administrator's full name.");
      return;
    }

    if (!cleanMobile || cleanMobile.length < 10) {
      setFormError("Please provide a valid 10-digit mobile number for administrator login.");
      return;
    }

    if (!cleanPass || cleanPass.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    // Check if mobile already in use by another admin
    const mobileExists = admins.some(
      (a) => a.mobile.replace(/\D/g, "").slice(-10) === cleanMobile.slice(-10)
    );
    if (mobileExists) {
      setFormError(`An administrator with mobile number ending in ${cleanMobile.slice(-10)} already exists.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const newAdmin: AdminUser = {
        id: `admin-${Date.now()}`,
        name: cleanName,
        mobile: cleanMobile,
        password: cleanPass,
        email: cleanEmail || `${cleanMobile}@shubhamastu.in`,
        role: role,
        designation: designation || "Administrator",
        createdAt: new Date().toISOString(),
        status: "active",
        addedBy: "Sri G.V. Subramanyam (Proprietor)"
      };

      await databaseService.saveAdmin(newAdmin);
      setCreatedAdmin(newAdmin);
      setToastMsg(`Administrator "${newAdmin.name}" added successfully.`);
      await loadAdmins();
    } catch (err) {
      console.error("Failed to add admin:", err);
      setFormError("An error occurred while saving the administrator. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (!canManageAdmins) {
      alert("🔒 Access Restricted: Only Stage 1 Super Admins can revoke administrative privileges.");
      return;
    }

    if (admin.isRoot || admin.id === "admin-subbu" || admin.id === "admin-subba-reddy") {
      alert("Root Principal administrators cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to revoke admin privileges for "${admin.name}" (${admin.mobile})?\n\nThey will no longer be able to log in to the Admin Sanctuary.`
    );
    if (!confirmed) return;

    try {
      await databaseService.deleteAdmin(admin.id);
      setToastMsg(`Administrator access revoked for ${admin.name}.`);
      await loadAdmins();
    } catch (err) {
      console.error("Failed to delete admin:", err);
      alert("Failed to delete administrator.");
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    if (admin.isRoot) {
      alert("Root Principal administrators must remain permanently active.");
      return;
    }

    const newStatus = admin.status === "active" ? "inactive" : "active";
    try {
      await databaseService.saveAdmin({
        ...admin,
        status: newStatus
      });
      setToastMsg(`Admin "${admin.name}" status changed to ${newStatus}.`);
      await loadAdmins();
    } catch (err) {
      console.error("Failed to toggle admin status:", err);
    }
  };

  const copyCredentials = (admin: AdminUser) => {
    const text = `SHUBHAMASTU.IN ADMIN CREDENTIALS\nName: ${admin.name}\nDesignation: ${admin.designation || "Admin"}\nLogin Mobile: ${admin.mobile}\nPassword: ${admin.password}\nPortal Link: https://shubhamastu.in`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const shareViaWhatsApp = (admin: AdminUser) => {
    const text = encodeURIComponent(
      `*SHUBHAMASTU.IN ADMIN ACCESS GRANTED*\n` +
      `Namaste *${admin.name}*,\n` +
      `You have been appointed as an authorized administrator on Shubhamastu.in.\n\n` +
      `*Designation:* ${admin.designation || "Administrator"}\n` +
      `*Login Mobile:* ${admin.mobile}\n` +
      `*Password:* ${admin.password}\n` +
      `*Admin Portal:* https://shubhamastu.in\n\n` +
      `_Issued by Sri G.V. Subramanyam (Proprietor, Glark Solutions)_`
    );
    window.open(`https://wa.me/91${admin.mobile.replace(/\D/g, "").slice(-10)}?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h3 className="text-xl font-black text-[#362B5A]">
              Authorized Administrators & Access Control Registry
            </h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
            Authorize new co-administrators, compliance officers, and staff members to manage matrimonial registrations, verify fees, review grievance tickets, and record marriages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdmins}
            title="Refresh Admin List"
            className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl border border-gray-200 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {canManageAdmins ? (
            <button
              id="add-admin-button"
              onClick={handleOpenAddModal}
              className="px-5 py-3 bg-[#362B5A] hover:bg-[#2b2247] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Add New Administrator</span>
            </button>
          ) : (
            <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-extrabold flex items-center gap-2 shrink-0">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>View-Only Mode (Stage {activeStageInfo.stage})</span>
            </div>
          )}
        </div>
      </div>

      {/* RBAC Notice if viewing in non-super admin role */}
      {!canManageAdmins && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-left">
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-amber-950">
              Administrator Management Clearance: Read-Only View (Stage {activeStageInfo.stage}: {activeStageInfo.stageName})
            </p>
            <p className="text-amber-900/90 leading-relaxed">
              You are signed in as <strong>{activeAdminUser?.name || "Administrator"}</strong> with <em>{activeStageInfo.stageName}</em> clearance. Under Shubhamastu.in governance rules, <strong>only Stage 1 Super Admins</strong> can create or revoke administrator access. All administrators can view this verified roster and collaborate via the Grievance Cell.
            </p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl text-center shadow-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg("")}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Zoho ZeptoMail Email Gateway Status & Live Test Panel */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50/40 rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-700">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-[#362B5A]">
                  Zoho ZeptoMail Transactional Email Gateway
                </h4>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  ACTIVE & CONNECTED
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Authenticating via <code className="text-amber-800 font-mono font-bold">Zoho-enczapikey</code> with verified sender domain <code className="text-amber-800 font-mono font-bold">noreply@shubhamastu.in</code>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-gray-500 bg-white/80 px-3 py-1.5 rounded-xl border border-gray-200 inline-block">
              Fallback Engine: <span className="font-bold text-gray-700">Resend.com API</span>
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-xs font-bold text-gray-700 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Send Test Verification Email:</span>
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="subramanyamghadiyaram@gmail.com"
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-amber-300 bg-white focus:outline-none focus:border-[#362B5A] font-medium"
            />
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={testEmailLoading}
              className="px-4 py-2 bg-[#362B5A] hover:bg-[#2b2247] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
            >
              {testEmailLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Sending via Zoho...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-amber-300" />
                  <span>Send Test Email</span>
                </>
              )}
            </button>
          </div>
        </div>

        {testEmailResult && (
          <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 ${
            testEmailResult.success
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-red-50 border border-red-200 text-red-900"
          }`}>
            <span>{testEmailResult.message}</span>
            <button
              onClick={() => setTestEmailResult(null)}
              className="text-[11px] underline opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Admins Table / Grid */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-[#362B5A] to-[#4A3B7A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-amber-300" />
            <span className="font-extrabold text-sm uppercase tracking-wider">Active System Administrators ({admins.length})</span>
          </div>
          <span className="text-[11px] font-mono text-amber-200">
            Proprietorship: Glark Solutions
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-600 mx-auto animate-spin" />
            <p className="text-xs text-gray-500 font-mono">Synchronizing administrator roster...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Administrator Details</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Role / Designation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                          admin.isRoot 
                            ? "bg-amber-500 text-black shadow-sm" 
                            : "bg-[#362B5A] text-white"
                        }`}>
                          {admin.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">
                              {admin.name}
                            </span>
                            {admin.isRoot && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[9px] font-extrabold uppercase">
                                Root / Principal
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 block">
                            {admin.designation || "Matrimonial Administrator"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-800 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span>+91 {admin.mobile.replace(/\D/g, "").slice(-10)}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-mono text-[11px]">
                          {admin.email || "subramanyamghadiyaram@gmail.com"}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      {(() => {
                        const stageInfo = getAdminStageInfo(admin.role, admin.stage);
                        return (
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${stageInfo.badgeColor}`}>
                              {stageInfo.stage === 1 && <span>👑</span>}
                              {stageInfo.stage === 2 && <span>💼</span>}
                              {stageInfo.stage === 3 && <span>📝</span>}
                              {stageInfo.stage === 4 && <span>🛡️</span>}
                              <span>{stageInfo.stageName}</span>
                            </span>
                            <span className="text-[10px] text-gray-500 block font-medium">
                              {stageInfo.stageNameTelugu}
                            </span>
                            <div className="text-[9px] text-gray-400 font-mono">
                              {stageInfo.canManageAdmins ? "✓ Add/Del Admins" : "✗ Admins"} • {stageInfo.canViewAllRevenue ? "✓ Revenue" : "✗ Revenue"} • {stageInfo.canViewAllCandidates ? "✓ All Candidates" : "✓ My Candidates"} • ✓ Grievance Cell
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        disabled={admin.isRoot || !canManageAdmins}
                        title={admin.isRoot ? "Root admin status cannot be changed" : !canManageAdmins ? "Only Stage 1 Super Admin can toggle status" : "Click to toggle status"}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                          admin.status === "active"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                        } ${admin.isRoot || !canManageAdmins ? "cursor-default opacity-80" : "cursor-pointer"}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          admin.status === "active" ? "bg-emerald-600" : "bg-rose-600"
                        }`} />
                        {admin.status}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy credentials button */}
                        <button
                          onClick={() => copyCredentials(admin)}
                          title="Copy Login Credentials"
                          className="p-2 bg-gray-50 hover:bg-amber-100 text-gray-700 hover:text-amber-900 rounded-xl transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Credentials button */}
                        <button
                          onClick={() => shareViaWhatsApp(admin)}
                          title="Share Login Credentials via WhatsApp"
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Admin button - Only for Stage 1 Super Admin */}
                        {!admin.isRoot && canManageAdmins && (
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            title="Revoke Admin Access (Super Admin Only)"
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!admin.isRoot && !canManageAdmins && (
                          <button
                            disabled
                            title="Revocation restricted to Stage 1 Super Admins"
                            className="p-2 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed opacity-60"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#362B5A] text-amber-400 flex items-center justify-center shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#362B5A]">
                    Add New Administrator
                  </h3>
                  <p className="text-xs text-gray-500">
                    Grant administrative credentials to manage Shubhamastu.in
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 bg-gray-50 text-gray-500 hover:bg-[#C2242C] hover:text-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If admin was just created, show success details card */}
            {createdAdmin ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Administrator Created Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Share the following login credentials with <strong>{createdAdmin.name}</strong> so they can log in via the Admin Portal immediately.
                  </p>

                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-200 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-bold text-slate-900">{createdAdmin.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Login Mobile:</span>
                      <span className="font-bold text-slate-900">{createdAdmin.mobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Password:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        {createdAdmin.password}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Designation:</span>
                      <span className="font-bold text-slate-900">{createdAdmin.designation}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => copyCredentials(createdAdmin)}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey ? "Copied!" : "Copy Credentials"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => shareViaWhatsApp(createdAdmin)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Send on WhatsApp</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddAdminSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Admin Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <span>Full Name</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new-admin-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sri K. Ramanuja Chary"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#362B5A] focus:ring-2 focus:ring-[#362B5A]/20 text-xs font-semibold outline-none transition-all"
                  />
                </div>

                {/* Mobile Number (for Admin Login) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <span>Admin Mobile Number (Used for Login)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-gray-500 font-bold">
                      +91
                    </span>
                    <input
                      id="new-admin-mobile"
                      type="tel"
                      required
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#362B5A] focus:ring-2 focus:ring-[#362B5A]/20 text-xs font-mono font-semibold outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">
                    The admin will use this 10-digit number to log into the Admin Sanctuary portal.
                  </p>
                </div>

                {/* Password with Auto-Generate */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <span>Login Password</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="w-3 h-3" />
                      <span>Generate Random Key</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="new-admin-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter secure password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-300 focus:border-[#362B5A] focus:ring-2 focus:ring-[#362B5A]/20 text-xs font-mono font-semibold outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    Official Email (Optional)
                  </label>
                  <input
                    id="new-admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., coordinator@shubhamastu.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#362B5A] focus:ring-2 focus:ring-[#362B5A]/20 text-xs font-semibold outline-none transition-all"
                  />
                </div>

                {/* 4-Stage Role & Designation */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                      <span>Administrative Hierarchy Level (4 Stages)</span>
                      <span className="text-[10px] text-amber-700 font-extrabold uppercase">Shubhamastu RBAC</span>
                    </label>
                    <select
                      id="new-admin-role"
                      value={role}
                      onChange={(e) => {
                        const newR = e.target.value as AdminUser["role"];
                        setRole(newR);
                        if (newR === "super_admin") setDesignation("Super Administrator / Executive");
                        else if (newR === "revenue_admin") setDesignation("Finance & Revenue Administrator");
                        else if (newR === "candidate_admin") setDesignation("Candidate Registration Coordinator");
                        else if (newR === "grievance_admin") setDesignation("Grievance Redressal Officer");
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#362B5A] text-xs font-semibold bg-white outline-none cursor-pointer"
                    >
                      <option value="super_admin">Stage 1: Super Admin (సర్వోన్నత నిర్వాహకుడు) • Full Control (Add/Remove Admins)</option>
                      <option value="revenue_admin">Stage 2: Revenue Admin (రెవెన్యూ అడ్మిన్) • All Revenue & Candidates (No Admin Management)</option>
                      <option value="candidate_admin">Stage 3: Candidate Coordinator Admin (రిజిస్ట్రేషన్ కోఆర్డినేటర్) • Only Self-Registered Candidates</option>
                      <option value="grievance_admin">Stage 4: Grievance Officer & Support (సమస్యల పరిష్కార అధికారి) • Grievance Cell</option>
                    </select>
                  </div>

                  {/* Dynamic Stage Explanation Box */}
                  <div className="p-3 rounded-xl border text-[11px] leading-relaxed transition-all"
                    style={{
                      backgroundColor: role === "super_admin" ? "#faf5ff" : role === "revenue_admin" ? "#ecfdf5" : role === "candidate_admin" ? "#eff6ff" : "#fff1f2",
                      borderColor: role === "super_admin" ? "#d8b4fe" : role === "revenue_admin" ? "#6ee7b7" : role === "candidate_admin" ? "#93c5fd" : "#fecdd3",
                      color: role === "super_admin" ? "#581c87" : role === "revenue_admin" ? "#064e3b" : role === "candidate_admin" ? "#1e3a8a" : "#881337"
                    }}>
                    {role === "super_admin" && (
                      <div>
                        <strong>👑 Stage 1 — Super Admin:</strong> Can add or remove any administrator, view all platform revenue, approve/edit all candidate profiles, and resolve grievance tickets.
                      </div>
                    )}
                    {role === "revenue_admin" && (
                      <div>
                        <strong>💼 Stage 2 — Revenue Admin:</strong> Can view all platform revenue and analytics, verify candidate payments, view all candidates, and resolve grievance tickets. <em>Cannot add or remove administrators.</em>
                      </div>
                    )}
                    {role === "candidate_admin" && (
                      <div>
                        <strong>📝 Stage 3 — Candidate Coordinator Admin:</strong> Can see and manage <em>ONLY the candidates registered by him/her</em>, and collaborate in the grievance cell. <em>Cannot see platform revenue and cannot add or remove administrators.</em>
                      </div>
                    )}
                    {role === "grievance_admin" && (
                      <div>
                        <strong>🛡️ Stage 4 — Grievance Redressal Officer:</strong> Can manage the Grievance Cell, review incident reports, and support candidates. <em>Cannot view revenue and cannot add or remove administrators.</em>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">
                      Designation / Title
                    </label>
                    <input
                      id="new-admin-designation"
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g., Regional Registration Coordinator"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#362B5A] text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#362B5A] hover:bg-[#2b2247] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                    )}
                    <span>{isSubmitting ? "Authorizing..." : "Authorize Admin"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
