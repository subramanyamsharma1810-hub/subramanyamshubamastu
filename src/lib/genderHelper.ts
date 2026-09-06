/**
 * Auspicious Telugu Matrimonial Gender Labels
 * Senior Citizen friendly translation mapping
 */
export function getGenderLabel(gender: "Male" | "Female" | string | undefined): string {
  if (!gender) return "";
  const g = gender.toLowerCase();
  if (g === "male" || g === "groom" || g === "chiranjeevi") {
    return "Chiranjeevi (Groom / చిరంజీవి)";
  }
  return "Chi.La.Sow. Lakshmi Soubhagyavathi (Bride / చి.ల.సౌ. లక్ష్మీ సౌభాగ్యవతి)";
}

export function getShortGenderLabel(gender: "Male" | "Female" | string | undefined): string {
  if (!gender) return "";
  const g = gender.toLowerCase();
  if (g === "male") {
    return "Chiranjeevi (Groom)";
  }
  return "Chi.La.Sow. Lakshmi (Bride)";
}
