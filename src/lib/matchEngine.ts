import { Profile } from "../types";

export interface MatchScoreDetails {
  totalScore: number;
  astrologyScore: number;
  casteScore: number;
  professionScore: number;
  heightScore: number;
  ageScore: number;
  verificationScore: number;
  gunaPoints: number; // Simulated Ashtakoota Milan (out of 36)
  ganaHarmony: "Auspicious (ఉత్తమ)" | "Moderate (మధ్యమ)" | "Challenging (సాధారణ)";
  milanAnalysis: string;
  prosperousTraits: string[];
}

// 27 Nakshatras lookup metadata
export interface NakshatraMetadata {
  nakshatra: string;
  lord: string;
  gana: "Deva" | "Manushya" | "Rakshasa";
  deity: string;
  rashi: string;
}

export const NAKSHATRAS_MAP: Record<string, NakshatraMetadata> = {
  ashwini: { nakshatra: "Ashwini", lord: "Ketu", gana: "Deva", deity: "Ashwini Kumaras", rashi: "Mesha (Aries)" },
  bharani: { nakshatra: "Bharani", lord: "Venus", gana: "Manushya", deity: "Yama", rashi: "Mesha (Aries)" },
  krittika: { nakshatra: "Krittika", lord: "Sun", gana: "Rakshasa", deity: "Agni", rashi: "Mesha/Vrishabha" },
  rohini: { nakshatra: "Rohini", lord: "Moon", gana: "Manushya", deity: "Brahma", rashi: "Vrishabha (Taurus)" },
  mrigasira: { nakshatra: "Mrigasira", lord: "Mars", gana: "Deva", deity: "Chandra", rashi: "Vrishabha/Mithuna" },
  ardra: { nakshatra: "Ardra", lord: "Rahu", gana: "Manushya", deity: "Rudra", rashi: "Mithuna (Gemini)" },
  punarvasu: { nakshatra: "Punarvasu", lord: "Jupiter", gana: "Deva", deity: "Aditi", rashi: "Mithuna/Karka" },
  pushyami: { nakshatra: "Pushyami", lord: "Saturn", gana: "Deva", deity: "Brihaspati", rashi: "Karka (Cancer)" },
  ashlesha: { nakshatra: "Ashlesha", lord: "Mercury", gana: "Rakshasa", deity: "Sarpa", rashi: "Karka (Cancer)" },
  makha: { nakshatra: "Makha", lord: "Ketu", gana: "Rakshasa", deity: "Pitrus", rashi: "Simha (Leo)" },
  poorvaphalguni: { nakshatra: "Poorvaphalguni", lord: "Venus", gana: "Manushya", deity: "Bhaga", rashi: "Simha (Leo)" },
  uttaraphalguni: { nakshatra: "Uttaraphalguni", lord: "Sun", gana: "Manushya", deity: "Aryaman", rashi: "Simha/Kanya" },
  hasta: { nakshatra: "Hasta", lord: "Moon", gana: "Deva", deity: "Savitur", rashi: "Kanya (Virgo)" },
  chitra: { nakshatra: "Chitra", lord: "Mars", gana: "Rakshasa", deity: "Vishwakarma", rashi: "Kanya/Tula" },
  swati: { nakshatra: "Swati", lord: "Rahu", gana: "Deva", deity: "Vayu", rashi: "Tula (Libra)" },
  vishakha: { nakshatra: "Vishakha", lord: "Jupiter", gana: "Rakshasa", deity: "Indra-Agni", rashi: "Tula/Vrischika" },
  anuradha: { nakshatra: "Anuradha", lord: "Saturn", gana: "Deva", deity: "Mitra", rashi: "Vrischika (Scorpio)" },
  jyeshta: { nakshatra: "Jyeshta", lord: "Mercury", gana: "Rakshasa", deity: "Indra", rashi: "Vrischika (Scorpio)" },
  moola: { nakshatra: "Moola", lord: "Ketu", gana: "Rakshasa", deity: "Nirriti", rashi: "Dhanus (Sagittarius)" },
  poorvashadha: { nakshatra: "Poorvashadha", lord: "Venus", gana: "Manushya", deity: "Apah", rashi: "Dhanus (Sagittarius)" },
  uttarashadha: { nakshatra: "Uttarashadha", lord: "Sun", gana: "Manushya", deity: "Viswadevas", rashi: "Dhanus/Makara" },
  sravanam: { nakshatra: "Sravanam", lord: "Moon", gana: "Deva", deity: "Vishnu", rashi: "Makara (Capricorn)" },
  dhanishta: { nakshatra: "Dhanishta", lord: "Mars", gana: "Rakshasa", deity: "Vasus", rashi: "Makara/Kumbha" },
  shatabhisham: { nakshatra: "Shatabhisham", lord: "Rahu", gana: "Rakshasa", deity: "Varuna", rashi: "Kumbha (Aquarius)" },
  poorvabhadra: { nakshatra: "Poorvabhadra", lord: "Jupiter", gana: "Manushya", deity: "Aja Ekapada", rashi: "Kumbha/Meena" },
  uttarabhadra: { nakshatra: "Uttarabhadra", lord: "Saturn", gana: "Deva", deity: "Ahirbudhnya", rashi: "Meena (Pisces)" },
  revati: { nakshatra: "Revati", lord: "Mercury", gana: "Deva", deity: "Pushan", rashi: "Meena (Pisces)" },
};

