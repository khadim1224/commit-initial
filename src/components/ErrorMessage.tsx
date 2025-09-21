import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Erreur</p>
            <p className="text-red-600 text-sm mt-1">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};