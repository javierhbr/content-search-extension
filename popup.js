// URL matching constants
const GOLDEN_CALL_DOMAINS = ['github.com/javierhbr'];
const SEARCH_DOMAINS = ['.emol.com'];

class PopupController {
    constructor() {
        this.selectedValue = '';
        this.filteredOptions = [];
        this.highlightedIndex = -1;
        this.currentMode = 'normal';
        this.activeTab = 'goldencall';
        this.injectedTabs = new Set(); // Track which tabs have content script injected
        this.isAutoPopulating = false; // Prevent concurrent auto-populate calls
        // init() will be called manually after construction
    }

    async init() {
        await this.setupOptions();
        await this.determineActiveTab();
        this.bindEvents();
        this.updateSearchButton();
        this.updateConfigStatus();
        
        // Auto-populate Golden Call input if Golden tab is active by default
        if (this.activeTab === 'goldencall') {
            this.autoPopulateGoldenCall();
        }
    }

    async setupOptions() {
        // Default options as fallback
        const defaultOptions = [
            { label: 'envMode', searchValue: 'envMode' },
            { label: 'featureFlags - Output field params parsed', searchValue: 'Output field params parsed' },
            { label: 'keyValuePairs', searchValue: 'New KVP log' },
            { label: 'ws-request', searchValue: 'Api Request builder' },
            { label: 'ws-response-fields', searchValue: 'Output field params parsed' },
            { label: 'ws-response-WsResponseDto', searchValue: 'WsResponseDto' }
        ];

        // Set default options immediately to avoid empty state
        this.options = defaultOptions;
        this.filteredOptions = [...this.options];
        this.updateConfigStatus('Default config', '');

        try {
            // Try to load options from local storage
            const result = await chrome.storage.local.get(['searchConfig']);
            
            if (result.searchConfig && Array.isArray(result.searchConfig) && result.searchConfig.length > 0) {
                // Replace with stored configuration
                this.options = result.searchConfig.map(item => ({
                    label: item.label,
                    searchValue: item.searchValue
                }));
                this.filteredOptions = [...this.options];
                this.updateConfigStatus('Custom config', 'loaded');
                console.log('Loaded custom configuration from storage:', this.options.length, 'options');
            } else {
                console.log('Using default configuration:', this.options.length, 'options');
            }
        } catch (error) {
            console.error('Error loading configuration from storage:', error);
            // Keep default options already set
        }
    }

    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        const dropdownOptions = document.getElementById('dropdownOptions');
        const dropdownArrow = document.querySelector('.dropdown-arrow');

        searchInput.addEventListener('input', () => this.onInput());
        searchInput.addEventListener('focus', () => this.showDropdown());
        searchInput.addEventListener('blur', () => this.hideDropdown());
        searchInput.addEventListener('keydown', (e) => this.onKeydown(e));
        
        dropdownArrow.addEventListener('click', () => this.toggleDropdown());
        
        document.getElementById('searchButton').addEventListener('click', () => this.performSearch());
        document.getElementById('clearButton').addEventListener('click', () => this.clearHighlights());
        
        // Golden Call events
        document.getElementById('getGoldenButton').addEventListener('click', () => this.getGoldenCall());
        document.getElementById('goldenInput').addEventListener('input', () => this.updateGoldenButton());
        
        // Configuration file events
        document.getElementById('loadConfigButton').addEventListener('click', () => this.loadConfigFile());
        document.getElementById('configFileInput').addEventListener('change', (e) => this.handleConfigFile(e));
        
