import admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

function getApp() {
  if (admin.apps.length) return admin.app();

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  }

  // Fallback for local dev with GOOGLE_APPLICATION_CREDENTIALS
  return admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export async function verifyAuth(request: Request): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);
  const decoded = await getApp().auth().verifyIdToken(token);
  return decoded.uid;
}
