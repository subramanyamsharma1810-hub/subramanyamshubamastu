import React, { useState, useEffect, useMemo } from "react";
import { 
  Bell, 
  X, 
  Search, 
  Filter, 
  CheckCheck, 
  ShieldCheck, 
  CreditCard, 
  User, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  Sparkles, 
  Download, 
  Phone,
  CheckCircle2,
  Clock,
  Layers
} from "lucide-react";
import { adminNotificationService, AdminNotification, ROOT_ADMINS } from "../lib/databaseService";

interface AdminAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateCandidate?: (candidateRegOrId: string) => void;
}

export default function AdminAuditModal({ isOpen, onClose, onNavigateCandidate }: AdminAuditModalProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = adminNotificationService.subscribe((list) => {
      setNotifications(list);
    });
    return () => unsub();
  }, [isOpen]);

  // Count unread
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Map admin counts
  const adminCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "all": notifications.length,
      "admin-subbu": 0,
      "admin-subba-reddy": 0,
      "admin-tejaswar": 0
    };
    notifications.forEach((n) => {
      const aid = n.adminId?.toLowerCase() || "";
      if (aid.includes("subbu") || n.adminName?.toLowerCase().includes("subramanyam")) {
        counts["admin-subbu"] = (counts["admin-subbu"] || 0) + 1;
      } else if (aid.includes("subba") || n.adminName?.toLowerCase().includes("subba reddy")) {
        counts["admin-subba-reddy"] = (counts["admin-subba-reddy"] || 0) + 1;
      } else if (aid.includes("tejaswar") || n.adminName?.toLowerCase().includes("tejaswar")) {
        counts["admin-tejaswar"] = (counts["admin-tejaswar"] || 0) + 1;
      }
    });
    return counts;
  }, [notifications]);

  // Filtered notifications
  const filteredList = useMemo(() => {
    return notifications.filter((notif) => {
      // 1. Admin ID filter
      if (selectedAdminId !== "all") {
        const aid = notif.adminId?.toLowerCase() || "";
        const aname = notif.adminName?.toLowerCase() || "";
        if (selectedAdminId === "admin-subbu") {
          if (!aid.includes("subbu") && !aname.includes("subramanyam")) return false;
        } else if (selectedAdminId === "admin-subba-reddy") {
          if (!aid.includes("subba") && !aname.includes("subba reddy")) return false;
        } else if (selectedAdminId === "admin-tejaswar") {
          if (!aid.includes("tejaswar") && !aname.includes("tejaswar")) return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "payment" && notif.category !== "payment" && !notif.action.toLowerCase().includes("payment") && !notif.action.toLowerCase().includes("fee")) return false;
        if (selectedCategory === "status" && notif.category !== "status" && !notif.category?.includes("verif") && !notif.action.toLowerCase().includes("status") && !notif.action.toLowerCase().includes("verified")) return false;
        if (selectedCategory === "profile" && notif.category !== "profile" && !notif.action.toLowerCase().includes("profile") && !notif.action.toLowerCase().includes("registered")) return false;
        if (selectedCategory === "grievance" && notif.category !== "grievance" && !notif.action.toLowerCase().includes("grievance")) return false;
        if (selectedCategory === "suspension" && notif.category !== "suspension" && !notif.action.toLowerCase().includes("suspension") && !notif.action.toLowerCase().includes("ban")) return false;
      }

      // 3. Only Unread
      if (onlyUnread && notif.read) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = notif.action?.toLowerCase().includes(q);
        const matchesDetails = notif.details?.toLowerCase().includes(q);
        const matchesAdmin = notif.adminName?.toLowerCase().includes(q);
        const matchesReg = notif.targetCandidateRegNumber?.toLowerCase().includes(q);
        return matchesAction || matchesDetails || matchesAdmin || matchesReg;
      }

      return true;
    });
  }, [notifications, selectedAdminId, selectedCategory, onlyUnread, searchQuery]);

  const handleMarkAllRead = async () => {
    await adminNotificationService.markAllRead();
  };

  const handleMarkSingleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await adminNotificationService.markAsRead(id);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const headers = ["Timestamp", "Admin ID", "Admin Name", "Action", "Details", "Candidate Reg", "Category", "Read"];
      const rows = notifications.map(n => [
        `"${new Date(n.timestamp).toISOString()}"`,
        `"${n.adminId || ''}"`,
        `"${n.adminName || ''}"`,
        `"${(n.action || '').replace(/"/g, '""')}"`,
        `"${(n.details || '').replace(/"/g, '""')}"`,
        `"${n.targetCandidateRegNumber || ''}"`,
        `"${n.category || 'general'}"`,
        `"${n.read ? 'Yes' : 'No'}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `shubhamastu_admin_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const formatISTTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const getAdminBadge = (adminName: string, adminId: string) => {
    const aid = adminId?.toLowerCase() || "";
    const name = adminName?.toLowerCase() || "";
    if (aid.includes("subbu") || name.includes("subramanyam")) {
      return {
        bg: "bg-amber-500/20 text-amber-300 border-amber-400/40",
        label: "Sri G.V. Subramanyam (Proprietor & Stage 1)",
        shortName: "G.V. Subramanyam",
        avatar: "👑"
      };
    }
    if (aid.includes("subba") || name.includes("subba reddy")) {
      return {
        bg: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
        label: "Sri Posham Venkata Subba Reddy (Head & Stage 2)",
        shortName: "P.V. Subba Reddy",
        avatar: "🏛️"
      };
    }
    if (aid.includes("tejaswar") || name.includes("tejaswar")) {
      return {
        bg: "bg-indigo-500/20 text-indigo-300 border-indigo-400/40",
        label: "Sri Karna Tejaswar Reddy (Grievance Officer & Stage 2)",
        shortName: "K. Tejaswar Reddy",
        avatar: "⚖️"
      };
    }
    return {
      bg: "bg-purple-500/20 text-purple-300 border-purple-400/40",
      label: adminName || "Administrator",
      shortName: adminName || "Admin",
      avatar: "👤"
    };
  };

  const getCategoryIcon = (category?: string, action?: string) => {
    const act = (action || "").toLowerCase();
    if (category === "payment" || act.includes("fee") || act.includes("payment")) {
      return <CreditCard className="w-4 h-4 text-emerald-400" />;
    }
    if (category === "status" || act.includes("status") || act.includes("verified")) {
      return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
    }
    if (category === "grievance" || act.includes("grievance")) {
      return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
    }
    if (category === "suspension" || act.includes("suspension") || act.includes("ban")) {
      return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
    if (category === "profile" || act.includes("profile") || act.includes("candidate")) {
      return <User className="w-4 h-4 text-amber-400" />;
    }
    return <Sparkles className="w-4 h-4 text-purple-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none">
      <div className="bg-[#241A3E] text-white border-t-2 sm:border-2 border-amber-400/40 rounded-t-3xl sm:rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden">
        
        {/* Mobile touch grab handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-lg shrink-0">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  3-Admin Cross-Audit Bell & Activity Logs
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-blue-200/80 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Live Cross-Audit Sync across Sri G.V. Subramanyam, Sri P.V. Subba Reddy & Sri K. Tejaswar Reddy</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-amber-300 text-[11px] font-bold rounded-xl transition cursor-pointer border border-white/15"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer border border-white/15"
              title="Download Audit Logs as CSV"
            >
              <Download className="w-4 h-4 text-emerald-300" />
            </button>

            <button 
              type="button"
              onClick={onClose}
              className="p-2 text-purple-200 hover:text-white bg-white/10 hover:bg-[#C2242C] rounded-xl transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Close Audit Bell"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The 3 Root Admins "Axis" Strip */}
        <div className="shrink-0 bg-white/5 rounded-2xl p-2 sm:p-2.5 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-extrabold flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Filter By Designated Admin Axis</span>
            </span>
            <span className="text-[10px] text-blue-200/60 font-mono">
              Total Logs: {notifications.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {/* All Admins Option */}
            <button
              type="button"
              onClick={() => setSelectedAdminId("all")}
              className={`p-2 rounded-xl text-left transition-all border cursor-pointer min-h-[46px] flex flex-col justify-between ${
                selectedAdminId === "all"
                  ? "bg-amber-500 text-slate-950 font-black border-amber-300 shadow-md scale-[1.01]"
                  : "bg-white/5 hover:bg-white/10 text-white border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-extrabold">All 3 Admins</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedAdminId === "all" ? "bg-black/20 text-slate-950" : "bg-white/10 text-amber-300"}`}>
                  {adminCounts["all"]}
                </span>
              </div>
              <span className={`text-[9px] truncate ${selectedAdminId === "all" ? "text-slate-900" : "text-blue-200/70"}`}>
                Unified Timeline
              </span>
            </button>

            {/* Admin 1: Sri G.V. Subramanyam */}
            <button
              type="button"
              onClick={() => setSelectedAdminId("admin-subbu")}
              className={`p-2 rounded-xl text-left transition-all border cursor-pointer min-h-[46px] flex flex-col justify-between ${
                selectedAdminId === "admin-subbu"
                  ? "bg-amber-500 text-slate-950 font-black border-amber-300 shadow-md scale-[1.01]"
                  : "bg-white/5 hover:bg-white/10 text-white border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold truncate">👑 G.V. Subramanyam</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedAdminId === "admin-subbu" ? "bg-black/20 text-slate-950" : "bg-white/10 text-amber-300"}`}>
                  {adminCounts["admin-subbu"]}
                </span>
              </div>
              <span className={`text-[9px] truncate ${selectedAdminId === "admin-subbu" ? "text-slate-900" : "text-blue-200/70"}`}>
                Proprietor • Stg 1
              </span>
            </button>

            {/* Admin 2: Sri P.V. Subba Reddy */}
            <button
              type="button"
              onClick={() => setSelectedAdminId("admin-subba-reddy")}
              className={`p-2 rounded-xl text-left transition-all border cursor-pointer min-h-[46px] flex flex-col justify-between ${
                selectedAdminId === "admin-subba-reddy"
                  ? "bg-emerald-500 text-slate-950 font-black border-emerald-300 shadow-md scale-[1.01]"
                  : "bg-white/5 hover:bg-white/10 text-white border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold truncate">🏛️ P.V. Subba Reddy</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedAdminId === "admin-subba-reddy" ? "bg-black/20 text-slate-950" : "bg-white/10 text-emerald-300"}`}>
                  {adminCounts["admin-subba-reddy"]}
                </span>
              </div>
              <span className={`text-[9px] truncate ${selectedAdminId === "admin-subba-reddy" ? "text-slate-900" : "text-blue-200/70"}`}>
                Operational Head • Stg 2
              </span>
            </button>

            {/* Admin 3: Sri Karna Tejaswar Reddy */}
            <button
              type="button"
              onClick={() => setSelectedAdminId("admin-tejaswar")}
              className={`p-2 rounded-xl text-left transition-all border cursor-pointer min-h-[46px] flex flex-col justify-between ${
                selectedAdminId === "admin-tejaswar"
                  ? "bg-indigo-500 text-white font-black border-indigo-300 shadow-md scale-[1.01]"
                  : "bg-white/5 hover:bg-white/10 text-white border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold truncate">⚖️ K. Tejaswar Reddy</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedAdminId === "admin-tejaswar" ? "bg-black/20 text-white" : "bg-white/10 text-indigo-300"}`}>
                  {adminCounts["admin-tejaswar"]}
                </span>
              </div>
              <span className={`text-[9px] truncate ${selectedAdminId === "admin-tejaswar" ? "text-indigo-100" : "text-blue-200/70"}`}>
                Grievance Officer • Stg 2
              </span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-purple-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by action, candidate name, BVM reg #, txn ID, phone..."
                className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs text-white placeholder-purple-300/60 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOnlyUnread(!onlyUnread)}
              className={`px-3 py-2 rounded-xl text-[11px] font-extrabold border transition cursor-pointer shrink-0 flex items-center gap-1 ${
                onlyUnread
                  ? "bg-red-500 text-white border-red-400 shadow-md"
                  : "bg-white/10 text-purple-200 hover:text-white border-white/15"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && <span>({unreadCount})</span>}
            </button>
          </div>

          {/* Category Chips Swipeable Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
            {[
              { id: "all", label: "All Categories" },
              { id: "payment", label: "₹ Fees & Payments" },
              { id: "status", label: "✓ Status & Verification" },
              { id: "profile", label: "👤 Profile Updates" },
              { id: "suspension", label: "⚠️ Ban & Mercy Actions" },
              { id: "grievance", label: "⚖️ Grievance Redressal" }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer border ${
                  selectedCategory === cat.id
                    ? "bg-white text-slate-950 border-white shadow-xs"
                    : "bg-white/5 hover:bg-white/10 text-blue-200/80 border-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <Bell className="w-8 h-8 text-purple-300/60 mx-auto" />
              <p className="text-sm font-bold text-white">No matching admin activity logs found</p>
              <p className="text-xs text-blue-200/70 max-w-sm mx-auto">
                Try adjusting your search criteria or switching the admin axis filter above.
              </p>
              {(searchQuery || selectedCategory !== "all" || selectedAdminId !== "all" || onlyUnread) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedAdminId("all");
                    setOnlyUnread(false);
                  }}
                  className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            filteredList.map((notif) => {
              const badge = getAdminBadge(notif.adminName, notif.adminId);
              const icon = getCategoryIcon(notif.category, notif.action);
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.targetCandidateRegNumber && onNavigateCandidate) {
                      onNavigateCandidate(notif.targetCandidateRegNumber);
                    }
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isUnread
                      ? "bg-purple-900/60 border-amber-400/50 shadow-md"
                      : "bg-white/5 hover:bg-white/10 border-white/10"
                  } space-y-2`}
                >
                  {/* Top metadata line: Admin badge + timestamp */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border flex items-center gap-1 shrink-0 ${badge.bg}`}>
                        <span>{badge.avatar}</span>
                        <span className="truncate max-w-[150px] sm:max-w-none">{badge.shortName}</span>
                      </span>

                      {notif.targetCandidateRegNumber && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                          {notif.targetCandidateRegNumber}
                        </span>
                      )}

                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-ping" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-blue-200/70 font-mono shrink-0">
                      <Clock className="w-3 h-3 text-purple-300" />
                      <span>{formatISTTime(notif.timestamp)}</span>
                    </div>
                  </div>

                  {/* Action Title with Category Icon */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-white/10 shrink-0">
                        {icon}
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white">
                        {notif.action}
                      </h4>
                    </div>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkSingleRead(notif.id, e)}
                        className="text-[10px] text-amber-300 hover:text-white px-2 py-0.5 bg-white/10 rounded-md transition cursor-pointer shrink-0"
                        title="Mark as read"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>

                  {/* Details Paragraph */}
                  <p className="text-xs text-blue-100/90 leading-relaxed pl-7">
                    {notif.details}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-blue-200/60 hidden sm:block">
            Showing {filteredList.length} of {notifications.length} logged actions
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="sm:hidden flex-1 py-2.5 bg-white/15 text-amber-300 font-bold text-xs rounded-xl text-center"
              >
                Mark Read ({unreadCount})
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer min-h-[40px]"
            >
              Close Audit Bell
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
