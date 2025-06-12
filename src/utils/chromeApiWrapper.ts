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
          return { success: true, goldenId: 'mock-golden-id-123' };
        case 'search':
          return { success: true, matchCount: 3 };
        case 'clear':
          return { success: true };
        default:
          return { success: true };
      }
    }

    try {
      // Add timeout to prevent hanging
      const messagePromise = chrome.tabs.sendMessage(tabId, message);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Message timeout')), 5000);
      });
      
      const response = await Promise.race([messagePromise, timeoutPromise]);
      return response;
    } catch (error) {
      console.error('Failed to send message to tab:', error);
      // Return a more specific error message
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Request timed out - content script may not be responding');
      } else if (error instanceof Error && error.message.includes('Receiving end does not exist')) {
        throw new Error('Content script not found - please refresh the page');
      }
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
      // First check if content script is already injected
      try {
        await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        console.log('Content script already injected');
        return; // Already injected
      } catch {
        // Content script not found, proceed with injection
      }

      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      
      console.log('Content script injected successfully');
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw error;
    }
  }
}

export default ChromeApiWrapper;
