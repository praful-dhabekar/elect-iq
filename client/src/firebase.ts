/**
 * Firebase configuration for ElectIQ.
 * Why: Centralises Firebase initialisation so all services (Auth, Firestore)
 * share one app instance. Config values come from environment variables.
 *
 * Google Services used: Firebase Authentication, Firebase App.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/** Firebase config — populated from VITE_ env vars at build time. */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

/** @type {import('firebase/app').FirebaseApp} */
const app = initializeApp(firebaseConfig);

/** Firebase Auth instance with Google provider pre-configured. */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/** Firestore instance for persisting user data (chat history, preferences). */
export const db = getFirestore(app);

export default app;
