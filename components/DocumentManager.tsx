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
      <div className="w-full max-w-2xl flex flex-col items-center mx-auto gap-8">
        <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight text-center mb-2 drop-shadow-sm">{UI_TEXT.documentManagementTitle(hospitalName)}</h1>
        <div className="w-full flex flex-col gap-4 bg-gradient-to-br from-white via-indigo-50 to-white rounded-2xl shadow-2xl p-8 border border-indigo-100">
        <FileUpload onFilesSelect={onAddDocuments} />
          <div className="w-full flex flex-col items-center gap-2">
            <p className="text-base text-slate-500 text-center mb-2 font-medium">{UI_TEXT.uploadInstructions}</p>
            <label className="block text-lg font-bold text-indigo-700 mb-1 text-center tracking-wide">Palavras de Busca - Críticas</label>
          <input
            type="text"
              className="w-full max-w-[340px] px-4 py-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base text-center shadow transition-all duration-200 bg-white hover:border-indigo-400"
            placeholder="Instruções ou palavras críticas (ex: extraviado, devolvido)"
            value={criticalWords}
            onChange={e => setCriticalWords(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1 text-center">
            O sistema já busca automaticamente: <span className="font-mono">contaminado, estragado, defeito, danificado, não implantado</span>, etc.<br />
            Adicione outras palavras separadas por vírgula para este processamento.
          </p>
        </div>
        </div>
        <div className="flex flex-row gap-6 justify-center items-center w-full mt-2 mb-2">
          <button
            onClick={onGoBackToHospitalSelection}
            className="w-full max-w-xs px-7 py-3 text-base font-semibold rounded-xl shadow-lg bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-200 hover:border-purple-400 text-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 ease-in-out"
            title="Voltar para seleção de hospital"
          >
            {UI_TEXT.backToHospitalSelectionButton}
          </button>
          <button
            onClick={onProcessAll}
            disabled={pendingDocumentsCount === 0}
            className="w-full max-w-xs px-7 py-3 text-base font-semibold rounded-xl shadow-xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed"
            title="Processar todos os documentos pendentes"
          >
            {UI_TEXT.processAllDocumentsButton} ({pendingDocumentsCount} pendente(s))
          </button>
        </div>
        {canProceedToCorrection && successfullyProcessedCount > 0 && (
          <div className="flex flex-row justify-center items-center w-full mb-2">
            <button
              onClick={onProceedToCorrection}
              className="w-full max-w-xs px-7 py-3 text-base font-semibold rounded-xl shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 ease-in-out"
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
          <div className="mb-6 w-full max-h-[60vh] overflow-y-auto pr-2 border border-indigo-100 rounded-2xl p-4 bg-white/90 shadow-2xl">
            <table className="min-w-full text-sm text-left border border-indigo-100 rounded-xl overflow-hidden">
              <thead className="sticky top-0 z-10 bg-indigo-50">
                <tr>
                  <th className="px-4 py-3 border text-indigo-700 font-bold text-base">Arquivo</th>
                  <th className="px-4 py-3 border text-indigo-700 font-bold text-base">Status</th>
                  <th className="px-4 py-3 border text-indigo-700 font-bold text-base">Ação</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => (
                  <tr key={doc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50/60'}>
                    <td className="px-4 py-3 border font-mono flex items-center gap-2">
                      {doc.imagePreviewUrl && (
                        <img
                          src={doc.imagePreviewUrl}
                          alt={`Preview ${doc.fileName}`}
                          className="w-10 h-10 object-cover rounded border border-indigo-200"
                        />
                      )}
                      <span>{doc.fileName}</span>
                    </td>
                    <td className="px-4 py-3 border font-semibold">
                      {doc.status === 'success' && <span className="text-green-700">Sucesso</span>}
                      {doc.status === 'error' && <span className="text-red-700">Erro</span>}
                      {doc.status === 'pending' && <span className="text-yellow-700">Pendente</span>}
                      {doc.status === 'processing' && <span className="text-blue-700">Processando...</span>}
                    </td>
                    <td className="px-4 py-3 border">
                      <button
                        onClick={() => onRemoveDocument(doc.id)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-bold shadow hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200"
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
