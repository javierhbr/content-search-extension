// Chrome Extension API Service
// Handles API requests through background script to bypass CORS restrictions

export interface ApiRequest {
  url: string;
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  };
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class ChromeExtensionApiService {
  /**
   * Make an API request through the background script
   * This bypasses CORS restrictions by using the background script's fetch capabilities
   */
  static async request(url: string, options: ApiRequest['options'] = {}): Promise<ApiResponse> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: 'api-request',
          data: { url, options }
        },
        (response: ApiResponse) => {
          if (chrome.runtime.lastError) {
            resolve({
              success: false,
              error: chrome.runtime.lastError.message
            });
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * GET request
   */
  static async get(url: string, headers?: Record<string, string>): Promise<ApiResponse> {
    return this.request(url, {
      method: 'GET',
      headers
    });
  }

  /**
   * POST request
   */
  static async post(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse> {
    return this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body
    });
  }

  /**
   * PUT request
   */
  static async put(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse> {
    return this.request(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body
    });
  }

  /**
   * DELETE request
   */
  static async delete(url: string, headers?: Record<string, string>): Promise<ApiResponse> {
    return this.request(url, {
      method: 'DELETE',
      headers
    });
  }
}

export default ChromeExtensionApiService;
