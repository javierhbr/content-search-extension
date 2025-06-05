class PopupController {
    constructor() {
        this.selectedValue = '';
        this.filteredOptions = [];
        this.highlightedIndex = -1;
        this.currentMode = 'normal';
        this.activeTab = 'search';
        this.init();
    }

    init() {
        this.setupOptions();
        this.bindEvents();
        this.updateSearchButton();
    }

    setupOptions() {
        this.options = [
            { label: 'envMode', searchValue: 'envMode' },
            { label: 'featureFlags - Output field params parsed', searchValue: 'Output field params parsed' },
            { label: 'keyValuePairs', searchValue: 'New KVP log' },
            { label: 'ws-request', searchValue: 'Api Request builder' },
            { label: 'ws-response-fields', searchValue: 'Output field params parsed' },
            { label: 'ws-response-WsResponseDto', searchValue: 'WsResponseDto' }
        ];
        this.filteredOptions = [...this.options];
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
        this.renderOptions();
        dropdownOptions.classList.add('open');
    }

    hideDropdown() {
        setTimeout(() => {
            const dropdownOptions = document.getElementById('dropdownOptions');
            dropdownOptions.classList.remove('open');
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
        
        // Update tab button states
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content visibility
        document.querySelectorAll('.tab-content').forEach(content => {
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
        } else if (tabName === 'search') {
            this.currentMode = 'normal';
            this.updateSearchButton();
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
        const goldenId = goldenInput.value.trim();
        
        if (!goldenId) {
            this.showStatus('Please enter a Golden Call ID', 'error');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'search',
                searchTerm: goldenId
            });
            
            this.showStatus(`Searching for Golden Call: "${goldenId}"`, 'info');
            window.close();
        } catch (error) {
            console.error('Error getting golden call:', error);
            this.showStatus('Error getting golden call. Please try again.', 'error');
        }
    }

    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = this.selectedValue || searchInput.value.trim();
        
        if (!searchTerm) {
            this.showStatus('Please enter or select a search term', 'error');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'search',
                searchTerm: searchTerm
            });
            
            this.showStatus(`Searching for: "${searchTerm}"`, 'info');
            window.close();
        } catch (error) {
            console.error('Error performing search:', error);
            this.showStatus('Error performing search. Please try again.', 'error');
        }
    }

    async clearHighlights() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'clear'
            });
            
            this.showStatus('Highlights cleared', 'success');
        } catch (error) {
            console.error('Error clearing highlights:', error);
            this.showStatus('Error clearing highlights', 'error');
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
}

document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});