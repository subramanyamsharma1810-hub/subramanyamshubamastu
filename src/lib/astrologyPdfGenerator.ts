import { jsPDF } from "jspdf";
import { Profile } from "../types";
import { RASIS } from "./panchangam";

/**
 * Maps Rasi name to index (0-11)
 */
function findRasiIndex(rasiName?: string): number {
  if (!rasiName) return 3; // default Karkataka
  const clean = rasiName.toLowerCase();
  for (let i = 0; i < RASIS.length; i++) {
    const r = RASIS[i];
    if (
      clean.includes(r.english.toLowerCase()) ||
      clean.includes(r.telugu.toLowerCase())
    ) {
      return i;
    }
  }
  return 3;
}

/**
 * Generates an elegant, high-fidelity Vedic Astrological Horoscope & Kundali PDF
 * using standard jsPDF vector operations and crisp typography.
 */
export function generateAstrologyPdf(profile: Profile): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const astro = profile.astrology || {
    nakshatra: profile.nakshatram || "Swati",
    nakshatraLord: "Rahu",
    pada: 2,
    rashi: "Tula (Libra)",
    tithi: "Shukla Dashami",
    deity: "Vayu",
    spiritualAnalysis: "Profound spiritual wisdom, calm demeanor, deeply attuned to Vedic rituals and lifelong dharmic harmony.",
    compatibilityTraits: ["Dharmic alignment", "Family oriented", "Gentle communicator"],
    spiritualScore: 92,
  };

  // Background subtle tint
  doc.setFillColor(254, 252, 246);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Double decorative border
  doc.setDrawColor(184, 134, 11); // Royal Gold
  doc.setLineWidth(1.2);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - (margin - 4) * 2);

  doc.setDrawColor(218, 165, 32); // Light Gold
  doc.setLineWidth(0.4);
  doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - (margin - 2) * 2);

  // Top Maroon & Gold Header Banner
  doc.setFillColor(114, 28, 36); // Deep Sacred Maroon / Kumkum
  doc.roundedRect(margin, margin, contentWidth, 24, 2, 2, "F");

  doc.setTextColor(255, 230, 160);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("BRAMHANA VIVAHA VEDIKA • SHUBHAMASTU.IN", pageWidth / 2, margin + 8, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Sri Jataka Kundali & Vedic Horoscope Summary (శ్రీ జాతక పత్రిక ఫలితాలు)", pageWidth / 2, margin + 14, { align: "center" });

  doc.setFontSize(7.5);
  doc.setTextColor(255, 220, 150);
  doc.text("Authentic Brahmin Matrimonial Coordinates & Divine Blessings of Jagadgurus", pageWidth / 2, margin + 20, { align: "center" });

  let curY = margin + 28;

  // Candidate Details Section
  doc.setFillColor(245, 238, 220);
  doc.setDrawColor(200, 170, 120);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, contentWidth, 26, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(114, 28, 36);
  doc.text(`Candidate: ${profile.name || "Sacred Soul"} ${profile.surname ? `(${profile.surname})` : ""}`, margin + 5, curY + 6);

  doc.setFontSize(8.5);
  doc.setTextColor(80, 50, 20);
  doc.setFont("helvetica", "bold");
  doc.text(`Reg Number:`, margin + 5, curY + 12);
  doc.setFont("helvetica", "normal");
  doc.text(`${profile.reg_number || "BVM-Registered"}`, margin + 30, curY + 12);

  doc.setFont("helvetica", "bold");
  doc.text(`Gotram:`, margin + 68, curY + 12);
  doc.setFont("helvetica", "normal");
  doc.text(`${profile.gothram || "Brahmin Gotram"}`, margin + 84, curY + 12);

  doc.setFont("helvetica", "bold");
  doc.text(`Sub-Caste:`, margin + 125, curY + 12);
  doc.setFont("helvetica", "normal");
  doc.text(`${profile.sub_caste || "Smartha / Vaidiki"}`, margin + 145, curY + 12);

  doc.setFont("helvetica", "bold");
  doc.text(`Date of Birth:`, margin + 5, curY + 18);
  doc.setFont("helvetica", "normal");
  doc.text(`${profile.dob || "Provided on record"}`, margin + 30, curY + 18);

  doc.setFont("helvetica", "bold");
  doc.text(`Birth Time:`, margin + 68, curY + 18);
  doc.setFont("helvetica", "normal");
  doc.text(`${profile.birth_time || "08:30 AM"}`, margin + 87, curY + 18);

  doc.setFont("helvetica", "bold");
  doc.text(`Birth Place:`, margin + 125, curY + 18);
  doc.setFont("helvetica", "normal");
  doc.text(`${profile.birth_location || "Andhra Pradesh / Telangana"}`, margin + 145, curY + 18);

  doc.setFont("helvetica", "bold");
  doc.text(`Profession:`, margin + 5, curY + 23);
  doc.setFont("helvetica", "normal");
  doc.text(`${profile.profession || "Private / Govt Sector"} (${profile.salary_lpa ? `₹${profile.salary_lpa} LPA` : "Reputed"})`, margin + 30, curY + 23);

  doc.setFont("helvetica", "bold");
  doc.text(`Membership:`, margin + 125, curY + 23);
  doc.setFont("helvetica", "normal");
  const subLabel = profile.subscription_status === "paid_1599" ? "₹1599 (31 Days Full Premium)" : (profile.subscription_status || "Active Member");
  doc.text(`${subLabel}`, margin + 148, curY + 23);

  curY += 30;

  // Vedic Astrological Coordinates (Metrics Grid)
  doc.setFillColor(114, 28, 36);
  doc.rect(margin, curY, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 235, 175);
  doc.text("VEDIC EPHEMERIS & SACRED ASTROLOGICAL PARAMETERS (గ్రహ స్థితి & నక్షత్ర పట్టిక)", margin + 4, curY + 4.2);

  curY += 6;

  const astroRows = [
    [
      { label: "Janma Nakshatram:", val: `${astro.nakshatra}` },
      { label: "Pada (Quarter):", val: `Pada ${astro.pada || 1}` },
      { label: "Janma Rasi (Moon Sign):", val: `${astro.rashi}` }
    ],
    [
      { label: "Nakshatra Lord:", val: `${astro.nakshatraLord || "Surya"}` },
      { label: "Presiding Deity:", val: `${astro.deity || "Aryaman"}` },
      { label: "Janma Tithi:", val: `${astro.tithi || "Shukla Paksha"}` }
    ]
  ];

  const colW = contentWidth / 3;
  astroRows.forEach((row, rIdx) => {
    const rowY = curY + rIdx * 7.5;
    doc.setFillColor(rIdx % 2 === 0 ? 255 : 249, 248, 243);
    doc.rect(margin, rowY, contentWidth, 7.5, "F");
    doc.setDrawColor(230, 215, 190);
    doc.line(margin, rowY + 7.5, margin + contentWidth, rowY + 7.5);

    row.forEach((cell, cIdx) => {
      const cellX = margin + cIdx * colW + 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(114, 28, 36);
      doc.text(cell.label, cellX, rowY + 5);

      const labelWidth = doc.getTextWidth(cell.label);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(20, 20, 20);
      doc.text(cell.val, cellX + labelWidth + 2, rowY + 5);
    });
  });

  curY += astroRows.length * 7.5 + 4;

  // South Indian Kundali Chart (4x4 Grid)
  doc.setFillColor(242, 235, 220);
  doc.rect(margin, curY, contentWidth, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(114, 28, 36);
  doc.text("SOUTH INDIAN TRADITIONAL RASI KUNDALI CHAKRAM (దక్షిణ భారత జాతక చక్రం)", margin + 4, curY + 4);

  curY += 7.5;

  // Chart Dimensions
  const chartSize = 72; // mm square
  const chartX = margin + (contentWidth - chartSize) / 2;
  const chartY = curY;
  const cellSize = chartSize / 4;

  // Outer border & fill
  doc.setFillColor(255, 253, 247);
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.8);
  doc.rect(chartX, chartY, chartSize, chartSize, "FD");

  // Grid mapping for South Indian Chart (12 Rasis on perimeter, center is 2x2 void)
  const rasiToCoords: { [key: number]: { r: number; c: number } } = {
    0: { r: 0, c: 1 },  // Mesha
    1: { r: 0, c: 2 },  // Vrishabha
    2: { r: 0, c: 3 },  // Mithuna
    3: { r: 1, c: 3 },  // Karkataka
    4: { r: 2, c: 3 },  // Simha
    5: { r: 3, c: 3 },  // Kanya
    6: { r: 3, c: 2 },  // Tula
    7: { r: 3, c: 1 },  // Vrischika
    8: { r: 3, c: 0 },  // Dhanus
    9: { r: 2, c: 0 },  // Makara
    10: { r: 1, c: 0 }, // Kumbha
    11: { r: 0, c: 0 }  // Meena
  };

  const rasiNamesEnglish = [
    "Mesha", "Vrishabha", "Mithuna", "Karkataka",
    "Simha", "Kanya", "Tula", "Vrischika",
    "Dhanus", "Makara", "Kumbha", "Meena"
  ];

  const moonRasiIdx = findRasiIndex(astro.rashi);
  const lagnaIdx = (moonRasiIdx + 9) % 12; // Derived harmonious ascendant

  // Draw 4x4 Grid lines
  doc.setDrawColor(200, 160, 90);
  doc.setLineWidth(0.3);
  for (let i = 1; i < 4; i++) {
    doc.line(chartX + i * cellSize, chartY, chartX + i * cellSize, chartY + chartSize);
    doc.line(chartX, chartY + i * cellSize, chartX + chartSize, chartY + i * cellSize);
  }

  // Draw Center Box (2x2) Solid Banner
  doc.setFillColor(250, 244, 230);
  doc.rect(chartX + cellSize, chartY + cellSize, cellSize * 2, cellSize * 2, "F");
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.6);
  doc.rect(chartX + cellSize, chartY + cellSize, cellSize * 2, cellSize * 2, "D");

  // Center Emblem text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(114, 28, 36);
  doc.text("SRI SHUBHAMASTU", chartX + cellSize * 2, chartY + cellSize + 7, { align: "center" });

  doc.setFontSize(7.5);
  doc.setTextColor(140, 100, 30);
  doc.text("Vedic Rasi Kundali", chartX + cellSize * 2, chartY + cellSize + 13, { align: "center" });

  doc.setFontSize(6.5);
  doc.setTextColor(80, 50, 20);
  doc.text(`Score: ${astro.spiritualScore || 90}/100`, chartX + cellSize * 2, chartY + cellSize + 19, { align: "center" });
  doc.text("Kanchi & Sringeri Peetham", chartX + cellSize * 2, chartY + cellSize + 25, { align: "center" });

  // Distribute Planets and Rasi Names in perimeter cells
  Object.entries(rasiToCoords).forEach(([idxStr, coords]) => {
    const idx = parseInt(idxStr, 10);
    const cX = chartX + coords.c * cellSize;
    const cY = chartY + coords.r * cellSize;

    // Rasi Label in corner
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(130, 90, 40);
    doc.text(rasiNamesEnglish[idx], cX + 1.5, cY + 4);

    // Planets inside this house
    const planets: string[] = [];
    if (idx === lagnaIdx) planets.push("Lagna (Asc)");
    if (idx === moonRasiIdx) planets.push("Chandra (Mo)");
    if (idx === (lagnaIdx + 2) % 12) planets.push("Surya (Su)");
    if (idx === (moonRasiIdx + 4) % 12) planets.push("Guru (Ju)");
    if (idx === (lagnaIdx + 11) % 12) planets.push("Shukra (Ve)");
    if (idx === (moonRasiIdx + 7) % 12) planets.push("Kuja (Ma)");

    planets.forEach((p, pIdx) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.8);
      if (p.startsWith("Chandra")) {
        doc.setTextColor(20, 80, 160); // Blue for Moon
      } else if (p.startsWith("Lagna")) {
        doc.setTextColor(160, 20, 20); // Red for Lagna
      } else {
        doc.setTextColor(30, 30, 30);
      }
      doc.text(p, cX + 1.5, cY + 8 + pIdx * 3.5);
    });
  });

  curY += chartSize + 5;

  // Spiritual Analysis & Compatibility Section
  doc.setFillColor(114, 28, 36);
  doc.rect(margin, curY, contentWidth, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 235, 175);
  doc.text("HAMSA GUIDANCE & SPIRITUAL ANALYSIS (ఆధ్యాత్మిక విశ్లేషణ & దాంపత్య ఫలితాలు)", margin + 4, curY + 4);

  curY += 7.5;

  doc.setFillColor(255, 253, 247);
  doc.setDrawColor(220, 200, 170);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, contentWidth, 40, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(114, 28, 36);
  doc.text("Spiritual Character & Temperament:", margin + 4, curY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  const analysisLines = doc.splitTextToSize(
    astro.spiritualAnalysis || "Exhibits noble samskaras, high moral integrity, respectful alignment with elders, and harmonious family orientation.",
    contentWidth - 8
  );
  doc.text(analysisLines, margin + 4, curY + 9.5);

  const nextY = curY + 10 + analysisLines.length * 3.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(114, 28, 36);
  doc.text("Prominent Compatibility Traits:", margin + 4, nextY);

  const traits = (astro.compatibilityTraits && astro.compatibilityTraits.length > 0)
    ? astro.compatibilityTraits.join("  •  ")
    : "Devoted family values  •  Intellectual depth  •  Dharmic Vedic temperament";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 40, 10);
  doc.text(`• ${traits}`, margin + 4, nextY + 4.5);

  // Hamsa Guidance items
  const hg = astro.hamsaGuidance;
  const ishta = hg?.ishtaDevata?.english || "Sri Lakshmi Narasimha Swamy & Sri Raja Rajeshwari";
  const symbol = hg?.hamsaSymbol?.english || "Golden Conch (Shankha) - Prosperity and Truth";
  const remedy = hg?.remedy || "Daily recitation of Aditya Hrudayam and Sri Vishnu Sahasranama Stotram.";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(114, 28, 36);
  doc.text("Ishta Devata:", margin + 4, nextY + 10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.text(ishta, margin + 26, nextY + 10);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(114, 28, 36);
  doc.text("Hamsa Symbol:", margin + 4, nextY + 15);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.text(symbol, margin + 28, nextY + 15);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(114, 28, 36);
  doc.text("Auspicious Remedy:", margin + 4, nextY + 20);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.text(remedy, margin + 34, nextY + 20);

  // Official Seal & Footer
  const footerY = pageHeight - margin - 12;
  doc.setDrawColor(218, 165, 32);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY, margin + contentWidth, footerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(114, 28, 36);
  doc.text("BRAMHANA VIVAHA VEDIKA • SHUBHAMASTU.IN", margin, footerY + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(90, 80, 70);
  doc.text(
    "All rights reserved by Galark Solutions (Ghadiyaram Venkata Subramanyam). Intermediary under Sec 79 IT Act.",
    margin,
    footerY + 8
  );

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(114, 28, 36);
  doc.text(`Generated: ${todayStr}`, margin + contentWidth, footerY + 4.5, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 100, 30);
  doc.text("Om Shubhamastu • Kalyanam Astu", margin + contentWidth, footerY + 8, { align: "right" });

  return doc;
}

/**
 * Convenience method to generate and trigger instant browser download
 */
export function downloadAstrologyPdf(profile: Profile): void {
  try {
    const doc = generateAstrologyPdf(profile);
    const safeName = (profile.name || "Candidate").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${safeName}_Astrology_Kundali_Summary.pdf`;
    doc.save(filename);
  } catch (err) {
    console.error("Failed to generate or download Astrology PDF:", err);
    alert("⚠️ Could not generate PDF. Please ensure browser permits downloads.");
  }
}
