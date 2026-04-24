import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Auth and Firestore with the app instance
export const auth = getAuth(app);
export const db = getFirestore(app);

const BASE = import.meta.env.VITE_BASE_URL;

// Add this function to check premium Gmail status
export async function isPremiumGmail(email) {
  try {
    const response = await fetch(`${BASE}/check-premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gmail: email })
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (!data.expires_at) return false;
    const now = new Date();
    const expiryDate = new Date(data.expires_at);
    return expiryDate > now;
  } catch (e) {
    console.error("Error checking premium status:", e);
    return false;
  }
}

export default app;
