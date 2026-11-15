import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFirebasePersistence } from './firebasePersistence';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};


let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

function getFirebaseApp() {
  const requiredValues = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.appId,
  ];
  if (requiredValues.some((value) => !value)) {
    throw new Error(
      'Falta configurar Firebase. Copia .env.example a .env y agrega los datos de tu proyecto Firebase.',
    );
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseFirestore() {
  if (!firestoreInstance) firestoreInstance = getFirestore(getFirebaseApp());
  return firestoreInstance;
}

export function getFirebaseStorage() {
  if (!storageInstance) storageInstance = getStorage(getFirebaseApp());
  return storageInstance;
}

export function getFirebaseAuth() {
  if (authInstance) return authInstance;

  const app = getFirebaseApp();
  const persistence = getFirebasePersistence();
  if (!persistence) {
    authInstance = getAuth(app);
    return authInstance;
  }

  try {
    authInstance = initializeAuth(app, { persistence });
  } catch (error) {
    // Fast Refresh can preserve the Firebase app while reloading this module.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'auth/already-initialized'
    ) {
      authInstance = getAuth(app);
    } else {
      throw error;
    }
  }

  return authInstance;
}
