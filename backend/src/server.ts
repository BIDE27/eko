// FIX: Changed express import to resolve type inference issues.
// The previous import `import express, { Request, Response }` was causing type
// errors for `app`, `req`, and `res`. Using a default import and qualifying
// types with `express.` (e.g., `express.Request`) provides a more robust
// way for TypeScript to resolve the correct types.
import express from 'express';
import cors from 'cors';
import { db } from './firebase'; // Import the initialized Firestore instance

const app = express();

// Use CORS middleware to allow requests from your frontend.
// In a production environment, you should restrict this to your frontend's domain.
app.use(cors());
app.use(express.json());

// A simple test route to verify Firestore connection
app.get('/test', async (req: express.Request, res: express.Response) => {
  try {
    const testCollection = db.collection('test');
    const docRef = testCollection.doc('connection-check');

    // Write a document to Firestore
    const writeTime = new Date().toISOString();
    await docRef.set({
      status: 'ok',
      lastChecked: writeTime,
    });

    // Read the document back
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Document was written but could not be read back.');
    }

    res.status(200).json({
      message: 'Firestore connection successful!',
      data: doc.data(),
    });
  } catch (error) {
    console.error('Error testing Firestore connection:', error);
    res.status(500).json({
      message: 'Error connecting to Firestore.',
      error: (error as Error).message,
    });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
