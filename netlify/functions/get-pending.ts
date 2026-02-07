import { Handler } from '@netlify/functions';
import clientPromise from './lib/mongo';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const client = await clientPromise;
    const db = client.db("whatsdoc");
    const collection = db.collection("customers");

    // Fetch pending requests, sorted by oldest first
    const pending = await collection
      .find({ status: 'pending' })
      .sort({ requestedAt: 1 })
      .limit(100)
      .toArray();

    // Transform _id to id for frontend
    const results = pending.map(doc => ({
      id: doc._id.toString(),
      customerName: doc.customerName,
      phoneNumber: doc.phoneNumber,
      videoName: doc.videoName,
      status: doc.status,
      requestedAt: doc.requestedAt
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(results),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error("Database Error:", error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};