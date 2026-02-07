import { Handler } from '@netlify/functions';
import clientPromise from './lib/mongo';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { name, phone, videoName } = data;

    if (!name || !phone || !videoName) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    const client = await clientPromise;
    const db = client.db("whatsdoc");
    const collection = db.collection("customers");

    const newCustomer = {
      customerName: name,
      phoneNumber: phone,
      videoName: videoName,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    const result = await collection.insertOne(newCustomer);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: result.insertedId }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error("Database Error:", error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};