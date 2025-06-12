chrome.runtime.onInstalled.addListener(() => {
  console.log("Content Search Extension installed");
});
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked for tab:", tab.id);
});
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === "search" || request.action === "clear") {
    console.log("Background script received message:", request.action);
    return true;
  }
  return false;
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log("Tab updated:", tabId, tab.url);
  }
});
