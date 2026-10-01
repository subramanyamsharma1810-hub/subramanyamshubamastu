import React, { useState, useEffect } from "react";
import { ShieldCheck, Check, X, Clock, User, Phone, ExternalLink, MessageSquare } from "lucide-react";
import { Profile } from "../../types";
import { databaseService } from "../../lib/databaseService";

interface ContactRequestsManagerProps {
  currentUserId: string;
  allProfiles?: Profile[];
}

interface RequestItem {
  requestId: string;
  requesterId: string;
  targetUserId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  respondedAt?: string;
}

export default function ContactRequestsManager({
  currentUserId,
  allProfiles = []
}: ContactRequestsManagerProps) {
  const [incoming, setIncoming] = useState<RequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<RequestItem[]>([]);
  const [profilesList, setProfilesList] = useState<Profile[]>(allProfiles);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!currentUserId) return;
    try {
      const [reqRes, profs] = await Promise.all([
        fetch(`/api/contact/requests?userId=${currentUserId}`).then(r => r.json()).catch(() => ({ success: false })),
        allProfiles.length > 0 ? Promise.resolve(allProfiles) : databaseService.getProfiles(true).catch(() => [])
      ]);

      if (reqRes.success) {
        setIncoming(reqRes.incoming || []);
        setOutgoing(reqRes.outgoing || []);
      }
      if (profs && profs.length > 0) {
        setProfilesList(profs);
      }
    } catch (err) {
      console.error("Failed to load contact requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [currentUserId]);

  const handleRespond = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoadingId(requestId);
    // Optimistic UI update
    setIncoming(prev =>
      prev.map(item => (item.requestId === requestId ? { ...item, status } : item))
    );

    try {
      const res = await fetch("/api/contact/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, userId: currentUserId, status })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Failed to update request.");
        fetchRequests();
      }
    } catch (err: any) {
      alert(err.message || "Network error.");
      fetchRequests();
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRequesterProfile = (requesterId: string): Profile | undefined => {
    return profilesList.find(p => p.id === requesterId);
  };

  const pendingIncoming = incoming.filter(r => r.status === "PENDING");

  if (loading) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-stone-200 rounded w-1/3"></div>
        <div className="h-24 bg-stone-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">Contact Number Requests</h3>
            <p className="text-xs text-stone-500">
              Manage mutual approval requests for viewing phone numbers & direct access.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold">
          {pendingIncoming.length} Pending
        </span>
      </div>

      {/* Incoming Requests Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-stone-800 uppercase tracking-wider">
          Incoming Requests ({incoming.length})
        </h4>

        {incoming.length === 0 ? (
          <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <User className="w-10 h-10 text-stone-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium text-stone-700">No contact requests received yet.</p>
            <p className="text-xs text-stone-500 mt-1">
              When matched members request to view your phone number, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {incoming.map(req => {
              const requester = getRequesterProfile(req.requesterId);
              const isPending = req.status === "PENDING";
              const isApproved = req.status === "APPROVED";

              return (
                <div
                  key={req.requestId}
                  className={`border rounded-xl p-4 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isPending
                      ? "bg-amber-50/40 border-amber-200 shadow-sm"
                      : isApproved
                      ? "bg-emerald-50/30 border-emerald-200"
                      : "bg-stone-50 border-stone-200 opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={requester?.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"}
                      alt={requester?.name || "Requester"}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-stone-900 text-base">
                          {requester?.name || `User #${req.requesterId}`}
                        </h5>
                        <span className="text-xs font-mono bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                          {requester?.reg_number || "BVM-MEMBER"}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {requester ? `${requester.profession || "Professional"} • ${requester.sub_caste || "Brahmin"}` : "Verified Match"}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-stone-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Requested on {new Date(req.requestedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleRespond(req.requestId, "APPROVED")}
                          disabled={actionLoadingId === req.requestId}
                          className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                          Approve Access
                        </button>
                        <button
                          onClick={() => handleRespond(req.requestId, "REJECTED")}
                          disabled={actionLoadingId === req.requestId}
                          className="flex-1 sm:flex-initial border border-stone-300 hover:bg-stone-100 text-stone-700 font-medium text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition"
                        >
                          <X className="w-4 h-4" />
                          Decline
                        </button>
                      </>
                    ) : isApproved ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg">
                          ✓ Access Granted
                        </span>
                        {requester?.contact_number && (
                          <a
                            href={`tel:${requester.contact_number}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition"
                            title="Call Now"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs bg-rose-100 text-rose-800 font-semibold px-3 py-1.5 rounded-lg">
                        Declined
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Outgoing Requests Section */}
      {outgoing.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-stone-100">
          <h4 className="text-sm font-semibold text-stone-800 uppercase tracking-wider">
            Your Sent Requests ({outgoing.length})
          </h4>
          <div className="grid gap-3">
            {outgoing.map(req => {
              const target = profilesList.find(p => p.id === req.targetUserId);
              return (
                <div key={req.requestId} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-3.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={target?.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"}
                      alt={target?.name || "Target"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h5 className="font-semibold text-stone-900 text-sm">{target?.name || `User #${req.targetUserId}`}</h5>
                      <p className="text-xs text-stone-500">
                        Status: <span className={`font-semibold ${req.status === "APPROVED" ? "text-emerald-600" : req.status === "PENDING" ? "text-amber-600" : "text-rose-600"}`}>{req.status}</span>
                      </p>
                    </div>
                  </div>
                  {req.status === "APPROVED" && target?.contact_number && (
                    <div className="flex items-center gap-2">
                      <a href={`tel:${target.contact_number}`} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                      <a href={`https://wa.me/${target.contact_number.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
