# 🌐 Web Development Mode Guide

## Overview

Your Chrome extension project now supports **dual-mode development**:

1. **Web App Mode** (`npm run dev`) - Normal React app for rapid development
2. **Extension Mode** (`npm run build`) - Chrome extension for testing

## 🚀 Development Workflows

### Web Development (Recommended for UI Development)

```bash
npm run dev
```

**What happens:**
- Runs React app at `http://localhost:5173`
- Chrome APIs are mocked with fallback data
- Uses localStorage instead of Chrome storage
- Perfect for UI development and testing

**Features:**
- ✅ Hot reload for instant development
- ✅ Browser DevTools for debugging
- ✅ All React functionality works
- ✅ API calls work through proxy
- ✅ Visual indicator shows "Web Development Mode"

### Chrome Extension Development

```bash
npm run build                    # Development extension
npm run build:extension:staging  # Staging extension
npm run build:extension:prod     # Production extension
```

**What happens:**
- Builds actual Chrome extension in `dist/` folder
- Uses real Chrome APIs
- Uses Chrome storage for persistence
- Ready for Chrome installation

## 🔧 How It Works

### Environment Detection

The app automatically detects its environment:

```typescript
import { isExtensionContext, ChromeApiWrapper } from '@/utils/chromeApiWrapper';

// Automatically handles both contexts
const tab = await ChromeApiWrapper.queryActiveTab();
```

### API Handling

| Context | Chrome APIs | Storage | Content Scripts |
|---------|-------------|---------|-----------------|
| Web App | Mocked responses | localStorage | No-op |
| Extension | Real Chrome APIs | chrome.storage | Actual injection |

### Configuration Storage

| Context | Storage Method | Location |
|---------|----------------|----------|
| Web App | `localStorage.setItem('searchConfig', ...)` | Browser localStorage |
| Extension | `chrome.storage.local.set({searchConfig: ...})` | Chrome extension storage |

## 🎯 Development Best Practices

### 1. UI Development
- Use **`npm run dev`** for fast UI iteration
- Test responsive design and styling
- Develop React components and interactions

### 2. Chrome Extension Features
- Use **`npm run build`** to test extension-specific features
- Test content script injection
- Verify Chrome API integrations

### 3. API Development
- Web mode proxies API calls to development server
- Extension mode can bypass CORS through background script
- Both modes use the same API service layer

## 🔍 Visual Indicators

### Web Development Mode
When running `npm run dev`, you'll see:
```
🌐 Web Development Mode
```
This indicator helps you know you're in web development context.

### Extension Mode
No indicator - normal Chrome extension UI.

## 🌍 Environment Configuration

All environments work in both modes:

```bash
# Development environment (default)
npm run dev                     # Web app with dev env
npm run build:extension:dev     # Extension with dev env

# Staging environment
npm run build:extension:staging # Extension with staging env

# Production environment  
npm run build:extension:prod    # Extension with prod env
```

## 🛠 Troubleshooting

### Web App Not Starting
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Extension Build Issues
```bash
# Clean build and rebuild
npm run clean  # or rm -rf dist
npm run build
```

### Chrome API Errors in Web Mode
These are expected and handled gracefully:
- Chrome APIs return mock data
- Storage uses localStorage
- Content scripts are no-ops

## 📋 Quick Reference

| Command | Mode | Output | Use Case |
|---------|------|--------|----------|
| `npm run dev` | Web App | `localhost:5173` | UI Development |
| `npm run build` | Extension | `dist/` folder | Extension Testing |
| `npm run build:web` | Web Build | `dist/` folder | Web Deployment |

## ✨ Benefits

✅ **Faster Development**: Hot reload for UI changes  
✅ **Better Debugging**: Full browser DevTools access  
✅ **Flexible Testing**: Test in both web and extension contexts  
✅ **Shared Code**: Same components work in both modes  
✅ **Environment Parity**: Same API calls and configuration

Happy developing! 🎉
