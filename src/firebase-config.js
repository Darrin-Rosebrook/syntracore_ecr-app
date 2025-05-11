// src/firebase-config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration for SyntraHub
const firebaseConfig = {
  apiKey: "AIzaSyBfA4Hn4VCC3t67QDG7Q-gdBaBSF56YAeo",
  authDomain: "syntrahub.firebaseapp.com",
  projectId: "syntrahub",
  storageBucket: "syntrahub.firebasestorage.app",
  messagingSenderId: "454174983371",
  appId: "1:454174983371:web:8774460598bd68544f074e"
};

// Initialize Firebase app if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase Auth instance
const auth = getAuth(app);

export { app, auth };
