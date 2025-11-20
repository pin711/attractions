
import React from 'react';

interface ErrorAlertProps {
  message: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-300 text-red-600 p-4 rounded-xl shadow-sm" role="alert">
      <div className="flex">
        <div className="py-1"><i className="fas fa-exclamation-triangle mr-3 text-red-400"></i></div>
        <div>
          <p className="font-bold">發生錯誤</p>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;