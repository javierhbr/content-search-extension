import React, { useRef, useState, useEffect } from 'react';
import { getTabConfiguration, ConfigManager, DEFAULT_TAB_CONFIG } from '@/utils/config';

interface ConfigurationTabProps {
  onConfigLoad: (file: File) => Promise<void>;
  configStatus: { message: string; type: string };
}

const ConfigurationTab: React.FC<ConfigurationTabProps> = ({
  onConfigLoad,
  configStatus
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tabConfig, setTabConfig] = useState(DEFAULT_TAB_CONFIG);

  useEffect(() => {
    loadTabConfiguration();
  }, []);

  const loadTabConfiguration = async () => {
    try {
      const config = await getTabConfiguration();
      setTabConfig(config);
    } catch (error) {
      console.error('Failed to load tab configuration:', error);
    }
  };

  const updateTabConfiguration = async (newConfig: typeof DEFAULT_TAB_CONFIG) => {
    try {
      const fullConfig = await ConfigManager.loadConfig();
      fullConfig.tabConfig = newConfig;
      await ConfigManager.saveConfig(fullConfig);
      setTabConfig(newConfig);
    } catch (error) {
      console.error('Failed to save tab configuration:', error);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('Please select a valid JSON file');
      return;
    }

    setIsLoading(true);
    try {
      await onConfigLoad(file);
    } catch (error) {
      console.error('Error loading configuration:', error);
      alert('Error loading configuration file. Please check the file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="tab-pane" role="tabpanel" aria-labelledby="configuration-tab">
      <div className="page-header">
        <h2>Configuration</h2>
      </div>
      
      <div className="config-simple">
        <div className={`config-status ${configStatus.type}`}>
          Status: {configStatus.message}
        </div>
        
        <div className="file-upload-simple">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          
          <button 
            className="file-upload-button"
            onClick={openFilePicker}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load JSON Config'}
          </button>
        </div>
        
        <div className="config-help">
          <small>Upload a JSON file with search options configuration</small>
        </div>

        {/* Tab Configuration Section */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#212529' }}>Tab Behavior</h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: '#6c757d' }}>
              Default Tab:
            </label>
            <select 
              value={tabConfig.defaultTab}
              onChange={(e) => updateTabConfiguration({
                ...tabConfig,
                defaultTab: e.target.value as 'search' | 'goldencall' | 'configuration'
              })}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                background: 'white'
              }}
            >
              <option value="configuration">⚙️ Configuration</option>
              <option value="search">🔍 Search</option>
              <option value="goldencall">🌟 Golden Call</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#6c757d', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={tabConfig.autoSwitchTabs}
                onChange={(e) => updateTabConfiguration({
                  ...tabConfig,
                  autoSwitchTabs: e.target.checked
                })}
                style={{ marginRight: '8px' }}
              />
              Auto-switch tabs based on domain
            </label>
          </div>

          <div className="config-help">
            <small>
              When enabled, the extension will automatically select the appropriate tab based on the current website domain.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationTab;
