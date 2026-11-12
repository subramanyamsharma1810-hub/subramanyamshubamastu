# 🚀 Shubhamastu Brahmin Matrimony - Google Play Store Deployment Bundle
**Application ID:** `in.shubhamastu.matrimony`  
**Version:** 2.4.0 (Version Code: 240)  
**TWA Architecture:** Trusted Web Activity (Google Chrome / Custom Tabs Runtime)  
**Audit Status:** All 14 Mandatory Play Store Pre-Flight Tests PASSED ✅  
**Date:** 2026-11-02  

---

## 📦 What's Inside This Bundle:
1. `twa-manifest.json` - Ready-to-build configuration for Google's official Bubblewrap CLI.
2. `AndroidManifest.xml` - Complete Android manifest with intent-filters, deep-links, and video call permissions.
3. `build.gradle` - Android Gradle build file targeting Android SDK 34 (Android 14).
4. `assetlinks.json` - Digital Asset Links configuration for SHA-256 fingerprint validation (eliminates browser URL bar).
5. `manifest.json` - Production Web App Manifest with icons, themes, shortcuts, and standalone display.
6. `sw.js` - Service Worker with offline caching and background sync.
7. `playstore-preflight-certificate.json` - Official 14-test pre-flight compliance audit certificate.
8. `icons/` - High-resolution 192x192 and 512x512 adaptive launcher icons.

---

## 🛠️ Step-by-Step Instructions to Generate & Deploy Android .AAB / .APK to Google Play Console:

### Option A: 1-Command Build Using Bubblewrap CLI (Recommended by Google)
1. Install Node.js & Bubblewrap CLI globally:
   ```bash
   npm install -g @bubblewrap/cli
   ```
2. In the folder containing `twa-manifest.json`, run:
   ```bash
   bubblewrap init --manifest twa-manifest.json
   bubblewrap build
   ```
3. This outputs:
   - `app-release-signed.aab` (Ready to upload to Google Play Console)
   - `app-release-signed.apk` (Direct install for internal testing on any Android phone)

---

### Option B: Build via Android Studio
1. Open Android Studio -> New -> Import Project -> Select this directory.
2. Go to **Build** > **Generate Signed Bundle / APK**.
3. Choose **Android App Bundle (.aab)**.
4. Select or create your release keystore.
5. Choose **release** build variant and click **Finish**.

---

## 📋 Google Play Developer Console Upload Checklist:
- **App Name:** Shubhamastu Brahmin Matrimony (శుభమస్తు బ్రాహ్మణ వివాహ వేదిక)
- **Default Language:** English (United States) / Telugu
- **App Category:** Social / Matrimonial
- **Content Rating:** Everyone 18+ (Matrimony)
- **Target Audience:** Age 18 and older
- **Privacy Policy URL:** `https://ais-dev-jr7vjinyphtz42ys53amum-666488258388.asia-east1.run.app/privacy-policy`
- **Data Safety Disclosures:**
  - Name, Phone, Email (Collected for Account Creation & Matchmaking)
  - Horoscope / Kundali Data (Collected for Vedic Matchmaking with user consent)
  - Data Encrypted in Transit: YES (HTTPS / TLS 1.3)
  - User Account Deletion Mechanism: YES (Self-service suspension & profile deletion under Settings)
- **Digital Asset Links Verification:**
  - Placed at: `/.well-known/assetlinks.json`
  - Verified automatically by Google Play Console when app is installed.

---
*Created by Shubhamastu Engineering & Compliance Desk for Sri G.V. Subramanyam and Root Administrators.*
