# Content Search Extension

A Chrome extension that allows users to search and highlight content on web pages using predefined search options.

## Features

- **Popup Interface**: Click the extension icon to open a popup with a searchable dropdown
- **Searchable Dropdown**: Type to filter predefined options or enter custom search terms
- **Predefined Options**: Built-in search options across multiple categories:
  - envMode
  - featureFlags - Output field params parsed
  - keyValuePairs
  - ws-request
  - ws-response-fields
  - ws-response-WsResponseDto
- **Text Search & Highlight**: Search for selected terms on the current web page
- **Visual Feedback**: Highlighted matches with scroll-to-first functionality
- **Match Counter**: Shows the number of matches found
- **Clear Highlights**: Remove all highlights from the page

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension icon will appear in the Chrome toolbar

## Usage

1. **Search Content**:
   - Click the extension icon to open the popup
   - Type in the search field to filter options or click the dropdown arrow to see all options
   - Select a predefined option or type your own search term
   - Click "Search & Highlight" to find and highlight matches on the current page

2. **Clear Highlights**:
   - Click "Clear Highlights" to remove all highlighting from the page

## Search Categories

The extension provides the following search categories:

- **envMode**: Searches for "envMode"
- **featureFlags - Output field params parsed**: Searches for "Output field params parsed"
- **keyValuePairs**: Searches for "New KVP log"
- **ws-request**: Searches for "Api Request builder"
- **ws-response-fields**: Searches for "Output field params parsed"
- **ws-response-WsResponseDto**: Searches for "WsResponseDto"

## File Structure

```
content-search-extension/
├── manifest.json          # Extension manifest
├── popup.html             # Popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── content.js             # Content script for page interaction
├── content.css            # Highlighting styles
├── background.js          # Background service worker
├── sample-config.json     # Example configuration
└── README.md              # This file
```

## Development

The extension uses:
- **Manifest V3** for Chrome extension API
- **Content Scripts** to interact with web pages
- **Chrome Storage API** to persist configuration URLs
- **Chrome Tabs API** for communication between popup and content scripts

## Permissions

- `activeTab`: Access to the currently active tab for content searching
- `storage`: Store and retrieve the JSON configuration URL
- `<all_urls>`: Host permissions for content script injection