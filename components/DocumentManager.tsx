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
  canProceedToCorrection: boolean;
  onProceedToCorrection: () => void;
  onGoBackToHospitalSelection: () => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  hospitalName,
  documents,
  onAddDocuments,
  onRemoveDocument,
  onProcessAll,
  processingDisabled,
  canProceedToCorrection,
  onProceedToCorrection,
  onGoBackToHospitalSelection,
}) => {
  const pendingDocumentsCount = documents.filter(doc => doc.status === 'pending').length;
  const successfullyProcessedCount = documents.filter(doc => doc.status === 'success').length;
  const allDocsProcessedOrError = documents.every(doc => doc.status === 'success' || doc.status === 'error');

  const purpleGradientPrimary = "w-full md:w-auto text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const purpleGradientLight = "w-full md:w-auto text-purple-700 font-medium py-2.5 px-6 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-gray-200 flex flex-col items-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 mb-6 text-center">
          {UI_TEXT.documentManagementTitle(hospitalName)}
        </h2>
        <div className="mb-6 w-full">
          <FileUpload onFilesSelect={onAddDocuments} />
        </div>
        {documents.length > 0 && (
          <div className="mb-6 w-full max-h-96 overflow-y-auto pr-2 border border-gray-200 rounded-md p-3 bg-gray-50/70">
            <table className="min-w-full text-sm text-left border border-gray-200">
              <thead className="sticky top-0 z-10 bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border">Arquivo</th>
                  <th className="px-3 py-2 border">Status</th>
                  <th className="px-3 py-2 border">Ação</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => (
                  <tr key={doc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 border font-mono flex items-center gap-2">
                      {doc.imagePreviewUrl && (
                        <img
                          src={doc.imagePreviewUrl}
                          alt={`Preview ${doc.fileName}`}
                          className="w-10 h-10 object-cover rounded border border-gray-300"
                        />
                      )}
                      <span>{doc.fileName}</span>
                    </td>
                    <td className="px-3 py-2 border font-semibold">
                      {doc.status === 'success' && <span className="text-green-700">Sucesso</span>}
                      {doc.status === 'error' && <span className="text-red-700">Erro</span>}
                      {doc.status === 'pending' && <span className="text-yellow-700">Pendente</span>}
                      {doc.status === 'processing' && <span className="text-blue-700">Processando...</span>}
                    </td>
                    <td className="px-3 py-2 border">
                      <button
                        onClick={() => onRemoveDocument(doc.id)}
                        className="px-3 py-1.5 rounded bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-bold shadow hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                        title="Remover documento"
                        aria-label={`Remover ${doc.fileName}`}
                        disabled={doc.status === 'processing'}
                      >Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {documents.length === 0 && (
          <p className="text-center text-slate-500 py-4">{UI_TEXT.noDocumentsAdded}</p>
        )}
        <div className="mt-6 pt-6 border-t border-gray-200 w-full flex flex-col md:flex-row gap-4 justify-center items-center">
          <button
            onClick={onProcessAll}
            disabled={pendingDocumentsCount === 0}
            className={purpleGradientPrimary}
            title="Processar todos os documentos pendentes"
          >
            {UI_TEXT.processAllDocumentsButton} ({pendingDocumentsCount} pendente(s))
          </button>
          {allDocsProcessedOrError && successfullyProcessedCount > 0 && (
            <button
              onClick={onProceedToCorrection}
              disabled={!canProceedToCorrection}
              className={purpleGradientPrimary}
              title="Corrigir materiais extraídos"
            >
              {UI_TEXT.proceedToMaterialCorrectionButton} ({successfullyProcessedCount} processado(s))
            </button>
          )}
          <button
            onClick={onGoBackToHospitalSelection}
            className={purpleGradientLight}
            title="Voltar para seleção de hospital"
          >
            {UI_TEXT.backToHospitalSelectionButton}
          </button>
        </div>
      </div>
    </div>
  );
};
