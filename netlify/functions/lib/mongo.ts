import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

// CRITICAL FIX: Fail fast if connection fails.
// AWS Security Groups 'DROP' packets by default, causing the request to hang forever.
// We set a 3-second timeout so the function fails with a clear error instead of a generic 504 Gateway Timeout.
const options = {
  serverSelectionTimeoutMS: 3000, // Fail after 3 seconds if server not reachable
  connectTimeoutMS: 3000,         // Fail initial connection after 3 seconds
  socketTimeoutMS: 3000,          // Close socket if no activity
};

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;