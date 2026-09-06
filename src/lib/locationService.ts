// Location Lookup Service with OpenStreetMap Nominatim API integration and custom South India Local Fallbacks
// Built specifically to handle spellings like Madduru (near Nandyal), Maddur, Vijayawada, etc.

export interface LocationSuggestion {
  display_name: string;
  name: string;
  district?: string;
  state?: string;
}

// Curated rich local dataset for Andhra Pradesh and Telangana to provide instant, high-relevance suggestions
const LOCAL_SOUTH_INDIAN_PLACES: LocationSuggestion[] = [
  // Maddur / Madduru entries as requested by the user
  { name: "Maddur (near Nandyal)", display_name: "Maddur, near Nandyal, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },
  { name: "Madduru (near Rayachoty)", display_name: "Madduru, Annamayya District, Andhra Pradesh, India", district: "Annamayya", state: "Andhra Pradesh" },
  { name: "Maddur (near Mahbubnagar)", display_name: "Maddur, Narayanpet / Mahbubnagar, Telangana, India", district: "Narayanpet", state: "Telangana" },
  { name: "Maddur (near Mandya)", display_name: "Maddur, Mandya District, Karnataka, India", district: "Mandya", state: "Karnataka" },
  
  // Andhra Pradesh Major places & districts
  { name: "Vijayawada", display_name: "Vijayawada, NTR District, Andhra Pradesh, India", district: "NTR", state: "Andhra Pradesh" },
  { name: "Guntur", display_name: "Guntur, Guntur District, Andhra Pradesh, India", district: "Guntur", state: "Andhra Pradesh" },
  { name: "Nandyal", display_name: "Nandyal, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },
  { name: "Kurnool", display_name: "Kurnool, Kurnool District, Andhra Pradesh, India", district: "Kurnool", state: "Andhra Pradesh" },
  { name: "Nellore", display_name: "Nellore, SPSR Nellore District, Andhra Pradesh, India", district: "Nellore", state: "Andhra Pradesh" },
  { name: "Tirupati", display_name: "Tirupati, Tirupati District, Andhra Pradesh, India", district: "Tirupati", state: "Andhra Pradesh" },
  { name: "Visakhapatnam", display_name: "Visakhapatnam, Visakhapatnam District, Andhra Pradesh, India", district: "Visakhapatnam", state: "Andhra Pradesh" },
  { name: "Kadapa (Cuddapah)", display_name: "Kadapa, YSR Kadapa District, Andhra Pradesh, India", district: "YSR Kadapa", state: "Andhra Pradesh" },
  { name: "Anantapur", display_name: "Anantapur, Anantapur District, Andhra Pradesh, India", district: "Anantapur", state: "Andhra Pradesh" },
  { name: "Ongole", display_name: "Ongole, Prakasam District, Andhra Pradesh, India", district: "Prakasam", state: "Andhra Pradesh" },
  { name: "Eluru", display_name: "Eluru, Eluru District, Andhra Pradesh, India", district: "Eluru", state: "Andhra Pradesh" },
  { name: "Kakinada", display_name: "Kakinada, Kakinada District, Andhra Pradesh, India", district: "Kakinada", state: "Andhra Pradesh" },
  { name: "Rajahmundry", display_name: "Rajahmundry, East Godavari District, Andhra Pradesh, India", district: "East Godavari", state: "Andhra Pradesh" },
  { name: "Bhimavaram", display_name: "Bhimavaram, West Godavari District, Andhra Pradesh, India", district: "West Godavari", state: "Andhra Pradesh" },
  { name: "Chittoor", display_name: "Chittoor, Chittoor District, Andhra Pradesh, India", district: "Chittoor", state: "Andhra Pradesh" },
  { name: "Proddatur", display_name: "Proddatur, YSR Kadapa District, Andhra Pradesh, India", district: "YSR Kadapa", state: "Andhra Pradesh" },
  { name: "Madanapalle", display_name: "Madanapalle, Annamayya District, Andhra Pradesh, India", district: "Annamayya", state: "Andhra Pradesh" },
  { name: "Adoni", display_name: "Adoni, Kurnool District, Andhra Pradesh, India", district: "Kurnool", state: "Andhra Pradesh" },
  { name: "Tenali", display_name: "Tenali, Guntur District, Andhra Pradesh, India", district: "Guntur", state: "Andhra Pradesh" },
  { name: "Chirala", display_name: "Chirala, Bapatla District, Andhra Pradesh, India", district: "Bapatla", state: "Andhra Pradesh" },
  { name: "Bapatla", display_name: "Bapatla, Bapatla District, Andhra Pradesh, India", district: "Bapatla", state: "Andhra Pradesh" },
  { name: "Narasaraopet", display_name: "Narasaraopet, Palnadu District, Andhra Pradesh, India", district: "Palnadu", state: "Andhra Pradesh" },
  { name: "Tadipatri", display_name: "Tadipatri, Anantapur District, Andhra Pradesh, India", district: "Anantapur", state: "Andhra Pradesh" },
  { name: "Dharmavaram", display_name: "Dharmavaram, Sri Sathya Sai District, Andhra Pradesh, India", district: "Sri Sathya Sai", state: "Andhra Pradesh" },
  { name: "Hindupur", display_name: "Hindupur, Sri Sathya Sai District, Andhra Pradesh, India", district: "Sri Sathya Sai", state: "Andhra Pradesh" },
  { name: "Guntakal", display_name: "Guntakal, Anantapur District, Andhra Pradesh, India", district: "Anantapur", state: "Andhra Pradesh" },
  { name: "Gooty", display_name: "Gooty, Anantapur District, Andhra Pradesh, India", district: "Anantapur", state: "Andhra Pradesh" },
  { name: "Rayachoty", display_name: "Rayachoty, Annamayya District, Andhra Pradesh, India", district: "Annamayya", state: "Andhra Pradesh" },
  { name: "Yerraguntla", display_name: "Yerraguntla, YSR Kadapa District, Andhra Pradesh, India", district: "YSR Kadapa", state: "Andhra Pradesh" },
  { name: "Pulivendula", display_name: "Pulivendula, YSR Kadapa District, Andhra Pradesh, India", district: "YSR Kadapa", state: "Andhra Pradesh" },
  { name: "Jammalamadugu", display_name: "Jammalamadugu, YSR Kadapa District, Andhra Pradesh, India", district: "YSR Kadapa", state: "Andhra Pradesh" },
  { name: "Srisailam", display_name: "Srisailam, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },
  { name: "Mahanandi", display_name: "Mahanandi, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },
  { name: "Ahobilam", display_name: "Ahobilam, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },
  { name: "Yaganti", display_name: "Yaganti, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },
  { name: "Banaganapalli", display_name: "Banaganapalli, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },
  { name: "Allagadda", display_name: "Allagadda, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },
  { name: "Dhone", display_name: "Dhone, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },
  { name: "Koilkuntla", display_name: "Koilkuntla, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },
  { name: "Nandikotkur", display_name: "Nandikotkur, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },
  { name: "Atmakur (Kurnool/Nandyal)", display_name: "Atmakur, Nandyal District, Andhra Pradesh, India", district: "Nandyal", state: "Andhra Pradesh" },

  // Telangana Major places
  { name: "Hyderabad", display_name: "Hyderabad, Hyderabad District, Telangana, India", district: "Hyderabad", state: "Telangana" },
  { name: "Secunderabad", display_name: "Secunderabad, Hyderabad District, Telangana, India", district: "Hyderabad", state: "Telangana" },
  { name: "Warangal", display_name: "Warangal, Warangal District, Telangana, India", district: "Warangal", state: "Telangana" },
  { name: "Nizamabad", display_name: "Nizamabad, Nizamabad District, Telangana, India", district: "Nizamabad", state: "Telangana" },
  { name: "Khammam", display_name: "Khammam, Khammam District, Telangana, India", district: "Khammam", state: "Telangana" },
  { name: "Karimnagar", display_name: "Karimnagar, Karimnagar District, Telangana, India", district: "Karimnagar", state: "Telangana" },
  { name: "Nalgonda", display_name: "Nalgonda, Nalgonda District, Telangana, India", district: "Nalgonda", state: "Telangana" },
  { name: "Mahbubnagar", display_name: "Mahbubnagar, Mahbubnagar District, Telangana, India", district: "Mahbubnagar", state: "Telangana" },
  { name: "Adilabad", display_name: "Adilabad, Adilabad District, Telangana, India", district: "Adilabad", state: "Telangana" },
  { name: "Suryapet", display_name: "Suryapet, Suryapet District, Telangana, India", district: "Suryapet", state: "Telangana" },
  { name: "Miryalaguda", display_name: "Miryalaguda, Nalgonda District, Telangana, India", district: "Nalgonda", state: "Telangana" },
  { name: "Mancherial", display_name: "Mancherial, Mancherial District, Telangana, India", district: "Mancherial", state: "Telangana" },
  { name: "Ramagundam", display_name: "Ramagundam, Peddapalli District, Telangana, India", district: "Peddapalli", state: "Telangana" },
  { name: "Kothagudem", display_name: "Kothagudem, Bhadradri Kothagudem District, Telangana, India", district: "Bhadradri Kothagudem", state: "Telangana" },
  { name: "Siddipet", display_name: "Siddipet, Siddipet District, Telangana, India", district: "Siddipet", state: "Telangana" },
  { name: "Medak", display_name: "Medak, Medak District, Telangana, India", district: "Medak", state: "Telangana" },
  { name: "Sangareddy", display_name: "Sangareddy, Sangareddy District, Telangana, India", district: "Sangareddy", state: "Telangana" },
  { name: "Kamareddy", display_name: "Kamareddy, Kamareddy District, Telangana, India", district: "Kamareddy", state: "Telangana" },
  { name: "Jagtial", display_name: "Jagtial, Jagtial District, Telangana, India", district: "Jagtial", state: "Telangana" },
  { name: "Sircilla", display_name: "Sircilla, Rajanna Sircilla District, Telangana, India", district: "Rajanna Sircilla", state: "Telangana" },
  { name: "Wanaparthy", display_name: "Wanaparthy, Wanaparthy District, Telangana, India", district: "Wanaparthy", state: "Telangana" },
  { name: "Gadwal", display_name: "Gadwal, Jogulamba Gadwal District, Telangana, India", district: "Jogulamba Gadwal", state: "Telangana" },
  { name: "Narayanpet", display_name: "Narayanpet, Narayanpet District, Telangana, India", district: "Narayanpet", state: "Telangana" },
  { name: "Bhongir", display_name: "Yadadri Bhongir, Yadadri Bhongir District, Telangana, India", district: "Yadadri Bhongir", state: "Telangana" },
  { name: "Jangaon", display_name: "Jangaon, Jangaon District, Telangana, India", district: "Jangaon", state: "Telangana" },
  { name: "Yadagirigutta", display_name: "Yadagirigutta, Yadadri Bhongir District, Telangana, India", district: "Yadadri Bhongir", state: "Telangana" },
  { name: "Shamshabad", display_name: "Shamshabad, Rangareddy District, Telangana, India", district: "Rangareddy", state: "Telangana" },
  { name: "Vikarabad", display_name: "Vikarabad, Vikarabad District, Telangana, India", district: "Vikarabad", state: "Telangana" },
];

/**
 * Searches for a location by querying the real-time Nominatim OpenStreetMap API,
 * with an instant high-quality local fallback for South Indian towns, villages, and spellings.
 * 
 * @param query The place name typed by the user (e.g. "madduru", "maddur", "nandyal")
 */
export async function searchLocation(query: string): Promise<LocationSuggestion[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  // Helper to normalize strings for robust word-by-word token matching
  const sanitizeStr = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[(),.\-\/]/g, " ") // replace brackets/punctuation with spaces
      .replace(/\s+/g, " ")       // normalize multiple spaces to single space
      .trim();
  };

  // Create search tokens from the user input
  // e.g. "madduru nandyal ap" -> ["madduru", "nandyal", "ap"]
  const rawTokens = trimmed.split(/\s+/).filter(Boolean);
  
  // Clean tokens for phonetic tolerances (like removing trailing 'u' e.g. "madduru" -> "maddur")
  const queryTokens = rawTokens.map(tok => {
    // If token ends with 'u' and is longer than 3 chars, trim 'u' (e.g. madduru -> maddur, nandyalu -> nandyal)
    if (tok.length > 3 && tok.endsWith("u")) {
      return tok.slice(0, -1);
    }
    return tok;
  });

  // Ignore simple stop words if there are multiple tokens
  const stopWords = ["near", "in", "of", "to", "at", "district", "state"];
  const searchTokens = queryTokens.filter(tok => 
    queryTokens.length === 1 || !stopWords.includes(tok)
  );

  // 1. Generate local matches using token overlap logic
  const localMatches = LOCAL_SOUTH_INDIAN_PLACES.filter(place => {
    const searchable = sanitizeStr(`${place.name} ${place.display_name}`);
    // Check if every search token is included in the searchable string of this place
    return searchTokens.every(token => searchable.includes(token));
  });

  // 2. Perform live geocoding lookup using OpenStreetMap Nominatim API
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&countrycodes=in`,
      {
        headers: {
          "Accept-Language": "en,te,hi",
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const liveSuggestions: LocationSuggestion[] = data.map((item: any) => {
          const displayName = item.display_name;
          const addressParts = displayName.split(", ");
          const name = item.name || addressParts[0];
          return {
            name: name,
            display_name: displayName,
            state: addressParts.find((part: string) => 
              ["Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Kerala", "Maharashtra"].includes(part)
            ) || undefined,
          };
        });

        // Combine live geocoded results with our curated local matches, deduplicating by clean display_name or name
        const combined = [...localMatches];
        for (const live of liveSuggestions) {
          const isDuplicate = combined.some(
            existing => 
              existing.display_name.toLowerCase().replace(/\s/g, "") === 
              live.display_name.toLowerCase().replace(/\s/g, "") ||
              existing.name.toLowerCase() === live.name.toLowerCase()
          );
          if (!isDuplicate) {
            combined.push(live);
          }
        }
        return combined.slice(0, 10);
      }
    }
  } catch (error) {
    console.warn("Nominatim dynamic fetch failed, using local location repository:", error);
  }

  // Fallback to local matches if fetch fails or returns nothing
  return localMatches;
}
