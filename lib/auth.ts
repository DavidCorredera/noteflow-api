import admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Simple in-memory cache for verified tokens
const tokenCache = new Map<string, { uid: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

  // Check cache first
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.uid;
  }

  const decoded = await getApp().auth().verifyIdToken(token);
  
  // Store in cache
  tokenCache.set(token, { 
    uid: decoded.uid, 
    expiresAt: Date.now() + CACHE_TTL 
  });

  return decoded.uid;
}
