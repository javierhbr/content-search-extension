export interface SearchOption {
  label: string;
  searchValue: string;
}

export interface Config {
  options: SearchOption[];
  version?: string;
}

export interface SearchRequest {
  action: 'search' | 'clear';
  searchTerm?: string;
}

export interface SearchResponse {
  success: boolean;
  matchCount?: number;
  error?: string;
}

export interface GoldenCallRequest {
  action: 'getGolden';
  goldenId?: string;
}

export interface TabInfo {
  id: number;
  url?: string;
  title?: string;
}

export type MessageRequest = SearchRequest | GoldenCallRequest;

export interface PopupState {
  selectedValue: string;
  filteredOptions: SearchOption[];
  highlightedIndex: number;
  activeTab: 'search' | 'goldencall' | 'configuration';
  isAutoPopulating: boolean;
}

export interface UIElements {
  searchInput: HTMLInputElement;
  dropdownOptions: HTMLElement;
  searchButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  goldenInput: HTMLInputElement;
  getGoldenButton: HTMLButtonElement;
}
