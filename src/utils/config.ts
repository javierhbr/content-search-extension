import { Config } from '@/types';
import { isExtensionContext } from './chromeApiWrapper';

export const GOLDEN_CALL_DOMAINS = ['github.com/javierhbr'];
export const SEARCH_DOMAINS = ['.emol.com'];

export const DEFAULT_CONFIG: Config = {
  options: [
    { label: 'envMode', searchValue: 'envMode' },
    { label: 'featureFlags - Output field params parsed', searchValue: 'Output field params parsed' },
    { label: 'keyValuePairs', searchValue: 'New KVP log' },
    { label: 'ws-request', searchValue: 'Api Request builder' },
    { label: 'ws-response-fields', searchValue: 'Output field params parsed' },
    { label: 'ws-response-WsResponseDto', searchValue: 'WsResponseDto' }
  ],
  version: '1.0.0'
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
  return GOLDEN_CALL_DOMAINS.some(domain => url.includes(domain));
}

export function isValidDomainForSearch(url: string): boolean {
  return SEARCH_DOMAINS.some(domain => url.includes(domain));
}
