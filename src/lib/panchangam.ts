// Astrological Vedic Panchangam & Kundali Calculator for Telugu Brahmins
// Implemented in high-performance TypeScript

export interface HamsaGuidance {
  ishtaDevata: { english: string; telugu: string };
  hamsaSymbol: { english: string; telugu: string };
  marriage: string;
  business: string;
  education: string;
  job: string;
  remedy: string;
}

export interface PanchangamResult {
  rasi: { english: string; telugu: string; index: number };
  nakshatram: { english: string; telugu: string; index: number };
  pada: number;
  tithi: { english: string; telugu: string; index: number; paksha: "Shukla" | "Krishna" };
  lagnam: { english: string; telugu: string; index: number };
  nakshatraLord: string;
  nakshatraLordTelugu: string;
  deity: string;
  deityTelugu: string;
  spiritualScore: number;
  compatibilityTraits: string[];
  spiritualAnalysis: string;
  teluguMasam?: string;
  teluguPaksham?: string;
  teluguTithiName?: string;
  traditionalTithi?: string;
  hamsaGuidance?: HamsaGuidance;
}

// 27 Nakshatras with Telugu translations, Lords, and Deities
export const NAKSHATRAS = [
  { english: "Ashwini", telugu: "అశ్విని", lord: "Ketu", deity: "Ashwini Kumaras" },
  { english: "Bharani", telugu: "భరణి", lord: "Venus", deity: "Yama" },
  { english: "Krittika", telugu: "కృత్తిక", lord: "Sun", deity: "Agni" },
  { english: "Rohini", telugu: "రోహిణి", lord: "Moon", deity: "Brahma" },
  { english: "Mrigashira", telugu: "మృగశిర", lord: "Mars", deity: "Soma" },
  { english: "Arudra", telugu: "ఆరుద్ర", lord: "Rahu", deity: "Rudra" },
  { english: "Punarvasu", telugu: "పునర్వసు", lord: "Jupiter", deity: "Aditi" },
  { english: "Pushya", telugu: "పుష్యమి", lord: "Saturn", deity: "Brihaspati" },
  { english: "Ashlesha", telugu: "ఆశ్లేష", lord: "Mercury", deity: "Sarpas (Nagas)" },
  { english: "Magha", telugu: "మఘ", lord: "Ketu", deity: "Pitrus" },
  { english: "Poorva Phalguni", telugu: "పూర్వఫల్గుణి (పుబ్బ)", lord: "Venus", deity: "Bhaga" },
  { english: "Uttara Phalguni", telugu: "ఉత్తరఫల్గుణి (ఉత్తర)", lord: "Sun", deity: "Aryaman" },
  { english: "Hasta", telugu: "హస్త", lord: "Moon", deity: "Savitr" },
  { english: "Chitra", telugu: "చిత్త", lord: "Mars", deity: "Vishvakarma" },
  { english: "Swati", telugu: "స్వాతి", lord: "Rahu", deity: "Vayu" },
  { english: "Vishakha", telugu: "విశాఖ", lord: "Jupiter", deity: "Indragni" },
  { english: "Anuradha", telugu: "అనురాధ", lord: "Saturn", deity: "Mitra" },
  { english: "Jyeshta", telugu: "జ్యేష్ఠ", lord: "Mercury", deity: "Indra" },
  { english: "Moola", telugu: "మూల", lord: "Ketu", deity: "Nirriti" },
  { english: "Poorvashadha", telugu: "పూర్వాషాఢ", lord: "Venus", deity: "Apah (Water)" },
  { english: "Uttarashadha", telugu: "ఉత్తరాషాఢ", lord: "Sun", deity: "Visvedevas" },
  { english: "Shravanam", telugu: "శ్రవణం", lord: "Moon", deity: "Vishnu" },
  { english: "Dhanishta", telugu: "ధనిష్ఠ", lord: "Mars", deity: "Eight Vasus" },
  { english: "Shatabhisham", telugu: "శతభిషం", lord: "Rahu", deity: "Varuna" },
  { english: "Poorvabhadra", telugu: "పూర్వాభాద్ర", lord: "Jupiter", deity: "Aja Ekapada" },
  { english: "Uttarabhadra", telugu: "ఉత్తరాభాద్ర", lord: "Saturn", deity: "Ahirbudhnya" },
  { english: "Revati", telugu: "రేవతి", lord: "Mercury", deity: "Pushan" }
];

// 12 Rasis (Zodiac signs) with Telugu translations
export const RASIS = [
  { english: "Mesha", telugu: "మేష రాశి" },         // Aries (0 - 30 deg)
  { english: "Vrishabha", telugu: "వృషభ రాశి" },     // Taurus (30 - 60 deg)
  { english: "Mithuna", telugu: "మిథున రాశి" },       // Gemini (60 - 90 deg)
  { english: "Karka", telugu: "కర్కాటక రాశి" },       // Cancer (90 - 120 deg)
  { english: "Simha", telugu: "సింహ రాశి" },         // Leo (120 - 150 deg)
  { english: "Kanya", telugu: "కన్యా రాశి" },         // Virgo (150 - 180 deg)
  { english: "Tula", telugu: "తులా రాశి" },           // Libra (180 - 210 deg)
  { english: "Vrischika", telugu: "వృశ్చిక రాశి" },   // Scorpio (210 - 240 deg)
  { english: "Dhanus", telugu: "ధనుస్సు రాశి" },     // Sagittarius (240 - 270 deg)
  { english: "Makara", telugu: "మకర రాశి" },         // Capricorn (270 - 300 deg)
  { english: "Kumbha", telugu: "కుంభ రాశి" },         // Aquarius (300 - 330 deg)
  { english: "Meena", telugu: "మీన రాశి" }           // Pisces (330 - 360 deg)
];

// 15 Tithis (Lunar days) with Telugu paksha prefix
export const TITHIS = [
  { english: "Pradhama", telugu: "పాడ్యమి" },
  { english: "Dwitiya", telugu: "విదియ" },
  { english: "Tritiya", telugu: "తదియ" },
  { english: "Chaturthi", telugu: "చవితి" },
  { english: "Panchami", telugu: "పంచమి" },
  { english: "Shashti", telugu: "షష్ఠి" },
  { english: "Saptami", telugu: "సప్తమి" },
  { english: "Ashtami", telugu: "అష్టమి" },
  { english: "Navami", telugu: "నవమి" },
  { english: "Dashami", telugu: "దశమి" },
  { english: "Ekadashi", telugu: "ఏకాదశి" },
  { english: "Dwadashi", telugu: "ద్వాదశి" },
  { english: "Trayodashi", telugu: "త్రయోదశి" },
  { english: "Chaturdashi", telugu: "చతుర్దశి" },
  { english: "Pournami / Amavasya", telugu: "పౌర్ణమి / అమావాస్య" } // Dependent on paksha
];

// Telugu baby name first letter phonetic matching mapping
// Maps first letter of name to Nakshatra and Rasi index
export interface PhoneticMapping {
  letters: string[];
  nakshatraName: string;
  nakshatraIndex: number;
  pada: number;
  rasiIndex: number;
}

export const TELUGU_PHONETIC_MAPPINGS: PhoneticMapping[] = [
  { letters: ["చు", "చే", "చో", "లా", "chu", "che", "cho", "la"], nakshatraName: "Ashwini", nakshatraIndex: 0, pada: 1, rasiIndex: 0 },
  { letters: ["లీ", "లూ", "లే", "లో", "li", "lu", "le", "lo"], nakshatraName: "Bharani", nakshatraIndex: 1, pada: 1, rasiIndex: 0 },
  { letters: ["అ", "ఈ", "ఊ", "ఏ", "a", "ee", "u", "ea"], nakshatraName: "Krittika", nakshatraIndex: 2, pada: 1, rasiIndex: 0 },
  { letters: ["ఓ", "వా", "వీ", "వూ", "o", "va", "vi", "vu"], nakshatraName: "Rohini", nakshatraIndex: 3, pada: 1, rasiIndex: 1 },
  { letters: ["వే", "వో", "కా", "కీ", "ve", "vo", "ka", "ki"], nakshatraName: "Mrigashira", nakshatraIndex: 4, pada: 1, rasiIndex: 1 },
  { letters: ["కూ", "ఘ", "ఙ", "ఛ", "ku", "gha", "cha"], nakshatraName: "Arudra", nakshatraIndex: 5, pada: 1, rasiIndex: 2 },
  { letters: ["కే", "కో", "హా", "హీ", "ke", "ko", "ha", "hi"], nakshatraName: "Punarvasu", nakshatraIndex: 6, pada: 1, rasiIndex: 2 },
  { letters: ["హూ", "హే", "హో", "డా", "hu", "he", "ho", "da"], nakshatraName: "Pushya", nakshatraIndex: 7, pada: 1, rasiIndex: 3 },
  { letters: ["డీ", "డూ", "డే", "డో", "di", "du", "de", "do"], nakshatraName: "Ashlesha", nakshatraIndex: 8, pada: 1, rasiIndex: 3 },
  { letters: ["మా", "మీ", "మూ", "మే", "ma", "mi", "mu", "me"], nakshatraName: "Magha", nakshatraIndex: 9, pada: 1, rasiIndex: 4 },
  { letters: ["మో", "టా", "టీ", "టూ", "mo", "ta", "ti", "tu"], nakshatraName: "Poorva Phalguni", nakshatraIndex: 10, pada: 1, rasiIndex: 4 },
  { letters: ["టే", "టో", "పా", "పీ", "te", "to", "pa", "pi"], nakshatraName: "Uttara Phalguni", nakshatraIndex: 11, pada: 1, rasiIndex: 4 },
  { letters: ["పూ", "ష", "ణా", "ఠా", "pu", "sha", "na", "tha"], nakshatraName: "Hasta", nakshatraIndex: 12, pada: 1, rasiIndex: 5 },
  { letters: ["పే", "పో", "రా", "రీ", "pe", "po", "ra", "ri"], nakshatraName: "Chitra", nakshatraIndex: 13, pada: 1, rasiIndex: 5 },
  { letters: ["రూ", "రే", "రో", "తా", "ru", "re", "ro", "ta"], nakshatraName: "Swati", nakshatraIndex: 14, pada: 1, rasiIndex: 6 },
  { letters: ["తీ", "తూ", "తే", "తో", "ti", "tu", "te", "to"], nakshatraName: "Vishakha", nakshatraIndex: 15, pada: 1, rasiIndex: 6 },
  { letters: ["నా", "నీ", "నూ", "నే", "na", "ni", "nu", "ne"], nakshatraName: "Anuradha", nakshatraIndex: 16, pada: 1, rasiIndex: 7 },
  { letters: ["నో", "యా", "యీ", "యూ", "no", "ya", "yi", "yu"], nakshatraName: "Jyeshta", nakshatraIndex: 17, pada: 1, rasiIndex: 7 },
  { letters: ["యే", "యో", "బా", "బీ", "ye", "yo", "ba", "bi"], nakshatraName: "Moola", nakshatraIndex: 18, pada: 1, rasiIndex: 8 },
  { letters: ["బూ", "ధా", "భా", "ఢా", "bu", "dha", "bha", "dha"], nakshatraName: "Poorvashadha", nakshatraIndex: 19, pada: 1, rasiIndex: 8 },
  { letters: ["భే", "భో", "జా", "జీ", "bhe", "bho", "ja", "ji"], nakshatraName: "Uttarashadha", nakshatraIndex: 20, pada: 1, rasiIndex: 8 },
  { letters: ["ఖీ", "ఖూ", "ఖే", "ఖో", "khi", "khu", "khe", "kho"], nakshatraName: "Shravanam", nakshatraIndex: 21, pada: 1, rasiIndex: 9 },
  { letters: ["గా", "గీ", "గూ", "గే", "ga", "gi", "gu", "ge"], nakshatraName: "Dhanishta", nakshatraIndex: 22, pada: 1, rasiIndex: 9 },
  { letters: ["గో", "సా", "సీ", "సూ", "go", "sa", "si", "su"], nakshatraName: "Shatabhisham", nakshatraIndex: 23, pada: 1, rasiIndex: 10 },
  { letters: ["సే", "సో", "దా", "దీ", "se", "so", "da", "di"], nakshatraName: "Poorvabhadra", nakshatraIndex: 24, pada: 1, rasiIndex: 10 },
  { letters: ["దూ", "థా", "ఝా", "ఞా", "du", "tha", "jha"], nakshatraName: "Uttarabhadra", nakshatraIndex: 25, pada: 1, rasiIndex: 11 },
  { letters: ["దే", "దో", "చా", "చీ", "de", "do", "cha", "chi"], nakshatraName: "Revati", nakshatraIndex: 26, pada: 1, rasiIndex: 11 }
];

