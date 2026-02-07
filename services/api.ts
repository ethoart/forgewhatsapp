import { APP_CONFIG } from '../constants';
import { CustomerRequest } from '../types';

// Helper to simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// MOCK STORAGE KEY
const STORAGE_KEY = 'whatsdoc_mock_db';

const getMockData = (): CustomerRequest[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const setMockData = (data: CustomerRequest[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- API METHODS ---

/**
 * Registers a new customer request.
 * Mobile Portal calls this.
 */
export const registerCustomer = async (
  name: string,
  phone: string,
  videoName: string
): Promise<boolean> => {
  if (APP_CONFIG.useMockMode) {
    await delay(800);
    const current = getMockData();
    const newRequest: CustomerRequest = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: name,
      phoneNumber: phone,
      videoName: videoName.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    setMockData([...current, newRequest]);
    return true;
  } else {
    // REAL N8N CALL
    try {
      // NOTE: We rely on Netlify Proxy (defined in netlify.toml) to handle CORS.
      const response = await fetch(`${APP_CONFIG.webhookBaseUrl}/register-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, videoName }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
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
 */
export const getPendingRequests = async (): Promise<CustomerRequest[]> => {
  if (APP_CONFIG.useMockMode) {
    await delay(500);
    const all = getMockData();
    // Sort: Oldest pending first
    return all
      .filter((r) => r.status === 'pending')
      .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
  } else {
    // REAL N8N CALL
    try {
      const response = await fetch(`${APP_CONFIG.webhookBaseUrl}/get-pending`);
      
      // Safety check: Ensure we got JSON back.
      // If the proxy fails (404/500), it often returns HTML.
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        return data;
      } else {
        console.warn("Received non-JSON response from server", await response.text());
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
 */
export const uploadDocument = async (
  requestId: string,
  file: File,
  phoneNumber: string
): Promise<boolean> => {
  if (APP_CONFIG.useMockMode) {
    await delay(2000); // Simulate upload time
    const all = getMockData();
    const updated = all.map((r) =>
      r.id === requestId ? { ...r, status: 'completed' as const } : r
    );
    setMockData(updated);
    return true;
  } else {
    // REAL N8N CALL
    // We send FormData to handle the binary file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('requestId', requestId);
    formData.append('phoneNumber', phoneNumber);
    formData.append('videoName', file.name);

    try {
      const response = await fetch(`${APP_CONFIG.webhookBaseUrl}/upload-document`, {
        method: 'POST',
        body: formData, // fetch automatically sets Content-Type to multipart/form-data
      });
      return response.ok;
    } catch (error) {
      console.error("API Error", error);
      return false;
    }
  }
};