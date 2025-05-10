
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
// import { getStorage } from 'firebase/storage'; // Example if you need storage

// Your web app's Firebase configuration
// CRITICAL: Verify these values against your Firebase project settings.
// Go to Firebase Console > Project Settings > General > Your Apps > SDK setup and configuration.
// Also, ensure Firebase Authentication is enabled in Firebase Console > Authentication > Sign-in method (Email/Password should be enabled).
const firebaseConfig = {
  apiKey: "AIzaSyBfA4Hn4VCC3t67QDG7Q-gdBaBSF56YAeo", // Verify this API key
  authDomain: "syntrahub.firebaseapp.com",           // Verify this Auth Domain
  projectId: "syntrahub",                             // Verify this Project ID
  storageBucket: "syntrahub.appspot.com",             // Standard format: your-project-id.appspot.com. Verify this.
  messagingSenderId: "454174983371",                // Verify this Sender ID
  appId: "1:454174983371:web:8774460598bd68544f074e", // Verify this App ID
  // measurementId is optional
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
// const storage = getStorage(app); // Example

export { app, db, auth };
