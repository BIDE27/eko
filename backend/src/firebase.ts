import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables for local development
dotenv.config();

// The service account key is expected to be in the FIREBASE_KEY env var as a JSON string.
const firebaseKey = process.env.FIREBASE_KEY;

if (!firebaseKey) {
  throw new Error('The FIREBASE_KEY environment variable is not set. Please create a .env file for local development or set it in your cloud environment.');
}

const serviceAccount = JSON.parse(firebaseKey);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

console.log('Firebase Admin initialized successfully.');

// Export the Firestore instance
export const db = admin.firestore();