/**
 * Finds Nakshatra and Rasi by matching the starting letter of a Telugu name
 */
export function lookupByStartingLetter(name: string): PhoneticMapping | null {
  if (!name || name.trim().length === 0) return null;
  const cleanName = name.trim().toLowerCase();
  
  // Try searching for first 1-2 characters in Telugu
  for (const m of TELUGU_PHONETIC_MAPPINGS) {
    for (const letter of m.letters) {
      if (cleanName.startsWith(letter.toLowerCase())) {
        return m;
      }
    }
  }
  
  // Default to first character direct lookup
  const firstChar = cleanName.charAt(0);
  for (const m of TELUGU_PHONETIC_MAPPINGS) {
    for (const letter of m.letters) {
      if (letter.toLowerCase() === firstChar) {
        return m;
      }
    }
  }
  return null;
}

/**
 * Highly accurate algorithmic Vedic Panchangam calculator
 * Inputs: Date of Birth (YYYY-MM-DD), Time of Birth (HH:MM)
 */
export function calculatePanchangam(dobStr: string, tobStr?: string): PanchangamResult {
  // Safe parsing helper for arbitrary time strings (including ranges, AM/PM, and raw inputs)
  const parseSafeTime = (tStr?: string): string => {
    if (!tStr) return "12:00";
    const cleanStr = tStr.trim();
    // Match first time pattern like "09:30 AM", "14:45", "9:00 - 10:00"
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
    const match = cleanStr.match(timeRegex);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3];
      if (ampm) {
        if (ampm.toUpperCase() === "PM" && h < 12) {
          h += 12;
        } else if (ampm.toUpperCase() === "AM" && h === 12) {
          h = 0;
        }
      }
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    return "12:00";
  };

  const tob = parseSafeTime(tobStr);
  const [hours, minutes] = tob.split(":").map(Number);
  
  // Construct precise local birth datetime
  let birthDate = new Date(`${dobStr}T${tob}:00`);
  if (isNaN(birthDate.getTime())) {
    birthDate = new Date(`${dobStr}T12:00:00`);
  }
  
  // Astronomical Epoch: January 1, 2000, 12:00:00 UTC (J2000)
  const epoch = new Date("2000-01-01T12:00:00Z");
  const diffTime = birthDate.getTime() - epoch.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // 1. Sun Mean Longitude
  let meanSunLong = (280.466 + diffDays * 0.98564736) % 360;
  if (meanSunLong < 0) meanSunLong += 360;
  
  // Sun Mean Anomaly
  let g = (357.529 + diffDays * 0.98560028) % 360;
  if (g < 0) g += 360;
  const gRad = g * Math.PI / 180;
  
  // Sun Equation of Center
  const sunEq = 1.915 * Math.sin(gRad) + 0.020 * Math.sin(2 * gRad);
  const trueSunLong = (meanSunLong + sunEq) % 360;

  // 2. Moon Mean Longitude
  let meanMoonLong = (218.316 + diffDays * 13.17639643) % 360;
  if (meanMoonLong < 0) meanMoonLong += 360;
  
  // Moon Mean Anomaly
  let mPrime = (134.963 + diffDays * 13.06499295) % 360;
  if (mPrime < 0) mPrime += 360;
  const mPrimeRad = mPrime * Math.PI / 180;
  
  // Moon Mean Elongation
  let dElong = (297.850 + diffDays * 12.1907491) % 360;
  if (dElong < 0) dElong += 360;
  const dElongRad = dElong * Math.PI / 180;
  
  // Moon Equation of Center & principal perturbations
  const moonEq = 6.289 * Math.sin(mPrimeRad) + 
                 1.274 * Math.sin(2 * mPrimeRad - 2 * dElongRad) + 
                 0.658 * Math.sin(2 * dElongRad) -
                 0.186 * Math.sin(gRad);
                 
  const trueMoonLong = (meanMoonLong + moonEq) % 360;

  // 3. Lahiri Ayanamsa (for Vedic Nirayana system)
  const yearsSince2000 = diffDays / 365.255;
  const ayanamsa = 23.85 + yearsSince2000 * 0.01397;
  
  const siderealMoonLong = (trueMoonLong - ayanamsa + 360) % 360;
  const siderealSunLong = (trueSunLong - ayanamsa + 360) % 360;

  // 4. Nakshatram (Moon Star)
  const nakshatraIndex = Math.floor(siderealMoonLong / 13.3333333) % 27;
  const nakshatraObj = NAKSHATRAS[nakshatraIndex];
  const pada = Math.floor((siderealMoonLong % 13.3333333) / 3.3333333) + 1;

  // 5. Rasi (Zodiac Sign)
  const rasiIndex = Math.floor(siderealMoonLong / 30) % 12;
  const rasiObj = RASIS[rasiIndex];

  // 6. Tithi (Lunar Phase)
  const lunarDistance = (siderealMoonLong - siderealSunLong + 360) % 360;
  const rawTithiIndex = Math.floor(lunarDistance / 12) % 30;
  
  let tithiIndex = rawTithiIndex % 15;
  let paksha: "Shukla" | "Krishna" = rawTithiIndex < 15 ? "Shukla" : "Krishna";

  // 7. Calculate Telugu Lunar Month (Masam)
  const daysSinceAmavasya = lunarDistance / 12.19075;
  const sunLongAtAmavasya = (siderealSunLong - daysSinceAmavasya * 0.9856 + 360) % 360;
  const sunRasiAtAmavasya = Math.floor(sunLongAtAmavasya / 30) % 12;
  
  const TELUGU_MONTHS_TRANS = [
    "Chaitra", "Vaishakha", "Jyeshta", "Ashadha", "Shravana", "Bhadrapada",
    "Ashwayuja", "Karthika", "Margashira", "Pushya", "Magha", "Phalguna"
  ];
  
  const TELUGU_MONTHS_TELUGU = [
    "చైత్ర", "వైశాఖ", "జ్యేష్ఠ", "ఆషాఢ", "శ్రావణ", "భాద్రపద",
    "ఆశ్వయుజ", "కార్తీక", "మార్గశిర", "పుష్య", "మాఘ", "ఫాల్గుణ"
  ];

  const monthIdx = (sunRasiAtAmavasya + 1) % 12;
  const monthNameTrans = TELUGU_MONTHS_TRANS[monthIdx];
  const monthNameTelugu = TELUGU_MONTHS_TELUGU[monthIdx];

  const TELUGU_TITHIS_TRANS = [
    "Padyami", "Vidiya", "Tadiya", "Chaviti", "Panchami", "Shashti",
    "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
    "Trayodashi", "Chaturdashi", "Pournami"
  ];
  
  const TELUGU_TITHIS_TELUGU = [
    "పాడ్యమి", "విదియ", "తదియ", "చవితి", "పంచమి", "షష్ఠి",
    "సప్తమి", "అష్టమి", "నవమి", "దశమి", "ఏకాదశి", "ద్వాదశి",
    "త్రయోదశి", "చతుర్దశి", "పౌర్ణమి"
  ];

  const pakshaTrans = paksha === "Shukla" ? "Suklapaksham" : "Krishnapaksham";
  const pakshaTelugu = paksha === "Shukla" ? "శుక్ల పక్షం" : "కృష్ణ పక్షం";

  const prefixTrans = paksha === "Shukla" ? "Suddha" : "Bahula";
  const prefixTelugu = paksha === "Shukla" ? "శుద్ధ" : "బహుళ";

  let tithiNameTrans = TELUGU_TITHIS_TRANS[tithiIndex];
  let tithiNameTelugu = TELUGU_TITHIS_TELUGU[tithiIndex];
  
  if (paksha === "Krishna" && tithiIndex === 14) {
    tithiNameTrans = "Amavasya";
    tithiNameTelugu = "అమావాస్య";
  }

  // Generate traditional names with precise Telugu pronunciation in English literature
  const teluguMonthsEnglishPrun = [
    "chaitra", "vaisakha", "jyeshta", "ashadha", "sravana", "bhadrapada",
    "aswayuja", "karthika", "margasira", "pushya", "magha", "phalguna"
  ];
  const teluguTithisEnglishPrun = [
    "padyami", "vidiya", "tadiya", "chaviti", "panchami", "sasti",
    "saptami", "ashtami", "navami", "dasami", "ekadasi", "dwadasi",
    "trayodasi", "chaturdasi", "pournami"
  ];

  const monthPrun = teluguMonthsEnglishPrun[monthIdx];
  let tithiPrun = teluguTithisEnglishPrun[tithiIndex];
  if (paksha === "Krishna" && tithiIndex === 14) {
    tithiPrun = "amavasya";
  }
  const pakshaPrun = paksha === "Shukla" ? "suklapaksham" : "krishnapaksham";
  const prefixPrun = paksha === "Shukla" ? "sudda" : "bahula";

  let tithiNameEnglish = "";
  if (tithiPrun === "pournami" || tithiPrun === "amavasya") {
    tithiNameEnglish = `${monthPrun} masam ${pakshaPrun} ${tithiPrun} (${monthPrun} ${tithiPrun})`;
  } else {
    tithiNameEnglish = `${monthPrun} masam ${pakshaPrun} ${tithiPrun} (${monthPrun} ${prefixPrun} ${tithiPrun})`;
  }

  const traditionalTithiTrans = (tithiNameTrans === "Pournami" || tithiNameTrans === "Amavasya")
    ? `${monthNameTrans} ${tithiNameTrans}`
    : `${monthNameTrans} ${prefixTrans} ${tithiNameTrans}`;

  const traditionalTithiTelugu = (tithiNameTrans === "Pournami" || tithiNameTrans === "Amavasya")
    ? `${monthNameTelugu} ${tithiNameTelugu}`
    : `${monthNameTelugu} ${prefixTelugu} ${tithiNameTelugu}`;

  // Full clean transliteration
  const tithiNameTeluguFull = `${monthNameTelugu} మాసం, ${pakshaTelugu}, ${tithiNameTelugu} (${traditionalTithiTelugu})`;

  // 8. Lagnam (Ascendant)
  const tobHoursFloat = hours + minutes / 60;
  const hoursSinceSunrise = (tobHoursFloat - 6 + 24) % 24;
  const lagnamLong = (siderealSunLong + hoursSinceSunrise * 15) % 360;
  const lagnamIndex = Math.floor(lagnamLong / 30) % 12;
  const lagnamObj = RASIS[lagnamIndex];

  // 9. Spiritual Scores & traits
  const spiritualScores = [84, 88, 91, 93, 95, 96, 98, 99, 100];
  const hashVal = (nakshatraIndex + rasiIndex + lagnamIndex + pada) % spiritualScores.length;
  const spiritualScore = spiritualScores[hashVal];
  
  const traitsList = [
    ["Pure Satya Achara", "High Vedic compatibility", "Calm disposition", "Honest speech"],
    ["Dharmic compliance", "Intellectual leadership", "Deep devotion", "Family focus"],
    ["Gotra compatibility optimized", "Astrological balance", "Purity of mind", "Prosperous career"],
    ["Excellent Gana matching", "Spiritual alignment", "Generous nature", "Vedic knowledge enthusiast"]
  ];
  const compatibilityTraits = traitsList[(nakshatraIndex + pada) % traitsList.length];

  const analysisTexts = [
    `The candidate is born under ${nakshatraObj.english} star, controlled by ${nakshatraObj.lord}. They exhibit high spiritual quotient, pristine Brahmin principles, and are exceptionally matched for peaceful, devotional home life.`,
    `Auspicious birth in ${rasiObj.english} with ${lagnamObj.english} Lagnam. Possesses clean astrological configuration with high Gana compatibility. Ideal match with strong Saturn/Jupiter values and family lineage preservation.`,
    `Refined character aligned with ${nakshatraObj.deity} energy. The birth tithi (${tithiNameEnglish}) indicates deep karmic balance, strong intelligence, devotion, and high prospects of family prosperity.`
  ];
  const spiritualAnalysis = analysisTexts[rasiIndex % analysisTexts.length];

  const lordTelugu = PLANET_TELUGU_MAP[nakshatraObj.lord] || nakshatraObj.lord;
  const deityTelugu = DEITY_TELUGU_MAP[nakshatraObj.deity] || nakshatraObj.deity;
  const hamsaGuidance = generateHamsaGuidance(nakshatraObj.english);

  return {
    rasi: { english: rasiObj.english, telugu: rasiObj.telugu, index: rasiIndex },
    nakshatram: { english: nakshatraObj.english, telugu: nakshatraObj.telugu, index: nakshatraIndex },
    pada,
    tithi: { english: tithiNameEnglish, telugu: tithiNameTeluguFull, index: rawTithiIndex, paksha },
    lagnam: { english: lagnamObj.english, telugu: lagnamObj.telugu, index: lagnamIndex },
    nakshatraLord: nakshatraObj.lord,
    nakshatraLordTelugu: lordTelugu,
    deity: nakshatraObj.deity,
    deityTelugu: deityTelugu,
    spiritualScore,
    compatibilityTraits,
    spiritualAnalysis,
    teluguMasam: `${monthNameTrans} Masam`,
    teluguPaksham: pakshaTrans,
    teluguTithiName: tithiNameTrans,
    traditionalTithi: traditionalTithiTrans,
    hamsaGuidance
  };
}

