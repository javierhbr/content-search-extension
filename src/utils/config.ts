import { Config } from '@/types';
import { isExtensionContext } from './chromeApiWrapper';

export const GOLDEN_CALL_DOMAINS = ['github.com'];
export const SEARCH_DOMAINS = ['.emol.com'];

// Default tab configuration
export const DEFAULT_TAB_CONFIG = {
  defaultTab: 'goldencall' as 'goldencall' | 'search' | 'configuration' , //The actual default is determined by the value before as, which is currently 'goldencall' - so Golden Call tab will be the default when the extension opens (unless auto-switching is enabled and you're on a specific domain).
  autoSwitchTabs: true // Whether to automatically switch tabs based on domain
};

export const DEFAULT_CONFIG: Config = {
  options: [
    { label: 'envMode', searchValue: 'envMode' },
    { label: 'featureFlags - Output field params parsed', searchValue: 'Output field params parsed' },
    { label: 'keyValuePairs', searchValue: 'New KVP log' },
    { label: 'ws-request', searchValue: 'Api Request builder' },
    { label: 'ws-response-fields', searchValue: 'Output field params parsed' },
    { label: 'ws-response-WsResponseDto', searchValue: 'WsResponseDto' }
  ],
  version: '1.0.0',
  tabConfig: DEFAULT_TAB_CONFIG
};

export const LOG_OPTIONS = [
  { label: 'Error', searchValue: 'Error' },
  { label: 'Warning', searchValue: 'Warning' },
  { label: 'Info', searchValue: 'Info' },
  { label: 'Debug', searchValue: 'Debug' },
  { label: 'Exception', searchValue: 'Exception' },
  { label: 'Failed', searchValue: 'Failed' }
];

export class ConfigManager {
  private static readonly STORAGE_KEY = 'searchConfig';

  static async loadConfig(): Promise<Config> {
    try {
      if (isExtensionContext()) {
        // Use Chrome storage API in extension context
        const result = await chrome.storage.local.get(this.STORAGE_KEY);
        if (result[this.STORAGE_KEY]) {
          return result[this.STORAGE_KEY];
        }
      } else {
        // Use localStorage in web context
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load config from storage:', error);
    }
    return DEFAULT_CONFIG;
  }

  static async saveConfig(config: Config): Promise<void> {
    try {
      if (isExtensionContext()) {
        // Use Chrome storage API in extension context
        await chrome.storage.local.set({ [this.STORAGE_KEY]: config });
      } else {
        // Use localStorage in web context
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      }
    } catch (error) {
      console.error('Failed to save config to storage:', error);
      throw error;
    }
  }

  static async clearConfig(): Promise<void> {
    try {
      if (isExtensionContext()) {
        // Use Chrome storage API in extension context
        await chrome.storage.local.remove(this.STORAGE_KEY);
      } else {
        // Use localStorage in web context
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to clear config from storage:', error);
      throw error;
    }
  }

  static validateConfig(config: any): config is Config {
    return (
      config &&
      Array.isArray(config.options) &&
      config.options.every((option: any) => 
        typeof option.label === 'string' && 
        typeof option.searchValue === 'string'
      )
    );
  }
}

export function isValidDomainForGolden(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return GOLDEN_CALL_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch (error) {
    // Fallback to simple string matching if URL parsing fails
    return GOLDEN_CALL_DOMAINS.some(domain => url.includes(domain));
  }
}

export function isValidDomainForSearch(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return SEARCH_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch (error) {
    // Fallback to simple string matching if URL parsing fails
    return SEARCH_DOMAINS.some(domain => url.includes(domain));
  }
}

export async function getTabConfiguration() {
  try {
    const config = await ConfigManager.loadConfig();
    return config.tabConfig || DEFAULT_TAB_CONFIG;
  } catch (error) {
    console.error('Failed to load tab configuration:', error);
    return DEFAULT_TAB_CONFIG;
  }
}

export async function getCurrentActiveTabUrl(): Promise<string | null> {
  try {
    if (isExtensionContext()) {
      // Get the active tab URL in extension context
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs[0]?.url || null;
    } else {
      // In web context, use current window location
      return window.location.href;
    }
  } catch (error) {
    console.error('Failed to get current tab URL:', error);
    return null;
  }
}

export function determineTabBasedOnDomain(url: string, tabConfig: typeof DEFAULT_TAB_CONFIG): 'search' | 'goldencall' | 'configuration' {
  if (!tabConfig.autoSwitchTabs) {
    return tabConfig.defaultTab;
  }

  const isGoldenDomain = isValidDomainForGolden(url);
  const isSearchDomain = isValidDomainForSearch(url);
  
  // Priority: Golden domain first, then search domain, then default
  if (isGoldenDomain) {
    return 'goldencall';
  } else if (isSearchDomain) {
    return 'search';
  } else {
    return tabConfig.defaultTab;
  }
}

export async function determineActiveTab(): Promise<'search' | 'goldencall' | 'configuration'> {
  try {
    const tabConfig = await getTabConfiguration();
    const currentUrl = await getCurrentActiveTabUrl();
    
    if (!currentUrl) {
      return tabConfig.defaultTab;
    }
    
    return determineTabBasedOnDomain(currentUrl, tabConfig);
  } catch (error) {
    console.error('Failed to determine active tab:', error);
    return DEFAULT_TAB_CONFIG.defaultTab;
  }
}
