import React, { useState, useEffect } from 'react';
import { SearchOption, PopupState } from '@/types';
import { ConfigManager, isValidDomainForGolden, determineActiveTab } from '@/utils/config';
import { ChromeApiWrapper } from '@/utils/chromeApiWrapper';
import SearchTab from './components/SearchTab';
import GoldenCallTab from './components/GoldenCallTab';
import ConfigurationTab from './components/ConfigurationTab';
import TabNavigation from './components/TabNavigation';
import StatusMessage from './components/StatusMessage';
import './App.css';

const App: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    selectedValue: '',
    filteredOptions: [],
    highlightedIndex: -1,
    activeTab: 'configuration', // Changed default to configuration
    isAutoPopulating: false,
  });

  const [options, setOptions] = useState<SearchOption[]>([]);
  const [goldenId, setGoldenId] = useState<string>('');
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [configStatus, setConfigStatus] = useState<{ message: string; type: string }>({
    message: 'Default config',
    type: ''
  });

  useEffect(() => {
    initializePopup();
  }, []);

  const initializePopup = async () => {
    try {
      await setupOptions();
      await determineActiveTabForPopup();
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      showStatus('Failed to initialize extension', 'error');
    }
  };

  // Auto-populate Golden Call when tab becomes active
  useEffect(() => {
    if (state.activeTab === 'goldencall') {
      autoPopulateGoldenCall();
    }
  }, [state.activeTab]);

  const setupOptions = async () => {
    try {
      const config = await ConfigManager.loadConfig();
      setOptions(config.options);
      setState((prev: PopupState) => ({ ...prev, filteredOptions: config.options }));
      setConfigStatus({ message: 'Config loaded', type: 'loaded' });
    } catch (error) {
      console.error('Failed to load config:', error);
      setConfigStatus({ message: 'Error loading config', type: 'error' });
    }
  };

  const determineActiveTabForPopup = async (): Promise<void> => {
    try {
      const newActiveTab = await determineActiveTab();
      setState((prev: PopupState) => ({ ...prev, activeTab: newActiveTab }));
    } catch (error) {
      console.error('Failed to determine active tab:', error);
      // Fallback to configuration tab on error
      setState((prev: PopupState) => ({ ...prev, activeTab: 'configuration' }));
    }
  };

  const autoPopulateGoldenCall = async (): Promise<void> => {
    if (state.isAutoPopulating) return;
    
    setState((prev: PopupState) => ({ ...prev, isAutoPopulating: true }));
    
    try {
      const tab = await ChromeApiWrapper.queryActiveTab();
      if (tab?.id && tab?.url && isValidDomainForGolden(tab.url)) {
        console.log('Auto-populating Golden Call for tab:', tab.id);  
        await ChromeApiWrapper.injectContentScript(tab.id);
        
        const response = await ChromeApiWrapper.sendMessage(tab.id, { action: 'getGolden' });
        
        if (response?.goldenId) {
          setGoldenId(response.goldenId);
          showStatus('Golden ID auto-populated', 'success');
        }
      }
    } catch (error) {
      console.error('Failed to auto-populate golden call:', error);
    } finally {
      setState((prev: PopupState) => ({ ...prev, isAutoPopulating: false }));
    }
  };

  const injectContentScript = async (tabId: number): Promise<void> => {
    try {
      await ChromeApiWrapper.injectContentScript(tabId);
    } catch (error) {
      console.error('Failed to inject content script:', error);
    }
  };

  const handleTabChange = (tabName: 'search' | 'goldencall' | 'configuration') => {
    setState((prev: PopupState) => ({ ...prev, activeTab: tabName }));
  };

  const showStatus = (message: string, type: 'success' | 'error' | 'info') => {
    setStatus({ message, type });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleInputChange = (value: string) => {
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(value.toLowerCase()) ||
      option.searchValue.toLowerCase().includes(value.toLowerCase())
    );
    
    setState((prev: PopupState) => ({
      ...prev,
      selectedValue: value,
      filteredOptions: filtered,
      highlightedIndex: -1
    }));
  };

  const handleOptionSelect = (option: SearchOption) => {
    setState((prev: PopupState) => ({
      ...prev,
      selectedValue: option.searchValue,
      highlightedIndex: -1
    }));
  };

  const handleSearch = async () => {
    if (!state.selectedValue.trim()) return;

    try {
      const tab = await ChromeApiWrapper.queryActiveTab();
      if (tab?.id) {
        await injectContentScript(tab.id);
        await ChromeApiWrapper.sendMessage(tab.id, {
          action: 'search',
          searchTerm: state.selectedValue
        });
        showStatus('Search completed', 'success');
      }
    } catch (error) {
      console.error('Search failed:', error);
      showStatus('Search failed', 'error');
    }
  };

  const handleClear = async () => {
    try {
      const tab = await ChromeApiWrapper.queryActiveTab();
      if (tab?.id) {
        await ChromeApiWrapper.sendMessage(tab.id, { action: 'clear' });
        showStatus('Highlights cleared', 'success');
      }
    } catch (error) {
      console.error('Clear failed:', error);
      showStatus('Clear failed', 'error');
    }
  };

  const handleConfigLoad = async (file: File) => {
    try {
      const text = await file.text();
      const config = JSON.parse(text);
      
      if (ConfigManager.validateConfig(config)) {
        await ConfigManager.saveConfig(config);
        setOptions(config.options);
        setState((prev: PopupState) => ({ ...prev, filteredOptions: config.options }));
        setConfigStatus({ message: 'Config loaded from file', type: 'loaded' });
        showStatus('Configuration loaded successfully', 'success');
      } else {
        throw new Error('Invalid configuration format');
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      showStatus('Failed to load configuration', 'error');
    }
  };

  const handleGetGolden = async () => {
    if (!goldenId.trim()) return;

    try {
      const tab = await ChromeApiWrapper.queryActiveTab();
      if (tab?.id) {
        await injectContentScript(tab.id);
        
        // Add a small delay to ensure content script is loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await ChromeApiWrapper.sendMessage(tab.id, {
          action: 'getGolden',
          goldenId: goldenId
        });
        
        if (response?.success) {
          showStatus('Golden call executed', 'success');
        } else {
          showStatus(response?.error || 'Golden call failed', 'error');
        }
      } else {
        showStatus('No active tab found', 'error');
      }
    } catch (error) {
      console.error('Get golden failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Golden call failed';
      showStatus(errorMessage, 'error');
    }
  };

  return (
    <div className="container">
        <div className="web-dev-indicator">
          EVA OCP Dev Tool
        </div>
      
      <TabNavigation 
        activeTab={state.activeTab} 
        onTabChange={handleTabChange} 
      />
      
      <div className="tab-content">
        {state.activeTab === 'search' && (
          <SearchTab
            selectedValue={state.selectedValue}
            filteredOptions={state.filteredOptions}
            highlightedIndex={state.highlightedIndex}
            configStatus={configStatus}
            onInputChange={handleInputChange}
            onOptionSelect={handleOptionSelect}
            onSearch={handleSearch}
            onClear={handleClear}
          />
        )}
        
        {state.activeTab === 'goldencall' && (
          <GoldenCallTab
            goldenId={goldenId}
            onGoldenIdChange={setGoldenId}
            onGetGolden={handleGetGolden}
            isAutoPopulating={state.isAutoPopulating}
          />
        )}
        
        {state.activeTab === 'configuration' && (
          <ConfigurationTab
            onConfigLoad={handleConfigLoad}
            configStatus={configStatus}
          />
        )}
      </div>

      {status && (
        <StatusMessage
          message={status.message}
          type={status.type}
          onClose={() => setStatus(null)}
        />
      )}
    </div>
  );
};

export default App;
