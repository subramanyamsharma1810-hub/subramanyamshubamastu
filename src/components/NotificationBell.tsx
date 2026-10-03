import React, { useState, useEffect } from "react";
import { Bell, MessageSquare, PhoneCall, X, Check, ExternalLink, Sparkles } from "lucide-react";
import { Profile } from "../types";
import { rtdb } from "../lib/firebase";
import { ref, onValue } from "firebase/database";

interface NotificationItem {
  id: string;
  type: "message" | "call" | "match" | "system";
  title: string;
  subtitle: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationBellProps {
  currentProfile: Profile | null;
  allProfiles: Profile[];
  onNavigateTab: (tab: string) => void;
}

export default function NotificationBell({ currentProfile, allProfiles, onNavigateTab }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from Firebase RTDB 'notifications/{userId}' node & local storage
  useEffect(() => {
    if (!currentProfile?.id) return;

    const notifRef = ref(rtdb, `notifications/${currentProfile.id}`);
    
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val() || {};
      const items: NotificationItem[] = [];

      // Parse RTDB notifications node
      Object.keys(data).forEach((key) => {
        const entry = data[key];
        items.push({
          id: key,
          type: entry.type || "system",
          title: entry.title || "Notification",
          subtitle: entry.subtitle || entry.text || "",
          timestamp: entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
          read: entry.read || false
        });
      });

      // 1. Check local chat messages for unread
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("chat_messages_")) {
            const msgs = JSON.parse(localStorage.getItem(key) || "[]");
            msgs.forEach((m: any) => {
              if (m.receiverId === currentProfile.id && !m.read) {
                const sender = allProfiles.find(p => p.id === m.senderId);
                items.push({
                  id: m.id || `msg_${Math.random()}`,
                  type: "message",
                  title: `💬 New Message from ${sender?.name || "Member"}`,
                  subtitle: m.text ? (m.text.length > 40 ? m.text.slice(0, 40) + "..." : m.text) : "Sent a message",
                  timestamp: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  read: false
                });
              }
            });
          }
        }
      } catch (err) {}

      // 2. Check call history for missed calls
      try {
        const history = JSON.parse(localStorage.getItem(`call_history_${currentProfile.id}`) || "[]");
        history.slice(0, 5).forEach((call: any, idx: number) => {
          if (call.status === "MISSED" || call.status === "DECLINED") {
            items.push({
              id: `call_${idx}_${call.timestamp}`,
              type: "call",
              title: `📞 Missed ${call.callType?.toUpperCase() || "AUDIO"} Call`,
              subtitle: `From ${call.otherPartyName || "Member"}`,
              timestamp: new Date(call.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: call.read || false
            });
          }
        });
      } catch (err) {}

      // Deduplicate and sort items
      const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
      setNotifications(uniqueItems);
      setUnreadCount(uniqueItems.filter(n => !n.read).length);
    }, (error) => {
      console.warn("RTDB notifications listener notice:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [currentProfile, allProfiles]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/15 flex items-center justify-center"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-amber-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#C2242C] text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#362B5A] animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#362B5A] border-2 border-amber-400/40 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
          <div className="p-4 bg-black/20 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Notifications</h3>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/10 p-2 space-y-1.5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-blue-200/70 text-xs font-medium space-y-2">
                <Bell className="w-8 h-8 text-amber-400/40 mx-auto" />
                <p>No new notifications at the moment.</p>
                <p className="text-[10px] text-blue-200/50">Messages from matched souls and call alerts will appear here instantly.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateTab("matches");
                  }}
                  className={`p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 ${
                    item.read ? "bg-white/5 hover:bg-white/10 text-blue-100" : "bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-white"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 shrink-0 mt-0.5">
                    {item.type === "message" ? <MessageSquare className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-white">{item.title}</h4>
                      <span className="text-[10px] text-amber-300/80 font-mono">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-blue-200/90 leading-snug">{item.subtitle}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-black/20 border-t border-white/15 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigateTab("matches");
              }}
              className="text-xs text-amber-300 font-bold hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <span>Open Matched Souls Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
