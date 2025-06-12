import React from 'react';
// import { GoldenCallService } from '@/services/goldenCallService';

interface GoldenCallTabProps {
  goldenId: string;
  onGoldenIdChange: (value: string) => void;
  onGetGolden: () => void;
  isAutoPopulating: boolean;
}

const GoldenCallTab: React.FC<GoldenCallTabProps> = ({
  goldenId,
  onGoldenIdChange,
  onGetGolden,
  isAutoPopulating,
}) => {
  // Example of how to use the API service:
  // const handleApiCall = async () => {
  //   const result = await GoldenCallService.getGoldenCall(goldenId);
  //   if (result) {
  //     console.log('Golden call data:', result);
  //   }hbt
  // };

  return (
    <div className="tab-pane" role="tabpanel" aria-labelledby="goldencall-tab">
      <div className="page-header">
        <h2>Golden Call Configuration</h2>
      </div>
      
      <div className="golden-container">
        <label htmlFor="goldenInput">Golden ID:</label>
        <input
          type="text"
          id="goldenInput"
          placeholder="Enter Golden ID..."
          value={goldenId}
          onChange={(e) => onGoldenIdChange(e.target.value)}
          disabled={isAutoPopulating}
        />
        
        <div className="button-group">
          <button
            id="getGoldenButton"
            onClick={onGetGolden}
            disabled={!goldenId.trim() || isAutoPopulating}
          >
            {isAutoPopulating ? 'Auto-populating...' : 'Get Golden'}
          </button>
        </div>
        
        <div className="golden-help">
          <small className="help-text">
            Extract Golden ID from GitHub URLs or enter manually
          </small>
        </div>
      </div>
    </div>
  );
};

export default GoldenCallTab;
