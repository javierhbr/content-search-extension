import React from 'react';

interface TabNavigationProps {
  activeTab: 'search' | 'goldencall';
  onTabChange: (tab: 'search' | 'goldencall') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="tab-navigation">
      <div className="logo-area">
        <div className="logo-placeholder" title="Extension Logo">
          🔍
        </div>
      </div>
      <div className="tabs-area">
        <button
          className={`tab-button ${activeTab === 'goldencall' ? 'active' : ''}`}
          onClick={() => onTabChange('goldencall')}
          role="tab"
          aria-selected={activeTab === 'goldencall'}
          aria-controls="goldenCallTab"
          id="goldencall-tab"
        >
          GoldenCall
        </button>
        <button
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => onTabChange('search')}
          role="tab"
          aria-selected={activeTab === 'search'}
          aria-controls="searchTab"
          id="search-tab"
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default TabNavigation;
