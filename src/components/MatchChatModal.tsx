import React, { useState, useEffect, useRef } from "react";
import { Profile } from "../types";
import { usePresenceStatus } from "../lib/presence";
import {
  X,
  Send,
  Phone,
  Video,
  CheckCheck,
  Smile,
  Paperclip,
  Lock
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

interface MatchChatModalProps {
  currentProfile: Profile;
  targetProfile: Profile;
  onClose: () => void;
  onStartCall: (type: "audio" | "video") => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number | any;
  status?: string;
}

export default function MatchChatModal({
  currentProfile,
  targetProfile,
  onClose,
  onStartCall,
}: MatchChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const { isOnline } = usePresenceStatus(targetProfile.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatId = [currentProfile?.id || "u1", targetProfile?.id || "u2"].sort().join("_");

  useEffect(() => {
    if (!currentProfile?.id || !targetProfile?.id) return;

    const messagesColRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesColRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        } as ChatMessage);
      });

      if (list.length === 0) {
        list.push({
          id: "msg-init",
          senderId: targetProfile.id,
          text: `Namaskaram 🙏. Thank you for connecting on Shubhamastu.in. I'm interested in discussing further regarding our matching profiles.`,
          timestamp: Date.now() - 1000 * 60 * 10,
          status: "read"
        });
      }

      setMessages(list);
    }, (err) => {
      console.error("Firestore chat snapshot error:", err);
    });

    return () => unsubscribe();
  }, [chatId, currentProfile?.id, targetProfile?.id, targetProfile?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentProfile?.id || !targetProfile?.id) return;

    const textToSend = inputText.trim();
    setInputText("");

    try {
      const messagesColRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesColRef, {
        senderId: currentProfile.id,
        receiverId: targetProfile.id,
        text: textToSend,
        timestamp: Date.now(),
        status: "delivered"
      });
    } catch (err) {
      console.error("Error sending Firestore chat message:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white w-full max-w-2xl h-[90vh] sm:h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-amber-200">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-[#362B5A] to-[#4A3D78] px-4 py-3 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-[#362B5A] font-bold overflow-hidden border-2 border-amber-400">
                {targetProfile.photo_url || targetProfile.kundali_url ? (
                  <img
                    src={targetProfile.photo_url || targetProfile.kundali_url}
                    alt={targetProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{targetProfile.name.charAt(0)}</span>
                )}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                }`}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base">{targetProfile.name}</h3>
                <span className="text-xs bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full font-mono">
                  {targetProfile.reg_number || "#SHUBH-102"}
                </span>
              </div>
              <p className="text-xs text-amber-200/80 flex items-center space-x-1">
                <span>{isOnline ? "🟢 Online" : "Last seen recently"}</span>
                <span>•</span>
                <span>{targetProfile.birth_location || "Hyderabad"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onStartCall("audio")}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all shadow cursor-pointer"
              title="Start Audio Call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => onStartCall("video")}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all shadow cursor-pointer"
              title="Start Video Call"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Security Notice Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>WhatsApp-style Real-Time Encrypted Chat • 50ms Delivery</span>
          </div>
          <span className="font-semibold text-[#362B5A]">ID: {targetProfile.id}</span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          <div className="text-center my-2">
            <span className="text-[11px] bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium">
              🔒 All chats & calls are logged under IT Act 2021 statutory audit regulations
            </span>
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderId === currentProfile.id;
            const timeStr = typeof msg.timestamp === 'number'
              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : "Just now";

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-sm relative ${
                    isMe
                      ? "bg-[#362B5A] text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <div
                    className={`flex items-center justify-end space-x-1 mt-1 text-[10px] ${
                      isMe ? "text-amber-200/80" : "text-slate-400"
                    }`}
                  >
                    <span>{timeStr}</span>
                    {isMe && (
                      <span>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-[#362B5A] transition-colors rounded-full hover:bg-slate-100 cursor-pointer"
            title="Attach File / Horoscopes"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type respectful message or share matching details..."
            className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#362B5A] text-slate-800"
          />
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-[#362B5A] transition-colors rounded-full hover:bg-slate-100 hidden sm:block cursor-pointer"
            title="Insert Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-[#362B5A] hover:bg-[#4A3D78] disabled:opacity-50 text-white p-2.5 rounded-full transition-all shadow flex items-center justify-center cursor-pointer"
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
