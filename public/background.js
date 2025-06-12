// Background script for Chrome Extension
// Handles CORS bypass and API requests

chrome.runtime.onInstalled.addListener(() => {
  console.log('Content Search Extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
});

// Handle messages from the popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);

  // Handle API requests to bypass CORS
  if (request.type === 'api-request') {
    handleApiRequest(request.data)
      .then(response => {
        console.log('API request successful:', response);
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('API request failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }

  // Handle other message types
  if (request.action === 'search' || request.action === 'clear') {
    console.log('Background script handling action:', request.action);
    sendResponse({ success: true });
    return true;
  }

  return false;
});

// Handle API requests
async function handleApiRequest(requestData) {
  const { url, options = {} } = requestData;
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tabId, tab.url);
  }
});
