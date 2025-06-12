var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class ContentSearcher {
  constructor() {
    __publicField(this, "highlights", []);
    __publicField(this, "currentHighlightIndex", 0);
    __publicField(this, "counter", null);
    this.init();
  }
  init() {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === "search" && request.searchTerm) {
        this.performSearch(request.searchTerm);
        sendResponse({ success: true });
      } else if (request.action === "clear") {
        this.clearHighlights();
        sendResponse({ success: true });
      }
      return true;
    });
  }
  performSearch(searchTerm) {
    this.clearHighlights();
    if (!searchTerm || searchTerm.trim() === "") {
      return;
    }
    const searchTermLower = searchTerm.toLowerCase();
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node2) => {
          const parent = node2.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const excludedTags = ["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME"];
          if (excludedTags.includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          const text = node2.nodeValue || "";
          return text.toLowerCase().includes(searchTermLower) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    textNodes.forEach((textNode) => {
      this.highlightTextNode(textNode, searchTerm);
    });
    if (this.highlights.length > 0) {
      this.scrollToFirstHighlight();
      this.highlightCurrent();
      this.showCounter(this.highlights.length);
    } else {
      this.showNoResultsMessage();
    }
  }
  highlightTextNode(textNode, searchTerm) {
    const text = textNode.nodeValue || "";
    const parent = textNode.parentNode;
    if (!parent) return;
    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, "gi");
    const matches = text.match(regex);
    if (!matches) return;
    const parts = text.split(regex);
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        if (regex.test(parts[i])) {
          const highlightSpan = document.createElement("span");
          highlightSpan.className = "content-search-highlight";
          highlightSpan.textContent = parts[i];
          highlightSpan.setAttribute("data-search-index", this.highlights.length.toString());
          this.highlights.push(highlightSpan);
          fragment.appendChild(highlightSpan);
        } else {
          fragment.appendChild(document.createTextNode(parts[i]));
        }
      }
    }
    parent.replaceChild(fragment, textNode);
  }
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  scrollToFirstHighlight() {
    if (this.highlights.length > 0) {
      this.currentHighlightIndex = 0;
      this.highlights[0].scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      this.highlightCurrent();
    }
  }
  highlightCurrent() {
    this.highlights.forEach((highlight, index) => {
      if (index === this.currentHighlightIndex) {
        highlight.classList.add("active");
      } else {
        highlight.classList.remove("active");
      }
    });
  }
  showCounter(count) {
    this.removeCounter();
    this.counter = document.createElement("div");
    this.counter.className = "content-search-counter";
    this.counter.textContent = `${count} match${count !== 1 ? "es" : ""} found`;
    document.body.appendChild(this.counter);
    setTimeout(() => {
      if (this.counter && this.counter.parentNode) {
        this.counter.parentNode.removeChild(this.counter);
        this.counter = null;
      }
    }, 3e3);
  }
  showNoResultsMessage() {
    this.removeCounter();
    this.counter = document.createElement("div");
    this.counter.className = "content-search-counter";
    this.counter.textContent = "No matches found";
    this.counter.style.backgroundColor = "#d32f2f";
    document.body.appendChild(this.counter);
    setTimeout(() => {
      this.removeCounter();
    }, 3e3);
  }
  removeCounter() {
    if (this.counter && this.counter.parentNode) {
      this.counter.parentNode.removeChild(this.counter);
      this.counter = null;
    }
  }
  clearHighlights() {
    this.highlights.forEach((highlight) => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ""), highlight);
        parent.normalize();
      }
    });
    this.highlights = [];
    this.currentHighlightIndex = 0;
    this.removeCounter();
  }
  getGoldenIdValue() {
    try {
      const url = window.location.href;
      const usernameMatch = url.match(/github\.com\/([^/]+)/);
      if (usernameMatch) {
        return usernameMatch[1];
      }
      return null;
    } catch (error) {
      console.error("Error extracting golden ID:", error);
      return null;
    }
  }
}
const initializeContentScript = () => {
  if (typeof window.ContentSearcher !== "undefined" && window.contentSearcherInstance) {
    console.log("Content script already loaded, skipping initialization");
  } else {
    window.ContentSearcher = ContentSearcher;
    window.contentSearcherInstance = new ContentSearcher();
    console.log("Content Search Extension content script loaded");
  }
};
initializeContentScript();
console.log("Content Search Extension: Script loaded");
