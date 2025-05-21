// src/utils/xmlExport.ts
import api from "../api/client";

/**
 * Handles XML export functionality with proper error handling
 * @param endpoint - The API endpoint to fetch XML from
 * @param filename - The filename for the downloaded file
 * @param queryParams - Optional query parameters
 * @returns Promise<{success: boolean, errorMessage?: string}> - Result with optional error message
 */
export const exportAsXML = async (
  endpoint: string, 
  filename: string,
  queryParams?: Record<string, string>
): Promise<{success: boolean, errorMessage?: string}> => {
  try {
    // Build URL with query parameters if provided
    let url = endpoint;
    if (queryParams) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        params.append(key, value);
      });
      url = `${endpoint}?${params.toString()}`;
    }
    
    console.log(`Exporting XML from ${url}`);
    
    // Request XML with blob response type
    const response = await api.get(url, { 
      responseType: 'blob',
      timeout: 15000 // 15 seconds timeout
    });
    
    // Check if the response is actually JSON (indicating an error)
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      // Convert blob to text to read error message
      const reader = new FileReader();
      const textPromise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(response.data);
      });
      
      const text = await textPromise;
      try {
        const errorData = JSON.parse(text);
        const errorMessage = errorData.detail || errorData.message || "Unknown error";
        console.error("Server returned an error:", errorMessage);
        return { success: false, errorMessage };
      } catch {
        return { success: false, errorMessage: text };
      }
    }
    
    // Check if data is valid
    if (!response.data || response.data.size === 0) {
      return { success: false, errorMessage: "Server returned empty data" };
    }
    
    // Create download
    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
    
    return { success: true };
  } catch (error: any) {
    console.error("XML export failed:", error);
    
    // Extract meaningful error message
    let errorMessage = "Failed to export data";
    
    if (error.response) {
      // The request was made and the server responded with an error
      if (error.response.status === 500) {
        errorMessage = "Internal server error. The backend may be missing required data.";
      } else {
        try {
          // Try to get detailed error message
          if (error.response.data instanceof Blob) {
            // Convert blob to text
            const reader = new FileReader();
            reader.readAsText(error.response.data);
            const text = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
            });
            
            try {
              const errorData = JSON.parse(text);
              errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch {
              errorMessage = text || errorMessage;
            }
          } else {
            errorMessage = error.response.data?.detail || 
                          error.response.data?.message || 
                          `Error ${error.response.status}: ${error.response.statusText}`;
          }
        } catch (e) {
          errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = "No response from server. Please check if the backend is running.";
    } else if (error.message) {
      // Something else happened in setting up the request
      errorMessage = error.message;
    }
    
    return { success: false, errorMessage };
  }
};