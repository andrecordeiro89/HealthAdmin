import React, { useState } from 'react';
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
  const [criticalWords, setCriticalWords] = useState('');
  const pendingDocumentsCount = documents.filter(doc => doc.status === 'pending').length;
  const successfullyProcessedCount = documents.filter(doc => doc.status === 'success').length;
  const allDocsProcessedOrError = documents.every(doc => doc.status === 'success' || doc.status === 'error');

  const purpleGradientPrimary = "w-full md:w-auto text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const purpleGradientLight = "w-full md:w-auto text-purple-700 font-medium py-2.5 px-6 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start py-10 px-4 bg-gradient-to-br from-white via-indigo-50 to-purple-50">
      <div className="w-full max-w-2xl flex flex-col items-center mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 tracking-tight text-center mb-10 mt-0">
          {UI_TEXT.documentManagementTitle(hospitalName)}
        </h1>
        <FileUpload onFilesSelect={onAddDocuments} />
        <div className="w-full bg-white/80 rounded-xl shadow p-6 flex flex-col items-center gap-2 mb-8">
          <p className="text-base text-slate-500 text-center mb-2">{UI_TEXT.uploadInstructions}</p>
          <label className="block text-sm font-semibold text-slate-700 mb-1 text-center">{UI_TEXT.materialsUsedSection}</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base text-center mb-2"
            style={{ maxWidth: '320px' }}
            placeholder="Instruções ou palavras críticas (ex: extraviado, devolvido)"
            value={criticalWords}
            onChange={e => setCriticalWords(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1 text-center">
            O sistema já busca automaticamente: <span className="font-mono">contaminado, estragado, defeito, danificado, não implantado</span>, etc.<br />
            Adicione outras palavras separadas por vírgula para este processamento.
          </p>
        </div>
        <div className="flex flex-row gap-4 justify-center items-center mt-8 mb-8 w-full">
          <button
            onClick={onGoBackToHospitalSelection}
            className={purpleGradientLight + " w-full max-w-xs"}
            title="Voltar para seleção de hospital"
          >
            {UI_TEXT.backToHospitalSelectionButton}
          </button>
          <button
            onClick={onProcessAll}
            disabled={pendingDocumentsCount === 0}
            className={purpleGradientPrimary + " w-full max-w-xs"}
            title="Processar todos os documentos pendentes"
          >
            {UI_TEXT.processAllDocumentsButton} ({pendingDocumentsCount} pendente(s))
          </button>
        </div>
        {canProceedToCorrection && successfullyProcessedCount > 0 && (
          <div className="flex flex-row justify-center items-center mb-8 w-full">
            <button
              onClick={onProceedToCorrection}
              className={purpleGradientPrimary + " w-full max-w-xs"}
              title={UI_TEXT.proceedToMaterialCorrectionButton}
            >
              {UI_TEXT.proceedToMaterialCorrectionButton} ({successfullyProcessedCount} processado(s))
            </button>
          </div>
        )}
        {documents.length === 0 && (
          <p className="text-base text-center text-slate-500 mt-10">{UI_TEXT.noDocumentsAdded}</p>
        )}
        {documents.length > 0 && (
          <div className="mb-6 w-full max-h-[60vh] overflow-y-auto pr-2 border border-gray-200 rounded-xl p-3 bg-white/80 shadow-lg">
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
      </div>
    </div>
  );
};
