// Environment detection utility
// Helps handle differences between Chrome extension and web app contexts

/**
 * Check if we're running in a Chrome extension context
 */
export function isExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
}

/**
 * Check if we're running in web development mode
 */
export function isWebContext(): boolean {
  return !isExtensionContext();
}

/**
 * Safe wrapper for Chrome extension APIs that might not be available in web context
 */
export class ChromeApiWrapper {
  /**
   * Safely query active tab - returns mock data in web context
   */
  static async queryActiveTab(): Promise<{ id?: number; url?: string } | null> {
    if (!isExtensionContext()) {
      // Return mock tab data for web development
      return {
        id: 1,
        url: 'http://localhost:5173' // Development server URL
      };
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab || null;
    } catch (error) {
      console.error('Failed to query active tab:', error);
      return null;
    }
  }

  /**
   * Safely send message to tab - returns mock response in web context
   */
  static async sendMessage(tabId: number, message: any): Promise<any> {
    if (!isExtensionContext()) {
      // Return mock responses for web development
      console.log('Mock Chrome message sent:', message);
      
      switch (message.action) {
        case 'getGolden':
          return { goldenId: 'mock-golden-id-123' };
        case 'search':
          return { success: true, matchCount: 3 };
        case 'clear':
          return { success: true };
        default:
          return { success: true };
      }
    }

    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error('Failed to send message to tab:', error);
      throw error;
    }
  }

  /**
   * Safely inject content script - no-op in web context
   */
  static async injectContentScript(tabId: number): Promise<void> {
    if (!isExtensionContext()) {
      console.log('Mock content script injection for tab:', tabId);
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw error;
    }
  }
}

export default ChromeApiWrapper;
