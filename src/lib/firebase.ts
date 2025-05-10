
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
// import { getStorage } from 'firebase/storage'; // Example if you need storage

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// Check for essential Firebase config variables
if (!apiKey) {
  throw new Error(
    'Firebase API Key is missing. Please set NEXT_PUBLIC_FIREBASE_API_KEY in your .env.local file and restart the server.'
  );
}
if (!authDomain) {
  throw new Error(
    'Firebase Auth Domain is missing. Please set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN in your .env.local file and restart the server.'
  );
}
if (!projectId) {
  throw new Error(
    'Firebase Project ID is missing. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env.local file and restart the server.'
  );
}
// It's good practice to check for other essential vars if your app strictly depends on them.
// For example, if your app uses Firebase Storage:
// if (!storageBucket) {
//   throw new Error(
//     'Firebase Storage Bucket is missing. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in your .env.local file and restart the server.'
//   );
// }
// If your app uses other Firebase services that require specific config like appId:
// if (!appId) {
//  throw new Error(
//    'Firebase App ID is missing. Please set NEXT_PUBLIC_FIREBASE_APP_ID in your .env.local file and restart the server.'
//  );
// }


const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId,
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