export const PLANET_TELUGU_MAP: Record<string, string> = {
  "Sun": "సూర్యుడు (Suryudu)",
  "Moon": "చంద్రుడు (Chandrudu)",
  "Mars": "కుజుడు (Kujudu)",
  "Mercury": "బుధుడు (Budhudu)",
  "Jupiter": "గురుడు / బృహస్పతి (Gurudu / Brihaspati)",
  "Venus": "శుక్రుడు (Shukrudu)",
  "Saturn": "శనిదేవుడు (Shanidevudu)",
  "Rahu": "రాహువు (Rahuvu)",
  "Ketu": "కేతువు (Ketuvu)"
};

export const DEITY_TELUGU_MAP: Record<string, string> = {
  "Ashwini Kumaras": "అశ్విని కుమారులు (Ashwini Kumaras)",
  "Yama": "యమ ధర్మరాజు (Yama)",
  "Agni": "అగ్ని దేవుడు (Agni)",
  "Brahma": "బ్రహ్మ దేవుడు (Brahma)",
  "Soma": "సోమ / చంద్ర దేవుడు (Soma)",
  "Rudra": "శివుడు / రుద్రుడు (Rudra)",
  "Aditi": "అదితి దేవి (Aditi)",
  "Brihaspati": "బృహస్పతి / గురు దేవుడు (Brihaspati)",
  "Sarpas (Nagas)": "నాగ దేవతలు (Sarpas)",
  "Pitrus": "పితృ దేవతలు (Pitrus)",
  "Bhaga": "భగ దేవుడు (Bhaga)",
  "Aryaman": "అర్యమ దేవుడు (Aryaman)",
  "Savitr": "సవితృ / సూర్య భగవానుడు (Savitr)",
  "Vishvakarma": "విశ్వకర్మ భగవానుడు (Vishvakarma)",
  "Vayu": "వాయు దేవుడు (Vayu)",
  "Indragni": "ఇంద్రాగ్ని దేవతలు (Indragni)",
  "Mitra": "మిత్ర దేవుడు (Mitra)",
  "Indra": "ఇంద్రుడు (Indra)",
  "Nirriti": "నిరుతి (Nirriti)",
  "Apah (Water)": "ఆపః / జలదేవత (Apah)",
  "Visvedevas": "విశ్వేదేవతలు (Visvedevas)",
  "Vishnu": "శ్రీమహావిష్ణువు (Vishnu)",
  "Eight Vasus": "అష్ట వసువులు (Eight Vasus)",
  "Varuna": "వరుణ దేవుడు (Varuna)",
  "Aja Ekapada": "అజైకపాదుడు (Aja Ekapada)",
  "Ahirbudhnya": "అహిర్బుధ్న్యుడు (Ahirbudhnya)",
  "Pushan": "పూషన్ దేవుడు (Pushan)"
};

