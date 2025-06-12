import React from 'react';

interface StatusMessageProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <div className={`status-message ${type}`}>
      <span>{message}</span>
      <button
        className="close-button"
        onClick={onClose}
        aria-label="Close message"
      >
        ×
      </button>
    </div>
  );
};

export default StatusMessage;
