import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

interface SearchableSelectOption {
  id: string;
  labelEn: string;
  labelTe?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder: string;
  emptyLabel?: string;
  className?: string;
  theme?: "light" | "dark";
}

export default function SearchableSelect({
  options,
  selectedValue,
  onChange,
  placeholder,
  emptyLabel = "No matches found",
  className = "",
  theme = "dark",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    const q = searchQuery.toLowerCase();
    const matchesEn = opt.labelEn.toLowerCase().includes(q);
    const matchesTe = opt.labelTe ? opt.labelTe.toLowerCase().includes(q) : false;
    const matchesId = opt.id.toLowerCase().includes(q);
    return matchesEn || matchesTe || matchesId;
  });

  const selectedOption = options.find(
    (opt) =>
      opt.labelEn === selectedValue ||
      opt.id === selectedValue ||
      (opt.labelTe && opt.labelTe === selectedValue)
  );

  const displayValue = selectedOption ? selectedOption.labelEn : selectedValue || "";

  const isDark = theme === "dark";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery("");
        }}
        className={`w-full flex items-center justify-between rounded-xl py-3 px-4 text-base font-bold focus:outline-none transition-all text-left cursor-pointer ${
          isDark
            ? "bg-black text-white border border-zinc-700 hover:border-amber-400"
            : "bg-[#EBF6FF]/20 text-[#362B5A] border-2 border-gray-200 hover:border-[#362B5A]"
        }`}
      >
        <span className={displayValue ? (isDark ? "text-white" : "text-[#362B5A]") : (isDark ? "text-zinc-500 font-normal" : "text-gray-400 font-normal")}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isDark ? "text-zinc-500" : "text-gray-400"} ${isOpen ? "rotate-180 text-amber-400" : ""}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-[200] mt-1.5 w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
          isDark ? "bg-zinc-900 border border-zinc-700" : "bg-white border-2 border-gray-200"
        }`}>
          <div className={`p-2 border-b flex items-center gap-2 ${
            isDark ? "bg-black/40 border-zinc-800" : "bg-gray-50 border-gray-100"
          }`}>
            <Search
              className={`w-4 h-4 shrink-0 ${isDark ? "text-zinc-500" : "text-gray-400"}`}
            />
            <input
              type="text"
              autoFocus
              placeholder="Search / వెతకండి..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filteredOptions.length > 0) {
                    onChange(filteredOptions[0].labelEn);
                    setIsOpen(false);
                  } else if (searchQuery.trim()) {
                    onChange(searchQuery.trim());
                    setIsOpen(false);
                  }
                }
              }}
              className={`w-full bg-transparent text-sm focus:outline-none py-1.5 font-semibold ${
                isDark ? "text-white placeholder-zinc-500" : "text-[#362B5A] placeholder-gray-400"
              }`}
            />
          </div>

          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {/* Custom option when no exact match exists */}
            {searchQuery.trim() && !options.some(opt => opt.labelEn.toLowerCase() === searchQuery.trim().toLowerCase() || opt.id.toLowerCase() === searchQuery.trim().toLowerCase() || (opt.labelTe && opt.labelTe.toLowerCase() === searchQuery.trim().toLowerCase())) && (
              <button
                type="button"
                onClick={() => {
                  onChange(searchQuery.trim());
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl text-left transition-all ${
                  isDark
                    ? "text-amber-400 hover:bg-zinc-800 hover:text-amber-300"
                    : "text-[#C2242C] hover:bg-[#EBF6FF]/50"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold">➕ Use Custom Gotram/SubCaste</span>
                  <span className="text-[10px] text-zinc-500">"{searchQuery.trim()}"</span>
                </div>
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected =
                  selectedValue === opt.labelEn ||
                  selectedValue === opt.id ||
                  selectedValue === opt.labelTe;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.labelEn); // Keep English label as stored value
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-[#C2242C] text-white font-bold"
                        : isDark
                        ? "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        : "text-[#362B5A] hover:bg-[#EBF6FF]/50"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold">{opt.labelEn}</span>
                      {opt.labelTe && (
                        <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-amber-400/80"}`}>
                          {opt.labelTe}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className={`p-3 text-xs text-center font-medium ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                {emptyLabel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
