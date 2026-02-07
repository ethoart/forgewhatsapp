import { APP_CONFIG } from '../constants';
import { CustomerRequest } from '../types';

// Helper to simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- API METHODS ---

/**
 * Registers a new customer request.
 * Mobile Portal calls this.
 * NOW POWERED BY: Netlify Functions (Direct MongoDB)
 */
export const registerCustomer = async (
  name: string,
  phone: string,
  videoName: string
): Promise<boolean> => {
  if (APP_CONFIG.useMockMode) {
    await delay(800);
    return true;
  } else {
    try {
      // Calls /.netlify/functions/register-customer
      const response = await fetch(`${APP_CONFIG.webhookBaseUrl}/register-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, videoName }),
      });
      
      if (!response.ok) {
        console.error(`API Error (${response.status}):`, await response.text());
        return false;
      }
      return true;
    } catch (error) {
      console.error("Network Error", error);
      return false;
    }
  }
};

/**
 * Fetches the list of pending requests.
 * Desktop Dashboard calls this.
 * NOW POWERED BY: Netlify Functions (Direct MongoDB)
 */
export const getPendingRequests = async (): Promise<CustomerRequest[]> => {
  if (APP_CONFIG.useMockMode) {
    return [];
  } else {
    try {
      // Calls /.netlify/functions/get-pending
      const response = await fetch(`${APP_CONFIG.webhookBaseUrl}/get-pending`);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.warn("API Error", await response.text());
        return [];
      }
    } catch (error) {
      console.error("API Error", error);
      return [];
    }
  }
};

/**
 * Uploads a file for a specific customer.
 * Desktop Dashboard calls this when a match is found.
 * STILL POWERED BY: n8n Webhook (via Proxy)
 */
export const uploadDocument = async (
  requestId: string,
  file: File,
  phoneNumber: string
): Promise<boolean> => {
  if (APP_CONFIG.useMockMode) {
    return true;
  } else {
    // We send FormData to handle the binary file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('requestId', requestId);
    formData.append('phoneNumber', phoneNumber);
    formData.append('videoName', file.name);

    try {
      // This URL is proxied in netlify.toml to go to n8n directly
      const response = await fetch(`${APP_CONFIG.webhookBaseUrl}/upload-document`, {
        method: 'POST',
        body: formData, 
      });
      return response.ok;
    } catch (error) {
      console.error("API Error", error);
      return false;
    }
  }
};