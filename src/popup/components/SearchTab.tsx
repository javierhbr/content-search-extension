import React, { useRef } from 'react';
import { SearchOption } from '@/types';

interface SearchTabProps {
  selectedValue: string;
  filteredOptions: SearchOption[];
  highlightedIndex: number;
  currentMode: 'normal' | 'logs';
  configStatus: { message: string; type: string };
  onInputChange: (value: string) => void;
  onOptionSelect: (option: SearchOption) => void;
  onSearch: () => void;
  onClear: () => void;
  onConfigLoad: (file: File) => void;
  onConfigReset: () => void;
  onModeChange: (mode: 'normal' | 'logs') => void;
  onLogOptionSelect: (searchTerm: string) => void;
}

const SearchTab: React.FC<SearchTabProps> = ({
  selectedValue,
  filteredOptions,
  highlightedIndex,
  currentMode,
  configStatus,
  onInputChange,
  onOptionSelect,
  onSearch,
  onClear,
  onConfigLoad,
  onConfigReset,
  onModeChange,
  onLogOptionSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onConfigLoad(file);
    }
  };

  const handleConfigButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfigButtonRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    onConfigReset();
  };

  const logOptions = [
    { label: 'Error', searchTerm: 'Error' },
    { label: 'Warning', searchTerm: 'Warning' },
    { label: 'Info', searchTerm: 'Info' },
    { label: 'Debug', searchTerm: 'Debug' },
    { label: 'Exception', searchTerm: 'Exception' },
    { label: 'Failed', searchTerm: 'Failed' },
  ];

  return (
    <div className="tab-pane" role="tabpanel" aria-labelledby="search-tab">
      <div className="page-header">
        <h2>Search Configuration</h2>
      </div>
      
      <div className="search-container">
        <div className="search-header-controls">
          <label htmlFor="searchInput">Search for:</label>
          <div className="config-controls">
            <button
              className="icon-button"
              title="Load configuration file (Right-click to reset to defaults)"
              aria-label="Load configuration file"
              onClick={handleConfigButtonClick}
              onContextMenu={handleConfigButtonRightClick}
            >
              📁
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            <span className={`config-status ${configStatus.type}`}>
              {configStatus.message}
            </span>
          </div>
        </div>
        
        <div className="custom-select">
          <input
            type="text"
            id="searchInput"
            placeholder="Type to search or select from dropdown..."
            value={selectedValue}
            onChange={(e) => onInputChange(e.target.value)}
            autoComplete="off"
            aria-expanded="false"
            aria-haspopup="listbox"
            role="combobox"
          />
          <div className="dropdown-arrow" aria-hidden="true">▼</div>
          <div className="dropdown-options" role="listbox" aria-label="Search options">
            {filteredOptions.map((option, index) => (
              <div
                key={index}
                className={`option ${index === highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => onOptionSelect(option)}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="mode-controls">
        <button
          className={`mode-button ${currentMode === 'normal' ? 'active' : ''}`}
          onClick={() => onModeChange('normal')}
        >
          Normal Search
        </button>
        <button
          className={`mode-button ${currentMode === 'logs' ? 'active' : ''}`}
          onClick={() => onModeChange('logs')}
        >
          Log Search
        </button>
      </div>

      {/* Logs Options Container */}
      {currentMode === 'logs' && (
        <div className="logs-container">
          <label>Log Search Options:</label>
          <div className="logs-options">
            {logOptions.map((option) => (
              <div
                key={option.searchTerm}
                className="log-option"
                onClick={() => onLogOptionSelect(option.searchTerm)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="button-group">
        <button
          id="searchButton"
          onClick={onSearch}
          disabled={!selectedValue.trim()}
          aria-describedby="search-help"
        >
          Search & Highlight
        </button>
        <button
          id="clearButton"
          onClick={onClear}
          aria-describedby="clear-help"
        >
          Clear Highlights
        </button>
      </div>
      <div className="button-help">
        <small id="search-help" className="help-text">
          Find and highlight text on the current page
        </small>
        <small id="clear-help" className="help-text">
          Remove all highlights from the page
        </small>
      </div>
    </div>
  );
};

export default SearchTab;
