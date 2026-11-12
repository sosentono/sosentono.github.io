import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// Use canonical AI Studio provisioned config from firebase-applet-config.json
const env = import.meta.env || {};

export const resolvedFirebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfigJson.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfigJson.projectId || env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfigJson.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfigJson.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfigJson.appId || env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId || env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)',
  oAuthClientId: firebaseConfigJson.oAuthClientId || env.VITE_GOOGLE_OAUTH_CLIENT_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(resolvedFirebaseConfig);

// Connect to the specific database instance with auto-detect long polling
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, resolvedFirebaseConfig.firestoreDatabaseId);
} catch {
  firestoreInstance = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
}
export const db = firestoreInstance;
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot according to skill specifications
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'general'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testFirestoreConnection();
