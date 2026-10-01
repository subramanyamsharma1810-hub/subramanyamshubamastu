import React from "react";
import { usePresenceStatus } from "../../lib/presence";

interface OnlineStatusBadgeProps {
  userId: string;
  showText?: boolean;
}

export default function OnlineStatusBadge({ userId, showText = true }: OnlineStatusBadgeProps) {
  const { isOnline } = usePresenceStatus(userId);

  return (
    <div className="flex items-center space-x-1.5 inline-flex">
      <span
        className={`w-2.5 h-2.5 rounded-full border border-white shadow-sm ${
          isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
        }`}
      />
      {showText && (
        <span className={`text-[11px] font-semibold ${isOnline ? "text-emerald-700" : "text-slate-500"}`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
}
