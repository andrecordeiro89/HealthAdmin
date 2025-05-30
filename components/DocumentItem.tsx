

import React from 'react';
import { ProcessedDocumentEntry } from '../types';
import { UI_TEXT } from '../constants';

interface DocumentItemProps {
  document: ProcessedDocumentEntry;
  onRemove: (docId: string) => void;
}

export const DocumentItem: React.FC<DocumentItemProps> = ({ document, onRemove }) => {
  let statusColor = 'text-slate-500'; 
  let statusText = UI_TEXT.documentStatusPending;
  let spinnerBorderColor = 'border-indigo-500'; // Default to purple for spinner

  switch (document.status) {
    case 'processing':
      statusColor = 'text-indigo-600'; 
      statusText = UI_TEXT.documentStatusProcessing;
      spinnerBorderColor = 'border-indigo-600'; 
      break;
    case 'success':
      statusColor = 'text-purple-600'; 
      statusText = UI_TEXT.documentStatusSuccess;
      break;
    case 'error':
      statusColor = 'text-red-600'; 
      statusText = UI_TEXT.documentStatusError;
      break;
    default: // pending
      statusColor = 'text-indigo-600'; 
      spinnerBorderColor = 'border-indigo-600';
      break;
  }
  
  const removeButtonBaseClass = "flex-shrink-0 p-1.5 rounded-full text-white transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-white shadow-sm";
  const removeButtonErrorClass = `${removeButtonBaseClass} bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 focus:ring-rose-500`;
  const removeButtonNormalPurpleClass = `${removeButtonBaseClass} bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:ring-indigo-500`;


  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between space-x-3">
      {document.imagePreviewUrl && (
        <img 
          src={document.imagePreviewUrl} 
          alt={`Preview ${document.fileName}`} 
          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md flex-shrink-0 border border-gray-300" 
        />
      )}
      <div className="flex-grow overflow-hidden">
        <p className="text-sm sm:text-base font-medium text-slate-700 truncate" title={document.fileName}>
          {document.fileName}
        </p>
        <p className={`text-xs sm:text-sm font-semibold ${statusColor}`}>{statusText}</p>
        {document.status === 'error' && document.errorMessage && (
          <p className="text-xs text-red-700 truncate" title={document.errorMessage}>
            Detalhe: {document.errorMessage}
          </p>
        )}
      </div>
      {document.status !== 'processing' && (
        <button
          onClick={() => onRemove(document.id)}
          className={document.status === 'error' ? removeButtonErrorClass : removeButtonNormalPurpleClass}
          aria-label={`Remover ${document.fileName}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"> 
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.24.086 3.223.244L6.75 5.79m12.506 0l-2.828-2.828A2.25 2.25 0 0015.025 2.25H8.975a2.25 2.25 0 00-1.591.659L4.558 5.79m3.839 11.25H15.17" />
          </svg>
        </button>
      )}
       {document.status === 'processing' && (
         <div className="flex-shrink-0 w-5 h-5 mr-1.5"> 
            <div className={`animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 ${spinnerBorderColor}`}></div>
         </div>
      )}
    </div>
  );
};
