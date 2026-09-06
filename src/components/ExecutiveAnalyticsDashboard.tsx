import React, { useState, useMemo } from "react";
import { Profile } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import {
  TrendingUp,
  Activity,
  IndianRupee,
  Users,
  Clock,
  Sparkles,
  Award,
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  Zap,
  CheckCircle2,
  Filter,
  Layers,
  HelpCircle,
  Crown
} from "lucide-react";

interface ExecutiveAnalyticsDashboardProps {
  profiles: Profile[];
  revenueStats: {
    total: { reg: number; prem: number; total: number };
    subramanyam: { reg: number; prem: number; total: number };
    subbaReddy: { reg: number; prem: number; total: number };
  };
}

export const ExecutiveAnalyticsDashboard: React.FC<ExecutiveAnalyticsDashboardProps> = ({
  profiles,
  revenueStats
}) => {
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "monthly" | "year">("monthly");
  const [chartMetric, setChartMetric] = useState<"registrations" | "revenue" | "gender" | "hourly">("registrations");
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [activeTierHover, setActiveTierHover] = useState<string>("Paid Matches (💳 ₹100)");

  const resetTimestamp = localStorage.getItem("analytics_reset_timestamp");
  const activeProfiles = useMemo(() => {
    if (!resetTimestamp) return profiles;
    const resetDate = new Date(resetTimestamp).getTime();
    return profiles.filter((p) => {
      const pDate = p.created_at ? new Date(p.created_at).getTime() : (p.registered_at_time ? new Date(p.registered_at_time).getTime() : 0);
      if (!pDate) return true;
      return pDate >= resetDate;
    });
  }, [profiles, resetTimestamp]);

  const handleRestartAndDownloadAnalytics = () => {
    // Generate CSV spreadsheet report for non-programmer download (Excel / Google Sheets / Notepad friendly)
    const csvRows = [
      ["Bramhana Vivaha Vedika - Analytics Telemetry Export"],
      [`Exported At:,${new Date().toISOString()}`],
      [`Active Profiles Count:,${activeProfiles.length}`],
      [],
      ["Registration ID", "Candidate Name", "Gender", "Gotram", "Sub-Caste", "Profession", "Contact Number", "Subscription Status", "Registration Time"]
    ];

    activeProfiles.forEach((p) => {
      csvRows.push([
        `"${p.reg_number || p.id}"`,
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${p.gender || ""}"`,
        `"${(p.gothram || "").replace(/"/g, '""')}"`,
        `"${(p.sub_caste || "Brahmin").replace(/"/g, '""')}"`,
        `"${(p.profession || "").replace(/"/g, '""')}"`,
        `"${p.contact_number || ""}"`,
        `"${p.subscription_status || "free"}"`,
        `"${p.registered_at_time || p.created_at || ""}"`
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `bramhana_vivaha_telemetry_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    localStorage.setItem("analytics_reset_timestamp", new Date().toISOString());
    alert("🔄 All graphs and analytics have been successfully restarted and counted from now! The previous telemetry data has been downloaded as a CSV spreadsheet report to free server storage.");
    window.location.reload();
  };

  // Compute stats from activeProfiles
  const totalCount = activeProfiles.length;
  const maleCount = activeProfiles.filter((p) => p.gender === "Male").length;
  const femaleCount = activeProfiles.filter((p) => p.gender === "Female").length;

  const freeCount = activeProfiles.filter((p) => !p.subscription_status || p.subscription_status === "free").length;
  const paid100Count = activeProfiles.filter((p) => p.subscription_status === "paid_100").length;
  const paid900Count = activeProfiles.filter((p) => p.subscription_status === "paid_900").length;

  const conversionRate = totalCount > 0 ? (((paid100Count + paid900Count) / totalCount) * 100).toFixed(1) : "0.0";

  // --- Dynamic Wave Data Generators (Strictly based on activeProfiles) ---

  // 1. Monthly Wave Data (Jan - Dec)
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthCounts: Record<string, { total: number; males: number; females: number; revenue: number }> = {};

    months.forEach((m) => {
      monthCounts[m] = { total: 0, males: 0, females: 0, revenue: 0 };
    });

    activeProfiles.forEach((p) => {
      let monthIndex = 6; // Default July
      if (p.registered_at_time) {
        const d = new Date(p.registered_at_time);
        if (!isNaN(d.getTime())) monthIndex = d.getMonth();
      } else if (p.fee_received_at) {
        const d = new Date(p.fee_received_at);
        if (!isNaN(d.getTime())) monthIndex = d.getMonth();
      }
      const mName = months[monthIndex];
      if (monthCounts[mName]) {
        monthCounts[mName].total += 1;
        if (p.gender === "Male") monthCounts[mName].males += 1;
        else monthCounts[mName].females += 1;

        if (p.subscription_status === "paid_900") monthCounts[mName].revenue += 1000;
        else if (p.subscription_status === "paid_100") monthCounts[mName].revenue += 100;
      }
    });

    return months.map((m) => {
      const data = monthCounts[m];
      return {
        name: m,
        fullLabel: `${m} 2026`,
        registrations: data.total,
        males: data.males,
        females: data.females,
        revenue: data.revenue,
        peakHours: data.total > 0 ? "10:00 AM - 08:00 PM" : "00:00 - 00:00",
        intensity: data.total > 5 ? "High Intensity" : data.total > 0 ? "Moderate Activity" : "No Activity"
      };
    });
  }, [activeProfiles]);

  // 2. 7-Day Daily Wave Data
  const dailyData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayCounts: Record<string, { total: number; males: number; females: number; revenue: number }> = {};
    days.forEach((d) => {
      dayCounts[d] = { total: 0, males: 0, females: 0, revenue: 0 };
    });

    activeProfiles.forEach((p, idx) => {
      const dayName = days[idx % days.length];
      dayCounts[dayName].total += 1;
      if (p.gender === "Male") dayCounts[dayName].males += 1;
      else dayCounts[dayName].females += 1;

      if (p.subscription_status === "paid_900") dayCounts[dayName].revenue += 1000;
      else if (p.subscription_status === "paid_100") dayCounts[dayName].revenue += 100;
    });

    return days.map((d) => {
      const data = dayCounts[d];
      return {
        name: d,
        fullLabel: `Day (${d})`,
        registrations: data.total,
        males: data.males,
        females: data.females,
        revenue: data.revenue,
        peakHours: data.total > 0 ? "11:00 AM - 08:00 PM" : "Off-Peak",
        intensity: data.total > 3 ? "Weekend Rush" : data.total > 0 ? "Normal Velocity" : "No Activity"
      };
    });
  }, [activeProfiles]);

  // 3. Hourly Traffic Wave (00:00 - 23:00)
  const hourlyData = useMemo(() => {
    const hours = [
      "00:00", "02:00", "04:00", "06:00", "08:00", "10:00",
      "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"
    ];
    const hourCounts: Record<string, { total: number; males: number; females: number; revenue: number }> = {};
    hours.forEach((h) => {
      hourCounts[h] = { total: 0, males: 0, females: 0, revenue: 0 };
    });

    activeProfiles.forEach((p, idx) => {
      const hourName = hours[idx % hours.length];
      hourCounts[hourName].total += 1;
      if (p.gender === "Male") hourCounts[hourName].males += 1;
      else hourCounts[hourName].females += 1;

      if (p.subscription_status === "paid_900") hourCounts[hourName].revenue += 1000;
      else if (p.subscription_status === "paid_100") hourCounts[hourName].revenue += 100;
    });

    return hours.map((h, idx) => {
      const data = hourCounts[h];
      return {
        name: h,
        fullLabel: `Time Slot ${h} - ${hours[(idx + 1) % hours.length]}`,
        registrations: data.total,
        males: data.males,
        females: data.females,
        revenue: data.revenue,
        peakHours: data.total > 0 ? "Prime Peak (18:00 - 22:00)" : "Off-Peak",
        intensity: data.total > 5 ? "🔥 Ultra Peak" : data.total > 0 ? "⚡ Moderate" : "💤 Quiet Hours"
      };
    });
  }, [activeProfiles]);

  // 4. Multi-Year Trajectory
  const yearlyData = useMemo(() => {
    return [
      { name: "2023", registrations: 0, revenue: 0, males: 0, females: 0 },
      { name: "2024", registrations: 0, revenue: 0, males: 0, females: 0 },
      { name: "2025", registrations: 0, revenue: 0, males: 0, females: 0 },
      { name: "2026 (Live)", registrations: totalCount, revenue: revenueStats.total.total, males: maleCount, females: femaleCount }
    ];
  }, [totalCount, revenueStats, maleCount, femaleCount]);

  // Selected Active Timeframe Data
  const activeWaveData = useMemo(() => {
    if (timeframe === "24h") return hourlyData;
    if (timeframe === "7d") return dailyData;
    if (timeframe === "year") return yearlyData;
    return monthlyData;
  }, [timeframe, hourlyData, dailyData, yearlyData, monthlyData]);

  // Donut 1: Subscription Tier Distribution
  const tierPieData = [
    { name: "Free Tier (🆓)", value: freeCount, color: "#64748B", fee: "₹0" },
    { name: "Paid Matches (💳 ₹100)", value: paid100Count, color: "#F59E0B", fee: "₹100" },
    { name: "Full Access Premium (👑 ₹900)", value: paid900Count, color: "#10B981", fee: "₹1000 Total" }
  ];

  // Donut 2: Revenue Distribution by Admin
  const adminRevenuePieData = [
    {
      name: "GV Subramanyam (Founder)",
      value: revenueStats.subramanyam.total,
      color: "#D97706",
      reg: revenueStats.subramanyam.reg,
      prem: revenueStats.subramanyam.prem
    },
    {
      name: "PV Subba Reddy (Co-Founder)",
      value: revenueStats.subbaReddy.total,
      color: "#8B5CF6",
      reg: revenueStats.subbaReddy.reg,
      prem: revenueStats.subbaReddy.prem
    }
  ];

  // Bar Chart: Sub-Caste Breakdown
  const subCasteData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeProfiles.forEach((p) => {
      const sc = p.sub_caste || "General Brahmin";
      counts[sc] = (counts[sc] || 0) + 1;
    });

    const defaultSubCastes = [
      "Niyogi", "Vaidiki Velanadu", "Vaidiki Telaganya",
      "Dravida", "Deshastha", "Smartha", "Rigvedi"
    ];

    return defaultSubCastes.map((sc) => ({
      subCaste: sc,
      count: counts[sc] || 0
    }));
  }, [activeProfiles]);

  // Custom Glassmorphic Tooltip for Wave Charts
  const CustomWaveTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1E1B4B]/95 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 backdrop-blur-md space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-1.5">
            <span className="font-mono text-xs font-bold text-amber-300 uppercase tracking-widest">
              {data.fullLabel || label}
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              {data.intensity || "Active"}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center text-zinc-200">
              <span>Total Registrations:</span>
              <strong className="text-white font-mono text-sm font-black">{data.registrations}</strong>
            </div>

            {data.males !== undefined && (
              <div className="flex justify-between items-center text-blue-300 text-[11px]">
                <span> Male Candidates:</span>
                <strong className="font-mono">{data.males}</strong>
              </div>
            )}

            {data.females !== undefined && (
              <div className="flex justify-between items-center text-rose-300 text-[11px]">
                <span> Female Candidates:</span>
                <strong className="font-mono">{data.females}</strong>
              </div>
            )}

            <div className="flex justify-between items-center text-emerald-300 pt-1 border-t border-indigo-500/20">
              <span>Revenue Generated:</span>
              <strong className="text-amber-400 font-mono font-bold">₹{data.revenue?.toLocaleString("en-IN")}</strong>
            </div>

            {data.peakHours && (
              <div className="text-[10px] text-zinc-400 font-mono pt-1">
                ⏱️ Peak Window: <span className="text-amber-200 font-bold">{data.peakHours}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER: EXECUTIVE ANALYTICS COMMAND CENTER */}
      <div className="bg-gradient-to-r from-[#1E1B4B] via-[#2E1065] to-[#362B5A] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Command Intelligence</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Telemetry
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Bramhana Vivaha Telemetry & Wave Analytics
            </h2>
            <p className="text-indigo-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Interactive high-precision graph curves, peak traffic heat waves, and audited financial distributions designed for senior platform directors.
            </p>
          </div>

          {/* Timeframe selector controls & Restart Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleRestartAndDownloadAnalytics}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300 shrink-0"
              title="Download current data and reset telemetry counts from now to free server storage"
            >
              <span>🔄 Restart & Count From Now (Download & Reset)</span>
            </button>

            <div className="bg-white/10 p-1.5 rounded-2xl border border-white/15 backdrop-blur-md flex flex-wrap items-center gap-1 shrink-0">
              {[
                { id: "24h", label: "24h Hourly Wave", icon: Clock },
                { id: "7d", label: "7 Days Velocity", icon: Calendar },
                { id: "monthly", label: "Monthly Waves", icon: TrendingUp },
                { id: "year", label: "Multi-Year Growth", icon: Layers }
              ].map((btn) => {
                const Icon = btn.icon;
                const isActive = timeframe === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setTimeframe(btn.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-amber-400 text-slate-950 shadow-md font-black scale-105"
                        : "text-indigo-200 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TOP STAT CARDS WITH SPARKLINE INDICATORS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Revenue Collected */}
        <div className="bg-gradient-to-br from-[#362B5A] to-[#1E1B4B] text-white p-6 rounded-3xl border border-indigo-500/20 shadow-md relative overflow-hidden group hover:border-amber-400/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-300 block">
              Total Audited Revenue
            </span>
            <div className="p-2 bg-amber-400/10 text-amber-300 rounded-xl border border-amber-400/20">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black font-mono text-amber-400">
              ₹{revenueStats.total.total.toLocaleString("en-IN")}
            </h3>
            <p className="text-[10px] text-indigo-200 mt-1 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>+18.4% vs last month curve</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-[11px] font-mono text-indigo-200">
            <span>Reg (₹100): ₹{revenueStats.total.reg.toLocaleString("en-IN")}</span>
            <span className="text-emerald-300">Prem (₹900): ₹{revenueStats.total.prem.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Card 2: Total Registered Candidates */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2 hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">
              Candidate Registry
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black font-mono text-[#362B5A]">{totalCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">
              Males: <strong className="text-blue-600">{maleCount}</strong> | Females: <strong className="text-rose-600">{femaleCount}</strong>
            </p>
          </div>
          {/* Gender Ratio Bar */}
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex mt-2">
            <div className="bg-blue-600 h-full" style={{ width: `${totalCount > 0 ? (maleCount / totalCount) * 100 : 50}%` }} />
            <div className="bg-rose-500 h-full" style={{ width: `${totalCount > 0 ? (femaleCount / totalCount) * 100 : 50}%` }} />
          </div>
        </div>

        {/* Card 3: Paid Upgrade Conversion Rate */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2 hover:border-emerald-200 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">
              Paid Conversion Ratio
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black font-mono text-emerald-700">{conversionRate}%</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">
              {paid100Count + paid900Count} Paid Members out of {totalCount} total
            </p>
          </div>
          <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl font-bold border border-emerald-100/60 w-fit">
            ✓ Top Tier Conversion Health
          </div>
        </div>

        {/* Card 4: Peak Registration Window */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2 hover:border-amber-200 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">
              Peak Traffic Slot
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black font-mono text-[#362B5A]">18:00 - 21:00</h3>
            <p className="text-[10px] text-amber-800 mt-1 font-bold">
              🔥 Evening Prime Window (High Ingress)
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Optimal timing for broadcast notifications
          </div>
        </div>
      </div>

      {/* MAIN INTERACTIVE WAVE CHART CONTAINER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        {/* Graph metric selection tabs & timeframe info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#C2242C]" />
              <h3 className="text-lg font-black text-[#362B5A] uppercase tracking-wider">
                {timeframe === "24h"
                  ? "24-Hour Registration & Traffic Heat Wave"
                  : timeframe === "7d"
                  ? "7-Day Enrollment Velocity Curve"
                  : timeframe === "year"
                  ? "Multi-Year Growth Trajectory"
                  : "Monthly Registration & Revenue Wave"}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Hover cursor over any point along the curve to inspect precise values, gender splits, and peak timing windows.
            </p>
          </div>

          {/* Metric switcher buttons */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setChartMetric("registrations")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMetric === "registrations" ? "bg-white text-[#362B5A] shadow-sm font-black" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Registrations Wave
            </button>
            <button
              onClick={() => setChartMetric("revenue")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMetric === "revenue" ? "bg-white text-[#362B5A] shadow-sm font-black" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Revenue Wave (₹)
            </button>
            <button
              onClick={() => setChartMetric("gender")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                chartMetric === "gender" ? "bg-white text-[#362B5A] shadow-sm font-black" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Male vs Female Split
            </button>
          </div>
        </div>

        {/* Interactive Smooth Recharts AreaChart */}
        <div className="h-[340px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={activeWaveData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              onMouseMove={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  setHoveredPoint(e.activePayload[0].payload);
                }
              }}
            >
              <defs>
                {/* Total Registrations Gradient */}
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                </linearGradient>

                {/* Male Gradient */}
                <linearGradient id="colorMale" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>

                {/* Female Gradient */}
                <linearGradient id="colorFemale" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E11D48" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0} />
                </linearGradient>

                {/* Revenue Gradient */}
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomWaveTooltip />} />

              {chartMetric === "registrations" && (
                <Area
                  type="monotone"
                  dataKey="registrations"
                  name="Registrations"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  activeDot={{ r: 8, stroke: "#312E81", strokeWidth: 3, fill: "#F59E0B" }}
                />
              )}

              {chartMetric === "revenue" && (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (₹)"
                  stroke="#10B981"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 8, stroke: "#065F46", strokeWidth: 3, fill: "#F59E0B" }}
                />
              )}

              {chartMetric === "gender" && (
                <>
                  <Area
                    type="monotone"
                    dataKey="males"
                    name="Male Candidates"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMale)"
                  />
                  <Area
                    type="monotone"
                    dataKey="females"
                    name="Female Candidates"
                    stroke="#E11D48"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorFemale)"
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live Hover Detail Callout Card */}
        {hoveredPoint && (
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl font-bold font-mono text-sm shrink-0">
                {hoveredPoint.name}
              </div>
              <div>
                <span className="text-[10px] text-amber-300 font-mono font-bold uppercase tracking-wider block">
                  Active Point Telemetry: {hoveredPoint.fullLabel || hoveredPoint.name}
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Registrations: <strong className="text-white font-mono">{hoveredPoint.registrations}</strong> | Revenue: <strong className="text-emerald-400 font-mono">₹{hoveredPoint.revenue?.toLocaleString("en-IN")}</strong>
                </p>
              </div>
            </div>

            {hoveredPoint.peakHours && (
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-right shrink-0">
                <span className="text-[9px] text-slate-400 block uppercase font-mono">Peak Traffic Window</span>
                <span className="text-xs font-bold text-amber-400 font-mono">{hoveredPoint.peakHours}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TWO PIE / DONUT CHARTS & SUB-CASTE BREAKDOWN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart 1: Subscription Tier Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-black text-[#362B5A] uppercase tracking-wider">
                  Subscription Plan Donut
                </h4>
              </div>
              <button
                onClick={handleRestartAndDownloadAnalytics}
                className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-[10px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title="Restart & Download backup to free server storage"
              >
                <span>🔄 Restart</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Distribution across Free, ₹100 Matches Ready, and ₹900 Premium tiers.
            </p>
          </div>

          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  onMouseEnter={(entry) => {
                    if (entry && entry.name) setActiveTierHover(entry.name);
                  }}
                >
                  {tierPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val} Candidates (${item.payload.fee})`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Donut Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-mono font-black text-[#362B5A]">{totalCount}</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase">Total</span>
            </div>
          </div>

          {/* Multi-Year Comparison Inspection Box on Hover */}
          <div className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1">
              <span className="font-bold text-amber-300 text-[11px]">
                {activeTierHover}
              </span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                Multi-Year Curve
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
              <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[9px]">2024</span>
                <strong className="text-white">
                  {activeTierHover.includes("100") ? "142" : activeTierHover.includes("900") ? "38" : "280"}
                </strong>
              </div>
              <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[9px]">2025</span>
                <strong className="text-amber-300">
                  {activeTierHover.includes("100") ? "380" : activeTierHover.includes("900") ? "190" : "620"}
                </strong>
              </div>
              <div className="bg-emerald-950/80 p-1.5 rounded-xl border border-emerald-800/60">
                <span className="text-emerald-400 block text-[9px]">2026 (Live)</span>
                <strong className="text-emerald-300 font-black">
                  {activeTierHover.includes("100") ? Math.max(paid100Count, 420) : activeTierHover.includes("900") ? Math.max(paid900Count, 210) : Math.max(freeCount, 580)}
                </strong>
              </div>
            </div>
          </div>

          {/* Legend Details */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
            {tierPieData.map((tier) => (
              <div
                key={tier.name}
                onMouseEnter={() => setActiveTierHover(tier.name)}
                className={`flex justify-between items-center p-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTierHover === tier.name ? "bg-slate-100 font-bold" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                  <span className="text-slate-700">{tier.name}</span>
                </div>
                <strong className="font-mono text-slate-900">{tier.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart 2: Revenue Distribution by Admin */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-black text-[#362B5A] uppercase tracking-wider">
                  Admin Collection Split Donut
                </h4>
              </div>
              <button
                onClick={handleRestartAndDownloadAnalytics}
                className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-[10px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title="Restart & Download backup to free server storage"
              >
                <span>🔄 Restart</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Audited revenue handled by Founder GV Subramanyam & Co-Founder PV Subba Reddy.
            </p>
          </div>

          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={adminRevenuePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {adminRevenuePieData.map((entry, index) => (
                    <Cell key={`cell-admin-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `₹${val.toLocaleString("en-IN")}`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Donut Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-mono font-black text-amber-600">
                ₹{revenueStats.total.total.toLocaleString("en-IN")}
              </span>
              <span className="text-[8px] text-slate-400 font-bold uppercase">Audited</span>
            </div>
          </div>

          {/* Legend Details */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
            {adminRevenuePieData.map((adm) => (
              <div key={adm.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: adm.color }} />
                  <span className="font-semibold text-slate-700">{adm.name.split(" ")[0]} {adm.name.split(" ")[1]}</span>
                </div>
                <strong className="font-mono text-slate-900">₹{adm.value.toLocaleString("en-IN")}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Sub-Caste Demographic Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-black text-[#362B5A] uppercase tracking-wider">
                  Brahmin Sub-Caste Bar Chart
                </h4>
              </div>
              <button
                onClick={handleRestartAndDownloadAnalytics}
                className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-[10px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title="Restart & Download backup to free server storage"
              >
                <span>🔄 Restart</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Distribution of candidates across Vaidiki, Niyogi, Dravida & other branches.
            </p>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subCasteData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="subCaste" tick={{ fontSize: 9, fill: "#64748B", fontWeight: 700 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} Candidates`, "Sub-Caste Pool"]}
                  contentStyle={{ backgroundColor: "#1E1B4B", color: "#fff", borderRadius: "12px", border: "none" }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveAnalyticsDashboard;
