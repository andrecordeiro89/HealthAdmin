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
  // Força a remoção das barras de rolagem horizontal e vertical
  React.useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.body.style.overflowY = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    document.documentElement.style.overflowY = 'hidden';
    
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.overflowX = '';
      document.body.style.overflowY = '';
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overflowX = '';
      document.documentElement.style.overflowY = '';
    };
  }, []);
  const [criticalWords, setCriticalWords] = useState('');
  const pendingDocumentsCount = documents.filter(doc => doc.status === 'pending').length;
  const successfullyProcessedCount = documents.filter(doc => doc.status === 'success').length;
  const allDocsProcessedOrError = documents.every(doc => doc.status === 'success' || doc.status === 'error');

  const purpleGradientPrimary = "w-full md:w-auto text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  const purpleGradientLight = "w-full md:w-auto text-purple-700 font-medium py-2.5 px-6 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="h-screen w-full overflow-hidden flex items-start justify-center bg-gradient-to-br from-white via-indigo-50 to-purple-50 pt-2" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
      <div className="w-full max-w-3xl flex justify-center px-4" style={{ maxWidth: 'min(48rem, calc(100vw - 2rem))' }}>
        {/* Card Premium com Header do Hospital */}
        <div className="w-full relative overflow-hidden" style={{ maxWidth: '100%', minWidth: 0 }}>
          {/* Fundo com gradiente premium e efeitos */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-white/40 rounded-2xl"></div>
          
          {/* Container principal */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-indigo-100/50 overflow-hidden flex flex-col"
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.15), 0 10px 25px -5px rgba(79, 70, 229, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
               }}>
            
            {/* Header Premium do Hospital */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 border-b border-indigo-400/30 flex-shrink-0">
              <div className="flex items-center justify-center gap-3">
                {/* Ícone de hospital */}
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                  </svg>
                </div>
                {/* Nome do hospital */}
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide text-center" 
                    style={{ 
                      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}>
                  {UI_TEXT.documentManagementTitle(hospitalName)}
                </h1>
              </div>
              {/* Brilho sutil no header */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 pointer-events-none"></div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-6 space-y-6">
            
            {/* Seção de Upload */}
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-700 tracking-wide">Upload de Documentos</h2>
              </div>
              <FileUpload onFilesSelect={onAddDocuments} />
              
              {/* Lista de Documentos Incorporada */}
              {documents.length > 0 && (
                <div className="w-full mt-4">
                  <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200/60 max-h-32 overflow-y-auto">
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-slate-600 mb-2 text-center">Documentos Adicionados ({documents.length})</h4>
                      <div className="space-y-1">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-white/80 border border-slate-200/40 shadow-sm">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {doc.imagePreviewUrl && (
                                <img
                                  src={doc.imagePreviewUrl}
                                  alt={`Preview ${doc.fileName}`}
                                  className="w-6 h-6 object-cover rounded border border-indigo-200 flex-shrink-0"
                                />
                              )}
                              <span className="text-xs font-mono truncate text-slate-700">{doc.fileName}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-semibold">
                                {doc.status === 'success' && <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">✓</span>}
                                {doc.status === 'error' && <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">✗</span>}
                                {doc.status === 'pending' && <span className="text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">⏳</span>}
                                {doc.status === 'processing' && <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">⚡</span>}
                              </span>
                              <button
                                onClick={() => onRemoveDocument(doc.id)}
                                className="p-1 rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition-colors w-5 h-5 flex items-center justify-center"
                                title="Remover documento"
                                disabled={doc.status === 'processing'}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Divisor elegante */}
            <div className="flex items-center justify-center">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
              <div className="px-3">
                <div className="w-1.5 h-1.5 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full"></div>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
            </div>

            {/* Seção de Palavras Críticas */}
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-700 tracking-wide">Palavras de Busca Críticas</h2>
              </div>
              
              <div className="w-full flex flex-col items-center gap-2">
                <input
                  type="text"
                  className="w-full max-w-sm px-3 py-3 rounded-xl border-2 border-indigo-200/60 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm text-center shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm hover:border-indigo-300 placeholder:text-slate-400"
                  placeholder="Ex: extraviado, devolvido..."
                  value={criticalWords}
                  onChange={e => setCriticalWords(e.target.value)}
                  style={{ 
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)' 
                  }}
                />
                
                <div className="bg-slate-50/80 backdrop-blur-sm rounded-lg p-3 max-w-lg border border-slate-200/60">
                  <p className="text-xs text-slate-600 text-center leading-relaxed">
                    <span className="font-semibold text-slate-700">Sistema automático:</span> <span className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-xs">contaminado, estragado, defeito</span>
                    <br />
                    <span className="text-slate-500 mt-1 block">Adicione palavras personalizadas separadas por vírgula</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Premium com Botões de Ação */}
            <div className="border-t border-indigo-100/60 bg-gradient-to-r from-slate-50/50 via-white/80 to-slate-50/50 px-6 py-3 flex-shrink-0">
              <div className="flex flex-row gap-3 justify-center items-center">
                {/* Botão Voltar */}
                <button
                  onClick={onGoBackToHospitalSelection}
                  className="flex-1 max-w-[140px] px-3 py-2.5 text-sm font-semibold rounded-lg shadow-lg bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 border border-slate-300 hover:border-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all duration-300 ease-in-out flex items-center justify-center gap-1"
                  title="Voltar para seleção de hospital"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Voltar
                </button>

                {/* Botão Processar */}
                <button
                  onClick={onProcessAll}
                  disabled={pendingDocumentsCount === 0}
                  className="flex-1 max-w-[140px] px-3 py-2.5 text-sm font-semibold rounded-lg shadow-xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  title="Processar todos os documentos pendentes"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Processar ({pendingDocumentsCount})
                </button>
              </div>
            </div>
            </div>
          </div>

          {/* Botão de Prosseguir (quando aplicável) - Integrado ao card */}
          {canProceedToCorrection && successfullyProcessedCount > 0 && (
            <div className="border-t border-green-100/60 bg-gradient-to-r from-green-50/50 via-emerald-50/80 to-green-50/50 px-6 py-2 flex-shrink-0">
              <div className="flex justify-center">
                <button
                  onClick={onProceedToCorrection}
                  className="px-6 py-2.5 text-sm font-semibold rounded-lg shadow-xl bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                  title={UI_TEXT.proceedToMaterialCorrectionButton}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {UI_TEXT.proceedToMaterialCorrectionButton} ({successfullyProcessedCount} processado(s))
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};
