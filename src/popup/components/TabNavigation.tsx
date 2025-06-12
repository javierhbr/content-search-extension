import React from 'react';

interface TabNavigationProps {
  activeTab: 'search' | 'goldencall' | 'configuration';
  onTabChange: (tab: 'search' | 'goldencall' | 'configuration') => void;
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
        <button
          className={`tab-button ${activeTab === 'configuration' ? 'active' : ''}`}
          onClick={() => onTabChange('configuration')}
          role="tab"
          aria-selected={activeTab === 'configuration'}
          aria-controls="configurationTab"
          id="configuration-tab"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};

export default TabNavigation;
