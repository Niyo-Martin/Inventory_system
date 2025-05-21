// client.ts
import axios, { AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000, // 15 seconds timeout
  headers: {
    "Content-Type": "application/json",
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // Handle API errors
    if (response) {
      // Authentication errors
      if (response.status === 401) {
        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          localStorage.removeItem("access_token");
          window.location.href = "/login";
        }
      }
      
      // Server errors
      if (response.status >= 500) {
        console.error("Server error:", response.status);
      }
    } else if (error.request) {
      // Network errors - request made but no response received
      console.error("Network error - no response received");
    } else {
      // Other errors
      console.error("Error:", error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Helper function to download a blob as a file
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Download XML from the specified endpoint
 * @param url The API endpoint to fetch XML from
 * @param filename The name to save the file as
 * @returns Promise<boolean> true if download was successful
 */
const downloadXML = async (url: string, filename: string): Promise<boolean> => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/xml'
      }
    });
    
    downloadBlob(response.data, filename);
    return true;
  } catch (error) {
    console.error('Error downloading XML:', error);
    return false;
  }
};

// Add downloadXML method to the api object
interface ApiWithDownload extends AxiosInstance {
  downloadXML: typeof downloadXML;
}

(api as ApiWithDownload).downloadXML = downloadXML;

export default api as ApiWithDownload;