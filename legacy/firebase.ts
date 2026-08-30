// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9g6rZoF1qvSrvbctNCmFoFZL8gJ3wtwM",
  authDomain: "codefest25-673b3.firebaseapp.com",
  projectId: "codefest25-673b3",
  storageBucket: "codefest25-673b3.firebasestorage.app",
  messagingSenderId: "556250511199",
  appId: "1:556250511199:web:e83d0f8ae8206e99fb28ea"
};

// Initialize Firebase (prevent multiple initializations)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth
export const auth = getAuth(app);

export default app;