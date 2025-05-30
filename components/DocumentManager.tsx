

import React from 'react';
import { ProcessedDocumentEntry } from '../types';
import { UI_TEXT } from '../constants';
import { FileUpload } from './FileUpload';
import { DocumentItem } from './DocumentItem';

interface DocumentManagerProps {
  hospitalName: string;
  documents: ProcessedDocumentEntry[];
  onAddDocuments: (files: File[]) => void; 
  onRemoveDocument: (docId: string) => void;
  onProcessAll: () => void;
  processingDisabled: boolean; 
  canProceedToCorrection: boolean; // Updated prop name for clarity
  onProceedToCorrection: () => void; // Updated prop name for clarity
  onGoBackToHospitalSelection: () => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  hospitalName,
  documents,
  onAddDocuments,
  onRemoveDocument,
  onProcessAll,
  processingDisabled,
  canProceedToCorrection, // Use updated prop name
  onProceedToCorrection, // Use updated prop name
  onGoBackToHospitalSelection,
}) => {
  const pendingDocumentsCount = documents.filter(doc => doc.status === 'pending').length;
  const successfullyProcessedCount = documents.filter(doc => doc.status === 'success').length;
  const allDocsProcessedOrError = documents.every(doc => doc.status === 'success' || doc.status === 'error') && pendingDocumentsCount === 0;

  const purpleGradientPrimary = "w-full text-white font-semibold py-2.5 px-5 rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const purpleGradientLight = "w-full text-purple-700 font-medium py-2.5 px-5 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-xl border border-gray-200">
      <h2 className="text-xl sm:text-2xl font-bold text-indigo-600 mb-4 sm:mb-6 text-center"> 
        {UI_TEXT.documentManagementTitle(hospitalName)}
      </h2>

      <div className="mb-6">
        <FileUpload onFilesSelect={onAddDocuments} />
      </div>

      {documents.length > 0 && (
        <div className="mb-6 space-y-3 max-h-96 overflow-y-auto pr-2 border border-gray-200 rounded-md p-3 bg-gray-50/70">
          {documents.map(doc => (
            <DocumentItem key={doc.id} document={doc} onRemove={onRemoveDocument} />
          ))}
        </div>
      )}
      
      {documents.length === 0 && (
         <p className="text-center text-slate-500 py-4">{UI_TEXT.noDocumentsAdded}</p>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
        <button
          onClick={onProcessAll}
          disabled={pendingDocumentsCount === 0}
          className={purpleGradientPrimary}
        > 
          {UI_TEXT.processAllDocumentsButton} ({pendingDocumentsCount} pendente(s))
        </button>
        
        {allDocsProcessedOrError && successfullyProcessedCount > 0 && (
           <button
            onClick={onProceedToCorrection} // Action leads to material correction
            disabled={!canProceedToCorrection} // Based on successful docs
            className={purpleGradientPrimary} 
          > 
            {/* Text implies next step is correction/AI improvement */}
            {UI_TEXT.proceedToMaterialCorrectionButton} ({successfullyProcessedCount} processado(s)) 
          </button>
        )}

        <button
            onClick={onGoBackToHospitalSelection}
            className={purpleGradientLight}
        >
            {UI_TEXT.backToHospitalSelectionButton}
        </button>
      </div>
    </div>
  );
};
