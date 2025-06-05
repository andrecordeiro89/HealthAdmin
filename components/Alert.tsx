import React from 'react';
import { buttonDanger, buttonSize } from './uiClasses';

export enum AlertType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

interface AlertProps {
  message: string;
  type: AlertType;
  onDismiss?: () => void;
  children?: React.ReactNode; // Added optional children prop
}

export const Alert: React.FC<AlertProps> = ({ message, type, onDismiss, children }) => {
  const baseClasses = "w-full py-2 px-4 mb-3 rounded-xl shadow-lg flex items-start border text-sm font-medium";
  let typeClasses = "";
  let iconPath = "";
  let iconColor = ""; 

  switch (type) {
    case AlertType.Success:
      typeClasses = "bg-green-50 text-green-700 border-green-300";
      iconPath = "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"; 
      iconColor = "text-green-500";
      break;
    case AlertType.Error:
      typeClasses = "bg-red-50 text-red-700 border-red-300";
      iconPath = "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"; 
      iconColor = "text-red-500";
      break;
    case AlertType.Warning:
      typeClasses = "bg-yellow-50 text-yellow-700 border-yellow-300";
      iconPath = "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"; 
      iconColor = "text-yellow-500";
      break;
    case AlertType.Info:
    default:
      typeClasses = "bg-gray-50 text-gray-700 border-gray-300"; // Changed from blue to gray
      iconPath = "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"; 
      iconColor = "text-gray-500"; // Changed from blue to gray
      break;
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-sm w-full pointer-events-auto transition-transform duration-300 ease-in-out ${baseClasses} ${typeClasses} animate-fade-in-up`} role="alert" style={{boxShadow: '0 8px 32px 0 rgba(80, 36, 180, 0.18)', borderRadius: '1.25rem', minWidth: '320px'}}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-7 h-7 mr-4 flex-shrink-0 ${iconColor}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
      <div className="flex-grow text-base font-semibold pr-2">
        <span>{message}</span>
        {children && <div className="mt-1 text-xs">{children}</div>}
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className="ml-4 text-2xl font-bold text-slate-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 bg-transparent border-none p-0 h-7 w-7 flex items-center justify-center"
          aria-label="Fechar alerta"
        >
          ×
        </button>
      )}
    </div>
  );
};