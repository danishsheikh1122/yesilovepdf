import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MSG_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Export Firestore functions for use throughout the app
export { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where 
};

// Collection names
export const COLLECTIONS = {
  PDF_USAGE_LOGS: 'pdf_usage_logs',
} as const;

// Types for our PDF tracking
export interface PdfUsageLog {
  ip_address: string;
  pdf_name: string;
  action_type: string;
  created_at: Date;
  user_agent?: string;
  file_size?: number;
}

export interface UsageStats {
  totalActions: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
  recentActivity: PdfUsageLog[];
}