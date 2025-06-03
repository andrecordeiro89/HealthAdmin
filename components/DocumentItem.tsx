import React from 'react';
import { ProcessedDocumentEntry } from '../types';
import { UI_TEXT } from '../constants';
import { buttonDanger, buttonSize } from './uiClasses';

interface DocumentItemProps {
  document: ProcessedDocumentEntry;
  onRemove: (docId: string) => void;
}

export const DocumentItem: React.FC<DocumentItemProps> = ({ document, onRemove }) => {
  const statusColor =
    document.status === 'success' ? 'text-green-700' :
    document.status === 'error' ? 'text-red-700' :
    document.status === 'pending' ? 'text-yellow-700' :
    'text-blue-700';
  const statusText =
    document.status === 'success' ? 'Sucesso' :
    document.status === 'error' ? 'Erro' :
    document.status === 'pending' ? 'Pendente' :
    'Processando...';

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow border border-gray-200 mb-2">
      {document.imagePreviewUrl && (
        <img
          src={document.imagePreviewUrl}
          alt={`Preview ${document.fileName}`}
          className="w-12 h-12 object-cover rounded border border-gray-300"
        />
      )}
      <div className="flex-grow overflow-hidden">
        <p className="text-base font-medium text-slate-700 truncate" title={document.fileName}>
          {document.fileName}
        </p>
        <p className={`text-sm font-semibold ${statusColor}`}>{statusText}</p>
        {document.status === 'error' && document.errorMessage && (
          <p className="text-xs text-red-700 truncate" title={document.errorMessage}>
            Detalhe: {document.errorMessage}
          </p>
        )}
      </div>
      {document.status !== 'processing' && (
        <button
          onClick={() => onRemove(document.id)}
          className={buttonDanger + " " + buttonSize}
          aria-label={`Remover ${document.fileName}`}
          title="Remover documento"
        >Remover</button>
      )}
    </div>
  );
};
