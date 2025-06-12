// Background script for Content Search Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Content Search Extension installed');
});

chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
});

chrome.runtime.onMessage.addListener((
  request: any,
  _sender: chrome.runtime.MessageSender,
  _sendResponse: (response?: any) => void
): boolean => {
  if (request.action === 'search' || request.action === 'clear') {
    console.log('Background script received message:', request.action);
    return true;
  }
  return false;
});

chrome.tabs.onUpdated.addListener((
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab
) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tabId, tab.url);
  }
});

// Export empty object to make this a module
export {};
