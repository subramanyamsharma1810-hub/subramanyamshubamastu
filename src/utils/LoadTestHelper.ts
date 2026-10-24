import { databaseService } from "../lib/databaseService";
import { Profile } from "../types";

/**
 * LoadTestHelper - Strategic Utility for High-Throughput Stress Testing
 * Generates batches of high-quality authenticated profiles with high-res photos
 * to verify CDN and Firestore throughput as requested in Strategic Audit.
 */
export const LoadTestHelper = {
  async generateProfiles(count: number = 100) {
    console.log(`[LoadTest] Initiating batch generation of ${count} elite profiles...`);
    const profiles: Profile[] = [];
    const surnames = ["Ghadiyaram", "Vedic", "Sharma", "Sastry", "Brahmin", "Pandit", "Rao", "Vyas"];
    const names = ["Krishna", "Ram", "Shiva", "Vishnu", "Ganesh", "Kartikeya", "Hanuman", "Venkateswara"];
    const subCastes = ["Vaidiki Velanadu", "Smartha", "Dravida", "Sri Vaishnava", "Madhwa"];
    const professions = ["Software Architect", "Medical Doctor", "IAS Officer", "Vedic Scholar", "Chief Engineer", "Research Scientist"];

    for (let i = 0; i < count; i++) {
      const isMale = Math.random() > 0.5;
      const gender = isMale ? "Male" : "Female";
      const surname = surnames[Math.floor(Math.random() * surnames.length)];
      const name = `${names[Math.floor(Math.random() * names.length)]} ${i}`;
      const dobYear = 1985 + Math.floor(Math.random() * 20);
      const dob = `${dobYear}-0${1 + Math.floor(Math.random() * 9)}-${10 + Math.floor(Math.random() * 18)}`;
      
      const p: Profile = {
        id: `mock-${Date.now()}-${i}`,
        reg_number: `BVM-TEST-${1000 + i}`,
        surname,
        name: `${surname} ${name}`,
        gender: gender as "Male" | "Female",
        dob,
        gothram: "Kasyapa",
        sub_caste: subCastes[Math.floor(Math.random() * subCastes.length)],
        height_feet: 5.4 + Math.random() * 0.8,
        contact_number: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `test-${i}@shubhamastu.in`,
        password: "password123",
        profession: professions[Math.floor(Math.random() * professions.length)],
        salary_lpa: 10 + Math.floor(Math.random() * 50),
        status: "Verified",
        subscription_status: Math.random() > 0.3 ? "paid_900" : "free",
        photo_url: `https://picsum.photos/seed/${i}/400/600`, // CDN fallback for testing
        created_at: new Date().toISOString()
      };
      
      profiles.push(p);
    }

    console.log(`[LoadTest] Saving ${count} profiles to Firestore...`);
    for (const p of profiles) {
      await databaseService.saveProfile(p);
    }
    console.log(`[LoadTest] Successfully injected ${count} stress-test profiles.`);
    return profiles;
  },

  async clearTestData() {
    console.log("[LoadTest] Purging stress-test data...");
    const all = await databaseService.getProfiles(true);
    const testProfiles = all.filter(p => p.id.startsWith("mock-") || p.reg_number?.startsWith("BVM-TEST"));
    for (const p of testProfiles) {
      await databaseService.deleteProfile(p.id);
    }
    console.log(`[LoadTest] Purged ${testProfiles.length} test records.`);
  }
};
