import React, { useRef, useState } from 'react';

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
      </div>
    </div>
  );
};

export default ConfigurationTab;
