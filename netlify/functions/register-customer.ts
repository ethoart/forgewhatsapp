import { Handler } from '@netlify/functions';
import clientPromise from './lib/mongo';

export const handler: Handler = async (event, context) => {
  // CORS Headers to allow access from any domain (optional but good for safety)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { name, phone, videoName } = data;

    if (!name || !phone || !videoName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    console.log("Connecting to MongoDB...");
    const client = await clientPromise;
    const db = client.db("whatsdoc");
    const collection = db.collection("customers");

    console.log("Inserting customer...");
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
      headers,
      body: JSON.stringify({ success: true, id: result.insertedId }),
    };

  } catch (error: any) {
    console.error("Database Error Detail:", error);
    
    // RETURN THE ACTUAL ERROR MESSAGE TO THE FRONTEND
    // This helps debug Firewall/Connection issues immediately.
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Internal Server Error',
        details: 'Check Netlify logs or AWS Security Group (Port 27017)'
      }) 
    };
  }
};