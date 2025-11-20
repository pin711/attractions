
import React from 'react';

interface LoadingSpinnerProps {
  message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 text-white">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-200 border-l-pink-400 border-r-purple-200 mb-4"></div>
      <p className="text-lg font-semibold">{message}</p>
    </div>
  );
};

export default LoadingSpinner;