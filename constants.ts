import { N8nConfig } from './types';

// CONFIGURATION
// ------------------------------------------------------------------
// FRONTEND: Deployed on Netlify
// BACKEND:  Hosted on AWS (n8n)
// ------------------------------------------------------------------

export const APP_CONFIG: N8nConfig = {
  // Set to FALSE to connect to your real n8n server on AWS
  useMockMode: false, 
  
  // Your n8n Production URL (Hosted on AWS via Cloudflare Tunnel)
  // Ensure you append '/webhook'
  webhookBaseUrl: "https://n8n.arcane.click/webhook",
};

export const MOTIVATIONAL_QUOTES = [
  "Great work! You're making customers happy.",
  "Keep up the momentum!",
  "Another video delivered, another memory shared.",
  "Efficiency is doing better what is already being done.",
  "Your speed is impressive today!",
  "Technology is best when it brings people together.",
  "You are crushing the queue!",
];