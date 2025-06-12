import { SearchRequest, SearchResponse } from '@/types';
import './content.css';

class ContentSearcher {
  private highlights: HTMLElement[] = [];
  private currentHighlightIndex: number = 0;
  private counter: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    chrome.runtime.onMessage.addListener((
      request: SearchRequest,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: SearchResponse) => void
    ): boolean => {
      if (request.action === 'search' && request.searchTerm) {
        this.performSearch(request.searchTerm);
        sendResponse({ success: true });
      } else if (request.action === 'clear') {
        this.clearHighlights();
        sendResponse({ success: true });
      }
      return true;
    });
  }

  private performSearch(searchTerm: string): void {
    this.clearHighlights();
    
    if (!searchTerm || searchTerm.trim() === '') {
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Text): number => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'];
          if (excludedTags.includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          const text = node.nodeValue || '';
          return text.toLowerCase().includes(searchTermLower) 
            ? NodeFilter.FILTER_ACCEPT 
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    textNodes.forEach(textNode => {
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

  private highlightTextNode(textNode: Text, searchTerm: string): void {
    const text = textNode.nodeValue || '';
    const parent = textNode.parentNode;
    if (!parent) return;

    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
    const matches = text.match(regex);
    if (!matches) return;

    const parts = text.split(regex);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        if (regex.test(parts[i])) {
          const highlightSpan = document.createElement('span');
          highlightSpan.className = 'content-search-highlight';
          highlightSpan.textContent = parts[i];
          highlightSpan.setAttribute('data-search-index', this.highlights.length.toString());
          
          this.highlights.push(highlightSpan);
          fragment.appendChild(highlightSpan);
        } else {
          fragment.appendChild(document.createTextNode(parts[i]));
        }
      }
    }

    parent.replaceChild(fragment, textNode);
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private scrollToFirstHighlight(): void {
    if (this.highlights.length > 0) {
      this.currentHighlightIndex = 0;
      this.highlights[0].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      this.highlightCurrent();
    }
  }

  private highlightCurrent(): void {
    this.highlights.forEach((highlight, index) => {
      if (index === this.currentHighlightIndex) {
        highlight.classList.add('active');
      } else {
        highlight.classList.remove('active');
      }
    });
  }

  private showCounter(count: number): void {
    this.removeCounter();
    
    this.counter = document.createElement('div');
    this.counter.className = 'content-search-counter';
    this.counter.textContent = `${count} match${count !== 1 ? 'es' : ''} found`;
    document.body.appendChild(this.counter);

    setTimeout(() => {
      if (this.counter && this.counter.parentNode) {
        this.counter.parentNode.removeChild(this.counter);
        this.counter = null;
      }
    }, 3000);
  }

  private showNoResultsMessage(): void {
    this.removeCounter();
    
    this.counter = document.createElement('div');
    this.counter.className = 'content-search-counter';
    this.counter.textContent = 'No matches found';
    this.counter.style.backgroundColor = '#d32f2f';
    document.body.appendChild(this.counter);

    setTimeout(() => {
      this.removeCounter();
    }, 3000);
  }

  private removeCounter(): void {
    if (this.counter && this.counter.parentNode) {
      this.counter.parentNode.removeChild(this.counter);
      this.counter = null;
    }
  }

  private clearHighlights(): void {
    this.highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
        parent.normalize();
      }
    });
    
    this.highlights = [];
    this.currentHighlightIndex = 0;
    this.removeCounter();
  }

  public getGoldenIdValue(): string | null {
    try {
      const url = window.location.href;
      const usernameMatch = url.match(/github\.com\/([^/]+)/);
      if (usernameMatch) {
        return usernameMatch[1];
      }
      return null;
    } catch (error) {
      console.error('Error extracting golden ID:', error);
      return null;
    }
  }
}

// Guard against multiple injections
declare global {
  interface Window {
    ContentSearcher?: typeof ContentSearcher;
    contentSearcherInstance?: ContentSearcher;
  }
}

// Initialize immediately to prevent tree-shaking
const initializeContentScript = () => {
  if (typeof window.ContentSearcher !== 'undefined' && window.contentSearcherInstance) {
    console.log('Content script already loaded, skipping initialization');
  } else {
    // Initialize content searcher
    window.ContentSearcher = ContentSearcher;
    window.contentSearcherInstance = new ContentSearcher();
    console.log('Content Search Extension content script loaded');
  }
};

// Run initialization immediately
initializeContentScript();

// Make sure this isn't tree-shaken by adding a console log
console.log('Content Search Extension: Script loaded');

// Export for module system
export { ContentSearcher };
