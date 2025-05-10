
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
// import { getStorage } from 'firebase/storage'; // Example if you need storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfA4Hn4VCC3t67QDG7Q-gdBaBSF56YAeo",
  authDomain: "syntrahub.firebaseapp.com",
  projectId: "syntrahub",
  storageBucket: "syntrahub.appspot.com", // Corrected from .firebasestorage.app
  messagingSenderId: "454174983371",
  appId: "1:454174983371:web:8774460598bd68544f074e"
  // measurementId is optional and not in the provided config, so it's removed
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
