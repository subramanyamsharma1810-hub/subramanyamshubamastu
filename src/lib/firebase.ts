import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAnjL2miJOB-Ir-37151IoVMwiu-cIQNYU",
  authDomain: "hazel-ward-lt3g1.firebaseapp.com",
  projectId: "hazel-ward-lt3g1",
  storageBucket: "hazel-ward-lt3g1.firebasestorage.app",
  messagingSenderId: "655374362116",
  appId: "1:655374362116:web:208a9ba12e3e40097cf751"
};

const databaseId = "ai-studio-bramhanavivahave-e0c4cd3c-62b7-411c-b376-c3b4f5d7b695";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId);

