import { Profile } from "../types";

export interface MatchScoreDetails {
  totalScore: number;
  differentGothra: boolean;
  ageGapValid: boolean;
  groomAge: number;
  brideAge: number;
  ageDiff: number;
  milanAnalysis: string;
  prosperousTraits: string[];
  gunaPoints: number;
  ganaHarmony: "Auspicious (ఉత్తమ)" | "Challenging (సాధారణ)";
}

// Calculate age from Date of Birth string (YYYY-MM-DD or standard date format)
export const calculateAge = (dobString: string | undefined): number => {
  if (!dobString) return 28;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return 28;
  const difference = Date.now() - birthDate.getTime();
  const ageDate = new Date(difference);
  return Math.abs(ageDate.getUTCFullYear() - 1970) || 28;
};

/**
 * Strict 2-Rule Matching Algorithm for Shubhamastu Brahmin Matrimony (www.shubhamastu.in)
 * 
 * The matching algorithm considers ONLY TWO RULES:
 * 1. The Male and Female must have DIFFERENT Gothras (No Sagotra alliance).
 * 2. The Male is 1 to 3 years elder than the Female (1 <= Male Age - Female Age <= 3).
 */
export function calculateMatchScore(pA: Profile, pB: Profile): MatchScoreDetails {
  // Determine Male and Female
  const male = pA.gender === "Male" ? pA : pB.gender === "Male" ? pB : null;
  const female = pA.gender === "Female" ? pA : pB.gender === "Female" ? pB : null;

  // If same gender, not a match
  if (!male || !female) {
    return {
      totalScore: 0,
      differentGothra: false,
      ageGapValid: false,
      groomAge: 0,
      brideAge: 0,
      ageDiff: 0,
      milanAnalysis: "Both profiles have the same gender. Matches must be between male and female.",
      prosperousTraits: [],
      gunaPoints: 0,
      ganaHarmony: "Challenging (సాధారణ)",
    };
  }

  // 1. RULE 1: Male and Female must have DIFFERENT Gothras
  const gothraMale = (male.gothram || "").trim().toLowerCase();
  const gothraFemale = (female.gothram || "").trim().toLowerCase();
  
  let differentGothra = false;
  if (gothraMale && gothraFemale) {
    differentGothra = gothraMale !== gothraFemale;
  } else {
    // If one is not specified yet, treat as different with caution
    differentGothra = true;
  }

  // 2. RULE 2: Male is 1 to 3 years elder than the Female
  const groomAge = calculateAge(male.dob);
  const brideAge = calculateAge(female.dob);
  const ageDiff = groomAge - brideAge; // Male age minus Female age

  // Male must be 1 to 3 years elder (ageDiff === 1, 2, or 3)
  const ageGapValid = ageDiff >= 1 && ageDiff <= 3;

  const prosperousTraits: string[] = [];

  if (differentGothra) {
    prosperousTraits.push(`Different Gotras: ${male.gothram || "Groom Gotram"} ↔ ${female.gothram || "Bride Gotram"}`);
  } else {
    prosperousTraits.push(`Sagotra Alert: Same Gotram (${male.gothram})`);
  }

  if (ageGapValid) {
    prosperousTraits.push(`Auspicious Age Alignment: Groom is ${ageDiff} year${ageDiff > 1 ? "s" : ""} elder than Bride (1-3 yrs)`);
  } else if (ageDiff < 0) {
    prosperousTraits.push(`Age Disparity: Bride is ${Math.abs(ageDiff)} year${Math.abs(ageDiff) > 1 ? "s" : ""} older than Groom`);
  } else if (ageDiff === 0) {
    prosperousTraits.push("Age Disparity: Groom and Bride are the same age (0 years difference)");
  } else {
    prosperousTraits.push(`Age Gap: Groom is ${ageDiff} years older (Outside 1-3 years range)`);
  }

  // Score computation: strictly based on the 2 rules
  let totalScore = 0;
  if (differentGothra && ageGapValid) {
    totalScore = 100; // Perfect match!
  } else if (differentGothra && !ageGapValid) {
    totalScore = 50; // Gotra passed, age gap failed
  } else if (!differentGothra && ageGapValid) {
    totalScore = 0; // Same gotram is strictly rejected in traditional Brahmin marriages
  } else {
    totalScore = 0;
  }

  let milanAnalysis = "";
  if (differentGothra && ageGapValid) {
    milanAnalysis = `Perfect Match! Different Gotras confirmed (${male.gothram} ↔ ${female.gothram}) and Groom is ${ageDiff} year${ageDiff > 1 ? "s" : ""} elder than Bride. Both criteria 100% satisfied.`;
  } else if (!differentGothra) {
    milanAnalysis = `Same Gotram (${male.gothram}): Sagotra alliances are traditionally not permissible.`;
  } else {
    milanAnalysis = `Gotras are distinct, but Groom must be 1 to 3 years elder than Bride (Current age gap: ${ageDiff} years).`;
  }

  return {
    totalScore,
    differentGothra,
    ageGapValid,
    groomAge,
    brideAge,
    ageDiff,
    milanAnalysis,
    prosperousTraits,
    gunaPoints: totalScore === 100 ? 36 : totalScore === 50 ? 18 : 0,
    ganaHarmony: totalScore === 100 ? "Auspicious (ఉత్తమ)" : "Challenging (సాధారణ)",
  };
}