        // Add right-click context menu to clear configuration
        document.getElementById('loadConfigButton').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.clearStoredConfig();
        });
        
        // Tab events
        this.bindTabEvents();

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select')) {
                this.hideDropdown();
            }
        });
    }

    onInput() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.toLowerCase();
        
        this.filteredOptions = this.options.filter(option => 
            option.label.toLowerCase().includes(query) || 
            (option.searchValue && option.searchValue.toLowerCase().includes(query))
        );
        
        this.highlightedIndex = -1;
        this.renderOptions();
        this.showDropdown();
        this.updateSearchButton();
    }

    onKeydown(e) {
        const dropdownOptions = document.getElementById('dropdownOptions');
        
        if (!dropdownOptions.classList.contains('open')) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                this.showDropdown();
                return;
            }
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredOptions.length - 1);
                this.updateHighlight();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
                this.updateHighlight();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.highlightedIndex >= 0) {
                    this.selectOption(this.filteredOptions[this.highlightedIndex]);
                }
                break;
            case 'Escape':
                this.hideDropdown();
                break;
        }
    }

    renderOptions() {
        const dropdownOptions = document.getElementById('dropdownOptions');
        dropdownOptions.innerHTML = '';
        
        this.filteredOptions.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            optionDiv.textContent = option.label;
            optionDiv.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.selectOption(option);
            });
            dropdownOptions.appendChild(optionDiv);
        });
    }

    updateHighlight() {
        const options = document.querySelectorAll('.option');
        options.forEach((option, index) => {
            if (index === this.highlightedIndex) {
                option.classList.add('highlighted');
            } else {
                option.classList.remove('highlighted');
            }
        });
    }

    selectOption(option) {
        const searchInput = document.getElementById('searchInput');
        searchInput.value = option.label;
        
        this.currentMode = 'normal';
        this.selectedValue = option.searchValue;
        this.showNormalUI();
        
        this.hideDropdown();
        this.updateSearchButton();
    }

    showDropdown() {
        const dropdownOptions = document.getElementById('dropdownOptions');
        const searchInput = document.getElementById('searchInput');
        this.renderOptions();
        dropdownOptions.classList.add('open');
        searchInput.setAttribute('aria-expanded', 'true');
    }

    hideDropdown() {
        setTimeout(() => {
            const dropdownOptions = document.getElementById('dropdownOptions');
            const searchInput = document.getElementById('searchInput');
            dropdownOptions.classList.remove('open');
            searchInput.setAttribute('aria-expanded', 'false');
        }, 150);
    }

    toggleDropdown() {
        const dropdownOptions = document.getElementById('dropdownOptions');
        if (dropdownOptions.classList.contains('open')) {
            this.hideDropdown();
        } else {
            this.showDropdown();
            document.getElementById('searchInput').focus();
        }
    }

    updateSearchButton() {
        const searchButton = document.getElementById('searchButton');
        const searchInput = document.getElementById('searchInput');
        
        if (this.activeTab === 'goldencall') {
            // Golden call tab has its own button, search button is not visible
            return;
        }
        
        const hasSelection = this.selectedValue || searchInput.value.trim();
        searchButton.disabled = !hasSelection;
    }


    bindTabEvents() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update active tab
        this.activeTab = tabName;
        
        // Update tab button states and ARIA attributes
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        
        const activeTabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('active');
            activeTabButton.setAttribute('aria-selected', 'true');
        }
        
        // Update tab content visibility
        document.querySelectorAll('.tab-pane').forEach(content => {
            content.classList.remove('active');
        });
        
        // Handle the specific tab IDs
        let tabContentId;
        if (tabName === 'goldencall') {
            tabContentId = 'goldenCallTab';
        } else {
            tabContentId = 'searchTab';
        }
        
        document.getElementById(tabContentId).classList.add('active');
        
        // Reset states when switching tabs
        if (tabName === 'goldencall') {
            this.updateGoldenButton();
            // Auto-populate Golden Call input when tab is opened
            this.autoPopulateGoldenCall();
            // Focus on input for better UX
            setTimeout(() => {
                document.getElementById('goldenInput').focus();
            }, 100);
        } else if (tabName === 'search') {
            this.currentMode = 'normal';
            this.updateSearchButton();
            // Focus on search input for better UX
            setTimeout(() => {
                document.getElementById('searchInput').focus();
            }, 100);
        }
    }

    showNormalUI() {
        document.getElementById('logsContainer').style.display = 'none';
    }

    updateGoldenButton() {
        const goldenInput = document.getElementById('goldenInput');
        const getGoldenButton = document.getElementById('getGoldenButton');
        getGoldenButton.disabled = !goldenInput.value.trim();
    }

    async getGoldenCall() {
        const goldenInput = document.getElementById('goldenInput');
        const getGoldenButton = document.getElementById('getGoldenButton');
        const goldenId = goldenInput.value.trim();
        
        if (!goldenId) {
            this.showStatus('Please enter a Golden Call ID', 'error');
            goldenInput.focus();
            return;
        }

        // Validate domain for Golden tab
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!this.isValidDomainForGolden(tab.url)) {
                this.showStatus('❌ Golden Call only works on github.com/javierhbr', 'error');
                return;
            }
        } catch (error) {
            this.showStatus('❌ Cannot access current tab', 'error');
            return;
        }

        // Show loading state
        this.setButtonLoading(getGoldenButton, true);
        this.showStatus('🧹 Clearing previous highlights...', 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we can access this tab
            if (!this.canAccessTab(tab)) {
                this.showStatus('❌ Cannot search on this page. Try a regular webpage.', 'error');
                return;
            }
            
            // First, clear any existing highlights
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'clear'
                });
            } catch (connectionError) {
                // Content script not loaded, inject it
                this.showStatus('🔄 Loading search functionality...', 'info');
                await this.injectContentScript(tab.id);
                
                // Wait a moment for script to load
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Clear highlights after injection
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'clear'
                });
            }
            
            // Brief pause to show clearing status
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Now search for Golden Call
            this.showStatus('🔍 Searching for Golden Call...', 'info');
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'search',
                searchTerm: goldenId
            });
            
            this.showStatus(`✨ Golden Call "${goldenId}" found and highlighted!`, 'success');
            
            // Close popup after a brief delay to show success message
            setTimeout(() => {
                window.close();
            }, 1500);
        } catch (error) {
            console.error('Error getting golden call:', error);
            this.showStatus('❌ Error getting golden call. Please refresh the page and try again.', 'error');
        } finally {
            this.setButtonLoading(getGoldenButton, false);
        }
    }

    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const searchTerm = this.selectedValue || searchInput.value.trim();
        
        if (!searchTerm) {
            this.showStatus('Please enter or select a search term', 'error');
            searchInput.focus();
            return;
        }

        // Validate domain for Search tab
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!this.isValidDomainForSearch(tab.url)) {
                this.showStatus('❌ Search only works on emol.com domains', 'error');
                return;
            }
        } catch (error) {
            this.showStatus('❌ Cannot access current tab', 'error');
            return;
        }

        // Show loading state
        this.setButtonLoading(searchButton, true);
        this.showStatus('🧹 Clearing previous highlights...', 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we can access this tab
            if (!this.canAccessTab(tab)) {
                this.showStatus('❌ Cannot search on this page. Try a regular webpage.', 'error');
                return;
            }
            
            // First, clear any existing highlights
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'clear'
                });
            } catch (connectionError) {
                // Content script not loaded, inject it
                this.showStatus('🔄 Loading search functionality...', 'info');
                await this.injectContentScript(tab.id);
                
                // Wait a moment for script to load
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Clear highlights after injection
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'clear'
                });
            }
            
            // Brief pause to show clearing status
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Now perform the new search
            this.showStatus('🔍 Searching and highlighting...', 'info');
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'search',
                searchTerm: searchTerm
            });
            
            this.showStatus(`✨ Search completed for: "${searchTerm}"`, 'success');
            
            // Close popup after a brief delay to show success message
            setTimeout(() => {
                window.close();
            }, 1500);
        } catch (error) {
            console.error('Error performing search:', error);
            this.showStatus('❌ Error performing search. Please refresh the page and try again.', 'error');
        } finally {
            this.setButtonLoading(searchButton, false);
        }
    }

    async clearHighlights() {
        const clearButton = document.getElementById('clearButton');
        
        // Show loading state
        this.setButtonLoading(clearButton, true);
        this.showStatus('✨ Clearing highlights...', 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we can access this tab
            if (!this.canAccessTab(tab)) {
                this.showStatus('❌ Cannot clear highlights on this page.', 'error');
                return;
            }
            
            // Try to send message, if it fails, inject content script and retry
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'clear'
                });
            } catch (connectionError) {
                // Content script not loaded, inject it
                this.showStatus('🔄 Loading clear functionality...', 'info');
                await this.injectContentScript(tab.id);
                
                // Wait a moment for script to load, then retry
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'clear'
                });
            }
            
            this.showStatus('🎉 All highlights cleared successfully!', 'success');
        } catch (error) {
            console.error('Error clearing highlights:', error);
            this.showStatus('❌ Error clearing highlights. Please refresh the page and try again.', 'error');
        } finally {
            this.setButtonLoading(clearButton, false);
        }
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            const originalText = button.innerHTML;
            button.dataset.originalText = originalText;
            button.innerHTML = '<span class="loading-spinner">⏳</span> Loading...';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
                delete button.dataset.originalText;
            }
        }
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = 'status';
            }, 3000);
        }
    }

    canAccessTab(tab) {
        // Check if the tab URL is accessible for content scripts
        if (!tab.url) return false;
        
        const restrictedProtocols = ['chrome:', 'chrome-extension:', 'edge:', 'moz-extension:', 'about:'];
        const restrictedPages = ['chrome.google.com/webstore'];
        
        // Check protocols
        if (restrictedProtocols.some(protocol => tab.url.startsWith(protocol))) {
            return false;
        }
        
        // Check specific restricted pages
        if (restrictedPages.some(page => tab.url.includes(page))) {
            return false;
        }
        
        return true;
    }

    async injectContentScript(tabId) {
        try {
            // Inject the content script and CSS
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            });
            
            await chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ['content.css']
            });
        } catch (error) {
            console.error('Failed to inject content script:', error);
            throw new Error('Failed to load search functionality on this page');
        }
    }

    // Configuration management methods
    loadConfigFile() {
        const fileInput = document.getElementById('configFileInput');
        fileInput.click();
    }

    async handleConfigFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.updateConfigStatus('Loading...', 'loading');

        try {
            const text = await file.text();
            const config = JSON.parse(text);
            
            // Validate configuration format
            if (!this.validateConfig(config)) {
                throw new Error('Invalid configuration format. Expected array of objects with "label" and "searchValue" properties.');
            }

            // Save the entire JSON content to local storage
            await this.saveConfig(config);
            
            // Replace current options with loaded configuration
            this.options = config.map(item => ({
                label: item.label,
                searchValue: item.searchValue
            }));
            
            this.filteredOptions = [...this.options];
            
            // Clear current input and reset selection
            const searchInput = document.getElementById('searchInput');
            searchInput.value = '';
            this.selectedValue = '';
            
            // Force refresh the dropdown options immediately
            this.refreshDropdownOptions();
            
            // Update search button state
            this.updateSearchButton();
            
            this.updateConfigStatus('Custom config', 'loaded');
            this.showStatus(`✅ Configuration loaded successfully! ${config.length} search options available.`, 'success');
            
            console.log('Configuration loaded and saved:', config.length, 'options');
        } catch (error) {
            console.error('Error loading configuration:', error);
            this.updateConfigStatus('Load failed', 'error');
            this.showStatus('❌ Failed to load configuration: ' + error.message, 'error');
        }

        // Clear the file input
        event.target.value = '';
    }

    validateConfig(config) {
        // Basic validation - should be an array of objects with label and searchValue
        if (!Array.isArray(config)) {
            return false;
        }

        return config.every(item => 
            typeof item === 'object' && 
            typeof item.label === 'string' && 
            typeof item.searchValue === 'string'
        );
    }

    async saveConfig(config) {
        try {
            await chrome.storage.local.set({ searchConfig: config });
        } catch (error) {
            console.error('Error saving configuration:', error);
            throw new Error('Failed to save configuration to storage');
        }
    }



    updateConfigStatus(message, type = '') {
        const statusElement = document.getElementById('configStatus');
        statusElement.textContent = message;
        statusElement.className = `config-status ${type}`;
    }

    refreshDropdownOptions() {
        // Force refresh the dropdown with new options
        const dropdownOptions = document.getElementById('dropdownOptions');
        const searchInput = document.getElementById('searchInput');
        
        // Clear existing options
        dropdownOptions.innerHTML = '';
        
        // Render new options
        this.filteredOptions.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            optionDiv.textContent = option.label;
            optionDiv.setAttribute('role', 'option');
            optionDiv.setAttribute('data-value', option.searchValue);
            optionDiv.setAttribute('data-search', option.searchValue);
            
            optionDiv.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.selectOption(option);
            });
            
            dropdownOptions.appendChild(optionDiv);
        });
        
        // Show dropdown briefly to demonstrate the refresh
        if (this.filteredOptions.length > 0) {
            this.showDropdown();
            
            // Auto-hide after 2 seconds
            setTimeout(() => {
                this.hideDropdown();
            }, 2000);
        }
    }

    async clearStoredConfig() {
        try {
            await chrome.storage.local.remove(['searchConfig']);
            
            // Reset to default options
            await this.setupOptions();
            
            // Clear current input and reset selection
            const searchInput = document.getElementById('searchInput');
            searchInput.value = '';
            this.selectedValue = '';
            
            // Force refresh the dropdown options immediately
            this.refreshDropdownOptions();
            
            // Update search button state
            this.updateSearchButton();
            
            this.showStatus('✅ Configuration reset to default options', 'success');
            console.log('Configuration cleared, reverted to defaults');
        } catch (error) {
            console.error('Error clearing configuration:', error);
            this.showStatus('❌ Failed to clear configuration', 'error');
        }
    }

    // Domain validation methods
    isValidDomainForGolden(url) {
        if (!url) return false;
        return GOLDEN_CALL_DOMAINS.some(domain => url.includes(domain));
    }

    isValidDomainForSearch(url) {
        if (!url) return false;
        return SEARCH_DOMAINS.some(domain => url.includes(domain));
    }

    // Determine which tab should be active based on current URL
    async determineActiveTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.url) return;

            if (this.isValidDomainForGolden(tab.url)) {
                this.activeTab = 'goldencall';
                this.switchTab('goldencall');
            } else if (this.isValidDomainForSearch(tab.url)) {
                this.activeTab = 'search';
                this.switchTab('search');
            }
            // If no matching URL, keep default activeTab ('goldencall')
        } catch (error) {
            console.log('Could not determine active tab from URL:', error);
            // Keep default activeTab
        }
    }

    // Auto-populate Golden Call input with golden ID value from HTML
    async autoPopulateGoldenCall() {
        // Prevent concurrent executions
        if (this.isAutoPopulating) {
            console.log('Auto-populate already in progress, skipping');
            return;
        }

        this.isAutoPopulating = true;
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Only auto-populate if we're on a valid GitHub domain
            if (!this.isValidDomainForGolden(tab.url)) {
                console.log('Not on valid GitHub domain:', tab.url);
                return;
            }

            // Check if we can access this tab
            if (!this.canAccessTab(tab)) {
                console.log('Cannot access tab for auto-populate');
                return;
            }

            console.log('Attempting to extract golden ID from HTML on tab:', tab.id);

            // Use executeScript to directly extract from DOM without message passing
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
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

                        console.log('No golden ID value found in HTML');
                        return null;
                    }
                });

                if (results && results[0] && results[0].result) {
                    const goldenIdValue = results[0].result;
                    const goldenInput = document.getElementById('goldenInput');
                    goldenInput.value = goldenIdValue;
                    this.updateGoldenButton();
                    console.log('Auto-populated golden ID value from HTML:', goldenIdValue);
                } else {
                    console.log('No golden ID value found in HTML elements');
                }
            } catch (scriptError) {
                console.log('Failed to execute script on page:', scriptError);
            }
        } catch (error) {
            console.log('Could not auto-populate Golden Call input:', error);
        } finally {
            this.isAutoPopulating = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const controller = new PopupController();
    await controller.init();
});