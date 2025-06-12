// Example service that demonstrates using the Chrome Extension API Service
import { ChromeExtensionApiService } from './chromeExtensionApiService';

// Default API configuration
const DEFAULT_API_CONFIG = {
  apiUrl: 'https://api.example.com',
  authToken: 'your-auth-token-here',
  environment: 'production'
};

export interface GoldenCallData {
  id: string;
  status: string;
  timestamp: string;
  response: string;
  metadata?: {
    processingTime: string;
    confidence: number;
  };
}

export class GoldenCallService {
  /**
   * Fetch golden call data from API through background script
   */
  static async getGoldenCall(goldenId: string): Promise<GoldenCallData | null> {
    try {
      const config = DEFAULT_API_CONFIG;
      const url = `${config.apiUrl}/api/golden-call/${goldenId}`;
      
      const response = await ChromeExtensionApiService.get(url, {
        'Authorization': `Bearer ${config.authToken}`,
        'X-Environment': config.environment
      });

      if (response.success && response.data) {
        return response.data as GoldenCallData;
      } else {
        console.error('Failed to fetch golden call:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching golden call:', error);
      return null;
    }
  }

  /**
   * Submit a search query through the API
   */
  static async submitSearchQuery(query: string, filters?: Record<string, any>): Promise<any> {
    try {
      const config = DEFAULT_API_CONFIG;
      const url = `${config.apiUrl}/api/search`;
      
      const response = await ChromeExtensionApiService.post(url, {
        query,
        filters,
        timestamp: new Date().toISOString()
      }, {
        'Authorization': `Bearer ${config.authToken}`,
        'X-Environment': config.environment
      });

      if (response.success) {
        return response.data;
      } else {
        console.error('Search query failed:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Error submitting search query:', error);
      return null;
    }
  }
}

export default GoldenCallService;
