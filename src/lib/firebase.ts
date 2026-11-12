import { initializeApp } from "firebase/app";
import { getFirestore, getDocFromServer, doc } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously, GoogleAuthProvider } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json" with { type: "json" };

const app = initializeApp(firebaseConfig);

// The database ID is typically in the config or we use the default
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();


export const ensureAuth = async () => {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log("Firebase Anonymous Auth success:", auth.currentUser?.uid);
    } catch (e: any) {
      if (e.code === 'auth/admin-restricted-operation' || e.code === 'auth/operation-not-allowed') {
        // Anonymous Auth provider is not enabled in Firebase Console.
        // App safely continues in direct/guest mode or via Google Sign-In.
        return;
      }
      console.warn("Firebase Auth status:", e?.message || e);
    }
  }
};

// CRITICAL CONSTRAINT: Validate Connection to Firestore on boot
async function testConnection() {
  try {
    // Attempt a simple read to verify connection
    await getDocFromServer(doc(db, 'system', 'health'));
    console.log("Firestore connection verified.");
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    } else if (error.code === 'permission-denied') {
      console.warn("Firestore connection test: Permission denied (expected if not authed/rules strict).");
    } else {
      console.warn("Firestore connection test note:", error.message);
    }
  }
}
testConnection();



