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
  const [dragOver, setDragOver] = useState(false);
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

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="configuration-tab">
      <div className="config-header">
        <h3>Configuration Settings</h3>
        <div className={`config-status ${configStatus.type}`}>
          {configStatus.message}
        </div>
      </div>

      <div className="config-content">
        <div className="file-upload-section">
          <h4>Load Configuration File</h4>
          <p className="upload-description">
            Upload a JSON configuration file to customize search options and settings.
          </p>
          
          <div
            className={`file-drop-zone ${dragOver ? 'drag-over' : ''} ${isLoading ? 'loading' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFilePicker}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            
            <div className="drop-zone-content">
              <div className="drop-zone-icon">📁</div>
              <div className="drop-zone-text">
                {isLoading ? (
                  <>
                    <div className="loading-spinner">⏳</div>
                    <p>Loading configuration...</p>
                  </>
                ) : (
                  <>
                    <p><strong>Click to browse</strong> or drag and drop</p>
                    <p className="file-types">Supported: JSON files only</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="config-info">
          <h4>Configuration Format</h4>
          <div className="config-example">
            <pre>{`{
  "options": [
    {
      "label": "Search Option 1",
      "searchValue": "search-term-1"
    },
    {
      "label": "Search Option 2", 
      "searchValue": "search-term-2"
    }
  ],
  "version": "1.0"
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationTab;