// Clean helper to find matching metadata
export function getNakshatraInfo(name: string | undefined): NakshatraMetadata | null {
  if (!name) return null;
  const key = name.trim().toLowerCase().replace(/[^a-z]/g, "");
  return NAKSHATRAS_MAP[key] || null;
}

// Age calculation helper
const calculateAge = (dobString: string): number => {
  if (!dobString) return 28;
  const birthDate = new Date(dobString);
  const difference = Date.now() - birthDate.getTime();
  const ageDate = new Date(difference);
  return Math.abs(ageDate.getUTCFullYear() - 1970) || 28;
};

/**
 * Calculates a complete, detailed, highly robust matching compatibility scorecard
 * between two profiles.
 */
export function calculateMatchScore(pA: Profile, pB: Profile): MatchScoreDetails {
  let astrologyScore = 60; // Base score
  let casteScore = 70;
  let professionScore = 65;
  let heightScore = 75;
  let ageScore = 75;
  let verificationScore = 50;

  let gunaPoints = 18; // Base average (18 out of 36)
  let ganaHarmony: "Auspicious (ఉత్తమ)" | "Moderate (మధ్యమ)" | "Challenging (సాధారణ)" = "Moderate (మధ్యమ)";
  let milanAnalysis = "Stable cosmic indicators. Good prospects for peaceful family life.";
  const prosperousTraits: string[] = [];

  // 1. ASTROLOGY DETAILS (Nakshatras & Ganas alignment)
  const nakshatraA = pA.astrology?.nakshatra || pA.nakshatram;
  const nakshatraB = pB.astrology?.nakshatra || pB.nakshatram;

  const infoA = getNakshatraInfo(nakshatraA);
  const infoB = getNakshatraInfo(nakshatraB);

  if (infoA && infoB) {
    // Gana Matching (Deva, Manushya, Rakshasa)
    const ganaA = infoA.gana;
    const ganaB = infoB.gana;

    if (ganaA === ganaB) {
      ganaHarmony = "Auspicious (ఉత్తమ)";
      astrologyScore = 95;
      gunaPoints = 28 + Math.floor(Math.random() * 6); // 28-33 points
      milanAnalysis = `Exceptional ${ganaA} Gana matching! The stars reflect high alignment of thoughts, ideals, and spiritual core. Highly auspicious pairing.`;
      prosperousTraits.push(`Perfect Gana Match (${ganaA} ↔ ${ganaB})`);
    } else if (
      (ganaA === "Deva" && ganaB === "Manushya") ||
      (ganaA === "Manushya" && ganaB === "Deva")
    ) {
      ganaHarmony = "Auspicious (ఉత్తమ)";
      astrologyScore = 85;
      gunaPoints = 22 + Math.floor(Math.random() * 5); // 22-26 points
      milanAnalysis = "Deva and Manushya Ganas create beautiful complementary vibrations. High emotional intelligence and traditional values exist.";
      prosperousTraits.push("Harmonious Deva-Manushya Gana resonance");
    } else if (
      (ganaA === "Rakshasa" && ganaB === "Manushya") ||
      (ganaA === "Manushya" && ganaB === "Rakshasa")
    ) {
      ganaHarmony = "Moderate (మధ్యమ)";
      astrologyScore = 60;
      gunaPoints = 16 + Math.floor(Math.random() * 5); // 16-20 points
      milanAnalysis = "Manushya and Rakshasa Ganas require maturity and alignment. Some spiritual adjustments recommended.";
      prosperousTraits.push("Balanced Lunar Tithi alignments");
    } else {
      // Deva + Rakshasa
      ganaHarmony = "Challenging (సాధారణ)";
      astrologyScore = 45;
      gunaPoints = 10 + Math.floor(Math.random() * 5); // 10-14 points
      milanAnalysis = "Deva and Rakshasa Ganas might require consultation or guidance according to traditional customs. Consulting family elders is recommended.";
    }

    // Gotra validation (Gotra separation is mandatory for Brahmins!)
    if (pA.gothram && pB.gothram) {
      if (pA.gothram.trim().toLowerCase() === pB.gothram.trim().toLowerCase()) {
        astrologyScore = Math.max(30, astrologyScore - 40); // Penalty for sagotra marriage
        milanAnalysis += " WARNING: Same Gotram (Sagotra) detected. Please check with your family elders according to traditions.";
      } else {
        astrologyScore = Math.min(100, astrologyScore + 8);
        prosperousTraits.push(`Excellent Gotra Separation (${pA.gothram} ↔ ${pB.gothram})`);
      }
    }
  } else {
    // Fallback if no astrology info found
    const defaultScore = pA.astrology?.spiritualScore || pB.astrology?.spiritualScore || 75;
    astrologyScore = defaultScore;
    gunaPoints = Math.round((defaultScore * 36) / 100);
    if (gunaPoints >= 24) ganaHarmony = "Auspicious (ఉత్తమ)";
    else if (gunaPoints >= 16) ganaHarmony = "Moderate (మధ్యమ)";
    else ganaHarmony = "Challenging (సాధారణ)";
  }

  // 2. CASTE & SUB-CASTE ALIGNMENT (Brahmin caste matching - "both good" aspect)
  if (pA.sub_caste && pB.sub_caste) {
    if (pA.sub_caste.trim().toLowerCase() === pB.sub_caste.trim().toLowerCase()) {
      casteScore = 100;
      prosperousTraits.push(`Perfect Brahmin Sub-Caste Harmony (${pA.sub_caste})`);
    } else {
      casteScore = 80;
      prosperousTraits.push(`Inter-Brahmin Alliance (${pA.sub_caste} ↔ ${pB.sub_caste})`);
    }
  }

  // 3. PROFESSION, INCOME & PARTNER PREFERENCES ALIGNMENT ("both good" and preference matching)
  let prefMatchBonus = 0;
  
  // Check B's expectations against A's profile
  if (pB.partner_expectation_type) {
    const pBpref = pB.partner_expectation_type.toLowerCase();
    const aProf = (pA.profession || "").toLowerCase();
    const aSalary = pA.salary_lpa || 0;

    if (pBpref.includes("housewife") || pBpref.includes("గృహిణి")) {
      if (aProf.includes("housewife") || aProf.includes("home") || aProf === "") {
        prefMatchBonus += 15;
        prosperousTraits.push("Groom's preference for Housewife matched");
      }
    } else if (pBpref.includes("working") || pBpref.includes("proffision") || pBpref.includes("profession") || pBpref.includes("ఉద్యోగిని") || pBpref.includes("తప్పనిసరి")) {
      if (aProf !== "" && !aProf.includes("housewife")) {
        prefMatchBonus += 15;
        prosperousTraits.push("Groom's preference for Working Partner matched");
      }
    } else if (pBpref.includes("settled") || pBpref.includes("high income") || pBpref.includes("స్థిరపడిన")) {
      if (aSalary >= 12) {
        prefMatchBonus += 15;
        prosperousTraits.push("Bride's expectation of Well-Settled Groom met");
      }
    } else if (pBpref.includes("any") || pBpref.includes("ఏదైనా")) {
      prefMatchBonus += 10;
    }
  }

  // Check A's expectations against B's profile
  if (pA.partner_expectation_type) {
    const pApref = pA.partner_expectation_type.toLowerCase();
    const bProf = (pB.profession || "").toLowerCase();
    const bSalary = pB.salary_lpa || 0;

    if (pApref.includes("housewife") || pApref.includes("గృహిణి")) {
      if (bProf.includes("housewife") || bProf.includes("home") || bProf === "") {
        prefMatchBonus += 15;
      }
    } else if (pApref.includes("working") || pApref.includes("proffision") || pApref.includes("profession") || pApref.includes("ఉద్యోగిని") || pApref.includes("తప్పనిసరి")) {
      if (bProf !== "" && !bProf.includes("housewife")) {
        prefMatchBonus += 15;
      }
    } else if (pApref.includes("settled") || pApref.includes("high income") || pApref.includes("స్థిరపడిన")) {
      if (bSalary >= 12) {
        prefMatchBonus += 15;
      }
    } else if (pApref.includes("any") || pApref.includes("ఏదైనా")) {
      prefMatchBonus += 10;
    }
  }

  // CHECK INCOME RANGE PREFERENCES (LPA SEGMENTS)
  const checkLpaPref = (p1: Profile, p2: Profile) => {
    if (!p1.partner_lpa_pref || p1.partner_lpa_pref === "No Preference") return 5;
    const sal2 = p2.salary_lpa || 0;
    const pref = p1.partner_lpa_pref;
    if (pref === "< 6 LPA" && sal2 < 6) return 10;
    if (pref === "6 - 12 LPA" && sal2 >= 6 && sal2 <= 12) return 10;
    if (pref === "12 - 18 LPA" && sal2 > 12 && sal2 <= 18) return 10;
    if (pref === "18 - 24 LPA" && sal2 > 18 && sal2 <= 24) return 10;
    if (pref === "24+ LPA" && sal2 > 24) return 10;
    // Legacy support
    if (pref === "0-6 LPA" && sal2 <= 6) return 10;
    if (pref === "7-13 LPA" && sal2 >= 7 && sal2 <= 13) return 10;
    if (pref === "14-30 LPA" && sal2 >= 14 && sal2 <= 30) return 10;
    if (pref === "30-60 LPA" && sal2 >= 30 && sal2 <= 60) return 10;
    if (pref === "60+ LPA" && sal2 >= 60) return 10;
    return 0;
  };
  const lpaMatchA = checkLpaPref(pA, pB);
  const lpaMatchB = checkLpaPref(pB, pA);
  if (lpaMatchA > 5 || lpaMatchB > 5) {
    prefMatchBonus += 10;
    prosperousTraits.push("Desired partner income bracket matched");
  }

  // CHECK WORKING SHIFT PREFERENCES
  const checkShiftPref = (p1: Profile, p2: Profile) => {
    if (!p1.partner_shift_pref || p1.partner_shift_pref === "No Preference") return 5;
    const shift2 = p2.working_shift || "Day Shift (పగటి వేళ)";
    const pref = p1.partner_shift_pref;
    
    const prefLower = pref.toLowerCase();
    const shift2Lower = shift2.toLowerCase();
    
    if (prefLower.includes("day") && shift2Lower.includes("day")) return 10;
    if (prefLower.includes("night") && shift2Lower.includes("night")) return 10;
    if (prefLower.includes("flexible") || prefLower.includes("any")) return 10;
    return 0;
  };
  const shiftMatchA = checkShiftPref(pA, pB);
  const shiftMatchB = checkShiftPref(pB, pA);
  if (shiftMatchA > 5 || shiftMatchB > 5) {
    prefMatchBonus += 8;
    prosperousTraits.push("Working shifts aligned perfectly");
  }

  if (pA.salary_lpa && pB.salary_lpa) {
    const ratio = Math.min(pA.salary_lpa, pB.salary_lpa) / Math.max(pA.salary_lpa, pB.salary_lpa);
    professionScore = Math.min(100, Math.round(40 + ratio * 45 + prefMatchBonus));
    if (professionScore > 85 && prefMatchBonus > 0) {
      prosperousTraits.push("Highly compatible mutual partner expectations");
    }
  } else {
    professionScore = Math.min(100, 70 + prefMatchBonus);
  }

  // 4. HEIGHT COMPATIBILITY & PREFERENCES (Traditional perspective and user height preference)
  const heightA = pA.height_feet || 5.6;
  const heightB = pB.height_feet || 5.6;
  
  // Traditionally, Groom is slightly taller than Bride
  if (pA.gender === "Male" && pB.gender === "Female") {
    const diff = heightA - heightB;
    if (diff >= 0.2 && diff <= 0.6) {
      heightScore = 95;
    } else if (diff > 0.6) {
      heightScore = 80;
    } else if (diff < 0) {
      heightScore = 65; // Bride taller
    } else {
      heightScore = 85;
    }
  } else if (pA.gender === "Female" && pB.gender === "Male") {
    const diff = heightB - heightA;
    if (diff >= 0.2 && diff <= 0.6) {
      heightScore = 95;
    } else if (diff > 0.6) {
      heightScore = 80;
    } else if (diff < 0) {
      heightScore = 65;
    } else {
      heightScore = 85;
    }
  }

  // HEIGHT PREFERENCE CHECK
  let heightPrefBonus = 0;
  const checkHeightPref = (p1: Profile, p2: Profile) => {
    if (!p1.partner_height_diff_pref || p1.partner_height_diff_pref === "No Preference") return 4;
    const h1 = p1.height_feet || 5.4;
    const h2 = p2.height_feet || 5.4;
    const pref = p1.partner_height_diff_pref;
    if (pref === "Taller" && h2 > h1) return 10;
    if (pref === "Shorter" && h2 < h1) return 10;
    if (pref === "Similar Height" && Math.abs(h2 - h1) <= 0.2) return 10;
    if (pref === "Within 3 inches" && Math.abs(h2 - h1) <= 0.25) return 10;
    return 0; // Not matched
  };
  const hPrefA = checkHeightPref(pA, pB);
  const hPrefB = checkHeightPref(pB, pA);
  if (hPrefA > 4 || hPrefB > 4) {
    heightPrefBonus += 5;
    prosperousTraits.push("Perfect height preference match");
  }
  heightScore = Math.min(100, heightScore + heightPrefBonus);

  // 5. AGE ALIGNMENT (Optimized per traditional Brahmin rules: Groom 2-3 years elder, Bride cannot be older)
  const ageA = calculateAge(pA.dob);
  const ageB = calculateAge(pB.dob);
  
  const groomAge = pA.gender === "Male" ? ageA : ageB;
  const brideAge = pA.gender === "Male" ? ageB : ageA;
  const ageDifference = groomAge - brideAge;

  if (ageDifference === 2 || ageDifference === 3) {
    ageScore = 100;
    prosperousTraits.push("Perfect Traditional Alignment: Groom is exactly 2-3 years elder (వరుడు 2-3 సంవత్సరాలు పెద్ద)");
  } else if (ageDifference >= 1 && ageDifference <= 5) {
    ageScore = 95;
    prosperousTraits.push("Optimal Traditional Age Difference: Groom is 1-5 years elder");
  } else if (ageDifference > 5 && ageDifference <= 8) {
    ageScore = 75;
    prosperousTraits.push("Acceptable Age Difference (Groom is 6-8 years elder)");
  } else if (ageDifference < 0) {
    ageScore = 30; // Severe mismatch penalty
    // Mismatch warning will be displayed in Milan analysis
  } else {
    ageScore = 50;
  }

  // Update milanAnalysis if there is a severe age mismatch
  if (ageDifference < 0) {
    milanAnalysis = "Age disparity warning: Traditionally, the bride should not be older than the groom (వరునికంటే వధువు వయసు ఎక్కువ ఉండరాదు).";
  } else if (ageDifference === 2 || ageDifference === 3) {
    milanAnalysis = "Excellent planetary and physical coordinates. Ideal traditional age difference of 2-3 years ensures supreme marital harmony.";
  }

  // 6. PROFILE COMPLETENESS & VERIFICATION ("profile both good")
  let items = 0;
  if (pB.photo_url) items++;
  if (pB.photo_url_2) items++;
  if (pB.kundali_url) items++;
  if (pB.status === "Verified" || pB.status === "Premium") items += 2;
  
  verificationScore = Math.min(100, 40 + items * 12);
  if (pB.status === "Premium") {
    verificationScore = 100;
    prosperousTraits.push("Premium Matrimonist: Verified Contact and Kundali Checked");
  } else if (pB.status === "Verified") {
    prosperousTraits.push("Verified Candidate Member");
  }

  // Overall Match Calculation (weighted average)
  const totalScore = Math.round(
    astrologyScore * 0.35 +
    casteScore * 0.15 +
    professionScore * 0.15 +
    heightScore * 0.12 +
    ageScore * 0.13 +
    verificationScore * 0.1
  );

  return {
    totalScore,
    astrologyScore,
    casteScore,
    professionScore,
    heightScore,
    ageScore,
    verificationScore,
    gunaPoints,
    ganaHarmony,
    milanAnalysis,
    prosperousTraits: prosperousTraits.slice(0, 4), // keep top 4
  };
}