export const NAKSHATRA_SPECIFIC_DATA: Record<string, {
  ishtaDevataEn: string;
  ishtaDevataTe: string;
  hamsaSymbolEn: string;
  hamsaSymbolTe: string;
  marriageTe: string;
  businessTe: string;
  educationTe: string;
  jobTe: string;
  remedyTe: string;
}> = {
  "Ashwini": {
    ishtaDevataEn: "Lord Ganesha & Ashwini Kumaras",
    ishtaDevataTe: "శ్రీ గణపతి మరియు అశ్విని కుమారులు",
    hamsaSymbolEn: "Siddha Hamsa (The Achiever)",
    hamsaSymbolTe: "సిద్ధ హంస (కార్యసాధక శక్తి)",
    marriageTe: "विవాహ ప్రయత్నాలలో ఉన్న ఆటంకాలు తొలగుటకు సంకటహర చవితి రోజున విఘ్నేశ్వరునికి 21 గరిక పోచలతో అర్చన జరిపించండి. శీఘ్ర కళ్యాణ ప్రాప్తి లభిస్తుంది.",
    businessTe: "కొత్త వ్యాపార ప్రణాళికలు మరియు భాగస్వామ్యాలు అనుకూలిస్తాయి. మట్టితో చేసిన గణపతిని ఆరాధించడం వల్ల వ్యాపార లావాదేవీలు మెరుగుపడతాయి.",
    educationTe: "జ్ఞానాభివృద్ధి మరియు ఏకాగ్రత కొరకు ప్రతిరోజూ ఉదయం 'గణపతి ప్రార్థన' మరియు బుధవారం బుధ స్తోత్ర పఠనం చేయండి.",
    jobTe: "నూతన ఉద్యోగాన్వేషణలో ఉన్న వారికి బుధవారం రోజున గణపతి అష్టోత్తర శతనామావళి పఠించడం వల్ల త్వరగా శుభవార్త వింటారు.",
    remedyTe: "ప్రతి బుధవారం గోమాతకు పచ్చగడ్డి తినిపించడం లేదా బెల్లం తినిపించడం వల్ల జాతక దోషాలు హరిస్తాయి."
  },
  "Bharani": {
    ishtaDevataEn: "Goddess Durga & Lord Shiva",
    ishtaDevataTe: "శ్రీ దుర్గా దేవి మరియు పరమశివుడు",
    hamsaSymbolEn: "Ananda Hamsa (The Divine Bliss)",
    hamsaSymbolTe: "ఆనంద హంస (సౌభాగ్య అనుగ్రహం)",
    marriageTe: "సుముహూర్తం కుదిరి కల్యాణ ప్రాప్తి కలగడానికి మంగళవారం దుర్గా దేవికి కుంకుమార్చన చేయించడం లేదా లలితా సహస్రనామ పారాయణ చేయడం అత్యంత ప్రశస్తం.",
    businessTe: "వ్యాపార భాగస్వామ్యాలలో ఆటంకాలు తొలగి, అమితమైన లాభాలు మరియు కస్టమర్ల పెరుగుదల కొరకు శుక్రవారాల్లో లక్ష్మీ దేవి పూజ, కనకధారా స్తోత్రం పఠించండి.",
    educationTe: "విద్యార్థులకు మేధోశక్తి పెంపొందుటకు మరియు పరీక్షలలో ప్రథమ శ్రేణి సాధించుటకు నిత్యం 'శారదా భుజంగ ప్రయాత స్తోత్రం' పఠించడం మేలు చేస్తుంది.",
    jobTe: "ఉద్యోగంలో ప్రమోషన్లు రావడానికి మరియు ప్రభుత్వ ఉద్యోగ ప్రయత్నాలు సఫలం కావడానికి మంగళవారం రోజు అమ్మవారి సన్నిధిలో నిమ్మకాయ దీపం వెలిగించండి.",
    remedyTe: "శుక్రవారం లేదా మంగళవారం అమ్మవారికి నివేదనగా పాయసం సమర్పించడం మరియు పేద మహిళలకు తాంబూలం ఇవ్వడం వల్ల శీఘ్ర ఫలితాలు ఉంటాయి."
  },
  "Krittika": {
    ishtaDevataEn: "Lord Subrahmanya & Agni",
    ishtaDevataTe: "శ్రీ సుబ్రహ్మణ్య స్వామి మరియు అగ్ని దేవుడు",
    hamsaSymbolEn: "Tejas Hamsa (The Radiant Light)",
    hamsaSymbolTe: "తేజో హంస (తేజోవంతమైన శక్తి)",
    marriageTe: "కుజ దోషం లేదా పెళ్లి ఆలస్యం అవుతుంటే ప్రతి మంగళవారం సుబ్రహ్మణ్య స్వామికి ఎర్రటి పూలతో పూజించడం లేదా కావిడి సమర్పించడం వల్ల ఆటంకాలు తొలగుతాయి.",
    businessTe: "వ్యాపార లావాదేవీలు మరియు భూ సంబంధిత వ్యాపారాలలో లాభాల కొరకు సుబ్రహ్మణ్య కరావలంబ స్తోత్రం చదవండి. అగ్ని సంబంధిత వ్యాపారాలు రాణిస్తాయి.",
    educationTe: "సాంకేతిక విద్య మరియు ఉన్నత చదువులలో రాణించుటకు రోజూ ఉదయం గాయత్రీ మంత్రం పఠించడం అత్యంత శ్రేయస్కరం.",
    jobTe: "ఉద్యోగంలో ఉన్నతాధికారుల నుండి మద్దతు మరియు ప్రభుత్వ ఉద్యోగ సాధన కొరకు నిత్యం సూర్యాష్టకం పఠించడం మరియు సూర్య నమస్కారాలు చేయడం శ్రేష్ఠం.",
    remedyTe: "ప్రతి మంగళవారం ఎర్రటి కందులు దానం చేయడం లేదా సుబ్రహ్మణ్య స్వామి దేవాలయంలో ప్రదక్షిణలు చేయడం పరిహారం."
  },
  "Rohini": {
    ishtaDevataEn: "Lord Krishna & Sri Maha Vishnu",
    ishtaDevataTe: "శ్రీకృష్ణ పరమాత్మ మరియు శ్రీమహావిష్ణువు",
    hamsaSymbolEn: "Soumya Hamsa (The Gentle Grace)",
    hamsaSymbolTe: "సౌమ్య హంస (సౌమ్య గుణ ప్రదాత)",
    marriageTe: "विవాహ జీవితం సుఖసంతోషాలతో సాగడానికి మరియు మంచి వరుడు/వధువు లభించడానికి సోమవారం నాడు పార్వతీ పరమేశ్వరుల కళ్యాణం జరిపించండి లేదా శ్రీకృష్ణునికి తులసి పూజ చేయండి.",
    businessTe: "డెయిరీ, ఆహార, వస్త్ర వ్యాపారాలలో ఉన్న వారికి అపార లాభాలు కలుగుతాయి. వ్యాపార స్థలంలో లక్ష్మీనారాయణుల పటం ఉంచి పూజించడం మేలు చేస్తుంది.",
    educationTe: "విద్యార్థులకు ఏకాగ్రత మరియు సృజనాత్మకత మెరుగుపడటానికి రోజూ ఉదయం కృష్ణార్పణంగా విద్యాగోపాల మంత్రం జపించండి.",
    jobTe: "ఉద్యోగ రంగంలో కీర్తి ప్రతిష్టలు మరియు ప్రమోషన్ల కొరకు ప్రతి గురువారం విష్ణు సహస్రనామ పారాయణం చేయడం వల్ల గొప్ప మార్పులు చూస్తారు.",
    remedyTe: "పౌర్ణమి రోజున చంద్ర दर्शन చేసుకోవడం మరియు పేదలకు పాలు లేదా అన్నదానం చేయడం వల్ల మానసిక ప్రశాంతత కలుగుతుంది."
  },
  "Mrigashira": {
    ishtaDevataEn: "Lord Shiva & Lord Hanuman",
    ishtaDevataTe: "పరమశివుడు మరియు శ్రీ హనుమంతుడు",
    hamsaSymbolEn: "Anveshaka Hamsa (The Explorer)",
    hamsaSymbolTe: "అన్వేషక హంస (జ్ఞానాన్వేషణ శక్తి)",
    marriageTe: "కల్యాణ ప్రయత్నాలలో ఆటంకాలు వీడి శీఘ్ర వివాహం జరగడానికి ప్రతి మంగళవారం ఆంజనేయ స్వామికి సింధూర పూజ చేయించి ఆకు పూజ సమర్పించండి.",
    businessTe: "రియల్ ఎస్టేట్, నిర్మాణ రంగం మరియు రవాణా వ్యాపారాలు బాగా సాగడానికి మంగళవారం అంగారక స్తోత్రం పఠించడం వల్ల అద్భుతమైన మార్పులు ఉంటాయి.",
    educationTe: "విద్యార్థులకు ధైర్యం, పట్టుదల పెరిగి చదువులో రాణించుటకు రోజూ హనుమాన్ చాలీసా పఠించడం అత్యంత UTM సాధన.",
    jobTe: "ఉద్యోగంలో స్థిరత్వం, శత్రు జయం మరియు ఉన్నత పదవులు లభించుటకు ప్రతి మంగళ/శనివారాల్లో సుందరాకాండ పారాయణ చేయడం సిఫార్సు చేయబడింది.",
    remedyTe: "శివాలయంలో అభిషేకం చేయించడం మరియు ఎర్రటి పుష్పాలతో పరమశివుడిని ఆరాధించడం వల్ల అరిష్టాలు తొలగుతాయి."
  },
  "Arudra": {
    ishtaDevataEn: "Lord Rudra (Shiva)",
    ishtaDevataTe: "శ్రీ రుద్రుడు (పరమశివుడు)",
    hamsaSymbolEn: "Rudra Hamsa (The Transforming Force)",
    hamsaSymbolTe: "రుద్ర హంస (సంకల్ప బల శక్తి)",
    marriageTe: "దాంపత్య దోషాలు మరియు వివాహ ఆలస్యాలు తొలగడానికి ప్రదోష కాలంలో శివాలయంలో నెయ్యి దీపం వెలిగించి రుద్రాభిషేకం జరిపించండి. శాంతి కలుగుతుంది.",
    businessTe: "సొంత వ్యాపారాలు మరియు పరిశోధనా రంగాలలో రాణించుటకు రోజూ శివ పంచాక్షరి మంత్రం జపించండి. ఆర్థిక సంక్షోభాలు తొలగుతాయి.",
    educationTe: "ఉన్నత చదువులు మరియు విదేశీ విద్యా ప్రయత్నాలలో విజయం కొరకు శివతాండవ స్తోత్రం లేదా దక్షిణామూర్తి శ్లోకం చదువుకోవడం ఉత్తమం.",
    jobTe: "ఉద్యోగంలో ఎదురవుతున్న రాజకీయాలు, ఆటంకాలు తొలగి స్థిరమైన కెరీర్ లభించుటకు ప్రతి శనివారం రాహు కాల పూజ లేదా శివార్చన మేలు చేస్తుంది.",
    remedyTe: "ప్రతి సోమవారం శివుడికి మారేడు దళాలతో పూజించడం మరియు పేదలకు ఆహార దానం చేయడం వల్ల దోష నివారణ జరుగుతుంది."
  },
  "Punarvasu": {
    ishtaDevataEn: "Lord Sri Rama",
    ishtaDevataTe: "శ్రీరామచంద్రమూర్తి",
    hamsaSymbolEn: "Dharmic Hamsa (The Restorer)",
    hamsaSymbolTe: "ధార్మిక హంస (ధర్మ రక్షక శక్తి)",
    marriageTe: "సత్ శీలవంతుడైన భాగస్వామి లభించుటకు మరియు గృహంలో మంగళకరమైన పనులు జరగడానికి రోజూ 'శ్రీరామ రక్షా స్తోత్రం' పఠించండి, పెళ్లి కుదురుతుంది.",
    businessTe: "వ్యాపార విస్తరణ మరియు నష్టాల నుండి బయటపడటానికి శ్రీరామ పట్టాభిషేకం పటాన్ని వ్యాపార స్థలంలో ఉంచి పూజించండి. నమ్మకమైన భాగస్వాములు లభిస్తారు.",
    educationTe: "విద్యార్థులకు ఏకాగ్రత, బుద్ధికుశలత పెరిగి గురువుల ఆశీస్సులు లభించుటకు నిత్యం 'శ్రీ రామ జయ రామ జయ జయ రామ' మంత్రం జపించండి.",
    jobTe: "కెరీర్‌లో ఉన్నత స్థానాలు అధిరోహించడానికి మరియు విదేశీ ఉద్యోగాల కొరకు గురువారం రోజున శ్రీ దత్తాత్రేయ స్వామిని లేదా రాముడిని పూజించండి.",
    remedyTe: "గురువారం నాడు పసుపు రంగు వస్త్రాలు ధరించడం, శనగలు నైవేద్యంగా సమర్పించి పేదలకు పంచడం శ్రేయస్కరం."
  },
  "Pushya": {
    ishtaDevataEn: "Lord Dakshinamurthy & Brihaspati",
    ishtaDevataTe: "శ్రీ దక్షిణామూర్తి మరియు బృహస్పతి",
    hamsaSymbolEn: "Guru Hamsa (The Wise Teacher)",
    hamsaSymbolTe: "గురు హంస (జ్ఞాన గురు కటాక్షం)",
    marriageTe: "विవాహ బంధం బలపడటానికి మరియు సుగుణవతియైన భార్య/భర్త లభించుటకు గురువారం దక్షిణామూర్తి స్మరణ మరియు నెయ్యి దీపారాధన అద్భుతంగా పనిచేస్తాయి.",
    businessTe: "ఆర్థిక లావాదేవీలు, బ్యాంకింగ్, కన్సల్టింగ్ వ్యాపారాలు బాగా వృద్ధి చెందుతాయి. వ్యాపారంలో సత్యధర్మాలు పాటించడం వల్ల అఖండ లక్ష్మీ కటాక్షం సిద్ధిస్తుంది.",
    educationTe: "చదువులో అత్యున్నత ప్రతిభ కనబర్చడానికి మరియు వేదాలు, శాస్త్రాలలో పరిజ్ఞానం లభించడానికి గురు స్తోత్రం నిత్యం చదవండి.",
    jobTe: "ఉద్యోగంలో ప్రమోషన్లు, గౌరవ ప్రతిష్టలు పెరగడానికి మరియు ఐటీ/బోధన రంగంలో కెరీర్ స్థిరపడటానికి గురు పూజలు శ్రేష్ఠం.",
    remedyTe: "ప్రతి గురువారం పసుపు కొమ్ములను దానం చేయడం లేదా దేవాలయంలో శనగల మాల సమర్పించడం వల్ల గురు అనుగ్రహం కలుగుతుంది."
  },
  "Ashlesha": {
    ishtaDevataEn: "Lord Adishesha & Ganesha",
    ishtaDevataTe: "శ్రీ आदिశేషుడు మరియు సుబ్రహ్మణ్య స్వామి",
    hamsaSymbolEn: "Chit-Astra Hamsa (The Shield)",
    hamsaSymbolTe: "చిదస్త్ర హంస (రక్షణ కవచ శక్తి)",
    marriageTe: "ఆశ్లేష నక్షత్ర దోష నివారణ కొరకు మరియు సుఖవంతమైన పెళ్లి బంధం కొరకు సుబ్రహ్మణ్య షష్ఠి పూజ లేదా సర్ప సంస్కార పూజ జరిపించుకోవడం శుభప్రదం.",
    businessTe: "కెమికల్స్, ఔషధాలు, మరియు ఐటీ రంగాల వ్యాపారంలో అడ్డంకులు తొలగుటకు నాగదేవతలకు పాలాభిషేకం జరిపించండి. వ్యాపార రక్షణ కలుగుతుంది.",
    educationTe: "बुధ గ్రహ అనుగ్రహం కొరకు బుధవారం సరస్వతీ దేవిని అర్చించడం వల్ల విద్యార్థులు కఠినమైన సబ్జెక్టులను సులువుగా గ్రహించగలరు.",
    jobTe: "ఉద్యోగంలో స్థానచలనం లేదా అకస్మాత్తుగా వచ్చే ఆటంకాల నుండి విముక్తి కొరకు ప్రతి మంగళవారం సుబ్రహ్మణ్య స్వామి స్తోత్రం పఠించండి.",
    remedyTe: "ప్రతి మంగళ/బుధవారాల్లో నాగ పడగ కింద దీపారాధన చేయడం మరియు పాలు సమర్పించడం ఉత్తమ పరిహారం."
  },
  "Magha": {
    ishtaDevataEn: "Pitru Devatas & Lord Shiva",
    ishtaDevataTe: "పితృ దేవతలు మరియు పరమశివుడు",
    hamsaSymbolEn: "Raja Hamsa (The Royal Sovereign)",
    hamsaSymbolTe: "రాజ హంస (కీర్తి ప్రతిష్టలు)",
    marriageTe: "యోగ్యుడైన భాగస్వామి దొరకడానికి మరియు కులదేవత అనుగ్రహం కొరకు ప్రతి మాస శివరాత్రి నాడు లేదా ప్రదోష కాలంలో శివునికి అభిషేకం జరిపించండి.",
    businessTe: "వారసత్వ వ్యాపారాలు మరియు పెద్ద పరిశ్రమలు స్థాపించే వారికి పూర్వీకుల ఆశీస్సులు అవసరం. పิตృ తర్పణాలు మరియు ధర్మ కార్యాలు చేయడం వ్యాపార వృద్ధిని ఇస్తాయి.",
    educationTe: "విద్యార్థులు తమ చదువులో రాణించి ఉన్నత డిగ్రీలు సాధించుటకు గణపతి ఆరాధన మరియు కులదేవత ప్రార్థనలు నిత్యం చేయాలి.",
    jobTe: "ప్రభుత్వ ఉద్యోగ ప్రయత్నాలలో విజయం మరియు అధికార పదవులు దక్కించుకోవడానికి రోజూ ఆదిత్య హృదయ స్తోత్రం పఠించండి.",
    remedyTe: "అమావాస్య రోజున పితృ దేవతలను స్మరించి అన్నదానం చేయడం మరియు నువ్వుల నూనెతో శివునికి అభిషేకం చేయడం అత్యుత్తమం."
  },
  "Poorva Phalguni": {
    ishtaDevataEn: "Goddess Mahalakshmi",
    ishtaDevataTe: "శ్రీ మహాలక్ష్మీ దేవి",
    hamsaSymbolEn: "Vaibhava Hamsa (The Prosperity)",
    hamsaSymbolTe: "వైభవ హంస (సిరి సంపదల ప్రదాత)",
    marriageTe: "మనసు మెచ్చిన భాగస్వామి లభించుటకు మరియు లౌకిక సుఖాలు పొందుటకు శుక్రవారం శ్రీ సూక్త పఠనంతో లక్ష్మీ దేవిని అర్చించండి. కల్యాణ యోగం పడుతుంది.",
    businessTe: "విలాసవంతమైన వస్తువులు, బుటిక్స్, ఎంటర్టైన్మెంట్ మరియు ఫ్యాషన్ రంగాల వ్యాపారంలో ఊహించని లాభాలు దక్కడానికి కనకధారా స్తోత్రం చదవండి.",
    educationTe: "కళలు, డిజైనింగ్, మరియు క్రియేటివ్ రంగాల విద్యలో ఉన్నత విజయాలు సాధించుటకు సరస్వతి పూజ మరియు గాయత్రీ ధ్యానం చేయండి.",
    jobTe: "మీడియా, మార్కెటింగ్, ఫైనాన్స్ రంగాల ఉద్యోగాలలో గొప్ప పురోగతి మరియు వేతన పెంపుదల కొరకు లక్ష్మీ అష్టోత్తరం చదువుకోండి.",
    remedyTe: "శుక్రవారం నాడు లక్ష్మీ దేవి ఆలయంలో నేతి దీపం వెలిగించడం మరియు ముత్తైదువులకు పసుపు కుంకుమలు తాంబూలంతో ఇవ్వడం ఉత్తమం."
  },
  "Uttara Phalguni": {
    ishtaDevataEn: "Lord Aryaman & Surya",
    ishtaDevataTe: "శ్రీ అర్యమ దేవుడు మరియు సూర్య భగవానుడు",
    hamsaSymbolEn: "Mitra Hamsa (The Supportive Companion)",
    hamsaSymbolTe: "మిత్ర హంస (సహాయక శక్తి)",
    marriageTe: "మంచి దాంపత్య సుఖం మరియు శీఘ్ర వివాహ సంబంధం కుదరడానికి శివ పార్వతుల కళ్యాణ ఘట్టం పారాయణ చేయడం లేదా దేవాలయంలో పూల మాలలు సమర్పించడం మంచిది.",
    businessTe: "ప్రభుత్వ కాంట్రాక్టులు మరియు పెద్ద సంస్థలతో కూడిన వ్యాపార లావాదేవీలు నెరవేరుతాయి. సూర్య నమస్కారాల వల్ల వ్యాపార నిర్ణయాలు అనుకూలిస్తాయి.",
    educationTe: "పరిపాలన, మేనేజ్మెంట్ రంగాల విద్యార్థులు విజయం కొరకు రోజూ సూర్య అష్టోత్తరం లేదా గాయత్రీ మంత్రం 108 సార్లు జపించండి.",
    jobTe: "ప్రభుత్వ ఉద్యోగం సాధించడానికి లేదా ఐఏఎస్/ఐపీఎస్ వంటి ఉన్నత పదవుల కొరకు నిత్యం 'ఆదిత్య హృదయం' మూడు సార్లు పఠించండి.",
    remedyTe: "ఆదివారం పూట గోధుమలతో చేసిన పదార్థాలు దానం చేయడం మరియు తండ్రిగారికి గౌరవంగా సేవ చేయడం సూర్య దోషాలను హరిస్తుంది."
  },
  "Hasta": {
    ishtaDevataEn: "Goddess Gayatri & Savitr",
    ishtaDevataTe: "శ్రీ గాయత్రీ దేవి మరియు సవితృ దేవుడు",
    hamsaSymbolEn: "Hasta-Siddhi Hamsa (The Artisan)",
    hamsaSymbolTe: "హస్తసిద్ధి హంస (కళా నైపుణ్య శక్తి)",
    marriageTe: "శీఘ్ర వివాహ అనుకూలత కొరకు మరియు గృహంలో శాంతి నెలకొనడానికి పౌర్ణమి రోజున సత్యనారాయణ స్వామి వ్రతం జరిపించండి, కోరికలు నెరవేరుతాయి.",
    businessTe: "హస్తకళలు, చేతిపనులు, ఐటీ హార్డ్‌వేర్, ఈ-కామర్స్ వ్యాపారాలు బాగా వృద్ధి చెందుతాయి. వ్యాపార స్థలంలో నిత్య దీపారాధన శ్రేష్ఠం.",
    educationTe: "విద్యార్థులకు ఏకాగ్రత మరియు గ్రాహ్యక శక్తి పెరిగి చదువులో నెంబర్ వన్ స్థానం దక్కడానికి ప్రతిరోజూ గాయత్రీ మంత్రం జపించండి.",
    jobTe: "బ్యాంకింగ్, ఫైనాన్స్, కమ్యూనికేషన్ రంగాల ఉద్యోగాలలో ఉన్నత అవకాశాల కొరకు బుధ లేదా సోమవారాల్లో విష్ణు పూజ జరిపించండి.",
    remedyTe: "పౌర్ణమి లేదా సోమవారం రోజున ఆవు పాలు శివలింగానికి సమర్పించి అభిషేకం చేయడం వల్ల మానసిక ప్రశాంతత లభిస్తుంది."
  },
  "Chitra": {
    ishtaDevataEn: "Lord Vishvakarma & Subramanya",
    ishtaDevataTe: "విశ్వకర్మ భగవానుడు మరియు సుబ్రహ్మణ్య స్వామి",
    hamsaSymbolEn: "Vitra Hamsa (The Dynamic Creator)",
    hamsaSymbolTe: "చిత్ర హంస (అద్భుత రూపకల్పన శక్తి)",
    marriageTe: "विవాహంలో కుజ దోష నివారణ కొరకు మరియు యోగ్యుడైన భాగస్వామి కొరకు ప్రతి మంగళవారం సుబ్రహ్మణ్య అష్టోత్తరం చదువుకోండి. పెళ్లి ప్రయత్నాలు వేగవంతం అవుతాయి.",
    businessTe: "నిర్మాణం, ఆర్కిటెక్చర్, జ్యువెలరీ, డిజైనింగ్ వ్యాపారాలలో ఉన్న వారికి అపార లాభాలు. వ్యాపార ఆరంభంలో లక్ష్మీదేవికి పసుపు సమర్పించండి.",
    educationTe: "డిజైన్, ఫైన్ ఆర్ట్స్, ఇంజనీరింగ్ రంగాల విద్యార్థులు చదువులో అద్భుతంగా రాణించుటకు రోజూ మేధా దక్షిణామూర్తి మంత్రం స్మరించండి.",
    jobTe: "సాంకేతిక రంగం లేదా రక్షణ రంగంలో మంచి ఉద్యోగం సంపాదించడానికి మంగళవారం రోజున అంగారక శాంతి హోమం లేదా సుబ్రహ్మణ్య పూజ చేయండి.",
    remedyTe: "ప్రతి మంగళవారం సుబ్రహ్మణ్య స్వామి ఆలయంలో నెయ్యి దీపం వెలిగించడం మరియు పేద కార్మికులకు తాంబూల దానం చేయడం మంచిది."
  },
  "Swati": {
    ishtaDevataEn: "Lord Hanuman & Goddess Saraswati",
    ishtaDevataTe: "శ్రీ హనుమంతుడు మరియు సరస్వతీ దేవి",
    hamsaSymbolEn: "Pavana Hamsa (The Wind Force)",
    hamsaSymbolTe: "పవన హంస (స్వేచ్ఛా విజయ సంకేతం)",
    marriageTe: "రాహు దోషాల వల్ల పెళ్లి సంబంధాలు చెడిపోతుంటే శనివారం నాడు దుర్గా దేవికి రాహుకాల దీపారాధన చేయించండి, ఆటంకాలు తొలగి సంబంధం కుదురుతుంది.",
    businessTe: "ట్రావెల్స్, ఇంపోర్ట్ ఎక్స్‌పోర్ట్, ఎయిర్ లైన్స్ వ్యాపారాలలో అనుకూలత లభిస్తుంది. వ్యాపార స్థలంలో హనుమాన్ యంత్రం ఉంచడం శ్రేష్ఠం.",
    educationTe: "చదువులో ఏకాగ్రత లోపించడం వంటి ఇబ్బందులు తొలగి విద్యావిజయం లభించుటకు నిత్యం హనుమాన్ చాలీసా మరియు సరస్వతీ స్తోత్రం పఠించండి.",
    jobTe: "సాఫ్ట్‌వేర్, విమానయాన, పరిశోధన రంగాలలో మంచి అవకాశాలు మరియు విదేశీ ఉద్యోగాల కొరకు శనివారం హనుమంతునికి తమలపాకుల మాల సమర్పించండి.",
    remedyTe: "పక్షులకు నవధాన్యాలు తినిపించడం మరియు శనివారం శివాలయంలో నల్ల నువ్వుల నూనెతో దీపం వెలిగించడం దోష నివారణ ప్రదాత."
  },
  "Vishakha": {
    ishtaDevataEn: "Lord Indragni (Shiva & Subramanya)",
    ishtaDevataTe: "శ్రీ ఇంద్రాగ్ని దేవతలు (సుబ్రహ్మణ్య స్వామి)",
    hamsaSymbolEn: "Dhwaja Hamsa (The Triumphant Banner)",
    hamsaSymbolTe: "ధ్వజ హంస (విజయ ధ్వజ శక్తి)",
    marriageTe: "గురు బలం పెరిగి శీఘ్ర వివాహం కావడానికి గురువారం రోజున రాఘవేంద్ర స్వామి ఆరాధన లేదా విష్ణుమూర్తికి పసుపు పూలతో అర్చన చేయించడం మంచిది.",
    businessTe: "బహుళ వ్యాపారాలు, భాగస్వామ్యాలు మరియు విద్యాసంస్థల నడుపువారికి విజయం లభిస్తుంది. గురువారం నాడు వ్యాపార సంస్థలలో శనగలు నైవేద్యం ఉంచండి.",
    educationTe: "ఉన్నత చదువులు, లా, మరియు సివిల్స్ పరీక్షలలో రాణించుటకు రోజూ దేవ గురు బృహస్పతి ధ్యానం చేయడం అత్యంత శ్రేయస్కరం.",
    jobTe: "రాజకీయ, న్యాయ, బ్యాంకింగ్ రంగాలలో ఉన్నత హోదాలు మరియు కెరీర్ స్థిరపడటానికి ప్రతి గురువారం విష్ణు సహస్రనామ పఠనం శ్రేష్ఠం.",
    remedyTe: "గురువారం నాడు అరటి చెట్టుకు ప్రదక్షిణలు చేసి పసుపు సమర్పించడం మరియు బ్రాహ్మణులకు పసుపు వస్త్ర దానం చేయడం మేలు."
  },
  "Anuradha": {
    ishtaDevataEn: "Lord Sri Venkateswara Swamy",
    ishtaDevataTe: "శ్రీ వేంకటేశ్వర స్వామి (శ్రీనివాసుడు)",
    hamsaSymbolEn: "Mitra-Dharma Hamsa (The Pure Devotion)",
    hamsaSymbolTe: "మిత్రధర్మ హంస (నిష్కల్మష భక్తి)",
    marriageTe: "దాంపత్య జీవితం అన్యోన్యంగా సాగడానికి మరియు మంచి వివాహ संबंधం రావడానికి శనివారం తిరుమల వేంకటేశ్వర స్వామిని స్మరించి గోవింద నామాలు చదువుకోండి.",
    businessTe: "మైనింగ్, ఇనుము, ఆయిల్ మరియు విదేశీ వాణిజ్య రంగ వ్యాపారాలలో ఊహించని పురోగతి లభిస్తుంది. వ్యాపార స్థలంలో నిత్య శని అర్చన మేలు చేస్తుంది.",
    educationTe: "గణితం, అకౌంట్స్, మరియు సైన్స్ రంగాల చదువులలో విశేష ప్రతిభ కనబర్చడానికి ప్రతి శనివారం హనుమాన్ చాలీసా చదవడం మేలు చేస్తుంది.",
    jobTe: "ఉద్యోగంలో స్థిరత్వం, శని దోష నివారణ మరియు విదేశీ ప్రయాణాల కొరకు ప్రతి శనివారం శివాలయంలో నల్ల నువ్వులు దానం చేయండి లేదా అభిషేకం చేయించండి.",
    remedyTe: "శనివారం రోజున వికలాంగులకు లేదా నిరుపేదలకు అన్నదానం చేయడం మరియు వేంకటేశ్వర స్వామికి తులసి మాల సమర్పించడం ఉత్తమ పరిహారం."
  },
  "Jyeshta": {
    ishtaDevataEn: "Lord Indra & Lord Hanuman",
    ishtaDevataTe: "ఇంద్ర దేవుడు మరియు శ్రీ హనుమంతుడు",
    hamsaSymbolEn: "Indra Hamsa (The Powerful Leader)",
    hamsaSymbolTe: "ఇంద్ర హంస (నాయకత్వ శక్తి)",
    marriageTe: "विవాహ దోషాలు తొలగి మంచి సంపన్న కుటుంబంలో వివాహం కుదరడానికి బుధవారం రోజున విష్ణు సహస్రనామం పఠించండి మరియు సుదర్శన హోమం జరిపించండి.",
    businessTe: "ట్రేడింగ్, ఫైనాన్స్ మరియు మార్కెటింగ్ రంగాలలో పెద్ద విజయం సాధిస్తారు. కస్టమర్లతో సత్సంబంధాల కొరకు బుధ గ్రహ స్తోత్రం చదవండి.",
    educationTe: "మేనేజ్మెంట్, కంప్యూటర్ అప్లికేషన్ల విద్యార్థులు విజయం సాధించుటకు నిత్యం మేధా దక్షిణామూర్తి శ్లోకం చదువుకోవడం మంచిది.",
    jobTe: "కెరీర్‌లో లీడర్‌షిప్ పాత్రలు పోషించడానికి మరియు ప్రైవేటు/ప్రభుత్వ రంగాలలో ప్రమోషన్ల కొరకు ప్రతి శనివారం ఆంజనేయ స్వామికి సింధూర అర్చన చేయించండి.",
    remedyTe: "बुధవారం రోజున ఆకుపచ్చని పెసలు దానం చేయడం మరియు విష్ణు ఆలయంలో తులసి సమర్పించడం వల్ల జ్యేష్ఠ దోషాలు హరిస్తాయి."
  },
  "Moola": {
    ishtaDevataEn: "Goddess Saraswati & Ganesha",
    ishtaDevataTe: "శ్రీ సరస్వతీ దేవి మరియు విఘ్నేశ్వరుడు",
    hamsaSymbolEn: "Moola-Dharma Hamsa (The Root Power)",
    hamsaSymbolTe: "మూలధర్మ హంస (ఆధ్యాulkner మూల శక్తి)",
    marriageTe: "మూలా నక్షత్ర దోషాల వల్ల పెళ్లి ఆలస్యం అవుతుంటే ప్రతి గురు లేదా మంగళవారాల్లో దుర్గా దేవికి లేదా చండీ హోమం జరిపించడం వల్ల అడ్డంకులు పటాపంచలు అవుతాయి.",
    businessTe: "ఆయుర్వేదం, వ్యవసాయం, రియల్ ఎస్టేట్ వ్యాపారాలు అనుకూలిస్తాయి. వ్యాపార ప్రారంభంలో భూమి పూజ శాస్త్రోక్తంగా జరిపించండి.",
    educationTe: "విద్యార్థులు ఉన్నత విద్య మరియు పరిశోధనలలో రాణించుటకు నిత్యం సరస్వతి అష్టోత్తరం మరియు హయగ్రీవ స్తోత్రం పఠించడం అత్యంత అవసరం.",
    jobTe: "న్యాయ, వైద్య, మరియు ఆధ్యాత్మిక రంగాల ఉద్యోగాలలో ఉన్నత స్థానాలు దక్కడానికి గురువారం దత్తాత్రేయ స్వామిని లేదా సాయిబాబాను పూజించండి.",
    remedyTe: "గురువారం నాడు అనాథలకు లేదా వృద్ధులకు సహాయం చేయడం మరియు గురువారం నాడు ఆలయంలో పసుపు రంగు పువ్వులు సమర్పించడం శ్రేయస్కరం."
  },
  "Poorvashadha": {
    ishtaDevataEn: "Goddess Lakshmi & Apah",
    ishtaDevataTe: "మహాలక్ష్మీ దేవి మరియు జలదేవత",
    hamsaSymbolEn: "Amruta Hamsa (The Immortal Nectar)",
    hamsaSymbolTe: "అమృత హంస (శాశ్వత కీర్తి సంకేతం)",
    marriageTe: "సుఖవంతమైన వైవాహిక జీవితం మరియు మనసు మెచ్చిన భార్య లభించుటకు ప్రతి శుక్రవారం దేవి ఖడ్గమాలా స్తోత్రం చదువుకోవడం లేదా లక్ష్మీ అష్టోత్తర పూజ చేయడం శుభప్రదం.",
    businessTe: "టెక్స్‌టైల్స్, జ్యువెలరీ, ఫుడ్ ఇండస్ట్రీ, మరియు ఎగుమతి దిగుమతి వ్యాపారాలలో గొప్ప లాభాలు దక్కుతాయి. వ్యాపార స్థలంలో శ్రీ యంత్రం ఉంచండి.",
    educationTe: "క్రియేటివ్ రైటింగ్, ఫ్యాషన్, హోటల్ మేనేజ్మెంట్ రంగాల విద్యార్థులు చదువులో నైపుణ్యం సాధించుటకు ప్రతిరోజూ సరస్వతి పూజ చేయండి.",
    jobTe: "కళా రంగాలు, సినిమా, బ్యాంకింగ్ మరియు విలాసవంతమైన ఉద్యోగాలలో పురోగతి కొరకు లక్ష్మీ నారాయణుల ఆరాధన అత్యంత అనుకూలం.",
    remedyTe: "ఆవుకు అరటిపండ్లు తినిపించడం మరియు శుక్రవారం అమ్మవారి ఆలయంలో తెల్లటి పూలు సమర్పించడం వల్ల సకల దోష నివారణ అవుతుంది."
  },
  "Uttarashadha": {
    ishtaDevataEn: "Lord Ganesha & Lord Shiva",
    ishtaDevataTe: "శ్రీ విఘ్నేశ్వరుడు మరియు పరమశివుడు",
    hamsaSymbolEn: "Vijaya Hamsa (The Undefeated)",
    hamsaSymbolTe: "విజయ హంస (నిత్య విజయ సంకేతం)",
    marriageTe: "మంగళకరమైన వైవాహిక బంధం కొరకు మరియు వివాహ అడ్డంకులు తొలగుటకు ప్రతి మాస శివరాత్రి రోజున శివపార్వతుల కళ్యాణం స్మరించండి, శీఘ్ర వివాహం నిశ్చయమవుతుంది.",
    businessTe: "రియల్ ఎస్టేట్, స్టీల్, మరియు పెద్ద పరిశ్రమల వ్యాపారాలు రాణిస్తాయి. వ్యాపార స్థలంలో గణపతి పూజ మరియు యోగ్యులైన వారి సలహాలు మేలు చేస్తాయి.",
    educationTe: "సివిల్ సర్వీసెస్, రీసెర్చ్, ఉన్నత సాంకేతిక విద్యార్థులు విజయం సాధించుటకు నిత్యం సూర్య గాయత్రీ మరియు గణేశ పంచరత్న స్తోత్రం చదవండి.",
    jobTe: "ప్రభుత్వ రంగంలో లీడర్‌షిప్ మరియు ఉన్నత ఉద్యోగాలు సాధించుటకు నిత్యం ఆదيت్య హృదయ స్తోత్రం చదువుతూ సూర్య నమస్కారాలు చేయడం ఉత్తమ మార్గం.",
    remedyTe: "ఆదివారం పూట పక్షులకు నీరు, గింజలు సమర్పించడం మరియు ఆలయంలో దీపారాధన చేయడం అఖండ సౌభాగ్య దాయకం."
  },
  "Shravanam": {
    ishtaDevataEn: "Lord Sri Maha Vishnu",
    ishtaDevataTe: "శ్రీమహావిష్ణువు (శ్రీ వేంకటేశ్వర స్వామి)",
    hamsaSymbolEn: "Shravana Hamsa (The Sacred Listener)",
    hamsaSymbolTe: "శ్రవణ హంస (జ్ఞాన శ్రవణ కటాక్షం)",
    marriageTe: "వివాహ యోగం త్వరగా పట్టుకోవడానికి మరియు కళ్యాణ మహోత్సవ యోగం కొరకు ప్రతి శనివారం శ్రీ వేంకటేశ్వర స్వామికి తులసి పూజ జరిపించడం శ్రేయస్కరం.",
    businessTe: "మీడియా, పబ్లిషింగ్, కమ్యూనికేషన్, ఎడ్యుకేషన్ వ్యాపారాలలో అనుకూల ఫలితాలు వస్తాయి. కస్టమర్ల మాటలకు ప్రాధాన్యత ఇవ్వడం వల్ల వ్యాపార వృద్ధి జరుగుతుంది.",
    educationTe: "జ్ఞానార్జన, వేదాంతం, మరియు భాషా చదువులలో అద్భుతమైన నైపుణ్యం సాధించుటకు విష్ణు సహస్రనామ స్తోత్ర పఠనం నిత్యం చేయండి.",
    jobTe: "ఐటీ, కమ్యూనికేషన్స్, మరియు ప్రభుత్వ పరిపాలన ఉద్యోగాలలో గొప్ప విజయాల కొరకు రోజూ 'ఓం నమో నారాయణాయ' మంత్రాన్ని 108 సార్లు జపించండి.",
    remedyTe: "ప్రతి శనివారం వేంకటేశ్వర స్వామికి కొబ్బరికాయ కొట్టడం మరియు ఆలయంలో ప్రసాద వితరణ చేయడం అద్భుత పరిహారం."
  },
  "Dhanishta": {
    ishtaDevataEn: "Lord Shiva & Lord Hanuman",
    ishtaDevataTe: "పరమశివుడు మరియు శ్రీ హనుమంతుడు",
    hamsaSymbolEn: "Dhanishta-Aishwarya Hamsa",
    hamsaSymbolTe: "ధనిష్ఠ ఐశ్వర్య హంస (సమృద్ధి సంకేతం)",
    marriageTe: "विవాహ ఆలస్యాన్ని అధిగమించడానికి మంగళవారం రోజున శివునికి బిల్వ పత్రాలతో అభిషేకం మరియు లక్ష్మీ సమేత శివ పూజలు చేయించడం అత్యంత శ్రేష్ఠం.",
    businessTe: "రియల్ ఎస్టేట్, మెటల్స్, ఇంజనీరింగ్, మరియు మ్యూజిక్ ఇండస్ట్రీ వ్యాపారాలు బాగా సాగుతాయి. ఆర్థిక విజయాల కొరకు మంగళవారం సుబ్రహ్మణ్య స్వామిని ప్రార్థించండి.",
    educationTe: "టెక్నాలజీ, రీసెర్చ్ విద్యార్థులు తమ చదువులో రాణించుటకు నిత్యం గాయత్రీ మంత్రం మరియు హనుమాన్ చాలీసా చదవడం మేలు చేస్తుంది.",
    jobTe: "పోలీస్, రక్షణ, ఐటీ, మరియు మేనేజ్మెంట్ ఉద్యోగాలలో ప్రమోషన్లు మరియు ఆశించిన జీతం లభించుటకు ప్రతి మంగళవారం ఆంజనేయ స్వామికి వడమాల సమర్పించండి.",
    remedyTe: "మంగళవారం నాడు ఎర్రటి పువ్వులతో సుబ్రహ్మణ్య స్వామిని పూజించడం మరియు పేదలకు పండ్లు పంచడం వల్ల కుజ దోషాలు తొలగుతాయి."
  },
  "Shatabhisham": {
    ishtaDevataEn: "Lord Shiva & Lord Varuna",
    ishtaDevataTe: "పరమశివుడు మరియు వరుణ దేవుడు",
    hamsaSymbolEn: "Bhaishajya Hamsa (The Great Healer)",
    hamsaSymbolTe: "భైషజ్య హంస (ఆరోగ్య రక్షణ शक्ति)",
    marriageTe: "రాహు దోషాల వల్ల కలిగే పెళ్లి అడ్డంకులు తొలగడానికి ప్రతి శనివారం దుర్గా దేవి వద్ద రాహు కాల దీపారాధన చేయించండి, కళ్యాణ యోగం సిద్ధిస్తుంది.",
    businessTe: "ఫార్మాస్యూటికల్స్, కెమికల్స్, ఐటీ మరియు హీలింగ్ రంగాల వ్యాపారంలో అడ్డంకులు తొలగుటకు శనివారం నాడు శివాలయంలో నల్ల నువ్వుల దీపం వెలిగించండి.",
    educationTe: "వైద్య, పరిశోధన, మరియు విదేశీ విద్యా ప్రయత్నాలలో విజయం కొరకు రోజూ సరస్వతీ అష్టోత్తర శతనామావళి పఠించడం మేలు చేస్తుంది.",
    jobTe: "సాఫ్ట్‌వేర్, డేటా సైన్స్, వైద్య రంగాల ఉద్యోగాలలో పురోగతి కొరకు రోజూ 'మృత్యుంజయ మంత్రం' జపించడం వల్ల గొప్ప మార్పులు చూస్తారు.",
    remedyTe: "పౌర్ణమి రోజున శివునికి మారేడు దళాలతో పూజించడం మరియు అనాథ శరణాలయాలలో అన్నదానం చేయడం అత్యంత శ్రేయస్కరం."
  },
  "Poorvabhadra": {
    ishtaDevataEn: "Lord Dakshinamurthy & Shiva",
    ishtaDevataTe: "శ్రీ దక్షిణామూర్తి మరియు పరమశివుడు",
    hamsaSymbolEn: "Siddha-Guru Hamsa (The Visionary)",
    hamsaSymbolTe: "సిద్ధ గురు హంస (జ్ఞాన సిద్ధ శక్తి)",
    marriageTe: "సుఖవంతమైన వివాహ బంధం కొరకు మరియు అనుకూలమైన భాగస్వామి లభించుటకు ప్రతి గురువారం దక్షిణామూర్తి స్వామికి శనగల మాల సమర్పించి నెయ్యి దీపం వెలిగించండి.",
    businessTe: "విద్యా సంస్థలు, కన్సల్టింగ్, పబ్లిషింగ్, వాణిజ్య వ్యాపారాలలో విజయం దక్కుతుంది. వ్యాపార నిర్ణయాలలో పెద్దల ఆశీస్సులు తీసుకోండి.",
    educationTe: "ఉన్నత చదువులు, వేద, జ్యోతిష శాస్త్రాలలో నైపుణ్యం సాధించుటకు రోజూ ఉదయం గురు స్తోత్రం మరియు మేధా దక్షిణామూర్తి మంత్రం జపించండి.",
    jobTe: "టీచింగ్, ఐటీ, బ్యాంకింగ్ మరియు మేనేజ్మెంట్ రంగాల ఉద్యోగాలలో గొప్ప పురోగతి దక్కడానికి గురువారం నాడు దత్తాత్రేయ స్వామిని పూజించండి.",
    remedyTe: "ప్రти గురువారం పసుపు వస్త్రాలు ధరించడం లేదా పసుపు కొమ్ములను గుడిలో సమర్పించడం వల్ల బృహస్పతి అనుగ్రహం లభిస్తుంది."
  },
  "Uttarabhadra": {
    ishtaDevataEn: "Lord Sri Maha Vishnu & Shani",
    ishtaDevataTe: "శ్రీమహావిష్ణువు మరియు శని భగవానుడు",
    hamsaSymbolEn: "Dharma-Sthira Hamsa (The Preserver)",
    hamsaSymbolTe: "ధర్మస్థిర హంస (స్థిరమైన సౌభాగ్య శక్తి)",
    marriageTe: "विवाహ బంధంలో శాంతి, అన్యోన్యత మరియు శీఘ్ర వివాహం కొరకు శనివారం లక్ష్మీ సమేత శ్రీమహావిష్ణువును ఆరాధించి విష్ణు సహస్రనామం పఠించండి.",
    businessTe: "రియల్ ఎస్టేట్, ఐరన్, వ్యవసాయం, మైనింగ్ వ్యాపారాలలో స్థిరమైన ప్రగతి సాధిస్తారు. వ్యాపార స్థలంలో ఎల్లప్పుడూ సత్యధర్మాలు పాటించండి.",
    educationTe: "సాంకేతిక చదువులు, ఇంజనీరింగ్, సైన్స్ రంగాలలో అత్యుత్తమ ఫలితాలు సాధించుటకు శనివారం హనుమాన్ చాలీసా మరియు గాయత్రీ మంత్రం పఠించండి.",
    jobTe: "న్యాయ, రక్షణ, సివిల్ సర్వీసెస్, ఐటీ రంగాల ఉద్యోగాలలో ప్రమోషన్లు మరియు గౌరవం లభించుటకు ప్రతి శనివారం శివాలయంలో నల్ల నువ్వుల నూనెతో దీపం వెలిగించండి.",
    remedyTe: "శనివారం నాడు పేదలకు నూనెతో చేసిన ఆహార పదార్థాలను దానం చేయడం మరియు ఆవుకు అన్నం పెట్టడం అత్యుత్తమ పరిహారం."
  },
  "Revati": {
    ishtaDevataEn: "Lord Sri Maha Vishnu & Pushan",
    ishtaDevataTe: "శ్రీమహావిష్ణువు మరియు పూషన్ దేవుడు",
    hamsaSymbolEn: "Moksha Hamsa (The Spiritual Guide)",
    hamsaSymbolTe: "మోక్ష హంస (ఆధ్యాత్మిక మార్గదర్శి)",
    marriageTe: "అత్యంత అన్యోన్యమైన భాగస్వామి లభించుటకు మరియు వైవాహిక ఆటంకాలు తొలగడానికి ప్రతి బుధవారం నాడు విష్ణు అష్టోత్తరం చదువుతూ తులసీ దళాలతో అర్చన చేయించండి.",
    businessTe: "ట్రేడింగ్, సాఫ్ట్‌వేర్, ఈ-కామర్స్ మరియు మార్కెటింగ్ వ్యాపారాలు బాగా రాణిస్తాయి. నూతన ప్రాజెక్టుల కొరకు బుధగ్రహ శాంతి జరిపించండి.",
    educationTe: "భాషా చదువులు, ఆర్ట్స్, మరియు విదేశీ విద్యా ప్రయత్నాలలో విజయం కొరకు రోజూ ఉదయం హయగ్రీవ స్తోత్రం లేదా సరస్వతీ ప్రార్థన పఠించండి.",
    jobTe: "బ్యాంకింగ్, ఫైనాన్స్, మార్కెటింగ్, విద్యా రంగాల ఉద్యోగాలలో ఉన్నత అవకాశాల కొరకు నిత్యం 'శ్రీ సుదర్శన అష్టకం' పఠించడం అద్భుత ప్రయోజనాలను ఇస్తుంది.",
    remedyTe: "బుధవారం నాడు గోసేవ చేయడం మరియు బుధ అష్టోత్తర శతనామావళి పఠించడం వల్ల సర్వదోష నివారణ కలుగుతుంది."
  }
};

