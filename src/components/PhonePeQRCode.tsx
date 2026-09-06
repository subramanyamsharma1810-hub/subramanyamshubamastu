import React from "react";

interface PhonePeQRCodeProps {
  amount?: number;
  className?: string;
}

export default function PhonePeQRCode({ amount, className = "" }: PhonePeQRCodeProps) {
  return (
    <div className={`bg-[#0A0A0C] text-white p-6 rounded-[28px] border-2 border-zinc-800 shadow-2xl relative overflow-hidden select-none font-sans text-center max-w-xs mx-auto ${className}`}>
      {/* Decorative ambient purple background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#5f259f]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header PhonePe Section */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {/* PhonePe logo circle */}
        <div className="w-9 h-9 bg-[#5f259f] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5f259f]/30 shrink-0 border border-purple-400/20">
          <span className="text-white text-base font-black font-serif select-none">पे</span>
        </div>
        <span className="text-xl font-extrabold tracking-tight text-white font-sans">PhonePe</span>
      </div>

      {/* Accepted Here Tag */}
      <div className="mb-2">
        <span className="text-[#966bdf] text-xs font-black tracking-[0.2em] uppercase block">
          ACCEPTED HERE
        </span>
      </div>

      {/* Subtext instruction */}
      <p className="text-[10px] text-zinc-400 font-medium mb-5">
        Scan any QR using PhonePe App
      </p>

      {/* Beautiful High-Fidelity QR Code Container */}
      <div className="bg-white p-4 rounded-3xl inline-block shadow-xl relative border border-white/10 group hover:scale-[1.02] transition-transform duration-300">
        <div className="w-36 h-36 relative flex items-center justify-center bg-white">
          {/* Authentic-looking QR Code Vector Pattern */}
          <svg className="w-full h-full text-black" viewBox="0 0 100 100" fill="currentColor">
            {/* Top Left Finder Pattern */}
            <path d="M0,0 h32 v32 h-32 z M8,8 h16 v16 h-16 z M12,12 h8 v8 h-8 z" />
            {/* Top Right Finder Pattern */}
            <path d="M68,0 h32 v32 h-32 z M76,8 h16 v16 h-16 z M80,12 h8 v8 h-8 z" />
            {/* Bottom Left Finder Pattern */}
            <path d="M0,68 h32 v32 h-32 z M8,76 h16 v16 h-16 z M12,80 h8 v8 h-8 z" />
            {/* Alignment and Timing patterns with high density */}
            <path d="M42,0 h4 v4 h-4 z M50,0 h6 v2 h-6 z M60,0 h4 v4 h-4 z" />
            <path d="M40,8 h4 v4 h-4 z M48,6 h4 v4 h-4 z M56,8 h6 v2 h-6 z" />
            <path d="M0,40 h4 v4 h-4 z M8,42 h6 v2 h-6 z M18,40 h4 v4 h-4 z" />
            <path d="M0,50 h2 v6 h-2 z M6,48 h4 v4 h-4 z M14,52 h4 v4 h-4 z" />
            {/* Random QR density blocks to look fully authentic */}
            <path d="M36,20 h8 v4 h-8 z M48,22 h10 v2 h-10 z M62,18 h4 v4 h-4 z" />
            <path d="M38,30 h6 v2 h-6 z M52,28 h6 v4 h-6 z M64,32 h4 v4 h-4 z" />
            <path d="M20,38 h4 v10 h-4 z M28,42 h8 v2 h-8 z M40,44 h6 v2 h-6 z" />
            <path d="M48,36 h4 v12 h-4 z M56,40 h8 v2 h-8 z M62,44 h4 v4 h-4 z" />
            <path d="M72,38 h6 v2 h-6 z M82,40 h10 v4 h-10 z M94,42 h4 v2 h-4 z" />
            <path d="M70,48 h8 v4 h-8 z M80,50 h6 v2 h-6 z M88,52 h10 v4 h-10 z" />
            <path d="M36,54 h12 v2 h-12 z M52,56 h6 v4 h-6 z M62,54 h8 v2 h-8 z" />
            <path d="M38,64 h4 v12 h-4 z M46,62 h10 v2 h-10 z M58,60 h4 v4 h-4 z" />
            <path d="M68,64 h10 v4 h-10 z M80,62 h6 v4 h-6 z M88,60 h8 v2 h-8 z" />
            {/* Random clusters bottom right */}
            <path d="M36,80 h10 v2 h-10 z M50,78 h6 v4 h-6 z M60,82 h4 v4 h-4 z" />
            <path d="M38,90 h4 v6 h-4 z M46,88 h10 v2 h-10 z M58,92 h6 v4 h-6 z" />
            <path d="M68,76 h12 v4 h-12 z M82,78 h6 v4 h-6 z M90,80 h6 v2 h-6 z" />
            <path d="M70,88 h8 v4 h-8 z M80,90 h10 v2 h-10 z M92,92 h6 v4 h-6 z" />
            {/* Timing lines */}
            <path d="M8,36 h4 v4 h-4 z M16,36 h4 v4 h-4 z M24,36 h4 v4 h-4 z M32,36 h4 v4 h-4 z" />
            <path d="M36,8 h4 v4 h-4 z M36,16 h4 v4 h-4 z M36,24 h4 v4 h-4 z M36,32 h4 v4 h-4 z" />
          </svg>

          {/* Core Center PhonePe Logo Accent */}
          <div className="absolute w-9 h-9 bg-[#5f259f] rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
            <span className="text-white text-[11px] font-black font-serif select-none">पे</span>
          </div>
        </div>
      </div>

      {/* Account Holder Name exactly as on image */}
      <div className="mt-5 space-y-1">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Account Holder</span>
        <h4 className="text-sm font-black text-white tracking-wide uppercase font-mono">
          GADIYARAM VENKATA SUBRAMANYAM
        </h4>
        {amount && (
          <div className="mt-2.5 inline-block bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-xl">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Pay Match Fee: </span>
            <strong className="text-amber-400 font-mono font-black text-xs ml-1">₹ {amount}</strong>
          </div>
        )}
      </div>

      {/* Copyright Footer legal note */}
      <p className="text-[8px] text-zinc-600 mt-6 pt-3 border-t border-zinc-900/60 font-mono">
        ©2026, All rights reserved, PhonePe Internet Pvt. Ltd.
      </p>
    </div>
  );
}
