// Guard against multiple injections
if (typeof window.ContentSearcher !== 'undefined' && window.contentSearcherInstance) {
    console.log('Content script already loaded, skipping initialization');
    return;
}

class ContentSearcher {
    constructor() {
        this.highlights = [];
        this.currentHighlightIndex = 0;
        this.counter = null;
        this.init();
    }

    init() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'search') {
                this.performSearch(request.searchTerm);
                sendResponse({ success: true });
            } else if (request.action === 'clear') {
                this.clearHighlights();
                sendResponse({ success: true });
            } else if (request.action === 'getGoldenIdValue') {
                const goldenIdValue = this.getGoldenIdValue();
                sendResponse({ goldenIdValue: goldenIdValue });
            }
            return true;
        });
    }

    performSearch(searchTerm) {
        this.clearHighlights();
        
        if (!searchTerm || searchTerm.trim() === '') {
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (node.nodeValue.toLowerCase().includes(searchTermLower)) {
                        const parent = node.parentNode;
                        if (parent && !this.isInExcludedElement(parent)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        let matchCount = 0;
        textNodes.forEach(textNode => {
            const text = textNode.nodeValue;
            const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
            const matches = text.match(regex);
            
            if (matches) {
                matchCount += matches.length;
                this.highlightTextNode(textNode, regex);
            }
        });

        if (matchCount > 0) {
            this.showCounter(matchCount);
            this.scrollToFirstHighlight();
        } else {
            this.showNoResultsMessage();
        }
    }

    isInExcludedElement(element) {
        const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'];
        const excludedClasses = ['content-search-highlight', 'content-search-counter'];
        
        if (excludedTags.includes(element.tagName)) {
            return true;
        }
        
        if (element.classList && excludedClasses.some(cls => element.classList.contains(cls))) {
            return true;
        }
        
        return false;
    }

    highlightTextNode(textNode, regex) {
        const text = textNode.nodeValue;
        const parent = textNode.parentNode;
        
        const parts = text.split(regex);
        const matches = text.match(regex) || [];
        
        const fragment = document.createDocumentFragment();
        let matchIndex = 0;
        
        for (let i = 0; i < parts.length; i++) {
            if (parts[i]) {
                fragment.appendChild(document.createTextNode(parts[i]));
            }
            
            if (i < parts.length - 1 && matchIndex < matches.length) {
                const highlightSpan = document.createElement('span');
                highlightSpan.className = 'content-search-highlight';
                highlightSpan.textContent = matches[matchIndex];
                highlightSpan.setAttribute('data-search-index', this.highlights.length);
                
                this.highlights.push(highlightSpan);
                fragment.appendChild(highlightSpan);
                matchIndex++;
            }
        }
        
        parent.replaceChild(fragment, textNode);
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    scrollToFirstHighlight() {
        if (this.highlights.length > 0) {
            this.currentHighlightIndex = 0;
            this.highlightCurrent();
        }
    }

    highlightCurrent() {
        this.highlights.forEach((highlight, index) => {
            if (index === this.currentHighlightIndex) {
                highlight.classList.add('active');
                highlight.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            } else {
                highlight.classList.remove('active');
            }
        });
    }

    showCounter(count) {
        this.removeCounter();
        
        this.counter = document.createElement('div');
        this.counter.className = 'content-search-counter';
        this.counter.textContent = `${count} match${count !== 1 ? 'es' : ''} found`;
        
        document.body.appendChild(this.counter);
        
        setTimeout(() => {
            if (this.counter && this.counter.parentNode) {
                this.counter.style.opacity = '0.7';
            }
        }, 3000);
    }

    showNoResultsMessage() {
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

    removeCounter() {
        if (this.counter && this.counter.parentNode) {
            this.counter.parentNode.removeChild(this.counter);
            this.counter = null;
        }
    }

    clearHighlights() {
        this.highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                parent.normalize();
            }
        });
        
        this.highlights = [];
        this.currentHighlightIndex = 0;
        this.removeCounter();
    }

    getGoldenIdValue() {
        try {
            // Extract golden ID value from the specific span element
            const usernameSpan = document.querySelector('.p-nickname.vcard-username.d-block');
            if (usernameSpan) {
                const username = usernameSpan.textContent?.trim();
                if (username && username.length > 0) {
                    console.log('Found username in span element:', username);
                    return username;
                }
            }

            // Try alternative selectors for GitHub usernames
            const altSelectors = [
                '[data-hovercard-type="user"] .p-nickname',
                '.vcard-username',
                '.p-nickname',
                '[itemprop="additionalName"]'
            ];

            for (const selector of altSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const username = element.textContent?.trim();
                    if (username && username.length > 0) {
                        console.log('Found username with selector', selector, ':', username);
                        return username;
                    }
                }
            }

            // Fallback: try to get golden ID value from URL
            const url = window.location.href;
            const usernameMatch = url.match(/github\.com\/([^\/]+)/);
            if (usernameMatch && usernameMatch[1]) {
                console.log('Found username from URL:', usernameMatch[1]);
                return usernameMatch[1];
            }

            console.log('No golden ID value found on page');
            return null;
        } catch (error) {
            console.error('Error extracting golden ID value:', error);
            return null;
        }
    }
}

// Mark as loaded and initialize
window.ContentSearcher = ContentSearcher;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.contentSearcherInstance) {
            window.contentSearcherInstance = new ContentSearcher();
        }
    });
} else {
    if (!window.contentSearcherInstance) {
        window.contentSearcherInstance = new ContentSearcher();
    }
}