import React from 'react';
import { SearchOption } from '@/types';

interface SearchTabProps {
  selectedValue: string;
  filteredOptions: SearchOption[];
  highlightedIndex: number;
  configStatus: { message: string; type: string };
  onInputChange: (value: string) => void;
  onOptionSelect: (option: SearchOption) => void;
  onSearch: () => void;
  onClear: () => void;
}

const SearchTab: React.FC<SearchTabProps> = ({
  selectedValue,
  filteredOptions,
  highlightedIndex,
  configStatus,
  onInputChange,
  onOptionSelect,
  onSearch,
  onClear,
}) => {
  return (
    <div className="tab-pane" role="tabpanel" aria-labelledby="search-tab">
      <div className="page-header">
        <h2>Search Configuration</h2>
      </div>
      
      <div className="search-container">
        <div className="search-header-controls">
          <label htmlFor="searchInput">Search for:</label>
          <div className="config-controls">
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
