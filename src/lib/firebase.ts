import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"],
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"],
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"],
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"],
  appId: import.meta.env["VITE_FIREBASE_APP_ID"],
  measurementId: import.meta.env["VITE_FIREBASE_MEASUREMENT_ID"],
};

const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"] as const;

export const isFirebaseConfigured = requiredKeys.every((key) => Boolean(firebaseConfig[key]));

if (!isFirebaseConfigured) {
  console.warn("Firebase no está configurado. Define las variables VITE_FIREBASE_*.");
}

const app = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const functions = app ? getFunctions(app) : null;

if (
  functions &&
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
) {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