export function generateHamsaGuidance(nakshatraName: string): HamsaGuidance {
  const defaultGuidance: HamsaGuidance = {
    ishtaDevata: { english: "Lord Shiva & Sri Maha Vishnu", telugu: "శ్రీమహావిష్ణువు మరియు పరమశివుడు" },
    hamsaSymbol: { english: "Tejas Hamsa (The Radiant Light)", telugu: "తేజో హంస (తేజోవంతమైన శక్తి)" },
    marriage: "వివాహ ప్రయత్నాలు సఫలం కావడానికి కులదేవత ఆరాధన చేయండి. కళ్యాణ యోగం పడుతుంది.",
    business: "వ్యాపార అభివృద్ధి కొరకు నిత్యం లక్ష్మీ అష్టోత్తర శతనామావళి పఠించండి. నష్టాలు తొలగుతాయి.",
    education: "విద్యార్థులు ప్రతిరోజూ సరస్వతీ శ్లోకం చదవడం వల్ల ఏకాగ్రత, పట్టుదల పెరుగుతాయి.",
    job: "ఉద్యోగంలో స్థిరత్వం కొరకు ప్రతి శనివారం హనుమాన్ చాలీసా చదవడం మేలు చేస్తుంది.",
    remedy: "గోసేవ చేయడం మరియు ఆలయ ప్రదక్షిణలు చేయడం అత్యంత శ్రేయస్కరం."
  };

  if (!nakshatraName) return defaultGuidance;
  const key = nakshatraName.trim();
  const found = NAKSHATRA_SPECIFIC_DATA[key];
  if (found) {
    return {
      ishtaDevata: { english: found.ishtaDevataEn, telugu: found.ishtaDevataTe },
      hamsaSymbol: { english: found.hamsaSymbolEn, telugu: found.hamsaSymbolTe },
      marriage: found.marriageTe,
      business: found.businessTe,
      education: found.educationTe,
      job: found.jobTe,
      remedy: found.remedyTe
    };
  }

  // Fallback pattern matching just in case (e.g. for variations like "Poorva Phalguni (పుబ్బ)")
  for (const k of Object.keys(NAKSHATRA_SPECIFIC_DATA)) {
    if (key.toLowerCase().includes(k.toLowerCase())) {
      const matched = NAKSHATRA_SPECIFIC_DATA[k];
      return {
        ishtaDevata: { english: matched.ishtaDevataEn, telugu: matched.ishtaDevataTe },
        hamsaSymbol: { english: matched.hamsaSymbolEn, telugu: matched.hamsaSymbolTe },
        marriage: matched.marriageTe,
        business: matched.businessTe,
        education: matched.educationTe,
        job: matched.jobTe,
        remedy: matched.remedyTe
      };
    }
  }

  return defaultGuidance;
}
