import "server-only";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// App Hosting injects FIREBASE_CONFIG. Locally the emulator variables in .env.local are used.
const app =
  getApps()[0] ??
  (process.env.FIREBASE_CONFIG
    ? initializeApp()
    : initializeApp({
        projectId: process.env.GCLOUD_PROJECT,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      }));

export const db = getFirestore(app);
export const adminAuth = getAuth(app);
export const getBucket = () => getStorage(app).bucket();
